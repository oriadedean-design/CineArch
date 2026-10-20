import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { Database } from '../services/database.types';

// Admins: the notes people send from Settings (admin_feedback()), newest
// first, with who sent them. Mark a note read or done; the sender sees it.

type Row = Database['public']['Functions']['admin_feedback']['Returns'][number];
const KIND: Record<string, string> = { problem: "Something's wrong", idea: 'Idea', praise: 'Something they like' };

export const FeedbackInbox = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [show, setShow] = useState<'open' | 'all'>('open');
  const [error, setError] = useState('');

  const load = async () => {
    const { data, error } = await supabase.rpc('admin_feedback');
    if (error) setError(error.message); else setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const mark = async (id: string, status: 'read' | 'done') => {
    const { error } = await supabase.from('feedback').update({ status }).eq('id', id);
    if (error) setError(error.message); else setRows(rows.map(r => r.id === id ? { ...r, status } : r));
  };

  const shown = rows.filter(r => show === 'all' || r.status !== 'done');
  const fresh = rows.filter(r => r.status === 'new').length;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-serif italic text-white">Feedback <span className="text-accent">{fresh} new</span></h2>
        <div className="flex gap-2">
          {(['open', 'all'] as const).map(s => (
            <button key={s} onClick={() => setShow(s)} className={`px-4 py-2 text-sm ${show === s ? 'bg-accent text-black font-bold' : 'bg-white/10 text-white'}`}>
              {s === 'open' ? 'Not done' : 'Everything'}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="divide-y divide-white/10 border border-white/10">
        {shown.map(r => (
          <div key={r.id} className="p-4 grid md:grid-cols-[1fr_auto] gap-3 items-start">
            <div className="space-y-1 min-w-0">
              <p className="text-white whitespace-pre-wrap break-words">{r.message}</p>
              <p className="text-xs text-white/50">
                <span className={r.status === 'new' ? 'text-yellow-400' : 'text-white/50'}>{r.status === 'new' ? 'New' : r.status === 'read' ? 'Read' : 'Done'}</span>
                {' · '}{[KIND[r.kind] ?? r.kind, r.screen, r.platform === 'ios' ? `iPhone ${r.app_version ?? ''}`.trim() : 'Website', new Date(r.created_at).toLocaleString('en-CA')].filter(Boolean).join(' · ')}
              </p>
              <p className="text-xs text-white/60">{r.name || 'No name'} · <a className="underline" href={`mailto:${r.email}?subject=${encodeURIComponent('Your CineArch feedback')}`}>{r.email}</a></p>
            </div>
            <div className="flex gap-2">
              {r.status === 'new' && <button onClick={() => mark(r.id, 'read')} className="px-3 py-2 text-xs bg-white/10 text-white">Mark read</button>}
              {r.status !== 'done' && <button onClick={() => mark(r.id, 'done')} className="px-3 py-2 text-xs bg-green-500/20 text-green-300">Done</button>}
            </div>
          </div>
        ))}
        {shown.length === 0 && <p className="p-4 text-white/50 text-sm">No notes {show === 'open' ? 'waiting' : 'yet'}.</p>}
      </div>
    </section>
  );
};
