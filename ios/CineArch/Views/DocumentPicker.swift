import SwiftUI
import PhotosUI
import VisionKit
import UniformTypeIdentifiers
import AVFoundation
import UserNotifications

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
    @State private var cameraOff = false

    var body: some View {
        Group {
            if VNDocumentCameraViewController.isSupported {
                Button {
                    Task { if await Permissions.requestCamera() { showScanner = true } else { cameraOff = true } }
                } label: { Label(scanLabel, systemImage: "doc.viewfinder") }
            }
            PhotosPicker(selection: $photos, maxSelectionCount: many ? 20 : 1, matching: .images) {
                Label(many ? "Choose photos" : "Choose a photo", systemImage: "photo.on.rectangle")
            }
            Button { showFiles = true } label: { Label(many ? "Choose files" : "Choose a file", systemImage: "folder") }
            if working { HStack { ProgressView(); Text("Getting it ready…").foregroundStyle(.secondary) } }
        }
        .disabled(working)
        .alert("The camera is off for CineArch", isPresented: $cameraOff) {
            Button("Open Settings") { Permissions.openSettings() }
            Button("Not now", role: .cancel) {}
        } message: {
            Text("Turn on Camera for CineArch in Settings to scan receipts and pay stubs. You can still choose photos or files.")
        }
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

// MARK: Permissions

/// What CineArch asks the phone for, and why. Photos and files need no
/// permission: Apple's pickers only hand over what you choose.
enum Permissions {
    enum Access { case allowed, notAsked, off }

    static var camera: Access {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized: .allowed
        case .notDetermined: .notAsked
        default: .off
        }
    }

    /// Asks the first time; true if the camera can be used.
    static func requestCamera() async -> Bool {
        switch camera {
        case .allowed: true
        case .notAsked: await AVCaptureDevice.requestAccess(for: .video)
        case .off: false
        }
    }

    static func notifications() async -> Access {
        switch await UNUserNotificationCenter.current().notificationSettings().authorizationStatus {
        case .authorized, .provisional, .ephemeral: .allowed
        case .notDetermined: .notAsked
        default: .off
        }
    }

    @MainActor static func openSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(url) }
    }

    static let shownKey = "cinearch.permissions.shown"
}

/// Camera and reminders in one place, with what each is for. Shown once after
/// signing in ("Before you roll"), and any time from Account.
struct PermissionsView: View {
    var firstTime = false
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    @State private var camera = Permissions.camera
    @State private var reminders = Permissions.Access.notAsked

    var body: some View {
        List {
            if firstTime {
                Section {
                    Text("Two things CineArch asks your phone for. You can change either any time in Account.")
                        .foregroundStyle(.secondary)
                }
            }
            Section {
                row(title: "Camera", icon: "doc.viewfinder", access: camera,
                    why: "To scan receipts and pay stubs. It only opens when you tap Scan.") {
                    _ = await Permissions.requestCamera(); camera = Permissions.camera
                }
                row(title: "Reminders", icon: "bell", access: reminders,
                    why: "A 9 a.m. reminder before tax dates and days leaving your union window.") {
                    _ = await Notes.requestPermission(); reminders = await Permissions.notifications()
                }
            } footer: { Group {
                Text("Photos and files need no permission. Apple's picker only gives CineArch the ones you choose.")
            }.font(Theme.sans(.footnote)) }
            Section("How scanning works") {
                Label("The scanner finds the page edges and straightens it.", systemImage: "1.square")
                Label("Your phone reads the text: store, date, total and GST/HST, or production, dates, hours and pay. Nothing is sent anywhere to be read.", systemImage: "2.square")
                Label("You check every figure before saving.", systemImage: "3.square")
                Label("With \(Plan.pro.name), the picture is kept as proof (Green Lit), shrunk to 1 MB and stored privately in your account. Only you can open it.", systemImage: "4.square")
            }
            .font(Theme.sans(.subheadline))
        }
        .navigationTitle(firstTime ? "Before you roll" : "Permissions")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if firstTime {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
            }
        }
        .task { reminders = await Permissions.notifications() }
        .onChange(of: scenePhase) {     // back from Settings
            if scenePhase == .active { camera = Permissions.camera; Task { reminders = await Permissions.notifications() } }
        }
    }

    private func row(title: String, icon: String, access: Permissions.Access, why: String, ask: @escaping () async -> Void) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon).font(Theme.sans(.title3)).foregroundStyle(Theme.accent).frame(width: 28)
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(Theme.sans(.headline))
                Text(why).font(Theme.sans(.caption)).foregroundStyle(.secondary)
            }
            Spacer()
            switch access {
            case .allowed:
                Label("On", systemImage: "checkmark").font(Theme.sans(.caption).bold()).foregroundStyle(.green)
            case .notAsked:
                Button("Allow") { Task { await ask() } }.buttonStyle(.borderedProminent).foregroundStyle(.black)
            case .off:
                Button("Settings") { Permissions.openSettings() }.buttonStyle(.bordered)
            }
        }
        .padding(.vertical, 4)
    }
}
