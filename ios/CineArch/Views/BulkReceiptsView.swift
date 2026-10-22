import SwiftUI
import CineArchKit

// Many receipts at once: each photo, file or scanned page is read on the phone
// and becomes a draft Wallet entry with the receipt attached as proof (Green Lit).
// Nothing is saved until you've checked them and tapped Save.
struct BulkReceiptsView: View {
    @Environment(LedgerStore.self) private var ledger
    @Environment(\.dismiss) private var dismiss

    struct Draft: Identifiable {
        let id = UUID()
        var file: UploadFile
        var description = ""
        var amount = ""
        var tax = ""
        var date = Date()
        var category: String?
        var read = false          // anything came off the page
    }

    @State private var drafts: [Draft] = []
    @State private var reading = 0
    @State private var editing: Draft.ID?
    @State private var saving: (done: Int, of: Int)?
    @State private var problems: [String] = []

    private var ready: Bool { !drafts.isEmpty && drafts.allSatisfy { $0.category != nil && Double($0.amount) != nil && !$0.description.trimmed.isEmpty } }
    private var missingCategory: Int { drafts.filter { $0.category == nil }.count }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    DocumentPicker(many: true, scanLabel: "Scan receipts (one per page)") { files in
                        Task { await read(files) }
                    } failed: { problems.append($0) }
                    if reading > 0 { HStack { ProgressView(); Text("Reading \(reading) receipt\(reading == 1 ? "" : "s")…").foregroundStyle(.secondary) } }
                } header: { Text("Add receipts") } footer: { Group {
                    Text("Up to 20 at a time. Each is read on your phone and kept as proof, up to 1 MB each (photos are shrunk to fit).")
                }.font(Theme.sans(.footnote)) }

                if !drafts.isEmpty {
                    Section {
                        Picker("Category for the rest", selection: Binding(get: { String?.none }, set: { c in
                            for i in drafts.indices where drafts[i].category == nil { drafts[i].category = c }
                        })) {
                            Text("Choose…").tag(String?.none)
                            ForEach(Ledger.expenseCategories, id: \.0) { Text($0.1).tag(Optional($0.0)) }
                        }
                        .disabled(missingCategory == 0)
                    } footer: { Group {
                        Text(missingCategory == 0 ? "Every receipt has a category." : "\(missingCategory) still need a category. Set them all here, or tap one to set it on its own.")
                    }.font(Theme.sans(.footnote)) }

                    Section {
                        ForEach(drafts) { d in
                            Button { editing = d.id } label: { DraftRow(draft: d) }.buttonStyle(.plain)
                        }
                        .onDelete { drafts.remove(atOffsets: $0) }
                    } header: { Text("\(drafts.count) to check") } footer: { Group {
                        Text("Tap one to check what was read. Swipe left to leave it out.")
                    }.font(Theme.sans(.footnote)) }
                }

                if let saving { Section { HStack { ProgressView(); Text("Saving \(saving.done) of \(saving.of)…") } } }
                if !problems.isEmpty { Section { ForEach(problems, id: \.self) { Text($0).foregroundStyle(.red) } } }
            }
            .navigationTitle("Receipts in bulk")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button(drafts.isEmpty ? "Save" : "Save \(drafts.count)") { Task { await save() } }
                        .disabled(!ready || saving != nil || reading > 0)
                }
            }
            .sheet(item: Binding(get: { editing.flatMap { id in drafts.first { $0.id == id } } }, set: { editing = $0?.id })) { d in
                DraftEditor(draft: binding(d.id))
            }
        }
    }

    private func binding(_ id: Draft.ID) -> Binding<Draft> {
        Binding(get: { drafts.first { $0.id == id } ?? Draft(file: UploadFile(data: Data(), ext: "", contentType: "", pages: [])) },
                set: { new in if let i = drafts.firstIndex(where: { $0.id == id }) { drafts[i] = new } })
    }

    private func read(_ files: [UploadFile]) async {
        let room = max(0, 20 - drafts.count)
        if files.count > room { problems.append("Only \(room) more fit in one go; save these first.") }
        for file in files.prefix(room) {
            reading += 1
            defer { reading -= 1 }
            let r = DocumentReader.receipt(lines: await Documents.text(file.pages))
            var d = Draft(file: file)
            d.description = r.vendor ?? ""
            if let t = r.total { d.amount = String(format: "%.2f", t - (r.tax ?? 0)) }
            if let tax = r.tax { d.tax = String(format: "%.2f", tax) }
            if let day = r.date.flatMap(Date.init(isoDay:)) { d.date = day }
            d.read = r.vendor != nil || r.total != nil || r.date != nil
            drafts.append(d)
        }
    }

    private func save() async {
        problems = []
        var left = [Draft]()
        saving = (0, drafts.count)
        for d in drafts {
            guard let category = d.category, let amount = Double(d.amount) else { continue }
            let tax = Double(d.tax) ?? 0
            let entry = LedgerEntry(type: "EXPENSE", category: category, amountBeforeTax: amount, taxAmount: tax,
                                    totalAmount: amount + tax, description: d.description.trimmed, dateIncurred: d.date.isoDay)
            do {
                let saved = try await ledger.add(entry)
                do { try await ledger.attachProof(to: saved, file: d.file) }
                catch { problems.append("\(d.description): saved, but the proof didn't upload (\(error.localizedDescription)). Tap it in the Wallet to try again.") }
            } catch {
                problems.append("\(d.description): couldn't save (\(error.localizedDescription)).")
                left.append(d)
            }
            saving?.done += 1
        }
        saving = nil
        drafts = left
        if problems.isEmpty { dismiss() }
    }
}

private struct DraftRow: View {
    let draft: BulkReceiptsView.Draft
    var body: some View {
        HStack(spacing: 12) {
            if let img = draft.file.pages.first {
                Image(uiImage: img).resizable().scaledToFill().frame(width: 44, height: 56).clipped()
            }
            VStack(alignment: .leading, spacing: 3) {
                Text(draft.description.isEmpty ? "Store not read" : draft.description).font(Theme.sans(.headline)).lineLimit(1)
                    .foregroundStyle(draft.description.isEmpty ? .secondary : .primary)
                Text([draft.date.formatted(date: .abbreviated, time: .omitted), draft.category.map(Ledger.categoryName) ?? "Needs a category"]
                    .joined(separator: " · "))
                    .font(Theme.sans(.caption)).foregroundStyle(draft.category == nil ? Theme.accent : .secondary)
            }
            Spacer()
            Text(Double(draft.amount).map { $0.money } ?? "No amount").monospacedDigit()
                .foregroundStyle(Double(draft.amount) == nil ? Theme.accent : .primary)
        }
        .contentShape(Rectangle())
    }
}

private struct DraftEditor: View {
    @Binding var draft: BulkReceiptsView.Draft
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                if let img = draft.file.pages.first {
                    Section { Image(uiImage: img).resizable().scaledToFit().frame(maxHeight: 260).frame(maxWidth: .infinity) }
                }
                Section {
                    TextField("What was it?", text: $draft.description)
                    Picker("Category", selection: $draft.category) {
                        Text("Choose…").tag(String?.none)
                        ForEach(Ledger.expenseCategories, id: \.0) { Text($0.1).tag(Optional($0.0)) }
                    }
                    DatePicker("Date", selection: $draft.date, displayedComponents: .date)
                } footer: { Group {
                    Text(draft.read ? "Read from the receipt. Check each one." : "Couldn't read this one. Fill it in from the picture.")
                }.font(Theme.sans(.footnote)) }
                Section {
                    field("Amount before tax", $draft.amount)
                    field("GST/HST", $draft.tax)
                }
            }
            .navigationTitle("Check receipt")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
    }

    private func field(_ label: String, _ text: Binding<String>) -> some View {
        HStack {
            Text(label)
            Spacer()
            TextField("0.00", text: text).keyboardType(.decimalPad).numbersOnly(text).multilineTextAlignment(.trailing).frame(maxWidth: 120)
        }
    }
}
