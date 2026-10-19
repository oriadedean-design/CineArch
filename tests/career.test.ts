import { describe, expect, it } from 'vitest';
import { actraBackgroundDayHours, assessCareer, nextOccurrence, quarterHours, trackProgress } from '../services/engine';
import type { UnionTier } from '../types';
import type { Job, UserUnionTracking } from '../types';

const job = (p: Partial<Job>): Job => ({
  id: Math.random().toString(36), userId: 'u1', status: 'CONFIRMED', productionName: 'Show', companyName: 'Co',
  role: 'Grip', isUnion: true, unionTypeId: 'u-873', unionName: 'IATSE 873', startDate: '2026-09-01',
  totalHours: 0, documentCount: 0, createdAt: '2026-09-01', ...p,
});

const track: UserUnionTracking = {
  id: 't1', userId: 'u1', unionTypeId: 'u-873', unionName: 'IATSE 873', tierLabel: 'Permittee',
  targetType: 'DAYS', targetValue: 30, startingValue: 4,
};

describe('trackProgress', () => {
  it('counts only that union\'s jobs, plus the starting value', () => {
    const p = trackProgress(track, [
      job({ daysWorked: 5 }),
      job({ startDate: '2026-09-10', endDate: '2026-09-12' }),     // 3-day span
      job({ isUnion: false, unionTypeId: undefined, unionName: undefined, daysWorked: 10 }),
      job({ unionTypeId: 'u-667', unionName: 'IATSE 667', daysWorked: 10 }),
    ]);
    expect(p).toMatchObject({ current: 12, target: 30, remaining: 18, jobs: 2 });
    expect(p.percent).toBe(40);
  });

  it('measures hours and earnings for those targets', () => {
    const jobs = [job({ totalHours: 60, grossEarnings: 3402 })];
    expect(trackProgress({ ...track, targetType: 'HOURS', startingValue: 0 }, jobs).current).toBe(60);
    expect(trackProgress({ ...track, targetType: 'EARNINGS', startingValue: 0 }, jobs).current).toBe(3402);
  });
});

describe('ACTRA Toronto background (AABP)', () => {
  const bg = (p: Partial<Job>) => job({ role: 'Background Performer', unionTypeId: 'u-actra', unionName: 'ACTRA', province: 'Ontario', ...p });
  const aabp: UnionTier = { name: 'Additional Background Performer (AABP)', targetType: 'DAYS', targetValue: 15, description: '',
    province: 'Ontario', roleIds: ['background-performer'], windowMonths: 12 };
  const route: UnionTier = { name: 'Apprentice credit (background route)', targetType: 'HOURS', targetValue: 1600, description: '',
    province: 'Ontario', roleIds: ['background-performer'], hoursRule: 'actra_background' };
  const actra = (t: UnionTier): UserUnionTracking => ({ id: 't2', userId: 'u1', unionTypeId: 'u-actra', unionName: 'ACTRA',
    tierLabel: t.name, targetType: t.targetType, targetValue: t.targetValue, startingValue: 0 });
  const today = new Date('2026-10-16T12:00:00Z');

  it('rounds to the quarter hour the way ACTRA Toronto lists it', () => {
    // :06 → .00, :12 → .25, :18 → .25, :24 → .50, :30 → .50, :36 → .50, :42 → .75, :48 → .75, :54 → 1
    expect([6, 12, 18, 24, 30, 36, 42, 48, 54].map(m => quarterHours(10 + m / 60) - 10)).toEqual([0, .25, .25, .5, .5, .5, .75, .75, 1]);
  });

  it('claims the paid 8 on short days and takes an hour off for lunch past 8', () => {
    expect(actraBackgroundDayHours(5)).toBe(8);
    expect(actraBackgroundDayHours(8)).toBe(8);
    expect(actraBackgroundDayHours(8.5)).toBe(8);
    expect(actraBackgroundDayHours(11.2)).toBe(10.25);   // 11h12 on set → 10h12 → 10.25
    expect(actraBackgroundDayHours(14)).toBe(13);
  });

  it('counts only union background days in the last 12 months toward AABP', () => {
    const p = trackProgress(actra(aabp), [
      bg({ startDate: '2026-03-02', daysWorked: 10 }),
      bg({ startDate: '2025-10-17' }),                                     // inside the window
      bg({ startDate: '2025-10-15' }),                                     // 12 months and a day ago
      bg({ startDate: '2026-04-01', isUnion: false, unionTypeId: undefined, unionName: undefined }),  // non-union
      bg({ startDate: '2026-05-01', role: 'Actor' }),                      // principal work
      bg({ startDate: '2026-06-01', province: 'British Columbia' }),       // UBCP territory
    ], { tier: aabp, today });
    expect(p).toMatchObject({ current: 11, remaining: 4, jobs: 2 });
  });

  it('adds up background hours by ACTRA\'s rules toward the Apprentice credit', () => {
    const p = trackProgress(actra(route), [
      bg({ daysWorked: 3, hoursPerDay: 12, totalHours: 33 }),   // 3 × 11
      bg({ hoursPerDay: 6, totalHours: 6 }),                     // paid the 8
      bg({ totalHours: 9.4 }),                                   // no call-to-wrap logged: 9.5
    ], { tier: route, today });
    expect(p.current).toBe(33 + 8 + 9.5);
  });

  it('counts background hours from the AABP since date', () => {
    const since: UnionTier = { ...route, startLabel: 'AABP since' };
    const jobs = [
      bg({ startDate: '2026-01-10', daysWorked: 10, hoursPerDay: 9, totalHours: 80 }),   // before joining: 10 × 8
      bg({ startDate: '2026-06-01', daysWorked: 5, hoursPerDay: 12, totalHours: 55 }),   // after: 5 × 11
    ];
    expect(trackProgress({ ...actra(since), countsFrom: '2026-05-01' }, jobs, { tier: since, today }).current).toBe(55);
    expect(trackProgress(actra(since), jobs, { tier: since, today }).current).toBe(80 + 55);   // no date yet: everything
  });

  it('lets AABP members who joined before October 31, 2012 count up to 800 earlier hours', () => {
    const since: UnionTier = { ...route, startLabel: 'AABP since' };
    const jobs = [
      bg({ startDate: '2011-01-03', daysWorked: 120, hoursPerDay: 8, totalHours: 960 }),  // 960 before joining → 800
      bg({ startDate: '2013-02-01', daysWorked: 10, hoursPerDay: 8, totalHours: 80 }),
    ];
    expect(trackProgress({ ...actra(since), countsFrom: '2012-06-01' }, jobs, { tier: since, today }).current).toBe(880);
  });
});

describe('assessCareer', () => {
  it('splits union and non-union work, skips tentative jobs and flags pay below scale', () => {
    const summary = assessCareer([
      job({ totalHours: 60, overtimeHours: 20, grossEarnings: 3402, hourlyRate: 48.6, unionMinimumRate: 48.6 }),
      job({ startDate: '2026-09-20', totalHours: 9, grossEarnings: 360, hourlyRate: 40, unionMinimumRate: 48.6 }),
      job({ isUnion: false, unionTypeId: undefined, totalHours: 9.5, grossEarnings: 209, hourlyRate: 22 }),
      job({ status: 'TENTATIVE', totalHours: 100 }),
    ], [track]);
    expect(summary.hours).toEqual({ total: 78.5, union: 69, nonUnion: 9.5, overtime: 20 });
    expect(summary.earnings.total).toBe(3971);
    expect(summary.belowScale).toHaveLength(1);
    expect(summary.lastJob?.startDate).toBe('2026-09-20');
    expect(summary.jobCount).toBe(3);
    expect(summary.primary?.track.id).toBe('t1');
  });
});

describe('deadlines', () => {
  it('finds the next time a date comes round', () => {
    expect(nextOccurrence({ month: 6, day: 15 }, new Date(2026, 9, 17))).toEqual(new Date(2027, 5, 15));
    expect(nextOccurrence({ month: 12, day: 15 }, new Date(2026, 9, 17))).toEqual(new Date(2026, 11, 15));
    expect(nextOccurrence({ month: 10, day: 17 }, new Date(2026, 9, 17, 15))).toEqual(new Date(2026, 9, 17));
  });
});

describe('step rules from the October 2026 review', () => {
  const base: UserUnionTracking = { id: 't3', userId: 'u1', unionTypeId: 'u-856', unionName: 'IATSE 856', tierLabel: 'Member',
    targetType: 'DAYS', targetValue: 60, startingValue: 0 };
  const j856 = (p: Partial<Job>) => job({ unionTypeId: 'u-856', unionName: 'IATSE 856', ...p });

  it('counts a short call as half a day (856: 4 hours or less)', () => {
    const tier: UnionTier = { name: 'Member', targetType: 'DAYS', targetValue: 60, description: '', shortDayHours: 4, shortDayInclusive: true };
    const p = trackProgress(base, [j856({ hoursPerDay: 4 }), j856({ hoursPerDay: 10 }), j856({ totalHours: 3, daysWorked: 2 })], { tier });
    expect(p.current).toBe(0.5 + 1 + 1);
  });

  it('counts only the chosen department, and says when none is chosen', () => {
    const tier: UnionTier = { name: 'Member', targetType: 'DAYS', targetValue: 60, description: '', requiresDepartment: true };
    const jobs = [j856({ department: 'Grip', daysWorked: 5 }), j856({ department: 'Electric', daysWorked: 3 })];
    expect(trackProgress({ ...base, department: 'Grip' }, jobs, { tier }).current).toBe(5);
    const open = trackProgress(base, jobs, { tier });
    expect(open.current).toBe(8);
    expect(open.needsDepartment).toBe(true);
  });

  it('checks the number of different productions', () => {
    const tier: UnionTier = { name: 'Member', targetType: 'DAYS', targetValue: 2, description: '', minProductions: 2 };
    const p = trackProgress(base, [j856({ productionName: 'A', daysWorked: 3 }), j856({ productionName: ' a ' })], { tier });
    expect(p).toMatchObject({ remaining: 0, productions: 1, productionsShort: true });
  });

  it('lets permit steps count relevant work anywhere (NABET 40 days)', () => {
    const tier: UnionTier = { name: 'Permittee', targetType: 'DAYS', targetValue: 40, description: '', countsWork: 'any' };
    const nabet = { ...base, unionTypeId: 'u-nabet', unionName: 'NABET 700-M UNIFOR', tierLabel: 'Permittee' };
    const p = trackProgress(nabet, [job({ isUnion: false, unionTypeId: undefined, unionName: undefined, daysWorked: 10 }), job({ daysWorked: 2 })], { tier });
    expect(p.current).toBe(12);
  });

  it('never counts background work toward ACTRA credits, one credit per permit', () => {
    const tier: UnionTier = { name: 'Apprentice', targetType: 'CREDITS', targetValue: 1, description: '', excludeRoleIds: ['background-performer'] };
    const actra = { ...base, unionTypeId: 'u-actra', unionName: 'ACTRA', tierLabel: 'Apprentice', targetType: 'CREDITS' as const, targetValue: 1 };
    const p = trackProgress(actra, [
      job({ unionTypeId: 'u-actra', unionName: 'ACTRA', role: 'Background Performer' }),
      job({ unionTypeId: 'u-actra', unionName: 'ACTRA', role: 'Principal Performer', daysWorked: 3 }),
    ], { tier });
    expect(p.current).toBe(1);
  });

  it('uses the step\'s current target over the one saved with the track', () => {
    const tier: UnionTier = { name: 'Member', targetType: 'DAYS', targetValue: 120, description: '', confirmed: true };
    const p = trackProgress({ ...base, targetValue: 90 }, [], { tier });
    expect(p).toMatchObject({ target: 120, confirmed: true });
  });
});

describe('self-employed CPP (2026)', () => {
  it('stops at the yearly ceiling and adds CPP2 up to $85,000', async () => {
    const { selfEmployedCpp } = await import('../services/tax');
    expect(selfEmployedCpp(56000)).toBe(6247.5);
    expect(selfEmployedCpp(100000)).toBe(9292.9);
    expect(selfEmployedCpp(3000)).toBe(0);
  });
});
