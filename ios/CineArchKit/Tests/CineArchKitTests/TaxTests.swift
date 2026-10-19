import Testing
@testable import CineArchKit

// The 2026 rows as loaded (CRA T4127, January and July 2026). Mirrors tests/tax.test.ts.
let fed2026 = TaxJurisdiction(year: 2026, code: "FED", province: nil,
    brackets: [[0, 0.14], [58523, 0.205], [117045, 0.26], [181440, 0.29], [258482, 0.33]], basicAmount: 16452,
    basicAmountPhaseout: .init(from: 181440, to: 258482, min: 14829))
let on2026 = TaxJurisdiction(year: 2026, code: "ON", province: "Ontario",
    brackets: [[0, 0.0505], [53891, 0.0915], [107785, 0.1116], [150000, 0.1216], [220000, 0.1316]], basicAmount: 12989,
    surtax: [[5818, 0.20], [7446, 0.36]],
    healthPremium: [.init(over: 20000, base: 0, rate: 0.06, cap: 300), .init(over: 36000, base: 300, rate: 0.06, cap: 450),
                    .init(over: 48000, base: 450, rate: 0.25, cap: 600), .init(over: 72000, base: 600, rate: 0.25, cap: 750),
                    .init(over: 200000, base: 750, rate: 0.25, cap: 900)],
    taxReductionBase: 300)
let cpp2026 = PensionPlan(year: 2026, code: "CPP", exemption: 3500, ympe: 74600, yampe: 85000, baseRate: 0.099, firstAdditionalRate: 0.02, secondRate: 0.08)
let tables = TaxTables(jurisdictions: [fed2026, on2026], pensionPlans: [cpp2026],
                       salesTax: [SalesTax(year: 2026, province: "Ontario", gstHstRate: 0.13, quickServiceRate: 0.088)])

@Suite struct TaxTests {
    @Test func cppStopsAtTheCeilings() {
        #expect(Tax.cents(cpp2026.contribution(56000).total) == 6247.50)
        #expect(Tax.cents(cpp2026.contribution(100000).total) == 9292.90)
    }
    @Test func ontarioSelfEmployed56k() throws {
        // CPP 6,247.50; deduction 3,648.75 (half, plus the 1% enhanced); taxable 52,351.25.
        // Federal 4,662.07 + Ontario 1,856.56 + health premium 600 = 7,118.63.
        let s = try #require(Tax.setAside(selfEmployedNet: 56000, province: "Ontario", year: 2026, tables: tables))
        #expect(s.pension == 6247.50)
        #expect(s.incomeTax == 7118.63)
        #expect(s.total == 13366.13)
    }
    @Test func t4PayAlreadyCoveredOnlyTheExtraCounts() throws {
        let alone = try #require(Tax.setAside(selfEmployedNet: 10000, province: "Ontario", year: 2026, tables: tables))
        let onTopOfT4 = try #require(Tax.setAside(selfEmployedNet: 10000, employmentIncome: 80000, province: "Ontario", year: 2026, tables: tables))
        // T4 pay is past the first ceiling, so only CPP2 on $80,000 to $85,000 is owed: 5,000 x 8%.
        #expect(onTopOfT4.pension == 400)
        #expect(onTopOfT4.incomeTax > alone.incomeTax)    // taxed at a higher bracket
    }
    @Test func laterYearUsesLatestFigures() {
        #expect(Tax.setAside(selfEmployedNet: 56000, province: "Ontario", year: 2027, tables: tables)?.year == 2026)
        #expect(Tax.setAside(selfEmployedNet: 56000, province: "Alberta", year: 2026, tables: tables) == nil)
    }
    @Test func quickMethod() {
        // $50,000 + 13% HST = $56,500 x 8.8% = 4,972, less 1% of 30,000.
        #expect(tables.salesTax[0].quickMethodOwing(salesIncludingTax: 56500) == 4672)
    }
}
