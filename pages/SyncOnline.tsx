import React from 'react';
import { Cloud, Smartphone } from 'lucide-react';
import { PlanCard } from '../components/PlanCard';
import { Button } from '../components/ui';
import type { User } from '../types';

// A free (Indie Log) account signed in on the website. The website is a second
// device, and using CineArch on more than one device is Sync Online (A-List Pro):
// free accounts keep their Slate and Wrap in the iPhone app, on their phone.
export const SyncOnline = ({ user, onLogout }: { user: User; onLogout: () => void }) => (
  <div className="min-h-screen bg-black text-white px-4 py-12 md:py-20">
    <div className="max-w-2xl mx-auto space-y-10">
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Signed in as {user.email}</p>
        <h1 className="font-serif italic text-5xl md:text-6xl leading-none">Sync Online is A-List Pro</h1>
        <p className="text-white/60 italic">
          On Indie Log, your Slate and Your Wrap live on your phone, in the CineArch iPhone app. Nothing is kept online,
          so there's nothing to show here yet.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-white/10 p-6 space-y-3">
          <Smartphone className="text-accent" size={20} />
          <h2 className="font-serif italic text-2xl">Indie Log</h2>
          <p className="text-sm text-white/60">Mark the slate and track your unions in the iPhone app. Everything stays on that phone.</p>
        </div>
        <div className="border border-accent/40 bg-accent/5 p-6 space-y-3">
          <Cloud className="text-accent" size={20} />
          <h2 className="font-serif italic text-2xl">A-List Pro</h2>
          <p className="text-sm text-white/60">Your account on the website, an iPad or another phone, kept in step. Plus Wrap Wallet and the Vault.</p>
        </div>
      </div>

      <PlanCard user={user} />

      <div className="flex flex-col md:flex-row gap-4">
        <a href="/guide" className="flex-1 h-14 flex items-center justify-center border border-white/20 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/5">
          Read the union guide
        </a>
        <Button variant="secondary" onClick={onLogout} className="flex-1 h-14 text-[10px] tracking-[0.3em]">Sign out</Button>
      </div>
    </div>
  </div>
);
