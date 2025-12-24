
import React, { useState, useEffect } from 'react';
import { api } from '../services/storage';
import { User, EntityType, CanadianProvince } from '../types';
import { Heading, Text, Button, Input, Select, Card, Badge } from '../components/ui';
import { Landmark, Users, GraduationCap, Building, FolderSync, Percent, Briefcase } from 'lucide-react';

export const SettingsEnterprise = () => {
  const [user, setUser] = useState<User | null>(api.auth.getUser());
  const [profileForm, setProfileForm] = useState<Partial<User>>(user || {});

  const handleSave = () => {
    if (profileForm) {
      api.auth.updateUser(profileForm);
      setUser(api.auth.getUser());
      alert("Organization Terminal Calibrated.");
    }
  };

  return (
    <div className="space-y-24 animate-in fade-in duration-700">
      <header className="space-y-4 border-b border-white/10 pb-12">
         <Badge color="accent">Enterprise Configuration</Badge>
         <h1 className="heading-huge italic leading-none">BASE <br/><span className="text-accent">COMMAND.</span></h1>
      </header>

      <div className="grid md:grid-cols-12 gap-12">
         <aside className="md:col-span-4 space-y-8">
            <Card className="p-10 border-accent/20 bg-accent/5 space-y-8">
               <div className="flex gap-4 items-center">
                  <Landmark className="text-accent" size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent italic">Status: Showrunner</span>
               </div>
               <h3 className="text-4xl font-serif italic text-white leading-[0.8]">Master <br/>Integrity.</h3>
               <p className="text-xs text-white/40 leading-relaxed font-light">Global settings for your roster members. Changes here affect compliance logic across the entire aggregate ledger.</p>
            </Card>

            <Card className="p-10 space-y-6">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Organization Context</h4>
               <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/20">
                     <span>Active Roster</span>
                     <span className="text-white">{user?.managedUsers?.length || 0} Members</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/20">
                     <span>Type</span>
                     <span className="text-white">{user?.entityType}</span>
                  </div>
               </div>
            </Card>
         </aside>

         <main className="md:col-span-8 space-y-16">
            <section className="space-y-10">
               <div className="flex items-center gap-6">
                  <Briefcase size={20} className="text-white/20" />
                  <h3 className="text-3xl font-serif italic text-white">Entity Definition</h3>
                  <div className="h-px flex-1 bg-white/5"></div>
               </div>
               <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Organization Name</label>
                     <Input value={profileForm.organizationName || ''} onChange={e => setProfileForm({...profileForm, organizationName: e.target.value})} className="h-20 text-xl font-serif italic" />
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Base Jurisdiction</label>
                     <Select value={profileForm.province} onChange={e => setProfileForm({...profileForm, province: e.target.value as any})} className="h-20 text-xl font-serif italic">
                        {Object.values(CanadianProvince).map(v => <option key={v} value={v} className="bg-black text-white">{v}</option>)}
                     </Select>
                  </div>
               </div>
            </section>

            {user?.entityType === EntityType.AGENCY ? (
               <section className="space-y-10 animate-in fade-in duration-1000">
                  <div className="flex items-center gap-6">
                     <Percent size={20} className="text-accent" />
                     <h3 className="text-3xl font-serif italic text-white">Commission Logic</h3>
                     <div className="h-px flex-1 bg-white/5"></div>
                  </div>
                  <Card className="p-12 border-accent/20 bg-accent/5 flex items-center gap-12">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Global Roster Rate (%)</label>
                        <Input type="number" value={profileForm.agentFeePercentage} onChange={e => setProfileForm({...profileForm, agentFeePercentage: Number(e.target.value)})} className="h-24 text-6xl font-serif italic text-white w-48 text-center" />
                     </div>
                     <p className="text-xs text-white/40 max-w-xs italic font-light leading-relaxed">This rate automatically calculates the commission deduction across all client production logs in the aggregate views.</p>
                  </Card>
               </section>
            ) : (
               <section className="space-y-10 animate-in fade-in duration-1000">
                  <div className="flex items-center gap-6">
                     <GraduationCap size={20} className="text-accent" />
                     <h3 className="text-3xl font-serif italic text-white">Cohort Parameters</h3>
                     <div className="h-px flex-1 bg-white/5"></div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Current Program Name</label>
                        <Input value={profileForm.programName || ''} onChange={e => setProfileForm({...profileForm, programName: e.target.value})} className="h-20 text-xl font-serif italic" />
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Cohort Year / Tag</label>
                        <Input value={profileForm.cohortYear || ''} onChange={e => setProfileForm({...profileForm, cohortYear: e.target.value})} className="h-20 text-xl font-serif italic" />
                     </div>
                  </div>
               </section>
            )}

            <div className="pt-12 border-t border-white/5 flex justify-end">
               <Button onClick={handleSave} className="h-16 px-16 font-black uppercase tracking-[0.5em]">Synchronize Base</Button>
            </div>
         </main>
      </div>
    </div>
  );
};
