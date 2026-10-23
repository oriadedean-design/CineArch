import SwiftUI

// What comes with each plan, with the one you're on marked.
struct PlansView: View {
    @Environment(Session.self) private var session

    var body: some View {
        let current = session.isPremium ? Plan.pro.id : Plan.indie.id
        List {
            ForEach([Plan.indie, Plan.pro]) { plan in
                Section {
                    VStack(alignment: .leading, spacing: 6) {
                        HStack(alignment: .firstTextBaseline) {
                            Text(plan.name).font(Theme.serif(.title2))
                                .foregroundStyle(plan.id == Plan.pro.id ? Theme.accent : .primary)
                            Spacer()
                            Text(plan.price).font(Theme.sans(.headline)).monospacedDigit()
                        }
                        Text(plan.pitch).font(Theme.sans(.subheadline)).foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 4)
                    ForEach(plan.includes, id: \.self) { item in
                        Label(item, systemImage: "checkmark").font(Theme.sans(.subheadline))
                    }
                    if plan.id == current {
                        Label("Your plan", systemImage: "star.fill").foregroundStyle(Theme.accent).font(Theme.sans(.subheadline).bold())
                    } else if plan.id == Plan.pro.id {
                        UpgradeButton()
                    }
                }
            }
            Section {
                Text("\(Plan.agency.name) is for agencies and managers looking after a roster.")
                    .font(Theme.sans(.footnote)).foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Plans")
    }
}

struct UpgradeButton: View {
    var body: some View {
        VStack(spacing: 6) {
            Button {} label: {
                Label("Go A-List Pro", systemImage: "star.fill").frame(maxWidth: .infinity).font(Theme.sans(.headline))
            }
            .buttonStyle(.borderedProminent).foregroundStyle(.black)
            .disabled(true)
            Text("Upgrades open soon.").font(Theme.sans(.caption)).foregroundStyle(.secondary)
        }
        .listRowBackground(Color.clear)
        .listRowInsets(EdgeInsets())
    }
}

// Shown in place of Wrap Wallet on the free plan.
/// Wrap Wallet on the free plan: the total from your Slate, and each thing
/// A-List Pro adds, shown locked so it's clear what a tap will open.
struct FreeWallet: View {
    @Environment(JobsStore.self) private var jobs
    @Environment(Session.self) private var session

    private static let locked: [(String, String)] = [
        ("plus.square", "Add income and expenses"),
        ("checkmark.seal", "Back each entry with proof (Green Lit)"),
        ("doc.viewfinder", "Scan receipts with your camera"),
        ("tablecells", "Export a spreadsheet"),
        ("percent", "Your GST/HST line and what to set aside"),
    ]

    var body: some View {
        let year = String(Calendar.current.component(.year, from: Date()))
        let earned = jobs.jobs.filter { $0.status != "TENTATIVE" && $0.startDate.hasPrefix(year) }.reduce(0) { $0 + ($1.grossEarnings ?? 0) }
        List {
            Section {
                VStack(alignment: .leading, spacing: 4) {
                    Text(earned.money).font(Theme.serif(.largeTitle)).monospacedDigit()
                    Text("earned in \(year), from the pay on your Slate").font(Theme.sans(.caption)).foregroundStyle(.secondary)
                }
                .padding(.vertical, 4)
            } header: { Text("Your total") }

            Section {
                ForEach(Self.locked, id: \.1) { icon, text in
                    NavigationLink { PlansView() } label: {
                        HStack {
                            Label(text, systemImage: icon)
                            Spacer()
                            Image(systemName: "lock.fill").font(Theme.sans(.caption)).foregroundStyle(.secondary)
                        }
                    }
                }
                UpgradeButton()
            } header: { Text("With \(Plan.pro.name) · \(Plan.pro.price)") } footer: { Group {
                Text("Wrap Wallet keeps your receipts and records online, so it comes with \(Plan.pro.name).")
            }.font(Theme.sans(.footnote)) }
        }
        .task(id: session.identity) { await jobs.use(session.place) }
    }
}

/// A quiet, inline reason to try A-List Pro, built from the person's own
/// numbers. Says only what Pro does today (docs/plan-benefits.md).
/// "Not now" hides it for 7 days on this device.
struct ProNudge: View {
    @Environment(Session.self) private var session
    let id: String
    let title: String
    let detail: String
    @AppStorage private var hiddenUntil: Double
    @State private var showPlans = false

    init(id: String, title: String, detail: String) {
        self.id = id; self.title = title; self.detail = detail
        _hiddenUntil = AppStorage(wrappedValue: 0, "cinearch.nudge.\(id)")
    }

    var body: some View {
        if session.isSignedIn && !session.isPremium && Date().timeIntervalSince1970 > hiddenUntil {
            VStack(alignment: .leading, spacing: 8) {
                Label(Plan.pro.name, systemImage: "star.fill").font(Theme.sans(.caption).weight(.heavy)).foregroundStyle(Theme.accent)
                Text(title).font(Theme.sans(.subheadline).weight(.semibold))
                Text(detail).font(Theme.sans(.caption)).foregroundStyle(.secondary)
                HStack(spacing: 10) {
                    Button("See what's in \(Plan.pro.name)") { showPlans = true }
                        .buttonStyle(.borderedProminent).buttonBorderShape(.roundedRectangle(radius: 0)).foregroundStyle(.black)
                    Button("Not now") { hiddenUntil = Date().addingTimeInterval(7 * 86_400).timeIntervalSince1970 }
                        .buttonStyle(.bordered).buttonBorderShape(.roundedRectangle(radius: 0))
                }
                .font(Theme.sans(.caption).bold())
            }
            .padding(.vertical, 4)
            .sheet(isPresented: $showPlans) {
                NavigationStack {
                    PlansView().toolbar { ToolbarItem(placement: .cancellationAction) { Button("Close") { showPlans = false } } }
                }
            }
        }
    }
}
