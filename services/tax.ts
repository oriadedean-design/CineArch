// What to set aside for tax, worked out from the tax tables in the engine
// snapshot (public.tax_jurisdictions, pension_plans, sales_tax). Same rules as
// ios/CineArchKit/Sources/CineArchKit/Tax.swift. Pure (no I/O). Rough
// estimates: no other credits or deductions.

export interface TaxJurisdiction {
  year: number;
  code: string;
  province: string | null;
  brackets: [number, number][];           // [from, rate]
  basicAmount: number;
  basicAmountPhaseout?: { from: number; to: number; min: number } | null;
  surtax?: [number, number][] | null;     // [over, rate] on provincial tax
  healthPremium?: { over: number; base: number; rate: number; cap: number }[] | null;
  taxReductionBase?: number | null;
  federalAbatement?: number | null;
  sourceUrl?: string;
  checkedOn?: string;
  notes?: string | null;
  needsVerification?: string[];
}

export interface PensionPlan {
  year: number;
  code: 'CPP' | 'QPP';
  exemption: number;
  ympe: number;
  yampe: number;
  baseRate: number;              // combined employee + employer
  firstAdditionalRate: number;
  secondRate: number;
  sourceUrl?: string;
  checkedOn?: string;
}

export interface SalesTax {
  year: number;
  province: string;
  gstHstRate: number;
  quickServiceRate: number;
  quickCreditRate: number;
  quickCreditLimit: number;
  sourceUrl?: string;
  checkedOn?: string;
  notes?: string | null;
}

export interface TaxTables { jurisdictions: TaxJurisdiction[]; pensionPlans: PensionPlan[]; salesTax: SalesTax[] }

export type PayType = 't4' | 'self_employed' | 'both';

export interface SetAside { year: number; pensionPlan: 'CPP' | 'QPP'; pension: number; incomeTax: number; total: number }

const cents = (n: number) => Math.round(n * 100) / 100;

const lowestRate = (j: TaxJurisdiction) => j.brackets[0]?.[1] ?? 0;

const bracketTax = (j: TaxJurisdiction, income: number) =>
  j.brackets.reduce((tax, [from, rate], i) => tax + Math.max(0, Math.min(income, j.brackets[i + 1]?.[0] ?? Infinity) - from) * rate, 0);

const basicAmount = (j: TaxJurisdiction, income: number) => {
  const p = j.basicAmountPhaseout;
  if (!p || income <= p.from) return j.basicAmount;
  if (income >= p.to) return p.min;
  return j.basicAmount - (income - p.from) * (j.basicAmount - p.min) / (p.to - p.from);
};

/** Contributions on a year's earnings, paying both halves. */
export const pensionContribution = (plan: PensionPlan, earnings: number) => {
  const first = Math.min(Math.max(0, earnings - plan.exemption), plan.ympe - plan.exemption);
  const second = Math.max(0, Math.min(earnings, plan.yampe) - plan.ympe);
  const total = first * (plan.baseRate + plan.firstAdditionalRate) + second * plan.secondRate;
  const employeeEnhanced = (first * plan.firstAdditionalRate + second * plan.secondRate) / 2;
  return { total, deduction: total / 2 + employeeEnhanced, creditBase: first * plan.baseRate / 2 };
};

/** Federal plus provincial income tax, with Ontario's surtax, reduction and health premium and Québec's abatement. */
export const incomeTax = (taxable: number, federal: TaxJurisdiction, province: TaxJurisdiction, pensionCredit = 0) => {
  const income = Math.max(0, taxable);
  let fed = Math.max(0, bracketTax(federal, income) - lowestRate(federal) * (basicAmount(federal, income) + pensionCredit));
  if (province.federalAbatement) fed -= fed * province.federalAbatement;
  let prov = Math.max(0, bracketTax(province, income) - lowestRate(province) * (basicAmount(province, income) + pensionCredit));
  prov += (province.surtax ?? []).reduce((sum, [over, rate]) => sum + Math.max(0, prov - over) * rate, 0);
  if (province.taxReductionBase) prov -= Math.max(0, Math.min(prov, 2 * province.taxReductionBase - prov));
  const tier = [...(province.healthPremium ?? [])].reverse().find(t => income > t.over);
  const premium = tier ? Math.min(tier.cap, tier.base + tier.rate * (income - tier.over)) : 0;
  return cents(fed + prov + premium);
};

const latest = <T extends { year: number }>(rows: T[], year: number) =>
  rows.filter(r => r.year <= year).sort((a, b) => b.year - a.year)[0];

/**
 * What to set aside on self-employed income. T4 pay has its tax and CPP taken
 * off already, so only what the self-employed income adds on top counts.
 * Undefined when the province has no figures.
 */
export function setAside(
  { selfEmployedNet, employmentIncome = 0, province, year }: { selfEmployedNet: number; employmentIncome?: number; province: string; year: number },
  tables: TaxTables,
): SetAside | undefined {
  const fed = latest(tables.jurisdictions.filter(j => j.code === 'FED'), year);
  const prov = fed && latest(tables.jurisdictions.filter(j => j.province === province), fed.year);
  const plan = fed && latest(tables.pensionPlans.filter(p => p.code === (province === 'Quebec' ? 'QPP' : 'CPP')), fed.year);
  if (!fed || !prov || !plan) return undefined;
  const t4 = Math.max(0, employmentIncome), se = Math.max(0, selfEmployedNet);
  const before = pensionContribution(plan, t4);
  const after = pensionContribution(plan, t4 + se);
  const t4Enhanced = before.deduction - before.total / 2;
  const taxBefore = incomeTax(t4 - t4Enhanced, fed, prov, before.creditBase);
  const taxAfter = incomeTax(t4 + se - (t4Enhanced + after.deduction - before.deduction), fed, prov, after.creditBase);
  const pension = cents(after.total - before.total);
  const tax = cents(Math.max(0, taxAfter - taxBefore));
  return { year: fed.year, pensionPlan: plan.code, pension, incomeTax: tax, total: cents(pension + tax) };
}

export const salesTaxFor = (province: string, year: number, tables: TaxTables) =>
  latest(tables.salesTax.filter(s => s.province === province), year);

/** GST/HST under the Quick Method: a share of sales (tax included), less 1% of the first $30,000. */
export const quickMethodOwing = (s: SalesTax, salesIncludingTax: number) =>
  cents(Math.max(0, salesIncludingTax * s.quickServiceRate - Math.min(salesIncludingTax, s.quickCreditLimit) * s.quickCreditRate));
