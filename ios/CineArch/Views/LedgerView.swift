import SwiftUI

// Wrap Wallet, the business side: income and expenses this year, each backed with
// proof (Green Lit), GST/HST and what to set aside. Same rows as the website's Wrap Wallet.
// A-List Pro; free accounts see their total from the Slate and what Pro adds.
struct LedgerView: View {
    @Environment(Session.self) private var session
    @Environment(LedgerStore.self) private var ledger
    @State private var showAuth = false
    @State private var showNew = false
    @State private var showPlans = false
    @State private var page = Page.entries
    @State private var filter = Filter.all
    @State private var proofFor: LedgerEntry?
    @State private var justAdded: LedgerEntry?

    enum Page: String, CaseIterable { case entries = "Entries", tax = "Tax" }
    enum Filter: String, CaseIterable { case all = "All", income = "Income", expenses = "Expenses", needsProof = "Needs proof" }

    var body: some View {
        NavigationStack {
            Group {
                if session.isSignedIn && !session.isPremium { FreeWallet() }
                else if session.isSignedIn { content } else {
                    ContentUnavailableView {
                        Label("Wrap Wallet", systemImage: "wallet.bifold.fill")
                    } description: {
                        Text("Your film money in one place: income, expenses, GST/HST and what to set aside for tax.")
                    } actions: {
                        Button("Sign in or create account") { showAuth = true }.buttonStyle(.borderedProminent).foregroundStyle(.black)
                    }
                }
            }
            .navigationTitle("Wrap Wallet")
            .previewBadge()
            .toolbar {
                if session.isSignedIn && session.isPremium {
                    ToolbarItem(placement: .topBarTrailing) {
                        ShareLink(item: csvFile(), preview: SharePreview("Wrap Wallet spreadsheet")) {
                            Image(systemName: "tablecells")
                        }
                        .accessibilityLabel("Export a spreadsheet")
                        .disabled(ledger.entries.isEmpty)
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        Button { showNew = true } label: { Image(systemName: "plus") }.accessibilityLabel("Add income or an expense")
                    }
                } else if session.isSignedIn {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button { showPlans = true } label: { Image(systemName: "lock") }.accessibilityLabel("Adding entries is A-List Pro")
                    }
                }
            }
            .navigationDestination(isPresented: $showPlans) { PlansView() }
            .sheet(isPresented: $showAuth) { AuthSheet(reason: "Sign in to keep your ledger.") {} }
            .sheet(isPresented: $showNew, onDismiss: { if let e = justAdded { justAdded = nil; proofFor = e } }) {
                LedgerEntrySheet { justAdded = $0 }
            }
            .sheet(item: $proofFor) { ProofSheet(entry: $0) }
            .task(id: session.identity) {
                if session.isPreview { ledger.usePreview() }
                else if session.isSignedIn && session.isPremium { await ledger.load() } else { ledger.clear() }
            }
        }
    }

    private var shown: [LedgerEntry] {
        switch filter {
        case .all: ledger.entries
        case .income: ledger.entries.filter(\.isIncome)
        case .expenses: ledger.entries.filter { !$0.isIncome }
        case .needsProof: ledger.entries.filter { !$0.isGreenLit }
        }
    }

    private var content: some View {
        let s = ledger.stats
        let year = Calendar.current.component(.year, from: Date())
        return List {
            Section {
                Picker("Show", selection: $page) { ForEach(Page.allCases, id: \.self) { Text($0.rawValue) } }
                    .pickerStyle(.segmented)
                HStack {
                    stat("Income", s.grossIncome.money)
                    stat("Expenses", s.totalExpenses.money)
                    stat("Net", s.netIncome.money, highlight: true)
                }
            } header: {
                Text("\(String(year)) so far")
            }

            switch page {
            case .entries: entries
            case .tax: tax(s)
            }
            if let e = ledger.error { Section { Text(e).foregroundStyle(.red) } }
        }
        .refreshable { await ledger.load() }
        .overlay { if ledger.isLoading && ledger.entries.isEmpty { ProgressView() } }
    }

    @ViewBuilder private var entries: some View {
        if !ledger.entries.isEmpty {
            Section { GreenLitNotice(entries: ledger.entries) { filter = .needsProof } }
        }
        Section {
            Picker("Filter", selection: $filter) { ForEach(Filter.allCases, id: \.self) { Text($0.rawValue) } }
                .pickerStyle(.segmented)
            if shown.isEmpty && !ledger.isLoading {
                Text(ledger.entries.isEmpty ? "Nothing in the can yet. Tap + to add income or an expense."
                     : filter == .needsProof ? "Every entry is backed with proof." : "Nothing here.")
                    .foregroundStyle(.secondary)
            }
            ForEach(shown) { e in
                Button { proofFor = e } label: { LedgerRow(entry: e) }.buttonStyle(.plain)
            }
            .onDelete { idx in
                let doomed = idx.map { shown[$0] }
                Task { for e in doomed { await ledger.delete(e) } }
            }
        } footer: {
            Text("Tap an entry to back it with proof. Swipe left to delete.")
        }
    }

    @ViewBuilder private func tax(_ s: LedgerStats) -> some View {
        Section {
            LabeledContent("GST/HST collected", value: s.gstCollected.money)
            LabeledContent("GST/HST paid", value: s.gstPaid.money)
            LabeledContent(s.gstOwing >= 0 ? "Owing" : "Refund", value: abs(s.gstOwing).money)
            VStack(alignment: .leading, spacing: 6) {
                SquareProgress(value: s.gstThresholdFraction, color: s.gstThresholdFraction >= 1 ? .red : Theme.accent)
                Text(s.gstThresholdFraction >= 1
                     ? "You're past $30,000 this year. You need a GST/HST number."
                     : "\((Ledger.smallSupplierThreshold - s.grossIncome).money) until you must register for GST/HST ($30,000).")
                    .font(.caption).foregroundStyle(.secondary)
            }
            .padding(.vertical, 2)
        } header: {
            Text("GST/HST")
        }
        Section {
            LabeledContent("CPP (self-employed)", value: s.estimatedCPP.money)
            LabeledContent("Income tax", value: s.estimatedIncomeTax.money)
        } header: {
            Text("Set aside")
        } footer: {
            Text("Rough estimates: CPP at 11.9% above $3,500 and income tax at 20% of net. Check with an accountant.")
        }
    }

    private func csvFile() -> URL {
        let url = URL.temporaryDirectory.appending(path: "CineArch Wrap Wallet.csv")
        try? ledger.csv().write(to: url, atomically: true, encoding: .utf8)
        return url
    }

    private func stat(_ label: String, _ value: String, highlight: Bool = false) -> some View {
        VStack(spacing: 2) {
            Text(value).font(Theme.serif(.title3)).monospacedDigit().lineLimit(1).minimumScaleFactor(0.5)
                .foregroundStyle(highlight ? Theme.accent : .primary)
            Text(label).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

/// The note at the top of the Wallet: how many entries are Green Lit (backed with proof).
struct GreenLitNotice: View {
    let entries: [LedgerEntry]
    var showMissing: () -> Void

    var body: some View {
        let lit = entries.filter(\.isGreenLit).count
        let missing = entries.count - lit
        HStack(spacing: 12) {
            Image(systemName: missing == 0 ? "checkmark.seal.fill" : "seal")
                .font(.title2).foregroundStyle(missing == 0 ? Color.green : .secondary)
            VStack(alignment: .leading, spacing: 2) {
                Text("GREEN LIT").font(.caption.weight(.heavy)).tracking(1.5).foregroundStyle(Color.green)
                Text("\(lit) of \(entries.count) backed with proof").font(.subheadline)
            }
            Spacer()
            if missing > 0 {
                Button("\(missing) need proof", action: showMissing)
                    .font(.caption.bold()).buttonStyle(.bordered).tint(Theme.accent)
            }
        }
        .accessibilityElement(children: .combine)
    }
}

struct LedgerRow: View {
    let entry: LedgerEntry
    var body: some View {
        HStack {
            Image(systemName: entry.isGreenLit ? "checkmark.square.fill" : "square.dashed")
                .foregroundStyle(entry.isGreenLit ? Color.green : .secondary)
                .accessibilityLabel(entry.isGreenLit ? "Green Lit" : "Needs proof")
            VStack(alignment: .leading, spacing: 3) {
                Text(entry.description).font(.headline).lineLimit(1)
                HStack(spacing: 6) {
                    Text(entry.categoryName)
                    Text("·")
                    Text(Date(isoDay: entry.dateIncurred)?.formatted(date: .abbreviated, time: .omitted) ?? entry.dateIncurred)
                    if entry.ruleTags?.contains("MEALS_50_LIMIT") == true, !entry.categoryName.contains("50%") { Text("· 50% rule").foregroundStyle(Theme.accent) }
                }
                .font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Text((entry.isIncome ? "+" : "−") + entry.totalAmount.money)
                .monospacedDigit()
                .foregroundStyle(entry.isIncome ? Theme.accent : .primary)
        }
        .contentShape(Rectangle())
    }
}

struct LedgerEntrySheet: View {
    @Environment(LedgerStore.self) private var ledger
    @Environment(JobsStore.self) private var jobs
    @Environment(\.dismiss) private var dismiss
    /// Called with the saved entry, so the Wallet can ask for its proof next.
    var onSaved: (LedgerEntry) -> Void = { _ in }

    @State private var isIncome = false
    @State private var category = "MEALS_ENTERTAINMENT"
    @State private var amountText = ""
    @State private var taxText = ""
    @State private var description = ""
    @State private var date = Date()
    @State private var jobId: UUID?
    @State private var saving = false
    @State private var error: String?

    private var amount: Double? { Double(amountText.replacingOccurrences(of: ",", with: ".")) }
    private var categories: [(String, String)] { isIncome ? Ledger.incomeCategories : Ledger.expenseCategories }

    var body: some View {
        NavigationStack {
            List {
                Picker("Type", selection: $isIncome) {
                    Text("Expense").tag(false)
                    Text("Income").tag(true)
                }
                .pickerStyle(.segmented)
                .listRowBackground(Color.clear)

                if isIncome && !jobs.jobs.isEmpty {
                    Section {
                        Picker("From a job", selection: $jobId) {
                            Text("None").tag(UUID?.none)
                            ForEach(jobs.jobs.prefix(30)) { j in Text("\(j.productionName) · \(j.startDate)").tag(j.id) }
                        }
                    } footer: {
                        Text("Fills in the pay from a job you logged.")
                    }
                }

                Section {
                    TextField("What was it?", text: $description).textInputAutocapitalization(.sentences)
                    Picker("Category", selection: $category) {
                        ForEach(categories, id: \.0) { Text($0.1).tag($0.0) }
                    }
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                }

                Section {
                    money("Amount before tax", $amountText, placeholder: "0.00")
                    money("GST/HST", $taxText, placeholder: amount.map { String(format: "%.2f", $0 * Ledger.gstRate) } ?? "0.00")
                } footer: {
                    if !isIncome && category == "MEALS_ENTERTAINMENT" {
                        Text("Only half of meals and entertainment is deductible.")
                    }
                }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .navigationTitle(isIncome ? "Add income" : "Add expense")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Next: proof") { Task { await save() } }
                        .disabled(amount == nil || description.trimmed.isEmpty || saving)
                }
            }
            .onChange(of: isIncome) { category = categories[0].0; if !isIncome { jobId = nil } }
            .onChange(of: jobId) {
                guard let j = jobs.jobs.first(where: { $0.id == jobId }) else { return }
                description = "\(j.productionName) · \(j.role)"
                if let g = j.grossEarnings { amountText = String(format: "%.2f", g) }
                date = Date(isoDay: j.startDate) ?? date
            }
            .task { if jobs.jobs.isEmpty { await jobs.load() } }
        }
    }

    private func money(_ label: String, _ text: Binding<String>, placeholder: String) -> some View {
        HStack {
            Text(label)
            Spacer()
            TextField(placeholder, text: text).keyboardType(.decimalPad).multilineTextAlignment(.trailing).frame(maxWidth: 120)
        }
    }

    private func save() async {
        guard let amount else { return }
        saving = true
        defer { saving = false }
        // Leaving GST/HST blank means none was charged.
        let tax = Double(taxText.replacingOccurrences(of: ",", with: ".")) ?? 0
        let entry = LedgerEntry(jobId: jobId, type: isIncome ? "INCOME" : "EXPENSE", category: category,
                                amountBeforeTax: amount, taxAmount: tax, totalAmount: amount + tax,
                                description: description.trimmed, dateIncurred: date.isoDay)
        do {
            onSaved(try await ledger.add(entry))
            dismiss()
        } catch {
            self.error = "Couldn't save: \(error.localizedDescription)"
        }
    }
}
