import Foundation

// "Take a look around": a sample A-List Pro account, Jordan Ellis, a 2nd AC
// in Toronto working IATSE 667 permit days. Nothing in preview is saved.
enum Sample {
    static let name = "Jordan Ellis"
    static let email = "jordan@example.com"

    private static func job(_ production: String, _ company: String, _ role: String, union: (String, String)?,
                            _ start: String, _ end: String? = nil, days: Int, hoursPerDay: Double, rate: Double,
                            hours: Double, overtime: Double, gross: Double, status: String = "CONFIRMED", agent: String? = nil) -> Job {
        var j = Job(id: UUID(), status: status, productionName: production, companyName: company, role: role,
            department: "Camera", isUnion: union != nil, unionTypeId: union?.0, unionName: union?.1,
            startDate: start, endDate: end, totalHours: hours, hourlyRate: rate, daysWorked: days,
            hoursPerDay: hoursPerDay, mealBreakMinutes: 60, overtimeHours: overtime, grossEarnings: gross, province: "Ontario")
        j.agentName = agent         // booked by the sample representative (RepresentationStore preview)
        return j
    }

    static let iatse667 = ("u-667", "IATSE 667")

    static let jobs: [Job] = [
        job("Harbour Lights (Season 2)", "Apex Screen Partners", "2nd Assistant Camera", union: iatse667,
            "2026-11-02", "2026-11-27", days: 20, hoursPerDay: 12, rate: 42, hours: 220, overtime: 60, gross: 10_500, status: "TENTATIVE"),
        job("Night Market (Short)", "Lantern Pictures", "2nd Assistant Camera", union: nil,
            "2026-10-11", days: 1, hoursPerDay: 12, rate: 35, hours: 11, overtime: 0, gross: 385, status: "TENTATIVE"),
        job("Northern Lights (Series)", "Apex Screen Partners", "2nd Assistant Camera", union: iatse667,
            "2026-10-14", days: 1, hoursPerDay: 12, rate: 42, hours: 11, overtime: 3, gross: 525),
        job("Northern Lights (Series)", "Apex Screen Partners", "2nd Assistant Camera", union: iatse667,
            "2026-09-08", "2026-10-09", days: 20, hoursPerDay: 12, rate: 42, hours: 220, overtime: 60, gross: 10_500, agent: "Dana Whitfield"),
        job("Untitled Horror Feature", "Darkfield Productions", "2nd Assistant Camera", union: iatse667,
            "2026-06-01", "2026-06-19", days: 15, hoursPerDay: 12, rate: 40, hours: 165, overtime: 45, gross: 7_400),
        job("Maple & Main (Commercial)", "Northbound Creative", "Camera Operator", union: nil,
            "2026-05-12", "2026-05-13", days: 2, hoursPerDay: 13, rate: 50, hours: 24, overtime: 6, gross: 1_400, agent: "Dana Whitfield"),
        job("The Long Weekend", "Junction Films", "1st Assistant Camera", union: nil,
            "2026-04-20", "2026-04-24", days: 5, hoursPerDay: 12, rate: 45, hours: 55, overtime: 0, gross: 2_750),
    ]

    static let tracks: [TrackedUnion] = [
        TrackedUnion(id: UUID(), unionTypeId: "u-667", unionName: "IATSE 667", tierLabel: "Member",
                     targetType: "DAYS", targetValue: 60, startingValue: 6),
    ]

    private static func entry(_ income: Bool, _ category: String, _ amount: Double, tax: Double, _ what: String, _ date: String) -> LedgerEntry {
        var e = LedgerEntry(id: UUID(), type: income ? "INCOME" : "EXPENSE", category: category, amountBeforeTax: amount,
                            taxAmount: tax, totalAmount: amount + tax, description: what, dateIncurred: date)
        Ledger.applyRules(&e)
        return e
    }

    static let entries: [LedgerEntry] = [
        entry(true, "SERVICE_FEES", 525, tax: 0, "Northern Lights · day call", "2026-10-14"),
        entry(true, "SERVICE_FEES", 10_500, tax: 0, "Northern Lights · block 2", "2026-10-09"),
        entry(false, "MEALS_ENTERTAINMENT", 68, tax: 8.84, "Wrap drinks with the camera team", "2026-10-09"),
        entry(false, "GEAR_SMALL_TOOLS", 186, tax: 24.18, "AC pouch, slate markers, lens tissue", "2026-09-04"),
        entry(false, "UNION_DUES", 350, tax: 0, "IATSE 667 permit fees", "2026-07-02"),
        entry(true, "SERVICE_FEES", 7_400, tax: 0, "Untitled Horror Feature", "2026-06-19"),
        entry(true, "SERVICE_FEES", 1_400, tax: 0, "Maple & Main commercial", "2026-05-13"),
        entry(true, "SERVICE_FEES", 2_750, tax: 0, "The Long Weekend", "2026-04-24"),
        entry(false, "OFFICE_SUPPLIES", 120, tax: 15.60, "Phone plan (business share)", "2026-03-31"),
    ]
}

extension LedgerStats {
    /// The finance_stats sums, worked out on the device (for preview).
    init(entries: [LedgerEntry], year: Int = Calendar.current.component(.year, from: Date())) {
        self.init()
        for e in entries where e.dateIncurred.hasPrefix(String(year)) {
            if e.isIncome {
                grossIncome += e.amountBeforeTax; gstCollected += e.taxAmount
                if e.category == "EMPLOYMENT" { employmentIncome += e.amountBeforeTax }
            }
            else { totalExpenses += e.amountBeforeTax; deductibleExpenses += e.deductibleAmount ?? e.amountBeforeTax; gstPaid += Ledger.claimableTax(e) }
        }
    }
}
