// Notes from set: in-app notifications worked out from a person's own data
// (jobs, union tracking) and sourced deadlines. Nothing here is invented:
// each note says why it appeared and offers the action it suggests.
// Mirrors ios/CineArch/Data/Notes.swift.
import type { Job, UserUnionTracking } from '../types';
import { getDeadlines, getUnionSpec, nextOccurrence, type Deadline } from './union_engine';
import { trackProgress } from './career';

export type NoteAction =
  | { kind: 'open'; to: '/' | '/jobs/new' }
  | { kind: 'confirm-job'; jobId: string }
  | { kind: 'link'; url: string };

export interface Note {
  id: string;            // stable, so a dismissed note stays dismissed
  title: string;
  body: string;
  date: string;          // YYYY-MM-DD the note is about
  action: NoteAction;
  actionLabel: string;
}

const DAY = 86_400_000;
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const fmt = (n: number) => n.toLocaleString('en-CA', { maximumFractionDigits: 1 });
const unit = (t: UserUnionTracking['targetType']) => ({ HOURS: 'hours', DAYS: 'days', CREDITS: 'credits', EARNINGS: 'dollars' })[t];

export function notesFor(
  { jobs, tracks, deadlines = getDeadlines(), today = new Date() }:
  { jobs: Job[]; tracks: UserUnionTracking[]; deadlines?: Deadline[]; today?: Date },
): Note[] {
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const notes: Note[] = [];

  for (const t of tracks) {
    const p = trackProgress(t, jobs, { today });
    if (p.target <= 0) continue;
    if (p.remaining === 0) {
      notes.push({ id: `ready-${t.unionTypeId}-${t.tierLabel}`, title: `Ready to apply: ${t.unionName}`, date: iso(t0),
        body: `You've reached ${fmt(p.target)} ${unit(t.targetType)} toward ${t.tierLabel}.`,
        action: { kind: 'open', to: '/' }, actionLabel: 'Open Your Wrap' });
    } else if (p.remaining <= p.target * 0.1) {
      notes.push({ id: `close-${t.unionTypeId}-${t.tierLabel}-${p.remaining}`, title: `${fmt(p.remaining)} ${unit(t.targetType)} to go for ${t.unionName}`, date: iso(t0),
        body: `You're ${Math.round(p.percent)}% of the way to ${t.tierLabel}.`,
        action: { kind: 'open', to: '/' }, actionLabel: 'Open Your Wrap' });
    }
    const tier = getUnionSpec(t.unionTypeId)?.tiers.find(x => x.name === t.tierLabel);
    if (tier?.windowMonths) {
      const since = new Date(t0); since.setMonth(since.getMonth() - tier.windowMonths);
      const days = jobs.filter(j => j.status !== 'TENTATIVE' && j.isUnion && j.unionTypeId === t.unionTypeId)
        .map(j => parse(j.startDate)).filter(d => d >= since);
      if (days.length > 0) {
        const drop = new Date(Math.min(...days.map(Number))); drop.setMonth(drop.getMonth() + tier.windowMonths);
        if (+drop - +t0 <= 14 * DAY)
          notes.push({ id: `window-${t.unionTypeId}-${iso(drop)}`, title: `A ${t.unionName} day drops out on ${drop.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}`, date: iso(drop),
            body: `Days older than ${tier.windowMonths} months stop counting toward ${t.tierLabel}. New days keep you on track.`,
            action: { kind: 'open', to: '/jobs/new' }, actionLabel: 'Mark the slate' });
      }
    }
  }

  for (const j of jobs) {
    if (j.status !== 'TENTATIVE') continue;
    const end = j.endDate ? parse(j.endDate) : parse(j.startDate);
    if (end < t0)
      notes.push({ id: `worked-${j.id}`, title: `Did you work ${j.productionName}?`, date: iso(end),
        body: 'It was pencilled in and its dates have passed. Confirm it so the days count.',
        action: { kind: 'confirm-job', jobId: j.id }, actionLabel: 'Yes, I worked it' });
  }

  const worked = jobs.filter(j => j.status !== 'TENTATIVE').map(j => parse(j.endDate ?? j.startDate));
  const last = worked.length ? new Date(Math.max(...worked.map(Number))) : undefined;
  if (last && +t0 - +last >= 14 * DAY)
    notes.push({ id: `quiet-${iso(last)}`, title: 'Back to one?', date: iso(t0),
      body: `Nothing marked since ${last.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}. Worked a day since? Add it so it counts.`,
      action: { kind: 'open', to: '/jobs/new' }, actionLabel: 'Mark the slate' });

  for (const d of deadlines) {
    if (d.appliesTo === 'union_member') continue;
    const when = nextOccurrence(d, t0);
    if (+when - +t0 > 14 * DAY) continue;
    const who = d.appliesTo === 'instalments' ? 'If you pay by instalments. ' : d.appliesTo === 'gst_registered' ? "If you're registered for GST/HST. " : '';
    notes.push({ id: `deadline-${d.id}-${when.getFullYear()}`, title: `${d.title}: ${when.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}`, date: iso(when),
      body: who + (d.detail ?? ''), action: { kind: 'link', url: d.sourceUrl }, actionLabel: `Open ${new URL(d.sourceUrl).hostname.replace('www.', '')}` });
  }

  return notes.sort((a, b) => a.date.localeCompare(b.date));
}
