import React, { useState, useEffect } from 'react';
import { api } from '../services/storage';
import { User, CanadianProvince } from '../types';
import { Heading, Text, Button, Input, Select, Card, Badge } from '../components/ui';
import { Shield, User as UserIcon, Lock, Landmark, FileText, Trash2, Users, XCircle } from 'lucide-react';

export const SettingsIndividual = () => {
  const [user, setUser] = useState<User | null>(api.auth.getUser());
  const [profileForm, setProfileForm] = useState<Partial<User>>(user || {});

  const handleSave = async () => {
    if (profileForm) {
      await api.auth.updateUser(profileForm);
      setUser(api.auth.getUser());
      alert("Profile Canonical Synchronized.");
    }
  };

  const handleRevokeAgency = async () => {
    if (window.confirm("CRITICAL ACTION: Revoking agency access will immediately disconnect your ledger from their command terminal. Proceed?")) {
      await api.auth.revokeAgency();
      setUser(api.auth.getUser());
      alert("Agency RLS Access Killed.");
    }
  };

  return (
    <div className="space-y-24 animate-in fade-in duration-700">
      <header className="space-y-4 border-b border-white/10 pb-12">
         <Badge color="accent">Personnel File</Badge>
         <h1 className="heading-huge italic leading-none">BASE <br/><span className="text-accent">CAMP.</span></h1>
      </header>

      <div className="grid md:grid-cols-12 gap-12">
         <aside className="md:col-span-4 space-y-8">
            <Card className="p-8 border-accent/20 bg-accent/5 space-y-6">
               <Shield className="text-accent" size={24} />
               <h3 className="text-2xl font-serif italic text-white leading-none">Identity Integrity</h3>
               <p className="text-xs text-white/40 leading-relaxed font-light">Your professional coordinates drive all automated guild trajectory logic. Accuracy is mandatory.</p>
            </Card>

            <Card className="p-8 space-y-6 border-white/5">
               <div className="flex items-center gap-3 text-white/40">
                  <Users size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Agency Link</span>
               </div>
               <div className="space-y-4">
                  <p className="text-sm font-serif italic text-white">
                    {user?.hasAgentFee ? "Linked to Agency Terminal" : "No Active Agency Link"}
                  </p>
                  {user?.hasAgentFee && (
                    <button 
                      onClick={handleRevokeAgency}
                      className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors flex items-center gap-2"
                    >
                      <XCircle size={12} /> Revoke Agency Access
                    </button>
                  )}
               </div>
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