import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/storage';
import { financeApi } from '../services/finance';
import { UserUnionTracking, Job, User, FinanceStats } from '../types';
import { Heading, Text, Card, Badge, Button, ProgressBar } from '../components/ui';
import { ArrowUpRight, Zap, Shield, Landmark, Radar, GanttChartSquare, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

// Explicit interface for Roster item to ensure type safety across the agency dashboard
interface RosterMember {
  client: User;
  jobs: Job[];
  tracks: UserUnionTracking[];
}

const DashStat = ({ label, value, subtext, highlight = false }: { label: string, value: string, subtext?: string, highlight?: boolean }) => (
  <div className={clsx("p-12 glass-ui transition-all duration-700", highlight ? "border-accent/30 bg-accent/5" : "hover:border-white/20")}>
    <span className={clsx("text-[9px] font-black uppercase tracking-[0.5em] italic", highlight ? "text-accent" : "text-white/40")}>{label}</span>
    <div className={clsx("text-7xl md:text-8xl font-serif mt-6 mb-3 tracking-tighter italic leading-none", highlight ? "text-accent" : "text-white")}>{value}</div>
    {subtext && <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">{subtext}</p>}
  </div>
);

const TacticalTimeline = ({ roster }: { roster: { client: User, jobs: Job[] }[] }) => {
  // Logic: Create a month-scale timeline for all clients
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  
  return (
    <Card className="p-0 overflow-hidden border-white/10 bg-transparent">
       <div className="p-12 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-4">
             <GanttChartSquare className="text-accent" size={18} />
             <h3 className="font-serif italic text-4xl text-white">Tactical Schedule</h3>
          </div>
          <Badge color="neutral" className="opacity-40 italic">2025 Volume</Badge>
       </div>
       <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
             {/* Header */}
             <div className="grid grid-cols-[250px_1fr] border-b border-white/5">
                <div className="p-6 border-r border-white/5 text-[10px] font-black uppercase tracking-widest text-white/20 italic">Personnel</div>
                <div className="grid grid-cols-12">
                   {months.map(m => (
                      <div key={m} className="p-6 text-center text-[9px] font-black text-white/20 tracking-widest border-r border-white/5 last:border-none">{m}</div>
                   ))}
                </div>
             </div>
             
             {/* Roster Rows */}
             <div className="divide-y divide-white/5">
                {roster.map(({ client, jobs }) => (
                   <div key={client.id} className="grid grid-cols-[250px_1fr] group">
                      <div className="p-8 border-r border-white/5 flex items-center gap-4 group-hover:bg-white/[0.02] transition-colors">
                         <div className="w-8 h-8 bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-black italic text-accent">{client.name.charAt(0)}</div>
                         <span className="text-sm font-serif italic text-white/60 group-hover:text-white transition-colors">{client.name}</span>
                      </div>
                      <div className="grid grid-cols-12 relative h-16 items-center">
                         {jobs.map((job, i) => {
                            const start = new Date(job.startDate).getMonth();
                            const span = 1; // Simplify to 1 month for visualization
                            return (
                               <div 
                                  key={i}
                                  className="absolute h-3 bg-accent/40 border-l border-r border-accent hover:h-6 hover:bg-accent transition-all cursor-pointer"
                                  style={{ 
                                     left: `${(start / 12) * 100}%`, 
                                     width: `${(span / 12) * 100}%`,
                                     top: '50%',
                                     transform: 'translateY(-50%)'
                                  }}
                                  title={`${job.productionName} (${job.role})`}
                               ></div>
                            );
                         })}
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>
    </Card>
  );
};

const IndividualDashboard = ({ jobs, tracking, user, financeStats }: { jobs: Job[], tracking: UserUnionTracking[], user: User, financeStats: any }) => {
  const navigate = useNavigate();
  const [vaultCount, setVaultCount] = useState(0);

  useEffect(() => {
    // vault.list() is async, move to useEffect to track length properly
    api.vault.list().then(docs => setVaultCount(docs.length));
  }, []);

  const primaryTrack = tracking[0];
  const eligibilityPercent = primaryTrack ? api.tracking.calculateProgress(primaryTrack, jobs).percent : 0;
  const gstProgress = financeStats ? financeApi.getThresholdProgress(financeStats.grossIncomeYTD) : 0;

  return (
    <div className="space-y-24 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 pb-16 border-b border-white/10 relative">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
             <Badge color="accent" className="uppercase tracking-widest text-[9px] px-6">Principal Dashboard // 1.0</Badge>
             <div className="flex items-center gap-3 text-[9px] font-black text-white/20 uppercase tracking-[0.5em] italic">
                <Radar size={12} className="animate-pulse text-accent" /> Active Tracking
             </div>
          </div>
          <h1 className="heading-huge text-white uppercase italic">THE <br /><span className="text-accent">WRAP.</span></h1>
        </div>
        <Button onClick={() => navigate('/jobs/new')} className="h-20 px-12 text-[12px] font-black tracking-[0.5em] bg-white text-black hover:bg-accent transition-colors">
          Mark New Slate <ArrowUpRight className="ml-4" size={16}/>
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
        <DashStat 
          label="Guild Alignment" 
          value={tracking.length > 0 ? `${Math.round(eligibilityPercent)}%` : '0%'} 
          subtext={primaryTrack ? `${primaryTrack.unionName} Trajectory` : 'No Targets Found'} 
          highlight 
        />
        <DashStat 
          label="YTD Scale" 
          value={`$${((financeStats?.grossIncomeYTD || 0) / 1000).toFixed(1)}k`} 
          subtext="Professional Yield" 
        />
        <DashStat 
          label="Compliance Hub" 
          value={vaultCount > 0 ? "SECURE" : "IDLE"} 
          subtext={`${vaultCount} Verified Proofs`} 
        />
        <DashStat 
          label="GST Threshold" 
          value={`${Math.round(gstProgress)}%`} 
          subtext="Rule GST-001 Sync" 
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <section className="lg:col-span-2 glass-ui p-12 space-y-16 hover:border-accent/20 transition-all duration-700">
           <div className="flex items-end justify-between border-b border-white/5 pb-10">
              <div className="space-y-2">
                 <h3 className="font-serif italic text-5xl text-white">Target Trajectory</h3>
                 <p className="text-[10px] text-white/30 uppercase font-black tracking-widest italic">Membership eligibility analytics</p>
              </div>
              <Badge color="neutral" className="border-white/5">{user.province}</Badge>
           </div>
           
           <div className="space-y-20">
              {tracking.length > 0 ? tracking.map(t => {
                 const { percent } = api.tracking.calculateProgress(t, jobs);
                 return (
                    <div key={t.id} className="space-y-8 group">
                       <div className="flex justify-between items-end">
                          <div className="space-y-1">
                             <div className="flex items-center gap-4 text-white">
                                <span className="text-[11px] font-black uppercase tracking-[0.5em] text-accent italic">{t.unionName}</span>
                                <div className="h-[1px] w-12 bg-accent/20"></div>
                             </div>
                             <p className="text-2xl font-serif text-white italic mt-2 group-hover:text-accent transition-colors">{t.tierLabel} Verification</p>
                          </div>
                          <span className="text-7xl font-serif text-white italic leading-none">{Math.round(percent)}%</span>
                       </div>
                       <ProgressBar progress={percent} />
                    </div>
                 );
              }) : (
                <div className="py-32 text-center space-y-10 border border-dashed border-white/5 bg-white/[0.01]">
                   <Landmark size={40} strokeWidth={1} className="mx-auto text-white/10" />
                   <div className="space-y-4">
                      <p className="text-white font-serif italic text-3xl">Registry Clear.</p>
                      <p className="text-[10px] text-white/20 uppercase font-black tracking-[0.5em] max-w-xs mx-auto italic">Guild alignment required for continuity tracking.</p>
                   </div>
                   <Button variant="outline" className="h-14 px-10 border-white/10" onClick={() => navigate('/settings')}>Initialize Targets</Button>
                </div>
              )}
           </div>
        </section>

        <aside className="p-12 glass-ui flex flex-col justify-end min-h-[500px] relative overflow-hidden group border-white/10 hover:border-accent/30 transition-all duration-1000">
           <div className="absolute inset-0 bg-cinematic-universal opacity-10 group-hover:opacity-20 transition-opacity duration-1000"></div>
           <div className="relative z-10 space-y-10">
              <div className="flex items-center gap-4">
                 <Shield className="text-accent" size={20} />
                 <span className="text-[10px] font-black uppercase tracking-[0.6em] text-accent italic">Archival Vault</span>
              </div>
              <h3 className="text-white italic font-serif text-6xl leading-[0.7] tracking-tighter">Canonical <br/>Records.</h3>
              <p className="text-white/40 text-[14px] font-light italic leading-relaxed">
                Encrypted local storage for deal memos and residency proofs. Sovereign control over your professional paper trail.
              </p>
              <div className="pt-6">
                 <Button variant="outline" className="w-full h-16 border-accent text-accent hover:bg-accent hover:text-black transition-all" onClick={() => navigate('/settings')}>Open Archive</Button>
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
};

const AgencyDashboard = ({ user }: { user: User }) => {
  const navigate = useNavigate();
  // Ensure activeRoster is explicitly typed as RosterMember[] to avoid inference issues
  const [activeRoster, setActiveRoster] = useState<RosterMember[]>([]);
  const [activeUnionFilter, setActiveUnionFilter] = useState<string | null>(null);

  useEffect(() => {
    const loadRoster = async () => {
        const data: RosterMember[] = await Promise.all((user.managedUsers || []).map(async (client) => {
            const jobs = await api.jobs.listForClient(client.id);
            const tracks = await api.tracking.get(client.id);
            return { client, jobs, tracks };
        }));
        setActiveRoster(data);
    };
    loadRoster();
  }, [user]);

  const groupedByUnion = useMemo(() => {
    const map: Record<string, { client: User, role: string }[]> = {};
    activeRoster.forEach(({ client, tracks }) => {
      tracks.forEach(track => {
        if (!map[track.unionName]) map[track.unionName] = [];
        map[track.unionName].push({ client, role: client.selectedRoles?.[0] || 'Unknown Role' });
      });
    });
    return map;
  }, [activeRoster]);

  return (
    <div className="space-y-24 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 pb-16 border-b border-white/10 relative">
        <div className="space-y-6">
           <div className="flex items-center gap-4 mb-2">
              <Zap className="text-accent w-6 h-6 fill-current" />
              <span className="text-accent text-[11px] font-black uppercase tracking-[0.6em] italic">Agency Intelligence v1.0</span>
           </div>
           <h1 className="heading-huge text-white uppercase italic">SHOW <br /><span className="text-accent">RUNNER.</span></h1>
        </div>
        <div className="glass-ui p-12 min-w-[320px] text-center space-y-4 border-accent/20 bg-accent/5">
           <span className="text-[10px] font-black uppercase tracking-[0.5em] text-accent italic">Active Roster Sync</span>
           <div className="text-8xl font-serif text-white italic leading-none">{activeRoster.length}<span className="text-2xl font-sans not-italic text-white/20 ml-2">/35</span></div>
           <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] mt-4 italic">Personnel Verified</p>
        </div>
      </header>

      {/* Gantt Visualization */}
      <section className="animate-in slide-in-from-bottom-8 duration-700">
         {/* Mapping activeRoster to TacticalTimeline expected format */}
         <TacticalTimeline roster={activeRoster.map(r => ({ client: r.client, jobs: r.jobs }))} />
      </section>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Union Tracking Intelligence */}
        <section className="lg:col-span-8 space-y-12">
           <div className="flex items-center gap-6">
              <div className="p-4 bg-accent/10 border border-accent/20 flex items-center justify-center text-accent"><Briefcase size={20} /></div>
              <h3 className="font-serif italic text-5xl text-white uppercase tracking-tight">Guild Intelligence</h3>
              <div className="flex-1 h-px bg-white/5"></div>
           </div>

           <div className="grid sm:grid-cols-2 gap-1">
              {/* Fix: Explicitly casting Object.entries to resolve 'unknown' type inference on members */}
              {(Object.entries(groupedByUnion) as [string, { client: User, role: string }[]][]).map(([union, members]) => (
                 <Card 
                   key={union} 
                   className={clsx(
                     "p-12 transition-all duration-500 cursor-pointer",
                     activeUnionFilter === union ? "border-accent bg-accent/5" : "hover:border-white/20"
                   )}
                   onClick={() => setActiveUnionFilter(activeUnionFilter === union ? null : union)}
                 >
                    <div className="flex justify-between items-start mb-6">
                       <span className="text-[10px] font-black uppercase tracking-[0.5em] text-accent italic">{union} Trajectory</span>
                       <Badge color="accent">{members.length} Headcount</Badge>
                    </div>
                    <div className="space-y-4">
                       {activeUnionFilter === union && (
                          <div className="space-y-4 pt-6 border-t border-white/5 animate-in fade-in duration-500">
                             {members.map((m, idx) => (
                                <div key={idx} className="flex justify-between items-center group">
                                   <span className="text-lg font-serif italic text-white/60 group-hover:text-white">{m.client.name}</span>
                                   <span className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">{m.role}</span>
                                </div>
                             ))}
                          </div>
                       )}
                       {!activeUnionFilter && (
                          <div className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">Tap to reveal personnel alignment</div>
                       )}
                    </div>
                 </Card>
              ))}
              {Object.keys(groupedByUnion).length === 0 && (
                 <div className="col-span-2 py-32 text-center border border-dashed border-white/5 opacity-30 italic font-black uppercase tracking-[0.4em] text-[11px]">
                    No guild trajectories synchronized.
                 </div>
              )}
           </div>
        </section>

        {/* Tactical Actions */}
        <aside className="lg:col-span-4 space-y-12">
           <div className="p-12 glass-ui space-y-10 border-white/10 hover:border-accent/40 transition-all">
              <h4 className="text-[11px] font-black uppercase tracking-[0.6em] text-accent italic flex items-center gap-3">
                 <Zap size={14} className="fill-current" /> High-Impact Tasks
              </h4>
              <div className="space-y-6">
                 <button 
                   onClick={() => navigate('/roster')}
                   className="w-full h-16 border border-white/5 bg-white/5 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.5em] text-white hover:bg-white hover:text-black transition-all"
                 >
                    Manage Full Roster
                 </button>
                 <button className="w-full h-16 border border-white/5 bg-white/5 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.5em] text-white/40 cursor-not-allowed">
                    Bulk Audit Export
                 </button>
              </div>
           </div>

           <Card className="p-10 border-white/5 bg-transparent space-y-6">
              <div className="flex items-center gap-3">
                 <Shield className="text-accent" size={14} />
                 <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-white italic">Privacy Integrity</h4>
              </div>
              <p className="text-xs text-white/30 leading-relaxed italic font-light">
                 Showrunner accounts operate as primary curators. Ensure all talent data synchronization follows the CineArch Privacy Protocol (The Charter).
              </p>
           </Card>
        </aside>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const [tracking, setTracking] = useState<UserUnionTracking[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [financeStats, setFinanceStats] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Handle async data loading in Dashboard useEffect to correctly await api.auth.getUser()
    const loadData = async () => {
      const u = await api.auth.getUser();
      setUser(u);
      
      const ts = await api.tracking.get();
      const js = await api.jobs.list();
      setTracking(ts);
      setJobs(js);
      
      const grossIncome = js.reduce((a,c) => a + (c.grossEarnings || 0), 0);
      
      if (u?.isPremium) {
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
    };
    loadData();
  }, []);

  if (!user) return null;
  return user.accountType === 'AGENT' 
    ? <AgencyDashboard user={user} /> 
    : <IndividualDashboard jobs={jobs} tracking={tracking} user={user} financeStats={financeStats!} />;
};