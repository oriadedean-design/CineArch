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
    var endDate: String?
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
        case userId = "user_id", productionName = "production_name", companyName = "company_name", endDate = "end_date"
        case isUnion = "is_union", unionTypeId = "union_type_id", unionName = "union_name"
        case productionTier = "production_tier", startDate = "start_date", totalHours = "total_hours"
        case hourlyRate = "hourly_rate", daysWorked = "days_worked", hoursPerDay = "hours_per_day"
        case mealBreakMinutes = "meal_break_minutes", overtimeHours = "overtime_hours"
        case unionMinimumRate = "union_minimum_rate", ratePosition = "rate_position", grossEarnings = "gross_earnings"
    }

    /// Days worked: the logged day count, else the inclusive date span (as services/career.ts).
    var workedDays: Int {
        if daysWorked > 1 { return daysWorked }
        guard let endDate, let a = Date(isoDay: startDate), let b = Date(isoDay: endDate), b >= a else { return 1 }
        return (Calendar(identifier: .gregorian).dateComponents([.day], from: a, to: b).day ?? 0) + 1
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
    private(set) var place = DataPlace.none
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

    /// Switches to an account's data: the sample, this phone (free) or online (Pro).
    func use(_ newPlace: DataPlace) async {
        if newPlace != place { place = newPlace; jobs = []; error = nil }
        switch place {
        case .none: jobs = []
        case .preview: jobs = Sample.jobs
        case .phone, .online: await load()
        }
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            switch place {
            case .phone(let user):
                // First time on the phone (new account, or no longer Pro): bring down what's online.
                if !OnDevice.exists("jobs", user: user) { try persist(await fetchOnline(), user: user) }
                jobs = (OnDevice.read("jobs", user: user) ?? []).sorted { $0.startDate > $1.startDate }
            case .online(let user):
                // Just went Pro: send up what was kept on this phone, then it lives online.
                if let local: [Job] = OnDevice.read("jobs", user: user), !local.isEmpty {
                    let rows = local.map { var j = $0; j.userId = user; return j }
                    try await Backend.client.from("jobs").upsert(rows, onConflict: "id").execute()
                }
                OnDevice.remove("jobs", user: user)
                jobs = try await fetchOnline()
            default: return
            }
            error = nil
        } catch {
            self.error = "Couldn't load your jobs. Pull to try again."
        }
    }

    private func fetchOnline() async throws -> [Job] {
        try await Backend.client.from("jobs").select().order("start_date", ascending: false).execute().value
    }

    private func persist(_ list: [Job], user: UUID) throws { try OnDevice.write(list, "jobs", user: user) }

    func add(_ job: Job) async throws {
        var job = job
        switch place {
        case .none: throw SignInNeeded()
        case .preview: job.id = UUID()
        case .phone(let user):
            job.id = UUID(); job.userId = user
            try persist([job] + jobs, user: user)
        case .online(let user):
            job.userId = user
            job = try await Backend.client.from("jobs").insert(job).select().single().execute().value
        }
        jobs.insert(job, at: 0)
        jobs.sort { $0.startDate > $1.startDate }
    }

    /// A pencilled-in job that happened: mark it worked so its days count.
    func confirm(_ id: UUID) async {
        guard let i = jobs.firstIndex(where: { $0.id == id }) else { return }
        var updated = jobs
        updated[i].status = "CONFIRMED"
        do {
            switch place {
            case .phone(let user): try persist(updated, user: user)
            case .online: try await Backend.client.from("jobs").update(["status": "CONFIRMED"]).eq("id", value: id).execute()
            default: break
            }
            jobs = updated
        } catch {
            self.error = "Couldn't confirm that job."
        }
    }

    /// The most recent day logged, for the slate's "same as last day".
    var lastJob: Job? { jobs.first }

    func delete(_ job: Job) async {
        guard let id = job.id else { return }
        let remaining = jobs.filter { $0.id != id }
        do {
            switch place {
            case .phone(let user): try persist(remaining, user: user)
            case .online: try await Backend.client.from("jobs").delete().eq("id", value: id).execute()
            default: break
            }
            jobs = remaining
        } catch {
            self.error = "Couldn't delete that job."
        }
    }
}
