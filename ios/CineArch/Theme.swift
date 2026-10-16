import SwiftUI
import UIKit

// CineArch's look (from the CARCH design): black, signal yellow, italic serif titles.
enum Theme {
    static let accent = Color("AccentColor")

    static func serif(_ style: Font.TextStyle) -> Font { .system(style, design: .serif).italic() }

    static func applyNavigationStyle() {
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
