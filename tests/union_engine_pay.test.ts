import { beforeAll, describe, expect, it } from 'vitest';
import {
  setEngineSnapshot, setRateLines, getPayRule, findRateSchedule, findMinimumRate, getProductionTypes,
  type EngineSnapshot, type RateLine,
} from '../services/engine';
import fixture from './fixtures/pay_engine.json';

// A slice of the real engine data (pay rules, IATSE 873 and ACTRA schedules),
// taken from union_engine_snapshot() / rate_schedule_lines().
beforeAll(() => {
  setEngineSnapshot(fixture.snapshot as unknown as EngineSnapshot);
  setRateLines(fixture.lines as unknown as Record<string, RateLine[]>);
});

describe('pay rules', () => {
  it('uses the department rule when there is one', () => {
    expect(getPayRule('u-873', 'Transportation')?.minimumCallHours).toBe(9);
    expect(getPayRule('u-873', 'Grip')?.minimumCallHours).toBe(8);
    expect(getPayRule('u-873')?.overtimeAfter).toEqual([8, 12, 15]);
  });
});

describe('rate schedules', () => {
  it('picks the schedule in effect on the job date', () => {
    expect(findRateSchedule('u-873', '2026-10-08', 'Feature Film')?.id).toBe('iatse-873-feature-2026');
    expect(findRateSchedule('u-873', '2026-03-28', 'Feature Film')?.id).toBe('iatse-873-feature-2025');
    expect(findRateSchedule('u-873', '2026-03-29', 'Feature Film')?.id).toBe('iatse-873-feature-2026');
  });

  it('needs a production type when a union has several', () => {
    expect(getProductionTypes('u-873', '2026-10-08')).toContain('Low Budget Feature ($3M and below)');
    expect(findRateSchedule('u-873', '2026-10-08')).toBeUndefined();
  });

  it('needs no production type when a union has one schedule', () => {
    expect(getProductionTypes('u-actra', '2026-05-01')).toEqual([null]);
    expect(findRateSchedule('u-actra', '2026-05-01')?.id).toBe('actra-ipa-2026');
  });
});

describe('minimum rates', () => {
  it('finds the minimum for a catalog role', () => {
    const feature = findRateSchedule('u-873', '2026-10-08', 'Feature Film')!;
    expect(findMinimumRate(feature, { role: 'Grip' })?.hourly).toBe(48.60);
    const lowBudget = findRateSchedule('u-873', '2026-10-08', 'Low Budget Feature ($3M and below)')!;
    expect(findMinimumRate(lowBudget, { role: 'Grip' })?.hourly).toBe(32.09);
  });

  it('reports negotiable positions as null', () => {
    const feature = findRateSchedule('u-873', '2026-10-08', 'Feature Film')!;
    expect(findMinimumRate(feature, { role: 'Production Sound Mixer' })?.hourly).toBeNull();
  });

  it('gives performers the daily fee too, and lets them pick the category', () => {
    const ipa = findRateSchedule('u-actra', '2026-05-01')!;
    expect(findMinimumRate(ipa, { role: 'Actor' })).toMatchObject({ position: '(a) Principal Actor, etc.', hourly: 121.25, daily: 972.75 });
    expect(findMinimumRate(ipa, { position: '(c) Actor, etc.' })).toMatchObject({ hourly: 82, daily: 656.5 });
    expect(findMinimumRate(ipa, { role: 'Background Performer' })).toMatchObject({ hourly: 35.25, daily: 284.5 });
  });
});
