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
                    Text("A receipt, pay stub or invoice. Entries with proof are Green Lit: ready for your accountant, an audit or a union application.")
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
                    guard let data = try? await photo.loadTransferable(type: Data.self) else { error = "Couldn't read that photo."; return }
                    let jpeg = UIImage(data: data)?.jpegData(compressionQuality: 0.8)
                    await upload(jpeg ?? data, ext: "jpg", type: "image/jpeg")
                }
            }
            .fileImporter(isPresented: $showFiles, allowedContentTypes: [.pdf, .image]) { result in
                guard case .success(let url) = result else { return }
                let ok = url.startAccessingSecurityScopedResource()
                defer { if ok { url.stopAccessingSecurityScopedResource() } }
                guard let data = try? Data(contentsOf: url) else { error = "Couldn't read that file."; return }
                let type = UTType(filenameExtension: url.pathExtension)
                Task { await upload(data, ext: url.pathExtension.lowercased(), type: type?.preferredMIMEType ?? "application/octet-stream") }
            }
            .fullScreenCover(isPresented: $showScanner) {
                DocumentScanner { pdf in
                    showScanner = false
                    if let pdf { Task { await upload(pdf, ext: "pdf", type: "application/pdf") } }
                }
                .ignoresSafeArea()
            }
        }
    }

    private func upload(_ data: Data, ext: String, type: String) async {
        uploading = true
        defer { uploading = false }
        do {
            try await ledger.attachProof(to: current, data: data, fileExtension: ext, contentType: type)
            error = nil
        } catch {
            self.error = "Couldn't upload: \(error.localizedDescription)"
        }
    }
}

/// The system document camera; the scanned pages come back as one PDF.
struct DocumentScanner: UIViewControllerRepresentable {
    var done: (Data?) -> Void

    func makeUIViewController(context: Context) -> VNDocumentCameraViewController {
        let vc = VNDocumentCameraViewController()
        vc.delegate = context.coordinator
        return vc
    }
    func updateUIViewController(_ vc: VNDocumentCameraViewController, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(done: done) }

    final class Coordinator: NSObject, VNDocumentCameraViewControllerDelegate {
        let done: (Data?) -> Void
        init(done: @escaping (Data?) -> Void) { self.done = done }

        func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFinishWith scan: VNDocumentCameraScan) {
            let first = scan.imageOfPage(at: 0)
            let bounds = CGRect(origin: .zero, size: first.size)
            let pdf = UIGraphicsPDFRenderer(bounds: bounds).pdfData { ctx in
                for i in 0..<scan.pageCount {
                    ctx.beginPage()
                    scan.imageOfPage(at: i).draw(in: bounds)
                }
            }
            done(pdf)
        }
        func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) { done(nil) }
        func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFailWithError error: Error) { done(nil) }
    }
}
