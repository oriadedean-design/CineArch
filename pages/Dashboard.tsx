
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { UserUnionTracking, Job, User } from '../types';
import { Heading, Text, Card, Badge, Button, ProgressBar } from '../components/ui';
import { Plus, ArrowUpRight, DollarSign, Lock, Activity, TrendingUp, Users, Calendar, Briefcase, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

// Cinematic Progress Component
const CinematicTracker = ({ track, jobs, allTrackings }: { track: UserUnionTracking, jobs: Job[], allTrackings: UserUnionTracking[] }) => {
  // Use the helper on the client side for now to calculate progress
  const { current, target, percent } = api.tracking.calculateProgress(track.id, jobs, allTrackings);
  
  return (
    <div className="group relative">
      <div className="flex justify-between items-end mb-3">
        <div>
           <div className="flex items-center gap-2">
              <span className="text-accent text-[10px] font-bold uppercase tracking-widest border border-accent/30 px-1.5 rounded">{track.tierLabel}</span>
              {track.department && <span className="text-textTertiary text-[10px] font-bold uppercase tracking-widest">{track.department}</span>}
           </div>
           <h3 className="text-2xl font-serif text-light mt-1 group-hover:text-accent transition-colors">{track.unionName}</h3>
        </div>
        <div className="text-right">
           <span className="text-3xl font-bold text-light tabular-nums">{Math.round(percent)}%</span>
        </div>
      </div>
      
      <div className="relative h-2 bg-surfaceHighlight rounded-full overflow-hidden">
         <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent to-secondary shadow-[0_0_15px_rgba(124,150,166,0.3)] transition-all duration-1000" 
            style={{ width: `${percent}%` }}
         />
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-textTertiary font-medium tracking-wide">
         <span>{current} / {target} {track.targetType.toLowerCase()}</span>
         <span className="uppercase">Eligibility Status</span>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subtext, highlight = false }: { label: string, value: string, subtext?: string, highlight?: boolean }) => (
    <div className={clsx("p-6 rounded-2xl border backdrop-blur-md transition-all duration-300 group", highlight ? "bg-accent/10 border-accent/30 hover:bg-accent/20" : "bg-surface border-light/10 hover:bg-white/5")}>
       <Text variant="caption" className={highlight ? "text-accent" : "text-textTertiary"}>{label}</Text>
       <div className={clsx("text-4xl md:text-5xl font-serif mt-2 mb-1 tracking-tight", highlight ? "text-accent drop-shadow-lg" : "text-light")}>{value}</div>
       {subtext && <div className="text-xs text-textTertiary group-hover:text-light transition-colors">{subtext}</div>}
    </div>
);

// --- AGENT DASHBOARD: GANTT VIEW ---
const AgentGanttChart = ({ user }: { user: User }) => {
    const navigate = useNavigate();
    const [rosterData, setRosterData] = useState<{client: User, jobs: Job[]}[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoster = async () => {
            // Mock: In real supabase we'd query jobs where user_id IN (managed_ids)
            setLoading(false);
        };
        fetchRoster();
    }, [user]);

    if (loading) return <Loader2 className="animate-spin text-accent"/>;

    // Simple time range: Today to +30 days
    const today = new Date();
    const daysToShow = 30;
    const timelineDates = Array.from({length: daysToShow}, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() + i);
        return d;
    });

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent">
                        <Users className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Agency View</span>
                    </div>
                    <Heading level={2}>Roster Schedule</Heading>
                    <Text className="text-textSecondary">Gantt visualization of active bookings.</Text>
                </div>
                <Button onClick={() => navigate('/jobs/new')}>
                    <Plus className="w-4 h-4 mr-2" /> Log Booking
                </Button>
            </div>

            <div className="overflow-x-auto pb-4">
               <div className="p-8 text-center text-textTertiary border border-light/10 rounded-xl">
                   Agent Dashboard connectivity coming in v2.
               </div>
            </div>
        </div>
    );
};


// --- STANDARD INDIVIDUAL DASHBOARD ---
export const Dashboard = () => {
  const navigate = useNavigate();
  const [tracking, setTracking] = useState<UserUnionTracking[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({ totalHours: 0, totalEarnings: 0, totalDeductions: 0 });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        const u = await api.auth.getUser();
        setUser(u);
        if (u) {
            const [t, j] = await Promise.all([
                api.tracking.get(),
                api.jobs.list()
            ]);
            setTracking(t);
            setJobs(j);
            
            const totalHours = j.reduce((sum, job) => sum + (job.status === 'CONFIRMED' ? job.totalHours : 0), 0);
            const totalEarnings = j.reduce((sum, job) => sum + (job.grossEarnings || 0), 0);
            const totalDeductions = j.reduce((sum, job) => sum + (job.unionDeductions || 0), 0);
            setStats({ totalHours, totalEarnings, totalDeductions });
        }
        setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-accent"/></div>;

  if (user?.accountType === 'AGENT') {
      return <AgentGanttChart user={user} />;
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-surface border border-light/10 p-8 md:p-12">
         {/* Abstract BG */}
         <div className="absolute inset-0 bg-[url('https://i.pinimg.com/1200x/5e/42/57/5e4257679a36daca5536198bb55a92dc.jpg')] bg-cover bg-center opacity-10 mix-blend-screen" />
         <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-2">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">System Online</span>
               </div>
               <Heading level={1}>Career Overview</Heading>
               <Text className="max-w-md text-textSecondary">Welcome back, {user?.name.split(' ')[0]}. Your automated compliance tracking is active.</Text>
            </div>
            <div className="flex gap-4">
               <Button onClick={() => navigate('/jobs/new')} variant="glass" className="h-12 border-light/20">
                  <Plus className="w-4 h-4 mr-2" /> Log Project
               </Button>
               <Button onClick={() => navigate('/reports')} variant="primary" className="h-12">
                  View Reports
               </Button>
            </div>
         </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <StatCard label="Total Hours" value={stats.totalHours.toString()} subtext="Confirmed On-Set" />
         <StatCard label="Est. Earnings" value={`$${(stats.totalEarnings / 1000).toFixed(1)}k`} subtext="Gross Income" />
         <StatCard label="Dues Pool" value={`$${stats.totalDeductions}`} subtext="Tax Deductible" highlight />
         <div onClick={() => navigate('/jobs')} className="p-6 rounded-2xl border border-light/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer flex flex-col justify-center items-center group">
            <div className="w-12 h-12 rounded-full border border-light/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform bg-white/5">
                <ArrowUpRight className="w-6 h-6 text-light" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-light">View All Logs</span>
         </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Progress Section */}
        <section>
           <div className="flex items-center justify-between mb-8">
              <Heading level={3}>Eligibility Trackers</Heading>
              <Button variant="ghost" onClick={() => navigate('/settings')} className="text-xs">Configure</Button>
           </div>
           
           <div className="space-y-6">
              {tracking.length === 0 ? (
                 <div className="p-8 border border-dashed border-light/20 rounded-2xl text-center">
                    <Text>No active trackers initialized.</Text>
                    <Button variant="outline" className="mt-4" onClick={() => navigate('/settings')}>Setup Targets</Button>
                 </div>
              ) : (
                 tracking.map(t => <CinematicTracker key={t.id} track={t} jobs={jobs} allTrackings={tracking} />)
              )}
           </div>
        </section>

        {/* Recent Projects (Jobs) */}
        <section>
           <div className="flex items-center justify-between mb-8">
              <Heading level={3}>Recent Projects</Heading>
              <Button variant="ghost" onClick={() => navigate('/jobs')} className="text-xs">View All</Button>
           </div>
           
           <div className="space-y-4">
              {jobs.slice(0, 3).map(job => (
                 <div 
                    key={job.id} 
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-surfaceHighlight/30 border border-light/5 hover:bg-white/5 hover:border-light/20 transition-all cursor-pointer group"
                 >
                    {/* Placeholder Project Image / Avatar */}
                    <div className="w-16 h-20 rounded-lg bg-background overflow-hidden relative border border-light/10 shrink-0">
                       <img 
                          src={job.imageUrl || `https://i.pinimg.com/736x/2f/e4/e2/2fe4e287633eaed874b09bb0ea45d695.jpg`} 
                          alt="Project" 
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                       />
                       {!job.isUnion && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-[8px] font-bold uppercase text-white/50">Indie</span></div>}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 mb-1">
                          {job.status === 'TENTATIVE' && <span className="w-2 h-2 rounded-full bg-tertiary" />}
                          <h4 className="text-lg font-serif text-light truncate group-hover:text-accent transition-colors">{job.productionName}</h4>
                       </div>
                       <p className="text-xs text-textTertiary uppercase tracking-wider">{job.role} • {new Date(job.startDate).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="text-right">
                       {job.isUnion ? (
                          <Badge color="neutral">{job.unionName}</Badge>
                       ) : (
                          <span className="text-[10px] text-textTertiary font-bold uppercase">Non-Union</span>
                       )}
                    </div>
                 </div>
              ))}
              {jobs.length === 0 && <Text variant="subtle">No projects logged.</Text>}
           </div>
        </section>
      </div>
    </div>
  );
};
