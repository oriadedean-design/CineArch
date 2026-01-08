
import React, { useState, useEffect } from 'react';
import { api } from '../services/storage';
import { Job } from '../types';
import { resolveGuildsForRole, getUnionSpec, getAllUnions } from '../services/union_engine';
import { INDUSTRY_DEPARTMENTS } from '../config/industry_roles';
import { Heading, Text, Button, Input, Select, Badge, Card } from '../components/ui';
import { ArrowLeft, ShieldCheck, Zap, Layers } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';

export const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const user = api.auth.getUser();
  
  const [form, setForm] = useState<Partial<Job>>({
    status: 'CONFIRMED',
    productionName: '',
    role: user?.selectedRoles?.[0] || '',
    department: user?.department || 'Camera Department',
    isUnion: true,
    unionTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    grossEarnings: 0,
    province: user?.province || 'Ontario'
  });

  const [resolvedUnionIds, setResolvedUnionIds] = useState<string[]>([]);

  // THE JURISDICTIONAL ENGINE
  useEffect(() => {
    if (form.province && form.department && form.role) {
      const suggestions = resolveGuildsForRole(form.province, form.role, form.department);
      setResolvedUnionIds(suggestions);
      
      if (isNew && !form.unionTypeId && form.isUnion && suggestions.length > 0) {
        setForm(prev => ({ ...prev, unionTypeId: suggestions[0] }));
      }
    }
  }, [form.province, form.department, form.role, isNew, form.isUnion]);

  const handleSave = () => {
    if (!form.productionName) return alert('System Check: Production Name is required.');
    
    const unionSpec = getUnionSpec(form.unionTypeId || '');
    const unionName = form.isUnion ? unionSpec?.name : undefined;

    const jobData = {
      ...form,
      id: isNew ? `job_${Date.now()}` : id!,
      userId: user?.id || 'anon',
      createdAt: new Date().toISOString(),
      unionName
    } as Job;

    if (isNew) api.jobs.add(jobData); 
    else api.jobs.update(jobData);
    navigate('/jobs');
  };

  const allRoles = INDUSTRY_DEPARTMENTS.flatMap(d => d.roles.map(r => ({ ...r, dept: d.name })));

  return (
    <div className="max-w-4xl mx-auto space-y-12 md:space-y-24 animate-in fade-in duration-700">
      <header className="flex justify-between items-center">
         <button onClick={() => navigate('/jobs')} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-3 italic">
            <ArrowLeft size={16} /> Back to Your Slate
         </button>
         <Badge color="accent">{isNew ? "Your New Mark" : "Reviewing Your Mark"}</Badge>
      </header>

      <div className="space-y-12">
         <div className="border-b border-white/5 pb-12">
            <label className="text-[10px] font-black uppercase tracking-[0.5em] text-accent mb-6 block italic">Production Title</label>
            <Input 
               value={form.productionName} 
               onChange={e => setForm({...form, productionName: e.target.value})}
               className="text-6xl md:text-9xl font-serif italic bg-transparent border-none px-0 text-white leading-none tracking-tighter placeholder:text-white/5"
               placeholder="Untitled Project"
            />
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
            <div className="space-y-12">
               <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Your Regional Hub</label>
                  <Select value={form.province} onChange={e => setForm({...form, province: e.target.value})} className="h-20 text-xl font-serif italic">
                     {['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Nova Scotia', 'New Brunswick', 'Prince Edward Island', 'Newfoundland and Labrador', 'Saskatchewan', 'Yukon', 'Northwest Territories', 'Nunavut'].map(p => <option key={p} value={p} className="bg-black text-white">{p}</option>)}
                  </Select>
               </div>

               <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Your Assignment</label>
                  <Select value={form.role} onChange={e => {
                    const roleName = e.target.value;
                    const roleObj = allRoles.find(r => r.name === roleName);
                    setForm({...form, role: roleName, department: roleObj?.dept || form.department});
                  }} className="h-20 text-xl font-serif italic">
                     {INDUSTRY_DEPARTMENTS.map(dept => (
                        <optgroup key={dept.name} label={dept.name} className="bg-black text-accent uppercase tracking-widest font-black py-4">
                           {dept.roles.map(r => <option key={r.name} value={r.name} className="bg-black text-white">{r.name}</option>)}
                        </optgroup>
                     ))}
                  </Select>
               </div>

               <Card className="p-10 border-white/5 bg-white/[0.02] space-y-10">
                  <div className="flex justify-between items-center border-b border-white/5 pb-6">
                     <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Your Category</label>
                     <div className="flex gap-2">
                        <button onClick={() => setForm({...form, isUnion: true})} className={clsx("px-5 py-3 text-[9px] font-black uppercase tracking-widest border transition-all", form.isUnion ? "bg-accent text-black border-accent" : "text-white/20 border-white/5")}>Union</button>
                        <button onClick={() => setForm({...form, isUnion: false, unionTypeId: ''})} className={clsx("px-5 py-3 text-[9px] font-black uppercase tracking-widest border transition-all", !form.isUnion ? "bg-accent text-black border-accent" : "text-white/20 border-white/5")}>Indie</button>
                     </div>
                  </div>

                  {form.isUnion && (
                    <div className="space-y-6 animate-in slide-in-from-top-2 duration-500">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Your Guild Continuity</label>
                       <Select 
                          value={form.unionTypeId || ''} 
                          onChange={e => setForm({...form, unionTypeId: e.target.value})} 
                          className="h-16 text-lg font-serif italic"
                       >
                          {resolvedUnionIds.map(id => {
                            const spec = getUnionSpec(id);
                            return <option key={id} value={id} className="bg-black">{spec?.name}</option>;
                          })}
                          <option disabled className="text-white/20">—— Manual Override ——</option>
                          {getAllUnions().filter(u => !resolvedUnionIds.includes(u.id)).map(u => <option key={u.id} value={u.id} className="bg-black">{u.name}</option>)}
                       </Select>
                       <div className="flex items-center gap-3 text-accent">
                          <ShieldCheck size={16} />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">
                            {resolvedUnionIds.length > 1 ? "Multiple Overlapping Jurisdictions Resolved" : "Resolved via Your Jurisdictional Matrix"}
                          </span>
                       </div>
                    </div>
                  )}
               </Card>
            </div>

            <div className="space-y-12">
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Your Start Date</label>
                     <Input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="h-20 font-mono text-base" />
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Your Gross Scale ($)</label>
                     <Input type="number" value={form.grossEarnings} onChange={e => setForm({...form, grossEarnings: Number(e.target.value)})} className="h-20 font-mono text-2xl" />
                  </div>
               </div>

               <Card className="p-12 border-accent/20 bg-accent/5 space-y-6">
                  <div className="flex items-center gap-4 text-accent">
                     <Zap size={18} fill="currentColor" />
                     <h4 className="text-[11px] font-black uppercase tracking-[0.5em] italic leading-none">Your Manifesto</h4>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed italic font-light">
                    {allRoles.find(r => r.name === form.role)?.description || "Your specific role specification is pending."}
                  </p>
                  <div className="pt-4 flex flex-wrap gap-2">
                     <Badge color="neutral" className="opacity-30 border-white/5">{form.department}</Badge>
                     {resolvedUnionIds.length > 1 && <Badge color="accent" className="animate-pulse">Competitive Hub</Badge>}
                  </div>
               </Card>

               <div className="pt-12 flex flex-col gap-6 items-end">
                  <button onClick={() => navigate('/jobs')} className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40 hover:text-white transition-colors py-4">Discard Mark</button>
                  <Button onClick={handleSave} className="h-20 px-16 shadow-glow w-full md:w-auto">Commit to Your Slate</Button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
