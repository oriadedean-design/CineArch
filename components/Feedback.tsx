import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { Tables } from '../services/database.types';
import { Button, Card, Select } from './ui';

// Feedback to the developers (public.feedback). Same as Account > Send
// feedback on the phone: a kind, the screen it's about, the note, and the
// sender's past notes with whether the team has read them. 10 a day.

type Note = Tables<'feedback'>;
const KINDS = [['problem', "Something's wrong"], ['idea', 'An idea'], ['praise', 'Something I like']] as const;
const SCREENS = ['Anywhere', 'Your Wrap', 'Your Slate', 'Your Wallet', 'Your Ledger', 'Your Config', 'Union guide', 'Signing in'];
const LIMIT = 2000;
const PLACEHOLDER: Record<string, string> = {
  problem: 'What happened, and what did you expect?',
  idea: 'What would make CineArch more useful on set?',
  praise: "What's working well for you?",
};
const STATUS: Record<string, string> = { new: 'Sent', read: 'Read by the team', done: 'Done' };

export const Feedback = ({ roster = false }: { roster?: boolean }) => {
  const [kind, setKind] = useState('problem');
  const [screen, setScreen] = useState('Anywhere');
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setNotes(data ?? []));
  }, []);

  const text = message.trim();
  const screens = roster ? SCREENS.map(s => s === 'Your Slate' ? 'Your Roster' : s) : SCREENS;

  const send = async () => {
    if (!text || sending) return;
    setSending(true); setError('');
    const { data, error } = await supabase.from('feedback')
      .insert({ kind, message: text, screen: screen === 'Anywhere' ? null : screen, platform: 'web' })
      .select().single();
    setSending(false);
    if (error) {
      setError(error.message.includes('FEEDBACK_LIMIT')
        ? "That's 10 notes today. Thank you! Send more tomorrow."
        : "Couldn't send. Check your connection and try again; your note is still here.");
      return;
    }
    setNotes([data, ...notes]); setMessage(''); setSent(true);
  };

  return (
    <Card className="p-8 space-y-6 border-white/10">
      <div>
        <h3 className="text-2xl font-serif italic text-white leading-none">Feedback to the developers</h3>
        <p className="text-xs text-white/50 mt-2">Something wrong, an idea, or something you like. Every note goes straight to the people building CineArch.</p>
      </div>

      <div role="radiogroup" aria-label="What's it about?" className="flex flex-wrap gap-2">
        {KINDS.map(([k, label]) => (
          <button key={k} role="radio" aria-checked={kind === k} onClick={() => { setKind(k); setSent(false); }}
            className={`h-12 px-5 border text-xs font-black uppercase tracking-widest transition-colors ${kind === k ? 'border-accent bg-accent text-black' : 'border-white/20 text-white hover:border-white'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label htmlFor="feedback-screen" className="text-xs font-black uppercase tracking-[0.4em] text-white">Where in the app</label>
        <Select id="feedback-screen" value={screen} onChange={e => setScreen(e.target.value)} className="h-12">
          {screens.map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="feedback-note" className="text-xs font-black uppercase tracking-[0.4em] text-white">Your note</label>
        <textarea id="feedback-note" rows={5} maxLength={LIMIT} value={message} placeholder={PLACEHOLDER[kind]}
          onChange={e => { setMessage(e.target.value); setSent(false); }}
          className="w-full bg-transparent border border-white/20 focus:border-accent outline-none p-4 text-white placeholder:text-white/30" />
        <p className="text-xs text-white/50">{message.length} of {LIMIT} characters. It goes to the CineArch team with your account email, so we can reply. Up to 10 notes a day.</p>
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={send} disabled={!text || sending} className="h-12 px-8 text-[10px]">
          {sending ? 'Sending…' : 'Send to the team'}
        </Button>
        {sent && <p className="text-sm text-accent" role="status">Sent. Thank you.</p>}
      </div>
      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}

      {notes.length > 0 && (
        <div className="space-y-3 border-t border-white/10 pt-6">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-white/60">Your notes</p>
          {notes.map(n => (
            <div key={n.id} className="text-sm">
              <p className="text-white line-clamp-3">{n.message}</p>
              <p className="text-xs text-white/50">
                {[KINDS.find(([k]) => k === n.kind)?.[1], n.screen].filter(Boolean).join(' · ')}
                <span className={`ml-3 ${n.status === 'new' ? '' : 'text-accent'}`}>{STATUS[n.status] ?? 'Sent'}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
