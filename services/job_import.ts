// Spreadsheet import for jobs: map columns, check every row, price it with
// the same rules as the job form, and summarize before anything is saved.
import type { Job } from '../types';
import { findUnion, findRole, findRoleDepartment } from './union_engine';
import { priceJob, loadJobRates } from './job_pay';

export type ImportField =
  | 'productionName' | 'companyName' | 'role' | 'startDate' | 'days' | 'hoursPerDay' | 'totalHours'
  | 'mealBreakMinutes' | 'hourlyRate' | 'grossEarnings' | 'union' | 'province' | 'productionType' | 'notes';

export const IMPORT_FIELDS: { key: ImportField; label: string; required?: boolean; hint?: string; synonyms: string[] }[] = [
  { key: 'productionName', label: 'Production', required: true, synonyms: ['production', 'production name', 'project', 'show', 'title'] },
  { key: 'companyName', label: 'Production company', required: true, synonyms: ['company', 'production company', 'employer', 'producer'] },
  { key: 'role', label: 'Role', required: true, synonyms: ['role', 'position', 'job title', 'title', 'occupation'] },
  { key: 'startDate', label: 'Date', required: true, hint: 'YYYY-MM-DD works best', synonyms: ['date', 'start date', 'work date', 'shoot date', 'day'] },
  { key: 'days', label: 'Days', hint: 'Identical days on this row (default 1)', synonyms: ['days', 'days worked', 'number of days'] },
  { key: 'hoursPerDay', label: 'Hours per day (call to wrap)', synonyms: ['hours per day', 'hours', 'daily hours', 'call to wrap'] },
  { key: 'totalHours', label: 'Total hours', hint: 'Used when there is no hours-per-day column', synonyms: ['total hours', 'hours worked', 'total'] },
  { key: 'mealBreakMinutes', label: 'Unpaid meal break (minutes)', synonyms: ['meal', 'meal break', 'lunch', 'lunch minutes', 'meal minutes'] },
  { key: 'hourlyRate', label: 'Hourly rate', hint: 'Blank on a union set = union minimum', synonyms: ['rate', 'hourly rate', 'hourly', 'pay rate', 'rate per hour'] },
  { key: 'grossEarnings', label: 'Gross pay', hint: 'Blank = calculated from hours and rate', synonyms: ['gross', 'gross pay', 'gross earnings', 'earnings', 'amount', 'pay'] },
  { key: 'union', label: 'Union', hint: 'Blank or "non-union" = non-union set', synonyms: ['union', 'union / guild', 'guild', 'local'] },
  { key: 'province', label: 'Province', synonyms: ['province', 'prov', 'region', 'location'] },
  { key: 'productionType', label: 'Production type (union rate card)', synonyms: ['production type', 'rate card', 'budget tier', 'tier'] },
  { key: 'notes', label: 'Notes', synonyms: ['notes', 'note', 'comments'] },
];

export const TEMPLATE_CSV = [
  'Production,Production company,Role,Date,Days,Hours per day,Meal break,Hourly rate,Gross pay,Union,Province,Production type,Notes',
  'Example Feature,Example Films Inc.,Grip,2026-09-14,5,13,60,,,IATSE 873,Ontario,Feature Film,Union minimum is filled in for you',
  'Student Short,Indie Collective,Background Performer,2026-09-20,1,10,30,22,,,Ontario,,Non-union day',
].join('\n') + '\n';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Best guess of which spreadsheet column holds each field. */
export function guessMapping(headers: string[]): Partial<Record<ImportField, string>> {
  const mapping: Partial<Record<ImportField, string>> = {};
  const taken = new Set<string>();
  // Exact synonym matches first, then "contains", so 'Total hours' doesn't grab 'Hours per day'.
  for (const pass of ['exact', 'contains'] as const) {
    for (const field of IMPORT_FIELDS) {
      if (mapping[field.key]) continue;
      const match = headers.find(h => !taken.has(h) && field.synonyms.some(s =>
        pass === 'exact' ? norm(h) === s : norm(h).includes(s)));
      if (match) { mapping[field.key] = match; taken.add(match); }
    }
  }
  return mapping;
}

// ── Values ──────────────────────────────────────────────────

const number = (v: string | undefined): number | undefined => {
  if (v == null || v.trim() === '') return undefined;
  const n = parseFloat(v.replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : NaN;
};

const NON_UNION = new Set(['', 'no', 'none', 'non union', 'nonunion', 'indie', 'n a', 'false']);

const PROVINCES: Record<string, string> = {
  on: 'Ontario', qc: 'Quebec', bc: 'British Columbia', ab: 'Alberta', mb: 'Manitoba', sk: 'Saskatchewan',
  ns: 'Nova Scotia', nb: 'New Brunswick', nl: 'Newfoundland and Labrador', pe: 'Prince Edward Island', pei: 'Prince Edward Island',
  yt: 'Yukon', nt: 'Northwest Territories', nu: 'Nunavut',
};
const province = (v: string | undefined, fallback: string): string | undefined => {
  if (!v?.trim()) return fallback;
  const n = norm(v);
  return PROVINCES[n.replace(/ /g, '')] ?? Object.values(PROVINCES).find(p => norm(p) === n);
};

export type DateOrder = 'ymd' | 'mdy' | 'dmy';

/** Reads the whole date column to tell 03/04/2026 (Mar 4) from 03/04/2026 (Apr 3). */
export function detectDateOrder(values: string[]): { order: DateOrder; ambiguous: boolean } {
  let dmy = false, mdy = false, slashed = false;
  for (const v of values) {
    const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(v.trim());
    if (!m) continue;
    slashed = true;
    if (+m[1] > 12) dmy = true;
    if (+m[2] > 12) mdy = true;
  }
  if (!slashed) return { order: 'ymd', ambiguous: false };
  if (dmy && !mdy) return { order: 'dmy', ambiguous: false };
  return { order: 'mdy', ambiguous: !mdy };
}

export function parseDate(v: string | undefined, order: DateOrder): string | undefined {
  const s = v?.trim();
  if (!s) return undefined;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  let y: number, mo: number, d: number;
  if (iso) [y, mo, d] = [+iso[1], +iso[2], +iso[3]];
  else {
    const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(s);
    if (m) {
      [mo, d] = order === 'dmy' ? [+m[2], +m[1]] : [+m[1], +m[2]];
      y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    } else {
      const t = new Date(s);  // "Sep 14, 2026" and similar
      if (isNaN(t.getTime())) return undefined;
      [y, mo, d] = [t.getFullYear(), t.getMonth() + 1, t.getDate()];
    }
  }
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return undefined;  // 2026-02-30
  return date.toISOString().slice(0, 10);
}

// ── Rows → jobs ─────────────────────────────────────────────

export interface ImportRowError { row: number; message: string }

export interface ImportResult {
  jobs: Job[];
  errors: ImportRowError[];
  duplicates: number;        // rows already on the slate (same production, role and date)
  ambiguousDates: boolean;   // every slashed date could be either order; read as month/day
  totals: { rows: number; hours: number; overtimeHours: number; gross: number; union: number; nonUnion: number; belowScale: number };
}

export interface ImportContext {
  userId: string;
  defaultProvince: string;
  existing: Pick<Job, 'productionName' | 'role' | 'startDate'>[];
}

const key = (j: Pick<Job, 'productionName' | 'role' | 'startDate'>) =>
  [norm(j.productionName), norm(j.role), j.startDate.slice(0, 10)].join('|');

export async function buildImport(
  rows: Record<string, string>[],
  mapping: Partial<Record<ImportField, string>>,
  ctx: ImportContext,
): Promise<ImportResult> {
  const col = (row: Record<string, string>, f: ImportField) => (mapping[f] ? row[mapping[f]!] ?? '' : '').toString();
  const { order, ambiguous } = detectDateOrder(rows.map(r => col(r, 'startDate')));
  const seen = new Set(ctx.existing.map(key));
  const errors: ImportRowError[] = [];
  const drafts: { n: number; job: Job; unionId?: string; productionType?: string }[] = [];
  let duplicates = 0;

  rows.forEach((row, i) => {
    const n = i + 2;  // spreadsheet row number (row 1 is the header)
    const fail = (message: string) => errors.push({ row: n, message });
    const productionName = col(row, 'productionName').trim();
    const companyName = col(row, 'companyName').trim();
    const roleText = col(row, 'role').trim();
    if (!productionName && !companyName && !roleText) return;  // blank line
    if (!productionName) return fail('Production is empty');
    if (!companyName) return fail('Production company is empty');
    if (!roleText) return fail('Role is empty');

    const startDate = parseDate(col(row, 'startDate'), order);
    if (!startDate) return fail(`Date "${col(row, 'startDate')}" isn't a date`);

    const numbers: Partial<Record<ImportField, number>> = {};
    for (const f of ['days', 'hoursPerDay', 'totalHours', 'mealBreakMinutes', 'hourlyRate', 'grossEarnings'] as const) {
      const v = number(col(row, f));
      if (Number.isNaN(v)) return fail(`${IMPORT_FIELDS.find(x => x.key === f)!.label} "${col(row, f)}" isn't a number`);
      if (v != null) numbers[f] = v;
    }
    const days = numbers.days ?? 1;
    const meal = numbers.mealBreakMinutes ?? 0;
    const total = numbers.totalHours;
    const rate = numbers.hourlyRate;
    const gross = numbers.grossEarnings;
    if (!Number.isInteger(days) || days < 1 || days > 366) return fail('Days must be a whole number from 1 to 366');
    // Total hours without a per-day column: spread evenly, meal break already taken out.
    const hoursPerDay = numbers.hoursPerDay ?? (total != null ? total / days + meal / 60 : undefined);
    if (hoursPerDay != null && (hoursPerDay <= 0 || hoursPerDay > 24)) return fail('Hours per day must be between 0 and 24');
    if (meal < 0 || meal > 600) return fail('Meal break must be 0–600 minutes');

    const prov = province(col(row, 'province'), ctx.defaultProvince);
    if (!prov) return fail(`Province "${col(row, 'province')}" isn't a Canadian province or territory`);

    const unionText = col(row, 'union').trim();
    const isUnion = !NON_UNION.has(norm(unionText));
    const union = isUnion ? findUnion(unionText) : null;
    if (isUnion && !union) return fail(`Union "${unionText}" isn't one we know. Use its name as written in the guide, e.g. "IATSE 873" or "ACTRA"`);

    const job = {
      id: '', userId: ctx.userId, status: 'CONFIRMED', createdAt: new Date().toISOString(), documentCount: 0,
      productionName, companyName, role: findRole(roleText)?.name ?? roleText,
      department: findRoleDepartment(roleText),
      startDate, province: prov, isUnion, unionTypeId: union?.id, unionName: union?.name,
      productionTier: col(row, 'productionType').trim() || undefined,
      daysWorked: days, hoursPerDay, mealBreakMinutes: meal, hourlyRate: rate, grossEarnings: gross,
      totalHours: 0, notes: col(row, 'notes').trim() || undefined,
    } as Job;

    if (seen.has(key(job))) { duplicates++; return; }
    seen.add(key(job));
    drafts.push({ n, job, unionId: union?.id, productionType: job.productionTier });
  });

  await loadJobRates(drafts.map(d => ({ isUnion: d.job.isUnion, unionId: d.unionId, date: d.job.startDate, productionType: d.productionType })));

  const jobs: Job[] = [];
  const totals = { rows: 0, hours: 0, overtimeHours: 0, gross: 0, union: 0, nonUnion: 0, belowScale: 0 };
  for (const { n, job } of drafts) {
    const priced = priceJob({
      isUnion: job.isUnion, unionId: job.unionTypeId, role: job.role, department: job.department, date: job.startDate,
      productionType: job.productionTier, hoursPerDay: job.hoursPerDay, mealBreakMinutes: job.mealBreakMinutes,
      days: job.daysWorked, hourlyRate: job.hourlyRate,
    });
    if (job.productionTier && priced.productionTypes.length > 0 && !priced.schedule) {
      errors.push({ row: n, message: `Production type "${job.productionTier}" isn't on the ${job.unionName} rate card for that date` });
      continue;
    }
    job.hourlyRate = priced.rate;
    job.unionMinimumRate = priced.minimum?.hourly ?? undefined;
    job.ratePosition = priced.minimum?.position;
    job.totalHours = priced.pay?.totalHours ?? 0;
    job.overtimeHours = priced.pay?.totalOvertimeHours ?? 0;
    job.grossEarnings = job.grossEarnings ?? priced.pay?.gross;
    jobs.push(job);

    totals.rows++;
    totals.hours += job.totalHours;
    totals.overtimeHours += job.overtimeHours ?? 0;
    totals.gross += job.grossEarnings ?? 0;
    if (job.isUnion) totals.union++; else totals.nonUnion++;
    if (priced.status === 'below') totals.belowScale++;
  }
  totals.hours = Math.round(totals.hours * 100) / 100;
  totals.overtimeHours = Math.round(totals.overtimeHours * 100) / 100;
  totals.gross = Math.round(totals.gross * 100) / 100;
  return { jobs, errors: errors.sort((a, b) => a.row - b.row), duplicates, ambiguousDates: ambiguous, totals };
}
