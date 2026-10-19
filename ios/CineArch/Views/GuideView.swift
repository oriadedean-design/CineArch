import SwiftUI
import CineArchKit

// Unions, what they cover, how to join and their minimum rates, browsed by
// union, by role or by province (like the guide on the website). No sign-in needed.
struct GuideView: View {
    @Environment(EngineStore.self) private var store
    @Environment(Session.self) private var session
    @State private var search = ""
    @State private var by = By.unions
    @State private var province: String?

    enum By: String, CaseIterable, Identifiable {
        case unions = "Unions", roles = "Roles", provinces = "Province"
        var id: String { rawValue }
        var copy: String {
            switch self {
            case .unions: "Who represents film and TV crew and performers, how to join, and the minimum rates."
            case .roles: "Pick your job to see which union covers it where you work."
            case .provinces: "The unions working in each province and territory."
            }
        }
    }

    static let provinces = ["Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba", "Saskatchewan", "Nova Scotia",
                            "New Brunswick", "Newfoundland and Labrador", "Prince Edward Island", "Yukon", "Northwest Territories", "Nunavut"]

    private func matches(_ text: String) -> Bool { search.isEmpty || text.localizedCaseInsensitiveContains(search) }

    private var unions: [Union] {
        store.engine.unions.filter { u in
            (province == nil || u.jurisdictions.contains { $0.province == province })
                && (matches(u.name) || matches(u.description ?? "") || matches(u.scope ?? ""))
        }
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Picker("Browse by", selection: $by) { ForEach(By.allCases) { Text($0.rawValue).tag($0) } }
                        .pickerStyle(.segmented)
                    if by != .provinces {
                        Picker("Where you work", selection: $province) {
                            Text("All of Canada").tag(String?.none)
                            ForEach(Self.provinces, id: \.self) { Text($0).tag(String?.some($0)) }
                        }
                    }
                } footer: {
                    Text(by.copy)
                }
                switch by {
                case .unions: unionList
                case .roles: roleList
                case .provinces: provinceList
                }
            }
            .overlay { EngineStatus() }
            .navigationTitle("Union Guide")
            .navigationDestination(for: Union.self) { UnionDetailView(union: $0) }
            .navigationDestination(for: Department.Role.self) { RoleCoverageView(role: $0, province: province) }
            .navigationDestination(for: String.self) { ProvinceUnionsView(province: $0) }
            .searchable(text: $search, prompt: by == .roles ? "Search roles" : by == .provinces ? "Search provinces" : "Search unions")
            .refreshable { await store.refresh() }
            .task { if province == nil, let p = session.profile?.province { province = p } }
        }
    }

    @ViewBuilder private var unionList: some View {
        Section {
            ForEach(unions) { u in NavigationLink(value: u) { UnionRow(union: u) } }
            if unions.isEmpty && store.isReady { Text("No unions match.").foregroundStyle(.secondary) }
        } header: {
            HintedHeader(title: "\(unions.count) unions\(province.map { " in \($0)" } ?? "")", hint: "Tap a union for how to join, what it costs, its minimum rates and overtime. Targets marked not confirmed haven't been checked against the union's own pages yet.")
        }
    }

    @ViewBuilder private var roleList: some View {
        ForEach(store.engine.snapshot.departments) { d in
            let roles = d.roles.filter { matches($0.name) || $0.aliases.contains(where: matches) || matches(d.name) }
            if !roles.isEmpty {
                Section(d.name) {
                    ForEach(roles) { r in NavigationLink(value: r) { Text(r.name) } }
                }
            }
        }
    }

    @ViewBuilder private var provinceList: some View {
        Section {
            ForEach(Self.provinces.filter(matches), id: \.self) { p in
                let n = store.engine.unions.filter { $0.jurisdictions.contains { $0.province == p } }.count
                NavigationLink(value: p) { LabeledContent(p, value: n == 1 ? "1 union" : "\(n) unions") }
            }
        }
    }
}

/// A union in a list: name, then who it's for and its first step.
struct UnionRow: View {
    let union: Union
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(union.name).font(.headline)
            Text(subtitle).font(.subheadline).foregroundStyle(.secondary).lineLimit(2)
        }
        .padding(.vertical, 2)
    }
    private var subtitle: String {
        let who = (union.scope ?? "").replacingOccurrences(of: "_", with: " ").capitalized
        let step = union.tiers.first.map { t in
            let v = t.targetValue.formatted()
            let one = t.targetValue == 1
            let unit = switch t.targetType { case "HOURS": one ? "hour" : "hours"; case "DAYS": one ? "day" : "days"; case "EARNINGS": "earned"; default: one ? "credit" : "credits" }
            return "\(t.name): \(t.targetType == "EARNINGS" ? t.targetValue.money : "\(v) \(unit)")\(t.isConfirmed ? "" : " (not confirmed)")"
        }
        return [who.isEmpty ? nil : who, step].compactMap { $0 }.joined(separator: " · ")
    }
}

/// Which unions cover a role, province by province (or just where you work).
struct RoleCoverageView: View {
    @Environment(EngineStore.self) private var store
    let role: Department.Role
    let province: String?

    var body: some View {
        let dept = store.engine.department(ofRole: role.name)?.name
        let places = province.map { [$0] } ?? GuideView.provinces
        List {
            ForEach(places, id: \.self) { p in
                let ids = store.engine.unionsCovering(role: role.name, department: dept, province: p)
                if !ids.isEmpty || province != nil {
                    Section(p) {
                        if ids.isEmpty { Text("No union covers this role here.").foregroundStyle(.secondary) }
                        ForEach(ids, id: \.self) { id in
                            if let u = store.engine.union(id) { NavigationLink(value: u) { UnionRow(union: u) } }
                        }
                    }
                }
            }
        }
        .navigationTitle(role.name)
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// The unions working in one province.
struct ProvinceUnionsView: View {
    @Environment(EngineStore.self) private var store
    let province: String
    var body: some View {
        List {
            ForEach(store.engine.unions.filter { $0.jurisdictions.contains { $0.province == province } }) { u in
                NavigationLink(value: u) { UnionRow(union: u) }
            }
        }
        .navigationTitle(province)
        .navigationBarTitleDisplayMode(.inline)
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
