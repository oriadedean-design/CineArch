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

    enum CodingKeys: String, CodingKey {
        case id
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

// Progress toward one union, the same sums as services/career.ts:
// only that union's jobs count, whether or not you're a member yet,
// so permit and non-member days on a union set move you forward. A tier can
// narrow that to one province, some roles or a recent window (ACTRA's AABP:
// background days on union sets in the last 12 months).
struct TrackProgress: Identifiable {
    let track: TrackedUnion
    let current: Double
    let jobs: Int
    let windowMonths: Int?
    var id: String { track.unionTypeId }
    var remaining: Double { max(0, track.targetValue - current) }
    var fraction: Double { track.targetValue > 0 ? min(1, current / track.targetValue) : 0 }

    init(track: TrackedUnion, jobs: [Job], engine: UnionEngine, today: Date = Date()) {
        let tier = engine.tier(union: track.unionTypeId, named: track.tierLabel)
        let since = tier?.windowMonths.map { Eligibility.windowStart(months: $0, today: today) }
        let roles = Set(tier?.roleIds ?? [])
        let eligible = jobs.filter { j in
            j.status != "TENTATIVE" && j.isUnion && (j.unionTypeId == track.unionTypeId || j.unionName == track.unionName)
                && (tier?.province == nil || j.province == nil || j.province == tier?.province)
                && (roles.isEmpty || roles.contains(engine.roleId(named: j.role)))
                && (since.map { j.startDate >= $0 } ?? true)
        }
        let countsFrom = tier?.startLabel != nil ? track.countsFrom : nil
        let relevant = countsFrom.map { from in eligible.filter { $0.startDate >= from } } ?? eligible
        let earlier = countsFrom.map { from in eligible.filter { $0.startDate < from } } ?? []
        self.windowMonths = tier?.windowMonths
        let measure: (Job) -> Double = switch track.targetType {
        case "HOURS": { Eligibility.hours(rule: tier?.hoursRule, totalHours: $0.totalHours, days: $0.workedDays, hoursPerDay: $0.hoursPerDay) }
        case "EARNINGS": { $0.grossEarnings ?? 0 }
        case "DAYS": { Double($0.workedDays) }
        default: { _ in 1 }    // CREDITS: one per job
        }
        self.track = track
        let legacy = tier?.hoursRule == "actra_background" && (countsFrom ?? "9999") < Eligibility.actraLegacyJoin
            ? min(Eligibility.actraLegacyHours, earlier.reduce(0) { $0 + measure($1) }) : 0
        self.current = ((track.startingValue + legacy + relevant.reduce(0) { $0 + measure($1) }) * 100).rounded() / 100
        self.jobs = relevant.count
    }
}

struct SignInNeeded: LocalizedError {
    var errorDescription: String? { "You're not signed in. Sign in from Account, then try again." }
}

@MainActor @Observable
final class TrackingStore {
    private(set) var tracks: [TrackedUnion] = []
    private(set) var isPreview = false
    var error: String?

    func usePreview() { isPreview = true; tracks = Sample.tracks; error = nil }

    func load() async {
        guard !isPreview else { return }
        do {
            tracks = try await Backend.client.from("union_tracking").select().order("created_at").execute().value
            error = nil
        } catch {
            self.error = "Couldn't load your unions."
        }
    }

    /// One row per union per person; tracking a union again updates it.
    func save(_ track: TrackedUnion) async throws {
        var track = track
        if isPreview {
            tracks.removeAll { $0.unionTypeId == track.unionTypeId }
            track.id = UUID()
            tracks.append(track)
            return
        }
        // Without a live sign-in the row would go up with no owner and the
        // database refuses it, so say so plainly instead.
        guard let session = try? await Backend.client.auth.session else { throw SignInNeeded() }
        track.userId = session.user.id
        track.id = nil
        let saved: TrackedUnion = try await Backend.client.from("union_tracking")
            .upsert(track, onConflict: "user_id,union_type_id").select().single().execute().value
        tracks.removeAll { $0.unionTypeId == saved.unionTypeId }
        tracks.append(saved)
    }

    func remove(_ track: TrackedUnion) async {
        if isPreview { tracks.removeAll { $0.unionTypeId == track.unionTypeId }; return }
        guard let userId = Backend.client.auth.currentUser?.id else { return }
        do {
            try await Backend.client.from("union_tracking").delete()
                .eq("user_id", value: userId).eq("union_type_id", value: track.unionTypeId).execute()
            tracks.removeAll { $0.unionTypeId == track.unionTypeId }
        } catch {
            self.error = "Couldn't stop tracking \(track.unionName)."
        }
    }

    func clear() { tracks = []; isPreview = false }
}
