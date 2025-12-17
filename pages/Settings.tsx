
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, UserUnionTracking, ResidencyDocument, RESIDENCY_DOC_TYPES, CanadianProvince } from '../types';
import { Heading, Text, Button, Input, Select, Badge, Card } from '../components/ui';
import { User as UserIcon, Shield, Crown, Phone, Globe, Trash2, Upload, CheckCircle, Briefcase, Users, Plus, FileSpreadsheet, Zap } from 'lucide-react';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<'ACCOUNT' | 'PLAN' | 'GOALS' | 'VAULT'>('ACCOUNT');
  const [user, setUser] = useState<User | null>(null);
  const [trackings, setTrackings] = useState<UserUnionTracking[]>([]);
  const [docs, setDocs] = useState<ResidencyDocument[]>([]);
  const [profileForm, setProfileForm] = useState<Partial<User>>({});

  useEffect(() => { refreshData(); }, []);

  const refreshData = async () => {
    const u = await api.auth.getUser();
    setUser(u);
    setProfileForm(u || {});
    
    if (u) {
        const t = await api.tracking.get(u.id);
        setTrackings(t);
        const d = await api.vault.list();
        setDocs(d);
    }
  };

  const handleSave = async () => {
    if (profileForm) {
      await api.auth.updateUser(profileForm);
      await refreshData();
    }
  };

  const TabButton = ({ id, label }: { id: typeof activeTab, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full text-left px-6 py-4 text-sm font-bold tracking-wide border-l-2 transition-all duration-300 ${activeTab === id ? 'border-accent text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Text variant="caption">System Configuration</Text>
          <Heading level={1}>Settings</Heading>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="space-y-2">
          <TabButton id="ACCOUNT" label="Identity & Profile" />
          <TabButton id="PLAN" label="Membership Status" />
          <TabButton id="GOALS" label="Union Targets" />
          <TabButton id="VAULT" label="Residency Vault" />
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {activeTab === 'ACCOUNT' && (
            <Card className="animate-in fade-in slide-in-from-bottom-4">
               <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                     <UserIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                     <h3 className="font-serif text-2xl text-white">Identity Profile</h3>
                     <p className="text-sm text-gray-500">Manage your public filmmaker profile.</p>
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Full Name</label>
                    <Input value={profileForm.name || ''} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email</label>
                    <Input value={profileForm.email || ''} disabled className="opacity-50 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Province</label>
                    <Select value={profileForm.province} onChange={e => setProfileForm({...profileForm, province: e.target.value})}>
                       {Object.entries(CanadianProvince).map(([k, v]) => <option key={k} value={v} className="text-black">{v}</option>)}
                    </Select>
                  </div>
               </div>

               <div className="mt-8 pt-8 border-t border-white/10 flex justify-end">
                  <Button onClick={handleSave}>Save Changes</Button>
               </div>
            </Card>
          )}

          {activeTab === 'PLAN' && (
             <Card className="animate-in fade-in slide-in-from-bottom-4 bg-gradient-to-br from-surface to-black border-accent/20">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-accent/20 rounded-full">
                          <Crown className="w-8 h-8 text-accent" />
                      </div>
                      <div>
                         <h3 className="font-serif text-2xl text-white">
                             {user?.accountType === 'AGENT' ? 'Agency Partner' : 'Professional Plan'}
                         </h3>
                         <p className="text-sm text-accent font-bold uppercase tracking-widest">Status: Active</p>
                      </div>
                   </div>
                   <Badge color="accent">UNLOCKED</Badge>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8 border-t border-white/10 pt-8">
                    <div>
                        <h4 className="font-bold text-white mb-4">Included Features</h4>
                        <ul className="space-y-3">
                            {['Unlimited Project Logs', 'Bulk CSV Import', 'PDF Reports', 'Document Vault', 'All Union Tiers'].map(f => (
                                <li key={f} className="flex items-center gap-3 text-sm text-gray-400">
                                    <CheckCircle className="w-4 h-4 text-accent" /> {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-white/5 rounded-xl p-6 flex flex-col justify-center">
                       <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Current Billing</p>
                       <p className="text-2xl font-serif text-white mb-1">
                           {user?.accountType === 'AGENT' ? '$90.00' : '$15.00'}
                           <span className="text-sm font-sans text-gray-500">/mo</span>
                       </p>
                       <p className="text-gray-400 text-xs">Billed annually. Next renewal: Oct 24, 2025</p>
                       <Button variant="outline" className="mt-4 border-white/10 hover:border-white">Manage Billing</Button>
                    </div>
                </div>
             </Card>
          )}

          {/* Fallback for other tabs not fully implemented in this update */}
          {(activeTab === 'GOALS' || activeTab === 'VAULT') && (
              <Card>
                  <Text>Configuration available in full version.</Text>
              </Card>
          )}
        </div>
      </div>
    </div>
  );
};
