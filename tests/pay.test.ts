import { describe, expect, it } from 'vitest';
import { dayPay, jobPay, scaleStatus, workedHours } from '../services/pay';

// Rules as seeded from the agreements (supabase/migrations/20261009000004_pay_rules_seed.sql).
const IATSE_873 = { minimumCallHours: 8, overtimeAfter: [8, 12, 15], overtimeMultipliers: [1.5, 2, 3], incrementMinutes: 6 };
const IATSE_873_TRANSPORT = { minimumCallHours: 9, overtimeAfter: [9, 12, 15], overtimeMultipliers: [1.5, 2, 3], incrementMinutes: 6 };
const ACTRA_IPA = { minimumCallHours: null, overtimeAfter: [8, 12], overtimeMultipliers: [1.5, 2], incrementMinutes: 6 };

const GRIP_873_FEATURE_2026 = 48.60;
const DRIVER_873_FEATURE_2026 = 43.38;
const IPA_PRINCIPAL_2026 = { hourly: 121.25, daily: 972.75 };

describe('worked hours', () => {
  it('subtracts the unpaid meal break', () => {
    expect(workedHours(13, 60)).toBe(12);
  });
  it('rounds up to the agreement unit (any part of a tenth of an hour)', () => {
    expect(workedHours(8 + 7 / 60, 0, 6)).toBe(8.2);
    expect(workedHours(8.1, 0, 6)).toBe(8.1);
  });
  it('never goes negative', () => {
    expect(workedHours(0.5, 60)).toBe(0);
  });
});

describe('IATSE 873 crew day (Grip, Feature Film, 2026–27: $48.60/hr)', () => {
  const rate = GRIP_873_FEATURE_2026;

  it('pays 1.5x after 8 hours worked', () => {
    // 13h call-to-wrap, 1h unpaid lunch → 12h worked: 8 x 48.60 + 4 x 72.90
    const pay = dayPay({ hoursOnClock: 13, mealBreakMinutes: 60, hourlyRate: rate, rule: IATSE_873 });
    expect(pay.workedHours).toBe(12);
    expect(pay.overtimeHours).toBe(4);
    expect(pay.total).toBe(680.40);
  });

  it('pays 2x from the 12th hour and 3x from the 16th', () => {
    // 17h worked: 8 @1x, 4 @1.5x, 3 @2x, 2 @3x
    const pay = dayPay({ hoursOnClock: 17, hourlyRate: rate, rule: IATSE_873 });
    expect(pay.bands.map(b => [b.multiplier, b.hours])).toEqual([[1, 8], [1.5, 4], [2, 3], [3, 2]]);
    expect(pay.total).toBe(1263.60); // 388.80 + 291.60 + 291.60 + 291.60
  });

  it('pays the 8-hour minimum call on a short day', () => {
    const pay = dayPay({ hoursOnClock: 5, hourlyRate: rate, rule: IATSE_873 });
    expect(pay.minimumTopUp).toBe(145.80);
    expect(pay.total).toBe(388.80);
  });

  it('pays overtime in tenths of an hour', () => {
    const pay = dayPay({ hoursOnClock: 8 + 7 / 60, hourlyRate: rate, rule: IATSE_873 });
    expect(pay.total).toBe(403.38); // 388.80 + 0.2h x 72.90
  });

  it('uses the Transportation rule: 9-hour call, overtime after 9', () => {
    const pay = dayPay({ hoursOnClock: 10, hourlyRate: DRIVER_873_FEATURE_2026, rule: IATSE_873_TRANSPORT });
    expect(pay.total).toBe(455.49); // 9 x 43.38 + 1 x 65.07
  });

  it('multiplies identical days', () => {
    const pay = jobPay({ hoursOnClock: 13, mealBreakMinutes: 60, hourlyRate: rate, rule: IATSE_873, days: 5 });
    expect(pay.totalHours).toBe(60);
    expect(pay.totalOvertimeHours).toBe(20);
    expect(pay.gross).toBe(3402);
  });
});

describe('ACTRA IPA performer day (Principal Actor 2026: $972.75/day, $121.25/hr)', () => {
  const base = { hourlyRate: IPA_PRINCIPAL_2026.hourly, rule: ACTRA_IPA, dailyMinimum: IPA_PRINCIPAL_2026.daily };

  it('pays at least the daily fee', () => {
    expect(dayPay({ ...base, hoursOnClock: 6 }).total).toBe(972.75);
  });

  it('pays 150% after 8 hours on top of the daily fee', () => {
    // 10h worked: daily fee + 2h x 181.875
    const pay = dayPay({ ...base, hoursOnClock: 10.5, mealBreakMinutes: 30 });
    expect(pay.workedHours).toBe(10);
    expect(pay.total).toBe(1336.50); // 972.75 + 2h x 181.875
  });

  it('pays 200% after 12 hours', () => {
    const pay = dayPay({ ...base, hoursOnClock: 13 });
    expect(pay.bands.map(b => [b.multiplier, b.hours])).toEqual([[1, 8], [1.5, 4], [2, 1]]);
  });
});

describe('non-union day', () => {
  it('is rate x hours with no overtime rule', () => {
    const pay = dayPay({ hoursOnClock: 11, mealBreakMinutes: 30, hourlyRate: 25 });
    expect(pay.workedHours).toBe(10.5);
    expect(pay.overtimeHours).toBe(0);
    expect(pay.total).toBe(262.5);
  });
});

describe('scale check', () => {
  it('compares the rate with the union minimum', () => {
    expect(scaleStatus(48.60, 48.60)).toBe('at');
    expect(scaleStatus(50, 48.60)).toBe('above');
    expect(scaleStatus(45, 48.60)).toBe('below');
    expect(scaleStatus(45, null)).toBe('unknown');
    expect(scaleStatus(undefined, 48.60)).toBe('unknown');
  });
});
