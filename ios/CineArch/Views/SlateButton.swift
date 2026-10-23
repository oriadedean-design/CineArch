import SwiftUI
import CineArchKit

// The floating clapperboard: one tap to mark today's slate.
struct SlateButton: View {
    @Environment(Session.self) private var session
    @State private var showSlate = UserDefaults.standard.bool(forKey: "cinearch.slate")   // `-cinearch.slate YES` opens it (screenshots)
    @State private var showAuth = false
    @State private var claps = 0

    var body: some View {
        Button {
            claps += 1
            if session.isSignedIn { showSlate = true } else { showAuth = true }
        } label: {
            Image(systemName: "movieclapper.fill")
                .font(.system(size: 24, weight: .semibold))
                .foregroundStyle(.black)
                .symbolEffect(.bounce, value: claps)
                .frame(width: 60, height: 60)
                .background(Theme.accent)   // square: film frames, sensors and slates are
                .shadow(color: Theme.accent.opacity(0.35), radius: 12, y: 4)
        }
        .sensoryFeedback(.impact(weight: .medium), trigger: claps)
        .accessibilityLabel("Mark the slate: add a job")
        .sheet(isPresented: $showSlate) { MarkSlateSheet() }
        // Signed in from here? Carry on to the slate once sign-in closes.
        .sheet(isPresented: $showAuth, onDismiss: { if session.isSignedIn { showSlate = true } }) {
            AuthSheet(reason: "Sign in or create an account to mark the slate. Every day you log counts toward your union card.",
                      alternative: ("Just work out pay (no account)", AnyView(CalculatorView(onSaved: {})))) {}
        }
    }
}

// Back to one: same as last day (one tap), or a new job through the pay calculator.
struct MarkSlateSheet: View {
    @Environment(EngineStore.self) private var store
    @Environment(Session.self) private var session
    @Environment(JobsStore.self) private var jobs
    @Environment(\.dismiss) private var dismiss

    @State private var date = Date()
    @State private var saving = false
    @State private var saved = false
    @State private var error: String?

    var body: some View {
        if !session.isSignedIn {
            CalculatorView(onSaved: { dismiss() })
        } else {
            NavigationStack {
                List {
                    if let last = jobs.lastJob {
                        repeatSection(last)
                    }
                    Section {
                        NavigationLink {
                            PayForm(onSaved: { dismiss() }).navigationTitle("New job")
                        } label: {
                            Label(jobs.lastJob == nil ? "Mark your first day" : "A different job", systemImage: "square.and.pencil")
                        }
                    } footer: { Group {
                        Text("Say which union the production was under. Days on a union production count toward joining, even before you're a member.")
                    }.font(Theme.sans(.footnote)) }
                    if let error { Section { Text(error).foregroundStyle(.red) } }
                }
                .navigationTitle("Mark the slate")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } } }
                .task {
                    if jobs.jobs.isEmpty { await jobs.load() }
                    // The union minimum for "same as last day" needs that schedule's rates.
                    if let last = jobs.lastJob, last.isUnion, let u = last.unionTypeId {
                        await store.ensureLines(store.engine.schedules(u).map(\.id))
                    }
                }
                .sensoryFeedback(.success, trigger: saved)
            }
        }
    }

    private func repeatSection(_ last: Job) -> some View {
        let next = repeatJob(last)
        return Section {
            VStack(alignment: .leading, spacing: 4) {
                Text(last.productionName).font(Theme.serif(.title3))
                Text("\(last.role) · \(last.companyName)").font(Theme.sans(.subheadline)).foregroundStyle(.secondary)
                Text([last.unionName.map { "Union · \($0)" } ?? "Non-union", next.totalHours.hours, (next.grossEarnings ?? 0).money].joined(separator: " · "))
                    .font(Theme.sans(.caption)).foregroundStyle(.secondary).monospacedDigit()
            }
            .padding(.vertical, 2)
            DatePicker("Day", selection: $date, displayedComponents: .date)
            Button {
                Task { await save(next) }
            } label: {
                Label(saving ? "Saving…" : "Mark it", systemImage: "movieclapper")
                    .frame(maxWidth: .infinity).font(Theme.sans(.headline))
            }
            .buttonStyle(.borderedProminent)
            .foregroundStyle(.black)
            .disabled(saving)
            .listRowBackground(Color.clear)
            .listRowInsets(EdgeInsets())
        } header: {
            Text("Back to one")
        } footer: { Group {
            Text("Same as your last day, on a new date.")
        }.font(Theme.sans(.footnote)) }
    }

    /// One more day like the last one logged, priced again for the chosen date.
    private func repeatJob(_ last: Job) -> Job {
        let perDayHours = last.hoursPerDay ?? (last.totalHours / Double(max(1, last.workedDays)))
        let input = JobInput(isUnion: last.isUnion, unionId: last.unionTypeId, role: last.role, date: date.isoDay,
                             productionType: last.productionTier, ratePosition: last.ratePosition,
                             hoursPerDay: last.hoursPerDay, mealMinutes: Double(last.mealBreakMinutes), days: 1,
                             hourlyRate: last.hourlyRate)
        let priced = last.hoursPerDay != nil ? store.engine.price(input) : nil
        var job = last
        job.id = nil
        job.status = "CONFIRMED"
        job.startDate = date.isoDay
        job.endDate = nil
        job.daysWorked = 1
        if let pay = priced?.pay {
            job.totalHours = pay.totalHours
            job.overtimeHours = pay.totalOvertimeHours
            job.grossEarnings = pay.gross
            job.unionMinimumRate = priced?.minimum?.hourly ?? last.unionMinimumRate
        } else {
            // Logged without day details (e.g. imported): split the last job evenly.
            let days = Double(max(1, last.workedDays))
            job.totalHours = perDayHours
            job.overtimeHours = last.overtimeHours / days
            job.grossEarnings = last.grossEarnings.map { $0 / days }
        }
        return job
    }

    private func save(_ job: Job) async {
        saving = true
        defer { saving = false }
        do {
            try await jobs.add(job)
            saved.toggle()
            dismiss()
        } catch {
            self.error = "Couldn't save: \(error.localizedDescription)"
        }
    }
}
