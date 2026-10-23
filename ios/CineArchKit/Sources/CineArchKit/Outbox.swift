import Foundation

// The queue behind A-List Pro working offline: changes made on the phone,
// waiting to be sent online, in the order they were made. A later change to
// the same row replaces an earlier one. The app keeps the queue on the phone
// and does the sending (Sync.swift); the rules live here so they can be tested.
//
// Sending takes a while, and more changes can be queued meanwhile. So sending
// reports which changes went (each has its own id), and only those are removed
// from whatever the queue holds by then: nothing queued during a send is lost.

public struct Outbox<Row: Codable>: Codable {
    /// A change to one row: the row to save, or nil to delete it.
    public struct Change: Codable, Identifiable {
        public var id: UUID
        public var key: String
        public var row: Row?
        public init(key: String, row: Row?, id: UUID = UUID()) { self.id = id; self.key = key; self.row = row }
    }

    /// What happened when a change was sent.
    public enum Outcome: Sendable { case sent, offline, refused }

    /// The result of a send.
    public struct Report: Sendable {
        public var sent: Set<UUID> = []     // remove these from the queue
        public var refused = 0              // kept; the server said no
        public var offline = false          // stopped: no connection
    }

    public private(set) var changes: [Change]

    public init(_ changes: [Change] = []) { self.changes = changes }

    public var isEmpty: Bool { changes.isEmpty }
    /// Keys of rows waiting to be sent.
    public var keys: Set<String> { Set(changes.map(\.key)) }

    /// Queues a change; an earlier change to the same row is dropped.
    public mutating func add(_ change: Change) {
        changes.removeAll { $0.key == change.key }
        changes.append(change)
    }

    /// Takes out changes that have been sent.
    public mutating func remove(_ sent: Set<UUID>) {
        changes.removeAll { sent.contains($0.id) }
    }

    /// Rows from online with the queued changes applied on top.
    public func merge(_ rows: [Row], key: (Row) -> String) -> [Row] {
        var rows = rows
        for change in changes {
            rows.removeAll { key($0) == change.key }
            if let row = change.row { rows.append(row) }
        }
        return rows
    }

    /// Sends the queue in order. With no connection it stops (the rest stay
    /// queued, in order). A change the server refuses stays queued and the rest
    /// still go. Doesn't change the queue: remove `report.sent` afterwards.
    public func send(_ deliver: (Change) async -> Outcome) async -> Report {
        var report = Report()
        for change in changes {
            switch await deliver(change) {
            case .sent: report.sent.insert(change.id)
            case .refused: report.refused += 1
            case .offline: report.offline = true; return report
            }
        }
        return report
    }
}
