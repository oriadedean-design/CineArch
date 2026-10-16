import Foundation

// The union engine's data, exactly as union_engine_snapshot() and
// rate_schedule_lines() return it (see services/union_engine.ts).

public struct EngineSnapshot: Codable, Sendable {
    public var version: Int
    public var unions: [Union]
    public var departments: [Department]
    public var rateSchedules: [RateSchedule]
    public var payRules: [PayRule]

    public static let empty = EngineSnapshot(version: 0, unions: [], departments: [], rateSchedules: [], payRules: [])
}

public struct Union: Codable, Sendable, Identifiable, Hashable {
    public var id: String
    public var name: String
    public var scope: String?
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
    public var mealBreakNotes: String?
    public var notes: String?
    public var needsVerification: [String]
    public var sourceUrl: String?

    public init(id: String = "", unionId: String = "", title: String = "", departmentId: String? = nil,
                minimumCallHours: Double?, overtimeAfter: [Double], overtimeMultipliers: [Double], incrementMinutes: Int?,
                mealBreakNotes: String? = nil, notes: String? = nil, needsVerification: [String] = [], sourceUrl: String? = nil) {
        self.id = id; self.unionId = unionId; self.title = title; self.departmentId = departmentId
        self.minimumCallHours = minimumCallHours; self.overtimeAfter = overtimeAfter
        self.overtimeMultipliers = overtimeMultipliers; self.incrementMinutes = incrementMinutes
        self.mealBreakNotes = mealBreakNotes; self.notes = notes; self.needsVerification = needsVerification; self.sourceUrl = sourceUrl
    }
}
