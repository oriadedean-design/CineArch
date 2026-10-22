import SwiftUI
import PhotosUI
import VisionKit
import UniformTypeIdentifiers

// Back a Wrap Wallet entry with proof: scan it with the camera, pick a photo or
// choose a file (PDF or image). An entry with proof is Green Lit.
struct ProofSheet: View {
    @Environment(LedgerStore.self) private var ledger
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    let entry: LedgerEntry

    @State private var photo: PhotosPickerItem?
    @State private var showScanner = false
    @State private var showFiles = false
    @State private var uploading = false
    @State private var error: String?

    /// The entry as it is now in the ledger (it changes once proof lands).
    private var current: LedgerEntry { ledger.entries.first { $0.id == entry.id } ?? entry }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    LabeledContent(current.isIncome ? "Income" : "Expense", value: current.totalAmount.money)
                    LabeledContent("Category", value: current.categoryName)
                    LabeledContent("Date", value: Date(isoDay: current.dateIncurred)?.formatted(date: .abbreviated, time: .omitted) ?? current.dateIncurred)
                } header: { Text(current.description) }

                Section {
                    if current.isGreenLit {
                        Label("Green Lit: backed with proof", systemImage: "checkmark.seal.fill").foregroundStyle(Color.green)
                        if !ledger.isPreview {
                            Button { Task { if let url = await ledger.proofURL(current) { openURL(url) } } } label: {
                                Label("View proof", systemImage: "doc.text.magnifyingglass")
                            }
                        }
                    }
                    if VNDocumentCameraViewController.isSupported {
                        Button { showScanner = true } label: { Label(current.isGreenLit ? "Replace: scan with camera" : "Scan with camera", systemImage: "doc.viewfinder") }
                    }
                    PhotosPicker(selection: $photo, matching: .images) {
                        Label(current.isGreenLit ? "Replace: choose a photo" : "Choose a photo", systemImage: "photo")
                    }
                    Button { showFiles = true } label: { Label(current.isGreenLit ? "Replace: choose a file" : "Choose a file", systemImage: "folder") }
                    if uploading { HStack { ProgressView(); Text("Uploading…").foregroundStyle(.secondary) } }
                } header: {
                    Text(current.isGreenLit ? "Proof" : "Back it with proof")
                } footer: { Group {
                    Text("A receipt, pay stub or invoice, up to 1 MB (photos and scans are shrunk to fit). Entries with proof are Green Lit: ready for your accountant, an audit or a union application.")
                }.font(Theme.sans(.footnote)) }
                .disabled(uploading)

                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .navigationTitle(current.isGreenLit ? "Green Lit" : "Needs proof")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button(current.isGreenLit ? "Done" : "Later") { dismiss() } }
            }
            .onChange(of: photo) {
                guard let photo else { return }
                Task {
                    defer { self.photo = nil }
                    guard let data = try? await photo.loadTransferable(type: Data.self), let image = UIImage(data: data),
                          let file = Documents.photo(image) else { error = "Couldn't read that photo."; return }
                    await upload(file)
                }
            }
            .fileImporter(isPresented: $showFiles, allowedContentTypes: [.pdf, .image]) { result in
                guard case .success(let url) = result else { return }
                do { let file = try Documents.file(at: url); Task { await upload(file) } }
                catch { self.error = error.localizedDescription }
            }
            .fullScreenCover(isPresented: $showScanner) {
                DocumentScanner { pages in
                    showScanner = false
                    guard let pages else { return }
                    if let file = Documents.scan(pages) { Task { await upload(file) } } else { error = "That scan is too big to fit in 1 MB. Try fewer pages." }
                }
                .ignoresSafeArea()
            }
        }
    }

    private func upload(_ file: UploadFile) async {
        uploading = true
        defer { uploading = false }
        do {
            try await ledger.attachProof(to: current, file: file)
            error = nil
        } catch {
            self.error = "Couldn't upload: \(error.localizedDescription)"
        }
    }
}

/// The system document camera; the scanned pages come back as images.
struct DocumentScanner: UIViewControllerRepresentable {
    var done: ([UIImage]?) -> Void

    func makeUIViewController(context: Context) -> VNDocumentCameraViewController {
        let vc = VNDocumentCameraViewController()
        vc.delegate = context.coordinator
        return vc
    }
    func updateUIViewController(_ vc: VNDocumentCameraViewController, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(done: done) }

    final class Coordinator: NSObject, VNDocumentCameraViewControllerDelegate {
        let done: ([UIImage]?) -> Void
        init(done: @escaping ([UIImage]?) -> Void) { self.done = done }

        func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFinishWith scan: VNDocumentCameraScan) {
            done((0..<scan.pageCount).map { scan.imageOfPage(at: $0) })
        }
        func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) { done(nil) }
        func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFailWithError error: Error) { done(nil) }
    }
}

// Back a job with its pay stub (A-List Pro). With proof the job is Green Lit,
// and the Union Pack attaches the stub, annotated.
struct JobProofSheet: View {
    @Environment(JobsStore.self) private var jobs
    @Environment(RepresentationStore.self) private var representation
    @Environment(Session.self) private var session
    @Environment(LedgerStore.self) private var ledger
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    let job: Job

    @State private var uploading = false
    @State private var error: String?
    @State private var agent = AgentChoice()
    @State private var showPlans = false

    private var current: Job { jobs.jobs.first { $0.id == job.id } ?? job }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    LabeledContent("Dates", value: [current.startDate, current.endDate].compactMap { $0.flatMap(Date.init(isoDay:))?.formatted(date: .abbreviated, time: .omitted) }.joined(separator: " – "))
                    LabeledContent("Set", value: current.unionName ?? "Non-union")
                    LabeledContent("Hours", value: current.totalHours.hours)
                    if let g = current.grossEarnings { LabeledContent("Gross", value: g.money) }
                    LabeledContent("Role", value: current.role)
                    LabeledContent("Company", value: current.companyName)
                } header: { Text(current.productionName) }

                Section { AgentPicker(choice: $agent) } header: {
                    HintedHeader(title: "Booked by", hint: "The agent who got you this job, if one did. Your Slate can then show what each agent brought in.")
                }
                .onChange(of: agent) {
                    guard let id = current.id,
                          agent != AgentChoice(name: current.agentName, agencyId: current.agencyId, representativeId: current.representativeId) else { return }
                    Task { await jobs.setAgent(id, name: agent.name, agencyId: agent.agencyId, representativeId: agent.representativeId) }
                }

                let cuts = representation.commissions(on: current)
                if !cuts.isEmpty, let gross = current.grossEarnings {
                    Section {
                        ForEach(cuts, id: \.self) { c in
                            LabeledContent("\(c.representative.name), \(c.representative.commissionPct.formatted(.number.precision(.fractionLength(0...2))))%", value: "−\(c.amount.money)")
                        }
                        LabeledContent("You keep", value: (gross - cuts.reduce(0) { $0 + $1.amount }).money).bold()
                    } header: {
                        HintedHeader(title: "Commission", hint: "What your representation takes from this job's gross pay, set in Account > Your representation.")
                    }
                }

                if !session.isPremium {
                    Section {
                        Button { showPlans = true } label: {
                            LockedRowLabel(title: "Back it with a pay stub", detail: Plan.pro.name)
                        }
                    } footer: { Group {
                        Text("A pay stub on a job makes it Green Lit: proof for your union application.")
                    }.font(Theme.sans(.footnote)) }
                } else {
                Section {
                    if current.isGreenLit {
                        Label("Green Lit: backed with a pay stub", systemImage: "checkmark.seal.fill").foregroundStyle(Color.green)
                        Button { Task { if let url = await jobs.proofURL(current) { openURL(url) } } } label: {
                            Label("View pay stub", systemImage: "doc.text.magnifyingglass")
                        }
                    }
                    DocumentPicker(scanLabel: current.isGreenLit ? "Replace: scan with camera" : "Scan with camera") { files in
                        Task { await upload(files[0]) }
                    } failed: { error = $0 }
                    if uploading { HStack { ProgressView(); Text("Uploading…").foregroundStyle(.secondary) } }
                } header: {
                    HintedHeader(title: current.isGreenLit ? "Pay stub" : "Back it with a pay stub",
                                 hint: "Unions ask for proof of your days. A pay stub on the job makes it Green Lit, and it goes into your Union Pack with the dates, hours and pay highlighted.")
                } footer: { Group {
                    Text("Up to 1 MB (photos are shrunk to fit). Green Lit jobs carry their pay stub into your Union Pack, highlighted where the dates, hours and pay appear.")
                }.font(Theme.sans(.footnote)) }
                .disabled(uploading)
                }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .onAppear { agent = AgentChoice(name: current.agentName, agencyId: current.agencyId, representativeId: current.representativeId) }
            .navigationDestination(isPresented: $showPlans) { PlansView() }
            .navigationTitle(!session.isPremium || current.status == "TENTATIVE" ? "Job" : current.isGreenLit ? "Green Lit" : "Needs a pay stub")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button(current.isGreenLit || !session.isPremium ? "Done" : "Later") { dismiss() } } }
        }
    }

    private func upload(_ file: UploadFile) async {
        uploading = true
        defer { uploading = false }
        do { try await jobs.attachProof(to: current, file: file, ledger: ledger); error = nil }
        catch { self.error = "Couldn't upload: \(error.localizedDescription)" }
    }
}

// MARK: Booked by

/// Who booked a job: nobody, the agency linked to the account, or a typed name.
/// A locked row's label: what it is, and the plan it comes with.
struct LockedRowLabel: View {
    let title: String
    let detail: String
    var body: some View {
        HStack {
            Label(title, systemImage: "lock.fill")
            Spacer()
            Text(detail).font(Theme.sans(.caption).bold()).foregroundStyle(Theme.accent)
        }
    }
}

struct AgentChoice: Equatable {
    var name: String?
    var agencyId: UUID?
    var representativeId: UUID?
}

struct AgentPicker: View {
    @Environment(Session.self) private var session
    @Environment(JobsStore.self) private var jobs
    @Environment(RepresentationStore.self) private var representation
    @Binding var choice: AgentChoice
    @State private var typing = false
    @State private var typed = ""

    private enum Pick: Hashable { case none, rep(UUID), agency, named(String), other }

    var body: some View {
        Picker("Agent", selection: Binding<Pick>(get: {
            if typing { return .other }
            if let id = choice.representativeId { return .rep(id) }
            if choice.agencyId != nil { return .agency }
            return choice.name.map { .named($0) } ?? .none
        }, set: { pick in
            switch pick {
            case .none: typing = false; choice = AgentChoice()
            case .rep(let id):
                typing = false
                let r = representation.reps.first { $0.id == id }
                choice = AgentChoice(name: r?.name, agencyId: r?.agencyId, representativeId: id)
            case .agency: typing = false; choice = AgentChoice(name: session.agency?.name, agencyId: session.agency?.id)
            case .named(let n): typing = false; choice = AgentChoice(name: n)
            case .other: typing = true; typed = ""; choice = AgentChoice()
            }
        })) {
            Text("No agent").tag(Pick.none)
            ForEach(representation.reps.filter { $0.id != nil }) { r in
                Text("\(r.name) (\(r.commissionPct.formatted(.number.precision(.fractionLength(0...2))))%)").tag(Pick.rep(r.id!))
            }
            if let a = session.agency, !representation.reps.contains(where: { $0.agencyId == a.id }) { Text(a.name).tag(Pick.agency) }
            let repNames = Set(representation.reps.map(\.name))
            ForEach(jobs.agents.filter { $0 != session.agency?.name && !repNames.contains($0) }, id: \.self) { Text($0).tag(Pick.named($0)) }
            if let n = choice.name, choice.agencyId == nil, choice.representativeId == nil, !jobs.agents.contains(n), !typing { Text(n).tag(Pick.named(n)) }
            Text("Someone else…").tag(Pick.other)
        }
        if typing {
            TextField("Agent's name", text: $typed).textInputAutocapitalization(.words)
                .onChange(of: typed) { choice = AgentChoice(name: typed.trimmed.isEmpty ? nil : String(typed.trimmed.prefix(120))) }
        }
        EmptyView().task { await session.loadAgency() }
    }
}
