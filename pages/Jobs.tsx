import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/storage';
import { Job, UNIONS, JobStatus, User } from '../types';
import { INDUSTRY_DEPARTMENTS } from '../config/industry_roles';
import { UNION_SPECS } from '../config/unions_data';
import { resolveUnionsForRole } from '../config/jurisdiction_map';
import { Heading, Text, Button, Input, Select, Badge } from '../components/ui';
import { BulkJobUpload } from '../components/BulkJobUpload';
import { ArrowLeft, ArrowUpRight, Camera, Briefcase, Calendar, Info, Search, Star, ChevronDown, Sparkles, Layers, UploadCloud, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';

export const JobsList = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [showIngest, setShowIngest] = useState(false);
  const user = api.auth.getUser();

  const refresh = () => setJobs(api.jobs.list());

  useEffect(() => {
    refresh();
  }, []);

  const filteredJobs = filter === 'ALL' ? jobs : jobs.filter(j => j.unionName === filter || (!j.isUnion && filter === 'Non-Union'));

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
           <Text variant="caption">Production Ledger</Text>
           <Heading level={1} className="font-serif italic text-white tracking-tighter text-7xl">The Slate.</Heading>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={() => setShowIngest(!showIngest)}
            className={clsx("h-16 px-10 border-white/10", showIngest && "bg-white text-black")}
          >
             <UploadCloud className="mr-3" size={16} /> Ingest Dailies
          </Button>
          <Button onClick={() => navigate('/jobs/new')} className="bg-accent text-black h-16 px-12 font-black">Mark Slate</Button>
        </div>
      </div>

      {showIngest && (
        <div className="animate-in slide-in-from-top-4 duration-500">
           <BulkJobUpload userId={user?.id || 'anon'} onComplete={() => { setShowIngest(false); refresh(); }} />
        </div>
      )}

      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {filteredJobs.map((job) => (
            <div 
               key={job.id} 
               onClick={() => navigate(`/jobs/${job.id}`)}
               className="group glass-ui p-10 cursor-pointer border border-white/5 hover:border-accent/40 transition-all duration-500 flex flex-col justify-between min-h-[300px]"
            >
               <div className="space-y-6">
                  <div className="flex justify-between items-start">
                     <Badge color={job.isUnion ? "accent" : "neutral"}>{job.isUnion ? job.unionName : 'Indie'}</Badge>
                     <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest italic">{job.status}</span>
                  </div>
                  <h3 className="text-4xl font-serif text-white italic group-hover:text-accent transition-colors leading-tight">{job.productionName}</h3>
                  <div className="space-y-1">
                     <p className="text-[11px] text-white/60 uppercase font-black tracking-widest">{job.role}</p>
                     <p className="text-[9px] text-white/30 uppercase tracking-[0.2em]">{job.department}</p>
                  </div>
               </div>
               <div className="pt-8 border-t border-white/5 flex justify-between items-end">
                  <div>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Gross Earnings</p>
                    <p className="text-2xl font-serif italic text-white">${(job.grossEarnings || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Start Date</p>
                    <p className="text-xs font-mono text-white/60 uppercase tracking-widest">{job.startDate}</p>
                  </div>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-40 text-center glass-ui space-y-10 border border-dashed border-white/10 opacity-60">
           <Layers size={48} className="mx-auto text-white/10" strokeWidth={1} />
           <div className="space-y-2">
              <p className="text-white font-serif italic text-4xl">Checking the gate...</p>
              <p className="text-[11px] text-white/40 uppercase font-black tracking-[0.4em] max-w-sm mx-auto leading-loose">The slate is clear. No production logs detected on this drive.</p>
           </div>
           <Button onClick={() => navigate('/jobs/new')} className="h-20 px-16">Log First Scene</Button>
        </div>
      )}
    </div>
  );
};

export const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const user = api.auth.getUser();
  
  const [form, setForm] = useState<Partial<Job>>({
    status: 'CONFIRMED',
    productionName: '',
    role: user?.selectedRoles?.[0] || '',
    department: user?.department || '',
    isUnion: true,
    unionTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    totalHours: 0,
    grossEarnings: 0,
    imageUrl: '',
    genre: 'Drama',
    province: user?.province || 'Ontario'
  });

  const [suggestedUnion, setSuggestedUnion] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      const existing = api.jobs.list().find(j => j.id === id);
      if (existing) {
        setForm(existing);
      }
    }
  }, [id, isNew]);

  // Handle auto-guild selection when role/dept/province changes
  useEffect(() => {
    if (form.role && form.department && form.province) {
      const suggestedIds = resolveUnionsForRole(form.province, form.role, form.department);
      if (suggestedIds.length > 0) {
        setSuggestedUnion(suggestedIds[0]);
        // Only auto-select if it's a new job and not already explicitly set
        if (isNew && !form.unionTypeId) {
          setForm(prev => ({ ...prev, unionTypeId: suggestedIds[0] }));
        }
      } else {
        setSuggestedUnion(null);
      }
    }
  }, [form.role, form.department, form.province, isNew]);

  const handleSave = () => {
    if (!user) return navigate('/auth');
    if (!form.productionName) return alert('Checking the gate: Production Name is required.');
    
    const unionName = form.isUnion ? (UNION_SPECS[form.unionTypeId || '']?.name || 'Union') : undefined;

    const jobData = {
      ...form,
      id: isNew ? `job_${Date.now()}` : id!,
      userId: user.id,
      createdAt: new Date().toISOString(),
      documentCount: form.documentCount || 0,
      unionName
    } as Job;

    if (isNew) api.jobs.add(jobData); 
    else api.jobs.update(jobData);
    
    navigate('/jobs');
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  const allRoles = INDUSTRY_DEPARTMENTS.flatMap(d => d.roles.map(r => ({ ...r, dept: d.name })));

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-16">
         <button onClick={() => navigate('/jobs')} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white hover:text-accent transition-colors">
            <ArrowLeft size={16} /> Back to Ones
         </button>
         <Badge color="accent">{isNew ? "Marking the Slate" : "Reviewing the Cut"}</Badge>
      </div>

      <div className="space-y-20">
         <div className="border-b border-white/5 pb-12">
            <label className="text-[11px] font-black uppercase tracking-[0.6em] text-accent mb-6 block italic">Production Title</label>
            <Input 
               value={form.productionName} 
               onChange={e => setForm({...form, productionName: e.target.value})}
               className="text-7xl md:text-9xl font-serif italic bg-transparent border-none px-0 py-0 focus:ring-0 placeholder:text-white/5 text-white leading-none tracking-tighter"
               placeholder="Untitled"
            />
         </div>

         <div className="grid md:grid-cols-2 gap-20">
            <div className="space-y-12">
               <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white">Jurisdictional Hub</label>
                  <Select value={form.province} onChange={e => setForm({...form, province: e.target.value})} className="h-20 text-xl font-serif italic">
                     {['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba'].map(p => <option key={p} value={p} className="bg-black">{p}</option>)}
                  </Select>
               </div>

               <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white">Technical Role</label>
                  <Select value={form.role} onChange={e => {
                    const roleName = e.target.value;
                    const roleObj = allRoles.find(r => r.name === roleName);
                    setForm({...form, role: roleName, department: roleObj?.dept || form.department});
                  }} className="h-20 text-xl font-serif italic">
                     <option value="" className="bg-black">Select Mark...</option>
                     {INDUSTRY_DEPARTMENTS.map(dept => (
                        <optgroup key={dept.name} label={dept.name} className="bg-black text-accent">
                           {dept.roles.map(r => <option key={r.name} value={r.name} className="bg-black text-white">{r.name}</option>)}
                        </optgroup>
                     ))}
                  </Select>
               </div>
               
               <div className="space-y-8 p-10 glass-ui border-white/5 bg-white/[0.02] transition-all">
                  <div className="flex justify-between items-center mb-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-white">Production Category</label>
                     <div className="flex gap-2">
                        <button 
                          onClick={() => setForm({...form, isUnion: true})} 
                          className={clsx("px-4 py-2 text-[9px] font-black uppercase tracking-widest border transition-all", form.isUnion ? "bg-accent text-black border-accent" : "text-white/20 border-white/5")}
                        >
                          Union
                        </button>
                        <button 
                          onClick={() => setForm({...form, isUnion: false, unionTypeId: ''})} 
                          className={clsx("px-4 py-2 text-[9px] font-black uppercase tracking-widest border transition-all", !form.isUnion ? "bg-accent text-black border-accent" : "text-white/20 border-white/5")}
                        >
                          Indie
                        </button>
                     </div>
                  </div>

                  {form.isUnion && (
                    <div className="space-y-6 animate-in slide-in-from-top-2 duration-500">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Guild Alignment</label>
                       <Select 
                          value={form.unionTypeId || ''} 
                          onChange={e => setForm({...form, unionTypeId: e.target.value})} 
                          className={clsx("h-16 text-sm font-serif italic", suggestedUnion && !form.unionTypeId && "border-accent")}
                       >
                          <option value="" className="bg-black">Resolve Guild...</option>
                          {Object.values(UNION_SPECS).map(u => <option key={u.id} value={u.id} className="bg-black">{u.name}</option>)}
                       </Select>
                       {suggestedUnion && (
                         <div className="flex items-center gap-3 text-accent animate-in fade-in">
                            <ShieldCheck size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Protocol-Matched: {UNION_SPECS[suggestedUnion]?.name}</span>
                         </div>
                       )}
                    </div>
                  )}

                  {!form.isUnion && (
                    <div className="flex items-center gap-3 text-white/20">
                       <ShieldAlert size={14} />
                       <span className="text-[10px] font-black uppercase tracking-widest italic">Independent workflow detected. Continuity hours will not track for guild eligibility.</span>
                    </div>
                  )}
               </div>
            </div>

            <div className="space-y-12">
               <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <label className="text-[10px] font-black uppercase tracking-widest text-white">Start Date</label>
                     <Input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="h-20 text-white" />
                  </div>
                  <div className="space-y-6">
                     <label className="text-[10px] font-black uppercase tracking-widest text-white">Gross Scale ($)</label>
                     <Input type="number" value={form.grossEarnings} onChange={e => setForm({...form, grossEarnings: Number(e.target.value)})} className="h-20 text-xl font-mono text-white" />
                  </div>
               </div>
               <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white">Production Status</label>
                  <div className="flex gap-1">
                     {['CONFIRMED', 'TENTATIVE'].map(s => (
                       <button 
                         key={s} 
                         onClick={() => setForm({...form, status: s as any})}
                         className={clsx(
                           "flex-1 h-16 border text-[10px] font-black uppercase tracking-widest transition-all",
                           form.status === s ? "bg-white text-black border-white" : "glass-ui text-white hover:border-white/20"
                         )}
                       >
                         {s}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="p-10 glass-ui border-white/5 flex flex-col gap-6 justify-end h-40">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Department</span>
                  <h4 className="text-4xl font-serif italic text-white leading-none">{form.department || 'General Production'}</h4>
               </div>
            </div>
         </div>

         <div className="pt-20 border-t border-white/5 flex justify-end gap-10 items-center">
            <button onClick={() => navigate('/jobs')} className="text-[10px] font-black uppercase tracking-widest text-white hover:text-accent transition-colors">Discard Mark</button>
            <Button onClick={handleSave} className="h-14 px-10 bg-white text-black font-black uppercase tracking-[0.5em] text-[11px]">Print It // Save</Button>
         </div>
      </div>
    </div>
  );
};