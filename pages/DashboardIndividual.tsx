
import React, { useEffect, useState } from 'react';
import { api } from '../services/storage';
import { financeApi } from '../services/finance';
import { UserUnionTracking, Job, User, UNIONS } from '../types';
import { Heading, Text, Card, Badge, Button, ProgressBar } from '../components/ui';
import { ArrowUpRight, Shield, Landmark, Radar, BookOpen, HelpCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const DashStat = ({ label, value, subtext, highlight = false }: { label: string, value: string, subtext?: string, highlight?: boolean }) => (
  <div className={clsx("p-12 glass-ui transition-all duration-700", highlight ? "border-accent/30 bg-accent/5" : "hover:border-white/20")}>
    <span className={clsx("text-[9px] font-black uppercase tracking-[0.5em] italic", highlight ? "text-accent" : "text-white/40")}>{label}</span>
    <div className={clsx("text-7xl md:text-8xl font-serif mt-6 mb-3 tracking-tighter italic leading-none", highlight ? "text-accent" : "text-white")}>{value}</div>
    {subtext && <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">{subtext}</p>}
  </div>
);

export const DashboardIndividual = () => {
  const navigate = useNavigate();
  const [tracking, setTracking] = useState<UserUnionTracking[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [financeStats, setFinanceStats] = useState<any>(null);
  const user = api.auth.getUser();

  useEffect(() => {
    setTracking(api.tracking.get());
    setJobs(api.jobs.list());
    const stats = financeApi.getStats();
    setFinanceStats(stats);
  }, []);

  if (!user) return null;

  const primaryTrack = tracking[0];
  const eligibilityPercent = primaryTrack ? api.tracking.calculateProgress(primaryTrack.id, jobs).percent : 0;
  const gstProgress = financeStats ? financeApi.getThresholdProgress(financeStats.grossIncomeYTD) : 0;

  return (
    <div className="space-y-24 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 pb-16 border-b border-white/10 relative">
        <div className="space-y-6">
          <Badge color="accent" className="uppercase tracking-widest text-[9px] px-6 italic">Your Principal Dashboard</Badge>
          <h1 className="heading-huge text-white uppercase italic">YOUR <br /><span className="text-accent">WRAP.</span></h1>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate('/manual')} className="h-20 px-8 text-[10px] border-white/10 group">
             <BookOpen size={16} className="mr-4 text-accent" /> Your Manual
          </Button>
          <Button onClick={() => navigate('/jobs/new')} className="h-20 px-12 text-[12px] font-black tracking-[0.5em] bg-white text-black hover:bg-accent shadow-glow">
            Mark Your Slate <ArrowUpRight className="ml-4" size={16}/>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
        <DashStat label="Your Guild Alignment" value={`${Math.round(eligibilityPercent)}%`} subtext={primaryTrack ? `${primaryTrack.unionName} Trajectory` : 'No Targets Initialized'} highlight />
        <DashStat label="Your YTD Scale" value={`$${((financeStats?.grossIncomeYTD || 0) / 1000).toFixed(1)}k`} subtext="Professional Yield" />
        <DashStat label="Your Vault Status" value="SECURE" subtext="Verified Proofs" />
        <DashStat label="Your GST Monitor" value={`${Math.round(gstProgress)}%`} subtext="Rule GST-001 Sync" />
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <section className="lg:col-span-2 glass-ui p-12 space-y-12">
          <div className="flex items-center justify-between border-b border-white/5 pb-8">
            <div className="flex items-center gap-6">
               <Radar className="text-accent animate-pulse" size={20} />
               <h3 className="font-serif italic text-4xl text-white">Your Targets</h3>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-black uppercase text-white/20 italic cursor-help" title="View Registry Descriptions">
               Requirements <HelpCircle size={12} onClick={() => navigate('/manual')} />
            </div>
          </div>
          <div className="space-y-16">
            {tracking.map(t => {
              const { percent } = api.tracking.calculateProgress(t.id, jobs);
              return (
                <div key={t.id} className="space-y-6">
                  <div className="flex justify-between items-end">
                     <span className="text-2xl font-serif italic text-white">{t.unionName} // {t.tierLabel}</span>
                     <span className="text-5xl font-serif italic text-white">{Math.round(percent)}%</span>
                  </div>
                  <ProgressBar progress={percent} />
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-8">
           <Card className="p-10 border-accent/20 bg-accent/5 space-y-10">
              <div className="flex items-center gap-4">
                 <Landmark size={20} className="text-accent" />
                 <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-accent italic">Your Regional Hub</h4>
              </div>
              <div className="space-y-6">
                 <p className="text-sm text-white/60 italic leading-relaxed">
                    Based on your coordinates in **{user.province}**, remember that jurisdictional rules apply to every job you log.
                 </p>
                 <div className="p-6 bg-white/5 border border-white/5 space-y-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20 flex items-center gap-2 italic"><Info size={10} /> Hub Alert</span>
                    <p className="text-xs text-white/80 leading-relaxed italic">Your residency status must be verified every 12 months for primary guild continuity.</p>
                 </div>
              </div>
              <Button variant="outline" className="w-full text-[9px] border-accent/20 text-accent hover:bg-accent hover:text-black" onClick={() => navigate('/manual')}>Read Your Protocol</Button>
           </Card>

           <div className="p-8 glass-ui border-white/5 flex items-center justify-between group cursor-pointer" onClick={() => navigate('/finance')}>
              <div className="space-y-1">
                 <span className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">Your Wallet</span>
                 <p className="text-xl font-serif italic text-white">Fiscal Integrity</p>
              </div>
              <ArrowUpRight className="text-accent group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
           </div>
        </aside>
      </div>
    </div>
  );
};
