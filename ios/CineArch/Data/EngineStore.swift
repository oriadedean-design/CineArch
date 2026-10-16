import Foundation
import Observation
import CineArchKit

// The union engine on the device. Starts from the last copy saved on disk
// (works offline), then refreshes from the database when the version changes.
@MainActor @Observable
final class EngineStore {
    private(set) var engine = UnionEngine()
    private(set) var isLoading = false
    private(set) var error: String?

    var isReady: Bool { engine.snapshot.version > 0 }

    private let folder: URL = {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appending(path: "engine")
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }()
    private var snapshotFile: URL { folder.appending(path: "snapshot.json") }
    private var linesFile: URL { folder.appending(path: "lines.json") }

    func load() async {
        if !isReady, let data = try? Data(contentsOf: snapshotFile),
           let snap = try? JSONDecoder().decode(EngineSnapshot.self, from: data) {
            let lines = (try? Data(contentsOf: linesFile)).flatMap { try? JSONDecoder().decode([String: [RateLine]].self, from: $0) } ?? [:]
            engine = UnionEngine(snapshot: snap, lines: lines)
        }
        await refresh()
    }

    func refresh() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let version: Int = try await Backend.client.rpc("union_engine_version").execute().value
            guard version != engine.snapshot.version else { error = nil; return }
            let snap: EngineSnapshot = try await Backend.client.rpc("union_engine_snapshot").execute().value
            engine = UnionEngine(snapshot: snap)   // rate lines belong to the old version
            try? JSONEncoder().encode(snap).write(to: snapshotFile)
            try? FileManager.default.removeItem(at: linesFile)
            error = nil
        } catch {
            self.error = isReady ? nil : "Couldn't load union data. Check your connection and pull to refresh."
        }
    }

    /// Loads (and saves for offline use) the rate lines for these schedules.
    func ensureLines(_ ids: [String]) async {
        let missing = Array(Set(ids)).filter { engine.lines[$0] == nil }
        guard !missing.isEmpty else { return }
        do {
            let fetched: [String: [RateLine]] = try await Backend.client
                .rpc("rate_schedule_lines", params: ["p_schedule_ids": missing]).execute().value
            engine.lines.merge(fetched) { $1 }
            try? JSONEncoder().encode(engine.lines).write(to: linesFile)
        } catch {
            self.error = "Couldn't load rates. Check your connection."
        }
    }
}
