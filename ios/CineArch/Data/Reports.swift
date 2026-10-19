import UIKit
import WebKit
import PDFKit
import Supabase
import CineArchKit

// Branded PDF exports (A-List Pro), built on the phone from the person's own
// Slate, Wrap Wallet and union goals:
//   Union Pack  - days on union sets, each job's pay stub attached
//   Tax Pack    - income, expenses by category, GST/HST, every receipt attached
//   Wrap Report - the overview, with all proof attached
// Proof pages show the photo with the lines CineArch read highlighted and
// numbered, next to the figures from the records and whether they match.
// Nothing is guessed: a figure not found on the photo says so.

enum ReportKind: String, CaseIterable, Identifiable {
    case union = "Union Pack", tax = "Tax Pack", overview = "Wrap Report"
    var id: String { rawValue }
    var blurb: String {
        switch self {
        case .union: "For a union application: your days on union sets, each with its pay stub."
        case .tax: "For your accountant: income, expenses by category, GST/HST, every receipt."
        case .overview: "Your year at a glance, with all your proof attached."
        }
    }
    var icon: String {
        switch self {
        case .union: "person.badge.shield.checkmark"
        case .tax: "building.columns"
        case .overview: "doc.richtext"
        }
    }
}

struct ReportInput {
    var name: String
    var role: String
    var place: String
    var jobs: [Job]
    var entries: [LedgerEntry]
    var stats: LedgerStats
    var tax: TaxPicture
    var progress: [TrackProgress]
    var isPreview: Bool
}

/// One proof page block: the photo, what it belongs to, and the marks.
private struct ProofItem {
    let kind: String
    let title: String
    let detail: String
    let image: UIImage?
    let marks: [ProofMark]
}

@MainActor
enum Reports {
    /// Builds the report and returns a PDF file ready to preview and share.
    static func make(_ kind: ReportKind, _ input: ReportInput, progress: @escaping (String) -> Void) async throws -> URL {
        let year = Calendar.current.component(.year, from: Date())
        let y = String(year)
        let jobs = input.jobs.filter { $0.status != "TENTATIVE" && $0.startDate.hasPrefix(y) }
        let unionJobs = jobs.filter(\.isUnion)
        let entries = input.entries.filter { $0.dateIncurred.hasPrefix(y) }

        // Which proof goes in: union jobs' stubs, entries' receipts, or both.
        var wanted: [(String, ProofItemSource)] = []
        switch kind {
        case .union: wanted = unionJobs.compactMap { j in j.proofPath.map { ($0, .job(j)) } }
        case .tax: wanted = entries.compactMap { e in e.proofPath.map { ($0, .entry(e)) } }
        case .overview:
            wanted = entries.compactMap { e in e.proofPath.map { ($0, .entry(e)) } }
            let seen = Set(wanted.map(\.0))
            wanted += jobs.compactMap { j in j.proofPath.flatMap { seen.contains($0) ? nil : ($0, .job(j)) } }
        }
        var proofs: [ProofItem] = []
        for (i, (path, source)) in wanted.enumerated() {
            progress("Reading proof \(i + 1) of \(wanted.count)…")
            // The preview account has no stored photos: it draws a sample one to show the layout.
            let image: UIImage? = if input.isPreview { source.samplePhoto() } else {
                await (try? Backend.client.storage.from("documents").download(path: path)).flatMap { Documents.image(fromProof: $0, path: path) }
            }
            let rows = image.map(Documents.rows) ?? []
            proofs.append(source.item(image: image.map { shrink($0) }, rows: rows))
        }

        progress("Laying out pages…")
        let html = ReportHTML(kind: kind, input: input, year: year, jobs: jobs, unionJobs: unionJobs, entries: entries,
                              proofs: proofs).build()
        progress("Making the PDF…")
        let pdf = try await PDFRenderer.render(html: html.html, pages: html.pages)
        let url = URL.temporaryDirectory.appending(path: "CineArch \(kind.rawValue) \(y).pdf")
        try pdf.write(to: url, options: .atomic)
        return url
    }

    private static func shrink(_ image: UIImage) -> UIImage {
        let scale = min(1, 1200 / max(image.size.width, image.size.height))
        guard scale < 1 else { return image }
        let size = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let f = UIGraphicsImageRendererFormat.default(); f.scale = 1
        return UIGraphicsImageRenderer(size: size, format: f).image { _ in image.draw(in: CGRect(origin: .zero, size: size)) }
    }
}

private enum ProofItemSource {
    case entry(LedgerEntry), job(Job)

    /// A plain drawn receipt or pay stub (preview only), read like a real photo.
    func samplePhoto() -> UIImage {
        let lines: [String] = switch self {
        case .entry(let e) where e.isIncome:
            ["INVOICE", "From: Jordan Ellis", "Date: \(Fmt.day(e.dateIncurred))", "", e.description, "", "TOTAL DUE   \(String(format: "%.2f", e.totalAmount))"]
        case .entry(let e):
            ["SAMPLE STORE", "Toronto, ON", Fmt.day(e.dateIncurred), "", e.description, "SUBTOTAL   \(String(format: "%.2f", e.amountBeforeTax))",
             "HST   \(String(format: "%.2f", e.taxAmount))", "TOTAL   \(String(format: "%.2f", e.totalAmount))"]
        case .job(let j):
            [j.companyName.uppercased(), j.productionName, "PAY STATEMENT", "Work date: \(Fmt.day(j.startDate))"]
                + (j.endDate.map { ["Last day: \(Fmt.day($0))"] } ?? [])
                + ["Total hours   \(j.totalHours.formatted())", "Gross pay   \(String(format: "%.2f", j.grossEarnings ?? 0))"]
        }
        let size = CGSize(width: 900, height: 120 + lines.count * 64)
        let f = UIGraphicsImageRendererFormat.default(); f.scale = 1
        return UIGraphicsImageRenderer(size: size, format: f).image { ctx in
            UIColor(white: 0.99, alpha: 1).setFill(); ctx.fill(CGRect(origin: .zero, size: size))
            let font = UIFont.monospacedSystemFont(ofSize: 34, weight: .regular)
            for (i, l) in lines.enumerated() {
                (l as NSString).draw(at: CGPoint(x: 50, y: 60 + i * 64), withAttributes: [.font: font, .foregroundColor: UIColor.black])
            }
        }
    }

    func item(image: UIImage?, rows: [TextRow]) -> ProofItem {
        switch self {
        case .entry(let e):
            var fields: [ProofField] = []
            if !e.isIncome { fields.append(ProofField("Store", .name, record: nil)) }
            fields.append(ProofField("Date", .date(e.dateIncurred), record: Fmt.day(e.dateIncurred)))
            if e.taxAmount > 0 { fields.append(ProofField("GST/HST", .money(e.taxAmount), record: e.taxAmount.money, keywords: ["GST", "HST", "TPS", "TVH"])) }
            fields.append(ProofField("Total", .money(e.totalAmount), record: e.totalAmount.money, keywords: ["TOTAL", "GROSS", "DUE", "PAY"]))
            return ProofItem(kind: e.isIncome ? "Invoice or pay stub" : "Receipt", title: e.description,
                             detail: "\(Fmt.day(e.dateIncurred)) · \(e.categoryName) · \(e.isIncome ? "+" : "−")\(e.totalAmount.money)",
                             image: image, marks: DocumentReader.annotate(rows, fields))
        case .job(let j):
            var fields = [ProofField("Date", .date(j.startDate), record: Fmt.day(j.startDate))]
            if let end = j.endDate { fields.append(ProofField("Last day", .date(end), record: Fmt.day(end))) }
            if j.totalHours > 0 { fields.append(ProofField("Hours", .number(j.totalHours), record: j.totalHours.formatted(), keywords: ["HOUR", "HRS", "HEURES"])) }
            if let g = j.grossEarnings { fields.append(ProofField("Gross pay", .money(g), record: g.money, keywords: ["GROSS", "BRUT", "TOTAL"])) }
            return ProofItem(kind: "Pay stub", title: j.productionName,
                             detail: "\(Fmt.span(j)) · \(j.role) · \(j.unionName ?? "Non-union") · \(j.workedDays) day\(j.workedDays == 1 ? "" : "s")",
                             image: image, marks: DocumentReader.annotate(rows, fields))
        }
    }
}

enum Fmt {
    static func day(_ iso: String) -> String { Date(isoDay: iso)?.formatted(.dateTime.month(.abbreviated).day().year()) ?? iso }
    static func short(_ iso: String) -> String { Date(isoDay: iso)?.formatted(.dateTime.month(.abbreviated).day()) ?? iso }
    static func span(_ j: Job) -> String { j.endDate.map { "\(short(j.startDate)) – \(short($0))" } ?? short(j.startDate) }
    static func esc(_ s: String) -> String {
        s.replacingOccurrences(of: "&", with: "&amp;").replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;").replacingOccurrences(of: "\"", with: "&quot;")
    }
}

// MARK: - HTML (same design as docs/examples)

private struct ReportHTML {
    let kind: ReportKind
    let input: ReportInput
    let year: Int
    let jobs: [Job]
    let unionJobs: [Job]
    let entries: [LedgerEntry]
    let proofs: [ProofItem]

    private var generated: String { Date().formatted(.dateTime.month(.abbreviated).day().year()) }
    private var period: String { "Jan 1 – \(Date().formatted(.dateTime.month(.abbreviated).day())), \(year)" }

    func build() -> (html: String, pages: Int) {
        var body: [String] = []   // page contents, the first gets the slate header
        switch kind {
        case .union:
            body.append(cardBox() + greenLit(unionJobs.filter(\.isGreenLit).count, unionJobs.count, "union jobs")
                        + "<h2>Days on union sets <span class=\"label\">Each backed by a pay stub</span></h2>")
            body = chunk(rows: unionJobs.map(slateRow), header: slateHead, total: slateTotal(unionJobs, "On union sets"),
                         firstLead: body[0], perPage: 9, perFirstPage: 6, title: "Days on union sets (continued)")
        case .tax:
            body.append(money() + greenLit(entries.filter(\.isGreenLit).count, entries.count, "entries") + gstSetAside()
                        + "<h2>Expenses by category</h2>" + categories())
            body += chunk(rows: entries.map(walletRow), header: walletHead, total: "", firstLead: "<h2>Every entry <span class=\"label\">Income and expenses</span></h2>",
                          perPage: 16, perFirstPage: 16, title: "Every entry (continued)")
            if let last = body.indices.last { body[last] += missing() }
        case .overview:
            body.append(money() + greenLit(entries.filter(\.isGreenLit).count, entries.count, "entries") + gstSetAside() + cardBox())
            body += chunk(rows: jobs.map(slateRow), header: slateHead, total: slateTotal(jobs, "Worked"),
                          firstLead: "<h2>Your Slate <span class=\"label\">Worked, \(year)</span></h2>", perPage: 10, perFirstPage: 10, title: "Your Slate (continued)")
            body += chunk(rows: entries.map(walletRow), header: walletHead, total: "", firstLead: "<h2>Wrap Wallet <span class=\"label\">Every entry, with its proof</span></h2>",
                          perPage: 16, perFirstPage: 16, title: "Wrap Wallet (continued)")
        }
        if input.isPreview {
            body[body.count - 1] += "<p class=\"note\">Preview: the photos at the back are drawn samples. A real account's export attaches each receipt and pay stub you've added.</p>"
        }
        let proofPages = (proofs.count + 1) / 2
        let total = body.count + proofPages
        var html = head()
        for (i, content) in body.enumerated() {
            html += "<section class=\"page\">\(i == 0 ? slate() : runningHead())\(content)\(footer(i + 1, total))</section>"
        }
        for p in 0..<proofPages {
            let pair = proofs[(p * 2)..<min(proofs.count, p * 2 + 2)]
            let intro = p == 0 ? "<h2>The proof <span class=\"label\">Photos attached, annotated</span></h2>" : ""
            let blocks = pair.enumerated().map { proofBlock(p * 2 + $0.offset + 1, proofs.count, $0.element) }.joined()
            html += "<section class=\"page\">\(runningHead())\(intro)\(blocks)\(footer(body.count + p + 1, total))</section>"
        }
        return (html + "</body></html>", total)
    }

    /// Splits a long table over pages.
    private func chunk(rows: [String], header: String, total: String, firstLead: String, perPage: Int, perFirstPage: Int, title: String) -> [String] {
        var pages: [String] = []
        var rest = rows[...]
        var first = true
        repeat {
            let n = first ? perFirstPage : perPage
            let part = rest.prefix(n); rest = rest.dropFirst(n)
            let lead = first ? firstLead : "<h2>\(Fmt.esc(title))</h2>"
            let empty = rows.isEmpty ? "<tr><td colspan=\"8\" class=\"muted\">Nothing logged this year yet.</td></tr>" : ""
            pages.append(lead + "<table>\(header)\(part.joined())\(empty)\(rest.isEmpty ? total : "")</table>")
            first = false
        } while !rest.isEmpty
        return pages
    }

    // Pieces

    private func slate() -> String {
        let grid: [(String, String)] = switch kind {
        case .union: [("Role", input.role), ("Based in", input.place), ("Applying to", input.progress.map(\.track.unionName).joined(separator: ", ").ifEmpty("—")), ("Period", period)]
        case .tax: [("Business", "Self-employed, film work"), ("Based in", input.place), ("GST/HST line", input.stats.grossIncome >= 30_000 ? "Past $30,000" : "Under $30,000"), ("Period", period)]
        case .overview: [("Role", input.role), ("Based in", input.place), ("Working toward", input.progress.map(\.track.unionName).joined(separator: ", ").ifEmpty("—")), ("Period", period)]
        }
        let subtitle = switch kind {
        case .union: "\(input.name) · Union Pack"
        case .tax: "\(input.name) · Tax year \(year)"
        case .overview: "\(input.name) · \(year) so far"
        }
        let cells = grid.map { "<div><span class=\"label\">\($0.0)</span><p>\(Fmt.esc($0.1))</p></div>" }.joined()
        return """
        <div class="slate"><div class="stripes"></div><div class="slate-top"><span class="wordmark">CINEARCH</span>
        <span>\(input.isPreview ? "<span class=\"tagsample\">PREVIEW · SAMPLE DATA</span> " : "")<span class="label" style="color:#9a9a9a">\(kind.rawValue)</span></span></div>
        <h1>\(Fmt.esc(subtitle))</h1><div class="slate-grid">\(cells)</div></div>
        """
    }

    private func runningHead() -> String {
        """
        <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1.5px solid var(--ink);padding-bottom:8px">
        <span class="wordmark" style="color:var(--ink)">CINEARCH</span><span class="label">\(kind.rawValue) · \(Fmt.esc(input.name)) · \(year)</span></div>
        """
    }

    private func footer(_ n: Int, _ total: Int) -> String {
        "<footer><span class=\"mark\">CINEARCH</span><span>Generated \(generated) with CineArch from \(Fmt.esc(input.name))'s own records\(kind == .union ? "." : "; estimates are not tax advice.")</span><span>Page \(n) of \(total)</span></footer>"
    }

    private func money() -> String {
        let s = input.stats
        let incomeCount = entries.filter(\.isIncome).count
        return """
        <h2>The money <span class="label">From the Wrap Wallet</span></h2><div class="figures">
        <div><span class="label">Income</span><div class="big num">\(s.grossIncome.money)</div><span class="muted">\(incomeCount) entr\(incomeCount == 1 ? "y" : "ies")</span></div>
        <div><span class="label">Expenses</span><div class="big num">\(s.totalExpenses.money)</div><span class="muted">\(s.deductibleExpenses.money) deductible</span></div>
        <div class="net"><span class="label">Net (after deductions)</span><div class="big num">\(s.netIncome.money)</div><span style="color:#9a9a9a">Income less deductible expenses</span></div></div>
        """
    }

    private func greenLit(_ lit: Int, _ total: Int, _ what: String) -> String {
        guard total > 0 else { return "" }
        let need = total - lit
        return """
        <div class="greenlit"><div class="seal">✓</div><div style="flex:1"><span class="label">Green Lit</span>
        <div><b>\(lit) of \(total)</b> \(what) backed with proof\(lit > 0 ? ", attached at the back" : "")</div></div>
        \(need > 0 ? "<div class=\"need\">\(need) need proof</div>" : "<div class=\"lit\">All backed</div>")</div>
        """
    }

    private func gstSetAside() -> String {
        let s = input.stats, t = input.tax
        let pct = min(100, s.selfEmployedIncome / Ledger.smallSupplierThreshold * 100)
        let left = max(0, Ledger.smallSupplierThreshold - s.selfEmployedIncome)
        let gstRows = t.quick.map { q in """
        <div class="row"><span>Sales with GST/HST</span><span class="num">\(t.salesWithTax.money)</span></div>
        <div class="row"><span>Quick Method, \((q.quickServiceRate * 100).formatted(.number.precision(.fractionLength(1))))% less 1% of $30,000</span><span class="num">\(t.gstOwing.money)</span></div>
        """ } ?? """
        <div class="row"><span>Collected</span><span class="num">\(s.gstCollected.money)</span></div>
        <div class="row"><span>Paid on expenses (meals at half)</span><span class="num">\(s.gstPaid.money)</span></div>
        <div class="row"><span>\(t.gstOwing >= 0 ? "Owing" : "Refund")</span><span class="num">\(abs(t.gstOwing).money)</span></div>
        """
        let setAside: String
        if t.payType == .t4 {
            setAside = "<p class=\"note\">Tax and CPP come off T4 pay, so there's nothing extra to set aside on it.</p>"
        } else if let a = t.setAside, let p = t.province {
            setAside = """
            <div class="row"><span>\(a.pensionPlan) (both halves)</span><span class="num">\(a.pension.money)</span></div>
            <div class="row"><span>Income tax</span><span class="num">\(a.incomeTax.money)</span></div>
            <div class="row"><b>Total to set aside</b><b class="num">\(a.total.money)</b></div>
            <p class="note">\(String(a.year)) federal and \(Fmt.esc(p)) rates, after the basic personal amount\(s.employmentIncome > 0 ? ", on top of T4 pay" : ""). Rough estimates, not tax advice: other credits and deductions aren't included. Check with an accountant.</p>
            """
        } else {
            setAside = "<p class=\"note\">Add where you're based to estimate tax.</p>"
        }
        return """
        <div class="two" style="margin-top:18px"><div><h2 style="margin-top:0">GST/HST</h2><div class="box">
        \(gstRows)
        <div class="row"><span>Small-supplier line</span><span class="num">\(Ledger.smallSupplierThreshold.money)</span></div>
        <div class="bar signal"><span style="width:\(String(format: "%.1f", pct))%"></span></div>
        <span class="muted">\(left > 0 ? "\(left.money) until you must register" : "Past the line: you need a GST/HST number")</span></div></div>
        <div><h2 style="margin-top:0">Set aside <span class="label">Estimates</span></h2><div class="box">
        \(setAside)</div></div></div>
        """
    }

    private func cardBox() -> String {
        guard !input.progress.isEmpty else { return "" }
        let rows = input.progress.map { p in
            let t = p.track
            return """
            <div class="row" style="border:0"><span><b>\(Fmt.esc(t.unionName))</b> · \(Fmt.esc(t.tierLabel))</span>
            <span class="num"><b>\(t.format(p.current))</b> of \(t.format(t.targetValue)) \(t.unit)\(p.remaining > 0 ? " · \(t.format(p.remaining)) to go" : p.productionsShort ? " · more productions needed" : " · ready to apply")</span></div>
            <div class="bar"><span style="width:\(String(format: "%.1f", p.fraction * 100))%"></span></div>
            <span class="muted">\(p.jobs) job\(p.jobs == 1 ? "" : "s") logged in CineArch\(t.startingValue > 0 ? " + \(t.format(t.startingValue)) banked before" : "")\(p.windowMonths.map { ", counted over the last \($0) months" } ?? "")\(p.minProductions.map { ", \(p.productions) of \($0) productions" } ?? "")\(p.isConfirmed ? "" : ". Target not confirmed by the union").</span>
            """
        }.joined(separator: "<div style=\"height:10px\"></div>")
        return "<h2>Getting your card <span class=\"label\">Days on union sets</span></h2><div class=\"box\">\(rows)</div>"
    }

    private var slateHead: String { "<tr><th>Dates</th><th>Production</th><th>Role</th><th>Set</th><th class=\"r\">Days</th><th class=\"r\">Hours</th><th class=\"r\">Gross</th><th>Proof</th></tr>" }

    private func slateRow(_ j: Job) -> String {
        let set = j.unionName.map { "<span class=\"tag u\">\(Fmt.esc($0))</span>" } ?? "<span class=\"tag\">Non-union</span>"
        return """
        <tr><td class="num">\(Fmt.span(j))</td><td>\(Fmt.esc(j.productionName))<br><span class="muted">\(Fmt.esc(j.companyName))</span></td>
        <td>\(Fmt.esc(j.role))</td><td>\(set)</td><td class="r num">\(j.workedDays)</td><td class="r num">\(j.totalHours.formatted())</td>
        <td class="r num">\((j.grossEarnings ?? 0).money)</td><td>\(j.isGreenLit ? "<span class=\"lit\">✓ Pay stub</span>" : "<span class=\"need\">Needs proof</span>")</td></tr>
        """
    }

    private func slateTotal(_ list: [Job], _ label: String) -> String {
        """
        <tr class="total"><td colspan="4">\(label)</td><td class="r num">\(list.reduce(0) { $0 + $1.workedDays })</td>
        <td class="r num">\(list.reduce(0) { $0 + $1.totalHours }.formatted())</td><td class="r num">\(list.reduce(0) { $0 + ($1.grossEarnings ?? 0) }.money)</td><td></td></tr>
        """
    }

    private var walletHead: String { "<tr><th>Date</th><th>What</th><th>Category</th><th class=\"r\">Before tax</th><th class=\"r\">GST/HST</th><th class=\"r\">Total</th><th>Proof</th></tr>" }

    private func walletRow(_ e: LedgerEntry) -> String {
        """
        <tr><td class="num">\(Fmt.short(e.dateIncurred))</td><td>\(Fmt.esc(e.description))</td><td>\(Fmt.esc(e.categoryName))</td>
        <td class="r num">\(e.amountBeforeTax.money)</td><td class="r num">\(e.taxAmount > 0 ? e.taxAmount.money : "—")</td>
        <td class="r num">\(e.isIncome ? "+" : "−")\(e.totalAmount.money)</td><td>\(e.isGreenLit ? "<span class=\"lit\">✓ Green Lit</span>" : "<span class=\"need\">Needs proof</span>")</td></tr>
        """
    }

    private func categories() -> String {
        var cats: [String: (Double, Double, Double)] = [:]
        for e in entries where !e.isIncome {
            let c = cats[e.categoryName] ?? (0, 0, 0)
            cats[e.categoryName] = (c.0 + e.amountBeforeTax, c.1 + e.taxAmount, c.2 + (e.deductibleAmount ?? e.amountBeforeTax))
        }
        let rows = cats.sorted { $0.key < $1.key }.map { "<tr><td>\(Fmt.esc($0.key))</td><td class=\"r num\">\($0.value.0.money)</td><td class=\"r num\">\($0.value.1.money)</td><td class=\"r num\">\($0.value.2.money)</td></tr>" }.joined()
        let t = cats.values.reduce((0.0, 0.0, 0.0)) { ($0.0 + $1.0, $0.1 + $1.1, $0.2 + $1.2) }
        return """
        <table><tr><th>Category</th><th class="r">Before tax</th><th class="r">GST/HST paid</th><th class="r">Deductible</th></tr>\(rows.isEmpty ? "<tr><td colspan=\"4\" class=\"muted\">No expenses this year yet.</td></tr>" : rows)
        <tr class="total"><td>Total</td><td class="r num">\(t.0.money)</td><td class="r num">\(t.1.money)</td><td class="r num">\(t.2.money)</td></tr></table>
        <p class="note">Meals and entertainment are 50% deductible; fines and penalties aren't.</p>
        """
    }

    private func missing() -> String {
        let list = entries.filter { !$0.isGreenLit }
        guard !list.isEmpty else { return "" }
        let items = list.prefix(12).map { "<li>\(Fmt.short($0.dateIncurred)) · \(Fmt.esc($0.description)) · \($0.totalAmount.money)</li>" }.joined()
        return """
        <div class="missing"><span class="label" style="color:#a16207">Still needs proof (\(list.count))</span><ul style="margin:6px 0 0 16px">\(items)</ul>
        <p class="note">Add a receipt to each in CineArch and export again to include it.</p></div>
        """
    }

    private func proofBlock(_ i: Int, _ of: Int, _ p: ProofItem) -> String {
        var photo = "<div class=\"photo-missing\">Couldn't open this file to show it here.</div>"
        if let img = p.image, let jpeg = img.jpegData(compressionQuality: 0.7) {
            let marks = p.marks.compactMap { m -> String? in
                guard let r = m.row else { return nil }
                let left = r.minX * 100, top = (1 - r.maxY) * 100, w = (r.maxX - r.minX) * 100, h = (r.maxY - r.minY) * 100
                return "<div class=\"hl\" style=\"left:\(f(left - 1))%;top:\(f(top - 0.6))%;width:\(f(w + 2))%;height:\(f(h + 1.2))%\"><span class=\"pin\">\(m.number)</span></div>"
            }.joined()
            // Fit inside the 3.15 × 3.85 in frame, tall or wide.
            let ratio = img.size.width / max(1, img.size.height)
            let (w, h) = ratio > 3.15 / 3.85 ? (3.15, 3.15 / ratio) : (3.85 * ratio, 3.85)
            photo = "<div class=\"shot\" style=\"width:\(f(w))in;height:\(f(h))in\"><img src=\"data:image/jpeg;base64,\(jpeg.base64EncodedString())\">\(marks)</div>"
        }
        let rows = p.marks.map { m in
            let status = m.onPhoto == nil ? "<td class=\"need\">Not found</td>"
                : m.record == nil ? "<td class=\"muted\">Noted</td>"
                : m.matches ? "<td class=\"ok\">✓</td>" : "<td class=\"need\">Check</td>"
            return "<tr><td><span class=\"pin\">\(m.number)</span></td><td>\(m.label)</td><td>\(Fmt.esc(m.onPhoto ?? "—"))</td><td>\(Fmt.esc(m.record ?? "Not in the entry"))</td>\(status)</tr>"
        }.joined()
        return """
        <div class="proof"><div class="photo-wrap">\(photo)<span class="cap">Photo · \(p.kind)</span></div>
        <div class="panel"><span class="label">Proof \(i) of \(of) · \(p.kind)</span><h3>\(Fmt.esc(p.title))</h3><div class="muted">\(Fmt.esc(p.detail))</div>
        <span class="status">✓ GREEN LIT</span>
        <table class="read"><tr><th></th><th>Read</th><th>On the photo</th><th>Your records</th><th></th></tr>\(rows)</table>
        <p class="note">Highlighted on the photo where it was read. ✓ means the figure on the photo matches your records; "Not found" means CineArch couldn't find it on the photo.</p></div></div>
        """
    }

    private func f(_ v: Double) -> String { String(format: "%.2f", v) }

    private func head() -> String {
        "<!doctype html><html lang=\"en-CA\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=816\">"
            + "<link href=\"https://fonts.googleapis.com/css2?family=Spline+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap\" rel=\"stylesheet\">"
            + "<style>\(ReportStyle.css)</style></head><body>"
    }
}

private extension String {
    func ifEmpty(_ s: String) -> String { isEmpty ? s : self }
}

// MARK: - PDF

/// Renders the HTML in an off-screen web view, one US Letter page (816 × 1056 CSS px) at a time.
@MainActor
enum PDFRenderer {
    static let pageSize = CGSize(width: 816, height: 1056)

    static func render(html: String, pages: Int) async throws -> Data {
        let web = WKWebView(frame: CGRect(origin: .zero, size: CGSize(width: pageSize.width, height: pageSize.height * CGFloat(pages))))
        let loader = Loader()
        web.navigationDelegate = loader
        // Some WebKit work only happens in a window; keep it there but invisible.
        let host = UIApplication.shared.connectedScenes.compactMap { ($0 as? UIWindowScene)?.keyWindow }.first
        web.alpha = 0.01
        host?.addSubview(web)
        defer { web.removeFromSuperview() }
        await withCheckedContinuation { c in
            loader.done = { c.resume() }
            web.loadHTMLString(html, baseURL: URL(string: "https://cine-arch.vercel.app"))
        }
        try? await Task.sleep(for: .seconds(1.2))      // web fonts
        let doc = PDFDocument()
        for i in 0..<pages {
            let cfg = WKPDFConfiguration()
            cfg.rect = CGRect(x: 0, y: CGFloat(i) * pageSize.height, width: pageSize.width, height: pageSize.height)
            let data = try await web.pdf(configuration: cfg)
            if let page = PDFDocument(data: data)?.page(at: 0) { doc.insert(page, at: doc.pageCount) }
        }
        guard let data = doc.dataRepresentation() else { throw CocoaError(.fileWriteUnknown) }
        return data
    }

    private final class Loader: NSObject, WKNavigationDelegate {
        var done: (() -> Void)?
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { done?(); done = nil }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { done?(); done = nil }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { done?(); done = nil }
    }
}
