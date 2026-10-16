import React from 'react';
import { Crown } from 'lucide-react';
import { PLANS, User } from '../types';
import { Card, Badge, Button } from './ui';

const Benefits = ({ items }: { items: string[] }) => (
  <ul className="space-y-3">
    {items.map(b => (
      <li key={b} className="flex items-start gap-3 text-sm text-white/80 italic">
        <span className="text-accent font-bold">✓</span><span>{b}</span>
      </li>
    ))}
  </ul>
);

// Your plan and what it includes; on the free plan, what A-List Pro adds.
export const PlanCard = ({ user }: { user: User | null }) => {
  const current = user?.accountType === 'AGENT' ? PLANS.agency : user?.isPremium ? PLANS.pro : PLANS.free;
  const next = current.id === 'free' ? PLANS.pro : null;
  return (
    <div className="space-y-8">
      <Card className="p-8 border-accent/20 bg-accent/5 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Crown className="text-accent" size={24} />
            <div>
              <h3 className="text-3xl font-serif italic text-white leading-none">{current.label}</h3>
              <p className="text-[10px] text-accent font-black uppercase tracking-[0.3em] mt-2">{current.price}{current.id !== 'free' && ' / month'}</p>
            </div>
          </div>
          <Badge color="accent">Your plan</Badge>
        </div>
        <p className="text-sm text-white/60 italic">{current.desc}</p>
        <Benefits items={current.benefits} />
      </Card>
      {next && (
        <Card className="p-8 border-white/10 space-y-6">
          <div>
            <h3 className="text-2xl font-serif italic text-white leading-none">What comes with {next.label}</h3>
            <p className="text-[10px] text-accent font-black uppercase tracking-[0.3em] mt-2">{next.price} / month</p>
          </div>
          <Benefits items={next.benefits.slice(1)} />
          <Button disabled className="w-full h-14 text-[10px] tracking-[0.3em] bg-white/20 text-white/40 cursor-not-allowed font-black">Go A-List Pro · upgrades open soon</Button>
        </Card>
      )}
    </div>
  );
};
