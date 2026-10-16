import React, { useEffect, useState } from 'react';
import { api } from '../services/storage';
import { financeApi } from '../services/finance';
import { UserUnionTracking, Job, User } from '../types';
import { Heading, Text, Card, Badge, Button, ProgressBar } from '../components/ui';
import { ArrowUpRight, Landmark, Radar, BookOpen, HelpCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ComingUp, IncomeChart, JobTimeline } from '../components/WrapOverview';
import clsx from 'clsx';

const DashStat = ({ label, value, subtext, highlight = false }: { label: string, value: string, subtext?: string, highlight?: boolean }) => (
  <div className={clsx("p-8 md:p-12 glass-ui transition-all duration-700", highlight ? "border-accent/30 bg-accent/5" : "hover:border-white/20")}>
    <span className={clsx("text-xs font-black uppercase tracking-[0.4em] md:tracking-[0.5em] italic", highlight ? "text-accent" : "text-white/40")}>{label}</span>
    <div className={clsx("text-5xl md:text-8xl font-serif mt-4 md:mt-6 mb-2 md:mb-3 tracking-tighter italic leading-none", highlight ? "text-accent" : "text-white")}>{value}</div>
    {subtext && <p className="text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/20 italic">{subtext}</p>}
  </div>
);

export const DashboardIndividual = () => {
  const navigate = useNavigate();
  const [tracking, setTracking] = useState<UserUnionTracking[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [financeStats, setFinanceStats] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [vaultCount, setVaultCount] = useState<number | null>(null);

  useEffect(() => {
    const initializeDashboard = async () => {
      const u = await api.auth.getUser();
      setUser(u);

      const tracks = await api.tracking.get();
      setTracking(tracks);

      const jobList = await api.jobs.list();
      setJobs(jobList);

      if (u?.id) {
        const stats = await financeApi.getStats(u.id);
        setFinanceStats(stats);
      }

      const docs = await api.vault.list();
      setVaultCount(docs.length);
    };
    initializeDashboard();
  }, []);

  if (!user) return null;

  const primaryTrack = tracking[0];
  const eligibilityPercent = primaryTrack ? api.tracking.calculateProgress(primaryTrack, jobs).percent : 0;
  const gstProgress = financeStats ? financeApi.getThresholdProgress(financeStats.grossIncomeYTD) : 0;

  const vaultLabel = vaultCount === null ? '—' : vaultCount === 0 ? 'Empty' : String(vaultCount);

  return (
    <div className="space-y-12 md:space-y-24 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12 pb-8 md:pb-16 border-b border-white/10 relative">
        <div className="space-y-4 md:space-y-6">
          <Badge color="accent" className="uppercase tracking-widest text-xs px-4 md:px-6 italic">Today's Call Sheet</Badge>
          <h1 className="heading-huge text-white uppercase italic">YOUR <br className="hidden md:block" /><span className="text-accent">WRAP.</span></h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto">
          <Button variant="outline" onClick={() => navigate('/manual')} className="h-14 md:h-20 px-6 md:px-8 text-xs border-white/10 group flex justify-center items-center">
            <BookOpen size={14} className="mr-3 md:mr-4 text-accent" /> Your Manual
          </Button>
          <Button onClick={() => navigate('/jobs/new')} className="h-14 md:h-20 px-8 md:px-12 text-xs md:text-sm font-black tracking-[0.4em] md:tracking-[0.5em] bg-white text-black hover:bg-accent shadow-glow flex justify-center items-center">
            Mark the slate <ArrowUpRight className="ml-3 md:ml-4" size={14}/>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0.5 md:gap-1">
        <DashStat label="Getting Your Card" value={`${Math.round(eligibilityPercent)}%`} subtext={primaryTrack ? `${primaryTrack.unionName}` : 'No union picked'} highlight />
        <DashStat label="Earned This Year" value={`$${((financeStats?.grossIncomeYTD || 0) / 1000).toFixed(1)}k`} subtext="Before tax" />
        <DashStat label="Vault" value={vaultLabel} subtext="Pay stubs & proof" />
        <DashStat label="GST/HST" value={`${Math.round(gstProgress)}%`} subtext="Of the $30k line" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        <section className="lg:col-span-2 glass-ui p-6 md:p-12 space-y-8 md:space-y-12">
          <div className="flex items-center justify-between border-b border-white/5 pb-6 md:pb-8">
            <div className="flex items-center gap-4 md:gap-6">
              <Radar className="text-accent animate-pulse" size={18} />
              <h3 className="font-serif italic text-2xl md:text-4xl text-white">Your Road to the Union</h3>
            </div>
            <div className="flex items-center gap-3 md:gap-4 text-xs font-black uppercase text-white/20 italic cursor-help" title="View Registry Descriptions">
              How it works <HelpCircle size={10} onClick={() => navigate('/manual')} />
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
                Nothing in the can yet. Pick a union in Your Config to start counting your days.
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6 md:space-y-8">
          <Card className="p-6 md:p-10 border-accent/20 bg-accent/5 space-y-6 md:space-y-10">
            <div className="flex items-center gap-3 md:gap-4">
              <Landmark size={18} className="text-accent" />
              <h4 className="text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-accent italic">Your Home Base</h4>
            </div>
            <div className="space-y-4 md:space-y-6">
              <p className="text-sm md:text-base text-white/60 italic leading-relaxed">
                You're based in <span className="text-white">{user.province}</span>. Working union sets before you're a member? Those days count toward joining too.
              </p>
              <div className="p-4 md:p-6 bg-white/5 border border-white/5 space-y-3 md:space-y-4">
                <span className="text-xs font-black uppercase tracking-widest text-white/20 flex items-center gap-2 italic"><Info size={10} /> Heads up</span>
                <p className="text-xs text-white/80 leading-relaxed italic">Most unions ask for proof you live in the province. Keep a copy in your Vault.</p>
              </div>
            </div>
            <Button variant="outline" className="w-full text-xs h-12 md:h-14 border-accent/20 text-accent hover:bg-accent hover:text-black flex justify-center items-center" onClick={() => navigate('/manual')}>Read the manual</Button>
          </Card>

          <div className="p-6 md:p-8 glass-ui border-white/5 flex items-center justify-between group cursor-pointer" onClick={() => navigate('/finance')}>
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-white/20 italic">Your Wallet</span>
              <p className="text-lg md:text-xl font-serif italic text-white">Income, expenses and GST/HST</p>
            </div>
            <ArrowUpRight className="text-accent group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </div>
        </aside>
      </div>

      <JobTimeline jobs={jobs} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        <IncomeChart jobs={jobs} showGSTLine={!!user.isPremium} />
        <ComingUp jobs={jobs} tracks={tracking} />
      </div>
    </div>
  );
};
