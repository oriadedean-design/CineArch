import SwiftUI

// Your logged work, synced with the website.
struct JobsView: View {
    @Environment(Session.self) private var session
    @Environment(JobsStore.self) private var jobs
    @State private var showAuth = false
    @State private var showBulk = false
    @State private var showPlans = false
    @State private var proofFor: Job?

    var body: some View {
        NavigationStack {
            Group {
                if !session.isSignedIn {
                    ContentUnavailableView {
                        Label("Your Slate", systemImage: "list.bullet.rectangle")
                    } description: {
                        Text("Sign in to mark the slate on every day you work, see your hours and earnings, and pick up where you left off on the website.")
                    } actions: {
                        Button("Sign in or create account") { showAuth = true }.buttonStyle(.borderedProminent).foregroundStyle(.black)
                    }
                } else {
                    list
                }
            }
            .navigationTitle("Your Slate")
            .previewBadge()
            .toolbar {
                if session.isSignedIn {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button { if session.isPremium { showBulk = true } else { showPlans = true } } label: {
                            Label("Pay stubs in bulk", systemImage: session.isPremium ? "square.stack.3d.up" : "lock")
                        }
                        .accessibilityLabel(session.isPremium ? "Add jobs from pay stubs in bulk" : "Pay stubs in bulk is A-List Pro")
                    }
                }
            }
            .navigationDestination(isPresented: $showPlans) { PlansView() }
            .sheet(isPresented: $showBulk) { BulkPayStubsView() }
            .sheet(item: $proofFor) { JobProofSheet(job: $0) }
            .sheet(isPresented: $showAuth) { AuthSheet(reason: "Sign in to see your slate.") {} }
            .task(id: session.identity) {
                await jobs.use(session.place)
            }
        }
    }

    private var list: some View {
        let t = jobs.totals
        return List {
            Section {
                HStack {
                    stat("Hours", t.hours.hours)
                    stat("Union", t.union.hours)
                    stat("Earned", t.earnings.money)
                }
            }
            if jobs.jobs.isEmpty && !jobs.isLoading {
                Section { Text("Nothing in the can yet. Tap the clapperboard to mark your first day.").foregroundStyle(.secondary) }
            }
            if jobs.jobs.count >= 10 {
                Section {
                    ProNudge(id: "ledger-reports", title: "\(jobs.jobs.count) jobs on your Slate.",
                             detail: "Your Ledger turns them into a PDF or spreadsheet for union applications and tax time. \(Plan.pro.name), on the website.")
                }
            }
            Section {
                ForEach(jobs.jobs) { j in
                    if session.isPremium {
                        Button { proofFor = j } label: { JobRow(job: j, showProof: true) }.buttonStyle(.plain)
                    } else {
                        JobRow(job: j)
                    }
                }
                    .onDelete { idx in
                        let doomed = idx.map { jobs.jobs[$0] }
                        Task { for j in doomed { await jobs.delete(j) } }
                    }
            }
            if let e = jobs.error { Section { Text(e).foregroundStyle(.red) } }
        }
        .refreshable { await jobs.load() }
        .overlay { if jobs.isLoading && jobs.jobs.isEmpty { ProgressView() } }
    }

    private func stat(_ label: String, _ value: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(Theme.serif(.title3)).monospacedDigit().lineLimit(1).minimumScaleFactor(0.6)
            Text(label).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct JobRow: View {
    let job: Job
    var showProof = false
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                if showProof && job.status != "TENTATIVE" {
                    Image(systemName: job.isGreenLit ? "checkmark.square.fill" : "square.dashed")
                        .foregroundStyle(job.isGreenLit ? Color.green : .secondary)
                        .accessibilityLabel(job.isGreenLit ? "Green Lit" : "Needs a pay stub")
                }
                Text(job.productionName).font(.headline)
                Spacer()
                Text((job.grossEarnings ?? 0).money).monospacedDigit()
            }
            Text("\(job.role) · \(job.companyName)").font(.subheadline).foregroundStyle(.secondary)
            HStack(spacing: 6) {
                Text(Date(isoDay: job.startDate)?.formatted(date: .abbreviated, time: .omitted) ?? job.startDate)
                Text("·")
                Text(job.daysWorked > 1 ? "\(job.totalHours.hours) over \(job.daysWorked) days" : job.totalHours.hours)
                if let u = job.unionName { Text("·"); Text(u) }
                if job.isBelowScale { Text("· Below scale").foregroundStyle(.red) }
                if job.status == "TENTATIVE" { Text("· Pencilled in").foregroundStyle(Theme.accent) }
            }
            .font(.caption).foregroundStyle(.secondary)
        }
        .padding(.vertical, 2)
        .contentShape(Rectangle())
    }
}
