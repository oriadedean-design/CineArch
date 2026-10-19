import Foundation

// Lookups over a snapshot plus loaded rate lines. Same behaviour as
// services/union_engine.ts and services/job_pay.ts.

public struct MinimumRate: Sendable, Hashable {
    public var schedule: RateSchedule
    public var position: String
    public var department: String
    public var hourly: Double?   // nil = negotiable
    public var daily: Double?
}

public struct PricedJob: Sendable {
    public var schedule: RateSchedule?
    public var productionTypes: [String?]
    public var minimum: MinimumRate?
    public var rule: PayRule?
    public var rate: Double?
    public var pay: JobPay?
    public var status: ScaleStatus
}

public struct JobInput: Sendable, Hashable {
    public var isUnion: Bool
    public var unionId: String?
    public var role: String?
    public var date: String              // YYYY-MM-DD
    public var productionType: String?
    public var ratePosition: String?
    public var hoursPerDay: Double?
    public var mealMinutes: Double
    public var days: Int
    public var hourlyRate: Double?       // nil = the union minimum
    public var workDay: Int              // the day's place in the work week (6, 7 = premium days)

    public init(isUnion: Bool, unionId: String? = nil, role: String? = nil, date: String, productionType: String? = nil,
                ratePosition: String? = nil, hoursPerDay: Double? = nil, mealMinutes: Double = 0, days: Int = 1, hourlyRate: Double? = nil,
                workDay: Int = 1) {
        self.isUnion = isUnion; self.unionId = unionId; self.role = role; self.date = date
        self.productionType = productionType; self.ratePosition = ratePosition; self.hoursPerDay = hoursPerDay
        self.mealMinutes = mealMinutes; self.days = days; self.hourlyRate = hourlyRate
        self.workDay = workDay
    }
}

public struct UnionEngine: Sendable {
    public var snapshot: EngineSnapshot
    public var lines: [String: [RateLine]]

    public init(snapshot: EngineSnapshot = .empty, lines: [String: [RateLine]] = [:]) {
        self.snapshot = snapshot
        self.lines = lines
    }

    static func normalize(_ s: String) -> String {
        s.lowercased().split(whereSeparator: \.isWhitespace).joined(separator: " ")
    }

    // MARK: Catalog

    public var unions: [Union] { snapshot.unions }
    public func union(_ id: String) -> Union? { snapshot.unions.first { $0.id == id } }

    public func findRole(_ name: String) -> Department.Role? {
        let n = Self.normalize(name)
        for d in snapshot.departments {
            if let r = d.roles.first(where: { Self.normalize($0.name) == n || $0.aliases.contains { Self.normalize($0) == n } }) { return r }
        }
        return nil
    }

    public func department(ofRole name: String) -> Department? {
        guard let role = findRole(name) else { return nil }
        return snapshot.departments.first { $0.roles.contains(role) }
    }

    // MARK: Pay rules and schedules

    public func schedules(_ unionId: String) -> [RateSchedule] { snapshot.rateSchedules.filter { $0.unionId == unionId } }

    public func payRule(_ unionId: String, department: String? = nil) -> PayRule? {
        let deptId = department.flatMap { d in snapshot.departments.first { Self.normalize($0.name) == Self.normalize(d) }?.id }
        let rules = snapshot.payRules.filter { $0.unionId == unionId }
        return rules.first { deptId != nil && $0.departmentId == deptId } ?? rules.first { $0.departmentId == nil }
    }

    /// Production types with a schedule in effect on the date (nil = covers every production).
    public func productionTypes(_ unionId: String, on date: String) -> [String?] {
        var seen: [String?] = []
        for s in schedules(unionId) where s.inEffect(on: date) && !seen.contains(s.productionType) { seen.append(s.productionType) }
        return seen
    }

    public func schedule(_ unionId: String, on date: String, productionType: String? = nil) -> RateSchedule? {
        let current = schedules(unionId).filter { $0.inEffect(on: date) }
        return current.first { $0.productionType == productionType } ?? (current.count == 1 ? current[0] : nil)
    }

    /// Schedules in effect on the date, or the most recent ones if none are.
    public func currentSchedules(_ unionId: String, on date: String) -> [RateSchedule] {
        let all = schedules(unionId)
        let current = all.filter { $0.inEffect(on: date) }
        if !current.isEmpty { return current }
        let latest = all.map(\.effectiveFrom).max() ?? ""
        return all.filter { $0.effectiveFrom == latest }
    }

    // MARK: Minimums

    func column(_ s: RateSchedule, _ l: RateLine, _ name: String?) -> Double? {
        guard let name, let i = s.columns.firstIndex(of: name), l.rates.indices.contains(i) else { return nil }
        return l.rates[i]
    }

    public func positions(_ s: RateSchedule) -> [MinimumRate] {
        (lines[s.id] ?? []).map { MinimumRate(schedule: s, position: $0.position, department: $0.department,
                                              hourly: column(s, $0, s.hourlyColumn), daily: column(s, $0, s.dailyColumn)) }
    }

    /// The minimum for a rate-sheet position, else the first position linked to the catalog role.
    public func minimum(_ s: RateSchedule, position: String? = nil, role: String? = nil) -> MinimumRate? {
        guard let ls = lines[s.id] else { return nil }
        let roleId = role.flatMap { findRole($0)?.id }
        guard let l = position.flatMap({ p in ls.first { $0.position == p } }) ?? roleId.flatMap({ r in ls.first { $0.roleId == r } })
        else { return nil }
        return MinimumRate(schedule: s, position: l.position, department: l.department,
                           hourly: column(s, l, s.hourlyColumn), daily: column(s, l, s.dailyColumn))
    }

    /// Schedule ids whose lines `price` needs and aren't loaded yet.
    public func missingLines(for input: JobInput) -> [String] {
        guard input.isUnion, let u = input.unionId, let s = schedule(u, on: input.date, productionType: input.productionType),
              lines[s.id] == nil else { return [] }
        return [s.id]
    }

    // MARK: Pricing (services/job_pay.ts)

    public func price(_ input: JobInput) -> PricedJob {
        let unionId = input.isUnion ? input.unionId : nil
        let types = unionId.map { productionTypes($0, on: input.date) } ?? []
        let sched = unionId.flatMap { schedule($0, on: input.date, productionType: input.productionType) }
        let min = sched.flatMap { minimum($0, position: input.ratePosition, role: input.role) }
        let dept = input.role.flatMap { department(ofRole: $0)?.name }
        let rule = unionId.flatMap { payRule($0, department: dept) }
        let rate = (input.hourlyRate ?? 0) > 0 ? input.hourlyRate : min?.hourly
        var pay: JobPay?
        if let h = input.hoursPerDay, h > 0, let rate {
            pay = Pay.job(onClock: h, mealMinutes: input.mealMinutes, rate: rate, rule: rule, dailyMinimum: min?.daily,
                          days: input.days, workDay: input.workDay)
        }
        return PricedJob(schedule: sched, productionTypes: types, minimum: min, rule: rule, rate: rate, pay: pay,
                         status: Pay.scaleStatus(rate: rate, minimum: min?.hourly, vacationPay: rule?.vacationPayRate))
    }
}
