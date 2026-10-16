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
struct IncomeChart: View {
    let jobs: [Job]
    let showGSTLine: Bool
    var goal: Double? = nil

    private var points: [(month: Date, total: Double)] {
        let cal = Calendar.current
        let year = cal.component(.year, from: Date())
        let now = cal.component(.month, from: Date())
        var byMonth = [Int: Double]()
        for j in jobs where j.status != "TENTATIVE" {
            guard let d = Date(isoDay: j.startDate), cal.component(.year, from: d) == year else { continue }
            byMonth[cal.component(.month, from: d), default: 0] += j.grossEarnings ?? 0
        }
        var running = 0.0
        return (1...now).map { m in
            running += byMonth[m] ?? 0
            return (cal.date(from: DateComponents(year: year, month: m, day: 1))!, running)
        }
    }

    var body: some View {
        let pts = points
        let total = pts.last?.total ?? 0
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                Text(total.money).font(Theme.serif(.title2)).monospacedDigit()
                Text("so far this year").font(.caption).foregroundStyle(.secondary)
                if let goal, goal > 0 {
                    Spacer()
                    Text("\(Int((total / goal * 100).rounded()))% of \(goal.money)").font(.caption.bold()).foregroundStyle(Theme.accent)
                }
            }
            Chart {
                ForEach(pts, id: \.month) { p in
                    LineMark(x: .value("Month", p.month, unit: .month), y: .value("Earned", p.total))
                        .foregroundStyle(Theme.accent).interpolationMethod(.stepEnd)
                    PointMark(x: .value("Month", p.month, unit: .month), y: .value("Earned", p.total))
                        .foregroundStyle(Theme.accent).symbolSize(20)
                }
                if let goal, goal > 0 {
                    RuleMark(y: .value("Your goal", goal))
                        .foregroundStyle(Theme.accent.opacity(0.6)).lineStyle(StrokeStyle(lineWidth: 1, dash: [2, 4]))
                        .annotation(position: .top, alignment: .trailing) { Text("Your goal").font(.caption2).foregroundStyle(Theme.accent) }
                }
                if showGSTLine {
                    RuleMark(y: .value("GST/HST line", Ledger.smallSupplierThreshold))
                        .foregroundStyle(.red.opacity(0.7)).lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 3]))
                        .annotation(position: .top, alignment: .leading) { Text("$30k GST/HST line").font(.caption2).foregroundStyle(.red) }
                }
            }
            .chartYAxis { AxisMarks { v in AxisGridLine(); AxisValueLabel { if let d = v.as(Double.self) { Text(d >= 1000 ? "$\(Int(d / 1000))k" : "$\(Int(d))") } } } }
            .chartXAxis { AxisMarks(values: .stride(by: .month, count: 2)) { AxisGridLine(); AxisValueLabel(format: .dateTime.month(.abbreviated)) } }
            .frame(height: 180)
            .accessibilityLabel("Income this year: \(total.money)")
            Text("From the pay on your Slate, by the month each job started.").font(.caption).foregroundStyle(.secondary)
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
