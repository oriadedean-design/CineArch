import Foundation
import Observation
import Supabase
import CineArchKit

// A union someone is working toward, as stored in public.union_tracking
// (the same rows the website's dashboard reads).
struct TrackedUnion: Codable, Identifiable, Hashable {
    var id: UUID?
    var userId: UUID?
    var unionTypeId: String
    var unionName: String
    var tierLabel: String
    var targetType: String          // HOURS, DAYS, CREDITS or EARNINGS
    var targetValue: Double
    var startingValue: Double = 0   // already banked before using CineArch
    var countsFrom: String?         // YYYY-MM-DD; only work on or after it counts (e.g. AABP since)
    var department: String?         // for steps that count one department, category or position

    enum CodingKeys: String, CodingKey {
        case id, department
        case userId = "user_id", unionTypeId = "union_type_id", unionName = "union_name", tierLabel = "tier_label"
        case targetType = "target_type", targetValue = "target_value", startingValue = "starting_value", countsFrom = "counts_from"
    }

    var unit: String {
        switch targetType {
        case "HOURS": "hours"
        case "DAYS": "days"
        case "EARNINGS": "earned"
        default: "credits"
        }
    }

    func format(_ v: Double) -> String {
        targetType == "EARNINGS" ? v.money : v.formatted(.number.precision(.fractionLength(0...1)))
    }
}

// Progress toward one union, the same sums as services/career.ts. By default
// only that union's jobs count, whether or not you're a member yet, so permit
// and non-member days on a union set move you forward. Each step can change
// that: relevant work anywhere (permit steps like NABET's 40 days), one
// department, one province, some roles (or never some roles, like background
// toward ACTRA credits), a recent window, short days as half days, and a
// minimum number of productions. The target is the step's current one.
struct TrackProgress: Identifiable {
    let track: TrackedUnion          // with the step's current target
    let tier: Union.Tier?
    let current: Double
    let jobs: Int
    let productions: Int
    let windowMonths: Int?
    var id: String { track.unionTypeId }
    var remaining: Double { max(0, track.targetValue - current) }
    var fraction: Double { track.targetValue > 0 ? min(1, current / track.targetValue) : 0 }
    var minProductions: Int? { tier?.minProductions }
    var productionsShort: Bool { minProductions.map { productions < $0 } ?? false }
    /// The step counts one department but none is chosen yet, so every department counts.
    var needsDepartment: Bool { (tier?.byDepartment ?? false) && (track.department ?? "").isEmpty }
    var isConfirmed: Bool { tier?.isConfirmed ?? false }

    static func key(_ s: String) -> String { s.lowercased().split(whereSeparator: \.isWhitespace).joined(separator: " ") }

    init(track: TrackedUnion, jobs: [Job], engine: UnionEngine, today: Date = Date()) {
        let tier = engine.tier(union: track.unionTypeId, named: track.tierLabel)
        let since = tier?.windowMonths.map { Eligibility.windowStart(months: $0, today: today) }
        let roles = Set(tier?.roleIds ?? [])
        let excluded = Set(tier?.excludeRoleIds ?? [])
        let department = (tier?.byDepartment ?? false) ? track.department.map(Self.key).flatMap { $0.isEmpty ? nil : $0 } : nil
        let eligible = jobs.filter { j in
            let role = engine.roleId(named: j.role)
            return j.status != "TENTATIVE"
                && ((tier?.countsAnyWork ?? false) || (j.isUnion && (j.unionTypeId == track.unionTypeId || j.unionName == track.unionName)))
                && (tier?.province == nil || j.province == nil || j.province == tier?.province)
                && (roles.isEmpty || roles.contains(role)) && !excluded.contains(role)
                && (since.map { j.startDate >= $0 } ?? true)
                && (department.map { d in (j.department ?? engine.department(ofRole: j.role)?.name).map(Self.key) == d } ?? true)
        }
        let countsFrom = tier?.startLabel != nil ? track.countsFrom : nil
        let relevant = countsFrom.map { from in eligible.filter { $0.startDate >= from } } ?? eligible
        let earlier = countsFrom.map { from in eligible.filter { $0.startDate < from } } ?? []
        self.windowMonths = tier?.windowMonths
        let measure: (Job) -> Double = switch track.targetType {
        case "HOURS": { Eligibility.hours(rule: tier?.hoursRule, totalHours: $0.totalHours, days: $0.workedDays, hoursPerDay: $0.hoursPerDay) }
        case "EARNINGS": { $0.grossEarnings ?? 0 }
        case "DAYS": { j in
            Eligibility.days(j.workedDays, hoursPerDay: j.hoursPerDay ?? (j.totalHours > 0 ? j.totalHours / Double(max(1, j.workedDays)) : nil),
                             shortDayHours: tier?.shortDayHours, inclusive: tier?.shortDayInclusive ?? false) }
        default: { _ in 1 }    // CREDITS: one per job (one work permit or contract)
        }
        var effective = track
        if let tier, tier.targetType == track.targetType { effective.targetValue = tier.targetValue }
        self.track = effective
        self.tier = tier
        let legacy = tier?.hoursRule == "actra_background" && (countsFrom ?? "9999") < Eligibility.actraLegacyJoin
            ? min(Eligibility.actraLegacyHours, earlier.reduce(0) { $0 + measure($1) }) : 0
        self.current = ((track.startingValue + legacy + relevant.reduce(0) { $0 + measure($1) }) * 100).rounded() / 100
        self.jobs = relevant.count
        self.productions = Set(relevant.map { Self.key($0.productionName) }).count
    }
}

struct SignInNeeded: LocalizedError {
    var errorDescription: String? { "You're not signed in. Sign in from Account, then try again." }
}

@MainActor @Observable
final class TrackingStore {
    private(set) var tracks: [TrackedUnion] = []
    private(set) var place = DataPlace.none
    var error: String?

    /// Switches to an account's unions: the sample, this phone (free) or online (Pro).
    func use(_ newPlace: DataPlace) async {
        if newPlace != place { place = newPlace; tracks = []; error = nil }
        switch place {
        case .none: tracks = []
        case .preview: tracks = Sample.tracks
        case .phone, .online: await load()
        }
    }

    func load() async {
        do {
            switch place {
            case .phone(let user):
                if !OnDevice.exists("unions", user: user) { try OnDevice.write(try await fetchOnline(), "unions", user: user) }
                tracks = OnDevice.read("unions", user: user) ?? []
            case .online(let user):
                if let local: [TrackedUnion] = OnDevice.read("unions", user: user), !local.isEmpty {
                    let rows = local.map { var t = $0; t.id = nil; t.userId = user; return t }
                    try await Backend.client.from("union_tracking").upsert(rows, onConflict: "user_id,union_type_id").execute()
                }
                OnDevice.remove("unions", user: user)
                tracks = try await fetchOnline()
            default: return
            }
            error = nil
        } catch {
            self.error = "Couldn't load your unions."
        }
    }

    private func fetchOnline() async throws -> [TrackedUnion] {
        try await Backend.client.from("union_tracking").select().order("created_at").execute().value
    }

    /// One row per union per person; tracking a union again updates it.
    func save(_ track: TrackedUnion) async throws {
        var track = track
        switch place {
        case .none: throw SignInNeeded()
        case .preview: track.id = UUID()
        case .phone(let user):
            track.id = tracks.first { $0.unionTypeId == track.unionTypeId }?.id ?? UUID()
            track.userId = user
            try OnDevice.write(tracks.filter { $0.unionTypeId != track.unionTypeId } + [track], "unions", user: user)
        case .online(let user):
            track.userId = user
            track.id = nil
            track = try await Backend.client.from("union_tracking")
                .upsert(track, onConflict: "user_id,union_type_id").select().single().execute().value
        }
        tracks.removeAll { $0.unionTypeId == track.unionTypeId }
        tracks.append(track)
    }

    func remove(_ track: TrackedUnion) async {
        let remaining = tracks.filter { $0.unionTypeId != track.unionTypeId }
        do {
            switch place {
            case .phone(let user): try OnDevice.write(remaining, "unions", user: user)
            case .online(let user):
                try await Backend.client.from("union_tracking").delete()
                    .eq("user_id", value: user).eq("union_type_id", value: track.unionTypeId).execute()
            default: break
            }
            tracks = remaining
        } catch {
            self.error = "Couldn't stop tracking \(track.unionName)."
        }
    }
}
