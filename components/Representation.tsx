import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import type { Tables } from '../services/database.types';
import { Button, Card, Input, Select } from './ui';

// Industry representation: the agents and managers someone works with and the
// commission each takes (public.representatives). Same as Account > Your
// representation on the phone.

type Rep = Tables<'representatives'>;
const blank = { name: '', agency: '', kind: 'agent', pct: '', applies: 'booked' };

export const Representation = () => {
  const [reps, setReps] = useState<Rep[]>([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);   // a rep id, or 'new'
  const [error, setError] = useState('');

  const load = async () => {
    const { data, error } = await supabase.from('representatives').select('*').order('created_at');
    if (error) setError(error.message); else setReps(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const pct = Number(form.pct);
  const valid = form.name.trim() !== '' && form.pct !== '' && pct >= 0 && pct <= 50;

  const save = async () => {
    if (!valid) return;
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const row = { user_id: user.id, name: form.name.trim().slice(0, 120), agency: form.agency.trim().slice(0, 120) || null,
                  kind: form.kind, commission_pct: pct, applies_to: form.applies };
    const { error } = editing && editing !== 'new'
      ? await supabase.from('representatives').update(row).eq('id', editing)
      : await supabase.from('representatives').insert(row);
    if (error) { setError(error.message); return; }
    setEditing(null); setForm(blank); load();
  };

  const remove = async (r: Rep) => {
    if (!confirm(`Remove ${r.name}?`)) return;
    const { error } = await supabase.from('representatives').delete().eq('id', r.id);
    if (error) setError(error.message); else load();
  };

  const edit = (r: Rep) => {
    setEditing(r.id);
    setForm({ name: r.name, agency: r.agency ?? '', kind: r.kind, pct: String(r.commission_pct), applies: r.applies_to });
  };

  return (
    <Card className="p-8 space-y-6 border-white/10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-serif italic text-white leading-none">Industry representation</h3>
          <p className="text-xs text-white/50 mt-2">Your agents and managers, and the commission each takes from your gross pay.</p>
        </div>
        {!editing && <Button variant="outline" onClick={() => { setForm(blank); setEditing('new'); }} className="h-12 px-6 text-[10px] flex items-center"><Plus size={14} className="mr-2" /> Add</Button>}
      </div>

      {reps.map(r => (
        <div key={r.id} className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
          <button onClick={() => edit(r)} className="text-left">
            <p className="text-white font-bold">{r.name} <span className="text-accent font-serif italic ml-2">{Number(r.commission_pct)}%</span></p>
            <p className="text-xs text-white/50">
              {[r.kind === 'manager' ? 'Manager' : r.kind === 'other' ? 'Representative' : 'Agent', r.agency, r.applies_to === 'all' ? 'every job' : 'jobs they book'].filter(Boolean).join(' · ')}
            </p>
          </button>
          <button onClick={() => remove(r)} className="text-white/30 hover:text-red-400" aria-label={`Remove ${r.name}`}><Trash2 size={16} /></button>
        </div>
      ))}
      {reps.length === 0 && !editing && <p className="text-sm text-white/40 italic">No one added yet.</p>}

      {editing && (
        <div className="space-y-4 border-t border-white/10 pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Input aria-label="Name" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-12" />
            <Input aria-label="Agency" placeholder="Agency (optional)" value={form.agency} onChange={e => setForm({ ...form, agency: e.target.value })} className="h-12" />
            <Select aria-label="Role" value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })} className="h-12">
              <option value="agent" className="bg-black">Agent</option>
              <option value="manager" className="bg-black">Manager</option>
              <option value="other" className="bg-black">Other</option>
            </Select>
            <Input aria-label="Commission (%)" placeholder="Commission %" type="number" min={0} max={50} step={0.5} inputMode="decimal"
              value={form.pct} onChange={e => setForm({ ...form, pct: e.target.value })} className="h-12" />
            <Select aria-label="Takes it from" value={form.applies} onChange={e => setForm({ ...form, applies: e.target.value })} className="h-12 md:col-span-2">
              <option value="booked" className="bg-black">Takes it from jobs they book</option>
              <option value="all" className="bg-black">Takes it from every job</option>
            </Select>
          </div>
          {form.pct !== '' && !(pct >= 0 && pct <= 50) && <p className="text-xs text-red-400">Enter a percentage from 0 to 50.</p>}
          <div className="flex gap-4">
            <Button onClick={save} disabled={!valid} className="h-12 px-8 text-[10px]">Save</Button>
            <button onClick={() => { setEditing(null); setForm(blank); }} className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white">Cancel</button>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </Card>
  );
};
