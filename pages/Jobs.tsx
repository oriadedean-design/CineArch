
import React, { useState, useEffect } from 'react';
import { api } from '../services/storage';
import { Job, UNIONS } from '../types';
import { INDUSTRY_DEPARTMENTS } from '../config/industry_roles';
import { Heading, Text, Button, Input, Select, Badge } from '../components/ui';
import { ArrowLeft, History, Plus, User as UserIcon, Building2, Film } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';

export const JobsList = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    setJobs(api.jobs.list());
  }, []);

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <div className="flex justify-between items-end border-b border-white/5 pb-12">
        <div className="space-y-2">
           <Text variant="caption">Production Ledger</Text>
           <Heading level={1} className="font-serif italic text-white tracking-tighter text-7xl uppercase">The Slate.</Heading>
        </div>
        <Button onClick={() => navigate('/app/jobs/new')} className="bg-accent text-black h-16 px-12 font-black italic">Mark Production</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
        {jobs.map((job) => (
          <div key={job.id} onClick={() => navigate(`/app/jobs/${job.id}`)} className="group glass-ui p-10 cursor-pointer border border-white/5 hover:border-accent/40 transition-all flex flex-col justify-between min-h-[250px]">
             <div className="space-y-4">
                <Badge color={job.isUnion ? "accent" : "neutral"}>{job.isUnion ? job.unionName : 'Indie'}</Badge>
                <h3 className="text-3xl font-serif text-white italic group-hover:text-accent transition-colors leading-tight">{job.productionName}</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">{job.role} // {job.startDate}</p>
             </div>
             <div className="pt-8 border-t border-white/5 flex justify-between items-end">
                <p className="text-2xl font-serif italic text-white">${(job.grossEarnings || 0).toLocaleString()}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const user = api.auth.getUser();
  const isShowrunner = user?.accountType === 'AGENT';

  const [form, setForm] = useState<Partial<Job>>({
    userId: user?.activeViewId || user?.id || '',
    productionName: '',
    companyName: '',
    role: '',
    department: '',
    isUnion: false,
    startDate: new Date().toISOString().split('T')[0],
    totalHours: 8,
    grossEarnings: 0
  });

  const [lastEntry, setLastEntry] = useState<Job | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      const existing = api.jobs.list().find(j => j.id === id);
      if (existing) setForm(existing);
    }
  }, [id, isNew]);

  // Memory Logic: Informs the next step after person selection
  useEffect(() => {
    if (form.userId) {
      const history = api.jobs.list(form.userId);
      if (history.length > 0) setLastEntry(history[0]);
    } else {
      setLastEntry(null);
    }
  }, [form.userId]);

  const handleContinueLast = () => {
    if (lastEntry) {
      setForm(prev => ({
        ...prev,
        productionName: lastEntry.productionName,
        companyName: lastEntry.companyName,
        role: lastEntry.role,
        department: lastEntry.department,
        isUnion: lastEntry.isUnion,
        unionTypeId: lastEntry.unionTypeId,
        grossEarnings: lastEntry.grossEarnings,
        totalHours: lastEntry.totalHours
      }));
    }
  };

  const handleSave = () => {
    if (!form.userId || !form.productionName || !form.role) {
      alert('Person, Title, and Canonical Role are mandatory.');
      return;
    }
    const jobData = {
      ...form,
      id: isNew ? `job_${Date.now()}` : id!,
      createdAt: new Date().toISOString(),
      documentCount: 0,
      unionName: form.isUnion ? UNIONS.find(u => u.id === form.unionTypeId)?.name : undefined
    } as Job;

    if (isNew) api.jobs.add(jobData); 
    else api.jobs.update(jobData);
    
    navigate(isShowrunner && !user?.activeViewId ? '/app/dashboard' : '/app/jobs');
  };

  const allRoles = INDUSTRY_DEPARTMENTS.flatMap(d => d.roles.map(r => ({ ...r, department: d.name })));

  return (
    <div className="max-w-5xl mx-auto space-y-20 animate-in fade-in duration-700">
      <div className="flex justify-between items-center border-b border-white/5 pb-10">
         <button onClick={() => navigate(-1)} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Discard
         </button>
         <Badge color="accent">Entry #{(id || 'new').substring(0, 8)}</Badge>
      </div>

      <div className="space-y-24">
         {/* AFFORDANCE STEP 1: Person Selector (Showrunners only) */}
         {isShowrunner && !user?.activeViewId && (
            <div className="space-y-8 animate-in slide-in-from-top-4">
               <label className="text-[10px] font-black uppercase tracking-[0.5em] text-accent italic flex items-center gap-3">
                  <UserIcon size={12} /> Target Talent Context
               </label>
               <Select 
                 value={form.userId} 
                 onChange={e => setForm({...form, userId: e.target.value})}
                 className="h-24 text-4xl font-serif italic"
               >
                  <option value="" className="bg-black text-white/20 italic">Select Talent Coordinator...</option>
                  {user.managedUsers?.map(u => (
                    <option key={u.id} value={u.id} className="bg-black text-white">{u.name}</option>
                  ))}
               </Select>
               
               {/* AFFORDANCE STEP 2: Memory/Suggestion */}
               {lastEntry && (
                  <div className="p-8 border border-accent/20 bg-accent/5 animate-in fade-in flex items-center justify-between">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-accent italic flex items-center gap-2">
                           <History size={10} /> Active Signal Inferred
                        </p>
                        <p className="text-sm text-white/60 italic font-light">Continue logging for <span className="text-white">"{lastEntry.productionName}"</span>?</p>
                     </div>
                     <Button variant="outline" onClick={handleContinueLast} className="h-10 px-6 text-[9px]">Apply Memory</Button>
                  </div>
               )}
            </div>
         )}

         {/* AFFORDANCE STEP 3: Production Identity */}
         <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
               <label className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 italic flex items-center gap-3">
                  <Film size={12} /> Production Title
               </label>
               <Input 
                  value={form.productionName} 
                  onChange={e => setForm({...form, productionName: e.target.value})}
                  className="h-20 text-3xl font-serif italic"
                  placeholder="e.g. Project 'X'"
               />
            </div>
            <div className="space-y-8">
               <label className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 italic flex items-center gap-3">
                  <Building2 size={12} /> Production Company
               </label>
               <Input 
                  value={form.companyName} 
                  onChange={e => setForm({...form, companyName: e.target.value})}
                  className="h-20 text-3xl font-serif italic"
                  placeholder="e.g. CineLab Inc."
               />
            </div>
         </div>

         {/* AFFORDANCE STEP 4: Canonical Role Enforcement */}
         <div className="space-y-12 pt-12 border-t border-white/5">
            <div className="space-y-8">
               <label className="text-[10px] font-black uppercase tracking-[0.5em] text-accent italic">Canonical Role (Logic Gate)</label>
               <Select 
                 value={form.role} 
                 onChange={e => {
                   const r = allRoles.find(role => role.name === e.target.value);
                   setForm({...form, role: e.target.value, department: r?.department});
                 }}
                 className="h-24 text-4xl font-serif italic text-white"
               >
                  <option value="" className="bg-black text-white/20 italic">Choose Craft Role...</option>
                  {INDUSTRY_DEPARTMENTS.map(dept => (
                     <optgroup key={dept.name} label={dept.name} className="bg-black text-white/30 font-sans uppercase text-[10px] tracking-widest py-4">
                        {dept.roles.map(r => (
                           <option key={r.name} value={r.name} className="bg-black text-white py-2">{r.name}</option>
                        ))}
                     </optgroup>
                  ))}
               </Select>
               <p className="text-[9px] text-white/20 uppercase font-black tracking-widest italic">
                  Note: Selection impacts guild eligibility logic and payroll compliance.
               </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
               <div className="space-y-4">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">Call Date</label>
                  <Input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="h-16 font-mono text-sm" />
               </div>
               <div className="space-y-4">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">Gross ($)</label>
                  <Input type="number" value={form.grossEarnings} onChange={e => setForm({...form, grossEarnings: Number(e.target.value)})} className="h-16 text-lg font-serif italic" />
               </div>
               <div className="space-y-4">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">Union Hook</label>
                  <Select 
                     value={form.unionTypeId} 
                     onChange={e => setForm({...form, unionTypeId: e.target.value, isUnion: !!e.target.value})}
                     className="h-16 text-xs italic"
                  >
                     <option value="">Non-Union</option>
                     {UNIONS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </Select>
               </div>
               <div className="flex items-end pb-1">
                  <Button onClick={handleSave} className="w-full h-16 bg-white text-black font-black uppercase tracking-[0.4em] accent-glow">Save Log</Button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
