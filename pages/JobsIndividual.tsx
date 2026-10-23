
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { commissionsOn, type Rep } from '../services/representation';
import { api } from '../services/storage';
import { Job, User } from '../types';
import { Heading, Text, Button, Badge } from '../components/ui';
import { BulkJobUpload } from '../components/BulkJobUpload';
import { ProNudge } from '../components/ProNudge';
import { PLANS } from '../types';
import { UploadCloud, Plus, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export const JobsIndividual = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showIngest, setShowIngest] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [reps, setReps] = useState<Rep[]>([]);
  // Booked by, as on the phone: everyone, jobs you booked yourself, or one agent's.
  const [bookedBy, setBookedBy] = useState<'anyone' | 'me' | string>('anyone');

  const refresh = async () => {
    // Correctly await async session retrieval
    const u = await api.auth.getUser();
    setUser(u);
    const jobList = await api.jobs.list();
    setJobs(jobList);
    const { data } = await supabase.from('representatives').select('id, name, commission_pct, applies_to').order('created_at');
    setReps((data ?? []) as Rep[]);
  };
  
  useEffect(() => { refresh(); }, []);

  const agents = useMemo(() => [...new Set(jobs.map(j => j.agentName).filter((a): a is string => !!a))].sort(), [jobs]);
  const shown = jobs.filter(j =>
    bookedBy === 'anyone' ? true
    : bookedBy === 'me' ? !j.agentName && !j.representativeId
    : j.agentName === bookedBy);
  const worked = shown.filter(j => j.status !== 'TENTATIVE');
  const gross = worked.reduce((s, j) => s + (j.grossEarnings || 0), 0);
  const cut = bookedBy === 'anyone' || bookedBy === 'me' ? 0
    : worked.reduce((s, j) => s + commissionsOn(j, reps).filter(c => c.rep.name === bookedBy).reduce((t, c) => t + c.amount, 0), 0);
  const money = (n: number) => `$${n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const pctOf = (name: string) => reps.find(r => r.name === name)?.commission_pct;
  const chip = (on: boolean) => clsx('h-11 px-4 border text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap',
    on ? 'bg-accent text-black border-accent' : 'border-white/15 text-white/70 hover:text-white hover:border-white/40');

  return (
    <div className="space-y-10 md:space-y-16 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 pb-8 md:pb-12 border-b border-white/10">
        <div className="space-y-2">
           <Text variant="caption">Every day you've logged</Text>
           <Heading level={1} className="font-serif italic text-white tracking-tighter text-6xl md:text-7xl leading-none">The Slate.</Heading>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto">
          <Button variant="outline" onClick={() => setShowIngest(!showIngest)} className={clsx("h-14 md:h-16 border-white/10 flex justify-center items-center", showIngest && "bg-white text-black")}>
             <UploadCloud size={16} className="mr-3" /> Ingest Dailies
          </Button>
          <Button onClick={() => navigate('/jobs/new')} className="bg-accent text-black h-14 md:h-16 px-8 md:px-12 font-black flex justify-center items-center">Mark the slate</Button>
        </div>
      </header>

      {jobs.length >= 10 && (
        <ProNudge id="ledger-reports" user={user} title={`${jobs.length} jobs on your Slate.`}
          detail={`Your Ledger turns them into a PDF or spreadsheet for union applications and tax time. ${PLANS.pro.label}.`} />
      )}

      {showIngest && <div className="animate-in slide-in-from-top-4 duration-500"><BulkJobUpload userId={user?.id || 'anon'} onComplete={() => { setShowIngest(false); refresh(); }} /></div>}

      {agents.length > 0 && (
        <section aria-label="Booked by" className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">Booked by</p>
          <div role="radiogroup" aria-label="Booked by" className="flex gap-2 overflow-x-auto pb-1">
            <button role="radio" aria-checked={bookedBy === 'anyone'} onClick={() => setBookedBy('anyone')} className={chip(bookedBy === 'anyone')}>Anyone</button>
            <button role="radio" aria-checked={bookedBy === 'me'} onClick={() => setBookedBy('me')} className={chip(bookedBy === 'me')}>Me</button>
            {agents.map(a => (
              <button key={a} role="radio" aria-checked={bookedBy === a} onClick={() => setBookedBy(a)} className={chip(bookedBy === a)}>
                {a}{pctOf(a) != null && ` · ${Number(pctOf(a))}%`}
              </button>
            ))}
          </div>
          {bookedBy !== 'anyone' && (
            <p className="text-xs text-white/50" role="status">
              {shown.length} job{shown.length === 1 ? '' : 's'} {bookedBy === 'me' ? 'you booked yourself' : `booked by ${bookedBy}`}, {money(gross)}
              {cut > 0 && `. Their commission: ${money(cut)}`}.
            </p>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5 md:gap-1">
        {shown.map(job => (
          <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="glass-ui p-6 md:p-12 hover:border-accent/40 transition-all cursor-pointer space-y-6 md:space-y-8">
            <div className="flex justify-between items-start">
               <Badge color={job.isUnion ? "accent" : "neutral"}>{job.isUnion ? `${job.unionName}${job.hiredAs === 'cash' ? ' · Cash' : ''}` : 'Non-Union'}</Badge>
               <span className="text-xs md:text-xs font-black text-white/20 uppercase tracking-widest italic">{job.startDate}</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-serif italic text-white leading-tight min-h-[2.5em]">{job.productionName}</h3>
            <div className="pt-6 md:pt-8 border-t border-white/5">
               <p className="text-xs md:text-[10px] font-black text-white/40 uppercase tracking-widest">{job.role}{job.companyName && ` · ${job.companyName}`}</p>
               <p className="text-xl md:text-2xl font-serif italic text-white mt-1 md:mt-2">${(job.grossEarnings || 0).toLocaleString('en-CA', { maximumFractionDigits: 2 })}</p>
               <p className="text-xs text-white/40 italic mt-1">
                 {(job.totalHours || 0).toLocaleString('en-CA', { maximumFractionDigits: 2 })}h{(job.daysWorked ?? 1) > 1 && ` over ${job.daysWorked} days`}
                 {job.hourlyRate != null && ` · $${job.hourlyRate.toFixed(2)}/hr`}
                 {job.isUnion && job.unionMinimumRate != null && job.hourlyRate != null && job.hourlyRate < job.unionMinimumRate - 0.004 && <span className="text-red-400"> · below scale</span>}
               </p>
            </div>
          </div>
        ))}
        {jobs.length > 0 && shown.length === 0 && (
          <p className="col-span-full py-16 text-center text-white/40 italic">No jobs booked {bookedBy === 'me' ? 'by you' : `by ${bookedBy}`} yet.</p>
        )}
        {jobs.length === 0 && (
          <div className="col-span-full py-24 md:py-40 text-center border border-dashed border-white/5 opacity-30 italic">
             <Layers className="mx-auto mb-4 md:mb-6 opacity-20 w-8 h-8 md:w-12 md:h-12" />
             Nothing in the can yet. Hit the clapperboard to mark your first day.
          </div>
        )}
      </div>
    </div>
  );
};
