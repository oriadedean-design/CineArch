import SwiftUI
import CineArchKit

// Your Wrap: progress toward each union you're working toward. Days on a
// union set count whether or not you're a member yet (permit work).
struct WrapView: View {
    @Environment(Session.self) private var session
    @Environment(JobsStore.self) private var jobs
    @Environment(TrackingStore.self) private var tracking
    @Environment(EngineStore.self) private var store
    @State private var showAuth = false
    @State private var editing: TrackedUnion?
    @State private var showAdd = false
    @State private var showNotes = UserDefaults.standard.bool(forKey: "cinearch.notes")   // `-cinearch.notes YES` for screenshots

    var body: some View {
        NavigationStack {
            Group {
                if session.isSignedIn { content } else { signedOut }
            }
            .navigationTitle("Your Wrap")
            .previewBadge()
            .toolbar {
                if session.isSignedIn {
                    ToolbarItem(placement: .topBarTrailing) { NotesBell(count: visibleNotes.count) { showNotes = true } }
                }
            }
            .sheet(isPresented: $showNotes) { NotesView(notes: notes) }
            .task(id: notes.map(\.id)) { await Notes.scheduleReminders(notes) }
            .sheet(isPresented: $showAuth) { AuthSheet(reason: "Sign in or create an account to track your days toward your union card.") {} }
            .sheet(isPresented: $showAdd) { TrackUnionSheet(existing: nil) }
            .sheet(item: $editing) { TrackUnionSheet(existing: $0) }
            .task(id: session.identity) {
                async let a: Void = jobs.use(session.place)
                async let b: Void = tracking.use(session.place)
                _ = await (a, b)
            }
        }
    }

    private var notes: [Note] {
        session.isSignedIn ? Notes.make(jobs: jobs.jobs, tracks: tracking.tracks, engine: store.engine) : []
    }
    private var earnedThisYear: Double {
        let year = String(Calendar.current.component(.year, from: Date()))
        return jobs.jobs.filter { $0.status != "TENTATIVE" && $0.startDate.hasPrefix(year) }.reduce(0) { $0 + ($1.grossEarnings ?? 0) }
    }
    private var visibleNotes: [Note] { notes.filter { !Notes.dismissed.contains($0.id) } }

    private var signedOut: some View { LookAroundWrap { showAuth = true } }

    private var content: some View {
        let progress = tracking.tracks.map { TrackProgress(track: $0, jobs: jobs.jobs, engine: store.engine) }
        let confirmed = jobs.jobs.filter { $0.status != "TENTATIVE" }
        let unionHours = confirmed.filter(\.isUnion).reduce(0) { $0 + $1.totalHours }
        let otherHours = confirmed.filter { !$0.isUnion }.reduce(0) { $0 + $1.totalHours }
        let belowScale = confirmed.filter(\.isBelowScale).count
        return ScrollViewReader { proxy in List {
            Section {
                ForEach(progress) { p in
                    Button { editing = p.track } label: { TrackRow(progress: p) }
                        .buttonStyle(.plain)
                }
                .onDelete { idx in
                    let doomed = idx.map { progress[$0].track }
                    Task { for t in doomed { await tracking.remove(t) } }
                }
                Button { showAdd = true } label: { Label("Track a union", systemImage: "plus.circle.fill") }
            } header: {
                Text("Getting your card")
            } footer: {
                Text("Days on a union set count toward that union even before you're a member. When you mark the slate, pick the union whose set it was.")
            }

            Section("Your year on set") { JobTimeline(jobs: jobs.jobs) }
            Section("Income this year") {
                IncomeChart(jobs: jobs.jobs, showGSTLine: session.isPremium, goal: session.profile?.earningGoal)
                ProNudge(id: "gst-line", title: "You've earned \(earnedThisYear.money) this year.",
                         detail: "\(Plan.pro.name) tracks it against the $30k GST/HST line and estimates what to set aside for CPP and income tax.")
            }
            .id("income")
            Section {
                ComingUp(deadlines: store.engine.snapshot.deadlines ?? [], progress: progress, jobs: jobs.jobs, engine: store.engine)
            } header: { Text("Coming up") } footer: { Text("Tap a tax date to open its source.") }
            .id("coming-up")

            Section("Your hours") {
                LabeledContent("On union sets", value: unionHours.hours)
                LabeledContent("Non-union", value: otherHours.hours)
                LabeledContent("Earned", value: jobs.totals.earnings.money)
                if belowScale > 0 {
                    LabeledContent("Paid below scale") {
                        Text(belowScale == 1 ? "1 job" : "\(belowScale) jobs").foregroundStyle(.red)
                    }
                }
            }
            if let e = tracking.error ?? jobs.error { Section { Text(e).foregroundStyle(.red) } }
        }
        .refreshable { await jobs.load(); await tracking.load() }
        // `-cinearch.scrollTo coming-up` opens scrolled down (for screenshots).
        .onAppear { if let id = UserDefaults.standard.string(forKey: "cinearch.scrollTo") { proxy.scrollTo(id, anchor: .top) } }
        }
    }
}

struct TrackRow: View {
    let progress: TrackProgress
    var body: some View {
        let t = progress.track
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(t.unionName).font(Theme.serif(.title3))
                    Text(t.tierLabel).font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Text("\(Int((progress.fraction * 100).rounded()))%")
                    .font(Theme.serif(.title)).foregroundStyle(Theme.accent).monospacedDigit()
            }
            SquareProgress(value: progress.fraction)
            HStack {
                Text("\(t.format(progress.current)) of \(t.format(t.targetValue)) \(t.unit)\(progress.windowMonths.map { " in \($0) months" } ?? "")\(t.countsFrom.map { " since \($0)" } ?? "")")
                Spacer()
                Text(progress.remaining > 0 ? "\(t.format(progress.remaining)) to go" : "Ready to apply!")
                    .foregroundStyle(progress.remaining > 0 ? Color.secondary : Theme.accent)
            }
            .font(.caption).monospacedDigit()
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
    }
}

// Pick a union and the level you're aiming for, plus anything already banked.
struct TrackUnionSheet: View {
    @Environment(EngineStore.self) private var store
    @Environment(TrackingStore.self) private var tracking
    @Environment(\.dismiss) private var dismiss
    let existing: TrackedUnion?

    @State private var unionId = ""
    @State private var tierName = ""
    @State private var bankedText = ""
    @State private var since = Date()
    @State private var hasSince = false
    @State private var saving = false
    @State private var error: String?

    private var unions: [Union] { store.engine.unions.filter { !$0.tiers.isEmpty } }
    private var union: Union? { store.engine.union(unionId) }
    private var tier: Union.Tier? { union?.tiers.first { $0.name == tierName } ?? union?.tiers.first }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Picker("Union", selection: $unionId) {
                        Text("Choose…").tag("")
                        ForEach(unions) { Text($0.name).tag($0.id) }
                    }
                    .disabled(existing != nil)
                    if let union, union.tiers.count > 1 {
                        Picker("Aiming for", selection: $tierName) {
                            ForEach(union.tiers, id: \.name) { t in
                                Text(t.province.map { "\(t.name) · \($0)" } ?? t.name).tag(t.name)
                            }
                        }
                        .pickerStyle(.navigationLink)
                    }
                } footer: {
                    if let tier { Text(tier.description ?? "") }
                }
                if let tier {
                    let draft = TrackedUnion(unionTypeId: unionId, unionName: "", tierLabel: tier.name, targetType: tier.targetType, targetValue: tier.targetValue)
                    Section {
                        LabeledContent("Target", value: "\(draft.format(tier.targetValue)) \(draft.unit)")
                        HStack {
                            Text("Already banked")
                            Spacer()
                            TextField("0", text: $bankedText).keyboardType(.decimalPad).multilineTextAlignment(.trailing).frame(maxWidth: 100)
                            Text(draft.unit).foregroundStyle(.secondary)
                        }
                    } footer: {
                        Text("Union-set work from before you started logging in CineArch.")
                    }
                    if let label = tier.startLabel {
                        Section {
                            Toggle(label, isOn: $hasSince)
                            if hasSince { DatePicker("Date", selection: $since, in: ...Date(), displayedComponents: .date) }
                        } footer: {
                            Text("Only work on or after this date counts. Joined before October 31, 2012? Up to 800 earlier hours count too.")
                        }
                    }
                }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .navigationTitle(existing == nil ? "Track a union" : "Edit")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { Task { await save() } }.disabled(tier == nil || saving)
                }
            }
            .onAppear {
                guard let existing else { return }
                unionId = existing.unionTypeId
                tierName = existing.tierLabel
                bankedText = existing.startingValue > 0 ? existing.startingValue.formatted(.number.grouping(.never)) : ""
                if let d = existing.countsFrom.flatMap(Date.init(isoDay:)) { since = d; hasSince = true }
            }
            .onChange(of: unionId) { if existing == nil || unionId != existing?.unionTypeId { tierName = union?.tiers.first?.name ?? "" } }
        }
    }

    private func save() async {
        guard let union, let tier else { return }
        saving = true
        defer { saving = false }
        let banked = Double(bankedText.replacingOccurrences(of: ",", with: ".")) ?? 0
        do {
            try await tracking.save(TrackedUnion(unionTypeId: union.id, unionName: union.name, tierLabel: tier.name,
                                                 targetType: tier.targetType, targetValue: tier.targetValue, startingValue: banked,
                                                 countsFrom: tier.startLabel != nil && hasSince ? since.isoDay : nil))
            dismiss()
        } catch {
            self.error = "Couldn't save: \(error.localizedDescription)"
        }
    }
}
