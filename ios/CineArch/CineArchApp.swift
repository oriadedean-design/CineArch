import SwiftUI

@main
struct CineArchApp: App {
    @State private var engine = EngineStore()
    @State private var session = Session()
    @State private var jobs = JobsStore()

    init() { Theme.applyNavigationStyle() }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(engine)
                .environment(session)
                .environment(jobs)
                .preferredColorScheme(.dark)
                .task { await engine.load() }
                .task { await session.watch() }
        }
    }
}

struct RootView: View {
    @State private var tab = Tab.guide
    enum Tab { case guide, calculator, jobs, account }

    var body: some View {
        TabView(selection: $tab) {
            GuideView().tabItem { Label("Guide", systemImage: "book") }.tag(Tab.guide)
            CalculatorView().tabItem { Label("Pay", systemImage: "dollarsign.circle") }.tag(Tab.calculator)
            JobsView().tabItem { Label("Jobs", systemImage: "list.bullet.rectangle") }.tag(Tab.jobs)
            AccountView().tabItem { Label("Account", systemImage: "person.crop.circle") }.tag(Tab.account)
        }
    }
}
