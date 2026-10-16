import SwiftUI
import PhotosUI
import VisionKit
import UniformTypeIdentifiers

/// Three ways to bring in a receipt or pay stub: scan with the camera, pick
/// photos, or choose files. Everything comes back shrunk to fit under 1 MB.
/// With `many`, photos and files can be picked several at a time (up to 20).
struct DocumentPicker: View {
    var many = false
    var scanLabel = "Scan with camera"
    let picked: ([UploadFile]) -> Void
    var failed: (String) -> Void = { _ in }

    @State private var photos: [PhotosPickerItem] = []
    @State private var showScanner = false
    @State private var showFiles = false
    @State private var working = false

    var body: some View {
        Group {
            if VNDocumentCameraViewController.isSupported {
                Button { showScanner = true } label: { Label(scanLabel, systemImage: "doc.viewfinder") }
            }
            PhotosPicker(selection: $photos, maxSelectionCount: many ? 20 : 1, matching: .images) {
                Label(many ? "Choose photos" : "Choose a photo", systemImage: "photo.on.rectangle")
            }
            Button { showFiles = true } label: { Label(many ? "Choose files" : "Choose a file", systemImage: "folder") }
            if working { HStack { ProgressView(); Text("Getting it ready…").foregroundStyle(.secondary) } }
        }
        .disabled(working)
        .onChange(of: photos) {
            guard !photos.isEmpty else { return }
            let items = photos
            Task {
                working = true
                defer { working = false; photos = [] }
                var files = [UploadFile]()
                for item in items {
                    if let data = try? await item.loadTransferable(type: Data.self), let image = UIImage(data: data), let f = Documents.photo(image) {
                        files.append(f)
                    } else { failed("Couldn't read one of those photos.") }
                }
                if !files.isEmpty { picked(files) }
            }
        }
        .fileImporter(isPresented: $showFiles, allowedContentTypes: [.pdf, .image], allowsMultipleSelection: many) { result in
            guard case .success(let urls) = result else { return }
            var files = [UploadFile]()
            for url in urls.prefix(20) {
                do { files.append(try Documents.file(at: url)) } catch { failed("\(url.lastPathComponent): \(error.localizedDescription)") }
            }
            if !files.isEmpty { picked(files) }
        }
        .fullScreenCover(isPresented: $showScanner) {
            DocumentScanner { pages in
                showScanner = false
                guard let pages, !pages.isEmpty else { return }
                // One scan session is one document; in bulk, each scanned page is its own.
                let files = many ? pages.compactMap { Documents.photo($0) } : Documents.scan(pages).map { [$0] } ?? []
                if files.isEmpty { failed("That scan is too big to fit in 1 MB. Try fewer pages.") } else { picked(files) }
            }
            .ignoresSafeArea()
        }
    }
}
