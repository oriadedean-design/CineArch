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
    var proofPath: String?           // pay stub in documents/<user>/proof/; with it the job is Green Lit
    var agentName: String?           // who booked it: the linked agency's name, or one typed in
    var agencyId: UUID?              // set when it's the agency linked to the account
    var representativeId: UUID?      // one of your representatives (Account > Your representation)

    enum CodingKeys: String, CodingKey {
        case id, status, role, department, province
        case userId = "user_id", productionName = "production_name", companyName = "company_name", endDate = "end_date"
        case isUnion = "is_union", unionTypeId = "union_type_id", unionName = "union_name"
        case productionTier = "production_tier", startDate = "start_date", totalHours = "total_hours"
        case hourlyRate = "hourly_rate", daysWorked = "days_worked", hoursPerDay = "hours_per_day"
        case mealBreakMinutes = "meal_break_minutes", overtimeHours = "overtime_hours"
        case unionMinimumRate = "union_minimum_rate", ratePosition = "rate_position", grossEarnings = "gross_earnings"
        case proofPath = "proof_path", agentName = "agent_name", agencyId = "agency_id", representativeId = "representative_id"
    }

    /// Days worked: the logged day count, else the inclusive date span (as services/career.ts).
    var workedDays: Int {
        if daysWorked > 1 { return daysWorked }
        guard let endDate, let a = Date(isoDay: startDate), let b = Date(isoDay: endDate), b >= a else { return 1 }
        return (Calendar(identifier: .gregorian).dateComponents([.day], from: a, to: b).day ?? 0) + 1
    }

    var isGreenLit: Bool { proofPath != nil }

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
        case .preview:
            // Sample union jobs come with a pay stub (Green Lit), to show the Union Pack.
            jobs = Sample.jobs.map { var j = $0; if j.isUnion && j.status != "TENTATIVE" { j.proofPath = "preview/proof/\(j.productionName)" }; return j }
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

    @discardableResult
    func add(_ job: Job) async throws -> Job {
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
        return job
    }

    /// Who booked a job: the linked agency, a typed name, or nobody.
    func setAgent(_ id: UUID, name: String?, agencyId: UUID?, representativeId: UUID? = nil) async {
        guard let i = jobs.firstIndex(where: { $0.id == id }) else { return }
        var updated = jobs
        updated[i].agentName = name; updated[i].agencyId = agencyId; updated[i].representativeId = representativeId
        do {
            switch place {
            case .phone(let user): try persist(updated, user: user)
            case .online:
                struct Agent: Encodable { let agent_name: String?; let agency_id: UUID?; let representative_id: UUID? }
                try await Backend.client.from("jobs").update(Agent(agent_name: name, agency_id: agencyId, representative_id: representativeId))
                    .eq("id", value: id).execute()
            default: break
            }
            jobs = updated
        } catch {
            self.error = "Couldn't save who booked it."
        }
    }

    /// Agents named on any job, for the Slate's filter.
    var agents: [String] { Array(Set(jobs.compactMap(\.agentName))).sorted() }

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

    /// Backs a job with its pay stub (A-List Pro): documents/<user>/proof/, then the job points at it.
    func attachProof(to job: Job, file: UploadFile, ledger: LedgerStore) async throws {
        guard let id = job.id else { return }
        switch place {
        case .preview: break
        case .online(let user):
            await ledger.loadUsage()
            guard ledger.usedBytes + Int64(file.data.count) <= Documents.accountLimitBytes else { throw LedgerStore.StorageFull() }
            let path = "\(user.uuidString.lowercased())/proof/job-\(id.uuidString.lowercased())-\(Int(Date().timeIntervalSince1970)).\(file.ext)"
            try await Backend.client.storage.from("documents").upload(path, data: file.data, options: FileOptions(contentType: file.contentType))
            try await Backend.client.from("jobs").update(["proof_path": path]).eq("id", value: id).execute()
            if let old = job.proofPath { _ = try? await Backend.client.storage.from("documents").remove(paths: [old]) }
            if let i = jobs.firstIndex(where: { $0.id == id }) { jobs[i].proofPath = path }
            await ledger.loadUsage()
            return
        default: throw ProOnly()
        }
        if let i = jobs.firstIndex(where: { $0.id == id }) { jobs[i].proofPath = "preview/proof/\(id)" }
    }

    /// A link to look at a job's pay stub, good for 5 minutes.
    func proofURL(_ job: Job) async -> URL? {
        guard let path = job.proofPath, case .online = place else { return nil }
        return try? await Backend.client.storage.from("documents").createSignedURL(path: path, expiresIn: 300)
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

// MARK: Industry representation

/// An agent or manager you work with, and the commission they take.
struct Representative: Codable, Identifiable, Hashable {
    var id: UUID?
    var userId: UUID?
    var name: String
    var agency: String?
    var kind = "agent"                // agent, manager or other
    var commissionPct: Double         // 0 to 50
    var appliesTo = "booked"          // booked = jobs they book; all = every job
    var agencyId: UUID?               // the agency linked in Agency Mode

    enum CodingKeys: String, CodingKey {
        case id, name, agency, kind
        case userId = "user_id", commissionPct = "commission_pct", appliesTo = "applies_to", agencyId = "agency_id"
    }

    var kindName: String { kind == "manager" ? "Manager" : kind == "other" ? "Representative" : "Agent" }
    var takesFromEveryJob: Bool { appliesTo == "all" }
    var label: String { agency.map { "\(name), \($0)" } ?? name }
}

/// One person's cut of a job.
struct Commission: Hashable {
    let representative: Representative
    let amount: Double
}

/// Your representatives (public.representatives). An account setting, so it is
/// kept online for every signed-in account.
@MainActor @Observable
final class RepresentationStore {
    private(set) var reps: [Representative] = []
    private(set) var isPreview = false
    var error: String?

    func load(preview: Bool) async {
        isPreview = preview
        if preview {
            reps = [Representative(id: UUID(), name: "Dana Whitfield", agency: "Northstar Talent", commissionPct: 10)]
            return
        }
        guard Backend.client.auth.currentUser != nil else { reps = []; return }
        do {
            reps = try await Backend.client.from("representatives").select().order("created_at").execute().value
            error = nil
        } catch {
            self.error = "Couldn't load your representation."
        }
    }

    func save(_ rep: Representative) async throws {
        var rep = rep
        if isPreview {
            if rep.id == nil { rep.id = UUID(); reps.append(rep) } else if let i = reps.firstIndex(where: { $0.id == rep.id }) { reps[i] = rep }
            return
        }
        guard let user = Backend.client.auth.currentUser?.id else { throw SignInNeeded() }
        rep.userId = user
        if let id = rep.id {
            let saved: Representative = try await Backend.client.from("representatives").update(rep).eq("id", value: id).select().single().execute().value
            if let i = reps.firstIndex(where: { $0.id == id }) { reps[i] = saved }
        } else {
            let saved: Representative = try await Backend.client.from("representatives").insert(rep).select().single().execute().value
            reps.append(saved)
        }
    }

    func remove(_ rep: Representative) async {
        guard let id = rep.id else { return }
        if !isPreview {
            do { try await Backend.client.from("representatives").delete().eq("id", value: id).execute() }
            catch { self.error = "Couldn't remove \(rep.name)."; return }
        }
        reps.removeAll { $0.id == id }
    }

    /// Who takes a cut of a job, and how much: the person who booked it, plus
    /// anyone on commission for every job.
    func commissions(on job: Job) -> [Commission] {
        guard let gross = job.grossEarnings, gross > 0 else { return [] }
        return reps.filter { r in
            r.takesFromEveryJob || (job.representativeId != nil ? job.representativeId == r.id : job.agentName == r.name)
        }
        .map { Commission(representative: $0, amount: ((gross * $0.commissionPct / 100) * 100).rounded() / 100) }
    }

    func commissionTotal(_ jobs: [Job]) -> Double {
        jobs.filter { $0.status != "TENTATIVE" }.reduce(0) { $0 + commissions(on: $1).reduce(0) { $0 + $1.amount } }
    }
}
