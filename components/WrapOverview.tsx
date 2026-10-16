import React from 'react';
import { ArrowUpRight, Clapperboard, Clock, FileText, Hourglass } from 'lucide-react';
import { getDeadlines, getUnionSpec, nextOccurrence, trackProgress, workedDays } from '../services/engine';
import type { Job, UserUnionTracking } from '../types';

// The rest of Your Wrap (same as ios/CineArch/Views/WrapOverview.swift):
// your year on set as a timeline, income building through the year, and
// what's coming up. Charts are plain SVG, square-cornered.

const DAY = 86_400_000;
const parse = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const money = (n: number) => n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
const monthLabel = (d: Date) => d.toLocaleString('en-CA', { month: 'short' });

const Panel = ({ title, children, footer }: { title: string; children: React.ReactNode; footer?: string }) => (
  <section className="glass-ui p-6 md:p-10 space-y-6">
    <h3 className="font-serif italic text-2xl md:text-4xl text-white">{title}</h3>
    {children}
    {footer && <p className="text-xs text-white/40 italic">{footer}</p>}
  </section>
);

export const JobTimeline = ({ jobs }: { jobs: Job[] }) => {
  const from = new Date(); from.setMonth(from.getMonth() - 12);
  const bars = jobs.map(j => {
    const start = parse(j.startDate);
    const last = j.endDate ? parse(j.endDate) : new Date(start.getTime() + (workedDays(j) - 1) * DAY);
    return { id: j.id, name: j.productionName, start, end: new Date(last.getTime() + DAY), pencilled: j.status === 'TENTATIVE' };
  }).filter(b => b.end >= from).sort((a, b) => +a.start - +b.start);

  if (bars.length === 0) return <Panel title="Your Year on Set"><p className="text-sm text-white/40 italic">Nothing in the can yet. Mark the slate and your jobs line up here.</p></Panel>;

  const names = [...new Set(bars.map(b => b.name))];
  const min = Math.min(...bars.map(b => +b.start)), max = Math.max(...bars.map(b => +b.end));
  const W = 1000, label = 0, rowH = 44, top = 8, H = top + names.length * rowH + 28;
  const x = (t: number) => label + ((t - min) / Math.max(DAY, max - min)) * (W - label);
  const ticks: Date[] = []; for (let d = new Date(new Date(min).getFullYear(), new Date(min).getMonth() + 1, 1); +d <= max; d.setMonth(d.getMonth() + 2)) ticks.push(new Date(d));

  return (
    <Panel title="Your Year on Set">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Timeline of ${bars.length} jobs`}>
        {ticks.map(t => <g key={+t}><line x1={x(+t)} x2={x(+t)} y1={top} y2={H - 24} stroke="rgba(255,255,255,0.08)" /><text x={x(+t)} y={H - 6} fill="rgba(255,255,255,0.4)" fontSize="16" textAnchor="middle">{monthLabel(t)}</text></g>)}
        {names.map((n, i) => (
          <g key={n}>
            <text x={0} y={top + i * rowH + 14} fill="rgba(255,255,255,0.7)" fontSize="15">{n}</text>
            {bars.filter(b => b.name === n).map(b => (
              <rect key={b.id} x={x(+b.start)} y={top + i * rowH + 20} width={Math.max(4, x(+b.end) - x(+b.start))} height={14}
                fill={b.pencilled ? 'rgba(255,255,255,0.25)' : 'var(--accent)'}><title>{`${b.name}${b.pencilled ? ' (pencilled in)' : ''}`}</title></rect>
            ))}
          </g>
        ))}
      </svg>
      <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-white/40">
        <span className="flex items-center gap-2"><span className="w-3 h-3 bg-accent inline-block" /> Worked</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 bg-white/25 inline-block" /> Pencilled in</span>
      </div>
    </Panel>
  );
};

export const IncomeChart = ({ jobs, showGSTLine, goal }: { jobs: Job[]; showGSTLine: boolean; goal?: number }) => {
  const now = new Date(), year = now.getFullYear();
  const byMonth = new Array(12).fill(0);
  for (const j of jobs) {
    if (j.status === 'TENTATIVE') continue;
    const d = parse(j.startDate);
    if (d.getFullYear() === year) byMonth[d.getMonth()] += j.grossEarnings || 0;
  }
  let run = 0;
  const pts = byMonth.slice(0, now.getMonth() + 1).map((v, m) => ({ m, total: (run += v) }));
  const total = run;
  const top = Math.max(showGSTLine ? 32_000 : 0, goal ? goal * 1.08 : 0, total * 1.15, 1000);
  const W = 1000, H = 260, padL = 56, padB = 28;
  const x = (m: number) => padL + (m / 11) * (W - padL - 10);
  const y = (v: number) => (H - padB) - (v / top) * (H - padB - 10);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.m)},${y(i === 0 ? 0 : pts[i - 1].total)} L${x(p.m)},${y(p.total)}`).join(' ');
  const yTicks = [0, top / 3, (2 * top) / 3].map(v => Math.round(v / 1000) * 1000);

  return (
    <Panel title="Income This Year" footer="From the pay on your Slate, by the month each job started.">
      <p><span className="font-serif italic text-4xl text-white">{money(total)}</span> <span className="text-xs text-white/40 italic">so far this year{goal ? ` · ${Math.round((total / goal) * 100)}% of your ${money(goal)} goal` : ''}</span></p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Income this year: ${money(total)}`}>
        {yTicks.map(v => <g key={v}><line x1={padL} x2={W} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.08)" /><text x={padL - 8} y={y(v) + 5} fill="rgba(255,255,255,0.4)" fontSize="15" textAnchor="end">{v >= 1000 ? `$${v / 1000}k` : `$${v}`}</text></g>)}
        {[0, 2, 4, 6, 8, 10].map(m => <text key={m} x={x(m)} y={H - 6} fill="rgba(255,255,255,0.4)" fontSize="15" textAnchor="middle">{monthLabel(new Date(year, m, 1))}</text>)}
        {goal ? <g><line x1={padL} x2={W} y1={y(goal)} y2={y(goal)} stroke="var(--accent)" strokeOpacity="0.6" strokeDasharray="2 6" /><text x={W - 6} y={y(goal) - 8} fill="var(--accent)" fontSize="15" textAnchor="end">Your goal {money(goal)}</text></g> : null}
        {showGSTLine && <g><line x1={padL} x2={W} y1={y(30_000)} y2={y(30_000)} stroke="#f87171" strokeDasharray="6 5" /><text x={padL + 6} y={y(30_000) - 8} fill="#f87171" fontSize="15">$30k GST/HST line</text></g>}
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="3" />
        {pts.map(p => <rect key={p.m} x={x(p.m) - 4} y={y(p.total) - 4} width="8" height="8" fill="var(--accent)" />)}
      </svg>
    </Panel>
  );
};

export const ComingUp = ({ jobs, tracks }: { jobs: Job[]; tracks: UserUnionTracking[] }) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const horizon = new Date(+today + 120 * DAY);
  type Item = { id: string; date: Date; title: string; detail?: string; source?: string; icon: React.ReactNode };
  const items: Item[] = [];
  for (const d of getDeadlines()) {
    if (d.appliesTo === 'union_member') continue;
    const when = nextOccurrence(d, today);
    if (when > horizon) continue;
    const who = d.appliesTo === 'instalments' ? 'If you pay by instalments. ' : d.appliesTo === 'gst_registered' ? "If you're registered for GST/HST. " : '';
    items.push({ id: d.id, date: when, title: d.title, detail: who + (d.detail ?? ''), source: d.sourceUrl, icon: <FileText size={14} /> });
  }
  for (const j of jobs) {
    const s = parse(j.startDate);
    if (j.status === 'TENTATIVE' && s >= today && s <= horizon)
      items.push({ id: `job-${j.id}`, date: s, title: `${j.productionName} starts (pencilled in)`, detail: "Mark the slate once it's confirmed.", icon: <Clapperboard size={14} /> });
  }
  for (const t of tracks) {
    const tier = getUnionSpec(t.unionTypeId)?.tiers.find(x => x.name === t.tierLabel);
    if (!tier?.windowMonths) continue;
    const since = new Date(today); since.setMonth(since.getMonth() - tier.windowMonths);
    const days = jobs.filter(j => j.status !== 'TENTATIVE' && j.isUnion && j.unionTypeId === t.unionTypeId).map(j => parse(j.startDate)).filter(d => d >= since);
    if (days.length === 0 || trackProgress(t, jobs).current === 0) continue;
    const drop = new Date(Math.min(...days.map(Number))); drop.setMonth(drop.getMonth() + tier.windowMonths);
    if (drop <= horizon)
      items.push({ id: `window-${t.id}`, date: drop, title: `A ${t.unionName} day drops out of your ${tier.windowMonths}-month window`, detail: `Days older than ${tier.windowMonths} months stop counting toward ${t.tierLabel}.`, icon: <Hourglass size={14} /> });
  }
  items.sort((a, b) => +a.date - +b.date);

  return (
    <Panel title="Coming Up" footer="Tax dates link to the page they come from.">
      {items.length === 0 && <p className="text-sm text-white/40 italic">Nothing in the next 120 days.</p>}
      <ul className="space-y-4">
        {items.map(it => {
          const body = (
            <div className="flex gap-4 items-start">
              <div className="w-14 shrink-0 text-center bg-accent/15 text-accent py-1">
                <div className="text-[10px] font-black uppercase">{monthLabel(it.date)}</div>
                <div className="font-serif italic text-2xl leading-none">{it.date.getDate()}</div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-white flex items-center gap-2">{it.icon} {it.title}</p>
                {it.detail && <p className="text-xs text-white/50">{it.detail}</p>}
                {it.source && <p className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-1">Source: {new URL(it.source).hostname.replace('www.', '')} <ArrowUpRight size={10} /></p>}
              </div>
            </div>
          );
          return <li key={it.id}>{it.source ? <a href={it.source} target="_blank" rel="noreferrer" className="block hover:bg-white/5">{body}</a> : body}</li>;
        })}
      </ul>
      <p className="text-xs text-white/40 flex items-center gap-2"><Clock size={12} /> Union dues and renewal dates aren't loaded yet.</p>
    </Panel>
  );
};
