
import React, { useState, useEffect } from 'react';
import { api } from '../services/storage';
import { User, UserUnionTracking, ResidencyDocument, CanadianProvince, UNIONS } from '../types';
import { Heading, Text, Button, Input, Select, Badge, Card, ProgressBar } from '../components/ui';
import { clsx } from 'clsx';
import { User as UserIcon, Shield, Crown, Globe, Trash2, Upload, Users, Plus, Target, LogOut, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ACCOUNT' | 'PLAN' | 'GOALS' | 'VAULT'>('ACCOUNT');
  const [user, setUser] = useState<User | null>(null);
  const [profileForm, setProfileForm] = useState<Partial<User>>({});

  useEffect(() => {
    const u = api.auth.getUser();
    setUser(u);
    setProfileForm(u || {});
  }, []);

  const handleSave = () => {
    if (profileForm) {
      api.auth.updateUser(profileForm);
      alert("Settings Updated.");
    }
  };

  const handleLogout = () => {
    if (confirm("Sign out of the system?")) {
      api.auth.logout();
    }
  };

  return (
    <div className="space-y-12 pb-40">
      <header className="border-b border-white/5 pb-12">
         <Text variant="caption">System Configuration</Text>
         <Heading level={1} className="text-7xl italic tracking-tighter uppercase">Base Camp.</Heading>
      </header>

      <div className="grid md:grid-cols-4 gap-12">
        <div className="space-y-1">
          <button onClick={() => setActiveTab('ACCOUNT')} className={clsx("w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest border-l-2", activeTab === 'ACCOUNT' ? 'border-accent text-white' : 'border-transparent text-white/30')}>Personnel</button>
          <button onClick={() => setActiveTab('PLAN')} className={clsx("w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest border-l-2", activeTab === 'PLAN' ? 'border-accent text-white' : 'border-transparent text-white/30')}>Membership</button>
        </div>

        <div className="md:col-span-3">
          {activeTab === 'ACCOUNT' && (
            <div className="space-y-8 animate-in fade-in">
               <Card>
                  <h3 className="font-serif italic text-3xl text-white mb-8 border-b border-white/5 pb-6">Account Profile</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Full Name</label>
                        <Input value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Email</label>
                        <Input value={profileForm.email} disabled className="opacity-40" />
                     </div>
                  </div>
                  <div className="mt-12 pt-12 border-t border-white/5 flex justify-between items-center">
                     <button onClick={handleLogout} className="flex items-center gap-3 text-red-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-all">
                        <LogOut size={16} /> Sign Out
                     </button>
                     <Button onClick={handleSave}>Save Updates</Button>
                  </div>
               </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
