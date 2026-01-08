import React, { useState, useEffect } from 'react';
import { api } from '../services/storage';
import { Job, User } from '../types';
import { Heading, Text, Button, Badge } from '../components/ui';
import { BulkJobUploadEnterprise } from '../components/BulkJobUploadEnterprise';
import { Shield, UploadCloud, Plus, UserCheck, Lock, Layers, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export const JobsEnterprise = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<{job: Job, clientName: string}[]>([]);
  const [showIngest, setShowIngest] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const u = await api.auth.getUser();
      setUser(u);
      
      if (!u?.managedUsers || u.managedUsers.length === 0) {
        setJobs([]);
        return;
      }

      const allJobs: {job: Job, clientName: string}[] = [];
      
      // Aggregate jobs across all managed users
      await Promise.all(u.managedUsers.map(async (client) => {
        const clientJobs = await api.jobs.listForClient(client.id);
        clientJobs.forEach((j: Job) => {
          allJobs.push({ job: j, clientName: client.name });
        });
      }));

      // Sort by start date descending
      setJobs(allJobs.sort((a, b) => 
        new Date(b.job.startDate).getTime() - new Date(a.job.startDate).getTime()
      ));
    } catch (err) {
      console.error("Aggregation Failure:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    refresh(); 
  }, []);

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-white/10">
        <div className="space-y-2">
           <Badge color="accent" className="italic tracking-widest uppercase">Master Ledger // Aggregate View</Badge>
           <h1 className="heading-huge text-white uppercase italic leading-none">THE <br/><span className="text-accent">AGGREGATE.</span></h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={() => setShowIngest(!showIngest)} 
            className={clsx(
              "h-16 border-white/10 flex justify-center items-center", 
              showIngest && "bg-white text-black"
            )}
          >
             <UploadCloud size={16} className="mr-3" /> Ingest Roster
          </Button>
          <Button 
            onClick={() => navigate('/roster')} 
            className="bg-accent text-black h-16 px-12 font-black flex justify-center items-center shadow-glow"
          >
            Manage Roster
          </Button>
        </div>
      </header>

      {showIngest && (
        <div className="animate-in slide-in-from-top-4 duration-500 max-w-2xl mx-auto">
          <BulkJobUploadEnterprise 
            userId={user?.id || 'anon'} 
            onComplete={() => { setShowIngest(false); refresh(); }} 
          />
        </div>
      )}

      <div className="space-y-12">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4 text-white/40">
              <Layers size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Active Mark Registry</span>
           </div>
           <div className="flex items-center gap-3 text-[9px] font-black uppercase text-white/20 italic">
              <Lock size={12} /> Restricted Personnel Access Protocol
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5 md:gap-1">
          {jobs.map(({ job, clientName }, idx) => (
            <div 
              key={`${job.id}-${idx}`} 
              className="glass-ui p-10 hover:border-accent/40 transition-all space-y-8 group border-white/5"
            >
              <div className="flex justify-between items-start">
                 <Badge color={job.isUnion ? "accent" : "neutral"}>
                   {job.isUnion ? job.unionName : 'Non-Union'}
                 </Badge>
                 <span className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">{job.startDate}</span>
              </div>
              
              <div className="space-y-2">
                 <p className="text-[9px] font-black text-accent uppercase tracking-widest italic">{clientName}</p>
                 <h3 className="text-3xl font-serif italic text-white leading-tight min-h-[2em] group-hover:text-accent transition-colors">
                   {job.productionName}
                 </h3>
              </div>

              <div className="pt-8 border-t border-white/5 flex justify-between items-end">
                 <div>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{job.role}</p>
                    <p className="text-xl font-serif italic text-white mt-1">Personnel Mark</p>
                 </div>
                 <Button 
                   variant="ghost" 
                   onClick={() => navigate(`/jobs/${job.id}`)}
                   className="h-10 px-4 min-h-0 text-[8px] border-white/10 hover:border-white/30"
                 >
                   Review Mark
                 </Button>
              </div>
            </div>
          ))}

          {!loading && jobs.length === 0 && (
            <div className="col-span-full py-40 text-center border border-dashed border-white/5 opacity-30 italic">
               <Shield className="mx-auto mb-6 opacity-20 w-12 h-12" strokeWidth={1} />
               No aggregate marks synchronized.
            </div>
          )}
          
          {loading && (
             <div className="col-span-full py-40 text-center border border-dashed border-white/5 opacity-30 italic animate-pulse">
                Synchronizing Master Ledger...
             </div>
          )}
        </div>
      </div>
    </div>
  );
};