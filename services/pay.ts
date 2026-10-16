// Pay for work logged by the hour. Pure functions: no I/O, so the job form,
// bulk import and tests all compute pay the same way.
//
// A day: hours on the clock (call to wrap) minus the unpaid meal break is
// the time worked. Under a union pay rule, worked time is rounded up to the
// agreement's unit (e.g. 6 minutes), the first hours are paid at the rate
// (at least the minimum call / daily fee), and each overtime step pays a
// multiple of the rate from the hour it starts.

export interface PayRuleInput {
  minimumCallHours?: number | null;   // hours paid even when fewer are worked
  overtimeAfter: number[];            // e.g. [8, 12, 15]
  overtimeMultipliers: number[];      // e.g. [1.5, 2, 3]
  incrementMinutes?: number | null;   // e.g. 6 = paid in tenths of an hour
}

export interface DayInput {
  hoursOnClock: number;        // call to wrap
  mealBreakMinutes?: number;   // unpaid
  hourlyRate: number;
  rule?: PayRuleInput | null;  // null = no union rule (non-union set): rate x hours
  dailyMinimum?: number | null; // union daily fee, when the agreement has one
}

export interface PayBand {
  label: string;      // 'Straight time', '1.5x', ...
  multiplier: number;
  hours: number;      // hours worked in this band
  amount: number;
}

export interface DayPay {
  workedHours: number;     // after the meal break and rounding
  overtimeHours: number;
  bands: PayBand[];
  minimumTopUp: number;    // added to reach the minimum call / daily fee
  total: number;
}

export interface JobPay extends DayPay {
  days: number;
  totalHours: number;      // worked hours across all days
  totalOvertimeHours: number;
  gross: number;
}

const cents = (n: number) => Math.round(n * 100) / 100;
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

const multiplierLabel = (m: number) => `${Number.isInteger(m) ? m : m.toFixed(1)}x`;

export function workedHours(hoursOnClock: number, mealBreakMinutes = 0, incrementMinutes?: number | null): number {
  const raw = Math.max(0, hoursOnClock - Math.max(0, mealBreakMinutes) / 60);
  if (!incrementMinutes) return cents(raw);
  const unit = incrementMinutes / 60;
  // Round up to the next unit ("any part of a tenth of an hour"), ignoring float noise.
  return cents(Math.ceil(roundTo(raw / unit, 1e-6)) * unit);
}

export function dayPay({ hoursOnClock, mealBreakMinutes = 0, hourlyRate, rule, dailyMinimum }: DayInput): DayPay {
  const worked = workedHours(hoursOnClock, mealBreakMinutes, rule?.incrementMinutes);
  const rate = Math.max(0, hourlyRate);

  if (!rule) {
    const amount = cents(worked * rate);
    return { workedHours: worked, overtimeHours: 0, minimumTopUp: 0, total: amount,
             bands: [{ label: 'Straight time', multiplier: 1, hours: worked, amount }] };
  }

  const steps = rule.overtimeAfter.map((after, i) => ({ after, multiplier: rule.overtimeMultipliers[i] ?? 1 }));
  const straightLimit = steps[0]?.after ?? Infinity;
  const bands: PayBand[] = [];
  const straightHours = Math.min(worked, straightLimit);
  bands.push({ label: 'Straight time', multiplier: 1, hours: cents(straightHours), amount: cents(straightHours * rate) });

  let overtime = 0;
  steps.forEach((step, i) => {
    const end = steps[i + 1]?.after ?? Infinity;
    const hours = Math.max(0, Math.min(worked, end) - step.after);
    if (hours <= 0) return;
    overtime += hours;
    bands.push({ label: multiplierLabel(step.multiplier), multiplier: step.multiplier, hours: cents(hours),
                 amount: cents(hours * rate * step.multiplier) });
  });

  // The straight-time part of the day is never less than the minimum call / daily fee.
  const straightPaid = bands[0].amount;
  const floor = Math.max(
    rule.minimumCallHours ? cents(Math.min(rule.minimumCallHours, straightLimit) * rate) : 0,
    dailyMinimum ?? 0,
  );
  const minimumTopUp = cents(Math.max(0, floor - straightPaid));
  const total = cents(bands.reduce((sum, b) => sum + b.amount, 0) + minimumTopUp);
  return { workedHours: worked, overtimeHours: cents(overtime), bands, minimumTopUp, total };
}

// Several identical days (same hours each day).
export function jobPay(input: DayInput & { days?: number }): JobPay {
  const days = Math.max(1, Math.floor(input.days ?? 1));
  const day = dayPay(input);
  return {
    ...day,
    days,
    totalHours: cents(day.workedHours * days),
    totalOvertimeHours: cents(day.overtimeHours * days),
    gross: cents(day.total * days),
  };
}

export type ScaleStatus = 'above' | 'at' | 'below' | 'unknown';

// Is the rate at least the union minimum? Rates are compared to the cent.
export function scaleStatus(rate: number | null | undefined, minimum: number | null | undefined): ScaleStatus {
  if (rate == null || minimum == null || !(rate > 0)) return 'unknown';
  const diff = cents(rate) - cents(minimum);
  if (Math.abs(diff) < 0.005) return 'at';
  return diff > 0 ? 'above' : 'below';
}

export const describeOvertime = (rule: PayRuleInput): string =>
  rule.overtimeAfter.map((after, i) => `${multiplierLabel(rule.overtimeMultipliers[i])} after ${after}h`).join(', ');
