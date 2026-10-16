import UIKit
import PDFKit
import Vision
import CineArchKit

/// A file ready to upload: under the 1 MB limit, with its extension and type.
struct UploadFile {
    let data: Data
    let ext: String
    let contentType: String
    /// The page images, for reading the text on them.
    let pages: [UIImage]
}

// Getting receipts and pay stubs into shape: photos and scans are shrunk to fit
// under 1 MB per file (the documents bucket refuses anything bigger), and the
// text on them is read on the phone with Apple's text recognition. Nothing is
// sent anywhere to be read.
enum Documents {
    static let maxBytes = 1_048_576
    static let accountLimitBytes: Int64 = 5_368_709_120

    struct TooBig: LocalizedError {
        let bytes: Int
        var errorDescription: String? {
            "This file is \(ByteCountFormatter.string(fromByteCount: Int64(bytes), countStyle: .file)). Files must be 1 MB or less. Scan it or take a photo instead, and CineArch will shrink it to fit."
        }
    }
    struct Unreadable: LocalizedError { var errorDescription: String? { "Couldn't open that file." } }

    /// A photo as a JPEG under 1 MB: smaller and softer until it fits.
    static func photo(_ image: UIImage) -> UploadFile? {
        for side in [2000.0, 1600, 1280, 1000, 800] {
            let img = resized(image, longest: side)
            for q in [0.8, 0.65, 0.5, 0.35] {
                if let d = img.jpegData(compressionQuality: q), d.count <= maxBytes {
                    return UploadFile(data: d, ext: "jpg", contentType: "image/jpeg", pages: [img])
                }
            }
        }
        return nil
    }

    /// Scanned pages as one PDF under 1 MB (each page a compressed JPEG).
    static func scan(_ pages: [UIImage]) -> UploadFile? {
        if pages.count == 1 { return photo(pages[0]) }
        for side in [1600.0, 1280, 1000, 800, 640] {
            for q in [0.6, 0.45, 0.3] {
                let shrunk = pages.compactMap { resized($0, longest: side).jpegData(compressionQuality: q).flatMap(UIImage.init(data:)) }
                let bounds = CGRect(origin: .zero, size: shrunk.first?.size ?? .zero)
                let pdf = UIGraphicsPDFRenderer(bounds: bounds).pdfData { ctx in
                    for p in shrunk { ctx.beginPage(); p.draw(in: bounds) }
                }
                if pdf.count <= maxBytes { return UploadFile(data: pdf, ext: "pdf", contentType: "application/pdf", pages: shrunk) }
            }
        }
        return nil
    }

    /// A chosen file: images are shrunk to fit; a PDF must already be under 1 MB.
    static func file(at url: URL) throws -> UploadFile {
        let ok = url.startAccessingSecurityScopedResource()
        defer { if ok { url.stopAccessingSecurityScopedResource() } }
        guard let data = try? Data(contentsOf: url) else { throw Unreadable() }
        if url.pathExtension.lowercased() == "pdf" {
            guard data.count <= maxBytes else { throw TooBig(bytes: data.count) }
            return UploadFile(data: data, ext: "pdf", contentType: "application/pdf", pages: pdfPages(data))
        }
        guard let image = UIImage(data: data), let file = photo(image) else { throw Unreadable() }
        return file
    }

    /// The text on the pages, top to bottom, read on the phone (English and French).
    static func text(_ pages: [UIImage]) async -> [String] {
        var lines = [String]()
        for page in pages {
            guard let cg = page.cgImage else { continue }
            let request = VNRecognizeTextRequest()
            request.recognitionLevel = .accurate
            request.recognitionLanguages = ["en-CA", "fr-CA"]
            request.usesLanguageCorrection = true
            try? VNImageRequestHandler(cgImage: cg, orientation: .init(page.imageOrientation)).perform([request])
            lines += DocumentReader.lines((request.results ?? []).compactMap { o in
                o.topCandidates(1).first.map { TextBox(text: $0.string, minX: o.boundingBox.minX, midY: o.boundingBox.midY, height: o.boundingBox.height) }
            })
        }
        return lines
    }

    private static func pdfPages(_ data: Data) -> [UIImage] {
        guard let doc = PDFDocument(data: data) else { return [] }
        return (0..<min(doc.pageCount, 3)).compactMap { doc.page(at: $0)?.thumbnail(of: CGSize(width: 1600, height: 1600), for: .mediaBox) }
    }

    private static func resized(_ image: UIImage, longest: CGFloat) -> UIImage {
        let scale = min(1, longest / max(image.size.width, image.size.height))
        guard scale < 1 else { return image }
        let size = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        return UIGraphicsImageRenderer(size: size, format: format).image { _ in image.draw(in: CGRect(origin: .zero, size: size)) }
    }
}

private extension CGImagePropertyOrientation {
    init(_ o: UIImage.Orientation) {
        switch o {
        case .up: self = .up
        case .down: self = .down
        case .left: self = .left
        case .right: self = .right
        case .upMirrored: self = .upMirrored
        case .downMirrored: self = .downMirrored
        case .leftMirrored: self = .leftMirrored
        case .rightMirrored: self = .rightMirrored
        @unknown default: self = .up
        }
    }
}
