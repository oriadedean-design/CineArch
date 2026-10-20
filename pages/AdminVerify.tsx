import React, { useEffect, useMemo, useState } from 'react';
import { FeedbackInbox } from '../components/FeedbackInbox';
import { CheckCircle2, Flag, ExternalLink } from 'lucide-react';
import { supabase } from '../services/supabase';
import { api } from '../services/storage';
import type { User } from '../types';

// Admins only (profiles.is_admin, set in the database): every union, pay and
// tax fact the app relies on, with its source and when it was last checked.
// "Verified" stamps today's date on the fact; "Flag" records a note to follow
// up. Every check is kept in fact_checks.

type Subject = 'union' | 'tier' | 'pay_rule' | 'rate_schedule' | 'tax' | 'pension' | 'sales_tax' | 'deadline';

interface Fact {
  subject: Subject;
  key: string;
  group: string;         // shown as the section
  title: string;
  value: string;         // the figure being checked
  source?: string | null;
  checked?: string | null;
  confirmed: boolean;    // has a published source
  ends?: string | null;  // rate cards: when they stop applying
  todo?: string[];       // what's still unconfirmed
}

interface Check { subject: string; subject_key: string; outcome: string; note: string | null; checked_at: string }

const today = new Date().toISOString().slice(0, 10);
const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
const soon = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
const money = (n: number | null) => n == null ? '—' : `$${Number(n).toLocaleString('en-CA')}`;
const pct = (n: number | null) => n == null ? '—' : `${(Number(n) * 100).toFixed(2).replace(/\.?0+$/, '')}%`;

type Status = 'unconfirmed' | 'ended' | 'stale' | 'ending' | 'ok';
const statusOf = (f: Fact): Status =>
  !f.confirmed || !f.source ? 'unconfirmed'
  : f.ends && f.ends < today ? 'ended'
  : !f.checked || f.checked < yearAgo ? 'stale'
  : f.ends && f.ends < soon ? 'ending'
  : 'ok';
const LABEL: Record<Status, string> = { unconfirmed: 'Not confirmed', ended: 'Ended', stale: 'Check again', ending: 'Ends soon', ok: 'Checked' };
const COLOR: Record<Status, string> = { unconfirmed: 'text-red-400', ended: 'text-red-400', stale: 'text-yellow-400', ending: 'text-yellow-400', ok: 'text-green-400' };

export const AdminVerify = () => {
  const [user, setUser] = useState<User | null>(null);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [show, setShow] = useState<'attention' | 'all'>('attention');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    const [u, tiers, rules, cards, tax, plans, sales, dates, log] = await Promise.all([
      supabase.from('unions').select('id,name,application_fee,dues_rate,needs_verification,source_urls,last_verified').eq('is_active', true).order('sort_order'),
      supabase.from('union_tiers').select('union_id,name,target_type,target_value,description,source_url,checked_on,confirmed'),
      supabase.from('pay_rules').select('id,title,source_url,checked_on,needs_verification,overtime_after,overtime_multipliers'),
      supabase.from('rate_schedules').select('id,title,source_url,checked_on,effective_from,effective_to'),
      supabase.from('tax_jurisdictions').select('year,code,province,basic_amount,source_url,checked_on,needs_verification'),
      supabase.from('pension_plans').select('year,code,ympe,yampe,source_url,checked_on'),
      supabase.from('sales_tax').select('year,province,gst_hst_rate,quick_service_rate,source_url,checked_on'),
      supabase.from('deadlines').select('id,title,month,day,source_url,checked_on'),
      supabase.from('fact_checks').select('subject,subject_key,outcome,note,checked_at').order('checked_at', { ascending: false }).limit(500),
    ]);
    const err = [u, tiers, rules, cards, tax, plans, sales, dates, log].find(r => r.error)?.error;
    if (err) { setError(err.message); return; }
    const name = new Map((u.data ?? []).map((x: any) => [x.id, x.name]));
    const all: Fact[] = [
      ...(u.data ?? []).map((x: any): Fact => ({ subject: 'union', key: x.id, group: 'Unions: fees and dues', title: x.name,
        value: `Joining ${money(x.application_fee)} · dues ${pct(x.dues_rate)}`, source: x.source_urls?.[0], checked: x.last_verified,
        confirmed: (x.source_urls ?? []).length > 0, todo: x.needs_verification })),
      ...(tiers.data ?? []).map((x: any): Fact => ({ subject: 'tier', key: `${x.union_id}|${x.name}`, group: 'Union steps',
        title: `${name.get(x.union_id) ?? x.union_id} · ${x.name}`, value: `${Number(x.target_value).toLocaleString('en-CA')} ${x.target_type.toLowerCase()}`,
        source: x.source_url, checked: x.checked_on, confirmed: x.confirmed })),
      ...(rules.data ?? []).map((x: any): Fact => ({ subject: 'pay_rule', key: x.id, group: 'Pay rules', title: x.title,
        value: x.overtime_after.map((h: number, i: number) => `${x.overtime_multipliers[i]}x after ${h}h`).join(', '),
        source: x.source_url, checked: x.checked_on, confirmed: !!x.source_url, todo: x.needs_verification })),
      ...(cards.data ?? []).map((x: any): Fact => ({ subject: 'rate_schedule', key: x.id, group: 'Rate cards', title: x.title,
        value: `${x.effective_from} to ${x.effective_to ?? 'open'}`, source: x.source_url, checked: x.checked_on,
        confirmed: !!x.source_url, ends: x.effective_to })),
      ...(tax.data ?? []).map((x: any): Fact => ({ subject: 'tax', key: `${x.year}|${x.code}`, group: 'Income tax',
        title: `${x.year} ${x.province ?? 'Federal'}`, value: `Basic personal amount ${money(x.basic_amount)}`, source: x.source_url,
        checked: x.checked_on, confirmed: (x.needs_verification ?? []).length === 0, todo: x.needs_verification })),
      ...(plans.data ?? []).map((x: any): Fact => ({ subject: 'pension', key: `${x.year}|${x.code}`, group: 'CPP and QPP',
        title: `${x.year} ${x.code}`, value: `Ceilings ${money(x.ympe)} and ${money(x.yampe)}`, source: x.source_url, checked: x.checked_on, confirmed: true })),
      ...(sales.data ?? []).map((x: any): Fact => ({ subject: 'sales_tax', key: `${x.year}|${x.province}`, group: 'GST/HST',
        title: `${x.year} ${x.province}`, value: `${pct(x.gst_hst_rate)} · Quick Method ${pct(x.quick_service_rate)}`, source: x.source_url,
        checked: x.checked_on, confirmed: true })),
      ...(dates.data ?? []).map((x: any): Fact => ({ subject: 'deadline', key: x.id, group: 'Dates', title: x.title,
        value: new Date(2026, x.month - 1, x.day).toLocaleDateString('en-CA', { month: 'long', day: 'numeric' }),
        source: x.source_url, checked: x.checked_on, confirmed: true })),
    ];
    setFacts(all);
    setChecks((log.data ?? []) as Check[]);
  };

  useEffect(() => { api.auth.getUser().then(setUser); load(); }, []);

  const lastCheck = useMemo(() => {
    const m = new Map<string, Check>();
    for (const c of checks) if (!m.has(`${c.subject}:${c.subject_key}`)) m.set(`${c.subject}:${c.subject_key}`, c);
    return m;
  }, [checks]);

  const act = async (f: Fact, outcome: 'verified' | 'flagged') => {
    const note = outcome === 'flagged' ? window.prompt(`What needs checking on "${f.title}"?`) : null;
    if (outcome === 'flagged' && !note) return;
    setBusy(`${f.subject}:${f.key}`); setError('');
    const { error } = await supabase.rpc('check_fact', { p_subject: f.subject, p_key: f.key, p_outcome: outcome, p_note: note ?? undefined });
    setBusy(null);
    if (error) setError(error.message); else load();
  };

  if (user && !user.isAdmin) return <p className="p-12 text-white/60">This page is for CineArch admins.</p>;

  const shown = facts.filter(f => show === 'all' || statusOf(f) !== 'ok' || lastCheck.get(`${f.subject}:${f.key}`)?.outcome === 'flagged');
  const groups = [...new Set(shown.map(f => f.group))];
  const counts = facts.reduce((m, f) => ({ ...m, [statusOf(f)]: (m[statusOf(f)] ?? 0) + 1 }), {} as Record<string, number>);

  return (
    <div className="space-y-10 pb-24">
      <div className="space-y-3">
        <h1 className="text-5xl font-serif italic text-white">Verify the facts</h1>
        <p className="text-white/60 max-w-2xl">Every union, pay and tax figure the app uses. Open the source, check the figure matches, then mark it verified. Flag anything that's wrong with a note.</p>
        <p className="text-sm text-white/50">
          {(['unconfirmed', 'ended', 'stale', 'ending', 'ok'] as Status[]).map(s => <span key={s} className={`mr-4 ${COLOR[s]}`}>{counts[s] ?? 0} {LABEL[s].toLowerCase()}</span>)}
        </p>
        <div className="flex gap-2">
          {(['attention', 'all'] as const).map(s => (
            <button key={s} onClick={() => setShow(s)} className={`px-4 py-2 text-sm ${show === s ? 'bg-accent text-black font-bold' : 'bg-white/10 text-white'}`}>
              {s === 'attention' ? 'Needs attention' : 'Everything'}
            </button>
          ))}
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      {user?.isAdmin && <FeedbackInbox />}

      {groups.map(g => (
        <section key={g} className="space-y-2">
          <h2 className="text-2xl font-serif italic text-white">{g}</h2>
          <div className="divide-y divide-white/10 border border-white/10">
            {shown.filter(f => f.group === g).map(f => {
              const st = statusOf(f), last = lastCheck.get(`${f.subject}:${f.key}`), id = `${f.subject}:${f.key}`;
              return (
                <div key={id} className="p-4 grid md:grid-cols-[1fr_auto] gap-3 items-start">
                  <div className="space-y-1 min-w-0">
                    <p className="text-white font-bold">{f.title}</p>
                    <p className="text-white/70 text-sm">{f.value}</p>
                    <p className="text-xs">
                      <span className={COLOR[st]}>{LABEL[st]}</span>
                      <span className="text-white/40">{f.checked ? ` · checked ${f.checked}` : ' · never checked'}</span>
                      {f.source && <a href={f.source} target="_blank" rel="noreferrer" className="ml-3 text-white/60 underline inline-flex items-center gap-1">Source <ExternalLink size={11} /></a>}
                    </p>
                    {f.todo && f.todo.length > 0 && <p className="text-xs text-yellow-400">To confirm: {f.todo.join(', ')}</p>}
                    {last?.outcome === 'flagged' && <p className="text-xs text-red-400">Flagged {last.checked_at.slice(0, 10)}: {last.note}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button disabled={busy === id || !f.source} onClick={() => act(f, 'verified')} title={f.source ? 'Matches the source' : 'Add a source first'}
                      className="px-3 py-2 text-xs bg-green-500/20 text-green-300 disabled:opacity-30 inline-flex items-center gap-1"><CheckCircle2 size={14} /> Verified</button>
                    <button disabled={busy === id} onClick={() => act(f, 'flagged')}
                      className="px-3 py-2 text-xs bg-red-500/20 text-red-300 disabled:opacity-30 inline-flex items-center gap-1"><Flag size={14} /> Flag</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {shown.length === 0 && facts.length > 0 && <p className="text-green-400">Everything is checked and current.</p>}
    </div>
  );
};
