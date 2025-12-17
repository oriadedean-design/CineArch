
import React, { useEffect, useState } from 'react';
import { api } from '../services/storage';
import { financeApi } from '../services/finance';
import { UserUnionTracking, Job, User, UNIONS, FinanceStats } from '../types';
import { Heading, Text, Card, Badge, Button, ProgressBar } from '../components/ui';
import { ArrowUpRight, Zap, Calendar, ChevronRight, Clock, Shield, Sparkles, Mail, Phone, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const DashStat = ({ label, value, subtext, highlight = false }: { label: string, value: string, subtext?: string, highlight?: boolean }) => (
  <div className={clsx("p-10 glass-ui transition-all duration-500", highlight ? "border-accent/40 bg-accent/5" : "hover:border-white/10")}>
    <span className={clsx("text-[9px] font-black uppercase tracking-[0.4em]", highlight ? "text-accent" : "text-white/60")}>{label}</span>
    <div className={clsx("text-6xl md:text-7xl font-serif mt-4 mb-2 tracking-tighter italic", highlight ? "text-accent" : "text-white")}>{value}</div>
    {subtext && <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">{subtext}</p>}
  </div>
);

const IndividualDashboard = ({ jobs, tracking, user, financeStats }: { jobs: Job[], tracking: UserUnionTracking[], user: User, financeStats: FinanceStats }) => {
  const navigate = useNavigate();
  const primaryTrack = tracking[0];
  const eligibilityPercent = primaryTrack ? api.tracking.calculateProgress(primaryTrack.id, jobs).percent : 0;
  const gstProgress = financeStats ? financeApi.getThresholdProgress(financeStats.grossIncomeYTD) : 0;
  const vaultCount = api.vault.list().length;

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-white/5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <Badge color="accent" className="uppercase tracking-widest text-[8px]">On Set Now</Badge>
             {user.selectedRoles && user.selectedRoles.length > 1 && (
               <div className="flex items-center gap-2 text-[8px] font-black text-white/60 uppercase tracking-widest">
                  <Sparkles size={10} className="text-accent" /> Dual-Department
               </div>
             )}
          </div>
          <h1 className="heading-huge text-white">THE <br /><span className="text-accent">WRAP.</span></h1>
        </div>
        <Button onClick={() => navigate('/jobs/new')} className="h-16 px-10 text-[11px] font-black tracking-[0.4em]">Log Production <ArrowUpRight className="ml-3" size={14}/></Button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
        <DashStat 
          label="Guild Alignment" 
          value={tracking.length > 0 ? `${Math.round(eligibilityPercent)}%` : '0%'} 
          subtext={primaryTrack ? `${primaryTrack.unionName} Track` : 'No Guild Targets'} 
          highlight 
        />
        <DashStat 
          label="Total Scale" 
          value={`$${((financeStats?.grossIncomeYTD || 0) / 1000).toFixed(1)}k`} 
          subtext="YTD Gross Earnings" 
        />
        <DashStat 
          label="The Vault" 
          value={vaultCount > 0 ? "Verified" : "Empty"} 
          subtext={`${vaultCount} Key Documents`} 
        />
        <DashStat 
          label="GST Status" 
          value={`${Math.round(gstProgress)}%`} 
          subtext="Threshold Progress" 
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <section className="lg:col-span-2 glass-ui p-10 space-y-12">
           <div className="flex items-end justify-between border-b border-white/5 pb-8">
              <h3 className="font-serif italic text-4xl text-white">Guild Trajectory</h3>
              <Badge color="neutral">{user.province}</Badge>
           </div>
           
           <div className="space-y-16">
              {tracking.length > 0 ? tracking.map(t => {
                 const { percent } = api.tracking.calculateProgress(t.id, jobs);
                 return (
                    <div key={t.id} className="space-y-6 group">
                       <div className="flex justify-between items-end">
                          <div>
                             <div className="flex items-center gap-2 text-white">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent italic">{t.unionName}</span>
                                <div className="h-[1px] w-8 bg-accent/20"></div>
                             </div>
                             <p className="text-lg font-serif text-white italic mt-1 group-hover:text-accent transition-colors">{t.tierLabel} Continuity</p>
                          </div>
                          <span className="text-6xl font-serif text-white italic leading-none">{Math.round(percent)}%</span>
                       </div>
                       <ProgressBar progress={percent} />
                    </div>
                 );
              }) : (
                <div className="py-24 text-center space-y-8 border border-dashed border-white/10 glass-ui">
                   <Landmark size={32} className="mx-auto text-white/20" />
                   <div className="space-y-2">
                      <p className="text-white font-serif italic text-2xl">No guild objectives established.</p>
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest max-w-xs mx-auto">Guild alignment is required to track continuity toward membership or upgrades.</p>
                   </div>
                   <Button variant="outline" onClick={() => navigate('/settings')}>Identify Guilds</Button>
                </div>
              )}
           </div>
        </section>

        <aside className="p-10 glass-ui flex flex-col justify-end min-h-[400px] relative overflow-hidden group border-accent/20">
           <img src="https://i.pinimg.com/736x/b2/35/cc/b235cc9c47f96a370bec8f76be06fd24.jpg" className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale group-hover:scale-110 transition-transform duration-[3000ms]" />
           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2">
                 <Shield className="text-accent" size={16} />
                 <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent">Archival Security</span>
              </div>
              <h3 className="text-white italic font-serif text-4xl leading-tight">Audit <br/>Vault.</h3>
              <p className="text-white/60 text-xs font-light leading-relaxed">Encrypted local archive. Your deal memos and call sheets are secure.</p>
              <Button variant="outline" className="w-full h-12 border-accent text-accent hover:bg-accent hover:text-black" onClick={() => navigate('/settings')}>Open Archive</Button>
           </div>
        </aside>
      </div>
    </div>
  );
};

// Re-import Landmark which was missing from icons above
import { Landmark } from 'lucide-react';

const AgencyDashboard = ({ user }: { user: User }) => {
  const navigate = useNavigate();
  const [roster, setRoster] = useState<{client: User, jobs: Job[]}[]>([]);

  useEffect(() => {
    const data = (user.managedUsers || []).map(client => {
      const jobsStr = localStorage.getItem(`cinearch_data_jobs_${client.id}`);
      return { client, jobs: jobsStr ? JSON.parse(jobsStr) : [] };
    });
    setRoster(data);
  }, [user]);

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-white/5">
        <div className="space-y-2">
           <div className="flex items-center gap-3 mb-2">
              <Zap className="text-accent w-5 h-5 fill-current" />
              <span className="text-accent text-[10px] font-black uppercase tracking-[0.5em] italic">Agency Command</span>
           </div>
           <h1 className="heading-huge text-white">SHOW <br /><span className="text-accent">RUNNER.</span></h1>
        </div>
        <div className="glass-ui p-10 min-w-[280px] text-center space-y-2 border-accent/20">
           <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent">Active Roster Sync</span>
           <div className="text-7xl font-serif text-white italic leading-none">{roster.length}<span className="text-xl font-sans not-italic text-white/40">/35</span></div>
           <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mt-2">Verified Members</p>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-1">
        <section className="lg:col-span-2 glass-ui p-10 space-y-10">
          <div className="flex justify-between items-end border-b border-white/5 pb-6">
            <h3 className="font-serif italic text-4xl text-white">Production Roster</h3>
            <Badge color="accent">Real-time Feed</Badge>
          </div>
          <div className="space-y-2">
             {roster.length > 0 ? roster.slice(0, 10).map((r, i) => (
               <div key={i} className="flex flex-col p-6 hover:bg-white/5 transition-all group border-b border-white/5 last:border-none">
                 <div className="flex items-center gap-8 mb-4">
                    <div className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center font-serif italic text-2xl text-accent group-hover:bg-accent group-hover:text-black">
                      {r.client.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-xl font-serif text-white italic">{r.client.name}</p>
                      <p className="text-[9px] text-white/40 uppercase font-black tracking-widest">
                        {r.jobs[0]?.productionName || 'Off-Production'} // {r.client.selectedRoles?.[0]}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                 </div>
                 <div className="flex items-center gap-6 pl-22">
                    <div className="flex items-center gap-2 text-[10px] text-white/60 font-light italic">
                       <Mail size={12} className="text-accent" /> {r.client.email}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/60 font-light italic">
                       <Phone size={12} className="text-accent" /> {r.client.phone || 'No Contact Info'}
                    </div>
                 </div>
               </div>
             )) : (
               <div className="py-20 text-center text-[9px] text-white/40 uppercase tracking-[0.4em] italic font-black">No talent records synchronized.</div>
             )}
          </div>
        </section>

        <section className="glass-ui p-10 space-y-10">
           <h3 className="font-serif italic text-3xl text-white border-b border-white/5 pb-6">Guild Compliance</h3>
           <div className="space-y-10">
              {[
                { union: 'ACTRA', desc: 'Dues Sync', date: 'Oct 31', urgent: true },
                { union: 'IATSE 873', desc: 'Q4 Membership', date: 'Nov 15', urgent: false },
                { union: 'DGC', desc: 'Administrative Fee Gap', date: 'Dec 01', urgent: false },
                { union: 'WGC', desc: 'Script Credit Verification', date: 'Dec 05', urgent: false }
              ].map((due, i) => (
                <div key={i} className="flex items-start gap-6 group">
                  <div className={clsx("h-14 w-[1px] transition-all", due.urgent ? "bg-accent scale-y-110" : "bg-white/10")}></div>
                  <div>
                    <p className="text-[9px] font-black text-white uppercase tracking-[0.3em] mb-1">{due.union}</p>
                    <p className="text-xs text-white/60 leading-relaxed">{due.desc}</p>
                    <p className={clsx("text-[9px] font-black uppercase tracking-widest mt-2", due.urgent ? "text-accent" : "text-white/40")}>{due.date}</p>
                  </div>
                </div>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const [tracking, setTracking] = useState<UserUnionTracking[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null);
  const user = api.auth.getUser();

  useEffect(() => {
    setTracking(api.tracking.get());
    setJobs(api.jobs.list());
    
    // Logic to calculate real stats based on logs if finance data isn't initialized
    const realJobs = api.jobs.list();
    const grossIncome = realJobs.reduce((a,c) => a + (c.grossEarnings || 0), 0);
    
    if (user?.isPremium) {
      const stats = financeApi.getStats();
      setFinanceStats(stats);
    } else {
      setFinanceStats({
        grossIncomeYTD: grossIncome,
        totalExpensesYTD: 0,
        deductibleExpensesYTD: 0,
        netIncomeYTD: grossIncome,
        gstCollected: 0,
        gstPaid: 0,
        gstNetRemittance: 0,
        taxableIncomeProjected: grossIncome
      });
    }
  }, [user]);

  if (!user) return null;
  return user.accountType === 'AGENT' 
    ? <AgencyDashboard user={user} /> 
    : <IndividualDashboard jobs={jobs} tracking={tracking} user={user} financeStats={financeStats!} />;
};
