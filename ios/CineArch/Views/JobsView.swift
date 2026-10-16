import SwiftUI

// Your logged work, synced with the website.
struct JobsView: View {
    @Environment(Session.self) private var session
    @Environment(JobsStore.self) private var jobs
    @State private var showAuth = false
    @State private var showNew = false

    var body: some View {
        NavigationStack {
            Group {
                if !session.isSignedIn {
                    ContentUnavailableView {
                        Label("Your jobs", systemImage: "list.bullet.rectangle")
                    } description: {
                        Text("Sign in to log your work, see your hours and earnings, and pick up where you left off on the website.")
                    } actions: {
                        Button("Sign in or create account") { showAuth = true }.buttonStyle(.borderedProminent)
                    }
                } else {
                    list
                }
            }
            .navigationTitle("Jobs")
            .toolbar {
                if session.isSignedIn {
                    Button { showNew = true } label: { Image(systemName: "plus") }.accessibilityLabel("Log a job")
                }
            }
            .sheet(isPresented: $showAuth) { AuthSheet(reason: "Sign in to see and log your jobs.") {} }
            .sheet(isPresented: $showNew) { CalculatorView(onSaved: { showNew = false }) }
            .task(id: session.user?.id) {
                if session.isSignedIn { await jobs.load() } else { jobs.clear() }
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
                Section { Text("No jobs yet. Tap + to log your first day.").foregroundStyle(.secondary) }
            }
            Section {
                ForEach(jobs.jobs) { j in JobRow(job: j) }
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
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
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
            }
            .font(.caption).foregroundStyle(.secondary)
        }
        .padding(.vertical, 2)
    }
}
