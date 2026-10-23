import SwiftUI

// Signed out, CineArch is open to look around (like browsing before you join):
// every screen shows its real layout, figures are hidden, and anything that
// would save or show your own numbers asks you to sign in or create an account.

/// An amount you can't see until you sign in.
struct HiddenAmount: View {
    var font: Font = Theme.sans(.body)
    var body: some View {
        Text("$ •••••").font(font).monospacedDigit().foregroundStyle(.secondary)
            .accessibilityLabel("Hidden until you sign in")
    }
}

/// A row that shows what's here and opens sign-in when tapped.
struct LockedRow: View {
    let title: String
    var systemImage = "lock.fill"
    var detail: String?
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Label(title, systemImage: systemImage)
                Spacer()
                if let detail { Text(detail).font(Theme.sans(.caption)).foregroundStyle(.secondary) }
                Text("Sign in").font(Theme.sans(.caption).bold()).foregroundStyle(Theme.accent)
            }
        }
        .accessibilityHint("Opens sign in")
    }
}

/// The sign-in call at the top of a signed-out screen.
struct LookAroundFooter: View {
    @Environment(Session.self) private var session
    let showAuth: () -> Void
    @State private var showWalkthrough = false

    var body: some View {
        Section {
            Button("Sign in or create an account", action: showAuth)
                .font(Theme.sans(.headline)).frame(maxWidth: .infinity)
                .buttonStyle(.borderedProminent).foregroundStyle(.black)
                .listRowBackground(Color.clear)
            Button("Or look around a sample account") { session.startPreview() }
                .frame(maxWidth: .infinity)
                .listRowBackground(Color.clear)
            Button { showWalkthrough = true } label: { Label("How CineArch works · 1 min", systemImage: "play.rectangle.fill") }
                .frame(maxWidth: .infinity)
                .listRowBackground(Color.clear)
                .fullScreenCover(isPresented: $showWalkthrough) { WalkthroughView(finish: "Roll camera") { showWalkthrough = false } }
        } footer: { Group {
            Text("Free to start. Your Slate and union tracking stay on your phone unless you go \(Plan.pro.name).")
                .frame(maxWidth: .infinity).multilineTextAlignment(.center)
        }.font(Theme.sans(.footnote)) }
    }
}

// MARK: Screens

/// Your Wrap, signed out: the tracker is locked, tax dates are public.
struct LookAroundWrap: View {
    @Environment(EngineStore.self) private var store
    let showAuth: () -> Void

    var body: some View {
        List {
            LookAroundFooter(showAuth: showAuth)
            Section {
                LockedRow(title: "Track a union", systemImage: "chart.bar.fill", action: showAuth)
            } header: { Text("Getting your card") } footer: { Group {
                Text("Count your days on union sets toward your card, member or not.")
            }.font(Theme.sans(.footnote)) }
            Section("Your year on set") {
                Button(action: showAuth) {
                    Text("Mark the slate and your jobs line up here.").foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }
            Section("Income this year") {
                Button(action: showAuth) {
                    HStack(alignment: .firstTextBaseline) {
                        HiddenAmount(font: Theme.serif(.title2))
                        Text("so far this year").font(Theme.sans(.caption)).foregroundStyle(.secondary)
                    }
                }
                .buttonStyle(.plain)
            }
            Section {
                ComingUp(deadlines: store.engine.snapshot.deadlines ?? [], progress: [], jobs: [], engine: store.engine)
            } header: { Text("Coming up") } footer: { Group { Text("Tax dates are open to everyone. Tap one to open its source.") }.font(Theme.sans(.footnote)) }
        }
        .contentMargins(.bottom, 96, for: .scrollContent)     // clear of the clapperboard
    }
}

/// Your Slate, signed out.
struct LookAroundSlate: View {
    let showAuth: () -> Void

    var body: some View {
        List {
            LookAroundFooter(showAuth: showAuth)
            Section {
                Button(action: showAuth) {
                    HStack {
                        ForEach(["Hours", "Union", "Earned"], id: \.self) { label in
                            VStack(spacing: 2) {
                                Text("•••").font(Theme.serif(.title3)).foregroundStyle(.secondary)
                                Text(label).font(Theme.sans(.caption)).foregroundStyle(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Your hours and earnings, hidden until you sign in")
            }
            Section {
                LockedRow(title: "Mark your first day", systemImage: "movieclapper", action: showAuth)
            } footer: { Group {
                Text("Every day you work, with its hours, pay and whose set it was.")
            }.font(Theme.sans(.footnote)) }
        }
        .contentMargins(.bottom, 96, for: .scrollContent)     // clear of the clapperboard
    }
}

/// Wrap Wallet, signed out: the layout with every amount hidden.
struct LookAroundWallet: View {
    let showAuth: () -> Void

    var body: some View {
        List {
            LookAroundFooter(showAuth: showAuth)
            Section {
                Button(action: showAuth) {
                    HStack {
                        ForEach(["Income", "Expenses", "Net"], id: \.self) { label in
                            VStack(spacing: 2) {
                                HiddenAmount(font: Theme.serif(.title3))
                                Text(label).font(Theme.sans(.caption)).foregroundStyle(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Income, expenses and net, hidden until you sign in")
            } header: { Text("\(String(Calendar.current.component(.year, from: Date()))) so far") }

            Section {
                Button(action: showAuth) {
                    HStack(spacing: 12) {
                        Image(systemName: "seal").font(Theme.sans(.title2)).foregroundStyle(.secondary)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("GREEN LIT").font(Theme.sans(.caption).weight(.heavy)).tracking(1.5).foregroundStyle(Color.green)
                            Text("•• of •• backed with proof").font(Theme.sans(.subheadline)).foregroundStyle(.secondary)
                        }
                    }
                }
                .buttonStyle(.plain)
            }

            Section("Ledger") {
                ForEach(0..<3, id: \.self) { _ in
                    Button(action: showAuth) {
                        HStack {
                            Image(systemName: "square.dashed").foregroundStyle(.secondary)
                            VStack(alignment: .leading, spacing: 3) {
                                Text("••••••••••••").font(Theme.sans(.headline)).foregroundStyle(.secondary)
                                Text("•••••• · •••").font(Theme.sans(.caption)).foregroundStyle(.secondary)
                            }
                            Spacer()
                            HiddenAmount()
                        }
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("A ledger entry, hidden until you sign in")
                }
            }
        }
        .contentMargins(.bottom, 96, for: .scrollContent)     // clear of the clapperboard
    }
}
