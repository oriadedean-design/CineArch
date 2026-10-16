import Foundation
import Observation
import Supabase

// A job as stored in public.jobs (the same rows the website reads and writes).
struct Job: Codable, Identifiable, Hashable {
    var id: UUID?
    var userId: UUID?
    var status = "CONFIRMED"
    var productionName: String
    var companyName: String
    var role: String
    var department: String?
    var isUnion: Bool
    var unionTypeId: String?
    var unionName: String?
    var productionTier: String?
    var startDate: String
    var totalHours: Double
    var hourlyRate: Double?
    var daysWorked: Int
    var hoursPerDay: Double?
    var mealBreakMinutes: Int
    var overtimeHours: Double
    var unionMinimumRate: Double?
    var ratePosition: String?
    var grossEarnings: Double?
    var province: String?

    enum CodingKeys: String, CodingKey {
        case id, status, role, department, province
        case userId = "user_id", productionName = "production_name", companyName = "company_name"
        case isUnion = "is_union", unionTypeId = "union_type_id", unionName = "union_name"
        case productionTier = "production_tier", startDate = "start_date", totalHours = "total_hours"
        case hourlyRate = "hourly_rate", daysWorked = "days_worked", hoursPerDay = "hours_per_day"
        case mealBreakMinutes = "meal_break_minutes", overtimeHours = "overtime_hours"
        case unionMinimumRate = "union_minimum_rate", ratePosition = "rate_position", grossEarnings = "gross_earnings"
    }

    var isBelowScale: Bool {
        guard isUnion, let r = hourlyRate, let m = unionMinimumRate else { return false }
        return r < m - 0.004
    }
}

@MainActor @Observable
final class JobsStore {
    private(set) var jobs: [Job] = []
    private(set) var isLoading = false
    var error: String?

    var totals: (hours: Double, union: Double, earnings: Double) {
        let confirmed = jobs.filter { $0.status != "TENTATIVE" }
        return (confirmed.reduce(0) { $0 + $1.totalHours },
                confirmed.filter(\.isUnion).reduce(0) { $0 + $1.totalHours },
                confirmed.reduce(0) { $0 + ($1.grossEarnings ?? 0) })
    }

    /// Productions and companies already logged, for suggestions.
    var knownProductions: [Job] {
        var seen = Set<String>()
        return jobs.filter { seen.insert($0.productionName.lowercased()).inserted }
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            jobs = try await Backend.client.from("jobs").select()
                .order("start_date", ascending: false).execute().value
            error = nil
        } catch {
            self.error = "Couldn't load your jobs. Pull to try again."
        }
    }

    func add(_ job: Job) async throws {
        var job = job
        job.userId = Backend.client.auth.currentUser?.id
        let saved: Job = try await Backend.client.from("jobs").insert(job).select().single().execute().value
        jobs.insert(saved, at: 0)
        jobs.sort { $0.startDate > $1.startDate }
    }

    func delete(_ job: Job) async {
        guard let id = job.id else { return }
        do {
            try await Backend.client.from("jobs").delete().eq("id", value: id).execute()
            jobs.removeAll { $0.id == id }
        } catch {
            self.error = "Couldn't delete that job."
        }
    }

    func clear() { jobs = [] }
}
