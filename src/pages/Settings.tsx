
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/storage';
import { User, UserUnionTracking, RESIDENCY_DOC_TYPES, CanadianProvince, DocumentType, DocumentMetadata } from '../types';
import { Heading, Text, Button, Input, Select, Badge } from '../components/ui';
import { User as UserIcon, Shield, Crown, Phone, Globe, Trash2, Upload, CheckCircle, Briefcase, Users, Plus, FileSpreadsheet, Zap } from 'lucide-react';
import { documentService } from '../services/documentService';
import { agencyService } from '../services/agencyService';
import { trackingService } from '../services/trackingService';
import { db } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

export const Settings = ({ user: appUser }: { user: User }) => {
  const [activeTab, setActiveTab] = useState<'ACCOUNT' | 'PREMIUM' | 'GOALS' | 'VAULT' | 'ROSTER'>('ACCOUNT');
  const [user, setUser] = useState<User | null>(appUser);
  const [trackings, setTrackings] = useState<UserUnionTracking[]>([]);
  const [docs, setDocs] = useState<DocumentMetadata[]>([]);
  const [roster, setRoster] = useState<User[]>(appUser.managedUsers || []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const targetUserId = appUser.activeViewId || appUser.id;

  // CSV import helpers for agency roster
  const [csvPreview, setCsvPreview] = useState<{ headers: string[]; rows: string[][] }>({ headers: [], rows: [] });
  const [csvError, setCsvError] = useState<string | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    fullName: '',
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    province: '',
    unionStatus: ''
  });

  // Form states
  const [profileForm, setProfileForm] = useState<Partial<User>>({});
  const [newDocType, setNewDocType] = useState<string>('LICENSE');
  const [newClientName, setNewClientName] = useState('');

  useEffect(() => {
    refreshData();
  }, [targetUserId]);

  const refreshData = async () => {
    const u = api.auth.getUser() || appUser;
    setUser(u);
    setProfileForm(u || {});

    // Trackers & jobs for target user so stats remain accurate when an agent is switched
    const [remoteTrackers, remoteDocs] = await Promise.all([
      trackingService.getTrackers(targetUserId),
      documentService.list(targetUserId)
    ]);

    setTrackings(remoteTrackers);
    setDocs(remoteDocs);

    if (u?.accountType === 'AGENT') {
      const remoteRoster = await agencyService.getRoster(u.id);
      setRoster(remoteRoster.map((assignment) => ({
        id: assignment.memberId,
        name: assignment.memberEmail,
        email: assignment.memberEmail,
        role: 'Actor',
        province: 'Ontario',
        isOnboarded: true,
        accountType: 'INDIVIDUAL'
      }) as User));
    } else {
      setRoster(u?.managedUsers || []);
    }
  };

  const handleProfileSave = () => {
    if (profileForm) {
      if (db && user) {
        setDoc(doc(db, 'users', user.id), profileForm, { merge: true });
      } else {
        api.auth.updateUser(profileForm);
      }
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
    if (db) {
      trackingService.saveTrackers(targetUserId, updated as UserUnionTracking[]);
    } else {
      api.tracking.save(user!.id, updated);
    }
  };

  const handleDocUpload = async (file?: File) => {
    if (!file && fileInputRef.current) {
      fileInputRef.current.click();
      return;
    }

    if (file && user) {
      if (db) {
        await documentService.upload(targetUserId, file, file.name, newDocType as DocumentType, file.type);
      } else {
        // Offline/dev fallback
        const doc: DocumentMetadata = {
          id: `doc_${Date.now()}`,
          userId: targetUserId,
          docType: newDocType as any,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          verified: false,
          url: ''
        };
        api.vault.add(doc);
      }
      refreshData();
    }
  };

  const handleDeleteDoc = (id: string) => {
    if (confirm('Delete this document?')) {
      const run = async () => {
        if (db) {
          await documentService.remove(targetUserId, id);
        } else {
          api.vault.delete(id);
        }
        refreshData();
      };
      run();
    }
  };

  const handleAddClient = async () => {
     if (!newClientName) return;
     const newClient: User = {
         id: `client_${Date.now()}`,
         name: newClientName,
         email: `${newClientName.toLowerCase().replace(' ', '.')}@example.com`,
         role: 'Actor',
         province: 'Ontario',
         memberStatus: 'ASPIRING',
         isOnboarded: true,
         accountType: 'INDIVIDUAL'
     };

     if (db && user?.accountType === 'AGENT') {
        await agencyService.attachClient(user, newClient);
     } else {
        api.auth.addClient(newClient);
     }

     setRoster(prev => [...prev, newClient]);
     setNewClientName('');
     alert(`Added ${newClientName} to Roster. Use the sidebar dropdown to manage them.`);
  };

  const handleTemplateDownload = () => {
    const sample = [
      'first_name,last_name,email,role,province,union_status',
      'Alex,Nguyen,alex.nguyen@example.com,Production Assistant,Ontario,NON_UNION',
      'Priya,Patel,priya.patel@example.com,Camera Assistant,British Columbia,APPRENTICE'
    ].join('\n');

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'cinearch_roster_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvText = (text: string) => {
    const rows = text.trim().split(/\r?\n/).filter(Boolean);
    if (rows.length < 2) {
      setCsvError('CSV appears empty. Please include a header row and at least one record.');
      setCsvPreview({ headers: [], rows: [] });
      return;
    }
    const headers = rows[0].split(',').map((h) => h.trim());
    const dataRows = rows.slice(1).map((row) => row.split(',').map((c) => c.trim()));
    setCsvPreview({ headers, rows: dataRows });
    setCsvError(null);

    // Auto-guess some mappings
    const guess = (keyword: string) => headers.find((h) => h.toLowerCase().includes(keyword)) || '';
    setColumnMapping((prev) => ({
      ...prev,
      firstName: guess('first'),
      lastName: guess('last'),
      fullName: guess('name'),
      email: guess('mail'),
      role: guess('role'),
      province: guess('province'),
      unionStatus: guess('union') || guess('status'),
    }));
  };

  const handleCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result?.toString() || '';
      parseCsvText(text);
    };
    reader.readAsText(file);
  };

  const applyCsvImport = async () => {
    if (!csvPreview.headers.length || !csvPreview.rows.length) {
      setCsvError('Upload a CSV before importing.');
      return;
    }

    const requiredFields = ['email'];
    for (const field of requiredFields) {
      if (!columnMapping[field]) {
        setCsvError(`Please map a column to ${field}.`);
        return;
      }
    }

    const headerIndex = (key: string) => csvPreview.headers.indexOf(columnMapping[key]);
    const getValue = (row: string[], key: string) => {
      const idx = headerIndex(key);
      return idx >= 0 ? row[idx] : '';
    };

    const newClients: User[] = csvPreview.rows.map((row, idx) => {
      const first = getValue(row, 'firstName');
      const last = getValue(row, 'lastName');
      const fullName = (getValue(row, 'fullName') || `${first} ${last}`).trim() || `Roster ${idx + 1}`;
      const email = getValue(row, 'email') || `${fullName.replace(/\s+/g, '.').toLowerCase()}@example.com`;

      const statusRaw = (getValue(row, 'unionStatus') || '').toUpperCase();
      const normalizedStatus: User['memberStatus'] = statusRaw.includes('FULL') ? 'MEMBER' : 'ASPIRING';

      return {
        id: `client_${Date.now()}_${idx}`,
        name: fullName,
        email,
        role: getValue(row, 'role') || 'Actor',
        province: getValue(row, 'province') || 'Ontario',
        isOnboarded: true,
        accountType: 'INDIVIDUAL',
        memberStatus: normalizedStatus,
      };
    });

    if (db && user?.accountType === 'AGENT') {
      await Promise.all(newClients.map((client) => agencyService.attachClient(user, client)));
    } else {
      newClients.forEach((client) => api.auth.addClient(client));
    }

    setRoster((prev) => [...prev, ...newClients]);
    setCsvPreview({ headers: [], rows: [] });
    setCsvError(null);
    alert(`Imported ${newClients.length} clients. You can switch views from the sidebar.`);
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
                           <span className="font-serif text-xl">{roster.length} / {user.isPremium ? '50' : '5'}</span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-3">
                          <Text variant="caption">Quick add</Text>
                          <div className="flex gap-3">
                            <Input
                              placeholder="Client Full Name"
                              value={newClientName}
                              onChange={e => setNewClientName(e.target.value)}
                            />
                            <Button onClick={handleAddClient} disabled={!newClientName}>
                              <Plus className="w-4 h-4 mr-2" /> Add
                            </Button>
                          </div>
                          <Text variant="subtle" className="text-xs">Adds a single roster entry instantly.</Text>
                        </div>

                        <div className="space-y-3">
                          <Text variant="caption">Bulk upload</Text>
                          <div className="flex flex-wrap gap-3 items-center">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleCsvFile(file);
                                }}
                              />
                              <span className="inline-flex items-center px-4 py-3 border border-neutral-300 text-sm uppercase tracking-widest hover:border-[#121212]">
                                <FileSpreadsheet className="w-4 h-4 mr-2" /> Upload CSV
                              </span>
                            </label>
                            <Button variant="secondary" onClick={handleTemplateDownload}>
                              Download Template
                            </Button>
                          </div>
                          <Text variant="subtle" className="text-xs">Upload a spreadsheet, map columns, and bulk-create roster profiles.</Text>
                        </div>
                    </div>

                    {csvPreview.headers.length > 0 && (
                      <div className="border border-dashed border-neutral-300 p-4 mb-6 bg-neutral-50">
                        <Heading level={4} className="text-lg mb-3">Map your columns</Heading>
                        <div className="grid md:grid-cols-3 gap-3">
                          {[
                            { key: 'fullName', label: 'Full name' },
                            { key: 'firstName', label: 'First name (optional)' },
                            { key: 'lastName', label: 'Last name (optional)' },
                            { key: 'email', label: 'Email' },
                            { key: 'role', label: 'Role' },
                            { key: 'province', label: 'Province' },
                            { key: 'unionStatus', label: 'Union status' },
                          ].map((field) => (
                            <div key={field.key}>
                              <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-1">{field.label}</label>
                              <Select
                                value={columnMapping[field.key]}
                                onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                                className="bg-white"
                              >
                                <option value="">Not mapped</option>
                                {csvPreview.headers.map((header) => (
                                  <option key={header} value={header}>{header}</option>
                                ))}
                              </Select>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4">
                          <Heading level={4} className="text-base mb-2">Preview (first 3 rows)</Heading>
                          <div className="overflow-auto border border-neutral-200 bg-white">
                            <table className="min-w-full text-sm">
                              <thead className="bg-neutral-100">
                                <tr>
                                  {csvPreview.headers.map((h) => (<th key={h} className="text-left px-3 py-2 font-medium">{h}</th>))}
                                </tr>
                              </thead>
                              <tbody>
                                {csvPreview.rows.slice(0, 3).map((row, idx) => (
                                  <tr key={idx} className="border-t border-neutral-100">
                                    {row.map((cell, cIdx) => <td key={cIdx} className="px-3 py-2">{cell}</td>)}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {csvError && <Text className="text-red-600 mt-3">{csvError}</Text>}

                        <div className="mt-4 flex justify-end gap-3">
                          <Button variant="secondary" onClick={() => { setCsvPreview({ headers: [], rows: [] }); setCsvError(null); }}>Clear</Button>
                          <Button onClick={applyCsvImport}>Import & Align Columns</Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                        {roster.length === 0 ? (
                            <Text variant="subtle" className="text-center py-8 border border-dashed">No clients in roster.</Text>
                        ) : (
                            roster.map(client => (
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
                   <input
                     type="file"
                     ref={fileInputRef}
                     className="hidden"
                     onChange={(e) => {
                       const f = e.target.files?.[0];
                       if (f) handleDocUpload(f);
                     }}
                   />
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
                          <p className="font-medium text-neutral-900">{RESIDENCY_DOC_TYPES[doc.docType as keyof typeof RESIDENCY_DOC_TYPES] || doc.docType}</p>
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
