import Foundation
import UserNotifications
import CineArchKit

// Notes from set: in-app notifications worked out from your own jobs and
// union tracking plus sourced deadlines (same rules as services/notes.ts).
// Each note says why it's here and carries the action it suggests.
struct Note: Identifiable, Hashable {
    enum Action: Hashable { case openWrap, markSlate, confirmJob(UUID), link(URL) }
    let id: String
    let title: String
    let body: String
    let date: Date
    let action: Action
    let actionLabel: String
}

enum Notes {
    static func make(jobs: [Job], tracks: [TrackedUnion], engine: UnionEngine, today: Date = Date()) -> [Note] {
        let cal = Calendar.current
        let t0 = cal.startOfDay(for: today)
        let fortnight: TimeInterval = 14 * 86_400
        var notes = [Note]()
        func short(_ d: Date) -> String { d.formatted(.dateTime.month(.abbreviated).day()) }

        for t in tracks {
            let p = TrackProgress(track: t, jobs: jobs, engine: engine, today: today)
            if p.track.targetValue <= 0 { continue }
            if p.remaining == 0 && !p.productionsShort {
                notes.append(Note(id: "ready-\(t.unionTypeId)-\(t.tierLabel)", title: "Ready to apply: \(t.unionName)",
                                  body: "You've reached \(t.format(p.track.targetValue)) \(t.unit) toward \(t.tierLabel).",
                                  date: t0, action: .openWrap, actionLabel: "Open Your Wrap"))
            } else if p.remaining <= p.track.targetValue * 0.1 {
                notes.append(Note(id: "close-\(t.unionTypeId)-\(t.tierLabel)-\(p.remaining)", title: "\(t.format(p.remaining)) \(t.unit) to go for \(t.unionName)",
                                  body: "You're \(Int((p.fraction * 100).rounded()))% of the way to \(t.tierLabel).",
                                  date: t0, action: .openWrap, actionLabel: "Open Your Wrap"))
            }
            if let months = p.windowMonths, let since = cal.date(byAdding: .month, value: -months, to: t0) {
                let days = jobs.filter { $0.status != "TENTATIVE" && $0.isUnion && $0.unionTypeId == t.unionTypeId }
                    .compactMap { Date(isoDay: $0.startDate) }.filter { $0 >= since }
                if let oldest = days.min(), let drop = cal.date(byAdding: .month, value: months, to: oldest), drop.timeIntervalSince(t0) <= fortnight {
                    notes.append(Note(id: "window-\(t.unionTypeId)-\(drop.isoDay)", title: "A \(t.unionName) day drops out on \(short(drop))",
                                      body: "Days older than \(months) months stop counting toward \(t.tierLabel). New days keep you on track.",
                                      date: drop, action: .markSlate, actionLabel: "Mark the slate"))
                }
            }
        }

        for j in jobs where j.status == "TENTATIVE" {
            guard let id = j.id, let end = Date(isoDay: j.endDate ?? j.startDate), end < t0 else { continue }
            notes.append(Note(id: "worked-\(id)", title: "Did you work \(j.productionName)?",
                              body: "It was pencilled in and its dates have passed. Confirm it so the days count.",
                              date: end, action: .confirmJob(id), actionLabel: "Yes, I worked it"))
        }

        if let last = jobs.filter({ $0.status != "TENTATIVE" }).compactMap({ Date(isoDay: $0.endDate ?? $0.startDate) }).max(),
           t0.timeIntervalSince(last) >= fortnight {
            notes.append(Note(id: "quiet-\(last.isoDay)", title: "Back to one?",
                              body: "Nothing marked since \(short(last)). Worked a day since? Add it so it counts.",
                              date: t0, action: .markSlate, actionLabel: "Mark the slate"))
        }

        for d in engine.snapshot.deadlines ?? [] where d.appliesTo != "union_member" {
            guard let when = d.next(after: t0), when.timeIntervalSince(t0) <= fortnight, let url = URL(string: d.sourceUrl) else { continue }
            let who = d.appliesTo == "instalments" ? "If you pay by instalments. " : d.appliesTo == "gst_registered" ? "If you're registered for GST/HST. " : ""
            notes.append(Note(id: "deadline-\(d.id)-\(cal.component(.year, from: when))", title: "\(d.title): \(short(when))",
                              body: who + (d.detail ?? ""), date: when, action: .link(url),
                              actionLabel: "Open \((url.host() ?? "").replacingOccurrences(of: "www.", with: ""))"))
        }
        return notes.sorted { $0.date < $1.date }
    }

    // MARK: Dismissed (on this device)

    private static let key = "cinearch.dismissedNotes"
    static var dismissed: Set<String> { Set(UserDefaults.standard.stringArray(forKey: key) ?? []) }
    static func dismiss(_ id: String) {
        UserDefaults.standard.set(Array((dismissed.union([id])).suffix(200)), forKey: key)
    }

    // MARK: Phone reminders (off until turned on in Account)

    static let remindersKey = "cinearch.reminders"

    /// Schedules a reminder at 9 a.m. for each dated note still ahead (deadlines, window drop-offs).
    static func scheduleReminders(_ notes: [Note]) async {
        let center = UNUserNotificationCenter.current()
        center.removeAllPendingNotificationRequests()
        guard UserDefaults.standard.bool(forKey: remindersKey) else { return }
        let cal = Calendar.current
        for n in notes where n.date > Date() {
            let content = UNMutableNotificationContent()
            content.title = n.title
            content.body = n.body
            var when = cal.dateComponents([.year, .month, .day], from: n.date)
            when.hour = 9
            try? await center.add(UNNotificationRequest(identifier: n.id, content: content,
                                                       trigger: UNCalendarNotificationTrigger(dateMatching: when, repeats: false)))
        }
    }

    static func requestPermission() async -> Bool {
        (try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound])) ?? false
    }
}
