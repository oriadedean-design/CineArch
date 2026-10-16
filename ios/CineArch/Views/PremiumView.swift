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
