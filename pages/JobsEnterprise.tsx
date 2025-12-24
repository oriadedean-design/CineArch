
import React, { useState, useEffect } from 'react';
import { api } from '../services/storage';
import { Job, User } from '../types';
import { Heading, Text, Button, Badge, Select } from '../components/ui';
import { BulkJobUploadEnterprise } from '../components/BulkJobUploadEnterprise';
import { Shield, UploadCloud, Plus, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export const JobsEnterprise = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<{job: Job, clientName: string}[]>([]);
  const [showIngest, setShowIngest] = useState(false);
  const user = api.auth.getUser();

  const refresh = () => {
    const allJobs: {job: Job, clientName: string}[] = [];
    (user?.managedUsers || []).forEach(client => {
      const clientJobs = JSON.parse(localStorage.getItem(`cinearch_data_jobs_${client.id}`) || '[]');
      clientJobs.forEach((j: Job) => allJobs.push({ job: j, clientName: client.name }));
    });
    setJobs(allJobs.sort((a,b) => new Date(b.job.startDate).getTime() - new Date(a.job.startDate).getTime()));
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-white/10">
        <div className="space-y-2">
           <Badge color="accent" className="italic tracking-widest uppercase">Master Ledger</Badge>
           <h1 className="heading-huge text-white uppercase italic leading-none">THE <br/><span className="text-accent">AGGREGATE.</span></h1>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setShowIngest(!showIngest)} className={clsx("h-16 border-white/10", showIngest && "bg-white text-black")}>
             <UploadCloud size={16} className="mr-3" /> Master Ingest
          </Button>
          <Button onClick={() => navigate('/roster')} className="bg-white text-black h-16 px-12 font-black">Manage Roster</Button>
        </div>
      </header>

      {showIngest && <BulkJobUploadEnterprise userId={user?.id || 'anon'} onComplete={() => { setShowIngest(false); refresh(); }} />}

      <div className="grid grid-cols-1 gap-1">
        {jobs.map(({ job, clientName }) => (
          <div key={job.id} className="glass-ui p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-white/[0.02] transition-all">
             <div className="flex items-center gap-10">
                <div className="w-14 h-14 bg-accent/5 border border-accent/20 flex items-center justify-center font-serif italic text-2xl text-accent">
                   {clientName.charAt(0)}
                </div>
                <div className="space-y-1">
                   <h3 className="text-3xl font-serif italic text-white leading-none">{job.productionName}</h3>
                   <div className="flex gap-4 items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-accent">{clientName}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">{job.role}</span>
                   </div>
                </div>
             </div>
             <div className="flex items-center gap-12 text-right">
                <div>
                   <span className="text-[9px] font-black uppercase tracking-widest text-white/20 italic block mb-1">Scale</span>
                   <span className="text-xl font-serif italic text-white">${(job.grossEarnings || 0).toLocaleString()}</span>
                </div>
                <Badge color={job.isUnion ? "accent" : "neutral"}>{job.isUnion ? job.unionName : "Non-Union"}</Badge>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">{job.startDate}</span>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
