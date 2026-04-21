import React, { useEffect, useState } from 'react';
import { api } from '../services/storage';
import { financeApi } from '../services/finance';
import { UserUnionTracking, Job, User } from '../types';
import { Heading, Text, Card, Badge, Button, ProgressBar } from '../components/ui';
import { ArrowUpRight, Landmark, Radar, BookOpen, HelpCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const DashStat = ({ label, value, subtext, highlight = false }: { label: string, value: string, subtext?: string, highlight?: boolean }) => (
  <div className={clsx("p-8 md:p-12 glass-ui transition-all duration-700", highlight ? "border-accent/30 bg-accent/5" : "hover:border-white/20")}>
    <span className={clsx("text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] italic", highlight ? "text-accent" : "text-white/40")}>{label}</span>
    <div className={clsx("text-5xl md:text-8xl font-serif mt-4 md:mt-6 mb-2 md:mb-3 tracking-tighter italic leading-none", highlight ? "text-accent" : "text-white")}>{value}</div>
    {subtext && <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/20 italic">{subtext}</p>}
  </div>
);

export const DashboardIndividual = () => {
  const navigate = useNavigate();
  const [tracking, setTracking] = useState<UserUnionTracking[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [financeStats, setFinanceStats] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const initializeDashboard = async () => {
      const u = await api.auth.getUser();
      setUser(u);
      
      const tracks = await api.tracking.get();
      setTracking(tracks);
      
      const jobList = await api.jobs.list();
      setJobs(jobList);
      
      const stats = financeApi.getStats();
      setFinanceStats(stats);
    };
    initializeDashboard();
  }, []);

  if (!user) return null;

  const primaryTrack = tracking[0];
  const eligibilityPercent = primaryTrack ? api.tracking.calculateProgress(primaryTrack, jobs).percent : 0;
  const gstProgress = financeStats ? financeApi.getThresholdProgress(financeStats.grossIncomeYTD) : 0;

  return (
    <div className="space-y-12 md:space-y-24 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12 pb-8 md:pb-16 border-b border-white/10 relative">
        <div className="space-y-4 md:space-y-6">
          <Badge color="accent" className="uppercase tracking-widest text-[8px] md:text-[9px] px-4 md:px-6 italic">Your Principal Dashboard</Badge>
          <h1 className="heading-huge text-white uppercase italic">YOUR <br className="hidden md:block" /><span className="text-accent">WRAP.</span></h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto">
          <Button variant="outline" onClick={() => navigate('/manual')} className="h-14 md:h-20 px-6 md:px-8 text-[9px] md:text-[10px] border-white/10 group flex justify-center items-center">
             <BookOpen size={14} className="mr-3 md:mr-4 text-accent" /> Your Manual
          </Button>
          <Button onClick={() => navigate('/jobs/new')} className="h-14 md:h-20 px-8 md:px-12 text-[10px] md:text-[12px] font-black tracking-[0.4em] md:tracking-[0.5em] bg-white text-black hover:bg-accent shadow-glow flex justify-center items-center">
            Mark Slate <ArrowUpRight className="ml-3 md:ml-4" size={14}/>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0.5 md:gap-1">
        <DashStat label="Guild Alignment" value={`${Math.round(eligibilityPercent)}%`} subtext={primaryTrack ? `${primaryTrack.unionName}` : 'IDLE'} highlight />
        <DashStat label="YTD Scale" value={`$${((financeStats?.grossIncomeYTD || 0) / 1000).toFixed(1)}k`} subtext="Yield" />
        <DashStat label="Vault" value="SECURE" subtext="Proofs" />
        <DashStat label="GST" value={`${Math.round(gstProgress)}%`} subtext="Sync" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        <section className="lg:col-span-2 glass-ui p-6 md:p-12 space-y-8 md:space-y-12">
          <div className="flex items-center justify-between border-b border-white/5 pb-6 md:pb-8">
            <div className="flex items-center gap-4 md:gap-6">
               <Radar className="text-accent animate-pulse" size={18} />
               <h3 className="font-serif italic text-2xl md:text-4xl text-white">Your Targets</h3>
            </div>
            <div className="flex items-center gap-3 md:gap-4 text-[8px] md:text-[9px] font-black uppercase text-white/20 italic cursor-help" title="View Registry Descriptions">
               Specs <HelpCircle size={10} onClick={() => navigate('/manual')} />
            </div>
          </div>
          <div className="space-y-10 md:space-y-16">
            {tracking.map(t => {
              const { percent } = api.tracking.calculateProgress(t, jobs);
              return (
                <div key={t.id} className="space-y-4 md:space-y-6">
                  <div className="flex justify-between items-end">
                     <span className="text-xl md:text-2xl font-serif italic text-white leading-none truncate pr-4">{t.unionName} // {t.tierLabel}</span>
                     <span className="text-3xl md:text-5xl font-serif italic text-white leading-none">{Math.round(percent)}%</span>
                  </div>
                  <ProgressBar progress={percent} />
                </div>
              );
            })}
            {tracking.length === 0 && (
              <div className="py-12 text-center border border-dashed border-white/5 opacity-30 italic text-sm">
                No active targets calibrated.
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6 md:space-y-8">
           <Card className="p-6 md:p-10 border-accent/20 bg-accent/5 space-y-6 md:space-y-10">
              <div className="flex items-center gap-3 md:gap-4">
                 <Landmark size={18} className="text-accent" />
                 <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-accent italic">Regional Hub</h4>
              </div>
              <div className="space-y-4 md:space-y-6">
                 <p className="text-sm md:text-base text-white/60 italic leading-relaxed">
                    Personnel coordinates set to **{user.province}**. National standards apply.
                 </p>
                 <div className="p-4 md:p-6 bg-white/5 border border-white/5 space-y-3 md:space-y-4">
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white/20 flex items-center gap-2 italic"><Info size={10} /> Hub Alert</span>
                    <p className="text-[11px] md:text-xs text-white/80 leading-relaxed italic">Verified residency proof required for primary continuity.</p>
                 </div>
              </div>
              <Button variant="outline" className="w-full text-[8px] md:text-[9px] h-12 md:h-14 border-accent/20 text-accent hover:bg-accent hover:text-black flex justify-center items-center" onClick={() => navigate('/manual')}>View Protocol</Button>
           </Card>

           <div className="p-6 md:p-8 glass-ui border-white/5 flex items-center justify-between group cursor-pointer" onClick={() => navigate('/finance')}>
              <div className="space-y-1">
                 <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white/20 italic">Your Wallet</span>
                 <p className="text-lg md:text-xl font-serif italic text-white">Fiscal Integrity</p>
              </div>
              <ArrowUpRight className="text-accent group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
           </div>
        </aside>
      </div>
    </div>
  );
};