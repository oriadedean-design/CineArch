import Foundation

// How work counts toward a union tier, the same rules as services/career.ts.
public enum Eligibility {
    /// ACTRA members who joined as AABP before this date may count up to 800 earlier background hours.
    public static let actraLegacyJoin = "2012-10-31"
    public static let actraLegacyHours = 800.0

    public static func quarterHours(_ h: Double) -> Double { (h * 4).rounded() / 4 }

    /// ACTRA Toronto background hours for one day: at least the 8 you were paid for;
    /// past 8, an hour off for lunch; quarter hours (:12 → .25, :54 → the next hour).
    public static func actraBackgroundDayHours(onSet: Double) -> Double {
        onSet > 8 ? max(8, quarterHours(onSet - 1)) : 8
    }

    /// The first day (YYYY-MM-DD) that still counts toward a tier with a window.
    public static func windowStart(months: Int, today: Date = Date()) -> String {
        var cal = Calendar(identifier: .gregorian); cal.timeZone = TimeZone(identifier: "UTC")!
        let d = cal.date(byAdding: .month, value: -months, to: today) ?? today
        let c = cal.dateComponents([.year, .month, .day], from: d)
        return String(format: "%04d-%02d-%02d", c.year!, c.month!, c.day!)
    }

    /// Hours a job adds under a tier's hours rule. `hoursPerDay` is call to wrap.
    public static func hours(rule: String?, totalHours: Double, days: Int, hoursPerDay: Double?) -> Double {
        guard rule == "actra_background" else { return totalHours }
        let days = max(1, days)
        if let h = hoursPerDay { return Double(days) * actraBackgroundDayHours(onSet: h) }
        return Double(days) * max(8, quarterHours(totalHours / Double(days)))
    }
}

extension UnionEngine {
    /// The catalog role a job's role names, else its slug ("Background Performer" → background-performer).
    public func roleId(named name: String) -> String {
        let n = name.trimmingCharacters(in: .whitespaces).lowercased()
        for d in snapshot.departments {
            if let r = d.roles.first(where: { $0.name.lowercased() == n || $0.aliases.contains { $0.lowercased() == n } }) { return r.id }
        }
        return n.replacingOccurrences(of: "[^a-z0-9]+", with: "-", options: .regularExpression)
    }

    public func tier(union id: String, named name: String) -> Union.Tier? {
        union(id)?.tiers.first { $0.name == name }
    }
}
