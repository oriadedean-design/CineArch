
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/storage';
import { financeApi } from '../services/finance';
import { UserUnionTracking, Job, User, FinanceStats } from '../types';
import { Badge, Button, ProgressBar, Card, Heading, Text } from '../components/ui';
import { 
  ArrowUpRight, Clock, Shield, Landmark, Target, WalletCards, Lock, ChevronRight, UserPlus, Activity, Users, AlertCircle, TrendingUp, Zap, Plus, Calendar as CalendarIcon, Filter, Crosshair, Hexagon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const StatBox = ({ label, value, subtext, highlight = false, icon: Icon, onClick }: { label: string, value: string, subtext?: string, highlight?: boolean, icon?: any, onClick?: () => void }) => (
  <div onClick={onClick} className={clsx("p-10 bg-[#050505] transition-all duration-700 relative group overflow-hidden border", highlight ? "border-accent/40 bg-accent/[0.02]" : "border-white/5 hover:border-accent/20", onClick && "cursor-pointer")}>
    <div className="flex justify-between items-start relative z-10">
      <div className="flex items-center gap-3">
        <div className={clsx("w-1 h-3", highlight ? "bg-accent" : "bg-white/20")}></div>
        <span className={clsx("text-[9px] font-black uppercase tracking-[0.5em] italic", highlight ? "text-accent" : "text-white/30")}>{label}</span>
      </div>
      {Icon && <Icon size={12} className={highlight ? "text-accent animate-pulse" : "text-white/10"} />}
    </div>
    <div className={clsx("text-6xl md:text-7xl font-serif mt-8 mb-2 tracking-tighter italic relative z-10", highlight ? "text-accent" : "text-white")}>{value}</div>
    {subtext && <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 relative z-10 italic border-t border-white/5 pt-4 inline-block">{subtext}</p>}
    <div className="absolute -bottom-4 -right-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
       <Hexagon size={120} />
    </div>
  </div>
);

const AgentGanttChart = ({ user }: { user: User }) => {
  const navigate = useNavigate();
  const roster = user.managedUsers || [];
  
  const timeline = useMemo(() => {
    const days = [];
    const start = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const rosterData = useMemo(() => {
    return roster.map(client => ({
      client,
      jobs: api.jobs.list(client.id)
    }));
  }, [roster]);

  const getJobStyle = (job: Job) => {
    const start = new Date(job.startDate);
    const end = job.endDate ? new Date(job.endDate) : new Date(job.startDate);
    const timelineStart = timeline[0].getTime();
    const dayWidth = 100 / 30;
    const diffStart = Math.max(0, (start.getTime() - timelineStart) / (1000 * 60 * 60 * 24));
    const diffEnd = Math.max(0, (end.getTime() - timelineStart) / (1000 * 60 * 60 * 24)) + 1;

    if (diffStart >= 30 || (diffEnd <= 0 && job.endDate)) return null;

    const left = Math.max(0, diffStart) * dayWidth;
    const width = Math.min(30 - diffStart, diffEnd - Math.max(0, diffStart)) * dayWidth;

    return { 
      left: `${left}%`, 
      width: `${width}%`,
      backgroundColor: job.status === 'CONFIRMED' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
      border: job.status === 'TENTATIVE' ? '1px dashed rgba(250,204,21,0.3)' : 'none'
    };
  };

  return (
    <div className="space-y-20 animate-in fade-in duration-1000 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 pb-16 border-b border-white/10">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Badge color="accent" className="italic tracking-widest uppercase">Command Console v1.0</Badge>
            <div className="w-px h-6 bg-white/10"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">System Stable</span>
          </div>
          <h1 className="text-8xl md:text-9xl font-serif text-white leading-[0.7] uppercase tracking-tighter italic">TACTICAL <br /><span className="text-accent">ROSTER.</span></h1>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="h-16 px-8 text-[10px] font-black uppercase tracking-[0.4em] italic border-white/10">
            <Filter size={14} className="mr-3" /> Filters
          </Button>
          <Button onClick={() => navigate('/app/jobs/new')} className="h-16 px-12 text-[10px] font-black tracking-[0.5em] accent-glow uppercase">
            Deploy Talent <Plus size={14} className="ml-3" />
          </Button>
        </div>
      </header>

      {/* Modern Tactical Gantt */}
      <div className="bg-[#050505] border border-white/5 shadow-2xl overflow-x-auto">
        <div className="min-w-[1400px]">
          {/* Header Axis */}
          <div className="grid grid-cols-[320px_1fr] border-b border-white/10">
            <div className="p-8 border-r border-white/10 flex items-center gap-4 bg-[#080808]">
               <Crosshair size={16} className="text-accent" />
               <span className="text-[11px] font-black uppercase tracking-widest text-white italic">Active Coordinates</span>
            </div>
            <div className="grid grid-cols-30">
              {timeline.map((date, i) => (
                <div key={i} className={clsx(
                  "h-20 flex flex-col items-center justify-center border-r border-white/5 transition-colors",
                  date.getDay() === 0 || date.getDay() === 6 ? "bg-white/[0.01]" : "hover:bg-white/[0.03]"
                )}>
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-tighter">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className={clsx("text-xs font-serif mt-1 italic", i === 0 ? "text-accent" : "text-white/40")}>{date.getDate()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Roster Stream */}
          <div className="divide-y divide-white/5">
            {rosterData.map(({ client, jobs }) => (
              <div key={client.id} className="grid grid-cols-[320px_1fr] group hover:bg-white/[0.02] transition-colors relative">
                <div 
                  onClick={() => api.auth.switchClient(client.id)}
                  className="p-8 border-r border-white/10 flex items-center gap-6 cursor-pointer hover:bg-white/5 transition-colors bg-[#080808]/50"
                >
                  <div className="relative">
                    <div className="w-16 h-16 border border-white/10 flex items-center justify-center font-serif italic text-2xl text-white group-hover:bg-accent group-hover:text-black transition-all">
                      {client.name.charAt(0)}
                    </div>
                    {jobs.length > 0 && <div className="absolute -top-2 -right-2 w-5 h-5 bg-accent text-black text-[10px] font-black flex items-center justify-center border-2 border-black">{jobs.length}</div>}
                  </div>
                  <div className="truncate">
                    <h4 className="text-2xl font-serif italic text-white leading-none truncate group-hover:text-accent transition-colors">{client.name}</h4>
                    <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mt-3 truncate">{client.role || client.selectedRoles?.[0] || 'Member'}</p>
                  </div>
                </div>

                <div className="relative grid grid-cols-30">
                  {timeline.map((_, i) => (
                    <div key={i} className="border-r border-white/5 h-full pointer-events-none" />
                  ))}

                  {/* High-Resolution Booking Bars */}
                  {jobs.map(job => {
                    const style = getJobStyle(job);
                    if (!style) return null;
                    return (
                      <div
                        key={job.id}
                        onClick={() => navigate(`/app/jobs/${job.id}`)}
                        className={clsx(
                          "absolute top-1/2 -translate-y-1/2 h-10 cursor-pointer transition-all hover:scale-y-110 z-10 group/bar flex items-center px-4 shadow-xl",
                          job.status === 'CONFIRMED' ? "text-black" : "text-accent"
                        )}
                        style={style}
                      >
                         <div className="flex items-center gap-3 overflow-hidden">
                           <div className={clsx("w-1 h-4", job.status === 'CONFIRMED' ? "bg-black/30" : "bg-accent")}></div>
                           <span className="text-[9px] font-black uppercase tracking-tighter truncate opacity-0 group-hover/bar:opacity-100 transition-all">
                             {job.productionName}
                           </span>
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Visual Identity Legend */}
      <div className="flex flex-wrap items-center gap-10 p-10 bg-[#080808] border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-accent"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Confirmed Deployment</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border border-accent/40 bg-accent/5"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Tentative Holding</span>
        </div>
        <div className="w-px h-6 bg-white/10"></div>
        <div className="flex items-center gap-3">
           <Activity size={14} className="text-accent/40" />
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Live Roster Feed</span>
        </div>
      </div>
    </div>
  );
};

const IndividualDashboard = ({ jobs, tracking, user, financeStats }: { jobs: Job[], tracking: UserUnionTracking[], user: User, financeStats: FinanceStats }) => {
  const navigate = useNavigate();
  const primaryTrack = tracking[0];
  const { percent } = primaryTrack ? api.tracking.calculateProgress(primaryTrack.id, jobs) : { percent: 0 };
  const gstProgress = financeStats ? financeApi.getThresholdProgress(financeStats.grossIncomeYTD) : 0;

  return (
    <div className="space-y-24 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 pb-16 border-b border-white/10">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
             <Badge color="accent" className="italic tracking-widest uppercase">Professional Terminal v1.0</Badge>
          </div>
          <h1 className="text-9xl font-serif text-white leading-[0.7] uppercase tracking-tighter italic">THE <br /><span className="text-accent">WRAP.</span></h1>
        </div>
        <Button onClick={() => navigate('/app/jobs/new')} className="h-20 px-16 text-[12px] font-black tracking-[0.6em] accent-glow uppercase">Secure Log <Plus size={16} className="ml-4" /></Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
        <StatBox label="Guild Vector" value={`${Math.round(percent)}%`} subtext={primaryTrack ? `${primaryTrack.unionName} Sync` : 'Unassigned'} highlight icon={Target} />
        <StatBox label="The Ledger" value={`$${((financeStats?.grossIncomeYTD || 0) / 1000).toFixed(1)}k`} subtext="YTD Gross Yield" icon={WalletCards} />
        <StatBox label="Tax Logic" value={`${Math.round(gstProgress)}%`} subtext="CRA Threshold" icon={Landmark} />
        <StatBox label="File Archive" value={api.vault.list().length.toString()} subtext="Verified Tokens" icon={Shield} />
      </div>

      <section className="bg-[#050505] p-16 space-y-16 border border-white/5 relative overflow-hidden">
         <div className="flex items-center gap-6">
            <h3 className="font-serif italic text-5xl text-white uppercase tracking-tight">Continuity Record</h3>
            <div className="flex-1 h-px bg-white/5"></div>
         </div>
         <div className="space-y-24">
            {tracking.map(t => {
               const { percent, current, target } = api.tracking.calculateProgress(t.id, jobs);
               return (
                  <div key={t.id} className="space-y-10 group">
                     <div className="flex justify-between items-end">
                        <div className="space-y-2">
                           <span className="text-4xl font-serif text-white italic group-hover:text-accent transition-colors">{t.unionName} Trajectory</span>
                           <p className="text-[9px] text-white/30 uppercase font-black tracking-widest italic">{current.toLocaleString()} / {target.toLocaleString()} Units Completed</p>
                        </div>
                        <span className="text-8xl font-serif text-white italic opacity-40 group-hover:opacity-100 transition-all">{Math.round(percent)}%</span>
                     </div>
                     <ProgressBar progress={percent} />
                  </div>
               );
            })}
         </div>
         <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
            <Hexagon size={200} />
         </div>
      </section>
    </div>
  );
};

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const user = api.auth.getUser();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tracking, setTracking] = useState<UserUnionTracking[]>([]);
  const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setJobs(api.jobs.list());
      setTracking(api.tracking.get());
      setFinanceStats(financeApi.getStats());
      setLoading(false);
    };
    load();
  }, [user]);

  if (!user || loading) return null;

  return user.accountType === 'AGENT' && !user.activeViewId
    ? <AgentGanttChart user={user} />
    : <IndividualDashboard jobs={jobs} tracking={tracking} user={user} financeStats={financeStats!} />;
};
