import SwiftUI

@main
struct CineArchApp: App {
    @State private var engine = EngineStore()
    @State private var session = Session()
    @State private var jobs = JobsStore()
    @State private var tracking = TrackingStore()
    @State private var ledger = LedgerStore()

    init() { Theme.applyNavigationStyle() }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(engine)
                .environment(session)
                .environment(jobs)
                .environment(tracking)
                .environment(ledger)
                .preferredColorScheme(.dark)
                .task { await engine.load() }
                .task { await session.watch() }
        }
    }
}

// Your Wrap, Your Slate, Guide (middle), Wrap Wallet, Account, with the clapperboard floating
// above every tab. The pay calculator opens from the clapperboard.
struct RootView: View {
    @Environment(Session.self) private var session
    // `-cinearch.tab wallet` opens on that tab (for screenshots).
    @State private var tab = Tab(rawValue: UserDefaults.standard.string(forKey: "cinearch.tab") ?? "") ?? .wrap
    /// `-cinearch.onboarding YES` opens the call sheet (for screenshots).
    static let showOnboarding = UserDefaults.standard.bool(forKey: "cinearch.onboarding")
    enum Tab: String { case wrap, jobs, ledger = "wallet", guide, account }

    var body: some View {
        TabView(selection: $tab) {
            WrapView().tabItem { Label("Wrap", systemImage: "chart.bar.fill") }.tag(Tab.wrap)
            JobsView().tabItem { Label("Slate", systemImage: "list.bullet.rectangle") }.tag(Tab.jobs)
            GuideView().tabItem { Label("Guide", systemImage: "book") }.tag(Tab.guide)
            LedgerView().tabItem { Label("Wallet", systemImage: "wallet.bifold") }.tag(Tab.ledger)
            AccountView().tabItem { Label("Account", systemImage: "person.crop.circle") }.tag(Tab.account)
        }
        .overlay(alignment: .bottomTrailing) {
            SlateButton().padding(.trailing, 20).padding(.bottom, 84)
        }
        // Outermost, so every screen, sheet and cover gets them: signal yellow,
        // and square corners (film frames, sensors, slates and strips are square).
        .tint(Theme.accent)
        .listStyle(.grouped)
        .buttonBorderShape(.roundedRectangle(radius: 0))
        .fullScreenCover(isPresented: .constant(session.needsOnboarding || Self.showOnboarding)) {
            OnboardingView().tint(Theme.accent).listStyle(.grouped).buttonBorderShape(.roundedRectangle(radius: 0))
        }
    }
}

// Marks the sample account in the top corner; tap to leave the preview.
struct PreviewBadge: View {
    @Environment(Session.self) private var session
    var body: some View {
        if session.isPreview {
            Menu {
                Text("Sample account. Nothing you do here is saved.")
                Button("Leave preview") { session.endPreview() }
            } label: {
                Text("PREVIEW").font(.caption2.weight(.heavy)).tracking(1.5)
                    .foregroundStyle(.black).padding(.horizontal, 10).padding(.vertical, 4)
                    .background(Theme.accent)
            }
        }
    }
}

extension View {
    func previewBadge() -> some View {
        toolbar { ToolbarItem(placement: .topBarLeading) { PreviewBadge() } }
    }
}
