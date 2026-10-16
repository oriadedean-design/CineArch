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
    public var width: Double
    public init(text: String, minX: Double, midY: Double, height: Double, width: Double = 0) {
        self.text = text; self.minX = minX; self.midY = midY; self.height = height; self.width = width
    }
}

/// A printed line on a photo: its text and the box around it (normalized, y bottom-up).
public struct TextRow: Sendable, Equatable {
    public var text: String
    public var minX, minY, maxX, maxY: Double
}

/// What a report checks on a proof photo, against the person's own records.
public struct ProofField: Sendable {
    public enum Kind: Sendable { case money(Double), date(String), number(Double), name }
    public var label: String
    public var kind: Kind
    public var record: String?        // as shown in "Your records"; nil for things the entry doesn't hold
    public var keywords: [String]     // words on the line that make a match more likely (TOTAL, HST…)
    public init(_ label: String, _ kind: Kind, record: String?, keywords: [String] = []) {
        self.label = label; self.kind = kind; self.record = record; self.keywords = keywords
    }
}

/// Where a field was found on the photo (if it was), and whether it matches the records.
public struct ProofMark: Sendable, Equatable {
    public var number: Int
    public var label: String
    public var onPhoto: String?       // the line as read; nil when not found
    public var record: String?
    public var matches: Bool
    public var row: TextRow?
}

public enum DocumentReader {
    /// The printed lines with their boxes, top to bottom (pieces on one line joined).
    public static func rows(_ boxes: [TextBox]) -> [TextRow] {
        var groups: [[TextBox]] = []
        for b in boxes.sorted(by: { $0.midY > $1.midY }) {
            if let last = groups.last?.first, abs(last.midY - b.midY) < max(last.height, b.height) * 0.5 {
                groups[groups.count - 1].append(b)
            } else {
                groups.append([b])
            }
        }
        return groups.map { g in
            let s = g.sorted { $0.minX < $1.minX }
            return TextRow(text: s.map(\.text).joined(separator: "  "),
                           minX: s.map(\.minX).min() ?? 0, minY: s.map { $0.midY - $0.height / 2 }.min() ?? 0,
                           maxX: s.map { $0.minX + $0.width }.max() ?? 0, maxY: s.map { $0.midY + $0.height / 2 }.max() ?? 0)
        }
    }

    /// Finds each field on the photo's lines and says whether it matches the records.
    /// A field that isn't found is reported as not found, never guessed.
    public static func annotate(_ rows: [TextRow], _ fields: [ProofField], today: Date = Date()) -> [ProofMark] {
        var used = Set<Int>()
        return fields.enumerated().map { n, f in
            let candidates = rows.indices.filter { i in
                guard !used.contains(i) else { return false }
                let line = rows[i].text
                switch f.kind {
                case .money(let v): return amounts(line).contains { abs($0 - v) < 0.005 }
                case .number(let v): return numbers(line).contains { abs($0 - v) < 0.005 } && hasKeyword(line, f.keywords)
                case .date(let iso): return dates(in: [line], today: today).contains(iso)
                case .name: return isName(line)
                }
            }
            // Prefer the line with the right word on it (TOTAL, not SUBTOTAL).
            let pick = candidates.first { hasKeyword(rows[$0].text, f.keywords) && !rows[$0].text.uppercased().contains("SUB") } ?? candidates.first
            if let i = pick { used.insert(i) }
            let found = pick.map { rows[$0] }
            let noted: Bool = if case .name = f.kind { true } else { false }
            return ProofMark(number: n + 1, label: f.label, onPhoto: found?.text, record: f.record,
                             matches: found != nil && !noted, row: found)
        }
    }

    private static func hasKeyword(_ line: String, _ words: [String]) -> Bool {
        words.isEmpty || words.contains { line.uppercased().contains($0) }
    }

    /// Joins pieces that sit on the same printed line, left to right, and returns
    /// the lines top to bottom. ("HST" and "2.73" come back as two pieces when
    /// there's a gap between them.)
    public static func lines(_ boxes: [TextBox]) -> [String] { rows(boxes).map(\.text) }

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
    static func isName(_ l: String) -> Bool {
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

    static func numbers(_ line: String) -> [Double] {
        guard let re = try? NSRegularExpression(pattern: #"\d+(?:[.,]\d+)?"#) else { return [] }
        let ns = line as NSString
        return re.matches(in: line, range: NSRange(location: 0, length: ns.length))
            .compactMap { Double(ns.substring(with: $0.range).replacingOccurrences(of: ",", with: ".")) }
    }
}
