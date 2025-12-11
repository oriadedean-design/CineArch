
import React, { useState, useEffect } from 'react';
import { api } from '../services/storage';
import { User, UserUnionTracking, ResidencyDocument, RESIDENCY_DOC_TYPES, CanadianProvince } from '../types';
import { Heading, Text, Button, Input, Select, Badge } from '../components/ui';
import { User as UserIcon, Shield, Crown, Phone, Globe, Trash2, Upload, CheckCircle, Briefcase, Users, Plus, FileSpreadsheet, Zap } from 'lucide-react';

export const Settings = ({ user: appUser }: { user: User }) => {
  const [activeTab, setActiveTab] = useState<'ACCOUNT' | 'PREMIUM' | 'GOALS' | 'VAULT' | 'ROSTER'>('ACCOUNT');
  const [user, setUser] = useState<User | null>(appUser);
  const [trackings, setTrackings] = useState<UserUnionTracking[]>([]);
  const [docs, setDocs] = useState<ResidencyDocument[]>([]);

  // Form states
  const [profileForm, setProfileForm] = useState<Partial<User>>({});
  const [newDocType, setNewDocType] = useState<string>('LICENSE');
  const [newClientName, setNewClientName] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const u = api.auth.getUser() || appUser;
    setUser(u);
    setProfileForm(u || {});
    setTrackings(api.tracking.get());
    setDocs(api.vault.list());
  };

  const handleProfileSave = () => {
    if (profileForm) {
      api.auth.updateUser(profileForm);
      refreshData();
      alert('Profile updated successfully.');
    }
  };

  const togglePremium = () => {
    const newState = !user?.isPremium;
    // Different logic for Agents vs Individuals
    if (user?.accountType === 'AGENT') {
        if(confirm("Activate Agency Tier ($90/mo)? Manage up to 50 Clients.")) {
             api.auth.updateUser({ isPremium: true });
             refreshData();
        }
    } else {
        if (newState) {
            if(confirm("Confirm Subscription: Upgrade to CineArch Pro ($10/mo)?")) {
                api.auth.updateUser({ isPremium: true });
                refreshData();
            }
        } else {
            if(confirm("Downgrade to Free Plan? You will lose access to the Vault and Bulk Tools.")) {
                api.auth.updateUser({ isPremium: false });
                refreshData();
            }
        }
    }
  };

  const handleAgencyAddOn = (amount: number, seats: number) => {
     if (confirm(`Purchase Add-on: ${seats} additional seats for $${amount}/mo?`)) {
         alert("Add-on activated!");
     }
  };

  const handleGoalUpdate = (id: string, updates: Partial<UserUnionTracking>) => {
    const updated = trackings.map(t => t.id === id ? { ...t, ...updates } : t);
    setTrackings(updated);
    api.tracking.save(user!.id, updated);
  };

  const handleDocUpload = () => {
    const name = prompt('Simulate File Selection: Enter filename (e.g. license_scan.png)');
    if (name && user) {
      const doc: ResidencyDocument = {
        id: `doc_${Date.now()}`,
        userId: user.id, // Docs uploaded to current context
        type: newDocType as any,
        fileName: name,
        uploadedAt: new Date().toISOString(),
        verified: false,
        url: ''
      };
      api.vault.add(doc);
      refreshData();
    }
  };

  const handleDeleteDoc = (id: string) => {
    if (confirm('Delete this document?')) {
      api.vault.delete(id);
      refreshData();
    }
  };

  const handleAddClient = () => {
     if (!newClientName) return;
     const newClient: User = {
         id: `client_${Date.now()}`,
         name: newClientName,
         email: `${newClientName.toLowerCase().replace(' ', '.')}@example.com`,
         role: 'Actor',
         province: 'Ontario',
         isOnboarded: true,
         accountType: 'INDIVIDUAL'
     };
     api.auth.addClient(newClient);
     setNewClientName('');
     refreshData();
     alert(`Added ${newClientName} to Roster. Use the sidebar dropdown to manage them.`);
  };

  const handleBulkClientUpload = () => {
      alert("Simulated: Imported 15 clients from CSV with work history.");
      // In real app, this would parse CSV and call addClient for each
      refreshData();
  };

  const DangerZone = () => (
      <div className="mt-12 pt-8 border-t border-red-100">
         <h4 className="text-red-700 font-bold mb-4 flex items-center gap-2"><Shield className="w-4 h-4"/> Danger Zone</h4>
         <div className="flex gap-4">
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => {
                 api.auth.logout();
                 window.location.reload();
            }}>Log Out</Button>
            
            <Button variant="danger" onClick={() => {
                 const confirmTxt = prompt('Type "REFRESH NOW" to wipe data but keep account.');
                 if(confirmTxt === 'REFRESH NOW') {
                    api.system.resetData();
                    window.location.reload();
                 }
            }}>Reset Data</Button>

            <Button variant="danger" onClick={() => {
                 const confirmTxt = prompt('Type "PLEASE DELETE" to permanently delete account.');
                 if(confirmTxt === 'PLEASE DELETE') {
                    api.system.deleteAccount();
                 }
            }}>Delete Account</Button>
         </div>
      </div>
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
        {/* Settings Navigation */}
        <div className="space-y-1">
          <button 
            onClick={() => setActiveTab('ACCOUNT')}
            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-2 transition-all ${activeTab === 'ACCOUNT' ? 'border-[#C73E1D] text-[#121212] bg-white' : 'border-transparent text-neutral-500 hover:text-[#121212]'}`}
          >
            Account & Identity
          </button>
          <button 
            onClick={() => setActiveTab('PREMIUM')}
            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-2 transition-all ${activeTab === 'PREMIUM' ? 'border-[#C73E1D] text-[#121212] bg-white' : 'border-transparent text-neutral-500 hover:text-[#121212]'}`}
          >
            {user?.accountType === 'AGENT' ? 'Agency Plan' : 'Subscription'}
          </button>
          {user?.accountType === 'AGENT' && (
             <button 
               onClick={() => setActiveTab('ROSTER')}
               className={`w-full text-left px-4 py-3 text-sm font-medium border-l-2 transition-all ${activeTab === 'ROSTER' ? 'border-[#C73E1D] text-[#121212] bg-white' : 'border-transparent text-neutral-500 hover:text-[#121212]'}`}
             >
               Roster Management
             </button>
          )}
          <button 
            onClick={() => setActiveTab('GOALS')}
            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-2 transition-all ${activeTab === 'GOALS' ? 'border-[#C73E1D] text-[#121212] bg-white' : 'border-transparent text-neutral-500 hover:text-[#121212]'}`}
          >
            Union Targets
          </button>
          <button 
            onClick={() => setActiveTab('VAULT')}
            className={`w-full text-left px-4 py-3 text-sm font-medium border-l-2 transition-all ${activeTab === 'VAULT' ? 'border-[#C73E1D] text-[#121212] bg-white' : 'border-transparent text-neutral-500 hover:text-[#121212]'}`}
          >
            Residency Vault
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-8">
          
          {/* --- ACCOUNT TAB --- */}
          {activeTab === 'ACCOUNT' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-white p-8 border border-neutral-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-neutral-100 rounded-full">
                    <UserIcon className="w-6 h-6 text-neutral-600" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl">Identity Profile</h3>
                    <Text variant="small">Personal details and regional settings.</Text>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Full Name</label>
                    <Input value={profileForm.name || ''} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Email</label>
                    <Input value={profileForm.email || ''} disabled className="opacity-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-0 top-3 text-neutral-400" />
                      <Input className="pl-6" value={profileForm.phone || ''} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Country</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 absolute left-0 top-3 text-neutral-400" />
                      <Input className="pl-6" value={profileForm.country || 'Canada'} onChange={e => setProfileForm({...profileForm, country: e.target.value})} />
                    </div>
                  </div>
                   <div>
                    <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Language</label>
                    <Select value={profileForm.language || 'English'} onChange={e => setProfileForm({...profileForm, language: e.target.value})}>
                      <option value="English">English</option>
                      <option value="French">Français</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Province</label>
                    <Select value={profileForm.province} onChange={e => setProfileForm({...profileForm, province: e.target.value})}>
                       {Object.entries(CanadianProvince).map(([k, v]) => <option key={k} value={v}>{v}</option>)}
                    </Select>
                  </div>
                </div>
                <div className="pt-6 mt-4">
                  <Button onClick={handleProfileSave}>Save Changes</Button>
                </div>
                <DangerZone />
              </div>
            </div>
          )}

           {/* --- PREMIUM TAB --- */}
           {activeTab === 'PREMIUM' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
               <div className="bg-[#121212] text-white p-8">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <Crown className="w-8 h-8 text-[#C73E1D]" />
                        <div>
                           <h3 className="font-serif text-2xl">{user?.accountType === 'AGENT' ? 'Agency Portal' : 'CineArch Pro'}</h3>
                           <p className="text-neutral-400">
                             {user?.isPremium 
                                ? user?.accountType === 'AGENT' ? 'Enterprise License Active' : 'Pro Membership Active' 
                                : 'Free Plan Active'
                             }
                           </p>
                        </div>
                     </div>
                     <Badge color={user?.isPremium ? 'accent' : 'neutral'}>{user?.isPremium ? 'ACTIVE' : 'FREE TIER'}</Badge>
                  </div>
                  
                  <div className="mt-8 grid md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                           <span className="text-4xl font-serif">{user?.accountType === 'AGENT' ? '$90' : '$10'}</span>
                           <span className="text-neutral-400">/ month</span>
                        </div>
                        <p className="text-sm text-neutral-400 leading-relaxed">
                           {user?.accountType === 'AGENT' 
                              ? 'Includes roster management for up to 50 active accounts.' 
                              : 'Includes unlimited storage, API integrations, and advanced education.'
                           }
                        </p>
                     </div>
                     <ul className="space-y-3">
                        <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#C73E1D]"/> <span>Unlimited API Pulls</span></li>
                        <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#C73E1D]"/> <span>Secure Cloud Storage</span></li>
                        {user?.accountType === 'AGENT' && (
                            <>
                                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#C73E1D]"/> <span>50 Client Roster Limit</span></li>
                                <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#C73E1D]"/> <span>Priority Support</span></li>
                            </>
                        )}
                     </ul>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/10">
                     <Button 
                       onClick={togglePremium} 
                       className="bg-white text-black hover:bg-neutral-200 border-none w-full md:w-auto"
                     >
                        {user?.isPremium 
                            ? 'Manage Billing' 
                            : user?.accountType === 'AGENT' ? 'Upgrade to Agency Tier ($90/mo)' : 'Upgrade to Pro ($10/mo)'
                        }
                     </Button>
                  </div>
               </div>

               {/* Agency Add-ons */}
               {user?.accountType === 'AGENT' && user?.isPremium && (
                   <div className="bg-white p-8 border border-neutral-200">
                      <Heading level={3}>Capacity Add-ons</Heading>
                      <Text className="mb-6">Need more seats? Expand your roster capacity instantly.</Text>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                         <div className="p-4 border border-neutral-200 flex justify-between items-center hover:border-[#121212] cursor-pointer" onClick={() => handleAgencyAddOn(35, 50)}>
                            <div className="flex items-center gap-3">
                               <Users className="w-5 h-5 text-neutral-500" />
                               <div>
                                  <p className="font-bold">+50 Accounts</p>
                                  <p className="text-xs text-neutral-500">$35 / month</p>
                               </div>
                            </div>
                            <Plus className="w-4 h-4" />
                         </div>
                         <div className="p-4 border border-neutral-200 flex justify-between items-center hover:border-[#121212] cursor-pointer" onClick={() => handleAgencyAddOn(50, 100)}>
                            <div className="flex items-center gap-3">
                               <Zap className="w-5 h-5 text-[#C73E1D]" />
                               <div>
                                  <p className="font-bold">+100 Accounts</p>
                                  <p className="text-xs text-neutral-500">$50 / month</p>
                               </div>
                            </div>
                            <Plus className="w-4 h-4" />
                         </div>
                      </div>
                   </div>
               )}
            </div>
           )}

           {/* --- ROSTER TAB (AGENTS ONLY) --- */}
           {activeTab === 'ROSTER' && user?.accountType === 'AGENT' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-white p-8 border border-neutral-200">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                           <Heading level={3}>Client Roster</Heading>
                           <Text>Manage your talent list. Switch views using the sidebar.</Text>
                        </div>
                        <div className="text-right">
                           <Text variant="caption">Usage</Text>
                           <span className="font-serif text-xl">{(user.managedUsers?.length || 0)} / {user.isPremium ? '50' : '5'}</span>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 mb-8">
                        <div className="flex-1">
                             <Input 
                                placeholder="Client Full Name" 
                                value={newClientName}
                                onChange={e => setNewClientName(e.target.value)}
                             />
                        </div>
                        <Button onClick={handleAddClient} disabled={!newClientName}>
                            <Plus className="w-4 h-4 mr-2" /> Add Client
                        </Button>
                        <Button variant="secondary" onClick={handleBulkClientUpload}>
                            <FileSpreadsheet className="w-4 h-4 mr-2" /> Bulk CSV Import
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {user.managedUsers?.length === 0 ? (
                            <Text variant="subtle" className="text-center py-8 border border-dashed">No clients in roster.</Text>
                        ) : (
                            user.managedUsers?.map(client => (
                                <div key={client.id} className="flex justify-between items-center p-4 bg-neutral-50 border border-neutral-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#121212] rounded-full flex items-center justify-center text-white text-xs">
                                            {client.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium">{client.name}</p>
                                            <p className="text-xs text-neutral-500">{client.email}</p>
                                        </div>
                                    </div>
                                    <Badge>Active</Badge>
                                </div>
                            ))
                        )}
                    </div>
                </div>
             </div>
           )}


          {/* --- GOALS TAB --- */}
          {activeTab === 'GOALS' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center">
                 <h3 className="font-serif text-2xl">Active Goal Trackers</h3>
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-widest">Mode:</span>
                    <button 
                      className={`px-3 py-1 text-xs border ${user?.memberStatus !== 'MEMBER' ? 'bg-[#121212] text-white border-[#121212]' : 'bg-white text-neutral-500'}`}
                      onClick={() => { setProfileForm({...profileForm, memberStatus: 'ASPIRING'}); api.auth.updateUser({ memberStatus: 'ASPIRING' }); setUser({...user!, memberStatus: 'ASPIRING'}); }}
                    >
                      Aspiring
                    </button>
                    <button 
                      className={`px-3 py-1 text-xs border ${user?.memberStatus === 'MEMBER' ? 'bg-[#121212] text-white border-[#121212]' : 'bg-white text-neutral-500'}`}
                      onClick={() => { setProfileForm({...profileForm, memberStatus: 'MEMBER'}); api.auth.updateUser({ memberStatus: 'MEMBER' }); setUser({...user!, memberStatus: 'MEMBER'}); }}
                    >
                      Member
                    </button>
                 </div>
              </div>

              {trackings.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-neutral-200">
                      <Text>No active trackers. Go to Dashboard configuration.</Text>
                  </div>
              ) : (
                trackings.map(track => (
                    <div key={track.id} className="bg-white p-6 border border-neutral-200">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                        <h4 className="font-serif text-xl">{track.unionName}</h4>
                        <div className="flex gap-2 mt-1">
                            <Badge>{track.tierLabel}</Badge>
                            {track.department && <Badge color="accent">{track.department}</Badge>}
                        </div>
                        </div>
                        <div className="text-right">
                        <Text variant="caption">Target Type</Text>
                        <span className="font-medium">{track.targetType}</span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 bg-neutral-50 p-4 border border-neutral-100">
                        <div>
                        <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Starting / Existing Count</label>
                        <Input 
                            type="number" 
                            value={track.startingValue} 
                            onChange={e => handleGoalUpdate(track.id, { startingValue: Number(e.target.value) })}
                        />
                        </div>
                        <div>
                        <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Goal Target</label>
                        <Input 
                            type="number" 
                            value={track.targetValue} 
                            onChange={e => handleGoalUpdate(track.id, { targetValue: Number(e.target.value) })}
                        />
                        </div>
                    </div>
                    </div>
                ))
              )}
            </div>
          )}

          {/* --- VAULT TAB --- */}
          {activeTab === 'VAULT' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-[#121212] text-white p-8 rounded-none">
                <div className="flex items-center gap-4 mb-4">
                  <Shield className="w-8 h-8" strokeWidth={1} />
                  <div>
                    <h3 className="font-serif text-2xl">Residency Vault</h3>
                    <p className="text-neutral-400 text-sm">Secure storage for tax credit documentation.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-end bg-white/5 p-4 rounded mt-6 border border-white/10">
                   <div className="flex-1">
                     <label className="block text-xs font-medium uppercase tracking-widest text-neutral-400 mb-2">Document Type</label>
                     <select 
                       className="w-full bg-transparent border-b border-white/20 text-white py-2 focus:outline-none focus:border-white"
                       value={newDocType}
                       onChange={e => setNewDocType(e.target.value)}
                     >
                       {Object.entries(RESIDENCY_DOC_TYPES).map(([k, v]) => <option key={k} value={k} className="text-black">{v}</option>)}
                     </select>
                   </div>
                   <Button onClick={handleDocUpload} className="bg-white text-black hover:bg-neutral-200 border-none">
                     <Upload className="w-4 h-4 mr-2" /> Upload
                   </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {docs.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-neutral-300">
                    <Text variant="subtle">No documents in vault.</Text>
                  </div>
                ) : (
                  docs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-neutral-200">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-neutral-100">
                          <Briefcase className="w-6 h-6 text-neutral-600" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{RESIDENCY_DOC_TYPES[doc.type as keyof typeof RESIDENCY_DOC_TYPES]}</p>
                          <p className="text-sm text-neutral-500">{doc.fileName} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                         {doc.verified && <Badge color="success"><CheckCircle className="w-3 h-3 mr-1"/> Verified</Badge>}
                         <button onClick={() => handleDeleteDoc(doc.id)} className="text-neutral-400 hover:text-red-600 p-2">
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
