
import { useState, useMemo } from 'react';
import { Heading, Badge, Input, Card, Text, Button } from '../components/ui';
import { CanadianProvince } from '../types';
import { getAllUnions, resolveGuildsForRole } from '../services/union_engine';
import { INDUSTRY_DEPARTMENTS } from '../config/industry_roles';
import { Search, Shield, ChevronRight, Mail, Landmark, Info, MapPin, Briefcase, LayoutGrid, BookOpen, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export const Manual = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'GUILDS' | 'MAP' | 'ROLES'>('ROLES');
  const [selectedProvince, setSelectedProvince] = useState<string>('Ontario');

  const filteredGuilds = useMemo(() => {
    return getAllUnions().filter(u => 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

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
    <div className="space-y-24 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-white/10 pb-16 relative">
        <div className="space-y-6">
           <Badge color="accent" className="italic tracking-widest uppercase italic px-6">Your Registry // v0.5</Badge>
           <h1 className="heading-huge uppercase italic leading-none">YOUR <br/><span className="text-accent">REGISTRY.</span></h1>
        </div>
        <div className="flex-1 max-w-md relative group">
           <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-accent transition-colors" />
           <Input 
             placeholder="Search roles or guilds..." 
             className="pl-16 h-20 border-white/10 focus:border-accent/40" 
             value={search} 
             onChange={e => setSearch(e.target.value)} 
           />
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-12">
        <aside className="lg:col-span-3 space-y-12">
           <div className="flex flex-col gap-1">
              <button onClick={() => setActiveTab('ROLES')} className={clsx("text-left px-10 py-6 text-[11px] font-black uppercase tracking-[0.5em] border transition-all flex items-center justify-between", activeTab === 'ROLES' ? "bg-white text-black border-white shadow-glow" : "text-white/30 border-white/5 hover:bg-white/5")}>
                Your Role Directory <Briefcase size={14} />
              </button>
              <button onClick={() => setActiveTab('GUILDS')} className={clsx("text-left px-10 py-6 text-[11px] font-black uppercase tracking-[0.5em] border transition-all flex items-center justify-between", activeTab === 'GUILDS' ? "bg-white text-black border-white shadow-glow" : "text-white/30 border-white/5 hover:bg-white/5")}>
                Your Guild Registry <Landmark size={14} />
              </button>
           </div>
           
           <Card className="p-10 space-y-8 bg-accent/5 border-accent/20">
              <div className="flex items-center gap-4">
                 <MapPin size={18} className="text-accent" />
                 <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white italic">Your Hub Context</h4>
              </div>
              <div className="flex flex-col gap-2">
                 {['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Nova Scotia'].map(p => (
                    <button 
                      key={p} 
                      onClick={() => setSelectedProvince(p)}
                      className={clsx(
                        "text-left text-[10px] font-black uppercase tracking-[0.3em] px-6 py-4 border transition-all flex items-center justify-between group", 
                        selectedProvince === p ? "border-accent text-accent bg-accent/5" : "border-transparent text-white/20 hover:text-white"
                      )}
                    >
                      {p}
                      {selectedProvince === p && <div className="w-1 h-1 bg-accent rounded-full animate-pulse"></div>}
                    </button>
                 ))}
              </div>
              <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.3em] leading-relaxed italic">
                Your selected jurisdiction drives the real-time union resolution matrix.
              </p>
           </Card>
        </aside>

        <main className="lg:col-span-9">
           {activeTab === 'ROLES' && (
             <div className="space-y-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {filteredDepartments.map(dept => (
                   <div key={dept.name} className="space-y-12">
                      <div className="flex items-center gap-6">
                         <span className="text-[10px] font-black uppercase tracking-[0.8em] text-white/20 italic">DEPT // {dept.code}</span>
                         <h3 className="text-5xl font-serif italic text-white leading-none">{dept.name}</h3>
                         <div className="flex-1 h-[1px] bg-white/5"></div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-1">
                         {dept.roles.map(role => {
                            const unionIds = resolveGuildsForRole(selectedProvince, role.name, dept.name);
                            const guilds = getAllUnions().filter(u => unionIds.includes(u.id));
                            
                            return (
                               <Card key={role.name} className="p-12 space-y-10 hover:bg-white/[0.02] border-white/5 group flex flex-col justify-between">
                                  <div className="space-y-6">
                                     <h4 className="text-4xl font-serif italic text-white group-hover:text-accent transition-colors leading-none">{role.name}</h4>
                                     <p className="text-base text-white/40 font-light italic leading-relaxed">{role.description}</p>
                                     
                                     {role.requirements && (
                                       <div className="pt-6 space-y-4">
                                          <span className="text-[9px] font-black uppercase tracking-widest text-accent italic">Personnel Requirements</span>
                                          <div className="flex flex-wrap gap-2">
                                             {role.requirements.map(req => (
                                               <Badge key={req} color="neutral" className="opacity-60">{req}</Badge>
                                             ))}
                                          </div>
                                       </div>
                                     )}
                                  </div>
                                  
                                  <div className="pt-8 border-t border-white/5 space-y-6">
                                     <span className="text-[10px] font-black uppercase tracking-widest text-white/20 block italic">Your Coverage Protocol</span>
                                     <div className="flex flex-wrap gap-3">
                                       {guilds.map(g => (
                                          <div key={g.id} className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-3 w-fit">
                                             <Landmark size={14} className="text-accent" />
                                             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white">{g.name}</span>
                                          </div>
                                       ))}
                                     </div>
                                     {guilds.length > 1 && (
                                       <div className="flex items-center gap-3 text-accent/60">
                                          <AlertCircle size={12} />
                                          <span className="text-[9px] font-black uppercase tracking-widest italic">Overlapping Jurisdiction Detected</span>
                                       </div>
                                     )}
                                  </div>
                               </Card>
                            );
                         })}
                      </div>
                   </div>
                ))}
             </div>
           )}

           {activeTab === 'GUILDS' && (
              <div className="grid gap-1 animate-in fade-in duration-700">
                 {filteredGuilds.map(u => (
                    <Card key={u.id} className="p-16 space-y-16 hover:border-accent/20 transition-all">
                       <div className="flex flex-col md:flex-row md:items-start justify-between gap-12">
                          <div className="space-y-6 max-w-2xl">
                             <Badge color="accent" className="italic px-6">Personnel Spec</Badge>
                             <h3 className="text-7xl font-serif italic text-white leading-[0.8] uppercase tracking-tighter">{u.name}</h3>
                             <p className="text-2xl text-white/40 font-light italic leading-relaxed">{u.description}</p>
                             {u.jurisdictionalNotes && (
                               <div className="p-6 bg-accent/5 border border-accent/20 flex gap-4 items-start">
                                  <Info size={16} className="text-accent shrink-0 mt-1" />
                                  <p className="text-xs text-accent italic leading-relaxed">{u.jurisdictionalNotes}</p>
                               </div>
                             )}
                          </div>
                          <div className="text-left md:text-right space-y-6 border-l md:border-l-0 md:border-r border-white/5 pl-8 md:pr-8">
                             <p className="text-[11px] font-black uppercase text-white/20 tracking-[0.5em] italic">Entrance Magnitude</p>
                             <p className="text-6xl font-serif italic text-white leading-none tracking-tighter">${u.applicationFee || 0}</p>
                             {u.residencyRule && (
                               <p className="text-[9px] font-black uppercase text-white/30 tracking-widest italic">{u.residencyRule}</p>
                             )}
                          </div>
                       </div>

                       <div className="grid md:grid-cols-2 gap-20 border-t border-white/5 pt-16">
                          <div className="space-y-8">
                             <h4 className="text-[11px] font-black uppercase text-accent tracking-[0.6em] italic">Your Member Benefits</h4>
                             <ul className="grid grid-cols-1 gap-6">
                                {u.memberBenefits?.map((b, i) => (
                                   <li key={i} className="text-base text-white/60 flex items-center gap-4 italic"><ChevronRight size={14} className="text-accent" /> {b}</li>
                                ))}
                             </ul>
                          </div>
                          <div className="space-y-8 bg-white/5 p-12">
                             <h4 className="text-[11px] font-black uppercase text-accent tracking-[0.6em] italic">Entrance Tiers</h4>
                             <ul className="space-y-8">
                                {u.tiers.map((tier, i) => (
                                   <li key={i} className="space-y-2">
                                      <div className="flex justify-between items-center">
                                         <span className="text-xl font-serif italic text-white">{tier.name}</span>
                                         <Badge color="neutral">{tier.targetType}</Badge>
                                      </div>
                                      <p className="text-sm text-white/40 italic leading-relaxed">{tier.description} — Target: {tier.targetValue}</p>
                                   </li>
                                ))}
                             </ul>
                          </div>
                       </div>
                    </Card>
                 ))}
              </div>
           )}
        </main>
      </div>
    </div>
  );
};
