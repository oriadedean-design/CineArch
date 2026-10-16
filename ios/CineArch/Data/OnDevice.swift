import Foundation

/// Where an account's jobs and union tracking live.
/// Free (Indie) accounts keep them on this phone; Sync Online (A-List Pro)
/// keeps them in the online database, for the website and other devices.
enum DataPlace: Equatable {
    case none                 // signed out
    case preview              // the sample account
    case phone(UUID)          // free: this phone only
    case online(UUID)         // Pro: synced online

    var userId: UUID? {
        switch self {
        case .phone(let id), .online(let id): id
        default: nil
        }
    }
}

/// Proof uploads keep receipts and pay stubs online, so they come with A-List Pro.
struct ProOnly: LocalizedError {
    var errorDescription: String? { "Keeping proof comes with A-List Pro." }
}

/// Files in Application Support/CineArch/<user id>/, one JSON file per kind.
enum OnDevice {
    private static func folder(_ user: UUID) -> URL {
        URL.applicationSupportDirectory.appending(path: "CineArch/\(user.uuidString.lowercased())", directoryHint: .isDirectory)
    }

    static func exists(_ name: String, user: UUID) -> Bool {
        FileManager.default.fileExists(atPath: folder(user).appending(path: "\(name).json").path())
    }

    static func read<T: Decodable>(_ name: String, user: UUID) -> T? {
        guard let data = try? Data(contentsOf: folder(user).appending(path: "\(name).json")) else { return nil }
        return try? JSONDecoder().decode(T.self, from: data)
    }

    static func write<T: Encodable>(_ value: T, _ name: String, user: UUID) throws {
        let dir = folder(user)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        try JSONEncoder().encode(value).write(to: dir.appending(path: "\(name).json"), options: [.atomic, .completeFileProtection])
    }

    static func remove(_ name: String, user: UUID) {
        try? FileManager.default.removeItem(at: folder(user).appending(path: "\(name).json"))
    }

    static func removeAll(user: UUID) {
        try? FileManager.default.removeItem(at: folder(user))
    }
}
