import Testing
@testable import CineArchKit

// Mirrors tests/pay.test.ts.
let iatse873 = PayRule(minimumCallHours: 8, overtimeAfter: [8, 12, 15], overtimeMultipliers: [1.5, 2, 3], incrementMinutes: 6)
let iatse873Transport = PayRule(minimumCallHours: 9, overtimeAfter: [9, 12, 15], overtimeMultipliers: [1.5, 2, 3], incrementMinutes: 6)
let actraIPA = PayRule(minimumCallHours: nil, overtimeAfter: [8, 12], overtimeMultipliers: [1.5, 2], incrementMinutes: 6)

@Suite struct WorkedHours {
    @Test func subtractsMeal() { #expect(Pay.workedHours(13, mealMinutes: 60) == 12) }
    @Test func roundsUpToUnit() {
        #expect(Pay.workedHours(8 + 7.0 / 60, incrementMinutes: 6) == 8.2)
        #expect(Pay.workedHours(8.1, incrementMinutes: 6) == 8.1)
    }
    @Test func neverNegative() { #expect(Pay.workedHours(0.5, mealMinutes: 60) == 0) }
}

@Suite struct CrewDay {
    let rate = 48.60
    @Test func overtimeAfter8() {
        let p = Pay.day(onClock: 13, mealMinutes: 60, rate: rate, rule: iatse873)
        #expect(p.workedHours == 12); #expect(p.overtimeHours == 4); #expect(p.total == 680.40)
    }
    @Test func steps() {
        let p = Pay.day(onClock: 17, rate: rate, rule: iatse873)
        #expect(p.bands.map { [$0.multiplier, $0.hours] } == [[1, 8], [1.5, 4], [2, 3], [3, 2]])
        #expect(p.total == 1263.60)
    }
    @Test func minimumCall() {
        let p = Pay.day(onClock: 5, rate: rate, rule: iatse873)
        #expect(p.minimumTopUp == 145.80); #expect(p.total == 388.80)
    }
    @Test func tenths() { #expect(Pay.day(onClock: 8 + 7.0 / 60, rate: rate, rule: iatse873).total == 403.38) }
    @Test func transportation() { #expect(Pay.day(onClock: 10, rate: 43.38, rule: iatse873Transport).total == 455.49) }
    @Test func days() {
        let p = Pay.job(onClock: 13, mealMinutes: 60, rate: rate, rule: iatse873, days: 5)
        #expect(p.totalHours == 60); #expect(p.totalOvertimeHours == 20); #expect(p.gross == 3402)
    }
}

@Suite struct PerformerDay {
    @Test func dailyFee() { #expect(Pay.day(onClock: 6, rate: 121.25, rule: actraIPA, dailyMinimum: 972.75).total == 972.75) }
    @Test func overtimeOnTopOfFee() {
        let p = Pay.day(onClock: 10.5, mealMinutes: 30, rate: 121.25, rule: actraIPA, dailyMinimum: 972.75)
        #expect(p.workedHours == 10); #expect(p.total == 1336.50)
    }
}

@Suite struct Scale {
    @Test func status() {
        #expect(Pay.scaleStatus(rate: 48.6, minimum: 48.6) == .at)
        #expect(Pay.scaleStatus(rate: 40, minimum: 48.6) == .below)
        #expect(Pay.scaleStatus(rate: 50, minimum: 48.6) == .above)
        #expect(Pay.scaleStatus(rate: nil, minimum: 48.6) == .unknown)
    }
    @Test func nonUnion() {
        let p = Pay.day(onClock: 10, mealMinutes: 30, rate: 22)
        #expect(p.total == 209); #expect(p.overtimeHours == 0)
    }
}
