
import React, { useState, useEffect } from 'react';
import { api } from '../services/storage';
import { User } from '../types';
import { Heading, Text, Badge, Button, Input } from '../components/ui';
import { Search, Filter, ChevronRight, UserPlus, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export const Contacts = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [cohortFilter, setCohortFilter] = useState('ALL');

  useEffect(() => {
    setUser(api.auth.getUser());
  }, []);

  if (!user || user.accountType !== 'AGENT') return null;

  const roster = user.managedUsers || [];
  const cohorts = Array.from(new Set(roster.map(u => u.cohort).filter(Boolean)));

  const filtered = roster.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase());
    const matchesCohort = cohortFilter === 'ALL' ? true : (cohortFilter === 'UNASSIGNED' ? !u.cohort : u.cohort === cohortFilter);
    return matchesSearch && matchesCohort;
  });

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 pb-16 border-b border-white/5">
        <div className="space-y-4">
           <Badge color="accent" className="italic tracking-widest uppercase">Personnel Roster</Badge>
           <h1 className="heading-huge text-white uppercase tracking-tighter">THE <br/><span className="text-accent">ROSTER.</span></h1>
        </div>
        
        {/* Top-Right Filtering & Actions */}
        <div className="flex flex-col md:flex-row items-center gap-6">
           <div className="flex bg-white/5 border border-white/10 p-1">
              <button 
                onClick={() => setCohortFilter('ALL')}
                className={clsx(
                  "px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all",
                  cohortFilter === 'ALL' ? "bg-accent text-black" : "text-white/40 hover:text-white"
                )}
              >
                All
              </button>
              {cohorts.map(c => (
                <button 
                  key={c}
                  onClick={() => setCohortFilter(c!)}
                  className={clsx(
                    "px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all border-l border-white/10",
                    cohortFilter === c ? "bg-accent text-black" : "text-white/40 hover:text-white"
                  )}
                >
                  {c}
                </button>
              ))}
              <button 
                onClick={() => setCohortFilter('UNASSIGNED')}
                className={clsx(
                  "px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all border-l border-white/10",
                  cohortFilter === 'UNASSIGNED' ? "bg-accent text-black" : "text-white/40 hover:text-white"
                )}
              >
                Unassigned
              </button>
           </div>
           
           <div className="relative group">
              <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-accent transition-colors" />
              <Input 
                placeholder="Find Talent..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="h-14 pl-14 w-64 text-sm italic"
              />
           </div>
           
           <Button className="h-14 px-8 italic text-[10px] tracking-widest accent-glow">
              <UserPlus size={14} className="mr-3" /> New Person
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
         {filtered.map(u => (
            <div 
              key={u.id} 
              onClick={() => api.auth.switchClient(u.id)}
              className="group p-10 glass-ui border-white/5 hover:border-accent/40 hover:bg-white/5 transition-all cursor-pointer flex flex-col justify-between min-h-[180px]"
            >
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 border border-white/10 flex items-center justify-center font-serif italic text-2xl text-white group-hover:bg-accent group-hover:text-black transition-all">
                       {u.name.charAt(0)}
                    </div>
                    <div>
                       <h3 className="text-3xl font-serif italic text-white leading-none">{u.name}</h3>
                       <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mt-3 italic">
                          {u.selectedRoles?.[0] || 'Unassigned Role'}
                       </p>
                    </div>
                  </div>
                  <Badge color="neutral" className="border-white/5 text-[8px]">{u.cohort || 'General'}</Badge>
               </div>
               
               <div className="pt-6 border-t border-white/5 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">Open Career HUD</span>
                  <ChevronRight size={16} className="text-accent" />
               </div>
            </div>
         ))}
         
         {filtered.length === 0 && (
           <div className="col-span-full py-40 text-center border border-dashed border-white/5 opacity-20 italic">
              Roster signal silent. No matching coordinates found.
           </div>
         )}
      </div>
    </div>
  );
};
