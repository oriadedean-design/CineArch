
import React, { useState, useEffect } from 'react';
import { api } from '../services/storage';
import { Job } from '../types';
import { Heading, Text, Button, Badge } from '../components/ui';
import { BulkJobUploadIndividual } from '../components/BulkJobUploadIndividual';
import { UploadCloud, Plus, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export const JobsIndividual = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showIngest, setShowIngest] = useState(false);
  const user = api.auth.getUser();

  const refresh = () => setJobs(api.jobs.list());
  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-white/10">
        <div className="space-y-2">
           <Text variant="caption">Production Ledger</Text>
           <Heading level={1} className="font-serif italic text-white tracking-tighter text-7xl leading-none">The Slate.</Heading>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setShowIngest(!showIngest)} className={clsx("h-16 border-white/10", showIngest && "bg-white text-black")}>
             <UploadCloud size={16} className="mr-3" /> Ingest Dailies
          </Button>
          <Button onClick={() => navigate('/jobs/new')} className="bg-accent text-black h-16 px-12 font-black">Mark Slate</Button>
        </div>
      </header>

      {showIngest && <BulkJobUploadIndividual userId={user?.id || 'anon'} onComplete={() => { setShowIngest(false); refresh(); }} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
        {jobs.map(job => (
          <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="glass-ui p-12 hover:border-accent/40 transition-all cursor-pointer space-y-8">
            <div className="flex justify-between items-start">
               <Badge color={job.isUnion ? "accent" : "neutral"}>{job.isUnion ? job.unionName : 'Non-Union'}</Badge>
               <span className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">{job.startDate}</span>
            </div>
            <h3 className="text-4xl font-serif italic text-white leading-tight">{job.productionName}</h3>
            <div className="pt-8 border-t border-white/5">
               <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{job.role}</p>
               <p className="text-2xl font-serif italic text-white mt-2">${(job.grossEarnings || 0).toLocaleString()}</p>
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="col-span-full py-40 text-center border border-dashed border-white/5 opacity-30 italic">
             <Layers className="mx-auto mb-6 opacity-20" size={48} />
             Personnel slate is clear. No records found.
          </div>
        )}
      </div>
    </div>
  );
};
