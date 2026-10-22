import SwiftUI
import UIKit

// CineArch's look (from the CARCH design): black, signal yellow, italic serif titles.
enum Theme {
    static let accent = Color("AccentColor")

    // Brand type (same as the website): Instrument Serif italic for titles and
    // big figures, Spline Sans for everything else. Both scale with Dynamic Type.
    // Fonts are in CineArch/Fonts (SIL Open Font License), listed in Info.plist.
    static let serifFont = "InstrumentSerif-Italic"
    static let sansFont = "SplineSans-Regular"

    /// Apple's default point size for each text style, so custom fonts sit where the system ones did.
    static func pointSize(_ style: Font.TextStyle) -> CGFloat {
        switch style {
        case .largeTitle: 34
        case .title: 28
        case .title2: 22
        case .title3: 20
        case .headline, .body: 17
        case .callout: 16
        case .subheadline: 15
        case .footnote: 13
        case .caption: 12
        case .caption2: 11
        @unknown default: 17
        }
    }

    /// Instrument Serif italic. It runs small for its point size, so it's set a little larger.
    static func serif(_ style: Font.TextStyle) -> Font {
        .custom(serifFont, size: (pointSize(style) * 1.18).rounded(), relativeTo: style)
    }

    /// Spline Sans. Headlines are semibold, like the system's.
    static func sans(_ style: Font.TextStyle) -> Font {
        let font = Font.custom(sansFont, size: pointSize(style), relativeTo: style)
        return style == .headline ? font.weight(.semibold) : font
    }

    static func applyNavigationStyle() {
        // Every screen, sheet and full-screen cover uses signal yellow, not system blue.
        UIWindow.appearance().tintColor = UIColor(named: "AccentColor")
        func serifItalic(_ style: UIFont.TextStyle, size: CGFloat) -> UIFont {
            let font = UIFont(name: serifFont, size: size) ?? .preferredFont(forTextStyle: style)
            return UIFontMetrics(forTextStyle: style).scaledFont(for: font)
        }
        let nav = UINavigationBarAppearance()
        nav.configureWithDefaultBackground()
        nav.largeTitleTextAttributes = [.font: serifItalic(.largeTitle, size: 40)]
        nav.titleTextAttributes = [.font: serifItalic(.headline, size: 21)]
        UINavigationBar.appearance().standardAppearance = nav
        UINavigationBar.appearance().scrollEdgeAppearance = nav
        // Tab bar labels and the back button in Spline Sans.
        if let tab = UIFont(name: "SplineSans-Medium", size: 10) {
            UITabBarItem.appearance().setTitleTextAttributes([.font: tab], for: .normal)
        }
        if let back = UIFont(name: sansFont, size: 17) {
            UIBarButtonItem.appearance().setTitleTextAttributes([.font: back], for: .normal)
        }
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
                    Text(title).font(Theme.sans(.headline))
                    Text(text).font(Theme.sans(.subheadline)).fixedSize(horizontal: false, vertical: true)
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
