import SwiftUI

@main
struct CineArchApp: App {
    @State private var engine = EngineStore()
    @State private var session = Session()
    @State private var jobs = JobsStore()
    @State private var tracking = TrackingStore()
    @State private var ledger = LedgerStore()
    @State private var representation = RepresentationStore()

    init() { Theme.applyNavigationStyle() }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(engine)
                .environment(session)
                .environment(jobs)
                .environment(tracking)
                .environment(ledger)
                .environment(representation)
                .preferredColorScheme(.dark)
                .task { await engine.load() }
                .task { await session.watch() }
                // A-List Pro: send changes made offline when the connection comes back or the app reopens.
                .onChange(of: Connectivity.shared.isOnline) { _, online in if online { Task { await syncPro() } } }
                .onChange(of: scenePhase) { _, phase in if phase == .active { Task { await syncPro() } } }
        }
    }

    @Environment(\.scenePhase) private var scenePhase

    private func syncPro() async {
        guard session.isPremium, !session.isPreview else { return }
        async let a: Void = jobs.syncNow()
        async let b: Void = tracking.syncNow()
        async let c: Void = ledger.syncNow()
        _ = await (a, b, c)
    }
}

// Your Wrap, Your Slate, Guide (middle), Wrap Wallet, Account, with the clapperboard floating
// above every tab. The pay calculator opens from the clapperboard.
struct RootView: View {
    @Environment(Session.self) private var session
    @Environment(RepresentationStore.self) private var representation
    // `-cinearch.tab wallet` opens on that tab (for screenshots).
    @State private var tab = Tab(rawValue: UserDefaults.standard.string(forKey: "cinearch.tab") ?? "") ?? .wrap
    /// `-cinearch.onboarding YES` opens the call sheet (for screenshots).
    @State private var showOnboarding = UserDefaults.standard.bool(forKey: "cinearch.onboarding")
    @State private var showPermissions = false
    // The table read (WalkthroughView): once per account, right after signing in,
    // then from Account. `-cinearch.walkthrough YES` shows it (for screenshots).
    @State private var replayWalkthrough = UserDefaults.standard.bool(forKey: "cinearch.walkthrough")
    enum Tab: String { case wrap, jobs, ledger = "wallet", guide, account }

    var body: some View {
        TabView(selection: $tab) {
            WrapView().tabItem { Label("Wrap", systemImage: "chart.bar.fill") }.tag(Tab.wrap)
            JobsView(tab: $tab).tabItem { Label("Slate", systemImage: "list.bullet.rectangle") }.tag(Tab.jobs)
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
        .font(Theme.sans(.body))          // brand type for every Text without its own font
        .listStyle(.grouped)
        .buttonBorderShape(.roundedRectangle(radius: 0))
        .fullScreenCover(isPresented: Binding(get: { replayWalkthrough || session.needsWalkthrough },
                                              set: { if !$0 { replayWalkthrough = false } })) {
            WalkthroughView(finish: session.needsOnboarding ? "Set the scene" : "Roll camera") {
                replayWalkthrough = false
                Task { await session.markWalkthroughSeen() }
            }
        }
        .fullScreenCover(isPresented: Binding(get: { !session.needsWalkthrough && !replayWalkthrough && (session.needsOnboarding || showOnboarding) }, set: { if !$0 { showOnboarding = false } })) {
            OnboardingView().tint(Theme.accent).listStyle(.grouped).buttonBorderShape(.roundedRectangle(radius: 0))
        }
        // Again after Setting the Scene: its agent answer becomes "Your agent".
        .task(id: session.identity.map { "\($0)-\(session.needsOnboarding)" }) { await representation.load(preview: session.isPreview) }
        // Once, after signing in and setting the scene: camera and reminders, out of the way.
        .sheet(isPresented: $showPermissions, onDismiss: { UserDefaults.standard.set(true, forKey: Permissions.shownKey) }) {
            NavigationStack { PermissionsView(firstTime: true) }
                .tint(Theme.accent).listStyle(.grouped).buttonBorderShape(.roundedRectangle(radius: 0))
        }
        .task(id: session.identity.map { "\($0)-\(session.needsOnboarding)-\(session.needsWalkthrough)" }) {
            guard !session.needsWalkthrough, session.user != nil, !session.isPreview, !session.needsOnboarding,
                  !UserDefaults.standard.bool(forKey: Permissions.shownKey) else { return }
            showPermissions = true
        }
    }
}

// Marks the sample account in the top corner; tap to leave the preview.
struct PreviewBadge: View {
    @Environment(Session.self) private var session
    var body: some View {
        // `-cinearch.capture YES` hides it for App Store screenshots and previews.
        if session.isPreview && !UserDefaults.standard.bool(forKey: "cinearch.capture") {
            Menu {
                Text("Sample account. Nothing you do here is saved.")
                Button("Leave preview") { session.endPreview() }
            } label: {
                Text("PREVIEW").font(Theme.sans(.caption2).weight(.heavy)).tracking(1.5)
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
