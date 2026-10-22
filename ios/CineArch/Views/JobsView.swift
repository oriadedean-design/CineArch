import SwiftUI
import CineArchKit

// Your logged work, synced with the website.
struct JobsView: View {
    @Environment(Session.self) private var session
    @Environment(RepresentationStore.self) private var representation
    @Environment(JobsStore.self) private var jobs
    @Environment(TrackingStore.self) private var tracking
    @Environment(EngineStore.self) private var store
    @State private var showAuth = false
    @State private var showBulk = false
    @State private var showPlans = false
    @State private var proofFor: Job?
    @State private var show = Show.all
    @State private var agent: String?
    @Binding var tab: RootView.Tab

    var body: some View {
        NavigationStack {
            Group {
                if !session.isSignedIn {
                    LookAroundSlate { showAuth = true }
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
            .sheet(isPresented: $showAuth) { AuthSheet(reason: "Sign in or create an account to mark the slate on every day you work.") {} }
            .task(id: session.identity) {
                async let a: Void = jobs.use(session.place)
                async let b: Void = tracking.use(session.place)
                _ = await (a, b)
            }
        }
    }

    enum Show: String, CaseIterable, Identifiable {
        case all = "All", union = "Union", nonUnion = "Non-union", needsProof = "Needs proof", pencilled = "Pencilled in"
        var id: String { rawValue }
    }

    private var shown: [Job] {
        jobs.jobs.filter { j in
            let kind: Bool = switch show {
            case .all: true
            case .union: j.isUnion
            case .nonUnion: !j.isUnion
            case .needsProof: j.status != "TENTATIVE" && j.isUnion && !j.isGreenLit
            case .pencilled: j.status == "TENTATIVE"
            }
            return kind && (agent == nil || j.agentName == agent)
        }
    }

    private var list: some View {
        let progress = tracking.tracks.map { TrackProgress(track: $0, jobs: jobs.jobs, engine: store.engine) }
        let primary = progress.filter { $0.fraction < 1 }.max { $0.fraction < $1.fraction } ?? progress.first
        let rows = shown
        let needsProof = jobs.jobs.filter { $0.status != "TENTATIVE" && $0.isUnion && !$0.isGreenLit }.count
        return List {
            Section {
                if let p = primary {
                    SlateHeadline(progress: p)
                } else {
                    Button { tab = .wrap } label: {
                        Label("Track a union to see your days add up here", systemImage: "chart.bar.fill")
                    }
                }
            } header: {
                HintedHeader(title: session.unionGoalsTitle, hint: "Your closest union goal. Every union day you mark here counts toward it, member or not. Set goals on Your Wrap.")
            }

            if jobs.jobs.isEmpty && !jobs.isLoading {
                Section { Text("Nothing in the can yet. Tap the clapperboard to mark your first day.").foregroundStyle(.secondary) }
            } else {
                Section {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(Show.allCases) { s in
                                FilterChip(title: s == .needsProof && needsProof > 0 ? "\(s.rawValue) (\(needsProof))" : s.rawValue, on: show == s) { show = s }
                            }
                            if !jobs.agents.isEmpty {
                                Menu {
                                    Button("Any agent") { agent = nil }
                                    ForEach(jobs.agents, id: \.self) { a in Button(a) { agent = a } }
                                } label: {
                                    FilterChip(title: agent ?? "Agent", on: agent != nil, systemImage: "person.crop.square") {}
                                        .allowsHitTesting(false)
                                }
                            }
                        }
                        .padding(.vertical, 2)
                    }
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                } footer: { Group {
                    if let a = agent {
                        let worked = rows.filter { $0.status != "TENTATIVE" }
                        let total = worked.reduce(0) { $0 + ($1.grossEarnings ?? 0) }
                        let cut = worked.reduce(0) { $0 + representation.commissions(on: $1).filter { $0.representative.name == a }.reduce(0) { $0 + $1.amount } }
                        Text("\(rows.count) job\(rows.count == 1 ? "" : "s") booked by \(a), \(total.money)\(cut > 0 ? ". Their commission: \(cut.money)" : "").")
                    } else if show == .needsProof {
                        Text("Union days with no pay stub yet. Tap one to back it with proof.")
                    }
                }.font(Theme.sans(.footnote)) }
            }

            Section {
                ForEach(rows) { j in
                    Button { proofFor = j } label: { JobRow(job: j, showProof: session.isPremium) }.buttonStyle(.plain)
                }
                .onDelete { idx in
                    let doomed = idx.map { rows[$0] }
                    Task { for j in doomed { await jobs.delete(j) } }
                }
                if rows.isEmpty && !jobs.jobs.isEmpty {
                    Text("No jobs match.").foregroundStyle(.secondary)
                }
            } header: {
                if !jobs.jobs.isEmpty {
                    HintedHeader(title: "\(rows.count) on the slate", hint: "Tap a job to see it in full, say which agent booked it, and back it with a pay stub. Swipe left to delete.")
                }
            }
            if let e = jobs.error { Section { Text(e).foregroundStyle(.red) } }
        }
        .refreshable { await jobs.load() }
        .overlay { if jobs.isLoading && jobs.jobs.isEmpty { ProgressView() } }
        .contentMargins(.bottom, 96, for: .scrollContent)     // clear of the clapperboard
    }
}

/// The big number on the Slate: your closest union goal.
struct SlateHeadline: View {
    let progress: TrackProgress
    var body: some View {
        let t = progress.track
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                Text(t.format(progress.current)).font(Theme.serif(.largeTitle)).monospacedDigit()
                Text("of \(t.format(t.targetValue)) \(t.unit)").foregroundStyle(.secondary)
                Spacer()
                Text("\(Int((progress.fraction * 100).rounded()))%").font(Theme.serif(.title2)).foregroundStyle(Theme.accent)
            }
            SquareProgress(value: progress.fraction)
            Text("\(t.unionName) · \(t.tierLabel)\(progress.remaining > 0 ? " · \(t.format(progress.remaining)) to go" : "")")
                .font(Theme.sans(.caption)).foregroundStyle(.secondary)
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .combine)
    }
}

/// A filter you tap on or off.
struct FilterChip: View {
    let title: String
    let on: Bool
    var systemImage: String?
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                if let systemImage { Image(systemName: systemImage) }
                Text(title)
            }
            .font(Theme.sans(.subheadline).weight(on ? .semibold : .regular))
            .padding(.horizontal, 12).padding(.vertical, 6)
            .foregroundStyle(on ? Color.black : .primary)
            .background(on ? Theme.accent : Color.secondary.opacity(0.18))
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

struct JobRow: View {
    let job: Job
    var showProof = false
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .firstTextBaseline) {
                Text(job.productionName).font(Theme.sans(.headline)).lineLimit(1)
                Spacer()
                Text((job.grossEarnings ?? 0).money).monospacedDigit()
            }
            HStack(spacing: 6) {
                Text(Date(isoDay: job.startDate)?.formatted(.dateTime.month(.abbreviated).day()) ?? job.startDate)
                Text("·"); Text(job.workedDays > 1 ? "\(job.workedDays) days" : job.totalHours.hours)
                Text("·"); Text(job.unionName ?? "Non-union")
                Spacer()
                if job.status == "TENTATIVE" {
                    Text("Pencilled in").foregroundStyle(Theme.accent)
                } else if job.isBelowScale {
                    Text("Below scale").foregroundStyle(.red)
                } else if showProof && job.isUnion {
                    Image(systemName: job.isGreenLit ? "checkmark.seal.fill" : "seal")
                        .foregroundStyle(job.isGreenLit ? Color.green : .secondary)
                        .accessibilityLabel(job.isGreenLit ? "Green Lit" : "Needs a pay stub")
                }
            }
            .font(Theme.sans(.caption)).foregroundStyle(.secondary).lineLimit(1)
        }
        .padding(.vertical, 2)
        .contentShape(Rectangle())
    }
}
