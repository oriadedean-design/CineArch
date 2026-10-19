import SwiftUI
import Charts
import CineArchKit

// The rest of Your Wrap, under Getting your card: your year on set as a
// timeline, income building through the year, and what's coming up.

/// Each job as a bar from its first to its last day. Pencilled-in jobs are grey.
struct JobTimeline: View {
    let jobs: [Job]

    private struct Bar: Identifiable {
        let id = UUID(); let production: String; let start: Date; let end: Date; let pencilled: Bool
    }

    private var bars: [Bar] {
        let cal = Calendar.current
        let from = cal.date(byAdding: .month, value: -12, to: Date())!
        return jobs.compactMap { j in
            guard let s = Date(isoDay: j.startDate) else { return nil }
            let last = j.endDate.flatMap(Date.init(isoDay:)) ?? cal.date(byAdding: .day, value: max(0, j.daysWorked - 1), to: s)!
            guard last >= from else { return nil }
            return Bar(production: j.productionName, start: s, end: cal.date(byAdding: .day, value: 1, to: last)!, pencilled: j.status == "TENTATIVE")
        }
        .sorted { $0.start < $1.start }
    }

    var body: some View {
        let bars = bars
        let rows = Array(Set(bars.map(\.production))).count
        if bars.isEmpty {
            Text("Nothing in the can yet. Mark the slate and your jobs line up here.").font(.subheadline).foregroundStyle(.secondary)
        } else {
            Chart(bars) { b in
                BarMark(xStart: .value("Start", b.start), xEnd: .value("End", b.end), y: .value("Production", b.production))
                    .foregroundStyle(by: .value("Status", b.pencilled ? "Pencilled in" : "Worked"))
            }
            .chartForegroundStyleScale(["Worked": Theme.accent, "Pencilled in": Color.gray.opacity(0.6)])
            .chartXScale(domain: (bars.map(\.start).min() ?? Date())...(bars.map(\.end).max() ?? Date()))
            .chartXAxis { AxisMarks(values: .stride(by: .month, count: 2)) { AxisGridLine(); AxisValueLabel(format: .dateTime.month(.abbreviated)) } }
            .chartLegend(position: .bottom, alignment: .leading)
            .frame(height: CGFloat(max(3, rows)) * 34 + 50)
            .accessibilityLabel("Timeline of \(bars.count) jobs over the last 12 months")
        }
    }
}

/// Pay from your Slate, added up month by month this year.
/// Income adding up over time: a curve from the pay on your Slate, over the
/// last 3 or 6 months, this year, or everything. Your goal and the $30k
/// GST/HST line show on this year's view.
struct IncomeChart: View {
    let jobs: [Job]
    let showGSTLine: Bool
    var goal: Double? = nil

    enum Span: String, CaseIterable, Identifiable {
        case threeMonths = "3M", sixMonths = "6M", year = "This year", all = "All"
        var id: String { rawValue }
    }
    @State private var span = Span.year

    private var start: Date? {
        let cal = Calendar.current, now = Date()
        switch span {
        case .threeMonths: return cal.date(byAdding: .month, value: -3, to: cal.startOfDay(for: now))
        case .sixMonths: return cal.date(byAdding: .month, value: -6, to: cal.startOfDay(for: now))
        case .year: return cal.date(from: cal.dateComponents([.year], from: now))
        case .all: return nil
        }
    }

    /// One point a day that pay landed, adding up from the start of the span.
    private var points: [(day: Date, total: Double)] {
        let today = Calendar.current.startOfDay(for: Date())
        let paid = jobs.filter { $0.status != "TENTATIVE" }
            .compactMap { j in Date(isoDay: j.startDate).map { ($0, j.grossEarnings ?? 0) } }
            .filter { d, _ in d <= today && (start.map { d >= $0 } ?? true) }
            .sorted { $0.0 < $1.0 }
        let first = start ?? paid.first?.0 ?? today
        var running = 0.0
        var pts = [(first, 0.0)]
        for (d, g) in paid { running += g; pts.append((d, running)) }
        pts.append((today, running))
        return pts
    }

    var body: some View {
        let pts = points
        let total = pts.last?.total ?? 0
        let showGoal = span == .year && (goal ?? 0) > 0
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                Text(total.money).font(Theme.serif(.largeTitle)).monospacedDigit().lineLimit(1).minimumScaleFactor(0.6)
                Spacer()
                if showGoal, let goal {
                    Text("\(Int((total / goal * 100).rounded()))% of \(goal.money)").font(.caption.bold()).foregroundStyle(Theme.accent)
                }
            }
            Picker("Period", selection: $span) {
                ForEach(Span.allCases) { Text($0.rawValue).tag($0) }
            }
            .pickerStyle(.segmented)
            Chart {
                ForEach(pts, id: \.day) { p in
                    AreaMark(x: .value("Day", p.day), y: .value("Earned", p.total))
                        .interpolationMethod(.monotone)
                        .foregroundStyle(LinearGradient(colors: [Theme.accent.opacity(0.35), Theme.accent.opacity(0)], startPoint: .top, endPoint: .bottom))
                    LineMark(x: .value("Day", p.day), y: .value("Earned", p.total))
                        .interpolationMethod(.monotone)
                        .foregroundStyle(Theme.accent).lineStyle(StrokeStyle(lineWidth: 2.5))
                }
                if let last = pts.last {
                    PointMark(x: .value("Day", last.day), y: .value("Earned", last.total)).foregroundStyle(Theme.accent).symbolSize(50)
                }
                if showGoal, let goal {
                    RuleMark(y: .value("Your goal", goal))
                        .foregroundStyle(Theme.accent.opacity(0.6)).lineStyle(StrokeStyle(lineWidth: 1, dash: [2, 4]))
                        .annotation(position: .top, alignment: .trailing) { Text("Your goal").font(.caption2).foregroundStyle(Theme.accent) }
                }
                if showGSTLine && span == .year {
                    RuleMark(y: .value("GST/HST line", Ledger.smallSupplierThreshold))
                        .foregroundStyle(.red.opacity(0.7)).lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                        .annotation(position: .top, alignment: .leading) { Text("$30k GST/HST line").font(.caption2).foregroundStyle(.red) }
                }
            }
            .chartYAxis { AxisMarks { v in AxisGridLine(); AxisValueLabel { if let d = v.as(Double.self) { Text(d >= 1000 ? "$\(Int(d / 1000))k" : "$\(Int(d))") } } } }
            .chartXAxis { AxisMarks(values: .automatic(desiredCount: 4)) { AxisGridLine(); AxisValueLabel(format: span == .all ? .dateTime.month(.abbreviated).year(.twoDigits) : .dateTime.month(.abbreviated)) } }
            .frame(height: 200)
            .animation(.easeInOut(duration: 0.3), value: span)
            .accessibilityLabel("Income \(span == .year ? "this year" : span == .all ? "in total" : "over the last \(span == .threeMonths ? 3 : 6) months"): \(total.money)")
        }
    }
}

/// Upcoming dates: tax deadlines (with their source), AABP days about to
/// drop out of the 12-month window, and pencilled-in jobs.
struct ComingUp: View {
    let deadlines: [Deadline]
    let progress: [TrackProgress]
    let jobs: [Job]
    let engine: UnionEngine

    private struct Item: Identifiable {
        let id: String; let date: Date; let title: String; let detail: String?; let source: URL?; let icon: String
    }

    private var items: [Item] {
        let today = Date()
        let horizon = Calendar.current.date(byAdding: .day, value: 120, to: today)!
        var out = [Item]()
        for d in deadlines where d.appliesTo != "union_member" {
            guard let when = d.next(after: today), when <= horizon else { continue }
            let who = d.appliesTo == "instalments" ? "If you pay by instalments. " : d.appliesTo == "gst_registered" ? "If you're registered for GST/HST. " : ""
            out.append(Item(id: d.id, date: when, title: d.title, detail: who + (d.detail ?? ""), source: URL(string: d.sourceUrl), icon: "doc.text"))
        }
        for j in jobs where j.status == "TENTATIVE" {
            guard let s = Date(isoDay: j.startDate), s >= Calendar.current.startOfDay(for: today), s <= horizon else { continue }
            out.append(Item(id: "job-\(j.id?.uuidString ?? j.productionName)", date: s, title: "\(j.productionName) starts (pencilled in)",
                            detail: "Mark the slate once it's confirmed.", source: nil, icon: "movieclapper"))
        }
        for p in progress {
            guard let months = p.windowMonths else { continue }
            let counted = jobs.filter { $0.status != "TENTATIVE" && $0.isUnion && $0.unionTypeId == p.track.unionTypeId }
                .compactMap { Date(isoDay: $0.startDate) }
                .filter { $0 >= Calendar.current.date(byAdding: .month, value: -months, to: today)! }
            guard let oldest = counted.min(), let drop = Calendar.current.date(byAdding: .month, value: months, to: oldest), drop <= horizon else { continue }
            out.append(Item(id: "window-\(p.id)", date: drop, title: "A \(p.track.unionName) day drops out of your \(months)-month window",
                            detail: "Days older than \(months) months stop counting toward \(p.track.tierLabel).", source: nil, icon: "hourglass"))
        }
        return out.sorted { $0.date < $1.date }
    }

    var body: some View {
        let items = items
        if items.isEmpty {
            Text("Nothing in the next 120 days.").foregroundStyle(.secondary)
        }
        ForEach(items) { item in
            let row = HStack(alignment: .top, spacing: 12) {
                VStack(spacing: 0) {
                    Text(item.date.formatted(.dateTime.month(.abbreviated))).font(.caption2.weight(.heavy)).textCase(.uppercase)
                    Text(item.date.formatted(.dateTime.day())).font(Theme.serif(.title3))
                }
                .frame(width: 44).padding(.vertical, 4).background(Theme.accent.opacity(0.15)).foregroundStyle(Theme.accent)
                VStack(alignment: .leading, spacing: 3) {
                    Text(item.title).font(.subheadline.weight(.semibold)).foregroundStyle(.primary)
                    if let d = item.detail, !d.isEmpty { Text(d).font(.caption).foregroundStyle(.secondary) }
                    if let host = item.source?.host() { Label("Source: \(host.replacingOccurrences(of: "www.", with: ""))", systemImage: "arrow.up.right.square").font(.caption2).foregroundStyle(Theme.accent) }
                }
            }
            if let url = item.source { Link(destination: url) { row } } else { row }
        }
        Label("Union dues and renewal dates aren't loaded yet.", systemImage: "clock.badge.questionmark")
            .font(.caption).foregroundStyle(.secondary)
    }
}
