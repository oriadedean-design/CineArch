
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/storage';
import { Job, User, UserUnionTracking } from '../types';
import { Heading, Badge, Card, Button } from '../components/ui';
import { GanttChartSquare, Zap, Users, Briefcase, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

interface RosterMember {
  client: User;
  jobs: Job[];
  tracks: UserUnionTracking[];
}

export const DashboardEnterprise = () => {
  const navigate = useNavigate();
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const user = api.auth.getUser();

  useEffect(() => {
    const data: RosterMember[] = (user?.managedUsers || []).map(client => {
      const jobsStr = localStorage.getItem(`cinearch_data_jobs_${client.id}`);
      const tracksStr = localStorage.getItem(`cinearch_data_tracking_${client.id}`);
      return { 
        client, 
        jobs: (jobsStr ? JSON.parse(jobsStr) : []) as Job[],
        tracks: (tracksStr ? JSON.parse(tracksStr) : []) as UserUnionTracking[]
      };
    });
    setRoster(data);
  }, [user]);

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  return (
    <div className="space-y-24 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 pb-16 border-b border-white/10 relative">
        <div className="space-y-6">
           <div className="flex items-center gap-4 mb-2 text-accent">
              <Zap className="w-6 h-6 fill-current" />
              <span className="text-[11px] font-black uppercase tracking-[0.6em] italic">Agency Intelligence v1.0</span>
           </div>
           <h1 className="heading-huge text-white uppercase italic">SHOW <br /><span className="text-accent">RUNNER.</span></h1>
        </div>
        <div className="glass-ui p-12 min-w-[320px] text-center space-y-4 border-accent/20 bg-accent/5">
           <span className="text-[10px] font-black uppercase tracking-[0.5em] text-accent italic">Active Roster Sync</span>
           <div className="text-8xl font-serif text-white italic leading-none">{roster.length}</div>
           <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] mt-4 italic">Personnel Verified</p>
        </div>
      </header>

      <section className="space-y-12">
         <div className="flex items-center gap-6">
            <GanttChartSquare className="text-accent" size={24} />
            <h3 className="font-serif italic text-5xl text-white">Tactical Schedule</h3>
         </div>
         <Card className="p-0 overflow-hidden border-white/10 bg-transparent overflow-x-auto">
            <div className="min-w-[1000px]">
               <div className="grid grid-cols-[250px_1fr] border-b border-white/5">
                  <div className="p-6 border-r border-white/5 text-[10px] font-black uppercase tracking-widest text-white/20 italic">Personnel</div>
                  <div className="grid grid-cols-12">
                     {months.map(m => (
                        <div key={m} className="p-6 text-center text-[9px] font-black text-white/20 tracking-widest border-r border-white/5 last:border-none">{m}</div>
                     ))}
                  </div>
               </div>
               <div className="divide-y divide-white/5">
                  {roster.map(({ client, jobs }) => (
                     <div key={client.id} className="grid grid-cols-[250px_1fr] group">
                        <div className="p-8 border-r border-white/5 flex items-center gap-4 group-hover:bg-white/[0.02] transition-colors">
                           <div className="w-8 h-8 bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-black italic text-accent">{client.name.charAt(0)}</div>
                           <span className="text-sm font-serif italic text-white/60 group-hover:text-white">{client.name}</span>
                        </div>
                        <div className="grid grid-cols-12 relative h-16 items-center">
                           {jobs.map((job, i) => {
                              const start = new Date(job.startDate).getMonth();
                              return (
                                 <div 
                                    key={i}
                                    className="absolute h-3 bg-accent/40 border-l border-r border-accent hover:h-6 hover:bg-accent transition-all cursor-pointer"
                                    style={{ left: `${(start / 12) * 100}%`, width: '8%', top: '50%', transform: 'translateY(-50%)' }}
                                    title={`${job.productionName} (${job.role})`}
                                 />
                              );
                           })}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </Card>
      </section>

      <div className="grid lg:grid-cols-3 gap-1">
         <Card className="p-12 border-accent/20 bg-accent/5 space-y-8">
            <Users className="text-accent" size={32} strokeWidth={1} />
            <h4 className="text-3xl font-serif italic text-white">Management</h4>
            <Button onClick={() => navigate('/roster')} className="w-full h-16 bg-white text-black text-[10px] tracking-widest">Open Roster Terminal</Button>
         </Card>
         <Card className="p-12 space-y-8">
            <Briefcase className="text-white/20" size={32} strokeWidth={1} />
            <h4 className="text-3xl font-serif italic text-white">Bulk Audit</h4>
            <Button onClick={() => navigate('/settings')} variant="outline" className="w-full h-16 text-[10px] tracking-widest">Organization Logs</Button>
         </Card>
         <Card className="p-12 space-y-8">
            <Plus className="text-white/20" size={32} strokeWidth={1} />
            <h4 className="text-3xl font-serif italic text-white">Quick Ingest</h4>
            <Button onClick={() => navigate('/jobs/new')} variant="outline" className="w-full h-16 text-[10px] tracking-widest">Mark Slate</Button>
         </Card>
      </div>
    </div>
  );
};
