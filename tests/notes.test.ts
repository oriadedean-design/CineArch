import { describe, expect, it } from 'vitest';
import { notesFor } from '../services/notes';
import type { Deadline } from '../services/engine';
import type { Job, UserUnionTracking } from '../types';

const job = (p: Partial<Job>): Job => ({
  id: Math.random().toString(36), userId: 'u1', status: 'CONFIRMED', productionName: 'Show', companyName: 'Co',
  role: 'Grip', isUnion: true, unionTypeId: 'u-873', unionName: 'IATSE 873', startDate: '2026-10-10',
  totalHours: 10, documentCount: 0, createdAt: '2026-10-10', ...p,
});
const track: UserUnionTracking = { id: 't', userId: 'u1', unionTypeId: 'u-873', unionName: 'IATSE 873', tierLabel: 'Member',
  targetType: 'DAYS', targetValue: 10, startingValue: 0 };
const today = new Date(2026, 9, 17);
const ids = (notes: { id: string }[]) => notes.map(n => n.id.split('-')[0]);

describe('notes from set', () => {
  it('says when you are close to a union target, and when you have reached it', () => {
    expect(ids(notesFor({ jobs: [job({ daysWorked: 9 })], tracks: [track], deadlines: [], today }))).toEqual(['close']);
    const ready = notesFor({ jobs: [job({ daysWorked: 10 })], tracks: [track], deadlines: [], today });
    expect(ready[0]).toMatchObject({ title: 'Ready to apply: IATSE 873', actionLabel: 'Open Your Wrap' });
    expect(notesFor({ jobs: [job({ daysWorked: 5 })], tracks: [track], deadlines: [], today })).toEqual([]);
  });

  it('asks about pencilled-in jobs whose dates have passed, with a confirm action', () => {
    const j = job({ status: 'TENTATIVE', startDate: '2026-10-01', endDate: '2026-10-05' });
    const [n] = notesFor({ jobs: [j, job({})], tracks: [], deadlines: [], today });
    expect(n).toMatchObject({ title: 'Did you work Show?', action: { kind: 'confirm-job', jobId: j.id } });
    expect(notesFor({ jobs: [job({ status: 'TENTATIVE', startDate: '2026-11-01' }), job({})], tracks: [], deadlines: [], today })).toEqual([]);
  });

  it('nudges after 14 quiet days', () => {
    expect(ids(notesFor({ jobs: [job({ startDate: '2026-10-03' })], tracks: [], deadlines: [], today }))).toEqual(['quiet']);
    expect(notesFor({ jobs: [job({ startDate: '2026-10-04' })], tracks: [], deadlines: [], today })).toEqual([]);
  });

  it('lists sourced deadlines in the next 14 days, saying who they apply to', () => {
    const d: Deadline = { id: 'x', title: 'Tax instalment', month: 10, day: 30, appliesTo: 'instalments', province: null, unionId: null,
      detail: 'Only above $3,000.', sourceUrl: 'https://www.canada.ca/x', checkedOn: '2026-10-17' };
    const [n] = notesFor({ jobs: [job({})], tracks: [], deadlines: [d], today });
    expect(n).toMatchObject({ body: 'If you pay by instalments. Only above $3,000.', actionLabel: 'Open canada.ca', action: { kind: 'link' } });
    expect(notesFor({ jobs: [job({})], tracks: [], deadlines: [{ ...d, month: 12, day: 15 }], today })).toEqual([]);
  });
});
