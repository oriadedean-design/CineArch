#if os(macOS)
import AppKit
import Foundation
import Testing
import Vision
@testable import CineArchKit

// End to end on a drawn receipt: Apple's text recognition (the same engine the
// iPhone uses) reads the image, then DocumentReader picks out the fields.
struct RecognitionTests {
    let today = ISO8601DateFormatter().date(from: "2026-10-17T12:00:00Z")!

    private func render(_ lines: [String]) -> CGImage {
        let size = NSSize(width: 900, height: 70 * lines.count + 80)
        let image = NSImage(size: size)
        image.lockFocus()
        NSColor.white.setFill(); NSRect(origin: .zero, size: size).fill()
        let attrs: [NSAttributedString.Key: Any] = [.font: NSFont.monospacedSystemFont(ofSize: 36, weight: .regular), .foregroundColor: NSColor.black]
        for (i, l) in lines.enumerated() {
            (l as NSString).draw(at: NSPoint(x: 40, y: size.height - 80 - CGFloat(i) * 70), withAttributes: attrs)
        }
        image.unlockFocus()
        return image.cgImage(forProposedRect: nil, context: nil, hints: nil)!
    }

    private func read(_ image: CGImage) throws -> [String] {
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.recognitionLanguages = ["en-CA", "fr-CA"]
        try VNImageRequestHandler(cgImage: image).perform([request])
        return DocumentReader.lines((request.results ?? []).compactMap { o in
            o.topCandidates(1).first.map { TextBox(text: $0.string, minX: o.boundingBox.minX, midY: o.boundingBox.midY, height: o.boundingBox.height) }
        })
    }

    @Test func drawnReceipt() throws {
        let lines = try read(render([
            "Vistek Camera Store", "Oct 9, 2026", "Lens tissue      8.99", "Slate markers   12.00",
            "SUBTOTAL        20.99", "HST              2.73", "TOTAL           23.72",
        ]))
        let r = DocumentReader.receipt(lines: lines, today: today)
        #expect(r.vendor == "Vistek Camera Store")
        #expect(r.total == 23.72)
        #expect(r.tax == 2.73)
        #expect(r.date == "2026-10-09")
    }

    @Test func drawnPayStub() throws {
        let lines = try read(render([
            "Northern Lights Productions", "Period: Oct 5, 2026 to Oct 11, 2026",
            "Regular hours  40.0", "Total hours    52.5", "Rate           48.60", "Gross pay   2,916.00", "Net pay     2,104.33",
        ]))
        let p = DocumentReader.payStub(lines: lines, today: today)
        #expect(p.employer == "Northern Lights Productions")
        #expect(p.startDate == "2026-10-05")
        #expect(p.endDate == "2026-10-11")
        #expect(p.hours == 52.5)
        #expect(p.rate == 48.6)
        #expect(p.gross == 2916)
    }
}
#endif
