import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../services/storage';
import { getAllUnions, findUnion, trackProgress } from '../services/engine';
import type { Job, UserUnionTracking } from '../types';
import { Button, Card, Input, ProgressBar, Select } from './ui';

const fmt = (n: number) => n.toLocaleString('en-CA', { maximumFractionDigits: 1 });

// Your road to the union: the unions you're working toward, with progress,
// and a form to add one (with "already banked" and, where a tier asks for it,
// the date counting starts, e.g. AABP since).
export const UnionGoals = () => {
  const [tracks, setTracks] = useState<UserUnionTracking[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ unionId: '', tier: '', banked: '', since: '' });
  const [error, setError] = useState('');

  const refresh = async () => {
    const [t, j] = await Promise.all([api.tracking.get(), api.jobs.list()]);
    setTracks(t); setJobs(j);
  };
  useEffect(() => { refresh(); }, []);

  const unions = getAllUnions().filter(u => u.tiers.length > 0);
  const union = findUnion(form.unionId);
  const tier = union?.tiers.find(t => t.name === form.tier) ?? union?.tiers[0];

  const save = async () => {
    if (!union || !tier) return;
    setError('');
    try {
      await api.tracking.save([{
        id: '', userId: '', unionTypeId: union.id, unionName: union.name, tierLabel: tier.name,
        targetType: tier.targetType, targetValue: tier.targetValue,
        startingValue: Number(form.banked) || 0,
        countsFrom: tier.startLabel && form.since ? form.since : undefined,
      }]);
      setAdding(false); setForm({ unionId: '', tier: '', banked: '', since: '' });
      refresh();
    } catch (e: any) { setError(e.message); }
  };

  const remove = async (t: UserUnionTracking) => {
    if (!confirm(`Stop tracking ${t.unionName}?`)) return;
    await api.tracking.remove(t.unionTypeId);
    refresh();
  };

  return (
    <Card className="p-8 space-y-8 border-white/10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-serif italic text-white leading-none">Your Road to the Union</h3>
          <p className="text-xs text-white/40 italic mt-2">Days on a union set count before you're a member.</p>
        </div>
        {!adding && <Button variant="outline" onClick={() => setAdding(true)} className="h-12 px-6 text-[10px] flex items-center"><Plus size={14} className="mr-2" /> Track a union</Button>}
      </div>

      {tracks.map(t => {
        const p = trackProgress(t, jobs);
        return (
          <div key={t.id} className="space-y-3">
            <div className="flex justify-between items-end gap-4">
              <div>
                <p className="text-xl font-serif italic text-white leading-none">{t.unionName} // {t.tierLabel}</p>
                <p className="text-xs text-white/40 mt-2">
                  {fmt(p.current)} of {fmt(p.target)} {t.targetType.toLowerCase()}
                  {t.countsFrom && ` · counting from ${t.countsFrom}`}
                  {p.remaining > 0 ? ` · ${fmt(p.remaining)} to go` : ' · ready to apply!'}
                </p>
              </div>
              <button onClick={() => remove(t)} className="text-white/30 hover:text-red-400" aria-label={`Stop tracking ${t.unionName}`}><Trash2 size={16} /></button>
            </div>
            <ProgressBar progress={p.percent} />
          </div>
        );
      })}
      {tracks.length === 0 && !adding && <p className="text-sm text-white/40 italic">Nothing in the can yet. Track a union to start counting your days.</p>}

      {adding && (
        <div className="space-y-6 border-t border-white/10 pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.3em] text-white">Union</label>
              <Select value={form.unionId} onChange={e => setForm({ ...form, unionId: e.target.value, tier: '' })} className="h-14">
                <option value="" className="bg-black">Choose a union</option>
                {unions.map(u => <option key={u.id} value={u.id} className="bg-black">{u.name}</option>)}
              </Select>
            </div>
            {union && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.3em] text-white">Aiming for</label>
                <Select value={tier?.name ?? ''} onChange={e => setForm({ ...form, tier: e.target.value })} className="h-14">
                  {union.tiers.map(t => <option key={t.name} value={t.name} className="bg-black">{t.province ? `${t.name} · ${t.province}` : t.name}</option>)}
                </Select>
              </div>
            )}
          </div>
          {tier && (
            <>
              <p className="text-xs text-white/50 italic">{tier.description}</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.3em] text-white">Already banked ({tier.targetType.toLowerCase()})</label>
                  <Input type="number" min={0} inputMode="decimal" value={form.banked} onChange={e => setForm({ ...form, banked: e.target.value })} placeholder="0" className="h-14" />
                </div>
                {tier.startLabel && (
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-[0.3em] text-white">{tier.startLabel}</label>
                    <Input type="date" value={form.since} onChange={e => setForm({ ...form, since: e.target.value })} className="h-14" />
                  </div>
                )}
              </div>
              {tier.startLabel && <p className="text-xs text-white/40 italic">Only work on or after this date counts. Joined before October 31, 2012? Up to 800 earlier hours count too.</p>}
            </>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-4">
            <Button onClick={save} disabled={!tier} className="h-12 px-8 text-[10px]">Track it</Button>
            <button onClick={() => setAdding(false)} className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white">Cancel</button>
          </div>
        </div>
      )}
    </Card>
  );
};
