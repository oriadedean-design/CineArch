import SwiftUI

// The table read: a short animated walkthrough of how CineArch works, shown once
// per account right after signing in, and any time from Account. Each scene acts out one step of the
// flow with the app's own pieces (the clapperboard, the Slate, the progress
// bar), so what you see here is what you'll tap later. Figures are examples.

struct WalkthroughView: View {
    /// The last button: "Set the scene" when Setting the Scene comes next.
    var finish = "Roll camera"
    var onDone: () -> Void
    @State private var page = UserDefaults.standard.integer(forKey: "cinearch.walkthroughPage")   // launch argument, for screenshots
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    struct Scene {
        let slug: String
        let title: String
        let body: String
        let plan: String?
    }

    static let scenes = [
        Scene(slug: "Mark the slate", title: "Every day on set, one tap.",
              body: "Tap the clapperboard after each day: the production, your role, your hours and whether the production was union. It lands on your Slate.",
              plan: nil),
        Scene(slug: "Check the pay", title: "Know you were paid right.",
              body: "CineArch works out overtime from the union's rules and checks your rate against the union minimum for your role.",
              plan: nil),
        Scene(slug: "Get your card", title: "Every union day counts.",
              body: "Days on a union production count toward that union's card, even before you're a member. Your Wrap shows how close you are.",
              plan: nil),
        Scene(slug: "Wrap Wallet", title: "Tax, set aside as you earn.",
              body: "Income and expenses with Canadian tax rules: your $30k GST/HST line, and what to set aside for CPP and income tax.",
              plan: Plan.pro.name),
        Scene(slug: "Your Ledger", title: "Proof, ready when they ask.",
              body: "Turn your Slate and Wallet into a PDF or spreadsheet for a union application or tax time. Up to 3 reports a month.",
              plan: Plan.pro.name),
        Scene(slug: "Where it's kept", title: "Your data, your call.",
              body: "\(Plan.indie.name) keeps your Slate and union days on this iPhone only, so a lost phone takes them with it. \(Plan.pro.name) syncs them online.",
              plan: nil),
    ]

    private var isLast: Bool { page == Self.scenes.count - 1 }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("TABLE READ").font(Theme.sans(.caption).weight(.heavy)).tracking(2).foregroundStyle(Theme.accent)
                Spacer()
                Button("Skip", action: onDone).font(Theme.sans(.subheadline).bold()).foregroundStyle(.secondary)
                    .accessibilityHint("Closes the walkthrough. It's in Account any time.")
            }
            .padding(.horizontal, 24).padding(.top, 12)

            TabView(selection: $page) {
                ForEach(Self.scenes.indices, id: \.self) { i in
                    SceneView(index: i, scene: Self.scenes[i], active: page == i, reduceMotion: reduceMotion).tag(i)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))

            FilmStrip(count: Self.scenes.count, current: page) { i in withAnimation { page = i } }
                .padding(.bottom, 20)

            Button {
                if isLast { onDone() } else { withAnimation { page += 1 } }
            } label: {
                Text(isLast ? finish : "Next").font(Theme.sans(.headline)).foregroundStyle(.black)
                    .frame(maxWidth: .infinity).frame(height: 54)
                    .background(Theme.accent)
            }
            .padding(.horizontal, 24).padding(.bottom, 16)
            .accessibilityHint(isLast ? "Closes the walkthrough and starts CineArch" : "Shows the next step")
        }
        .background(Color.black.ignoresSafeArea())
        .preferredColorScheme(.dark)
    }
}

/// Page indicator as film frames: tap one to jump to it.
private struct FilmStrip: View {
    let count: Int
    let current: Int
    let select: (Int) -> Void

    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<count, id: \.self) { i in
                Button { select(i) } label: {
                    Rectangle()
                        .fill(i == current ? Theme.accent : Color.white.opacity(0.2))
                        .frame(width: i == current ? 28 : 14, height: 8)
                }
                .accessibilityLabel("Scene \(i + 1) of \(count)")
                .accessibilityAddTraits(i == current ? .isSelected : [])
            }
        }
        .animation(.snappy, value: current)
    }
}

private struct SceneView: View {
    let index: Int
    let scene: WalkthroughView.Scene
    let active: Bool
    let reduceMotion: Bool
    /// How far the illustration has played: 0 (start) to 3 (finished).
    @State private var stage = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Spacer(minLength: 8)
            illustration
                .padding(.top, index < 5 ? 22 : 0)
                .frame(maxWidth: .infinity).frame(height: 260)
                .overlay(alignment: .topTrailing) { if index < 5 { ExampleTag() } }
                .background(Color.white.opacity(0.04))
                .overlay(Rectangle().stroke(Color.white.opacity(0.1)))
                .accessibilityHidden(true)
            HStack(spacing: 8) {
                Text("SCENE \(index + 1) · \(scene.slug.uppercased())").font(Theme.sans(.caption).weight(.heavy)).tracking(1.5).foregroundStyle(.secondary)
                if let plan = scene.plan {
                    Text(plan.uppercased()).font(Theme.sans(.caption2).weight(.heavy)).tracking(1).foregroundStyle(.black)
                        .padding(.horizontal, 6).padding(.vertical, 2).background(Theme.accent)
                }
            }
            Text(scene.title).font(Theme.serif(.largeTitle)).foregroundStyle(.white).fixedSize(horizontal: false, vertical: true)
            Text(scene.body).font(Theme.sans(.body)).foregroundStyle(.white.opacity(0.75)).fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 8)
        }
        .padding(.horizontal, 24)
        .accessibilityElement(children: .combine)
        .task(id: active) { await play() }
    }

    /// Plays the scene each time it comes on screen; with Reduce Motion, shows the end.
    private func play() async {
        guard active else { stage = 0; return }
        if reduceMotion { stage = 3; return }
        stage = 0
        for s in 1...3 {
            try? await Task.sleep(for: .milliseconds(s == 1 ? 350 : 650))
            guard !Task.isCancelled else { return }
            withAnimation(.spring(duration: 0.5, bounce: 0.25)) { stage = s }
        }
    }

    @ViewBuilder private var illustration: some View {
        switch index {
        case 0: MarkTheSlate(stage: stage)
        case 1: CheckThePay(stage: stage)
        case 2: GetYourCard(stage: stage)
        case 3: WalletCurve(stage: stage)
        case 4: LedgerPages(stage: stage)
        default: WhereItsKept(stage: stage)
        }
    }
}

// MARK: Illustrations (example figures)

private struct ExampleTag: View {
    var body: some View {
        Text("EXAMPLE").font(Theme.sans(.caption2).weight(.heavy)).tracking(1).foregroundStyle(.secondary)
            .padding(10)
    }
}

/// The clapperboard snaps shut and the day drops onto the Slate.
private struct MarkTheSlate: View {
    let stage: Int
    var body: some View {
        VStack(spacing: 22) {
            ZStack(alignment: .topLeading) {
                Rectangle().fill(Theme.accent).frame(width: 96, height: 64).offset(y: 18)
                    .overlay(Image(systemName: "movieclapper").font(Theme.sans(.title)).foregroundStyle(.black).offset(y: 18))
                Stripes().frame(width: 96, height: 16)
                    .rotationEffect(.degrees(stage >= 1 ? 0 : -24), anchor: .bottomLeading)
            }
            .frame(width: 96, height: 82)
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    Text("Northern Lights").font(Theme.sans(.headline))
                    Text("Camera Trainee · 10h · union production").font(Theme.sans(.caption)).foregroundStyle(.secondary)
                }
                Spacer()
                Text("$440.00").font(Theme.sans(.headline)).monospacedDigit()
            }
            .padding(12).background(Color.white.opacity(0.08))
            .padding(.horizontal, 24)
            .opacity(stage >= 2 ? 1 : 0).offset(y: stage >= 2 ? 0 : -30)
            Text("On your Slate").font(Theme.sans(.caption).bold()).foregroundStyle(Theme.accent).opacity(stage >= 3 ? 1 : 0)
        }
    }

    private struct Stripes: View {
        var body: some View {
            HStack(spacing: 0) {
                ForEach(0..<6, id: \.self) { i in Rectangle().fill(i.isMultiple(of: 2) ? Color.white : Color.black) }
            }
            .overlay(Rectangle().stroke(Color.white))
        }
    }
}

/// Straight time, then overtime, then the check against the minimum.
private struct CheckThePay: View {
    let stage: Int
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            row("8h straight time × $40.00", "$320.00", show: stage >= 1)
            row("2h overtime × $60.00", "$120.00", show: stage >= 2)
            Divider().overlay(Color.white.opacity(0.3)).opacity(stage >= 2 ? 1 : 0)
            row("Gross pay", stage >= 2 ? "$440.00" : "$320.00", show: stage >= 1, bold: true)
            Label("At or above the union minimum", systemImage: "checkmark.square.fill")
                .font(Theme.sans(.subheadline).bold()).foregroundStyle(Theme.accent)
                .opacity(stage >= 3 ? 1 : 0).scaleEffect(stage >= 3 ? 1 : 0.9, anchor: .leading)
        }
        .padding(.horizontal, 28)
    }

    private func row(_ label: String, _ value: String, show: Bool, bold: Bool = false) -> some View {
        HStack {
            Text(label).foregroundStyle(bold ? .white : .white.opacity(0.75))
            Spacer()
            Text(value).monospacedDigit().contentTransition(.numericText())
        }
        .font(bold ? .headline : .subheadline)
        .opacity(show ? 1 : 0).offset(x: show ? 0 : 20)
    }
}

/// A union day lands and the bar toward the card moves.
private struct GetYourCard: View {
    let stage: Int
    private var days: Int { stage >= 2 ? 42 : 41 }
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Example union · permittee to member").font(Theme.sans(.caption)).foregroundStyle(.secondary)
            HStack(alignment: .firstTextBaseline) {
                Text("\(days)").font(Theme.serif(.largeTitle)).monospacedDigit().contentTransition(.numericText())
                Text("of 120 days").foregroundStyle(.secondary)
            }
            SquareProgress(value: Double(stage >= 1 ? days : 0) / 120)
            Label("Today's union day counted", systemImage: "plus.square.fill")
                .font(Theme.sans(.subheadline).bold()).foregroundStyle(Theme.accent).opacity(stage >= 2 ? 1 : 0)
            Text("78 days to go").font(Theme.sans(.caption)).foregroundStyle(.secondary).opacity(stage >= 3 ? 1 : 0)
        }
        .padding(.horizontal, 28)
    }
}

/// The year's income draws in, then the set-aside appears. $8,971 is the
/// engine's 2026 figure for $41,200 self-employed in Ontario (CPP $4,486.30
/// plus income tax $4,484.74).
private struct WalletCurve: View {
    let stage: Int
    private let points: [Double] = [0.05, 0.12, 0.18, 0.35, 0.42, 0.48, 0.66, 0.74, 0.8]
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Curve(points: points)
                .trim(from: 0, to: stage >= 1 ? 1 : 0)
                .stroke(Theme.accent, style: StrokeStyle(lineWidth: 3, lineJoin: .miter))
                .frame(height: 110)
                .animation(.easeInOut(duration: 1.1), value: stage)
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Earned, self-employed in Ontario").font(Theme.sans(.caption)).foregroundStyle(.secondary)
                    Text("$41,200").font(Theme.sans(.headline)).monospacedDigit()
                }
                .opacity(stage >= 2 ? 1 : 0)
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Set aside: CPP and income tax").font(Theme.sans(.caption)).foregroundStyle(.secondary)
                    Text("$8,971").font(Theme.sans(.headline)).monospacedDigit().foregroundStyle(Theme.accent)
                }
                .opacity(stage >= 3 ? 1 : 0)
            }
        }
        .padding(.horizontal, 28)
    }

    private struct Curve: Shape {
        let points: [Double]
        func path(in r: CGRect) -> Path {
            Path { p in
                for (i, v) in points.enumerated() {
                    let pt = CGPoint(x: r.minX + r.width * Double(i) / Double(points.count - 1), y: r.maxY - r.height * v)
                    i == 0 ? p.move(to: pt) : p.addLine(to: pt)
                }
            }
        }
    }
}

/// Pages stack up into a report.
private struct LedgerPages: View {
    let stage: Int
    var body: some View {
        ZStack {
            ForEach(0..<3, id: \.self) { i in
                VStack(alignment: .leading, spacing: 6) {
                    Text(["Union days", "Pay stubs", "Income and expenses"][i]).font(Theme.sans(.caption).bold()).foregroundStyle(.black)
                    ForEach(0..<4, id: \.self) { _ in Rectangle().fill(Color.black.opacity(0.15)).frame(height: 5) }
                }
                .padding(12).frame(width: 150, height: 150, alignment: .topLeading)
                .background(Color.white)
                .rotationEffect(.degrees(stage > i ? Double(i - 1) * 3 : 0))
                .offset(x: Double(i - 1) * 26, y: stage > i ? Double(i - 1) * 34 : 40)
                .opacity(stage > i ? 1 : 0)
            }
            Text("PDF").font(Theme.sans(.caption).weight(.heavy)).foregroundStyle(.black).padding(.horizontal, 8).padding(.vertical, 4)
                .background(Theme.accent).offset(x: 86, y: 100).opacity(stage >= 3 ? 1 : 0)
        }
    }
}

/// This iPhone, or this iPhone plus online.
private struct WhereItsKept: View {
    let stage: Int
    var body: some View {
        HStack(spacing: 28) {
            column(Plan.indie.name, systemImage: "iphone", detail: "This iPhone only", show: stage >= 1, lit: false)
            column(Plan.pro.name, systemImage: "icloud.and.arrow.up", detail: "iPhone, iPad and the website", show: stage >= 2, lit: stage >= 3)
        }
        .padding(.horizontal, 24)
    }

    private func column(_ title: String, systemImage: String, detail: String, show: Bool, lit: Bool) -> some View {
        VStack(spacing: 10) {
            Image(systemName: systemImage).font(.system(size: 44)).foregroundStyle(lit ? Theme.accent : .white)
            Text(title).font(Theme.sans(.headline))
            Text(detail).font(Theme.sans(.caption)).foregroundStyle(.secondary).multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .opacity(show ? 1 : 0).offset(y: show ? 0 : 16)
    }
}
