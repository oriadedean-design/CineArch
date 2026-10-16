import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { PLANS, type User } from '../types';

// A quiet, inline reason to try A-List Pro, built from the person's own
// numbers. Says only what Pro does today (docs/plan-benefits.md).
// "Not now" hides it for 7 days on this device. Same as ProNudge on iPhone.
export const ProNudge = ({ id, user, title, detail }: { id: string; user: User | null; title: string; detail: string }) => {
  const navigate = useNavigate();
  const key = `cinearch.nudge.${id}`;
  const [hiddenUntil, setHiddenUntil] = useState(() => { try { return Number(localStorage.getItem(key)) || 0; } catch { return 0; } });
  if (!user || user.isPremium || user.accountType === 'AGENT' || Date.now() < hiddenUntil) return null;

  const notNow = () => {
    const until = Date.now() + 7 * 86_400_000;
    setHiddenUntil(until);
    try { localStorage.setItem(key, String(until)); } catch { /* private mode */ }
  };

  return (
    <div className="p-6 border border-accent/30 bg-accent/5 space-y-3">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent flex items-center gap-2"><Star size={12} /> {PLANS.pro.label}</p>
      <p className="text-sm text-white">{title}</p>
      <p className="text-xs text-white/50">{detail}</p>
      <div className="flex gap-3 pt-1">
        <button onClick={() => navigate('/settings')} className="px-4 h-10 bg-accent text-black text-[10px] font-black uppercase tracking-widest">See what's in {PLANS.pro.label}</button>
        <button onClick={notNow} className="px-4 h-10 border border-white/10 text-white/50 hover:text-white text-[10px] font-black uppercase tracking-widest">Not now</button>
      </div>
    </div>
  );
};
