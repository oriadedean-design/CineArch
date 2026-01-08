
import React, { useState, useEffect } from 'react';
import { api } from '../services/storage';
import { User, UserUnionTracking, ResidencyDocument, RESIDENCY_DOC_TYPES, CanadianProvince, UNIONS } from '../types';
import { Heading, Text, Button, Input, Select, Badge, Card, ProgressBar } from '../components/ui';
import { BulkJobUpload } from '../components/BulkJobUpload';
import { User as UserIcon, Shield, Crown, Phone, Globe, Trash2, Upload, CheckCircle, Briefcase, Users, Plus, FileSpreadsheet, Zap, Landmark, FileText, X, FolderSync } from 'lucide-react';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<'ACCOUNT' | 'PLAN' | 'GOALS' | 'VAULT' | 'AGENCY'>('ACCOUNT');
  const [user, setUser] = useState<User | null>(null);
  const [trackings, setTrackings] = useState<UserUnionTracking[]>([]);
  const [docs, setDocs] = useState<ResidencyDocument[]>([]);
  const [profileForm, setProfileForm] = useState<Partial<User>>({});
  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);
  const [newTrack, setNewTrack] = useState({ union: '', tierIdx: 0 });

  useEffect(() => { refreshData(); }, []);

  const refreshData = async () => {
    const u = api.auth.getUser();
    setUser(u);
    setProfileForm(u || {});
    // Fix: Handle async calls for jobs and docs in Settings refresh
    setTrackings(api.tracking.get());
    const dList = await api.vault.list();
    setDocs(dList);
    
    // Auto-switch to Agency tab if agent
    if (u?.accountType === 'AGENT' && activeTab === 'ACCOUNT') {
       setActiveTab('AGENCY');
    }
  };

  const handleSave = async () => {
    if (profileForm) {
      await api.auth.updateUser(profileForm);
      refreshData();
    }
  };

  const handleAddTrack = () => {
    const unionMaster = UNIONS.find(u => u.name === newTrack.union);
    if (!unionMaster || !user) return;
    
    const tier = unionMaster.tiers[newTrack.tierIdx];
    const track: UserUnionTracking = {
      id: `track_${Date.now()}`,
      userId: user.id,
      unionTypeId: unionMaster.id,
      unionName: unionMaster.name,
      tierLabel: tier.name,
      targetType: tier.targetType,
      targetValue: tier.targetValue,
      startingValue: 0
    };
    
    api.tracking.save([...trackings, track]);
    setIsAddTrackOpen(false);
    refreshData();
  };

  const removeTrack = (id: string) => {
    api.tracking.save(trackings.filter(t => t.id !== id));
    refreshData();
  };

  const handleUploadSim = async (type: keyof typeof RESIDENCY_DOC_TYPES) => {
    if (!user) return;
    const newDoc: ResidencyDocument = {
      id: `doc_${Date.now()}`,
      userId: user.id,
      type,
      fileName: `${type.toLowerCase()}_archive_2024.pdf`,
      uploadedAt: new Date().toISOString(),
      verified: true
    };
    // Fix: Await async vault addition
    await api.vault.add(newDoc);
    refreshData();
  };

  const deleteDoc = async (id: string) => {
    // Fix: Await async vault deletion
    await api.vault.delete(id);
    refreshData();
  };

  const TabButton = ({ id, label }: { id: typeof activeTab, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-[0.4em] border-l-2 transition-all duration-300 ${activeTab === id ? 'border-accent text-white bg-white/5' : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-12 pb-40">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-12">
        <div className="space-y-2">
          <Text variant="caption">System Configuration</Text>
          <Heading level={1} className="text-7xl">Base Camp.</Heading>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-12">
        <div className="space-y-2">
          {user?.accountType === 'AGENT' && <TabButton id="AGENCY" label="Agency Command" />}
          <TabButton id="ACCOUNT" label="Personnel File" />
          <TabButton id="PLAN" label="Membership" />
          <TabButton id="GOALS" label="Guild Tracks" />
          <TabButton id="VAULT" label="The Vault" />
          
          <div className="pt-20">
             <button 
               onClick={async () => { if(confirm('Checking the gate: Purge all drive data?')) await api.system.resetData(); window.location.reload(); }}
               className="text-[9px] font-black uppercase tracking-widest text-red-500/40 hover:text-red-500 transition-colors p-6"
             >
               Purge Drive
             </button>
          </div>
        </div>

        <div className="md:col-span-3">
          {activeTab === 'AGENCY' && user?.accountType === 'AGENT' && (
             <div className="space-y-12 animate-in fade-in duration-500">
                <div className="space-y-2 border-b border-white/5 pb-8">
                   <h3 className="font-serif italic text-4xl text-white">Agency Command</h3>
                   <p className="text-[10px] text-accent font-black uppercase tracking-widest italic">Roster Master Controller</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-10">
                   <Card className="border-accent/20 bg-accent/5">
                      <div className="space-y-6">
                         <div className="p-4 bg-accent/20 border border-accent/40 w-fit">
                            <FolderSync className="w-6 h-6 text-accent" />
                         </div>
                         <h4 className="text-2xl font-serif italic text-white">Dailies Ingestor</h4>
                         <p className="text-xs text-white/60 leading-relaxed italic font-light">
                            Ingest high-volume production logs for your entire roster. Sync historical data to client drives in bulk.
                         </p>
                         <div className="pt-6">
                            <BulkJobUpload userId={user.id} onComplete={() => refreshData()} />
                         </div>
                      </div>
                   </Card>

                   <Card>
                      <div className="space-y-6">
                         <div className="p-4 bg-white/5 border border-white/10 w-fit">
                            <Users className="w-6 h-6 text-white" />
                         </div>
                         <h4 className="text-2xl font-serif italic text-white">Active Roster</h4>
                         <p className="text-xs text-white/60 leading-relaxed font-light">
                            {user.managedUsers?.length || 0} Professional Personnel synchronized.
                         </p>
                         <div className="space-y-2 pt-6">
                            {user.managedUsers?.map(client => (
                               <div key={client.id} className="flex justify-between items-center p-4 glass-ui border-white/5 hover:border-accent/40 transition-colors cursor-pointer" onClick={() => api.auth.switchClient(client.id)}>
                                  <span className="text-sm font-serif italic text-white">{client.name}</span>
                                  <Badge color="accent">Report to View</Badge>
                               </div>
                            ))}
                         </div>
                      </div>
                   </Card>
                </div>
             </div>
          )}

          {activeTab === 'ACCOUNT' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <Card>
                  <div className="flex items-center gap-4 mb-12 border-b border-white/5 pb-8">
                     <div className="w-14 h-14 bg-accent/10 border border-accent/20 flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-accent" />
                     </div>
                     <div>
                        <h3 className="font-serif italic text-3xl text-white">Personnel Profile</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Base coordinates.</p>
                     </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-10">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Full Name</label>
                       <Input value={profileForm.name || ''} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="h-16 text-lg font-serif italic" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Email (Personnel ID)</label>
                       <Input value={profileForm.email || ''} disabled className="opacity-30 cursor-not-allowed h-16 text-lg font-serif italic" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Jurisdiction</label>
                       <Select value={profileForm.province} onChange={e => setProfileForm({...profileForm, province: e.target.value})} className="h-16 text-lg font-serif italic">
                          {Object.entries(CanadianProvince).map(([k, v]) => <option key={k} value={v} className="bg-black text-white">{v}</option>)}
                       </Select>
                     </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/5 flex justify-end">
                     <Button onClick={handleSave} className="px-12 h-16">Print Updates</Button>
                  </div>
               </Card>
            </div>
          )}

          {activeTab === 'PLAN' && (
             <div className="space-y-8 animate-in fade-in duration-500">
               <Card className="border-accent/20 bg-accent/5">
                  <div className="flex items-center justify-between mb-12">
                     <div className="flex items-center gap-6">
                        <div className="p-4 bg-accent/20 border border-accent/40">
                            <Crown className="w-8 h-8 text-accent" />
                        </div>
                        <div>
                           <h3 className="font-serif italic text-4xl text-white">
                               {user?.accountType === 'AGENT' ? 'Showrunner' : 'A-List Pro'}
                           </h3>
                           <p className="text-[10px] text-accent font-black uppercase tracking-[0.4em]">Status: Verified On-Set</p>
                        </div>
                     </div>
                     <Badge color="accent">Active Account</Badge>
                  </div>
               </Card>
             </div>
          )}

          {activeTab === 'GOALS' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex justify-between items-end mb-6">
                     <div className="space-y-2">
                        <h3 className="font-serif italic text-4xl text-white">Guild Targets</h3>
                        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest italic">Membership and upgrade tracking.</p>
                     </div>
                     <Button onClick={() => setIsAddTrackOpen(true)} variant="outline" className="border-accent text-accent">
                        <Plus size={14} className="mr-2" /> New Target
                     </Button>
                  </div>

                  <div className="grid gap-1">
                     {trackings.length > 0 ? trackings.map(t => {
                        // Fix: Calculate progress from async job list
                        const [progress, setProgress] = useState({ percent: 0, current: 0, target: 0 });
                        useEffect(() => {
                          api.jobs.list().then(js => setProgress(api.tracking.calculateProgress(t.id, js)));
                        }, [t.id]);
                        
                        return (
                          <div key={t.id} className="glass-ui p-8 group flex items-center justify-between hover:bg-white/5 transition-all">
                             <div className="flex gap-8 items-center flex-1">
                                <div className="p-4 bg-white/5 border border-white/10 text-accent">
                                   <Landmark size={20} />
                                </div>
                                <div className="space-y-1 flex-1">
                                   <div className="flex items-center gap-3">
                                      <span className="text-xl font-serif italic text-white">{t.unionName}</span>
                                      <Badge color="neutral">{t.tierLabel}</Badge>
                                   </div>
                                   <div className="max-w-md mt-4">
                                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                                         <span>Progress: {Math.round(progress.percent)}%</span>
                                         <span>{progress.current} / {progress.target} {t.targetType}</span>
                                      </div>
                                      <ProgressBar progress={progress.percent} />
                                   </div>
                                </div>
                             </div>
                             <button onClick={() => removeTrack(t.id)} className="p-3 text-white/20 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                             </button>
                          </div>
                        );
                     }) : (
                        <div className="py-20 text-center glass-ui border-dashed border-white/10 opacity-30">
                           <p className="text-[10px] font-black uppercase tracking-widest">No guild alignment detected.</p>
                        </div>
                     )}
                  </div>
              </div>
          )}

          {activeTab === 'VAULT' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                  <div className="space-y-2 border-b border-white/5 pb-8">
                     <h3 className="font-serif italic text-4xl text-white">The Vault</h3>
                     <p className="text-[10px] text-white/40 uppercase font-black tracking-widest italic">Encrypted archival documents.</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                     {Object.entries(RESIDENCY_DOC_TYPES).map(([key, label]) => (
                       <button 
                         key={key} 
                         onClick={() => handleUploadSim(key as any)}
                         className="glass-ui p-8 flex flex-col items-center gap-6 group hover:border-accent transition-all text-center h-48 justify-center"
                       >
                         <Upload size={24} className="text-white/20 group-hover:text-accent transition-colors" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">{label}</span>
                       </button>
                     ))}
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};
