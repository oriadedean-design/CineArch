import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { api } from '../services/storage';
import { notesFor, type Note } from '../services/notes';
import type { Job } from '../types';

// Notes from set: the bell in the header. The number is how many notes are
// waiting; each note says why it's here and has the button that acts on it.
// Dismissed notes are remembered on this device.
const KEY = 'cinearch.dismissedNotes';
const loadDismissed = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };

export const NotesBell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(loadDismissed);
  const [open, setOpen] = useState(false);

  const refresh = async () => {
    const [j, t] = await Promise.all([api.jobs.list(), api.tracking.get()]);
    setJobs(j); setNotes(notesFor({ jobs: j, tracks: t }));
  };
  useEffect(() => { refresh().catch(() => {}); }, [location.pathname]);

  const visible = notes.filter(n => !dismissed.includes(n.id));
  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try { localStorage.setItem(KEY, JSON.stringify(next.slice(-200))); } catch { /* private mode */ }
  };

  const act = async (n: Note) => {
    if (n.action.kind === 'link') { window.open(n.action.url, '_blank', 'noopener'); return; }
    if (n.action.kind === 'confirm-job') {
      const job = jobs.find(j => j.id === (n.action as { jobId: string }).jobId);
      if (job) await api.jobs.update({ ...job, status: 'CONFIRMED' });
      await refresh();
      return;
    }
    setOpen(false);
    navigate(n.action.to);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}
        aria-label={visible.length ? `Notes from set: ${visible.length} waiting` : 'Notes from set: none waiting'}
        className="relative w-11 h-11 flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 text-white">
        <Bell size={16} />
        {visible.length > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-accent text-black text-[10px] font-black flex items-center justify-center">{visible.length}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(92vw,380px)] bg-black border border-white/15 shadow-2xl z-[150]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Notes from set</span>
            <button onClick={() => setOpen(false)} aria-label="Close notes" className="text-white/40 hover:text-white"><X size={14} /></button>
          </div>
          {visible.length === 0 && <p className="px-5 py-6 text-sm text-white/40 italic">All quiet on set. Nothing needs you right now.</p>}
          <ul className="max-h-[60vh] overflow-y-auto divide-y divide-white/5">
            {visible.map(n => (
              <li key={n.id} className="px-5 py-4 space-y-2">
                <p className="text-sm text-white">{n.title}</p>
                <p className="text-xs text-white/50">{n.body}</p>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => act(n)} className="px-4 h-9 bg-accent text-black text-[10px] font-black uppercase tracking-widest">{n.actionLabel}</button>
                  <button onClick={() => dismiss(n.id)} className="px-4 h-9 border border-white/10 text-white/50 hover:text-white text-[10px] font-black uppercase tracking-widest">Dismiss</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
