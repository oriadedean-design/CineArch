import Foundation
import Testing
@testable import CineArchKit

// The A-List Pro offline queue: nothing made offline is lost, order is kept,
// and the latest change to a row wins.

private struct Day: Codable, Equatable { var id: String; var hours: Double }
private typealias Box = Outbox<Day>
private func save(_ d: Day) -> Box.Change { .init(key: d.id, row: d) }
private func delete(_ id: String) -> Box.Change { .init(key: id, row: nil) }

@Test func laterChangeToSameRowReplacesEarlier() {
    var box = Box()
    box.add(save(Day(id: "a", hours: 10)))
    box.add(save(Day(id: "b", hours: 8)))
    box.add(save(Day(id: "a", hours: 12)))
    #expect(box.changes.map(\.key) == ["b", "a"])
    #expect(box.changes.last?.row?.hours == 12)
}

@Test func mergeAppliesQueuedChangesOverOnlineRows() {
    var box = Box()
    box.add(save(Day(id: "a", hours: 12)))   // edited here
    box.add(delete("c"))                      // deleted here
    box.add(save(Day(id: "d", hours: 9)))    // new here
    let online = [Day(id: "a", hours: 10), Day(id: "b", hours: 8), Day(id: "c", hours: 7)]
    let merged = box.merge(online) { $0.id }
    #expect(Set(merged.map(\.id)) == ["a", "b", "d"])
    #expect(merged.first { $0.id == "a" }?.hours == 12)
}

@Test func offlineStopsAndKeepsTheRestInOrder() async {
    var box = Box()
    ["1", "2", "3"].forEach { box.add(save(Day(id: $0, hours: 1))) }
    var calls = 0
    let report = await box.send { _ in calls += 1; return calls == 1 ? .sent : .offline }
    #expect(report.offline)
    #expect(calls == 2)                       // stopped at the first connection problem
    box.remove(report.sent)
    #expect(box.changes.map(\.key) == ["2", "3"])
}

@Test func refusedChangeIsKeptAndTheRestStillGo() async {
    var box = Box()
    ["1", "2"].forEach { box.add(save(Day(id: $0, hours: 1))) }
    let report = await box.send { $0.key == "1" ? .refused : .sent }
    #expect(report.refused == 1 && !report.offline)
    box.remove(report.sent)
    #expect(box.changes.map(\.key) == ["1"])
}

@Test func changesQueuedDuringASendAreNotLost() async {
    var stored = Box()                        // the queue as kept on the phone
    stored.add(save(Day(id: "a", hours: 10)))
    let snapshot = stored                     // what the send works from
    let report = await snapshot.send { _ in .sent }
    // Meanwhile: a new day, and a newer edit to the day being sent.
    stored.add(save(Day(id: "b", hours: 8)))
    stored.add(save(Day(id: "a", hours: 14)))
    stored.remove(report.sent)
    #expect(stored.changes.map(\.key) == ["b", "a"])
    #expect(stored.changes.last?.row?.hours == 14)   // the newer edit still goes next time
}

@Test func queueSurvivesBeingSavedAndRead() throws {
    var box = Box()
    box.add(save(Day(id: "a", hours: 10))); box.add(delete("b"))
    let data = try JSONEncoder().encode(box.changes)
    let back = Box(try JSONDecoder().decode([Box.Change].self, from: data))
    #expect(back.changes.map(\.key) == ["a", "b"])
    #expect(back.changes.map(\.id) == box.changes.map(\.id))
    #expect(back.changes[1].row == nil)
}
