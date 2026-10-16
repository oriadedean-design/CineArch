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
                            Text(plan.price).font(.headline).monospacedDigit()
                        }
                        Text(plan.pitch).font(.subheadline).foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 4)
                    ForEach(plan.includes, id: \.self) { item in
                        Label(item, systemImage: "checkmark").font(.subheadline)
                    }
                    if plan.id == current {
                        Label("Your plan", systemImage: "star.fill").foregroundStyle(Theme.accent).font(.subheadline.bold())
                    } else if plan.id == Plan.pro.id {
                        UpgradeButton()
                    }
                }
            }
            Section {
                Text("\(Plan.agency.name) (\(Plan.agency.price)) is for agencies and managers looking after a roster. It's on the website.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Plans")
    }
}

struct UpgradeButton: View {
    var body: some View {
        VStack(spacing: 6) {
            Button {} label: {
                Label("Go A-List Pro", systemImage: "star.fill").frame(maxWidth: .infinity).font(.headline)
            }
            .buttonStyle(.borderedProminent).foregroundStyle(.black)
            .disabled(true)
            Text("Upgrades open soon.").font(.caption).foregroundStyle(.secondary)
        }
        .listRowBackground(Color.clear)
        .listRowInsets(EdgeInsets())
    }
}

// Shown in place of Wrap Wallet on the free plan.
struct WalletLocked: View {
    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 10) {
                    Image(systemName: "lock.fill").font(.title).foregroundStyle(Theme.accent)
                    Text("Wrap Wallet comes with A-List Pro").font(Theme.serif(.title2))
                    Text("Your film money in one place: what you earned, what you spent, your GST/HST line and what to set aside for tax.")
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 6)
            }
            Section("What comes with \(Plan.pro.name) · \(Plan.pro.price)") {
                ForEach(Plan.pro.includes.dropFirst(), id: \.self) { Label($0, systemImage: "checkmark").font(.subheadline) }
                UpgradeButton()
            }
            Section {
                NavigationLink("Compare plans") { PlansView() }
            }
        }
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
                Label(Plan.pro.name, systemImage: "star.fill").font(.caption.weight(.heavy)).foregroundStyle(Theme.accent)
                Text(title).font(.subheadline.weight(.semibold))
                Text(detail).font(.caption).foregroundStyle(.secondary)
                HStack(spacing: 10) {
                    Button("See what's in \(Plan.pro.name)") { showPlans = true }
                        .buttonStyle(.borderedProminent).buttonBorderShape(.roundedRectangle(radius: 0)).foregroundStyle(.black)
                    Button("Not now") { hiddenUntil = Date().addingTimeInterval(7 * 86_400).timeIntervalSince1970 }
                        .buttonStyle(.bordered).buttonBorderShape(.roundedRectangle(radius: 0))
                }
                .font(.caption.bold())
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
