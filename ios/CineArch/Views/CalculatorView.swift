import SwiftUI
import CineArchKit

// Hours x rate = pay, with the union's minimum, overtime and minimum call.
// Works without an account; saving the result as a job asks you to sign in.
struct CalculatorView: View {
    var onSaved: (() -> Void)? = nil
    var body: some View {
        NavigationStack { PayForm(onSaved: onSaved).navigationTitle("Pay") }
    }
}

struct PayForm: View {
    @Environment(EngineStore.self) private var store
    @Environment(Session.self) private var session
    var onSaved: (() -> Void)?

    @AppStorage("calc.union") private var unionId = "u-873"
    @State private var date = Date()
    @State private var productionType: String?
    @State private var position: String?
    @State private var hours = 12.0
    @State private var meal = 60
    @State private var days = 1
    @State private var workDay = 1
    @State private var rateText = ""
    @State private var showAuth = false
    @State private var showSave = false

    private static let nonUnion = "non-union"
    /// Whether the production was under a union agreement: what the person tells us (not checked).
    @AppStorage("calc.unionProduction") private var unionProduction = true
    private var isUnion: Bool { unionProduction && unionId != Self.nonUnion }
    private var day: String { date.isoDay }

    private var input: JobInput {
        JobInput(isUnion: isUnion, unionId: isUnion ? unionId : nil, role: nil, date: day,
                 productionType: productionType, ratePosition: position, hoursPerDay: hours,
                 mealMinutes: Double(meal), days: days, hourlyRate: Double(rateText.replacingOccurrences(of: ",", with: ".")),
                 workDay: workDay)
    }
    private var priced: PricedJob { store.engine.price(input) }
    private var unionsWithRates: [Union] { store.engine.unions.filter { !store.engine.schedules($0.id).isEmpty } }

    var body: some View {
        let p = priced
        List {
            Section {
                Picker("Production", selection: $unionProduction) {
                    Text("Union production").tag(true)
                    Text("Non-union").tag(false)
                }
                .pickerStyle(.segmented)
                if unionProduction {
                    Picker("Which union", selection: $unionId) {
                        ForEach(unionsWithRates) { Text($0.name).tag($0.id) }
                    }
                }
                DatePicker("Date", selection: $date, displayedComponents: .date)
                if isUnion && p.productionTypes.count > 1 {
                    Picker("Production", selection: $productionType) {
                        Text("Choose…").tag(String?.none)
                        ForEach(p.productionTypes.compactMap { $0 }, id: \.self) { Text($0).tag(String?.some($0)) }
                    }
                }
                if isUnion, let s = p.schedule {
                    NavigationLink {
                        PositionPicker(schedule: s, selection: $position)
                    } label: {
                        LabeledContent("Position", value: position ?? "Choose…")
                    }
                }
            } header: { Text("The job") } footer: { Group {
                Text("Was the production union? Say so even if you're not a member: your days on it count toward that union's card.")
            }.font(Theme.sans(.footnote)) }

            Section("Hours") {
                Stepper(value: $hours, in: 0.5...24, step: 0.5) { LabeledContent("Call to wrap", value: hours.hours) }
                Stepper(value: $meal, in: 0...120, step: 15) { LabeledContent("Unpaid meal", value: "\(meal) min") }
                Stepper(value: $days, in: 1...60) { LabeledContent("Days", value: "\(days)") }
                if p.rule?.sixthDay != nil || p.rule?.seventhDay != nil {
                    Picker("Day of the work week", selection: $workDay) {
                        Text("1st to 5th").tag(1)
                        Text("6th day").tag(6)
                        Text("7th day").tag(7)
                    }
                }
            }

            Section {
                HStack {
                    Text("Hourly rate")
                    Spacer()
                    TextField(p.minimum?.hourly.map { String(format: "%.2f", $0) } ?? "0.00", text: $rateText)
                        .keyboardType(.decimalPad).numbersOnly($rateText).multilineTextAlignment(.trailing).frame(maxWidth: 120)
                    ScaleBadge(status: p.status)
                }
            } footer: { Group {
                if let m = p.minimum {
                    Text(m.hourly.map { "Union minimum: \($0.money)/h" } ?? "This position's rate is negotiable.")
                        + Text(m.daily.map { " · \($0.money)/day" } ?? "")
                } else if isUnion {
                    Text("Pick a position to fill in the union minimum.")
                }
            }.font(Theme.sans(.footnote)) }

            if let pay = p.pay {
                Section {
                    ForEach(pay.day.bands, id: \.self) { b in
                        LabeledContent("\(b.label) · \(b.hours.hours)", value: b.amount.money)
                    }
                    if pay.day.minimumTopUp > 0 {
                        LabeledContent(p.minimum?.daily != nil ? "Daily fee top-up" : "Minimum call top-up", value: pay.day.minimumTopUp.money)
                    }
                    if pay.days > 1 { LabeledContent("Per day", value: pay.day.total.money) }
                    HStack {
                        Text(pay.days > 1 ? "Total, \(pay.days) days" : "Total").font(Theme.sans(.headline))
                        Spacer()
                        Text(pay.gross.money).font(Theme.serif(.title)).foregroundStyle(Theme.accent).monospacedDigit()
                    }
                } header: {
                    Text("Your pay · \(pay.totalHours.hours) worked")
                } footer: { Group {
                    if let r = p.rule { Text(Pay.describeOvertime(r)) }
                }.font(Theme.sans(.footnote)) }

                Section {
                    Button {
                        if session.isSignedIn { showSave = true } else { showAuth = true }
                    } label: {
                        Label("Mark the slate", systemImage: "movieclapper").frame(maxWidth: .infinity)
                    }
                }
            }
        }
        .overlay { EngineStatus() }
        .scrollDismissesKeyboard(.interactively)
        .onChange(of: unionId) { productionType = nil; position = nil; rateText = "" }
        .onChange(of: unionProduction) { productionType = nil; position = nil; rateText = "" }
        .onAppear {
            // Earlier versions kept "non-union" in the union picker.
            if unionId == Self.nonUnion { unionProduction = false; unionId = "u-873" }
        }
        .onChange(of: productionType) { position = nil }
        .task(id: p.schedule?.id) { if let s = p.schedule { await store.ensureLines([s.id]) } }
        .sheet(isPresented: $showAuth) {
            AuthSheet(reason: "Create a free account to mark the slate and count your days toward the union. It syncs with the CineArch website.") {
                showSave = true
            }
        }
        .sheet(isPresented: $showSave) {
            SaveJobSheet(input: input, priced: p, unionName: store.engine.union(unionId)?.name) { onSaved?() }
        }
    }
}

struct ScaleBadge: View {
    let status: ScaleStatus
    var body: some View {
        switch status {
        case .below: Label("Below scale", systemImage: "exclamationmark.triangle.fill").labelStyle(.iconOnly).foregroundStyle(.red)
        case .at: Image(systemName: "checkmark.seal.fill").foregroundStyle(Theme.accent).accessibilityLabel("At scale")
        case .above: Image(systemName: "arrow.up.circle.fill").foregroundStyle(.green).accessibilityLabel("Above scale")
        case .unknown: EmptyView()
        }
    }
}

struct PositionPicker: View {
    @Environment(EngineStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let schedule: RateSchedule
    @Binding var selection: String?
    @State private var search = ""

    var body: some View {
        let all = store.engine.positions(schedule).filter { search.isEmpty || $0.position.localizedCaseInsensitiveContains(search) || $0.department.localizedCaseInsensitiveContains(search) }
        let order = all.map(\.department).reduce(into: [String]()) { if !$0.contains($1) { $0.append($1) } }
        List {
            ForEach(order, id: \.self) { dept in
                Section(dept) {
                    ForEach(all.filter { $0.department == dept }, id: \.self) { m in
                        Button { selection = m.position; dismiss() } label: {
                            HStack {
                                Text(m.position).foregroundStyle(.primary)
                                Spacer()
                                Text(m.hourly.map { "\($0.money)/h" } ?? "Negotiable").foregroundStyle(.secondary).monospacedDigit()
                                if selection == m.position { Image(systemName: "checkmark").foregroundStyle(Theme.accent) }
                            }
                        }
                    }
                }
            }
        }
        .overlay { if store.engine.lines[schedule.id] == nil { ProgressView() } }
        .navigationTitle("Position")
        .searchable(text: $search, prompt: "Search positions")
    }
}

// Production, company and role, then saves to the shared jobs table.
struct SaveJobSheet: View {
    @Environment(JobsStore.self) private var jobs
    @Environment(Session.self) private var session
    @Environment(\.dismiss) private var dismiss
    let input: JobInput
    let priced: PricedJob
    let unionName: String?
    var onSaved: () -> Void

    @State private var production = ""
    @State private var company = ""
    @State private var role = ""
    @State private var agent = AgentChoice()
    @State private var saving = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            List {
                Section {
                    TextField("Production", text: $production).textInputAutocapitalization(.words)
                    TextField("Production company", text: $company).textInputAutocapitalization(.words)
                    TextField("Your role", text: $role).textInputAutocapitalization(.words)
                } footer: { Group {
                    Text("The company is required. Unions ask for it when you apply.")
                }.font(Theme.sans(.footnote)) }
                Section { AgentPicker(choice: $agent) } header: {
                    HintedHeader(title: "Booked by", hint: "The agent who got you this job, if one did. Your Slate can then show what each agent brought in.")
                }
                if !jobs.knownProductions.isEmpty && production.isEmpty {
                    Section("Recent productions") {
                        ForEach(jobs.knownProductions.prefix(5)) { j in
                            Button { production = j.productionName; company = j.companyName; if role.isEmpty { role = j.role } } label: {
                                VStack(alignment: .leading) { Text(j.productionName); Text(j.companyName).font(Theme.sans(.caption)).foregroundStyle(.secondary) }
                            }
                        }
                    }
                }
                Section {
                    LabeledContent("Production", value: input.isUnion ? "Union · \(unionName ?? "union")" : "Non-union")
                    if let pay = priced.pay { LabeledContent("Pay", value: pay.gross.money); LabeledContent("Hours", value: pay.totalHours.hours) }
                } footer: { Group {
                    Text("As you told us. To change it, go back to the calculator.")
                }.font(Theme.sans(.footnote)) }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .navigationTitle("Mark the slate")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Mark it") { Task { await save() } }
                        .disabled(production.trimmed.isEmpty || company.trimmed.isEmpty || role.trimmed.isEmpty || saving)
                }
            }
            .onAppear { if role.isEmpty { role = priced.minimum?.position ?? "" } }
            .task { if jobs.jobs.isEmpty { await jobs.load() } }
        }
    }

    private func save() async {
        saving = true
        defer { saving = false }
        let pay = priced.pay
        let job = Job(productionName: production.trimmed, companyName: company.trimmed, role: role.trimmed,
                      department: priced.minimum?.department, isUnion: input.isUnion, unionTypeId: input.unionId, unionName: unionName,
                      productionTier: input.productionType, startDate: input.date, totalHours: pay?.totalHours ?? 0,
                      hourlyRate: priced.rate, daysWorked: input.days, hoursPerDay: input.hoursPerDay,
                      mealBreakMinutes: Int(input.mealMinutes), overtimeHours: pay?.totalOvertimeHours ?? 0,
                      unionMinimumRate: priced.minimum?.hourly, ratePosition: priced.minimum?.position, grossEarnings: pay?.gross,
                      province: session.profile?.province ?? (session.isPreview ? "Ontario" : nil),
                      agentName: agent.name, agencyId: agent.agencyId, representativeId: agent.representativeId)
        do {
            try await jobs.add(job)
            dismiss()
            onSaved()
        } catch {
            self.error = "Couldn't save: \(error.localizedDescription)"
        }
    }
}

extension String { var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) } }
