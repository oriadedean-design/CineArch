import Foundation

// The union engine's data, exactly as union_engine_snapshot() and
// rate_schedule_lines() return it (see services/union_engine.ts).

public struct EngineSnapshot: Codable, Sendable {
    public var version: Int
    public var unions: [Union]
    public var departments: [Department]
    public var rateSchedules: [RateSchedule]
    public var payRules: [PayRule]
    /// [role or department id, province, region, union id, relationship, notes]
    public var roleCoverage: [[String?]]? = nil
    public var departmentCoverage: [[String?]]? = nil
    /// Tax and union dates, each with its source (public.deadlines).
    public var deadlines: [Deadline]? = nil
    /// Tax figures by year (public.tax_jurisdictions, pension_plans, sales_tax).
    public var tax: TaxTables? = nil

    public static let empty = EngineSnapshot(version: 0, unions: [], departments: [], rateSchedules: [], payRules: [])
}

public struct Union: Codable, Sendable, Identifiable, Hashable {
    public var id: String
    public var name: String
    public var scope: String?
    public var allowsCash: Bool?          // ACTRA, UBCP/ACTRA: non-members can be hired "cash"
    public var description: String?
    public var website: String?
    public var contactEmail: String?
    public var contactPhone: String?
    public var applicationFee: Double?
    public var applicationFeeNotes: String?
    public var duesRate: Double?
    public var duesNotes: String?
    public var jurisdictions: [Jurisdiction]
    public var tiers: [Tier]
    public var requirements: [Requirement]

    public struct Jurisdiction: Codable, Sendable, Hashable {
        public var province: String
        public var region: String?
        public var notes: String?
    }
    public struct Tier: Codable, Sendable, Hashable {
        public var name: String
        public var targetType: String
        public var targetValue: Double
        public var description: String?
        public var province: String?         // the branch it applies to (nil = everywhere)
        public var roleIds: [String]?        // only jobs in these roles count (empty = any)
        public var windowMonths: Int?        // only work in the last N months counts
        public var hoursRule: String?        // "actra_background"
        public var startLabel: String?       // asks when counting starts, e.g. "AABP since"
        public var requiresDepartment: Bool? // only work in the department, category or position you're going for
        public var countsWork: String?       // "union" = that union's productions only; "any" = relevant work anywhere
        public var minProductions: Int?      // at least this many different productions
        public var shortDayHours: Double?    // a day this short counts as half
        public var shortDayInclusive: Bool?  // true = "this many hours or less", else "under"
        public var excludeRoleIds: [String]? // work in these roles never counts
        public var sourceUrl: String?
        public var checkedOn: String?        // YYYY-MM-DD
        public var confirmed: Bool?          // false = no published source; not a firm goal

        public var isConfirmed: Bool { confirmed ?? false }
        public var countsAnyWork: Bool { countsWork == "any" }
        public var byDepartment: Bool { requiresDepartment ?? false }
    }
    public struct Requirement: Codable, Sendable, Hashable {
        public var kind: String
        public var province: String?
        public var text: String
    }
}

public struct Department: Codable, Sendable, Identifiable, Hashable {
    public var id: String
    public var name: String
    public var roles: [Role]

    public struct Role: Codable, Sendable, Identifiable, Hashable {
        public var id: String
        public var name: String
        public var aliases: [String]
    }
}

public struct RateSchedule: Codable, Sendable, Identifiable, Hashable {
    public var id: String
    public var unionId: String
    public var title: String
    public var productionType: String?
    public var effectiveFrom: String      // YYYY-MM-DD
    public var effectiveTo: String?       // nil = open-ended
    public var columns: [String]
    public var hourlyColumn: String?
    public var dailyColumn: String?
    public var rateUnit: String
    public var sourceUrl: String?
    public var notes: String?
    public var roleIds: [String]

    func inEffect(on date: String) -> Bool {
        effectiveFrom <= date && (effectiveTo.map { date <= $0 } ?? true)
    }
}

public struct RateLine: Codable, Sendable, Hashable {
    public var department: String
    public var departmentNote: String?
    public var position: String
    public var rates: [Double?]
    public var roleId: String?
}

public struct PayRule: Codable, Sendable, Identifiable, Hashable {
    public var id: String
    public var unionId: String
    public var title: String
    public var departmentId: String?
    public var minimumCallHours: Double?
    public var overtimeAfter: [Double]
    public var overtimeMultipliers: [Double]
    public var incrementMinutes: Int?
    public var overtimeBase: String?      // "daily_fee" = the daily fee / 8 (ACTRA IPA); else your hourly rate
    public var sixthDay: PremiumDay?      // how a 6th day worked in the work week pays
    public var seventhDay: PremiumDay?
    public var vacationPayRate: Double?   // vacation pay already in the rate sheet's rates (BCMPA 4%)

    /// A day paid at a premium: the minimum call at `base`, then each step from the hour it starts.
    public struct PremiumDay: Codable, Sendable, Hashable {
        public var base: Double
        public var after: [Double]
        public var multipliers: [Double]
        public init(base: Double, after: [Double], multipliers: [Double]) { self.base = base; self.after = after; self.multipliers = multipliers }
    }

    public func premium(workDay: Int) -> PremiumDay? { workDay == 6 ? sixthDay : workDay >= 7 ? seventhDay : nil }
    public var mealBreakNotes: String?
    public var notes: String?
    public var needsVerification: [String]
    public var sourceUrl: String?

    public init(id: String = "", unionId: String = "", title: String = "", departmentId: String? = nil,
                minimumCallHours: Double?, overtimeAfter: [Double], overtimeMultipliers: [Double], incrementMinutes: Int?,
                overtimeBase: String? = nil, sixthDay: PremiumDay? = nil, seventhDay: PremiumDay? = nil,
                vacationPayRate: Double? = nil, mealBreakNotes: String? = nil, notes: String? = nil, needsVerification: [String] = [], sourceUrl: String? = nil) {
        self.id = id; self.unionId = unionId; self.title = title; self.departmentId = departmentId
        self.minimumCallHours = minimumCallHours; self.overtimeAfter = overtimeAfter
        self.overtimeMultipliers = overtimeMultipliers; self.incrementMinutes = incrementMinutes
        self.overtimeBase = overtimeBase; self.sixthDay = sixthDay; self.seventhDay = seventhDay
        self.vacationPayRate = vacationPayRate
        self.mealBreakNotes = mealBreakNotes; self.notes = notes; self.needsVerification = needsVerification; self.sourceUrl = sourceUrl
    }
}

public struct Deadline: Codable, Sendable, Identifiable, Hashable {
    public var id: String
    public var title: String
    public var month: Int
    public var day: Int
    public var appliesTo: String     // self_employed, instalments, gst_registered, union_member
    public var province: String?
    public var unionId: String?
    public var detail: String?
    public var sourceUrl: String
    public var checkedOn: String

    /// The next time this date comes round, today included.
    public func next(after today: Date, calendar: Calendar = .current) -> Date? {
        let y = calendar.component(.year, from: today)
        for year in [y, y + 1] {
            if let d = calendar.date(from: DateComponents(year: year, month: month, day: day)),
               d >= calendar.startOfDay(for: today) { return d }
        }
        return nil
    }
}
