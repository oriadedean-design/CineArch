import Foundation

// What to set aside for tax, worked out from the tax tables in the engine
// snapshot (public.tax_jurisdictions, pension_plans, sales_tax). Same rules
// as services/tax.ts. Rough estimates: no other credits or deductions.

public struct TaxTables: Codable, Sendable {
    public var jurisdictions: [TaxJurisdiction]
    public var pensionPlans: [PensionPlan]
    public var salesTax: [SalesTax]

    public init(jurisdictions: [TaxJurisdiction] = [], pensionPlans: [PensionPlan] = [], salesTax: [SalesTax] = []) {
        self.jurisdictions = jurisdictions; self.pensionPlans = pensionPlans; self.salesTax = salesTax
    }
}

public struct TaxJurisdiction: Codable, Sendable, Hashable {
    public struct Phaseout: Codable, Sendable, Hashable { public var from: Double; public var to: Double; public var min: Double }
    public struct PremiumTier: Codable, Sendable, Hashable { public var over: Double; public var base: Double; public var rate: Double; public var cap: Double }

    public var year: Int
    public var code: String
    public var province: String?
    public var brackets: [[Double]]           // [[from, rate], ...]
    public var basicAmount: Double
    public var basicAmountPhaseout: Phaseout?
    public var surtax: [[Double]]?            // [[over, rate], ...] on provincial tax
    public var healthPremium: [PremiumTier]?
    public var taxReductionBase: Double?
    public var federalAbatement: Double?
    public var sourceUrl: String
    public var checkedOn: String
    public var notes: String?
    public var needsVerification: [String]?

    public init(year: Int, code: String, province: String?, brackets: [[Double]], basicAmount: Double,
                basicAmountPhaseout: Phaseout? = nil, surtax: [[Double]]? = nil, healthPremium: [PremiumTier]? = nil,
                taxReductionBase: Double? = nil, federalAbatement: Double? = nil, sourceUrl: String = "", checkedOn: String = "") {
        self.year = year; self.code = code; self.province = province; self.brackets = brackets; self.basicAmount = basicAmount
        self.basicAmountPhaseout = basicAmountPhaseout; self.surtax = surtax; self.healthPremium = healthPremium
        self.taxReductionBase = taxReductionBase; self.federalAbatement = federalAbatement
        self.sourceUrl = sourceUrl; self.checkedOn = checkedOn
    }

    var lowestRate: Double { brackets.first?[1] ?? 0 }

    func bracketTax(_ income: Double) -> Double {
        var tax = 0.0
        for (i, b) in brackets.enumerated() {
            let top = i + 1 < brackets.count ? brackets[i + 1][0] : .infinity
            tax += max(0, min(income, top) - b[0]) * b[1]
        }
        return tax
    }

    func basicAmount(at income: Double) -> Double {
        guard let p = basicAmountPhaseout, income > p.from else { return basicAmount }
        if income >= p.to { return p.min }
        return basicAmount - (income - p.from) * (basicAmount - p.min) / (p.to - p.from)
    }
}

public struct PensionPlan: Codable, Sendable, Hashable {
    public var year: Int
    public var code: String                // CPP or QPP
    public var exemption: Double
    public var ympe: Double
    public var yampe: Double
    public var baseRate: Double            // combined employee + employer
    public var firstAdditionalRate: Double
    public var secondRate: Double
    public var sourceUrl: String
    public var checkedOn: String

    public init(year: Int, code: String, exemption: Double, ympe: Double, yampe: Double, baseRate: Double,
                firstAdditionalRate: Double, secondRate: Double, sourceUrl: String = "", checkedOn: String = "") {
        self.year = year; self.code = code; self.exemption = exemption; self.ympe = ympe; self.yampe = yampe
        self.baseRate = baseRate; self.firstAdditionalRate = firstAdditionalRate; self.secondRate = secondRate
        self.sourceUrl = sourceUrl; self.checkedOn = checkedOn
    }

    /// Contributions on a year's earnings, paying both halves.
    public struct Contribution: Sendable, Hashable {
        public var total: Double
        public var deduction: Double     // the employer half, plus the employee's enhanced part
        public var creditBase: Double    // the employee's base part, claimed as a credit
    }

    public func contribution(_ earnings: Double) -> Contribution {
        let first = min(max(0, earnings - exemption), ympe - exemption)
        let second = max(0, min(earnings, yampe) - ympe)
        let total = first * (baseRate + firstAdditionalRate) + second * secondRate
        let employeeEnhanced = (first * firstAdditionalRate + second * secondRate) / 2
        return Contribution(total: total, deduction: total / 2 + employeeEnhanced, creditBase: first * baseRate / 2)
    }
}

public struct SalesTax: Codable, Sendable, Hashable {
    public var year: Int
    public var province: String
    public var gstHstRate: Double
    public var quickServiceRate: Double
    public var quickCreditRate: Double
    public var quickCreditLimit: Double
    public var sourceUrl: String
    public var checkedOn: String
    public var notes: String?

    public init(year: Int, province: String, gstHstRate: Double, quickServiceRate: Double, quickCreditRate: Double = 0.01,
                quickCreditLimit: Double = 30_000, sourceUrl: String = "", checkedOn: String = "") {
        self.year = year; self.province = province; self.gstHstRate = gstHstRate; self.quickServiceRate = quickServiceRate
        self.quickCreditRate = quickCreditRate; self.quickCreditLimit = quickCreditLimit; self.sourceUrl = sourceUrl; self.checkedOn = checkedOn
    }

    /// GST/HST to send under the Quick Method: a share of sales (tax included),
    /// less 1% of the first $30,000. No credits for tax paid on expenses.
    public func quickMethodOwing(salesIncludingTax sales: Double) -> Double {
        Tax.cents(max(0, sales * quickServiceRate - min(sales, quickCreditLimit) * quickCreditRate))
    }
}

public enum PayType: String, Sendable, CaseIterable {
    case t4, selfEmployed = "self_employed", both
}

public struct SetAside: Sendable, Hashable {
    public var year: Int                 // the tax year the figures are from
    public var pensionPlan: String       // CPP or QPP
    public var pension: Double
    public var incomeTax: Double
    public var total: Double { Tax.cents(pension + incomeTax) }
}

public enum Tax {
    static func cents(_ n: Double) -> Double { (n * 100).rounded() / 100 }

    /// Federal plus provincial income tax on taxable income, after the basic
    /// personal amount and the pension credit, with Ontario's surtax, tax
    /// reduction and health premium, and Québec's federal abatement.
    public static func incomeTax(_ taxable: Double, federal: TaxJurisdiction, province: TaxJurisdiction, pensionCredit: Double = 0) -> Double {
        let income = max(0, taxable)
        var fed = max(0, federal.bracketTax(income) - federal.lowestRate * (federal.basicAmount(at: income) + pensionCredit))
        if let a = province.federalAbatement { fed -= fed * a }
        var prov = max(0, province.bracketTax(income) - province.lowestRate * (province.basicAmount(at: income) + pensionCredit))
        prov += (province.surtax ?? []).reduce(0) { $0 + max(0, prov - $1[0]) * $1[1] }
        if let base = province.taxReductionBase { prov -= max(0, min(prov, 2 * base - prov)) }
        let premium = (province.healthPremium ?? []).last { income > $0.over }.map { min($0.cap, $0.base + $0.rate * (income - $0.over)) } ?? 0
        return cents(fed + prov + premium)
    }

    /// The figures for a year: that year's, else the latest earlier one.
    static func latest<T>(_ rows: [T], year: Int, _ yearOf: (T) -> Int) -> T? {
        rows.filter { yearOf($0) <= year }.max { yearOf($0) < yearOf($1) }
    }

    /// What to set aside on self-employed income. Employment (T4) income has its
    /// tax and CPP taken off the cheque already, so only the extra tax and pension
    /// the self-employed income adds on top of it are counted. nil when the
    /// province has no figures.
    public static func setAside(selfEmployedNet: Double, employmentIncome: Double = 0, province: String,
                                year: Int, tables: TaxTables) -> SetAside? {
        guard let fed = latest(tables.jurisdictions.filter { $0.code == "FED" }, year: year, \.year),
              let prov = latest(tables.jurisdictions.filter { $0.province == province }, year: fed.year, \.year),
              let plan = latest(tables.pensionPlans.filter { $0.code == (province == "Quebec" ? "QPP" : "CPP") }, year: fed.year, \.year)
        else { return nil }
        let t4 = max(0, employmentIncome), se = max(0, selfEmployedNet)
        let before = plan.contribution(t4)          // employee half only was paid on T4 pay
        let after = plan.contribution(t4 + se)
        let pension = after.total - before.total
        // On T4 pay, only the employee's enhanced part is deducted and its base part credited.
        let t4Enhanced = before.deduction - before.total / 2
        let taxBefore = incomeTax(t4 - t4Enhanced, federal: fed, province: prov, pensionCredit: before.creditBase)
        let deductionAfter = t4Enhanced + (after.deduction - before.deduction)
        let taxAfter = incomeTax(t4 + se - deductionAfter, federal: fed, province: prov, pensionCredit: after.creditBase)
        return SetAside(year: fed.year, pensionPlan: plan.code, pension: cents(pension), incomeTax: cents(max(0, taxAfter - taxBefore)))
    }

    public static func salesTax(province: String, year: Int, tables: TaxTables) -> SalesTax? {
        latest(tables.salesTax.filter { $0.province == province }, year: year, \.year)
    }
}
