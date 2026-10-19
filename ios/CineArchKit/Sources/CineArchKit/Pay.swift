import Foundation

// Pay for work logged by the hour. Same rules as services/pay.ts:
// worked = on the clock minus the unpaid meal, rounded up to the agreement's
// unit; straight time is never less than the minimum call / daily fee; each
// overtime step pays a multiple of the rate from the hour it starts (under
// ACTRA's IPA, of the daily fee divided by 8).

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

    /// `workDay` is the day's place in the work week: a 6th or 7th day pays at a
    /// premium where the agreement has one (873).
    public static func day(onClock: Double, mealMinutes: Double = 0, rate: Double,
                           rule: PayRule? = nil, dailyMinimum: Double? = nil, workDay: Int = 1) -> DayPay {
        let worked = workedHours(onClock, mealMinutes: mealMinutes, incrementMinutes: rule?.incrementMinutes)
        let rate = max(0, rate)
        guard let rule else {
            let amount = cents(worked * rate)
            return DayPay(workedHours: worked, overtimeHours: 0,
                          bands: [PayBand(label: "Straight time", multiplier: 1, hours: worked, amount: amount)],
                          minimumTopUp: 0, total: amount)
        }
        // ACTRA's IPA works overtime out from the daily fee divided by 8.
        let otRate = rule.overtimeBase == "daily_fee" ? max(rate, (dailyMinimum ?? 0) / 8) : rate
        let premium = rule.premium(workDay: workDay)
        let after = premium?.after ?? rule.overtimeAfter
        let multipliers = premium?.multipliers ?? rule.overtimeMultipliers
        let base = premium?.base ?? 1
        let steps = after.enumerated().map { ($0.element, multipliers.indices.contains($0.offset) ? multipliers[$0.offset] : 1) }
        let straightLimit = steps.first?.0 ?? .infinity
        let straight = min(worked, straightLimit)
        var bands = [PayBand(label: premium == nil ? "Straight time" : "Minimum call, \(label(base))", multiplier: base,
                             hours: cents(straight), amount: cents(straight * rate * base))]
        var overtime = 0.0
        for (i, step) in steps.enumerated() {
            let end = i + 1 < steps.count ? steps[i + 1].0 : .infinity
            let hours = max(0, min(worked, end) - step.0)
            guard hours > 0 else { continue }
            overtime += hours
            bands.append(PayBand(label: label(step.1), multiplier: step.1, hours: cents(hours), amount: cents(hours * otRate * step.1)))
        }
        let floor = max(rule.minimumCallHours.map { cents(min($0, straightLimit) * rate * base) } ?? 0, (dailyMinimum ?? 0) * base)
        let topUp = cents(max(0, floor - bands[0].amount))
        let total = cents(bands.reduce(0) { $0 + $1.amount } + topUp)
        return DayPay(workedHours: worked, overtimeHours: cents(overtime), bands: bands, minimumTopUp: topUp, total: total)
    }

    public static func job(onClock: Double, mealMinutes: Double = 0, rate: Double, rule: PayRule? = nil,
                           dailyMinimum: Double? = nil, days: Int = 1, workDay: Int = 1) -> JobPay {
        let days = max(1, days)
        let d = day(onClock: onClock, mealMinutes: mealMinutes, rate: rate, rule: rule, dailyMinimum: dailyMinimum, workDay: workDay)
        return JobPay(day: d, days: days, totalHours: cents(d.workedHours * Double(days)),
                      totalOvertimeHours: cents(d.overtimeHours * Double(days)), gross: cents(d.total * Double(days)))
    }

    /// `vacationPay`: the share of vacation pay already in the rate sheet's rates
    /// (BCMPA 4%). A pay stub shows it on its own line, so a base rate that much
    /// lower is still at scale.
    public static func scaleStatus(rate: Double?, minimum: Double?, vacationPay: Double? = nil) -> ScaleStatus {
        guard var rate, let minimum, rate > 0 else { return .unknown }
        if let v = vacationPay, rate < minimum - 0.005, rate * (1 + v) >= minimum - 0.005 { rate = minimum }
        let diff = cents(rate) - cents(minimum)
        if abs(diff) < 0.005 { return .at }
        return diff > 0 ? .above : .below
    }

    public static func describeOvertime(_ rule: PayRule) -> String {
        zip(rule.overtimeAfter, rule.overtimeMultipliers)
            .map { "\(label($0.1)) after \($0.0.formatted())h" }.joined(separator: ", ")
    }
}
