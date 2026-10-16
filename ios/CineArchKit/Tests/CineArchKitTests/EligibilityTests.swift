import Foundation
import Testing
@testable import CineArchKit

// Mirrors the ACTRA Toronto background cases in tests/career.test.ts.
struct EligibilityTests {
    @Test func quarterHourRounding() {
        let got = [6, 12, 18, 24, 30, 36, 42, 48, 54].map { Eligibility.quarterHours(10 + Double($0) / 60) - 10 }
        #expect(got == [0, 0.25, 0.25, 0.5, 0.5, 0.5, 0.75, 0.75, 1])
    }

    @Test func backgroundDayHours() {
        #expect(Eligibility.actraBackgroundDayHours(onSet: 5) == 8)
        #expect(Eligibility.actraBackgroundDayHours(onSet: 8.5) == 8)
        #expect(Eligibility.actraBackgroundDayHours(onSet: 11.2) == 10.25)
        #expect(Eligibility.actraBackgroundDayHours(onSet: 14) == 13)
    }

    @Test func backgroundJobHours() {
        #expect(Eligibility.hours(rule: "actra_background", totalHours: 33, days: 3, hoursPerDay: 12) == 33)
        #expect(Eligibility.hours(rule: "actra_background", totalHours: 6, days: 1, hoursPerDay: 6) == 8)
        #expect(Eligibility.hours(rule: "actra_background", totalHours: 9.4, days: 1, hoursPerDay: nil) == 9.5)
        #expect(Eligibility.hours(rule: nil, totalHours: 9.4, days: 1, hoursPerDay: nil) == 9.4)
    }

    @Test func twelveMonthWindow() {
        let today = ISO8601DateFormatter().date(from: "2026-10-16T12:00:00Z")!
        #expect(Eligibility.windowStart(months: 12, today: today) == "2025-10-16")
    }
}

struct DeadlineTests {
    @Test func nextOccurrence() {
        var cal = Calendar(identifier: .gregorian); cal.timeZone = TimeZone(identifier: "UTC")!
        let d = Deadline(id: "x", title: "File", month: 6, day: 15, appliesTo: "self_employed", province: nil, unionId: nil,
                         detail: nil, sourceUrl: "https://example.com", checkedOn: "2026-10-17")
        let oct = cal.date(from: DateComponents(year: 2026, month: 10, day: 17))!
        let jun15 = cal.date(from: DateComponents(year: 2026, month: 6, day: 15))!
        #expect(cal.component(.year, from: d.next(after: oct, calendar: cal)!) == 2027)
        #expect(d.next(after: jun15, calendar: cal) == jun15)
    }
}
