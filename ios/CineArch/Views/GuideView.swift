import SwiftUI
import CineArchKit

// Unions, what they cover, how to join and their minimum rates. No sign-in needed.
struct GuideView: View {
    @Environment(EngineStore.self) private var store
    @State private var search = ""

    private var unions: [Union] {
        let all = store.engine.unions
        guard !search.isEmpty else { return all }
        return all.filter { $0.name.localizedCaseInsensitiveContains(search) || ($0.description ?? "").localizedCaseInsensitiveContains(search) }
    }

    var body: some View {
        NavigationStack {
            List(unions) { u in
                NavigationLink(value: u) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(u.name).font(.headline)
                        if let scope = u.scope { Text(scope).font(.subheadline).foregroundStyle(.secondary).lineLimit(2) }
                    }
                    .padding(.vertical, 4)
                }
            }
            .overlay { EngineStatus() }
            .navigationTitle("Union Guide")
            .navigationDestination(for: Union.self) { UnionDetailView(union: $0) }
            .searchable(text: $search, prompt: "Search unions")
            .refreshable { await store.refresh() }
        }
    }
}

/// Loading / offline message while the guide has no data.
struct EngineStatus: View {
    @Environment(EngineStore.self) private var store
    var body: some View {
        if !store.isReady {
            if let error = store.error {
                ContentUnavailableView("Offline", systemImage: "wifi.slash", description: Text(error))
            } else {
                ProgressView("Loading unions…")
            }
        }
    }
}

struct UnionDetailView: View {
    @Environment(EngineStore.self) private var store
    let union: Union

    private var today: String { Date().isoDay }

    var body: some View {
        List {
            if let d = union.description { Section { Text(d) } }

            let schedules = store.engine.currentSchedules(union.id, on: today)
            if !schedules.isEmpty {
                Section("Minimum rates") {
                    ForEach(schedules) { s in
                        NavigationLink(s.productionType ?? s.title) { RateScheduleView(schedule: s) }
                    }
                }
            }

            let rules = store.engine.snapshot.payRules.filter { $0.unionId == union.id }
            if !rules.isEmpty {
                Section("Hours and overtime") {
                    ForEach(rules) { r in
                        VStack(alignment: .leading, spacing: 6) {
                            if r.departmentId != nil { Text(r.title).font(.subheadline.bold()) }
                            if let call = r.minimumCallHours { Label("\(call.hours) minimum call", systemImage: "clock") }
                            if !r.overtimeAfter.isEmpty { Label(Pay.describeOvertime(r), systemImage: "chart.line.uptrend.xyaxis") }
                            if let notes = r.mealBreakNotes { Text(notes).font(.footnote).foregroundStyle(.secondary) }
                        }
                    }
                }
            }

            if !union.tiers.isEmpty {
                Section("Membership levels") {
                    ForEach(union.tiers, id: \.self) { t in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(t.name).font(.headline)
                            Text(tierTarget(t)).font(.subheadline).foregroundStyle(Theme.accent)
                            if let d = t.description { Text(d).font(.footnote).foregroundStyle(.secondary) }
                            if t.isConfirmed, let s = t.sourceUrl, let url = URL(string: s) {
                                Link("Source", destination: url).font(.footnote)
                            } else if !t.isConfirmed {
                                Text("Not confirmed by the union yet").font(.footnote).foregroundStyle(Theme.accent)
                            }
                        }
                    }
                }
            }

            let reqs = union.requirements
            if !reqs.isEmpty {
                Section("How to join") {
                    ForEach(reqs, id: \.self) { r in Text(r.text).font(.subheadline) }
                }
            }

            Section("Contact") {
                if let w = union.website, let url = URL(string: w) { Link(destination: url) { Label("Website", systemImage: "safari") } }
                if let e = union.contactEmail, let url = URL(string: "mailto:\(e)") { Link(destination: url) { Label(e, systemImage: "envelope") } }
                if let p = union.contactPhone, let url = URL(string: "tel:\(p.filter { $0.isNumber || $0 == "+" })") { Link(destination: url) { Label(p, systemImage: "phone") } }
            }
        }
        .navigationTitle(union.name)
        .navigationBarTitleDisplayMode(.large)
    }

    private func tierTarget(_ t: Union.Tier) -> String {
        let v = t.targetValue.formatted()
        switch t.targetType {
        case "HOURS": return "\(v) hours"
        case "DAYS": return "\(v) days"
        case "EARNINGS": return "\(t.targetValue.money) earned"
        case "CREDITS": return "\(v) credits"
        default: return v
        }
    }
}

struct RateScheduleView: View {
    @Environment(EngineStore.self) private var store
    let schedule: RateSchedule
    @State private var search = ""

    var body: some View {
        let positions = store.engine.positions(schedule).filter { search.isEmpty || $0.position.localizedCaseInsensitiveContains(search) }
        let groups = Dictionary(grouping: positions, by: \.department)
        let order = positions.map(\.department).reduce(into: [String]()) { if !$0.contains($1) { $0.append($1) } }
        List {
            Section { Text(schedule.title).font(.footnote).foregroundStyle(.secondary) }
            ForEach(order, id: \.self) { dept in
                Section(dept) {
                    ForEach(groups[dept] ?? [], id: \.self) { m in
                        HStack {
                            Text(m.position)
                            Spacer()
                            VStack(alignment: .trailing) {
                                Text(m.hourly.map { "\($0.money)/h" } ?? "Negotiable").monospacedDigit()
                                if let d = m.daily { Text("\(d.money)/day").font(.caption).foregroundStyle(.secondary).monospacedDigit() }
                            }
                        }
                    }
                }
            }
        }
        .overlay { if store.engine.lines[schedule.id] == nil { ProgressView() } }
        .navigationTitle(schedule.productionType ?? "Rates")
        .searchable(text: $search, prompt: "Search positions")
        .task { await store.ensureLines([schedule.id]) }
    }
}
