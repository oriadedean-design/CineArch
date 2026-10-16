import Foundation

// Reads the text lines of a receipt or pay stub (from the phone's text
// recognition, top to bottom) into the fields CineArch needs. Guesses only:
// the app shows each one for the person to check before anything is saved,
// and leaves a field empty rather than invent it.

public struct ReadReceipt: Equatable, Sendable {
    public var vendor: String?
    public var total: Double?
    public var tax: Double?          // GST/HST/TPS/TVH, when printed
    public var date: String?         // YYYY-MM-DD
}

public struct ReadPayStub: Equatable, Sendable {
    public var employer: String?
    public var gross: Double?
    public var hours: Double?
    public var rate: Double?
    public var startDate: String?    // YYYY-MM-DD, first work or period date
    public var endDate: String?      // last one, when there's a range
}

/// One piece of recognized text and where it sits (Vision's normalized
/// coordinates: y runs bottom to top).
public struct TextBox: Sendable {
    public var text: String
    public var minX: Double
    public var midY: Double
    public var height: Double
    public init(text: String, minX: Double, midY: Double, height: Double) {
        self.text = text; self.minX = minX; self.midY = midY; self.height = height
    }
}

public enum DocumentReader {
    /// Joins pieces that sit on the same printed line, left to right, and returns
    /// the lines top to bottom. ("HST" and "2.73" come back as two pieces when
    /// there's a gap between them.)
    public static func lines(_ boxes: [TextBox]) -> [String] {
        var rows: [[TextBox]] = []
        for b in boxes.sorted(by: { $0.midY > $1.midY }) {
            if let last = rows.last?.first, abs(last.midY - b.midY) < max(last.height, b.height) * 0.5 {
                rows[rows.count - 1].append(b)
            } else {
                rows.append([b])
            }
        }
        return rows.map { $0.sorted { $0.minX < $1.minX }.map(\.text).joined(separator: "  ") }
    }

    // MARK: Receipts

    public static func receipt(lines raw: [String], today: Date = Date()) -> ReadReceipt {
        let lines = clean(raw)
        var r = ReadReceipt()
        r.vendor = lines.first { isName($0) }
        r.date = dates(in: lines, today: today).first

        // TOTAL (not SUBTOTAL): the amount on that line, or the next one.
        let totalIdx = lines.indices.reversed().first { i in
            let u = lines[i].uppercased()
            return (u.contains("TOTAL") || u.contains("AMOUNT DUE") || u.contains("MONTANT")) && !u.contains("SUB") && !u.contains("SOUS")
        }
        if let i = totalIdx { r.total = amounts(lines[i]).last ?? (i + 1 < lines.count ? amounts(lines[i + 1]).first : nil) }
        if r.total == nil { r.total = lines.flatMap(amounts).max() }

        let taxLine = lines.first { l in
            let u = l.uppercased()
            return ["GST", "HST", "TPS", "TVH"].contains { u.range(of: "\\b\($0)\\b", options: .regularExpression) != nil }
                && !u.contains("#") && !u.contains("REG") && !u.contains("NO.")
        }
        if let t = taxLine.flatMap({ amounts($0).last }), t != r.total { r.tax = t }
        return r
    }

    // MARK: Pay stubs

    public static func payStub(lines raw: [String], today: Date = Date()) -> ReadPayStub {
        let lines = clean(raw)
        var p = ReadPayStub()
        p.employer = lines.first { isName($0) }
        let ds = dates(in: lines, today: today).sorted()
        p.startDate = ds.first
        p.endDate = ds.count > 1 ? ds.last : nil
        p.gross = labelled(lines, ["GROSS", "TOTAL EARNINGS", "BRUT", "TOTAL PAY"])
        p.hours = labelled(lines, ["TOTAL HOURS", "TOTAL HRS", "HOURS", "HRS", "HEURES"], money: false)
        p.rate = labelled(lines, ["RATE", "TAUX"])
        return p
    }

    // MARK: Pieces

    /// Amounts like 1,234.56, $12.00 or 12,50 (French decimal comma).
    public static func amounts(_ line: String) -> [Double] {
        let pattern = #"(?<![\d.,])\$?\s?(\d{1,3}(?:[ ,]\d{3})+|\d+)([.,])(\d{2})(?![\d])"#
        guard let re = try? NSRegularExpression(pattern: pattern) else { return [] }
        let ns = line as NSString
        return re.matches(in: line, range: NSRange(location: 0, length: ns.length)).compactMap { m in
            let whole = ns.substring(with: m.range(at: 1)).replacingOccurrences(of: ",", with: "").replacingOccurrences(of: " ", with: "")
            return Double("\(whole).\(ns.substring(with: m.range(at: 3)))")
        }
    }

    /// Dates on the page, oldest first, as YYYY-MM-DD; none in the future.
    static func dates(in lines: [String], today: Date) -> [String] {
        guard let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.date.rawValue) else { return [] }
        let text = lines.joined(separator: "\n")
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "UTC")!
        let f = DateFormatter()
        f.calendar = cal; f.timeZone = cal.timeZone; f.locale = Locale(identifier: "en_US_POSIX"); f.dateFormat = "yyyy-MM-dd"
        let limit = today.addingTimeInterval(86_400)
        let ns = text as NSString
        var found = [Date]()
        for m in detector.matches(in: text, range: NSRange(location: 0, length: ns.length)) {
            // Only written-out dates with a year or day/month numbers, never "today" or "Friday".
            let said = ns.substring(with: m.range)
            guard said.range(of: #"\d{4}|\d{1,2}[/-]\d{1,2}"#, options: .regularExpression) != nil, let d = m.date else { continue }
            // "until Dec 31" comes back as a range starting today: that start isn't on the page.
            let openEnded = said.lowercased().range(of: #"^(until|till|thru|through|jusqu)"#, options: .regularExpression) != nil
            if !openEnded { found.append(d) }
            if m.duration > 0 { found.append(d.addingTimeInterval(m.duration)) }    // "Oct 5 to Oct 11"
        }
        var seen = Set<String>()
        return found.filter { $0 <= limit }.map { f.string(from: $0) }.filter { seen.insert($0).inserted }.sorted()
    }

    private static func clean(_ raw: [String]) -> [String] {
        raw.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
    }

    /// A line that reads like a business name: mostly letters, no amounts.
    private static func isName(_ l: String) -> Bool {
        let letters = l.filter(\.isLetter).count
        return letters >= 3 && Double(letters) / Double(max(1, l.count)) > 0.6 && amounts(l).isEmpty
            && !["RECEIPT", "INVOICE", "FACTURE", "REÇU", "PAY STUB", "STATEMENT", "WELCOME"].contains { l.uppercased().contains($0) }
    }

    /// The number after the first label found (labels in priority order), on that line or the next.
    private static func labelled(_ lines: [String], _ labels: [String], money: Bool = true) -> Double? {
        let read: (String) -> [Double] = { money ? amounts($0) : numbers($0) }
        for label in labels {
            for (i, l) in lines.enumerated() {
                guard let r = l.uppercased().range(of: label) else { continue }
                let after = String(l[r.upperBound...])
                if let v = read(after).first { return v }
                if i + 1 < lines.count, let v = read(lines[i + 1]).first { return v }
            }
        }
        return nil
    }

    private static func numbers(_ line: String) -> [Double] {
        guard let re = try? NSRegularExpression(pattern: #"\d+(?:[.,]\d+)?"#) else { return [] }
        let ns = line as NSString
        return re.matches(in: line, range: NSRange(location: 0, length: ns.length))
            .compactMap { Double(ns.substring(with: $0.range).replacingOccurrences(of: ",", with: ".")) }
    }
}
