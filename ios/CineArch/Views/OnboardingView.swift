import SwiftUI
import CineArchKit

// Setting the Scene: four questions, the same as the website's onboarding.
// Where you're based → what you do → your team → your goals (unions and earnings).
struct OnboardingView: View {
    @Environment(EngineStore.self) private var store
    @Environment(Session.self) private var session
    @Environment(TrackingStore.self) private var tracking
    @Environment(\.dismiss) private var dismiss

    static let provinces = ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
                            "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
                            "Quebec", "Saskatchewan", "Yukon"]
    static let ontarioRegions = [("TORONTO", "Toronto area"), ("NORTHERN_ON", "Northern Ontario"), ("OTTAWA", "Ottawa"), ("OTHER", "Elsewhere in Ontario")]

    enum Step: Int, CaseIterable { case base = 1, work, team, unions }

    @State private var step = Step.base
    @State private var province = "Ontario"
    @State private var region = "TORONTO"
    @State private var roles: [String] = []        // role names, first is the main one
    @State private var department: String?
    @State private var isMember = false
    @State private var hasAgent = false
    @State private var agentPct = ""
    @State private var unions: Set<String> = []
    @State private var goalText = ""
    @State private var saving = false
    @State private var error: String?

    private var engine: UnionEngine { store.engine }
    private var suggested: [String] {
        var seen = Set<String>()
        return roles.flatMap { engine.unionsCovering(role: $0, department: department, province: province, region: province == "Ontario" ? region : nil) }
            .filter { seen.insert($0).inserted }
    }
    private var local: [Union] {
        engine.unions.filter { u in !u.tiers.isEmpty && u.jurisdictions.contains { $0.province == province } }
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Setting the Scene · \(step.rawValue) of \(Step.allCases.count)").font(Theme.sans(.caption).weight(.heavy)).tracking(1.5).foregroundStyle(Theme.accent)
                        if step == .base {
                            Text("Give us the context, so we can shape CineArch around you.").font(Theme.sans(.subheadline)).foregroundStyle(.secondary)
                        }
                    }
                    .listRowBackground(Color.clear)
                }
                switch step {
                case .base: base
                case .work: work
                case .team: team
                case .unions: unionStep
                }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .navigationTitle(title)
            .safeAreaInset(edge: .bottom) { actions }
            .toolbar {
                if !session.needsOnboarding {
                    ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } }
                }
            }
            .onAppear(perform: prefill)
            .onChange(of: step) { if step == .unions && unions.isEmpty { unions = Set(suggested) } }
        }
        .interactiveDismissDisabled(session.profile?.isOnboarded != true)
    }

    private var title: String {
        switch step {
        case .base: "Your home base"
        case .work: "What you do"
        case .team: "Your team"
        case .unions: "Your goals"
        }
    }

    // MARK: Steps

    private var base: some View {
        Section {
            Picker("Province or territory", selection: $province) { ForEach(Self.provinces, id: \.self) { Text($0) } }
            if province == "Ontario" {
                Picker("Region", selection: $region) { ForEach(Self.ontarioRegions, id: \.0) { Text($0.1).tag($0.0) } }
            }
        } footer: { Group {
            Text("This decides which unions and rules apply to you.")
        }.font(Theme.sans(.footnote)) }
    }

    private var work: some View {
        ForEach(engine.snapshot.departments) { d in
            Section(d.name) {
                ForEach(d.roles) { r in
                    Button {
                        if let i = roles.firstIndex(of: r.name) { roles.remove(at: i) } else { roles.append(r.name) }
                        department = roles.isEmpty ? nil : department ?? d.name
                    } label: {
                        HStack {
                            Text(r.name).foregroundStyle(.primary)
                            Spacer()
                            Image(systemName: roles.contains(r.name) ? "checkmark.square.fill" : "square")
                                .foregroundStyle(roles.contains(r.name) ? Theme.accent : .secondary)
                        }
                    }
                    .accessibilityAddTraits(roles.contains(r.name) ? .isSelected : [])
                }
            }
        }
    }

    @ViewBuilder private var team: some View {
        Section {
            Picker("Union member yet?", selection: $isMember) {
                Text("Not yet").tag(false)
                Text("Yes, I'm a member").tag(true)
            }
            .pickerStyle(.inline).labelsHidden()
        } header: { Text("Are you a union member yet?") }
        Section {
            Picker("Agent", selection: $hasAgent) {
                Text("No agent").tag(false)
                Text("I have an agent").tag(true)
            }
            .pickerStyle(.inline).labelsHidden()
            if hasAgent {
                HStack {
                    Text("Their commission")
                    Spacer()
                    TextField("%", text: $agentPct).keyboardType(.decimalPad).numbersOnly($agentPct).multilineTextAlignment(.trailing).frame(maxWidth: 80)
                    Text("%").foregroundStyle(.secondary)
                }
            }
        } header: { Text("Do you have an agent?") } footer: { Group {
            Text("Up to 50%. They're added to Industry representation in Account, where you can add others and choose which jobs each takes a cut from.")
        }.font(Theme.sans(.footnote)) }
    }

    @ViewBuilder private var unionStep: some View {
        Section {
            HStack {
                Text("$").foregroundStyle(.secondary)
                TextField("Optional, e.g. 40000", text: $goalText).keyboardType(.numberPad).numbersOnly($goalText, decimals: false)
            }
        } header: { Text("Earning goal for \(String(Calendar.current.component(.year, from: Date())))") } footer: { Group {
            Text("What you'd like to earn from film work this year, before tax. Your Wrap shows how close you are.")
        }.font(Theme.sans(.footnote)) }
        let picked = suggested.compactMap { engine.union($0) }.filter { !$0.tiers.isEmpty }
        if !picked.isEmpty {
            Section {
                ForEach(picked) { unionRow($0, covers: true) }
            } header: { Text("Cover your roles in \(province)") } footer: { Group {
                Text("Tap the ones you're working toward. Days on their sets count, member or not.")
            }.font(Theme.sans(.footnote)) }
        }
        let others = local.filter { u in !picked.contains { $0.id == u.id } }
        if !others.isEmpty {
            Section("Other unions in \(province)") { ForEach(others) { unionRow($0, covers: false) } }
        }
    }

    private func unionRow(_ u: Union, covers: Bool) -> some View {
        Button {
            if unions.contains(u.id) { unions.remove(u.id) } else { unions.insert(u.id) }
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(u.name).foregroundStyle(.primary)
                    if let t = u.tiers.first { Text("Tracks: \(t.name)").font(Theme.sans(.caption)).foregroundStyle(.secondary) }
                }
                Spacer()
                Text(unions.contains(u.id) ? "Tracking" : "Tap to track").font(Theme.sans(.caption).bold())
                    .foregroundStyle(unions.contains(u.id) ? Theme.accent : .secondary)
                Image(systemName: unions.contains(u.id) ? "checkmark.square.fill" : "square")
                    .foregroundStyle(unions.contains(u.id) ? Theme.accent : .secondary)
            }
        }
        .accessibilityAddTraits(unions.contains(u.id) ? .isSelected : [])
    }

    // MARK: Actions

    private var nextLabel: String {
        switch step {
        case .base: "Next: what you do"
        case .work: roles.isEmpty ? "Pick at least one role" : "Next: your team"
        case .team: "Next: your goals"
        case .unions: saving ? "Saving…" : "Save and open Your Wrap"
        }
    }

    private var actions: some View {
        HStack(spacing: 12) {
            if step != .base {
                Button { step = Step(rawValue: step.rawValue - 1)! } label: { Text("Back").frame(maxWidth: 90, minHeight: 50) }
                    .buttonStyle(.bordered).buttonBorderShape(.roundedRectangle(radius: 0))
            }
            Button {
                if step == .unions { Task { await save() } } else { step = Step(rawValue: step.rawValue + 1)! }
            } label: {
                Text(nextLabel).font(Theme.sans(.headline)).frame(maxWidth: .infinity, minHeight: 50)
            }
            .buttonStyle(.borderedProminent).buttonBorderShape(.roundedRectangle(radius: 0)).foregroundStyle(.black)
            .disabled((step == .work && roles.isEmpty) || saving)
        }
        .padding(.horizontal, 16).padding(.vertical, 10)
        .background(.bar)
    }

    private func prefill() {
        guard let p = session.profile else { return }
        if let v = p.province, Self.provinces.contains(v) { province = v }
        if let v = p.region { region = v }
        roles = p.selectedRoles ?? []
        department = p.department
        isMember = p.memberStatus == "MEMBER"
        hasAgent = p.hasAgentFee ?? false
        if let pct = p.agentFeePct, pct > 0 { agentPct = pct.formatted(.number.grouping(.never)) }
        if let g = p.earningGoal, g > 0 { goalText = g.formatted(.number.grouping(.never)) }
        unions = Set(tracking.tracks.map(\.unionTypeId))
    }

    private func save() async {
        saving = true
        defer { saving = false }
        error = nil
        guard session.user != nil else { error = SignInNeeded().errorDescription; return }
        do {
            try await session.saveCallSheet(Profile.Update(
                province: province, region: province == "Ontario" ? region : nil, department: department,
                selected_roles: roles, role: roles.first, member_status: isMember ? "MEMBER" : "ASPIRING",
                has_agent_fee: hasAgent, agent_fee_pct: hasAgent ? min(50, Double(agentPct.replacingOccurrences(of: ",", with: ".")) ?? 0) : 0,
                earning_goal: Double(goalText.filter(\.isNumber))))
            for id in unions where !tracking.tracks.contains(where: { $0.unionTypeId == id }) {
                guard let u = engine.union(id), let t = u.tiers.first else { continue }
                try await tracking.save(TrackedUnion(unionTypeId: u.id, unionName: u.name, tierLabel: t.name,
                                                     targetType: t.targetType, targetValue: t.targetValue))
            }
            dismiss()
        } catch {
            self.error = "Couldn't save: \(error.localizedDescription)"
        }
    }
}
