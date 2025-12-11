
import React, { useEffect, useState } from 'react';
import { api } from '../services/storage';
import { UserUnionTracking, Job } from '../types';
import { Heading, Text, Card, Badge, Button } from '../components/ui';
import { Plus, ArrowUpRight, ArrowRight, DollarSign, Lock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

// Specialized Progress Bar for Potential Tracking
const DualProgressBar = ({ current, potential, max }: { current: number, potential: number, max: number }) => {
  const currentPct = Math.min((current / max) * 100, 100);
  const potentialPct = Math.min((potential / max) * 100, 100);
  
  return (
     <div className="w-full bg-neutral-100 h-2 overflow-hidden relative">
        {/* Ghost / Potential Bar */}
        <div 
           className="absolute top-0 left-0 h-full bg-[#121212] opacity-30 transition-all duration-700 ease-out" 
           style={{ width: `${potentialPct}%`, backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}
        />
        {/* Solid / Current Bar */}
        <div 
           className="absolute top-0 left-0 h-full bg-[#121212] transition-all duration-700 ease-out" 
           style={{ width: `${currentPct}%` }}
        />
     </div>
  );
};

const ProgressSection: React.FC<{ track: UserUnionTracking, jobs: Job[] }> = ({ track, jobs }) => {
  const { current, potential, target, percent, potentialPercent } = api.tracking.calculateProgress(track.id, jobs);
  const isHours = track.targetType === 'HOURS';
  
  return (
    <div className="border-t border-neutral-200 py-6 first:border-t-0">
      <div className="flex justify-between items-baseline mb-4">
        <div className="flex items-center gap-2">
            <h3 className="text-xl font-serif">{track.unionName}</h3>
            {track.department && (
                <span className="text-xs bg-[#F3F3F1] px-2 py-1 uppercase tracking-wider text-neutral-600 font-medium">
                    {track.department}
                </span>
            )}
        </div>
        <div className="flex flex-col items-end">
             <span className="text-sm font-medium text-neutral-400">{track.tierLabel}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-8 items-end">
         <div className="col-span-8 md:col-span-10">
            <DualProgressBar current={current} potential={potential} max={target} />
            <div className="flex justify-between text-xs font-medium tracking-wide uppercase text-neutral-500 mt-3">
              <span className="flex items-center gap-2">
                 {current} / {target} {track.targetType === 'EARNINGS' ? '$' : isHours ? 'hrs' : track.targetType.toLowerCase()}
                 {potential > current && <span className="text-neutral-300">({potential} projected)</span>}
              </span>
            </div>
         </div>
         <div className="col-span-4 md:col-span-2 text-right">
            <span className={clsx("text-3xl font-serif", percent >= 100 ? "text-[#121212]" : "text-neutral-600")}>
               {Math.round(percent)}%
            </span>
         </div>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const [tracking, setTracking] = useState<UserUnionTracking[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({ totalHours: 0, totalJobs: 0, totalDocs: 0, totalEarnings: 0, totalDeductions: 0 });
  const user = api.auth.getUser();

  useEffect(() => {
    const t = api.tracking.get();
    const j = api.jobs.list();
    setTracking(t);
    setJobs(j);

    const totalHours = j.reduce((sum, job) => sum + (job.status === 'CONFIRMED' ? job.totalHours : 0), 0);
    const totalDocs = j.reduce((sum, job) => sum + (job.documentCount || 0), 0);
    const totalEarnings = j.reduce((sum, job) => sum + (job.grossEarnings || 0), 0);
    const totalDeductions = j.reduce((sum, job) => sum + (job.unionDeductions || 0), 0);
    setStats({ totalHours, totalJobs: j.length, totalDocs, totalEarnings, totalDeductions });
  }, []);

  return (
    <div className="space-y-16">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Text variant="caption">Industry Interface</Text>
          <Heading level={1}>Dashboard</Heading>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate('/jobs/new')} className="hidden md:flex">
            Log Job
          </Button>
          <Button variant="primary" onClick={() => navigate('/reports')}>
            Export Report
          </Button>
        </div>
      </header>

      {/* Stats Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-200 border border-neutral-200">
         <div className="bg-white p-6 md:p-8">
            <Text variant="caption" className="mb-2">Total Hours</Text>
            <div className="text-3xl md:text-4xl font-serif">{stats.totalHours}</div>
         </div>
         <div className="bg-white p-6 md:p-8 relative overflow-hidden">
            {!user?.isPremium && (
               <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                  <Lock className="w-6 h-6 text-neutral-400" />
               </div>
            )}
            <Text variant="caption" className="mb-2">Est. Income</Text>
            <div className="text-3xl md:text-4xl font-serif flex items-baseline">
                <span className="text-lg mr-1 text-neutral-400">$</span>
                {(stats.totalEarnings / 1000).toFixed(1)}k
            </div>
         </div>
         <div className="bg-white p-6 md:p-8 relative">
            <Text variant="caption" className="mb-2">Dues Pool</Text>
            <div className="text-3xl md:text-4xl font-serif text-[#C73E1D] flex items-baseline">
               <span className="text-lg mr-1 text-red-200">$</span>
               {stats.totalDeductions}
            </div>
            <Text variant="small" className="mt-1 text-neutral-400">Projected Savings</Text>
         </div>
         <div className="bg-white p-6 md:p-8 flex items-end justify-between cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => navigate('/jobs/new')}>
             <div className="text-sm font-medium underline">Log new entry</div>
             <ArrowUpRight className="w-5 h-5" />
         </div>
      </section>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Union Progress */}
        <section>
          <div className="flex items-center justify-between mb-8 border-b border-[#121212] pb-2">
             <Heading level={3}>{user?.memberStatus === 'MEMBER' ? 'Membership Maintenance' : 'Eligibility Tracker'}</Heading>
             <button onClick={() => navigate('/settings')} className="text-xs uppercase tracking-widest font-medium text-neutral-400 hover:text-neutral-900">Configure</button>
          </div>
          
          {tracking.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-neutral-300">
              <Text className="mb-4">No tracking set up.</Text>
              <Button variant="secondary" onClick={() => navigate('/settings')}>Start Tracking</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {tracking.map(t => <ProgressSection key={t.id} track={t} jobs={jobs} />)}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-8 border-b border-[#121212] pb-2">
             <Heading level={3}>Activity Log</Heading>
             <button onClick={() => navigate('/jobs')} className="text-xs uppercase tracking-widest font-medium text-neutral-400 hover:text-neutral-900">View All</button>
          </div>

          <div className="space-y-0">
            {jobs.length === 0 ? (
               <Text variant="subtle">No jobs logged yet.</Text>
            ) : (
              jobs.slice(0, 4).map(job => (
                <div 
                  key={job.id} 
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="group py-4 border-b border-neutral-100 flex justify-between items-center cursor-pointer hover:pl-2 transition-all"
                >
                  <div>
                    <h4 className="font-serif text-lg group-hover:text-[#C73E1D] transition-colors flex items-center gap-2">
                        {job.productionName}
                        {job.status === 'TENTATIVE' && <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1 uppercase font-bold border border-neutral-200">Hold</span>}
                    </h4>
                    <Text variant="small">{job.role} — {new Date(job.startDate).toLocaleDateString()}</Text>
                  </div>
                  {job.isUnion ? (
                    <Badge color="neutral">{job.unionName}</Badge>
                  ) : (
                    <span className="text-xs text-neutral-300">NON-UNION</span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
