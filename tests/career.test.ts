import { describe, expect, it } from 'vitest';
import { assessCareer, trackProgress } from '../services/engine';
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
