import SwiftUI
import CineArchKit

// Many pay stubs at once: each is read on the phone and becomes a draft job on
// your Slate (production, dates, hours, gross pay). You say whether each production was union, and
// check each one before saving. Each stub is kept as the job's proof (Green Lit).
struct BulkPayStubsView: View {
    @Environment(JobsStore.self) private var jobs
    @Environment(EngineStore.self) private var store
    @Environment(Session.self) private var session
    @Environment(LedgerStore.self) private var ledger
    @Environment(\.dismiss) private var dismiss

    static let nonUnion = "non-union"

    struct Draft: Identifiable {
        let id = UUID()
        var preview: UIImage?
        var file: UploadFile?     // kept as the job's proof (Green Lit)
        var production = ""
        var role = ""
        var start = Date()
        var end = Date()
        var hours = ""
        var rate = ""
        var gross = ""
        var union: String?        // a union id, nonUnion, or nil until chosen
        var read = false
    }

    @State private var drafts: [Draft] = []
    @State private var reading = 0
    @State private var editing: Draft.ID?
    @State private var saving: (done: Int, of: Int)?
    @State private var problems: [String] = []

    private var unions: [Union] { store.engine.unions.filter { !$0.tiers.isEmpty } }
    private var missingUnion: Int { drafts.filter { $0.union == nil }.count }
    private var ready: Bool { !drafts.isEmpty && drafts.allSatisfy { $0.union != nil && !$0.production.trimmed.isEmpty && !$0.role.trimmed.isEmpty } }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    DocumentPicker(many: true, scanLabel: "Scan pay stubs (one per page)") { files in
                        Task { await read(files) }
                    } failed: { problems.append($0) }
                    if reading > 0 { HStack { ProgressView(); Text("Reading \(reading) pay stub\(reading == 1 ? "" : "s")…").foregroundStyle(.secondary) } }
                } header: { Text("Add pay stubs") } footer: { Group {
                    Text("Up to 20 at a time. Read on your phone, then each stub is kept as that job's proof (Green Lit), up to 1 MB each.")
                }.font(Theme.sans(.footnote)) }

                if !drafts.isEmpty {
                    Section {
                        Picker("Whose set, for the rest", selection: Binding(get: { String?.none }, set: { u in
                            for i in drafts.indices where drafts[i].union == nil { drafts[i].union = u }
                        })) { unionOptions }
                            .disabled(missingUnion == 0)
                    } footer: { Group {
                        Text(missingUnion == 0 ? "Every job says whether the production was union." : "\(missingUnion) still need a union (or non-union). Days on a union production count toward joining.")
                    }.font(Theme.sans(.footnote)) }
                    Section {
                        ForEach(drafts) { d in
                            Button { editing = d.id } label: { StubRow(draft: d, unionName: name(d.union)) }.buttonStyle(.plain)
                        }
                        .onDelete { drafts.remove(atOffsets: $0) }
                    } header: { Text("\(drafts.count) to check") } footer: { Group {
                        Text("Tap one to check what was read. Swipe left to leave it out.")
                    }.font(Theme.sans(.footnote)) }
                }

                if let saving { Section { HStack { ProgressView(); Text("Saving \(saving.done) of \(saving.of)…") } } }
                if !problems.isEmpty { Section { ForEach(problems, id: \.self) { Text($0).foregroundStyle(.red) } } }
            }
            .navigationTitle("Pay stubs in bulk")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button(drafts.isEmpty ? "Mark the slate" : "Mark \(drafts.count)") { Task { await save() } }
                        .disabled(!ready || saving != nil || reading > 0)
                }
            }
            .sheet(item: Binding(get: { editing.flatMap { id in drafts.first { $0.id == id } } }, set: { editing = $0?.id })) { d in
                StubEditor(draft: binding(d.id), unionOptions: AnyView(unionOptions))
            }
        }
    }

    @ViewBuilder private var unionOptions: some View {
        Text("Choose…").tag(String?.none)
        Text("Non-union").tag(Optional(Self.nonUnion))
        ForEach(unions) { Text($0.name).tag(Optional($0.id)) }
    }

    private func name(_ id: String?) -> String? {
        guard let id else { return nil }
        return id == Self.nonUnion ? "Non-union" : store.engine.union(id)?.name
    }

    private func binding(_ id: Draft.ID) -> Binding<Draft> {
        Binding(get: { drafts.first { $0.id == id } ?? Draft() },
                set: { new in if let i = drafts.firstIndex(where: { $0.id == id }) { drafts[i] = new } })
    }

    private func read(_ files: [UploadFile]) async {
        let room = max(0, 20 - drafts.count)
        if files.count > room { problems.append("Only \(room) more fit in one go; mark these first.") }
        for file in files.prefix(room) {
            reading += 1
            defer { reading -= 1 }
            let p = DocumentReader.payStub(lines: await Documents.text(file.pages))
            var d = Draft(preview: file.pages.first, file: file)
            d.production = p.employer ?? ""
            d.role = session.profile?.selectedRoles?.first ?? ""
            if let s = p.startDate.flatMap(Date.init(isoDay:)) { d.start = s; d.end = s }
            if let e = p.endDate.flatMap(Date.init(isoDay:)) { d.end = e }
            d.hours = p.hours.map { $0.formatted(.number.grouping(.never)) } ?? ""
            d.rate = p.rate.map { String(format: "%.2f", $0) } ?? ""
            d.gross = p.gross.map { String(format: "%.2f", $0) } ?? ""
            d.read = p.employer != nil || p.gross != nil || p.startDate != nil
            drafts.append(d)
        }
    }

    private func save() async {
        problems = []
        var left = [Draft]()
        saving = (0, drafts.count)
        for d in drafts {
            guard let union = d.union else { continue }
            let isUnion = union != Self.nonUnion
            let days = max(1, (Calendar.current.dateComponents([.day], from: d.start, to: d.end).day ?? 0) + 1)
            let job = Job(productionName: d.production.trimmed, companyName: d.production.trimmed, role: d.role.trimmed,
                          department: session.profile?.department, isUnion: isUnion,
                          unionTypeId: isUnion ? union : nil, unionName: isUnion ? name(union) : nil,
                          startDate: d.start.isoDay, endDate: days > 1 ? d.end.isoDay : nil,
                          totalHours: Double(d.hours) ?? 0, hourlyRate: Double(d.rate), daysWorked: days,
                          mealBreakMinutes: 0, overtimeHours: 0, grossEarnings: Double(d.gross),
                          province: session.profile?.province)
            do {
                let saved = try await jobs.add(job)
                if let file = d.file {
                    do { try await jobs.attachProof(to: saved, file: file, ledger: ledger) }
                    catch { problems.append("\(d.production): marked, but the pay stub didn't upload (\(error.localizedDescription)). Tap it on your Slate to try again.") }
                }
            } catch { problems.append("\(d.production): couldn't save (\(error.localizedDescription))."); left.append(d) }
            saving?.done += 1
        }
        saving = nil
        drafts = left
        if problems.isEmpty { dismiss() }
    }
}

private struct StubRow: View {
    let draft: BulkPayStubsView.Draft
    let unionName: String?
    var body: some View {
        HStack(spacing: 12) {
            if let img = draft.preview { Image(uiImage: img).resizable().scaledToFill().frame(width: 44, height: 56).clipped() }
            VStack(alignment: .leading, spacing: 3) {
                Text(draft.production.isEmpty ? "Production not read" : draft.production).font(Theme.sans(.headline)).lineLimit(1)
                    .foregroundStyle(draft.production.isEmpty ? .secondary : .primary)
                Text([draft.start.formatted(date: .abbreviated, time: .omitted), unionName ?? "Whose set?"].joined(separator: " · "))
                    .font(Theme.sans(.caption)).foregroundStyle(unionName == nil ? Theme.accent : .secondary)
            }
            Spacer()
            Text(Double(draft.gross).map { $0.money } ?? "No pay read").monospacedDigit()
                .foregroundStyle(Double(draft.gross) == nil ? .secondary : .primary)
        }
        .contentShape(Rectangle())
    }
}

private struct StubEditor: View {
    @Binding var draft: BulkPayStubsView.Draft
    let unionOptions: AnyView
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                if let img = draft.preview {
                    Section { Image(uiImage: img).resizable().scaledToFit().frame(maxHeight: 260).frame(maxWidth: .infinity) }
                }
                Section {
                    TextField("Production", text: $draft.production)
                    TextField("Your role", text: $draft.role)
                    Picker("Whose set", selection: $draft.union) { unionOptions }
                } footer: { Group {
                    Text(draft.read ? "Read from the pay stub. Check each one." : "Couldn't read this one. Fill it in from the picture.")
                }.font(Theme.sans(.footnote)) }
                Section {
                    DatePicker("First day", selection: $draft.start, displayedComponents: .date)
                    DatePicker("Last day", selection: $draft.end, in: draft.start..., displayedComponents: .date)
                    field("Hours", $draft.hours)
                    field("Hourly rate", $draft.rate)
                    field("Gross pay", $draft.gross)
                }
            }
            .navigationTitle("Check pay stub")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
    }

    private func field(_ label: String, _ text: Binding<String>) -> some View {
        HStack {
            Text(label)
            Spacer()
            TextField("—", text: text).keyboardType(.decimalPad).numbersOnly(text).multilineTextAlignment(.trailing).frame(maxWidth: 120)
        }
    }
}
