import SwiftUI
import Supabase
import QuickLook
import CineArchKit

// Wrap Wallet, the business side: income and expenses this year, each backed with
// proof (Green Lit), GST/HST and what to set aside. Same rows as the website's Wrap Wallet.
// A-List Pro; free accounts see their total from the Slate and what Pro adds.
struct LedgerView: View {
    @Environment(Session.self) private var session
    @Environment(LedgerStore.self) private var ledger
    @State private var showAuth = false
    @State private var reportsLeft: Int?
    @State private var showNew = false
    @State private var showPlans = false
    @State private var showBulk = false
    @State private var making: String?           // progress while a report is made
    @State private var reportURL: URL?
    @Environment(JobsStore.self) private var jobs
    @Environment(TrackingStore.self) private var tracking
    @Environment(EngineStore.self) private var store
    @State private var page = Page.entries
    @State private var filter = Filter.all
    @State private var proofFor: LedgerEntry?
    @State private var justAdded: LedgerEntry?

    enum Page: String, CaseIterable { case entries = "Entries", tax = "Tax" }
    enum Filter: String, CaseIterable { case all = "All", income = "Income", expenses = "Expenses", needsProof = "Needs proof" }

    var body: some View {
        NavigationStack {
            Group {
                if session.isSignedIn && !session.isPremium { FreeWallet() }
                else if session.isSignedIn { content } else {
                    LookAroundWallet { showAuth = true }
                }
            }
            .navigationTitle("Wrap Wallet")
            .task(id: session.identity) { await loadReportUsage() }
            .previewBadge()
            .toolbar {
                if session.isSignedIn && session.isPremium {
                    ToolbarItem(placement: .topBarTrailing) {
                        Menu {
                            Section(reportsLeft.map { "\($0) of 3 reports left this month" } ?? "Reports") {
                                ForEach(ReportKind.allCases) { kind in
                                    Button { Task { await makeReport(kind) } } label: { Label(kind.rawValue + " (PDF)", systemImage: kind.icon) }
                                        .disabled(reportsLeft == 0)
                                }
                            }
                            ShareLink(item: csvFile(), preview: SharePreview("Wrap Wallet spreadsheet")) {
                                Label("Spreadsheet (CSV)", systemImage: "tablecells")
                            }
                            .disabled(ledger.yearEntries.isEmpty)
                        } label: { Image(systemName: "square.and.arrow.up") }
                        .accessibilityLabel("Export a report or spreadsheet")
                        .disabled(making != nil)
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        Menu {
                            Button { showNew = true } label: { Label("Add one", systemImage: "plus") }
                            Button { showBulk = true } label: { Label("Receipts in bulk", systemImage: "square.stack.3d.up") }
                        } label: { Image(systemName: "plus") }
                        .accessibilityLabel("Add income or expenses")
                    }
                } else if session.isSignedIn {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button { showPlans = true } label: { Image(systemName: "lock") }.accessibilityLabel("Adding entries is A-List Pro")
                    }
                }
            }
            .navigationDestination(isPresented: $showPlans) { PlansView() }
            .sheet(isPresented: $showAuth) { AuthSheet(reason: "Sign in or create an account to see your Wrap Wallet: income, expenses, GST/HST and proof.") {} }
            .sheet(isPresented: $showNew, onDismiss: { if let e = justAdded { justAdded = nil; proofFor = e } }) {
                LedgerEntrySheet { justAdded = $0 }
            }
            .sheet(item: $proofFor) { ProofSheet(entry: $0) }
            .sheet(isPresented: $showBulk) { BulkReceiptsView() }
            .quickLookPreview($reportURL)
            .overlay {
                if let making {
                    VStack(spacing: 12) { ProgressView(); Text(making).font(Theme.sans(.subheadline)) }
                        .padding(24).background(.regularMaterial)
                }
            }
            .task(id: session.identity) {
                if session.isPreview { ledger.usePreview() }
                else if session.isSignedIn && session.isPremium { await ledger.load() } else { ledger.clear() }
                // `-cinearch.report tax|union|overview` makes that report on launch (for checking the layout).
                if session.isPremium, let k = UserDefaults.standard.string(forKey: "cinearch.report"),
                   let kind = ReportKind.allCases.first(where: { $0.rawValue.lowercased().hasPrefix(k) || (k == "overview" && $0 == .overview) }) {
                    await makeReport(kind)
                }
            }
        }
    }

    private var shown: [LedgerEntry] {
        switch filter {
        case .all: ledger.entries
        case .income: ledger.entries.filter(\.isIncome)
        case .expenses: ledger.entries.filter { !$0.isIncome }
        case .needsProof: ledger.entries.filter { !$0.isGreenLit }
        }
    }

    private var content: some View {
        let s = ledger.stats
        let year = Calendar.current.component(.year, from: Date())
        return List {
            Section {
                Picker("Show", selection: $page) { ForEach(Page.allCases, id: \.self) { Text($0.rawValue) } }
                    .pickerStyle(.segmented)
                HStack {
                    stat("Income", s.grossIncome.money)
                    stat("Expenses", s.totalExpenses.money)
                    stat("Net", s.netIncome.money, highlight: true)
                }
            } header: {
                Text("\(String(year)) so far")
            }

            switch page {
            case .entries: entries
            case .tax: tax(s)
            }
            if let e = ledger.error { Section { Text(e).foregroundStyle(.red) } }
        }
        .refreshable { await ledger.load() }
        .overlay { if ledger.isLoading && ledger.entries.isEmpty { ProgressView() } }
    }

    @ViewBuilder private var entries: some View {
        if !ledger.entries.isEmpty {
            Section { GreenLitNotice(entries: ledger.entries) { filter = .needsProof } }
        }
        Section {
            Picker("Filter", selection: $filter) { ForEach(Filter.allCases, id: \.self) { Text($0.rawValue) } }
                .pickerStyle(.segmented)
            if shown.isEmpty && !ledger.isLoading {
                Text(ledger.entries.isEmpty ? "Nothing in the can yet. Tap + to add income or an expense."
                     : filter == .needsProof ? "Every entry is backed with proof." : "Nothing here.")
                    .foregroundStyle(.secondary)
            }
            ForEach(shown) { e in
                Button { proofFor = e } label: { LedgerRow(entry: e) }.buttonStyle(.plain)
            }
            .onDelete { idx in
                let doomed = idx.map { shown[$0] }
                Task { for e in doomed { await ledger.delete(e) } }
            }
        } footer: { Group {
            Text("Tap an entry to back it with proof. Swipe left to delete.")
        }.font(Theme.sans(.footnote)) }
    }

    private func taxPicture(_ s: LedgerStats) -> TaxPicture {
        TaxPicture(stats: s, payType: session.payType, province: session.taxProvince, gstMethod: session.gstMethod, tables: store.engine.snapshot.tax)
    }

    @ViewBuilder private func tax(_ s: LedgerStats) -> some View {
        let t = taxPicture(s)
        Section {
            if !session.isPreview { GSTMethodPicker() }
            if let q = t.quick {
                LabeledContent("Sales with GST/HST", value: t.salesWithTax.money)
                LabeledContent("Quick Method rate", value: "\((q.quickServiceRate * 100).formatted(.number.precision(.fractionLength(1))))%")
                LabeledContent("Owing", value: t.gstOwing.money)
            } else {
                LabeledContent("GST/HST collected", value: s.gstCollected.money)
                LabeledContent("GST/HST paid back", value: s.gstPaid.money)
                LabeledContent(t.gstOwing >= 0 ? "Owing" : "Refund", value: abs(t.gstOwing).money)
            }
            VStack(alignment: .leading, spacing: 6) {
                SquareProgress(value: s.gstThresholdFraction, color: s.gstThresholdFraction >= 1 ? .red : Theme.accent)
                Text(s.gstThresholdFraction >= 1
                     ? "You're past $30,000 this year. You need a GST/HST number."
                     : "\((Ledger.smallSupplierThreshold - s.selfEmployedIncome).money) until you must register for GST/HST ($30,000).")
                    .font(Theme.sans(.caption)).foregroundStyle(.secondary)
            }
            .padding(.vertical, 2)
        } header: {
            HintedHeader(title: "GST/HST", hint: "Sales tax you charged on your work, less what you paid on work expenses. Past $30,000 of sales in a year you must register with the CRA.")
        } footer: { Group {
            if t.quick != nil {
                Text("Quick Method: a set share of your sales (tax included), less 1% of the first $30,000. You don't claim back GST/HST on expenses. Meals count half.")
            } else {
                Text("Only half the GST/HST on meals can be claimed back.")
            }
        }.font(Theme.sans(.footnote)) }
        Section {
            if t.payType == nil, !session.isPreview { PayTypePicker() }
            if t.payType == .t4 {
                Text("Tax and CPP come off your T4 pay, so there's nothing extra to set aside on it.").foregroundStyle(.secondary)
            } else if let a = t.setAside {
                LabeledContent("\(a.pensionPlan) (both halves)", value: a.pension.money)
                LabeledContent("Income tax", value: a.incomeTax.money)
                LabeledContent("Total to set aside", value: a.total.money).bold()
            } else {
                Text("Add where you're based in Setting the Scene to estimate tax.").foregroundStyle(.secondary)
            }
        } header: {
            HintedHeader(title: "Set aside", hint: "What to put away from self-employed pay for CPP (or QPP) and income tax, worked out from this year's federal and provincial rates. T4 pay has it taken off already.")
        } footer: { Group {
            if let a = t.setAside, let p = t.province {
                Text("\(String(a.year)) federal and \(p) rates, after the basic personal amount\(s.employmentIncome > 0 ? ", on top of your T4 pay" : "")\(p == "Ontario" ? ", with Ontario's health premium" : ""). Rough estimate: other credits and deductions aren't included. Check with an accountant.")
            }
        }.font(Theme.sans(.footnote)) }
    }

    private func loadReportUsage() async {
        guard session.isPremium, !session.isPreview, session.user != nil else { reportsLeft = nil; return }
        struct Usage: Decodable { let used: Int; let report_limit: Int }
        let u: [Usage]? = try? await Backend.client.rpc("my_report_usage").execute().value
        reportsLeft = u?.first.map { max(0, $0.report_limit - $0.used) }
    }

    /// Builds a branded PDF on the phone, then opens it to look over, share or print.
    private func makeReport(_ kind: ReportKind) async {
        await jobs.use(session.place)
        await tracking.use(session.place)
        let p = session.profile
        let input = ReportInput(
            name: session.isPreview ? Sample.name : (p?.name ?? session.displayEmail ?? "You"),
            role: p?.selectedRoles?.first ?? jobs.jobs.first?.role ?? "Film crew",
            place: session.isPreview ? "Toronto, Ontario" : [p?.province].compactMap { $0 }.joined().ifBlank("Canada"),
            jobs: jobs.jobs, entries: ledger.yearEntries, stats: ledger.stats, tax: taxPicture(ledger.stats),
            progress: tracking.tracks.map { TrackProgress(track: $0, jobs: jobs.jobs, engine: store.engine) },
            isPreview: session.isPreview)
        making = "Starting your \(kind.rawValue)…"
        defer { making = nil }
        // A-List Pro makes up to 3 reports a month (the sample account doesn't count).
        if !session.isPreview {
            do {
                reportsLeft = try await Backend.client.rpc("start_report", params: ["p_kind": kind.code]).execute().value
            } catch {
                let text = "\(error)"
                ledger.error = text.contains("REPORT_LIMIT") ? "You've made 3 reports this month. You can make more on the 1st." : "Couldn't start the report: \(error.localizedDescription)"
                return
            }
        }
        do {
            reportURL = try await Reports.make(kind, input) { step in making = step }
        } catch {
            ledger.error = "Couldn't make the \(kind.rawValue): \(error.localizedDescription)"
        }
    }

    private func csvFile() -> URL {
        let url = URL.temporaryDirectory.appending(path: "CineArch Wrap Wallet.csv")
        try? ledger.csv().write(to: url, atomically: true, encoding: .utf8)
        return url
    }

    private func stat(_ label: String, _ value: String, highlight: Bool = false) -> some View {
        VStack(spacing: 2) {
            Text(value).font(Theme.serif(.title3)).monospacedDigit().lineLimit(1).minimumScaleFactor(0.5)
                .foregroundStyle(highlight ? Theme.accent : .primary)
            Text(label).font(Theme.sans(.caption)).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

/// The note at the top of the Wallet: how many entries are Green Lit (backed with proof).
private extension String {
    func ifBlank(_ s: String) -> String { trimmingCharacters(in: .whitespaces).isEmpty ? s : self }
}

struct GreenLitNotice: View {
    let entries: [LedgerEntry]
    var showMissing: () -> Void

    var body: some View {
        let lit = entries.filter(\.isGreenLit).count
        let missing = entries.count - lit
        HStack(spacing: 12) {
            Image(systemName: missing == 0 ? "checkmark.seal.fill" : "seal")
                .font(Theme.sans(.title2)).foregroundStyle(missing == 0 ? Color.green : .secondary)
            VStack(alignment: .leading, spacing: 2) {
                Text("GREEN LIT").font(Theme.sans(.caption).weight(.heavy)).tracking(1.5).foregroundStyle(Color.green)
                Text("\(lit) of \(entries.count) backed with proof").font(Theme.sans(.subheadline))
            }
            Spacer()
            if missing > 0 {
                Button("\(missing) need proof", action: showMissing)
                    .font(Theme.sans(.caption).bold()).buttonStyle(.bordered).tint(Theme.accent)
            }
        }
        .accessibilityElement(children: .combine)
    }
}

struct LedgerRow: View {
    let entry: LedgerEntry
    var body: some View {
        HStack {
            Image(systemName: entry.isGreenLit ? "checkmark.square.fill" : "square.dashed")
                .foregroundStyle(entry.isGreenLit ? Color.green : .secondary)
                .accessibilityLabel(entry.isGreenLit ? "Green Lit" : "Needs proof")
            VStack(alignment: .leading, spacing: 3) {
                Text(entry.description).font(Theme.sans(.headline)).lineLimit(1)
                HStack(spacing: 6) {
                    Text(entry.categoryName)
                    Text("·")
                    Text(Date(isoDay: entry.dateIncurred)?.formatted(date: .abbreviated, time: .omitted) ?? entry.dateIncurred)
                    if entry.ruleTags?.contains("MEALS_50_LIMIT") == true, !entry.categoryName.contains("50%") { Text("· 50% rule").foregroundStyle(Theme.accent) }
                }
                .font(Theme.sans(.caption)).foregroundStyle(.secondary)
            }
            Spacer()
            Text((entry.isIncome ? "+" : "−") + entry.totalAmount.money)
                .monospacedDigit()
                .foregroundStyle(entry.isIncome ? Theme.accent : .primary)
        }
        .contentShape(Rectangle())
    }
}

struct LedgerEntrySheet: View {
    @Environment(LedgerStore.self) private var ledger
    @Environment(JobsStore.self) private var jobs
    @Environment(\.dismiss) private var dismiss
    /// Called with the saved entry, so the Wallet can ask for its proof next.
    var onSaved: (LedgerEntry) -> Void = { _ in }

    @State private var isIncome = false
    @State private var category = "MEALS_ENTERTAINMENT"
    @State private var amountText = ""
    @State private var taxText = ""
    @State private var description = ""
    @State private var date = Date()
    @State private var jobId: UUID?
    @State private var proof: UploadFile?        // the receipt read to fill this in; attached on save
    @State private var reading = false
    @State private var readNote: String?
    @State private var saving = false
    @State private var error: String?

    private var amount: Double? { Double(amountText.replacingOccurrences(of: ",", with: ".")) }
    private var categories: [(String, String)] { isIncome ? Ledger.incomeCategories : Ledger.expenseCategories }

    var body: some View {
        NavigationStack {
            List {
                Picker("Type", selection: $isIncome) {
                    Text("Expense").tag(false)
                    Text("Income").tag(true)
                }
                .pickerStyle(.segmented)
                .listRowBackground(Color.clear)

                Section {
                    if let proof {
                        Label(proof.ext == "pdf" ? "Receipt scanned · attached as proof" : "Receipt photo · attached as proof", systemImage: "checkmark.seal.fill")
                            .foregroundStyle(Color.green)
                    }
                    if reading { HStack { ProgressView(); Text("Reading it…").foregroundStyle(.secondary) } }
                    DocumentPicker(scanLabel: proof == nil ? "Scan with camera" : "Scan again") { files in
                        Task { await read(files[0]) }
                    } failed: { error = $0 }
                } header: {
                    Text(isIncome ? "Fill it in from an invoice or pay stub" : "Fill it in from a receipt")
                } footer: { Group {
                    Text(readNote ?? "CineArch reads the store, total, GST/HST and date on your phone, and keeps the file as proof (Green Lit).")
                }.font(Theme.sans(.footnote)) }

                if isIncome && !jobs.jobs.isEmpty {
                    Section {
                        Picker("From a job", selection: $jobId) {
                            Text("None").tag(UUID?.none)
                            ForEach(jobs.jobs.prefix(30)) { j in Text("\(j.productionName) · \(j.startDate)").tag(j.id) }
                        }
                    } footer: { Group {
                        Text("Fills in the pay from a job you logged.")
                    }.font(Theme.sans(.footnote)) }
                }

                Section {
                    TextField("What was it?", text: $description).textInputAutocapitalization(.sentences)
                    Picker("Category", selection: $category) {
                        ForEach(categories, id: \.0) { Text($0.1).tag($0.0) }
                    }
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                }

                Section {
                    money("Amount before tax", $amountText, placeholder: "0.00")
                    money("GST/HST", $taxText, placeholder: amount.map { String(format: "%.2f", $0 * Ledger.gstRate) } ?? "0.00")
                } footer: { Group {
                    if !isIncome && category == "MEALS_ENTERTAINMENT" {
                        Text("Only half of meals and entertainment is deductible.")
                    }
                }.font(Theme.sans(.footnote)) }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .navigationTitle(isIncome ? "Add income" : "Add expense")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button(proof == nil ? "Next: proof" : "Save") { Task { await save() } }
                        .disabled(amount == nil || description.trimmed.isEmpty || saving)
                }
            }
            .onChange(of: isIncome) { category = categories[0].0; if !isIncome { jobId = nil } }
            .onChange(of: jobId) {
                guard let j = jobs.jobs.first(where: { $0.id == jobId }) else { return }
                description = "\(j.productionName) · \(j.role)"
                if let g = j.grossEarnings { amountText = String(format: "%.2f", g) }
                date = Date(isoDay: j.startDate) ?? date
            }
            .task { if jobs.jobs.isEmpty { await jobs.load() } }
        }
    }

    /// Reads the receipt on the phone and fills in what it finds. Fields it can't read stay as they are.
    private func read(_ file: UploadFile) async {
        proof = file
        reading = true
        defer { reading = false }
        let r = DocumentReader.receipt(lines: await Documents.text(file.pages))
        var filled = [String]()
        if let v = r.vendor, description.trimmed.isEmpty { description = v; filled.append("store") }
        if let total = r.total {
            let tax = r.tax ?? 0
            amountText = String(format: "%.2f", total - tax); filled.append("amount")
            if r.tax != nil { taxText = String(format: "%.2f", tax); filled.append("GST/HST") }
        }
        if let d = r.date.flatMap(Date.init(isoDay:)) { date = d; filled.append("date") }
        readNote = filled.isEmpty
            ? "Couldn't read the details on this one. It's still attached as proof; fill in the rest below."
            : "Read the \(ListFormatter.localizedString(byJoining: filled)) from it. Check each one before you save."
    }

    private func money(_ label: String, _ text: Binding<String>, placeholder: String) -> some View {
        HStack {
            Text(label)
            Spacer()
            TextField(placeholder, text: text).keyboardType(.decimalPad).numbersOnly(text).multilineTextAlignment(.trailing).frame(maxWidth: 120)
        }
    }

    private func save() async {
        guard let amount else { return }
        saving = true
        defer { saving = false }
        // Leaving GST/HST blank means none was charged.
        let tax = Double(taxText.replacingOccurrences(of: ",", with: ".")) ?? 0
        let entry = LedgerEntry(jobId: jobId, type: isIncome ? "INCOME" : "EXPENSE", category: category,
                                amountBeforeTax: amount, taxAmount: tax, totalAmount: amount + tax,
                                description: description.trimmed, dateIncurred: date.isoDay)
        do {
            let saved = try await ledger.add(entry)
            if let proof {
                do { try await ledger.attachProof(to: saved, file: proof) }
                catch { onSaved(saved) }       // saved, but the proof didn't upload: ask again
            } else {
                onSaved(saved)
            }
            dismiss()
        } catch {
            self.error = "Couldn't save: \(error.localizedDescription)"
        }
    }
}

/// How someone is paid, which decides what they set aside for tax.
struct PayTypePicker: View {
    @Environment(Session.self) private var session
    @State private var error: String?

    var body: some View {
        Picker("How you're paid", selection: Binding(get: { session.payType }, set: { new in
            Task {
                do { try await session.saveProfileField("pay_type", new.map { .string($0.rawValue) } ?? .null); error = nil }
                catch { self.error = "Couldn't save: \(error.localizedDescription)" }
            }
        })) {
            Text("Not set").tag(PayType?.none)
            Text("T4 (on payroll)").tag(Optional(PayType.t4))
            Text("Self-employed").tag(Optional(PayType.selfEmployed))
            Text("Both").tag(Optional(PayType.both))
        }
        .disabled(session.isPreview)
        if let error { Text(error).font(Theme.sans(.caption)).foregroundStyle(.red) }
    }
}

/// Regular GST/HST (charged minus paid) or the Quick Method.
struct GSTMethodPicker: View {
    @Environment(Session.self) private var session
    var body: some View {
        Picker("Method", selection: Binding(get: { session.gstMethod }, set: { new in
            Task { try? await session.saveProfileField("gst_method", .string(new)) }
        })) {
            Text("Regular").tag("regular")
            Text("Quick Method").tag("quick")
        }
    }
}
