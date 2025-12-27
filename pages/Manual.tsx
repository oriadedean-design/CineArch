
import React, { useState, useMemo } from 'react';
import { Heading, Badge, Input, Card, Text, Button } from '../components/ui';
import { CanadianProvince } from '../types';
import { UNION_SPECS } from '../config/unions_data';
import { resolveUnionsForRole, PROVINCIAL_EXCEPTIONS } from '../config/jurisdiction_map';
import { INDUSTRY_DEPARTMENTS } from '../config/industry_roles';
import { Search, Shield, ChevronRight, Mail, Landmark, Info, MapPin, Briefcase, LayoutGrid, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';

export const Manual = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'GUILDS' | 'MAP' | 'ROLES'>('ROLES');
  const [selectedProvince, setSelectedProvince] = useState<string>('Ontario');

  const filteredGuilds = useMemo(() => {
    return Object.values(UNION_SPECS).filter(u => 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  // Logic to get all roles across all departments, filtered by search
  const filteredDepartments = useMemo(() => {
    if (!search) return INDUSTRY_DEPARTMENTS;
    return INDUSTRY_DEPARTMENTS.map(dept => ({
      ...dept,
      roles: dept.roles.filter(role => 
        role.name.toLowerCase().includes(search.toLowerCase()) || 
        role.description.toLowerCase().includes(search.toLowerCase())
      )
    })).filter(dept => dept.roles.length > 0);
  }, [search]);

  return (
    <div className="space-y-24 pb-40 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-white/10 pb-12 relative">
        <div className="space-y-4">
           <Badge color="accent" className="italic tracking-widest uppercase italic">Registry v0.5</Badge>
           <h1 className="heading-huge uppercase italic leading-none">YOUR <br/><span className="text-accent">REGISTRY.</span></h1>
        </div>
        <div className="flex-1 max-w-md relative group">
           <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-accent transition-colors" />
           <Input 
             placeholder="Search roles, guilds, or specs..." 
             className="pl-16 h-16 border-white/10 focus:border-accent/40" 
             value={search} 
             onChange={e => setSearch(e.target.value)} 
           />
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-12">
        <aside className="lg:col-span-3 space-y-8">
           <div className="flex flex-col gap-1">
              <button 
                onClick={() => setActiveTab('ROLES')} 
                className={clsx("text-left px-8 py-5 text-[10px] font-black uppercase tracking-[0.4em] border transition-all flex items-center justify-between", activeTab === 'ROLES' ? "bg-white text-black border-white" : "text-white/30 border-white/5 hover:bg-white/5")}
              >
                Your Role Directory <Briefcase size={12} />
              </button>
              <button 
                onClick={() => setActiveTab('GUILDS')} 
                className={clsx("text-left px-8 py-5 text-[10px] font-black uppercase tracking-[0.4em] border transition-all flex items-center justify-between", activeTab === 'GUILDS' ? "bg-white text-black border-white" : "text-white/30 border-white/5 hover:bg-white/5")}
              >
                Your Guild Registry <Landmark size={12} />
              </button>
              <button 
                onClick={() => setActiveTab('MAP')} 
                className={clsx("text-left px-8 py-5 text-[10px] font-black uppercase tracking-[0.4em] border transition-all flex items-center justify-between", activeTab === 'MAP' ? "bg-white text-black border-white" : "text-white/30 border-white/5 hover:bg-white/5")}
              >
                Your Jurisdiction Map <MapPin size={12} />
              </button>
           </div>
           
           <Card className="p-8 space-y-6 bg-accent/5 border-accent/20">
              <div className="flex items-center gap-3">
                 <MapPin size={14} className="text-accent" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Your Hub Context</h4>
              </div>
              <div className="flex flex-col gap-2">
                 {['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba'].map(p => (
                    <button 
                      key={p} 
                      onClick={() => setSelectedProvince(p)}
                      className={clsx(
                        "text-left text-[9px] font-black uppercase tracking-widest px-4 py-3 border transition-all flex items-center justify-between group", 
                        selectedProvince === p ? "border-accent text-accent bg-accent/5" : "border-transparent text-white/20 hover:text-white"
                      )}
                    >
                      {p}
                      {selectedProvince === p && <div className="w-1 h-1 bg-accent rounded-full"></div>}
                    </button>
                 ))}
              </div>
              <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] leading-relaxed italic">
                Your selected jurisdiction informs the union resolution logic across the Role Directory.
              </p>
           </Card>
        </aside>

        <main className="lg:col-span-9">
           {activeTab === 'ROLES' && (
             <div className="space-y-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-6 mb-12">
                   <Briefcase className="text-accent" size={24} />
                   <h2 className="text-5xl font-serif italic text-white leading-none">Your Role Directory</h2>
                   <div className="flex-1 h-px bg-white/5"></div>
                   <Badge color="accent">Hub: {selectedProvince}</Badge>
                </div>

                {filteredDepartments.map(dept => (
                   <div key={dept.name} className="space-y-10">
                      <div className="flex items-center gap-4">
                         <span className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40">Dept // {dept.code}</span>
                         <h3 className="text-4xl font-serif italic text-white">{dept.name}</h3>
                         <div className="flex-1 h-[1px] bg-white/10"></div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-1">
                         {dept.roles.map(role => {
                            const resolvedUnionIds = resolveUnionsForRole(selectedProvince, role.name, dept.name);
                            const resolvedUnions = resolvedUnionIds.map(id => UNION_SPECS[id]).filter(Boolean);
                            
                            return (
                               <Card key={role.name} className="p-10 space-y-8 hover:bg-white/[0.02] border-white/5 flex flex-col justify-between group">
                                  <div className="space-y-4">
                                     <div className="flex justify-between items-start">
                                        <h4 className="text-3xl font-serif italic text-white group-hover:text-accent transition-colors leading-none">{role.name}</h4>
                                     </div>
                                     <p className="text-sm text-white/40 font-light italic leading-relaxed">{role.description}</p>
                                  </div>
                                  
                                  <div className="pt-6 border-t border-white/5 space-y-4">
                                     <span className="text-[9px] font-black uppercase tracking-widest text-white/20 block italic">Coverage Protocol</span>
                                     <div className="flex flex-wrap gap-2">
                                        {resolvedUnions.length > 0 ? resolvedUnions.map(u => (
                                           <div key={u.id} className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2">
                                              <Landmark size={10} className="text-accent" />
                                              <span className="text-[10px] font-black uppercase tracking-widest text-white">{u.name}</span>
                                           </div>
                                        )) : (
                                          <Badge color="neutral">Non-Union / Permit</Badge>
                                        )}
                                     </div>
                                  </div>
                               </Card>
                            );
                         })}
                      </div>
                   </div>
                ))}
                
                {filteredDepartments.length === 0 && (
                   <div className="py-40 text-center border border-dashed border-white/5 opacity-30 italic">
                      No roles matching "{search}" in the {selectedProvince} archive.
                   </div>
                )}
             </div>
           )}

           {activeTab === 'GUILDS' && (
              <div className="grid gap-1 animate-in fade-in duration-700">
                 {filteredGuilds.map(u => (
                    <Card key={u.id} className="p-12 space-y-12 hover:border-accent/20 transition-all">
                       <div className="flex flex-col md:flex-row md:items-start justify-between gap-10">
                          <div className="space-y-4 max-w-xl">
                             <Badge color="accent">Standard Spec</Badge>
                             <h3 className="text-6xl font-serif italic text-white leading-none">{u.name}</h3>
                             <p className="text-xl text-white/40 font-light italic leading-relaxed">{u.description}</p>
                          </div>
                          <div className="text-right space-y-4">
                             <p className="text-[10px] font-black uppercase text-white/20 tracking-widest italic">Entrance Magnitude</p>
                             <p className="text-5xl font-serif italic text-white leading-none">${u.applicationFee || 0}</p>
                          </div>
                       </div>

                       <div className="grid md:grid-cols-2 gap-16 border-t border-white/5 pt-12">
                          <div className="space-y-6">
                             <h4 className="text-[10px] font-black uppercase text-accent tracking-[0.5em] italic">Member Benefits</h4>
                             <ul className="grid grid-cols-2 gap-4">
                                {u.memberBenefits?.map((b, i) => (
                                   <li key={i} className="text-[11px] text-white/60 flex items-center gap-3 italic"><ChevronRight size={12} className="text-accent" /> {b}</li>
                                ))}
                             </ul>
                          </div>
                          <div className="space-y-6">
                             <h4 className="text-[10px] font-black uppercase text-accent tracking-[0.5em] italic">Protocol: Joining</h4>
                             <ul className="space-y-3">
                                {u.applicationProcess?.map((step, i) => (
                                   <li key={i} className="text-[11px] text-white/40 flex items-start gap-4 italic leading-relaxed">
                                      <span className="text-[8px] font-mono mt-1">0{i+1}</span>
                                      {step}
                                   </li>
                                ))}
                             </ul>
                          </div>
                       </div>
                       
                       {u.jurisdictionalNotes && (
                          <div className="p-6 bg-white/[0.02] border border-white/5 flex gap-4 items-start">
                             <Info size={14} className="text-white/20 mt-1" />
                             <p className="text-[10px] text-white/30 italic leading-relaxed">{u.jurisdictionalNotes}</p>
                          </div>
                       )}
                    </Card>
                 ))}
              </div>
           )}

           {activeTab === 'MAP' && (activeTab === 'MAP' && (
              <div className="space-y-12 animate-in fade-in duration-700">
                 <div className="flex items-center gap-6">
                    <MapPin className="text-accent" size={24} />
                    <h2 className="text-5xl font-serif italic text-white leading-none">Rules for Your Hub: {selectedProvince}</h2>
                 </div>
                 
                 <div className="grid gap-1">
                    {(PROVINCIAL_EXCEPTIONS[selectedProvince] || []).map((rule, idx) => {
                       const union = UNION_SPECS[rule.assignedUnionId];
                       const unionName = union?.name || rule.assignedUnionId;
                       
                       return (
                          <Card key={idx} className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-10 hover:bg-white/[0.02]">
                             <div className="space-y-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-accent italic">Scope: {rule.roleIncludes ? rule.roleIncludes.join(', ') : rule.deptIncludes?.join(', ')}</span>
                                <h4 className="text-3xl font-serif italic text-white leading-none">Routed to {unionName}</h4>
                             </div>
                             <div className="text-right">
                                <Badge color="neutral">Regional Authority</Badge>
                             </div>
                          </Card>
                       );
                    })}
                    {(PROVINCIAL_EXCEPTIONS[selectedProvince] || []).length === 0 && (
                      <div className="p-20 text-center glass-ui opacity-20 italic font-black uppercase tracking-widest text-xs">
                        No provincial overrides found for this hub. National standards apply.
                      </div>
                    )}
                 </div>
                 
                 <Card className="p-10 border-dashed border-white/10 opacity-30 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest italic">All roles not listed above follow standard National Guild benchmarks.</p>
                 </Card>
              </div>
           ))}
        </main>
      </div>
    </div>
  );
};
