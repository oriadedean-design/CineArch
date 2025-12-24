
import React, { useState, useEffect } from 'react';
import { api } from '../services/storage';
import { User, CanadianProvince } from '../types';
import { Heading, Text, Button, Input, Select, Card, Badge } from '../components/ui';
import { Shield, User as UserIcon, Lock, Landmark, FileText, Trash2 } from 'lucide-react';

export const SettingsIndividual = () => {
  const [user, setUser] = useState<User | null>(api.auth.getUser());
  const [profileForm, setProfileForm] = useState<Partial<User>>(user || {});

  const handleSave = () => {
    if (profileForm) {
      api.auth.updateUser(profileForm);
      setUser(api.auth.getUser());
      alert("Profile Canonical Synchronized.");
    }
  };

  return (
    <div className="space-y-24 animate-in fade-in duration-700">
      <header className="space-y-4 border-b border-white/10 pb-12">
         <Badge color="accent">Personnel File</Badge>
         <h1 className="heading-huge italic leading-none">BASE <br/><span className="text-accent">CAMP.</span></h1>
      </header>

      <div className="grid md:grid-cols-12 gap-12">
         <aside className="md:col-span-4 space-y-4">
            <Card className="p-8 border-accent/20 bg-accent/5 space-y-6">
               <Shield className="text-accent" size={24} />
               <h3 className="text-2xl font-serif italic text-white leading-none">Identity Integrity</h3>
               <p className="text-xs text-white/40 leading-relaxed font-light">Your professional coordinates drive all automated guild trajectory logic. Accuracy is mandatory.</p>
            </Card>
         </aside>

         <main className="md:col-span-8 space-y-12">
            <div className="space-y-8">
               <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Full Name</label>
                     <Input value={profileForm.name || ''} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="h-20 text-2xl font-serif italic" />
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Jurisdiction</label>
                     <Select value={profileForm.province} onChange={e => setProfileForm({...profileForm, province: e.target.value})} className="h-20 text-2xl font-serif italic">
                        {Object.values(CanadianProvince).map(v => <option key={v} value={v} className="bg-black text-white">{v}</option>)}
                     </Select>
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Digital Coordinate (Email)</label>
                  <Input value={profileForm.email || ''} disabled className="h-20 opacity-30 cursor-not-allowed font-serif italic" />
               </div>
               <div className="pt-12 border-t border-white/5 flex justify-between items-center">
                  <button onClick={() => { if(confirm('Purge Drive?')) api.system.resetData(); window.location.reload(); }} className="text-[10px] font-black uppercase tracking-widest text-red-500/40 hover:text-red-500 transition-colors">Purge Data</button>
                  <Button onClick={handleSave} className="h-16 px-12">Print Updates</Button>
               </div>
            </div>
         </main>
      </div>
    </div>
  );
};
