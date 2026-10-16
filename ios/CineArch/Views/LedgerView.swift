import SwiftUI

// Wrap Wallet, the business side: income and expenses this year, GST/HST and what to set
// aside. Same rows as the website's Wrap Wallet.
struct LedgerView: View {
    @Environment(Session.self) private var session
    @Environment(LedgerStore.self) private var ledger
    @State private var showAuth = false
    @State private var showNew = false

    var body: some View {
        NavigationStack {
            Group {
                if session.isSignedIn && !session.isPremium { WalletLocked() }
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
                    Button { showNew = true } label: { Image(systemName: "plus") }.accessibilityLabel("Add to ledger")
                }
            }
            .sheet(isPresented: $showAuth) { AuthSheet(reason: "Sign in to keep your ledger.") {} }
            .sheet(isPresented: $showNew) { LedgerEntrySheet() }
            .task(id: session.identity) {
                if session.isPreview { ledger.usePreview() }
                else if session.isSignedIn && session.isPremium { await ledger.load() } else { ledger.clear() }
            }
        }
    }

    private var content: some View {
        let s = ledger.stats
        let year = Calendar.current.component(.year, from: Date())
        return List {
            Section {
                HStack {
                    stat("Income", s.grossIncome.money)
                    stat("Expenses", s.totalExpenses.money)
                    stat("Net", s.netIncome.money, highlight: true)
                }
            } header: {
                Text("\(String(year)) so far")
            }

            Section {
                LabeledContent("GST/HST collected", value: s.gstCollected.money)
                LabeledContent("GST/HST paid", value: s.gstPaid.money)
                LabeledContent(s.gstOwing >= 0 ? "Owing" : "Refund", value: abs(s.gstOwing).money)
                VStack(alignment: .leading, spacing: 6) {
                    ProgressView(value: s.gstThresholdFraction).tint(s.gstThresholdFraction >= 1 ? .red : Theme.accent)
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

            Section("Ledger") {
                if ledger.entries.isEmpty && !ledger.isLoading {
                    Text("Nothing in the can yet. Tap + to add income or an expense.").foregroundStyle(.secondary)
                }
                ForEach(ledger.entries) { LedgerRow(entry: $0) }
                    .onDelete { idx in
                        let doomed = idx.map { ledger.entries[$0] }
                        Task { for e in doomed { await ledger.delete(e) } }
                    }
            }
            if let e = ledger.error { Section { Text(e).foregroundStyle(.red) } }
        }
        .refreshable { await ledger.load() }
        .overlay { if ledger.isLoading && ledger.entries.isEmpty { ProgressView() } }
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

struct LedgerRow: View {
    let entry: LedgerEntry
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 3) {
                Text(entry.description).font(.headline).lineLimit(1)
                HStack(spacing: 6) {
                    Text(entry.categoryName)
                    Text("·")
                    Text(Date(isoDay: entry.dateIncurred)?.formatted(date: .abbreviated, time: .omitted) ?? entry.dateIncurred)
                    if entry.ruleTags?.contains("MEALS_50_LIMIT") == true { Text("· 50% rule").foregroundStyle(Theme.accent) }
                }
                .font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Text((entry.isIncome ? "+" : "−") + entry.totalAmount.money)
                .monospacedDigit()
                .foregroundStyle(entry.isIncome ? Theme.accent : .primary)
        }
    }
}

struct LedgerEntrySheet: View {
    @Environment(LedgerStore.self) private var ledger
    @Environment(JobsStore.self) private var jobs
    @Environment(\.dismiss) private var dismiss

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
            Form {
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
                    Button("Save") { Task { await save() } }
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
            try await ledger.add(entry)
            dismiss()
        } catch {
            self.error = "Couldn't save: \(error.localizedDescription)"
        }
    }
}
