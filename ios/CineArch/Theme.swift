import SwiftUI
import UIKit

// CineArch's look (from the CARCH design): black, signal yellow, italic serif titles.
enum Theme {
    static let accent = Color("AccentColor")

    static func serif(_ style: Font.TextStyle) -> Font { .system(style, design: .serif).italic() }

    static func applyNavigationStyle() {
        // Every screen, sheet and full-screen cover uses signal yellow, not system blue.
        UIWindow.appearance().tintColor = UIColor(named: "AccentColor")
        func serifItalic(_ style: UIFont.TextStyle, weight: UIFont.Weight = .regular) -> UIFont {
            let base = UIFontDescriptor.preferredFontDescriptor(withTextStyle: style)
            let d = (base.withDesign(.serif) ?? base).withSymbolicTraits(.traitItalic) ?? base
            return UIFont(descriptor: d, size: 0)
        }
        let nav = UINavigationBarAppearance()
        nav.configureWithDefaultBackground()
        nav.largeTitleTextAttributes = [.font: serifItalic(.largeTitle)]
        nav.titleTextAttributes = [.font: serifItalic(.headline)]
        UINavigationBar.appearance().standardAppearance = nav
        UINavigationBar.appearance().scrollEdgeAppearance = nav
    }
}

/// A square-ended progress bar (the system one has rounded ends).
struct SquareProgress: View {
    let value: Double
    var color: Color = Theme.accent
    var body: some View {
        GeometryReader { g in
            ZStack(alignment: .leading) {
                Rectangle().fill(Color.primary.opacity(0.12))
                Rectangle().fill(color).frame(width: g.size.width * min(1, max(0, value)))
            }
        }
        .frame(height: 6)
        .accessibilityElement().accessibilityValue("\(Int((min(1, max(0, value)) * 100).rounded())) percent")
    }
}

extension Double {
    var money: String { formatted(.currency(code: "CAD").presentation(.narrow)) }
    var hours: String { "\(formatted(.number.precision(.fractionLength(0...2))))h" }
}

extension Date {
    var isoDay: String {
        let f = DateFormatter(); f.calendar = Calendar(identifier: .gregorian); f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"; return f.string(from: self)
    }
    init?(isoDay: String) {
        let f = DateFormatter(); f.calendar = Calendar(identifier: .gregorian); f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"; guard let d = f.date(from: isoDay) else { return nil }; self = d
    }
}

// MARK: Hints and number fields

/// An (i) next to a section title that explains it in a sentence or two.
struct InfoButton: View {
    let title: String
    let text: String
    @State private var shown = false
    var body: some View {
        Button { shown = true } label: { Image(systemName: "info.circle").font(.subheadline) }
            .buttonStyle(.plain).foregroundStyle(Theme.accent)
            .accessibilityLabel("About \(title)")
            .popover(isPresented: $shown) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(title).font(.headline)
                    Text(text).font(.subheadline).fixedSize(horizontal: false, vertical: true)
                }
                .padding()
                .frame(idealWidth: 300, maxWidth: 320)
                .presentationCompactAdaptation(.popover)
            }
    }
}

/// A section title with its (i).
struct HintedHeader: View {
    let title: String
    let hint: String
    var body: some View {
        HStack(spacing: 6) { Text(title); InfoButton(title: title, text: hint); Spacer() }
            .textCase(nil)
    }
}

extension View {
    /// Keeps a text field to a number: digits and one decimal point (none
    /// when `decimals` is false), at most two places after it.
    func numbersOnly(_ text: Binding<String>, decimals: Bool = true) -> some View {
        onChange(of: text.wrappedValue) { _, new in
            var seenPoint = false, places = 0
            let cleaned = String(new.replacingOccurrences(of: ",", with: ".").filter { c in
                if c.isASCII && c.isNumber {
                    if seenPoint { places += 1; return places <= 2 }
                    return true
                }
                if c == "." && decimals && !seenPoint { seenPoint = true; return true }
                return false
            })
            if cleaned != new { text.wrappedValue = cleaned }
        }
    }
}
