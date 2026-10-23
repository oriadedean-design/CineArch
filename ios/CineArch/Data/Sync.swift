import Foundation
import Network
import Observation
import Supabase
import CineArchKit

// A-List Pro works offline and syncs online. Each Pro store keeps a copy of
// its rows on this phone and a queue of changes made here (the outbox). A
// change is saved to the phone first, so it's never lost to a dead zone on
// set, then sent when there's a connection: right away, when the connection
// comes back, and each time the store loads. Rows still in the queue show as
// waiting to sync. Two devices editing the same row: the last change sent wins.

/// Whether this phone has a connection. Stores send their queues when it comes back.
@MainActor @Observable
final class Connectivity {
    static let shared = Connectivity()
    private(set) var isOnline = true
    private let monitor = NWPathMonitor()

    private init() {
        monitor.pathUpdateHandler = { path in
            let online = path.status == .satisfied
            Task { @MainActor in Connectivity.shared.isOnline = online }
        }
        monitor.start(queue: DispatchQueue(label: "ca.cinearch.connectivity"))
    }
}

/// A row saved here but not yet online.
struct WaitingToSync: LocalizedError {
    var errorDescription: String? { "This hasn't synced yet. Connect to the internet, then add its proof." }
}

/// One table's copy on this phone, and its queue of changes (the rules are in
/// CineArchKit's Outbox; this keeps them on the phone and sends them to Supabase).
struct SyncedTable<Row: Codable> {
    let table: String          // the online table
    let file: String           // name of the copy on this phone; the queue is "<file>-outbox"
    let conflict: String       // columns an upsert matches on ("id", or "user_id,union_type_id")
    let key: (Row) -> String   // the row's key in the queue, matching `conflict`
    let delete: (String, UUID) -> (column: String, value: String)   // how to delete a queued key online

    typealias Change = Outbox<Row>.Change

    func cached(_ user: UUID) -> [Row]? { OnDevice.read(file, user: user) }
    func cache(_ rows: [Row], _ user: UUID) { try? OnDevice.write(rows, file, user: user) }

    private func outbox(_ user: UUID) -> Outbox<Row> { Outbox(OnDevice.read("\(file)-outbox", user: user) ?? []) }
    private func save(_ box: Outbox<Row>, _ user: UUID) {
        if box.isEmpty { OnDevice.remove("\(file)-outbox", user: user) }
        else { try? OnDevice.write(box.changes, "\(file)-outbox", user: user) }
    }

    func pending(_ user: UUID) -> [Change] { outbox(user).changes }

    /// Queues a save or delete; a later change to the same row replaces an earlier one.
    func enqueue(_ change: Change, _ user: UUID) {
        var box = outbox(user); box.add(change); save(box, user)
    }

    /// Sends the queue. Afterwards only what was sent comes out of the queue as
    /// it is by then, so changes queued during the send are kept.
    @discardableResult
    func flush(_ user: UUID) async -> (sent: Int, refused: Int) {
        let box = outbox(user)
        guard !box.isEmpty else { return (0, 0) }
        let report = await box.send { change in
            do {
                if let row = change.row {
                    try await Backend.client.from(table).upsert(row, onConflict: conflict).execute()
                } else {
                    let d = delete(change.key, user)
                    try await Backend.client.from(table).delete().eq("user_id", value: user).eq(d.column, value: d.value).execute()
                }
                return .sent
            } catch let error as URLError where error.code != .cancelled {
                return .offline
            } catch {
                return .refused
            }
        }
        var now = outbox(user); now.remove(report.sent); save(now, user)
        return (report.sent.count, report.refused)
    }

    /// The online rows with this phone's unsent changes applied on top.
    func merge(_ online: [Row], _ user: UUID) -> [Row] { outbox(user).merge(online, key: key) }

    /// Empties the queue, once its changes have been kept another way.
    func discardPending(_ user: UUID) { save(Outbox(), user) }

    /// Keys of rows waiting to sync, for "Waiting to sync" on screen.
    func waiting(_ user: UUID) -> Set<String> { outbox(user).keys }
}
