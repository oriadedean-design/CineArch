import { describe, expect, it } from 'vitest';
import { incomeTax, pensionContribution, quickMethodOwing, setAside, type TaxTables } from '../services/tax';

// The 2026 rows as loaded (CRA T4127, January 2026). Mirrors TaxTests.swift.
const tables: TaxTables = {
  jurisdictions: [
    { year: 2026, code: 'FED', province: null, brackets: [[0, 0.14], [58523, 0.205], [117045, 0.26], [181440, 0.29], [258482, 0.33]],
      basicAmount: 16452, basicAmountPhaseout: { from: 181440, to: 258482, min: 14829 } },
    { year: 2026, code: 'ON', province: 'Ontario', brackets: [[0, 0.0505], [53891, 0.0915], [107785, 0.1116], [150000, 0.1216], [220000, 0.1316]],
      basicAmount: 12989, surtax: [[5818, 0.2], [7446, 0.36]], taxReductionBase: 300,
      healthPremium: [{ over: 20000, base: 0, rate: 0.06, cap: 300 }, { over: 36000, base: 300, rate: 0.06, cap: 450 },
        { over: 48000, base: 450, rate: 0.25, cap: 600 }, { over: 72000, base: 600, rate: 0.25, cap: 750 }, { over: 200000, base: 750, rate: 0.25, cap: 900 }] },
  ],
  pensionPlans: [{ year: 2026, code: 'CPP', exemption: 3500, ympe: 74600, yampe: 85000, baseRate: 0.099, firstAdditionalRate: 0.02, secondRate: 0.08 }],
  salesTax: [{ year: 2026, province: 'Ontario', gstHstRate: 0.13, quickServiceRate: 0.088, quickCreditRate: 0.01, quickCreditLimit: 30000 }],
};
const cpp = tables.pensionPlans[0];

describe('CPP for the self-employed (2026)', () => {
  it('stops at the ceiling and adds CPP2 up to $85,000', () => {
    expect(Math.round(pensionContribution(cpp, 56000).total * 100) / 100).toBe(6247.5);
    expect(Math.round(pensionContribution(cpp, 100000).total * 100) / 100).toBe(9292.9);
  });
});

describe('set aside', () => {
  it('self-employed in Ontario at $56,000 net', () => {
    // Taxable 52,351.25 after the deduction; federal 4,662.07 + Ontario 1,856.56 + health premium 600.
    expect(setAside({ selfEmployedNet: 56000, province: 'Ontario', year: 2026 }, tables))
      .toEqual({ year: 2026, pensionPlan: 'CPP', pension: 6247.5, incomeTax: 7118.63, total: 13366.13 });
  });

  it('counts only what self-employed income adds on top of T4 pay', () => {
    const s = setAside({ selfEmployedNet: 10000, employmentIncome: 80000, province: 'Ontario', year: 2026 }, tables)!;
    expect(s.pension).toBe(400);   // CPP2 on $80,000 to $85,000
    expect(s.incomeTax).toBeGreaterThan(setAside({ selfEmployedNet: 10000, province: 'Ontario', year: 2026 }, tables)!.incomeTax);
  });

  it('uses the latest figures for a later year, and nothing without the province', () => {
    expect(setAside({ selfEmployedNet: 56000, province: 'Ontario', year: 2027 }, tables)?.year).toBe(2026);
    expect(setAside({ selfEmployedNet: 56000, province: 'Alberta', year: 2026 }, tables)).toBeUndefined();
  });

  it('is zero tax below the basic personal amount', () => {
    expect(incomeTax(12000, tables.jurisdictions[0], tables.jurisdictions[1])).toBe(0);
  });
});

describe('Quick Method', () => {
  it('Ontario services: 8.8% of sales with HST, less 1% of the first $30,000', () => {
    expect(quickMethodOwing(tables.salesTax[0], 56500)).toBe(4672);
  });
});
