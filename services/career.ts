// A person's standing, worked out from their jobs and the union engine:
// progress toward each union they're tracking, hours (union and not),
// earnings, and union jobs paid below scale. Pure, so the personal
// dashboard and Agency Mode (one call per client) read it the same way.
import type { Job, UserUnionTracking } from '../types';

export interface TrackProgress {
  track: UserUnionTracking;
  current: number;
  target: number;
  remaining: number;
  percent: number;
  jobs: number;          // jobs counted toward it
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

// Progress toward one union tier. Only that union's jobs count.
export function trackProgress(track: UserUnionTracking, jobs: Job[]): TrackProgress {
  const relevant = jobs.filter(j =>
    j.isUnion && ((track.unionTypeId && j.unionTypeId === track.unionTypeId) || j.unionName === track.unionName));
  const measure = (j: Job) =>
    track.targetType === 'HOURS' ? j.totalHours || 0
    : track.targetType === 'EARNINGS' ? j.grossEarnings || 0
    : track.targetType === 'DAYS' ? workedDays(j)
    : 1;  // CREDITS: one per job
  const current = round((track.startingValue || 0) + relevant.reduce((sum, j) => sum + measure(j), 0));
  const target = track.targetValue;
  return {
    track, current, target,
    remaining: round(Math.max(0, target - current)),
    percent: target > 0 ? Math.min(100, (current / target) * 100) : 0,
    jobs: relevant.length,
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
