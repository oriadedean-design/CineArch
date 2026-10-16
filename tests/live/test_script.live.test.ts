// Runs the CineArch Pay Test script against the live database: the real
// engine data, and what an anonymous visitor can and can't reach.
// Run: npm run test:live (needs VITE_SUPABASE_* in .env.local)
import { beforeAll, describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  setEngineSnapshot, setRateLineLoader, findRoleDepartment, loadJobRates, priceJob,
  buildImport, guessMapping, TEMPLATE_CSV, type EngineSnapshot, type RateLine, type JobPayInput,
} from '../../services/engine';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const live = !!process.env.LIVE && !!url && !!key;
const db = live ? createClient(url, key, { auth: { persistSession: false } }) : null!;

const crew = (p: Partial<JobPayInput>): JobPayInput => ({
  isUnion: true, unionId: 'u-873', role: 'Grip', department: findRoleDepartment('Grip'),
  productionType: 'Feature Film', date: '2026-10-08', days: 1, ...p,
});
const price = async (input: JobPayInput) => { await loadJobRates([input]); return priceJob(input); };

describe.skipIf(!live)('live: the test script', () => {
  beforeAll(async () => {
    const { data, error } = await db.rpc('union_engine_snapshot');
    if (error) throw error;
    setEngineSnapshot(data as unknown as EngineSnapshot);
    setRateLineLoader(async ids => {
      const { data, error } = await db.rpc('rate_schedule_lines', { p_schedule_ids: ids });
      if (error) throw error;
      return data as unknown as Record<string, RateLine[]>;
    });
  });

  it('Scene 1: normal day at scale', async () => {
    const p = await price(crew({ hoursPerDay: 11, mealBreakMinutes: 30 }));
    expect(p.rate).toBe(48.6);
    expect(p.status).toBe('at');
    expect(p.pay).toMatchObject({ workedHours: 10.5, gross: 571.05 });
    expect(p.pay!.bands.map(b => [b.label, b.hours, b.amount])).toEqual([['Straight time', 8, 388.8], ['1.5x', 2.5, 182.25]]);
  });

  it('Scene 2: under scale', async () => {
    const p = await price(crew({ hoursPerDay: 11, mealBreakMinutes: 30, hourlyRate: 40 }));
    expect(p.status).toBe('below');
    expect(p.pay!.gross).toBe(470);
  });

  it('Scene 3: minimum call', async () => {
    const p = await price(crew({ hoursPerDay: 5, mealBreakMinutes: 0 }));
    expect(p.pay).toMatchObject({ workedHours: 5, minimumTopUp: 145.8, gross: 388.8 });
  });

  it('Scene 4: long night', async () => {
    const p = await price(crew({ hoursPerDay: 16, mealBreakMinutes: 60 }));
    expect(p.pay).toMatchObject({ workedHours: 15, overtimeHours: 7, gross: 972 });
    expect(p.pay!.bands.map(b => b.amount)).toEqual([388.8, 291.6, 291.6]);
  });

  it('Scene 5: ACTRA daily fee', async () => {
    const p = await price({ isUnion: true, unionId: 'u-actra', role: 'Actor', department: findRoleDepartment('Actor'),
      ratePosition: '(a) Principal Actor, etc.', date: '2026-10-08', hoursPerDay: 8, mealBreakMinutes: 60 });
    expect(p.productionTypes).toEqual([null]);
    expect(p.rate).toBe(121.25);
    expect(p.status).toBe('at');
    expect(p.pay).toMatchObject({ workedHours: 7, minimumTopUp: 124, gross: 972.75 });
  });

  it('Scene 6: non-union day', async () => {
    const p = await price({ isUnion: false, role: 'Background Performer', date: '2026-10-10', hoursPerDay: 10, mealBreakMinutes: 30, hourlyRate: 22 });
    expect(p.status).toBe('unknown');
    expect(p.pay).toMatchObject({ workedHours: 9.5, overtimeHours: 0, gross: 209 });
  });

  it('Scene 8: template import, then duplicates', async () => {
    const [header, ...lines] = TEMPLATE_CSV.trim().split('\n').map(l => l.split(','));
    const rows = lines.map(l => Object.fromEntries(header.map((h, i) => [h, l[i] ?? ''])));
    const mapping = guessMapping(header);
    const first = await buildImport(rows, mapping, { userId: 'tester', defaultProvince: 'Ontario', existing: [] });
    expect(first.errors).toEqual([]);
    expect(first.totals).toMatchObject({ rows: 2, hours: 69.5, gross: 3611 });
    expect(first.jobs[0]).toMatchObject({ hourlyRate: 48.6, totalHours: 60, grossEarnings: 3402 });
    const again = await buildImport(rows, mapping, { userId: 'tester', defaultProvince: 'Ontario', existing: first.jobs });
    expect(again.duplicates).toBe(2);
    expect(again.jobs).toHaveLength(0);
  });
});

describe.skipIf(!live)('live: privacy for a signed-out visitor', () => {
  it.each(['jobs', 'profiles', 'finance_transactions', 'residency_documents', 'union_tracking',
           'agency_invites', 'user_sessions', 'sync_queue'])('cannot read %s', async table => {
    const { data, error } = await db.from(table).select('*').limit(5);
    if (error) expect(error.code).toBe('42501');   // closed to visitors outright
    else expect(data).toEqual([]);                // or row security hides every row
  });

  it('cannot add a job', async () => {
    const { error } = await db.from('jobs').insert({ user_id: '00000000-0000-0000-0000-000000000000', production_name: 'X', role: 'Grip', start_date: '2026-10-15' });
    expect(error).not.toBeNull();
  });

  it('cannot change union rates', async () => {
    const { error } = await db.from('pay_rules').update({ minimum_call_hours: 1 }).eq('id', 'iatse-873');
    const { data } = await db.from('pay_rules').select('minimum_call_hours').eq('id', 'iatse-873').single();
    expect(error !== null || Number(data?.minimum_call_hours) === 8).toBe(true);
    expect(Number(data?.minimum_call_hours)).toBe(8);
  });
});
