import Foundation
import Testing
@testable import CineArchKit

// Made-up receipts and pay stubs, shaped like what text recognition returns.
struct DocumentReaderTests {
    let today = ISO8601DateFormatter().date(from: "2026-10-17T12:00:00Z")!

    @Test func amounts() {
        #expect(DocumentReader.amounts("TOTAL $1,234.56") == [1234.56])
        #expect(DocumentReader.amounts("Sous-total 12,50 $") == [12.5])
        #expect(DocumentReader.amounts("Qty 2 @ 3.99  7.98") == [3.99, 7.98])
        #expect(DocumentReader.amounts("GST/HST # 123456789 RT0001").isEmpty)
    }

    @Test func receipt() {
        let r = DocumentReader.receipt(lines: [
            "Vistek Camera Store", "496 Queen St E, Toronto", "Oct 9, 2026 14:02",
            "Lens tissue          8.99", "Slate markers       12.00",
            "SUBTOTAL            20.99", "HST 13%              2.73", "TOTAL               23.72",
            "HST # 123456789 RT0001", "Thank you",
        ], today: today)
        #expect(r == ReadReceipt(vendor: "Vistek Camera Store", total: 23.72, tax: 2.73, date: "2026-10-09"))
    }

    @Test func receiptTotalOnNextLine() {
        let r = DocumentReader.receipt(lines: ["Craft Coffee", "TOTAL", "$6.45"], today: today)
        #expect(r.total == 6.45)
        #expect(r.tax == nil)
        #expect(r.date == nil)
    }

    @Test func receiptLeavesFutureDatesOut() {
        let r = DocumentReader.receipt(lines: ["Shop", "Valid until Dec 31, 2027", "TOTAL 5.00"], today: today)
        #expect(r.date == nil)
    }

    @Test func payStub() {
        let p = DocumentReader.payStub(lines: [
            "Northern Lights Productions Inc.", "PAY STATEMENT",
            "Period: 2026-10-05 to 2026-10-11",
            "Regular hours 40.0   Rate 48.60", "Total hours 52.5",
            "Gross pay   2,916.00", "Net pay     2,104.33",
        ], today: today)
        #expect(p.employer == "Northern Lights Productions Inc.")
        #expect(p.startDate == "2026-10-05")
        #expect(p.endDate == "2026-10-11")
        #expect(p.gross == 2916)
        #expect(p.hours == 52.5)
        #expect(p.rate == 48.6)
    }
}

struct TextLineTests {
    @Test func joinsPiecesOnTheSameLine() {
        let got = DocumentReader.lines([
            TextBox(text: "2.73", minX: 0.8, midY: 0.501, height: 0.04),
            TextBox(text: "TOTAL", minX: 0.1, midY: 0.45, height: 0.04),
            TextBox(text: "HST", minX: 0.1, midY: 0.5, height: 0.04),
            TextBox(text: "23.72", minX: 0.8, midY: 0.452, height: 0.04),
        ])
        #expect(got == ["HST  2.73", "TOTAL  23.72"])
    }
}

struct AnnotateTests {
    let today = ISO8601DateFormatter().date(from: "2026-10-17T12:00:00Z")!
    func row(_ t: String, _ y: Double) -> TextRow { TextRow(text: t, minX: 0.1, minY: y - 0.02, maxX: 0.9, maxY: y + 0.02) }

    @Test func findsEachFieldAndChecksIt() {
        let rows = [row("VISTEK CAMERA STORE", 0.9), row("Sep 4, 2026  14:02", 0.85), row("SUBTOTAL  186.00", 0.5),
                    row("HST 13%  24.18", 0.45), row("TOTAL  210.18", 0.4)]
        let marks = DocumentReader.annotate(rows, [
            ProofField("Store", .name, record: nil),
            ProofField("Date", .date("2026-09-04"), record: "Sep 4, 2026"),
            ProofField("GST/HST", .money(24.18), record: "$24.18", keywords: ["HST", "GST"]),
            ProofField("Total", .money(210.18), record: "$210.18", keywords: ["TOTAL"]),
        ], today: today)
        #expect(marks.map(\.onPhoto) == ["VISTEK CAMERA STORE", "Sep 4, 2026  14:02", "HST 13%  24.18", "TOTAL  210.18"])
        #expect(marks.map(\.matches) == [false, true, true, true])     // a store name is noted, not matched
    }

    @Test func saysWhenAFigureIsNotThere() {
        let marks = DocumentReader.annotate([row("TOTAL  99.00", 0.4)], [ProofField("Total", .money(210.18), record: "$210.18", keywords: ["TOTAL"])], today: today)
        #expect(marks[0].onPhoto == nil)
        #expect(marks[0].matches == false)
    }

    @Test func rowsKeepTheirBoxes() {
        let r = DocumentReader.rows([TextBox(text: "HST", minX: 0.1, midY: 0.5, height: 0.04, width: 0.1),
                                     TextBox(text: "2.73", minX: 0.8, midY: 0.5, height: 0.04, width: 0.1)])
        #expect(r == [TextRow(text: "HST  2.73", minX: 0.1, minY: 0.48, maxX: 0.9, maxY: 0.52)])
    }
}
