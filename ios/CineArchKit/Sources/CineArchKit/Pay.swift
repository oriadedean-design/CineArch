import Foundation

// Pay for work logged by the hour. Same rules as services/pay.ts:
// worked = on the clock minus the unpaid meal, rounded up to the agreement's
// unit; straight time is never less than the minimum call / daily fee; each
// overtime step pays a multiple of the rate from the hour it starts.

public struct PayBand: Sendable, Hashable {
    public var label: String
    public var multiplier: Double
    public var hours: Double
    public var amount: Double
}

public struct DayPay: Sendable, Hashable {
    public var workedHours: Double
    public var overtimeHours: Double
    public var bands: [PayBand]
    public var minimumTopUp: Double
    public var total: Double
}

public struct JobPay: Sendable, Hashable {
    public var day: DayPay
    public var days: Int
    public var totalHours: Double
    public var totalOvertimeHours: Double
    public var gross: Double
}

public enum ScaleStatus: String, Sendable { case above, at, below, unknown }

public enum Pay {
    static func cents(_ n: Double) -> Double { (n * 100).rounded() / 100 }

    static func label(_ m: Double) -> String {
        m == m.rounded() ? "\(Int(m))x" : String(format: "%.1fx", m)
    }

    public static func workedHours(_ onClock: Double, mealMinutes: Double = 0, incrementMinutes: Int? = nil) -> Double {
        let raw = max(0, onClock - max(0, mealMinutes) / 60)
        guard let inc = incrementMinutes, inc > 0 else { return cents(raw) }
        let unit = Double(inc) / 60
        // Round up to the next unit, ignoring float noise.
        let units = ((raw / unit) / 1e-6).rounded() * 1e-6
        return cents(units.rounded(.up) * unit)
    }

    public static func day(onClock: Double, mealMinutes: Double = 0, rate: Double,
                           rule: PayRule? = nil, dailyMinimum: Double? = nil) -> DayPay {
        let worked = workedHours(onClock, mealMinutes: mealMinutes, incrementMinutes: rule?.incrementMinutes)
        let rate = max(0, rate)
        guard let rule else {
            let amount = cents(worked * rate)
            return DayPay(workedHours: worked, overtimeHours: 0,
                          bands: [PayBand(label: "Straight time", multiplier: 1, hours: worked, amount: amount)],
                          minimumTopUp: 0, total: amount)
        }
        let steps = rule.overtimeAfter.enumerated().map { ($0.element, rule.overtimeMultipliers.indices.contains($0.offset) ? rule.overtimeMultipliers[$0.offset] : 1) }
        let straightLimit = steps.first?.0 ?? .infinity
        let straight = min(worked, straightLimit)
        var bands = [PayBand(label: "Straight time", multiplier: 1, hours: cents(straight), amount: cents(straight * rate))]
        var overtime = 0.0
        for (i, step) in steps.enumerated() {
            let end = i + 1 < steps.count ? steps[i + 1].0 : .infinity
            let hours = max(0, min(worked, end) - step.0)
            guard hours > 0 else { continue }
            overtime += hours
            bands.append(PayBand(label: label(step.1), multiplier: step.1, hours: cents(hours), amount: cents(hours * rate * step.1)))
        }
        let floor = max(rule.minimumCallHours.map { cents(min($0, straightLimit) * rate) } ?? 0, dailyMinimum ?? 0)
        let topUp = cents(max(0, floor - bands[0].amount))
        let total = cents(bands.reduce(0) { $0 + $1.amount } + topUp)
        return DayPay(workedHours: worked, overtimeHours: cents(overtime), bands: bands, minimumTopUp: topUp, total: total)
    }

    public static func job(onClock: Double, mealMinutes: Double = 0, rate: Double, rule: PayRule? = nil,
                           dailyMinimum: Double? = nil, days: Int = 1) -> JobPay {
        let days = max(1, days)
        let d = day(onClock: onClock, mealMinutes: mealMinutes, rate: rate, rule: rule, dailyMinimum: dailyMinimum)
        return JobPay(day: d, days: days, totalHours: cents(d.workedHours * Double(days)),
                      totalOvertimeHours: cents(d.overtimeHours * Double(days)), gross: cents(d.total * Double(days)))
    }

    public static func scaleStatus(rate: Double?, minimum: Double?) -> ScaleStatus {
        guard let rate, let minimum, rate > 0 else { return .unknown }
        let diff = cents(rate) - cents(minimum)
        if abs(diff) < 0.005 { return .at }
        return diff > 0 ? .above : .below
    }

    public static func describeOvertime(_ rule: PayRule) -> String {
        zip(rule.overtimeAfter, rule.overtimeMultipliers)
            .map { "\(label($0.1)) after \($0.0.formatted())h" }.joined(separator: ", ")
    }
}
