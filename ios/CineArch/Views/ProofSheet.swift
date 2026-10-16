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
                } footer: {
                    Text("A receipt, pay stub or invoice, up to 1 MB (photos and scans are shrunk to fit). Entries with proof are Green Lit: ready for your accountant, an audit or a union application.")
                }
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
