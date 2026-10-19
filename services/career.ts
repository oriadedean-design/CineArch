// A person's standing, worked out from their jobs and the union engine:
// progress toward each union they're tracking, hours (union and not),
// earnings, and union jobs paid below scale. Pure, so the personal
// dashboard and Agency Mode (one call per client) read it the same way.
import type { Job, UnionTier, UserUnionTracking } from '../types';
import { findRole, findRoleDepartment, getUnionSpec } from './union_engine';

export interface TrackProgress {
  track: UserUnionTracking;
  current: number;
  target: number;        // the step's current target
  remaining: number;
  percent: number;
  jobs: number;          // jobs counted toward it
  productions: number;   // different productions among them
  minProductions?: number | null;
  productionsShort: boolean;   // the step needs more productions than this
  needsDepartment: boolean;    // counts one department but none is chosen, so all count
  confirmed: boolean;          // the target has a published source
}

export interface CareerSummary {
  tracks: TrackProgress[];
  primary?: TrackProgress;     // the track closest to done
  hours: { total: number; union: number; nonUnion: number; overtime: number };
  earnings: { total: number; union: number; nonUnion: number };
  belowScale: Job[];           // union jobs paid under the minimum that applied
  lastJob?: Job;
  jobCount: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

// Days worked: the logged day count, else the inclusive date span
// (single day when there's no end date).
export const workedDays = (job: Job): number => {
  if (job.daysWorked && job.daysWorked > 1) return job.daysWorked;
  if (!job.endDate) return 1;
  const ms = Date.parse(job.endDate) - Date.parse(job.startDate);
  return isNaN(ms) || ms < 0 ? 1 : Math.round(ms / 86_400_000) + 1;
};

export const isBelowScale = (job: Job) =>
  job.isUnion && job.unionMinimumRate != null && job.hourlyRate != null && job.hourlyRate < job.unionMinimumRate - 0.004;

export const quarterHours = (h: number) => Math.round(h * 4) / 4;

// ACTRA Toronto background hours for one day: you claim at least the 8 you
// were paid for; past 8, an hour comes off for lunch; quarter hours (six-minute
// marks round to the nearest quarter, e.g. :12 → .25, :54 → the next hour).
export const actraBackgroundDayHours = (onSetHours: number) =>
  onSetHours > 8 ? Math.max(8, quarterHours(onSetHours - 1)) : 8;

// The first day that still counts toward a tier with a time window.
export const windowStart = (months: number, today: Date) => {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - months, today.getUTCDate()));
  return d.toISOString().slice(0, 10);
};

// The catalog role a job's role names ("Background Performer", "BG"), else its slug.
const roleId = (role: string) => findRole(role)?.id ?? role.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

const tierFor = (track: UserUnionTracking): UnionTier | undefined =>
  getUnionSpec(track.unionTypeId)?.tiers.find(t => t.name === track.tierLabel);

// ACTRA members who joined as AABP before October 31, 2012 may count up to
// 800 background hours from before they joined.
const ACTRA_LEGACY_JOIN = '2012-10-31';
const ACTRA_LEGACY_HOURS = 800;

// Hours a job adds under a tier's hours rule.
const ruleHours = (j: Job, tier?: UnionTier) => {
  if (tier?.hoursRule !== 'actra_background') return j.totalHours || 0;
  const days = workedDays(j);
  const onSet = j.hoursPerDay ?? (j.totalHours || 0) / days;
  return days * (j.hoursPerDay != null ? actraBackgroundDayHours(onSet) : Math.max(8, quarterHours(onSet)));
};

// Days a job adds when short days count as half (856: a call of 4 hours or
// less; AQTIS: under 5 hours). Unknown hours count as full days.
export const tierDays = (j: Job, tier?: UnionTier) => {
  const days = workedDays(j);
  const limit = tier?.shortDayHours;
  const perDay = j.hoursPerDay ?? (j.totalHours ? j.totalHours / days : undefined);
  if (!limit || !perDay) return days;
  return (tier?.shortDayInclusive ? perDay <= limit : perDay < limit) ? days / 2 : days;
};

const key = (s?: string | null) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

// Progress toward one union step. By default only that union's jobs count,
// whether or not you're a member yet. Each step can change that: relevant work
// anywhere (permit steps like NABET's 40 days), one department, one province,
// some roles (or never some roles, like background toward ACTRA credits), a
// recent window, short days as half days, and a minimum number of productions.
export function trackProgress(
  track: UserUnionTracking, jobs: Job[],
  { tier = tierFor(track), today = new Date() }: { tier?: UnionTier; today?: Date } = {},
): TrackProgress {
  const since = tier?.windowMonths ? windowStart(tier.windowMonths, today) : undefined;
  const roles = tier?.roleIds?.length ? new Set(tier.roleIds) : undefined;
  const excluded = new Set(tier?.excludeRoleIds ?? []);
  const department = tier?.requiresDepartment && key(track.department) ? key(track.department) : undefined;
  const countsFrom = tier?.startLabel ? track.countsFrom : undefined;
  const eligible = jobs.filter(j =>
    (tier?.countsWork === 'any'
      || (j.isUnion && ((track.unionTypeId && j.unionTypeId === track.unionTypeId) || j.unionName === track.unionName)))
    && (!tier?.province || !j.province || j.province === tier.province)
    && (!roles || roles.has(roleId(j.role))) && !excluded.has(roleId(j.role))
    && (!since || j.startDate >= since)
    && (!department || key(j.department ?? findRoleDepartment(j.role)) === department));
  const relevant = countsFrom ? eligible.filter(j => j.startDate >= countsFrom) : eligible;
  const earlier = countsFrom ? eligible.filter(j => j.startDate < countsFrom) : [];
  const measure = (j: Job) =>
    track.targetType === 'HOURS' ? ruleHours(j, tier)
    : track.targetType === 'EARNINGS' ? j.grossEarnings || 0
    : track.targetType === 'DAYS' ? tierDays(j, tier)
    : 1;  // CREDITS: one per job (one work permit or contract)
  const legacy = tier?.hoursRule === 'actra_background' && countsFrom && countsFrom < ACTRA_LEGACY_JOIN
    ? Math.min(ACTRA_LEGACY_HOURS, earlier.reduce((sum, j) => sum + measure(j), 0)) : 0;
  const current = round((track.startingValue || 0) + legacy + relevant.reduce((sum, j) => sum + measure(j), 0));
  const target = tier && tier.targetType === track.targetType ? tier.targetValue : track.targetValue;
  const productions = new Set(relevant.map(j => key(j.productionName))).size;
  return {
    track: { ...track, targetValue: target }, current, target,
    remaining: round(Math.max(0, target - current)),
    percent: target > 0 ? Math.min(100, (current / target) * 100) : 0,
    jobs: relevant.length,
    productions,
    minProductions: tier?.minProductions ?? null,
    productionsShort: tier?.minProductions ? productions < tier.minProductions : false,
    needsDepartment: !!tier?.requiresDepartment && !key(track.department),
    confirmed: !!tier?.confirmed,
  };
}

export function assessCareer(jobs: Job[], tracks: UserUnionTracking[]): CareerSummary {
  const confirmed = jobs.filter(j => j.status !== 'TENTATIVE');
  const progress = tracks.map(t => trackProgress(t, confirmed));
  const sum = (list: Job[], f: (j: Job) => number) => round(list.reduce((s, j) => s + f(j), 0));
  const union = confirmed.filter(j => j.isUnion);
  const nonUnion = confirmed.filter(j => !j.isUnion);
  return {
    tracks: progress,
    primary: progress.filter(p => p.percent < 100).sort((a, b) => b.percent - a.percent)[0] ?? progress[0],
    hours: {
      total: sum(confirmed, j => j.totalHours || 0),
      union: sum(union, j => j.totalHours || 0),
      nonUnion: sum(nonUnion, j => j.totalHours || 0),
      overtime: sum(confirmed, j => j.overtimeHours || 0),
    },
    earnings: {
      total: sum(confirmed, j => j.grossEarnings || 0),
      union: sum(union, j => j.grossEarnings || 0),
      nonUnion: sum(nonUnion, j => j.grossEarnings || 0),
    },
    belowScale: union.filter(isBelowScale),
    lastJob: [...confirmed].sort((a, b) => b.startDate.localeCompare(a.startDate))[0],
    jobCount: confirmed.length,
  };
}
