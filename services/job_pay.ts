// Prices a job from its hours: finds the union rate schedule and minimum for
// the role on the job date, the union's pay rule, and works out the pay.
// Used by the job form and the spreadsheet import so both agree.
import {
  findRateSchedule, findMinimumRate, getPayRule, getProductionTypes, getRateLines, ensureRateLines,
  type MinimumRate, type PayRule, type RateSchedule,
} from './union_engine';
import { jobPay, scaleStatus, type JobPay, type ScaleStatus } from './pay';

export interface JobPayInput {
  isUnion: boolean;
  unionId?: string;
  department?: string;
  role?: string;
  date: string;                 // YYYY-MM-DD
  productionType?: string | null;
  ratePosition?: string;        // rate-sheet position, when the person picked one
  hoursPerDay?: number;         // call to wrap
  mealBreakMinutes?: number;
  days?: number;
  hourlyRate?: number;          // what they were paid; defaults to the union minimum
}

export interface PricedJob {
  schedule?: RateSchedule;
  productionTypes: (string | null)[];   // choices when the union has several rate cards
  minimum?: MinimumRate;
  rule?: PayRule;
  rate?: number;                         // the rate used: theirs, or the union minimum
  pay?: JobPay;                          // undefined until there are hours and a rate
  status: ScaleStatus;                   // their rate vs the union minimum
}

const day = (date: string) => date.slice(0, 10);

/** Synchronous: assumes the schedule's lines are loaded (see loadJobRates). */
export function priceJob(input: JobPayInput): PricedJob {
  const unionId = input.isUnion ? input.unionId : undefined;
  const date = day(input.date);
  const productionTypes = unionId ? getProductionTypes(unionId, date) : [];
  const schedule = unionId ? findRateSchedule(unionId, date, input.productionType) : undefined;
  const minimum = schedule ? findMinimumRate(schedule, { position: input.ratePosition, role: input.role }) : undefined;
  const rule = unionId ? getPayRule(unionId, input.department) : undefined;
  const rate = input.hourlyRate && input.hourlyRate > 0 ? input.hourlyRate : minimum?.hourly ?? undefined;

  const pay = input.hoursPerDay && input.hoursPerDay > 0 && rate
    ? jobPay({
        hoursOnClock: input.hoursPerDay,
        mealBreakMinutes: input.mealBreakMinutes ?? 0,
        hourlyRate: rate,
        rule,
        // The union daily fee is the floor only when they're paid at least scale.
        dailyMinimum: minimum?.daily ?? null,
        days: input.days ?? 1,
      })
    : undefined;

  return { schedule, productionTypes, minimum, rule, rate, pay, status: scaleStatus(rate, minimum?.hourly) };
}

/** Loads the rate lines priceJob needs for these jobs (one request). */
export async function loadJobRates(inputs: Pick<JobPayInput, 'isUnion' | 'unionId' | 'date' | 'productionType'>[]): Promise<void> {
  const ids = new Set<string>();
  for (const i of inputs) {
    if (!i.isUnion || !i.unionId) continue;
    const s = findRateSchedule(i.unionId, day(i.date), i.productionType);
    if (s && !getRateLines(s.id)) ids.add(s.id);
  }
  if (ids.size > 0) await ensureRateLines([...ids]);
}
