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

    enum CodingKeys: String, CodingKey {
        case id, type, category, description
        case userId = "user_id", jobId = "job_id", amountBeforeTax = "amount_before_tax", taxAmount = "tax_amount"
        case totalAmount = "total_amount", dateIncurred = "date_incurred", businessUsePercent = "business_use_percent"
        case deductibleAmount = "deductible_amount", addBackAmount = "add_back_amount", ruleTags = "rule_tags"
    }

    var isIncome: Bool { type == "INCOME" }
    var categoryName: String { Ledger.categoryName(category) }
}

// Canadian rules, the same as services/finance.ts.
enum Ledger {
    static let gstRate = 0.05
    static let smallSupplierThreshold = 30_000.0
    static let cppRate = 0.119
    static let cppExemption = 3_500.0
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
    var estimatedCPP: Double { max(0, netIncome - Ledger.cppExemption) * Ledger.cppRate }
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

    func usePreview() { isPreview = true; entries = Sample.entries; stats = LedgerStats(entries: entries); error = nil }

    func load() async {
        guard !isPreview else { return }
        guard let userId = Backend.client.auth.currentUser?.id else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            async let rows: [LedgerEntry] = Backend.client.from("finance_transactions").select()
                .eq("user_id", value: userId).order("date_incurred", ascending: false).limit(200).execute().value
            async let totals: [LedgerStats] = Backend.client
                .rpc("finance_stats", params: ["p_user_id": userId.uuidString.lowercased()]).execute().value
            entries = try await rows
            stats = try await totals.first ?? LedgerStats()
            error = nil
        } catch {
            self.error = "Couldn't load your ledger. Pull to try again."
        }
    }

    func add(_ entry: LedgerEntry) async throws {
        var entry = entry
        entry.userId = Backend.client.auth.currentUser?.id
        entry.totalAmount = entry.amountBeforeTax + entry.taxAmount
        Ledger.applyRules(&entry)
        if isPreview {
            entry.id = UUID()
            entries.append(entry)
            entries.sort { $0.dateIncurred > $1.dateIncurred }
            stats = LedgerStats(entries: entries)
            return
        }
        _ = try await Backend.client.from("finance_transactions").insert(entry).execute()
        await load()
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
