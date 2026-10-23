import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// The "Stop these tips" link in onboarding emails lands here. It asks before
// unsubscribing, so email scanners that open every link don't unsubscribe
// anyone; the button calls the email-unsubscribe Edge Function.

export const Unsubscribe = () => {
  const [params] = useSearchParams();
  const [state, setState] = useState<'ask' | 'working' | 'done' | 'failed'>('ask');
  const u = params.get('u') ?? '', t = params.get('t') ?? '';

  const stop = async () => {
    setState('working');
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-unsubscribe?u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}`, { method: 'POST' });
      setState(res.ok ? 'done' : 'failed');
    } catch { setState('failed'); }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 py-12">
      <span className="text-accent text-[10px] font-black uppercase tracking-[0.6em] block">Email tips</span>
      {state === 'done' ? (
        <>
          <h1 className="font-serif italic text-5xl text-white leading-none">You're off the list.</h1>
          <p className="text-white/70">No more CineArch tips by email. You'll still get emails you need for your account, like password resets. Turn tips back on any time in Account in the iPhone app.</p>
        </>
      ) : (
        <>
          <h1 className="font-serif italic text-5xl text-white leading-none">Stop CineArch tips?</h1>
          <p className="text-white/70">These are the emails that help you get started: the welcome, Setting the Scene, your first week and A-List Pro. Emails about your account, like password resets, still come.</p>
          {!u || !t ? (
            <p className="text-red-400" role="alert">This link is missing something. Turn tips off in Account in the iPhone app instead.</p>
          ) : (
            <button onClick={stop} disabled={state === 'working'} className="h-14 px-10 bg-accent text-black text-xs font-black uppercase tracking-[0.3em] disabled:opacity-50">
              {state === 'working' ? 'Stopping…' : 'Stop the tips'}
            </button>
          )}
          {state === 'failed' && <p className="text-red-400" role="alert">That didn't work. Try again, or turn tips off in Account in the iPhone app.</p>}
        </>
      )}
    </div>
  );
};
