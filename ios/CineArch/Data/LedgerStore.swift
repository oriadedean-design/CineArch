import Foundation
import Observation
import Supabase

// One line in the ledger, as stored in public.finance_transactions
// (the website's Wrap Wallet reads and writes the same rows).
struct LedgerEntry: Codable, Identifiable, Hashable {
    var id: UUID?
    var userId: UUID?
    var jobId: UUID?
    var type: String                 // INCOME or EXPENSE
    var category: String
    var amountBeforeTax: Double
    var taxAmount: Double            // GST/HST
    var totalAmount: Double
    var description: String
    var dateIncurred: String
    var businessUsePercent: Double = 100
    var deductibleAmount: Double?
    var addBackAmount: Double?
    var ruleTags: [String]?
    var proofPath: String?           // receipt, pay stub or invoice in documents/<user>/proof/

    enum CodingKeys: String, CodingKey {
        case id, type, category, description
        case userId = "user_id", jobId = "job_id", amountBeforeTax = "amount_before_tax", taxAmount = "tax_amount"
        case totalAmount = "total_amount", dateIncurred = "date_incurred", businessUsePercent = "business_use_percent"
        case deductibleAmount = "deductible_amount", addBackAmount = "add_back_amount", ruleTags = "rule_tags"
        case proofPath = "proof_path"
    }

    var isIncome: Bool { type == "INCOME" }
    /// Backed with proof.
    var isGreenLit: Bool { proofPath != nil }
    var categoryName: String { Ledger.categoryName(category) }
}

// Canadian rules, the same as services/finance.ts.
enum Ledger {
    static let gstRate = 0.05
    static let smallSupplierThreshold = 30_000.0
    static var currentYear: Int { Calendar.current.component(.year, from: Date()) }

    // CPP for the self-employed, 2026 (ESDC): 11.9% of earnings from $3,500 to
    // $74,600 (most $8,460.90), plus CPP2 at 8% from $74,600 to $85,000 (most $832).
    static let cppRate = 0.119
    static let cppExemption = 3_500.0
    static let cppCeiling = 74_600.0
    static let cpp2Rate = 0.08
    static let cpp2Ceiling = 85_000.0

    static func cpp(net: Double) -> Double {
        let base = min(max(0, net - cppExemption), cppCeiling - cppExemption) * cppRate
        let second = max(0, min(net, cpp2Ceiling) - cppCeiling) * cpp2Rate
        return ((base + second) * 100).rounded() / 100
    }

    /// GST/HST you can claim back on an expense: half on meals and entertainment (CRA).
    static func claimableTax(_ e: LedgerEntry) -> Double {
        let cat = e.category.uppercased()
        return cat.contains("MEAL") || cat.contains("ENTERTAINMENT") ? e.taxAmount / 2 : e.taxAmount
    }
    static let projectedTaxRate = 0.20

    static let incomeCategories = [("SERVICE_FEES", "Service fees"), ("RESIDUAL", "Residuals")]
    static let expenseCategories = [
        ("MEALS_ENTERTAINMENT", "Meals (50% rule)"), ("UNION_DUES", "Union dues"), ("APPLICATION_FEE", "Initiation / application fee"),
        ("GEAR_SMALL_TOOLS", "Gear & small tools"), ("OFFICE_SUPPLIES", "Office supplies"),
    ]

    static func categoryName(_ id: String) -> String {
        (incomeCategories + expenseCategories).first { $0.0 == id }?.1
            ?? id.replacingOccurrences(of: "_", with: " ").capitalized
    }

    /// Meals and entertainment are 50% deductible; fines and penalties aren't deductible.
    static func applyRules(_ e: inout LedgerEntry) {
        let cat = e.category.uppercased()
        guard !e.isIncome else { e.deductibleAmount = 0; e.addBackAmount = 0; e.ruleTags = []; return }
        if cat.contains("MEAL") || cat.contains("ENTERTAINMENT") {
            e.deductibleAmount = e.amountBeforeTax * 0.5; e.addBackAmount = e.amountBeforeTax * 0.5; e.ruleTags = ["MEALS_50_LIMIT"]
        } else if cat.contains("FINE") || cat.contains("PENALTY") {
            e.deductibleAmount = 0; e.addBackAmount = e.amountBeforeTax; e.ruleTags = ["NON_DEDUCTIBLE_FINE"]
        } else {
            e.deductibleAmount = e.amountBeforeTax; e.addBackAmount = 0; e.ruleTags = []
        }
    }
}

// Year-to-date totals from the finance_stats RPC, plus the website's estimates.
struct LedgerStats: Decodable {
    var grossIncome = 0.0
    var totalExpenses = 0.0
    var deductibleExpenses = 0.0
    var gstCollected = 0.0
    var gstPaid = 0.0

    enum CodingKeys: String, CodingKey {
        case grossIncome = "gross_income", totalExpenses = "total_expenses", deductibleExpenses = "deductible_expenses"
        case gstCollected = "gst_collected", gstPaid = "gst_paid"
    }

    init() {}
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        func num(_ k: CodingKeys) -> Double {
            (try? c.decode(Double.self, forKey: k)) ?? Double((try? c.decode(String.self, forKey: k)) ?? "") ?? 0
        }
        grossIncome = num(.grossIncome); totalExpenses = num(.totalExpenses); deductibleExpenses = num(.deductibleExpenses)
        gstCollected = num(.gstCollected); gstPaid = num(.gstPaid)
    }

    var netIncome: Double { grossIncome - deductibleExpenses }
    var gstOwing: Double { gstCollected - gstPaid }
    var estimatedCPP: Double { Ledger.cpp(net: netIncome) }
    var estimatedIncomeTax: Double { max(0, netIncome) * Ledger.projectedTaxRate }
    /// Past $30,000 in a year you must register for GST/HST.
    var gstThresholdFraction: Double { min(1, grossIncome / Ledger.smallSupplierThreshold) }
}

@MainActor @Observable
final class LedgerStore {
    private(set) var entries: [LedgerEntry] = []
    private(set) var stats = LedgerStats()
    private(set) var isLoading = false
    private(set) var isPreview = false
    var error: String?

    func usePreview() {
        isPreview = true; error = nil
        // Most sample entries are backed with proof; two still need it.
        entries = Sample.entries.enumerated().map { i, e in var e = e; if i != 2 && i != 8 { e.proofPath = "preview/proof/\(i)" }; return e }
        stats = LedgerStats(entries: entries)
    }

    func load() async {
        guard !isPreview else { return }
        guard let userId = Backend.client.auth.currentUser?.id else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            // All of this year (reports and the spreadsheet cover the whole year),
            // plus the latest 200 from earlier years to look back on.
            let jan1 = "\(Ledger.currentYear)-01-01"
            async let thisYear = Self.all(userId: userId, from: jan1)
            async let earlier: [LedgerEntry] = Backend.client.from("finance_transactions").select()
                .eq("user_id", value: userId).lt("date_incurred", value: jan1)
                .order("date_incurred", ascending: false).limit(200).execute().value
            async let totals: [LedgerStats] = Backend.client
                .rpc("finance_stats", params: ["p_user_id": userId.uuidString.lowercased()]).execute().value
            entries = try await thisYear + earlier
            stats = try await totals.first ?? LedgerStats()
            error = nil
        } catch {
            self.error = "Couldn't load your ledger. Pull to try again."
        }
    }

    /// Every entry on or after a date, a page at a time.
    private static func all(userId: UUID, from day: String) async throws -> [LedgerEntry] {
        var rows = [LedgerEntry]()
        let page = 1000
        while true {
            let batch: [LedgerEntry] = try await Backend.client.from("finance_transactions").select()
                .eq("user_id", value: userId).gte("date_incurred", value: day)
                .order("date_incurred", ascending: false).order("id")
                .range(from: rows.count, to: rows.count + page - 1).execute().value
            rows += batch
            if batch.count < page { return rows }
        }
    }

    /// This year's entries: what the reports and the spreadsheet cover.
    var yearEntries: [LedgerEntry] { entries.filter { $0.dateIncurred.hasPrefix(String(Ledger.currentYear)) } }

    /// Saves an entry and returns it, so the next step can ask for its proof.
    @discardableResult
    func add(_ entry: LedgerEntry) async throws -> LedgerEntry {
        var entry = entry
        entry.userId = Backend.client.auth.currentUser?.id
        entry.totalAmount = entry.amountBeforeTax + entry.taxAmount
        Ledger.applyRules(&entry)
        if isPreview {
            entry.id = UUID()
            entries.append(entry)
            entries.sort { $0.dateIncurred > $1.dateIncurred }
            stats = LedgerStats(entries: entries)
            return entry
        }
        let saved: LedgerEntry = try await Backend.client.from("finance_transactions").insert(entry).select().single().execute().value
        await load()
        return saved
    }

    /// Documents stored online, for "X MB of 5 GB used".
    private(set) var usedBytes: Int64 = 0

    struct StorageFull: LocalizedError {
        var errorDescription: String? { "You've used your 5 GB of documents. Delete some old proof to make room." }
    }

    func loadUsage() async {
        guard !isPreview else { return }
        struct Usage: Decodable { let used_bytes: Int64 }
        if let u: Usage = try? await Backend.client.rpc("my_documents_usage").execute().value { usedBytes = u.used_bytes }
    }

    /// Backs an entry with proof: the file (already under 1 MB) goes to documents/<user>/proof/,
    /// then the entry points at it.
    func attachProof(to entry: LedgerEntry, file: UploadFile) async throws {
        guard let id = entry.id else { return }
        if isPreview { setProof(id, "preview/proof/\(id)"); return }
        guard let user = try? await Backend.client.auth.session.user.id else { throw SignInNeeded() }
        await loadUsage()
        guard usedBytes + Int64(file.data.count) <= Documents.accountLimitBytes else { throw StorageFull() }
        let path = "\(user.uuidString.lowercased())/proof/\(id.uuidString.lowercased())-\(Int(Date().timeIntervalSince1970)).\(file.ext)"
        try await Backend.client.storage.from("documents").upload(path, data: file.data, options: FileOptions(contentType: file.contentType))
        try await Backend.client.from("finance_transactions").update(["proof_path": path]).eq("id", value: id).execute()
        if let old = entry.proofPath { _ = try? await Backend.client.storage.from("documents").remove(paths: [old]) }
        setProof(id, path)
        await loadUsage()
    }

    /// A link to look at an entry's proof, good for 5 minutes.
    func proofURL(_ entry: LedgerEntry) async -> URL? {
        guard let path = entry.proofPath, !isPreview else { return nil }
        return try? await Backend.client.storage.from("documents").createSignedURL(path: path, expiresIn: 300)
    }

    private func setProof(_ id: UUID, _ path: String) {
        if let i = entries.firstIndex(where: { $0.id == id }) { entries[i].proofPath = path }
    }

    /// This year's entries as a spreadsheet (CSV), for an accountant or tax time.
    func csv() -> String {
        let entries = yearEntries
        func cell(_ s: String) -> String { "\"" + s.replacingOccurrences(of: "\"", with: "\"\"") + "\"" }
        let head = "Date,Type,Category,Description,Amount before tax,GST/HST,Total,Deductible,Proof"
        let rows = entries.map { e in
            [e.dateIncurred, e.isIncome ? "Income" : "Expense", cell(e.categoryName), cell(e.description),
             String(format: "%.2f", e.amountBeforeTax), String(format: "%.2f", e.taxAmount), String(format: "%.2f", e.totalAmount),
             String(format: "%.2f", e.isIncome ? 0 : e.deductibleAmount ?? e.amountBeforeTax), e.isGreenLit ? "Green Lit" : "Needs proof"]
                .joined(separator: ",")
        }
        return ([head] + rows).joined(separator: "\n") + "\n"
    }

    func delete(_ entry: LedgerEntry) async {
        guard let id = entry.id else { return }
        if isPreview { entries.removeAll { $0.id == id }; stats = LedgerStats(entries: entries); return }
        do {
            try await Backend.client.from("finance_transactions").delete().eq("id", value: id).execute()
            await load()
        } catch {
            self.error = "Couldn't delete that entry."
        }
    }

    func clear() { entries = []; stats = LedgerStats(); isPreview = false }
}
