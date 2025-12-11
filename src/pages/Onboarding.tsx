
import React, { useState } from 'react';
import { User, CanadianProvince, FILM_ROLES, UNIONS, UserUnionTracking, DEPARTMENTS, AGENT_ROLES, AGENT_INDUSTRIES } from '../types';
import { api } from '../services/storage';
import { authService } from '../services/authService';
import { Button, Input, Select, Heading, Text, Badge } from '../components/ui';
import { Check, ArrowRight, FileSpreadsheet, Users } from 'lucide-react';

interface OnboardingProps {
  user: User;
  onComplete: (updates: Partial<User>) => void;
}

export const Onboarding = ({ user, onComplete }: OnboardingProps) => {
  // If user is Agent, use the Agent Flow logic, else Member Flow
  const isAgent = user.accountType === 'AGENT';
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Member Fields
    role: user.role || FILM_ROLES[0],
    province: user.province || CanadianProvince.ON,
    selectedUnions: [] as string[],
    activeTrackers: [] as Partial<UserUnionTracking>[],
    
    // Agent Fields
    agentRole: AGENT_ROLES[0],
    agentIndustries: [] as string[],
    rosterSetupMethod: 'IMPORT' as 'IMPORT' | 'MANUAL',
    manualRoster: [] as any[] // Temp storage for initial manual entries
  });
  
  // Local state for Manual Entry Loop
  const [manualEntryForm, setManualEntryForm] = useState({
      firstName: '', lastName: '', role: FILM_ROLES[0], unionStatus: 'NON_UNION', industry: AGENT_INDUSTRIES[0]
  });

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleFinish = async () => {
    // Update Profile
    const updates: Partial<User> = {
      province: formData.province,
      isOnboarded: true
    };

    if (isAgent) {
        updates.role = formData.agentRole;
        updates.primaryIndustry = formData.agentIndustries[0]; // Set primary to first selected
        // In real app we store the list of industries too
        
        // Save Roster if Manual
        if (formData.rosterSetupMethod === 'MANUAL' && formData.manualRoster.length > 0) {
            formData.manualRoster.forEach(client => {
                api.auth.addClient({
                    id: `client_${Date.now()}_${Math.random()}`,
                    name: `${client.firstName} ${client.lastName}`,
                    email: `${client.firstName.toLowerCase()}@example.com`, // mock email
                    role: client.role,
                    province: formData.province,
                    isOnboarded: true,
                    accountType: 'INDIVIDUAL'
                });
            });
        }
    } else {
        updates.role = formData.role;
        // Save Member Tracking
        const trackingData: UserUnionTracking[] = formData.activeTrackers.map((t, idx) => ({
            id: `track_${Date.now()}_${idx}`,
            userId: user.id,
            unionTypeId: t.unionTypeId!,
            unionName: t.unionName!,
            tierLabel: t.tierLabel!,
            department: t.department,
            targetType: t.targetType!,
            targetValue: t.targetValue!,
            startingValue: t.startingValue || 0
        }));
        api.tracking.save(user.id, trackingData);
    }

    await authService.updateUser(user.id, updates);
    onComplete(updates);
  };

  // --- SHARED STEPS ---
  const StepWelcome = () => (
    <div className="text-center space-y-8 py-12 animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-[#121212] text-white flex items-center justify-center mx-auto mb-8 rounded-none">
        <span className="font-serif text-4xl italic">Ca</span>
      </div>
      <Heading level={1}>CineArch OS</Heading>
      <Text className="max-w-md mx-auto text-lg leading-relaxed">
        {isAgent 
            ? "A professional interface for Talent Managers and Agencies. Manage rosters, track auditions, and streamline compliance."
            : "A professional operating system for the Canadian film workforce. Organize your career, track eligibility, and manage compliance."
        }
      </Text>
      <div className="pt-8">
        <Button onClick={handleNext} className="w-full md:w-auto min-w-[200px]">And Action</Button>
      </div>
    </div>
  );

  // --- MEMBER FLOW STEPS ---
  const StepMemberProfile = () => (
    <div className="space-y-8 max-w-md mx-auto py-4 animate-in slide-in-from-right duration-300">
      <div>
        <Text variant="caption" className="mb-2">Step 01</Text>
        <Heading level={2}>Profile</Heading>
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Primary Role</label>
          <Select 
            value={formData.role} 
            onChange={e => setFormData({...formData, role: e.target.value})}
          >
            {FILM_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Province</label>
          <Select 
            value={formData.province} 
            onChange={e => setFormData({...formData, province: e.target.value})}
          >
            {Object.entries(CanadianProvince).map(([k, v]) => <option key={k} value={v}>{v}</option>)}
          </Select>
        </div>
      </div>
      <div className="flex justify-between pt-12">
        <Button variant="ghost" onClick={handleBack}>Back</Button>
        <Button onClick={handleNext}>Next <ArrowRight className="w-4 h-4 ml-2"/></Button>
      </div>
    </div>
  );

  const StepMemberUnions = () => {
    const toggleUnion = (id: string) => {
      const selected = formData.selectedUnions.includes(id)
        ? formData.selectedUnions.filter(u => u !== id)
        : [...formData.selectedUnions, id];
      
      let newTrackers = [...formData.activeTrackers];
      
      if (!formData.selectedUnions.includes(id)) {
        const union = UNIONS.find(u => u.id === id)!;
        const defaultTier = union.tiers[0];
        newTrackers.push({
          unionTypeId: union.id,
          unionName: union.name,
          tierLabel: defaultTier.name,
          targetType: defaultTier.targetType,
          targetValue: defaultTier.targetValue,
          department: defaultTier.requiresDepartment ? DEPARTMENTS[0] : undefined,
          startingValue: 0
        });
      } else {
        newTrackers = newTrackers.filter(t => t.unionTypeId !== id);
      }

      setFormData({ ...formData, selectedUnions: selected, activeTrackers: newTrackers });
    };

    return (
      <div className="space-y-8 max-w-lg mx-auto py-4 animate-in slide-in-from-right duration-300">
        <div>
          <Text variant="caption" className="mb-2">Step 02</Text>
          <Heading level={2}>Affiliations</Heading>
          <Text variant="subtle" className="mt-2">Select unions you are a member of or tracking eligibility for.</Text>
        </div>
        
        <div className="space-y-3">
          {UNIONS.map(union => {
            const isSelected = formData.selectedUnions.includes(union.id);
            return (
              <div 
                key={union.id}
                onClick={() => toggleUnion(union.id)}
                className={`p-5 cursor-pointer transition-all border ${isSelected ? 'bg-[#121212] border-[#121212] text-white' : 'bg-white border-neutral-200 hover:border-neutral-400 text-[#121212]'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-xl">{union.name}</h3>
                    <p className={`text-sm mt-1 ${isSelected ? 'text-neutral-400' : 'text-neutral-500'}`}>{union.description}</p>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-white" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between pt-12">
          <Button variant="ghost" onClick={handleBack}>Back</Button>
          <Button onClick={handleNext} disabled={formData.selectedUnions.length === 0}>Next <ArrowRight className="w-4 h-4 ml-2"/></Button>
        </div>
      </div>
    );
  };

  const StepMemberConfig = () => {
    // Re-using config logic from previous version, slightly streamlined for readability
    const updateTracker = (index: number, updates: Partial<UserUnionTracking>) => {
        const newTrackers = [...formData.activeTrackers];
        newTrackers[index] = { ...newTrackers[index], ...updates };
        setFormData({ ...formData, activeTrackers: newTrackers });
    };

    return (
      <div className="space-y-8 max-w-2xl mx-auto py-4 animate-in slide-in-from-right duration-300">
        <div>
          <Text variant="caption" className="mb-2">Step 03</Text>
          <Heading level={2}>Configuration</Heading>
        </div>
        <div className="space-y-8">
            {formData.activeTrackers.map((tracker, idx) => {
                const union = UNIONS.find(u => u.id === tracker.unionTypeId)!;
                const tierDef = union.tiers.find(t => t.name === tracker.tierLabel);
                
                return (
                   <div key={idx} className="bg-white p-6 border border-neutral-200">
                      <h3 className="font-serif text-2xl mb-4">{tracker.unionName} Path</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Tier</label>
                            <Select 
                                value={tracker.tierLabel} 
                                onChange={e => {
                                    const newTier = union.tiers.find(t => t.name === e.target.value)!;
                                    updateTracker(idx, {
                                        tierLabel: newTier.name,
                                        targetType: newTier.targetType,
                                        targetValue: newTier.targetValue,
                                        department: newTier.requiresDepartment ? (tracker.department || DEPARTMENTS[0]) : undefined
                                    });
                                }}
                            >
                                {union.tiers.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                            </Select>
                        </div>
                        {tierDef?.requiresDepartment && (
                            <div>
                                <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Department</label>
                                <Select value={tracker.department} onChange={e => updateTracker(idx, { department: e.target.value })}>
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </Select>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Current {tracker.targetType}</label>
                            <Input type="number" value={tracker.startingValue} onChange={e => updateTracker(idx, { startingValue: Number(e.target.value) })} />
                        </div>
                      </div>
                   </div>
                );
            })}
        </div>
        <div className="flex justify-between pt-12">
          <Button variant="ghost" onClick={handleBack}>Back</Button>
          <Button onClick={handleFinish} variant="primary">Launch Dashboard</Button>
        </div>
      </div>
    );
  };

  // --- AGENT FLOW STEPS ---
  
  const StepAgentRole = () => (
      <div className="space-y-8 max-w-md mx-auto py-4 animate-in slide-in-from-right duration-300">
        <div>
          <Text variant="caption" className="mb-2">Step 01</Text>
          <Heading level={2}>Tell us your role</Heading>
          <Text variant="subtle">Which of these best describes your organization?</Text>
        </div>
        <div className="space-y-3">
            {AGENT_ROLES.map(role => (
                <div 
                  key={role}
                  onClick={() => setFormData({...formData, agentRole: role})}
                  className={`p-4 border cursor-pointer flex justify-between items-center transition-all ${formData.agentRole === role ? 'bg-[#121212] text-white border-[#121212]' : 'bg-white border-neutral-200 hover:border-neutral-400'}`}
                >
                    <span className="font-serif text-lg">{role}</span>
                    {formData.agentRole === role && <Check className="w-4 h-4"/>}
                </div>
            ))}
        </div>
        <div className="flex justify-between pt-12">
            <Button variant="ghost" onClick={handleBack}>Back</Button>
            <Button onClick={handleNext}>Next <ArrowRight className="w-4 h-4 ml-2"/></Button>
        </div>
      </div>
  );

  const StepAgentIndustry = () => {
      const toggleInd = (ind: string) => {
          const exists = formData.agentIndustries.includes(ind);
          if (exists) setFormData({...formData, agentIndustries: formData.agentIndustries.filter(i => i !== ind)});
          else setFormData({...formData, agentIndustries: [...formData.agentIndustries, ind]});
      };
      
      return (
        <div className="space-y-8 max-w-md mx-auto py-4 animate-in slide-in-from-right duration-300">
            <div>
            <Text variant="caption" className="mb-2">Step 02</Text>
            <Heading level={2}>Industry Focus</Heading>
            <Text variant="subtle">Which industries do you represent talent in?</Text>
            </div>
            <div className="flex flex-wrap gap-3">
                {AGENT_INDUSTRIES.map(ind => {
                    const isSelected = formData.agentIndustries.includes(ind);
                    return (
                        <button 
                          key={ind} 
                          onClick={() => toggleInd(ind)}
                          className={`px-4 py-2 rounded-full border text-sm transition-all ${isSelected ? 'bg-[#121212] text-white border-[#121212]' : 'bg-white text-neutral-600 border-neutral-200'}`}
                        >
                            {ind}
                        </button>
                    );
                })}
            </div>
            <div className="flex justify-between pt-12">
                <Button variant="ghost" onClick={handleBack}>Back</Button>
                <Button onClick={handleNext} disabled={formData.agentIndustries.length === 0}>Next <ArrowRight className="w-4 h-4 ml-2"/></Button>
            </div>
        </div>
      );
  };

  const StepAgentSetupMethod = () => (
      <div className="space-y-8 max-w-2xl mx-auto py-4 animate-in slide-in-from-right duration-300">
        <div>
            <Text variant="caption" className="mb-2">Step 03</Text>
            <Heading level={2}>Roster Configuration</Heading>
            <Text variant="subtle">How would you like to initialize your talent database?</Text>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            <div 
               onClick={() => { setFormData({...formData, rosterSetupMethod: 'IMPORT'}); handleNext(); }}
               className="p-8 border border-neutral-200 bg-white hover:border-[#121212] cursor-pointer transition-all group"
            >
                <FileSpreadsheet className="w-10 h-10 mb-6 text-neutral-400 group-hover:text-[#121212]"/>
                <h3 className="font-serif text-2xl mb-2">Import from Template</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">Download our spreadsheet template, fill it out, and upload your entire roster at once.</p>
                <div className="mt-6 text-xs uppercase tracking-widest font-bold text-[#C73E1D] flex items-center gap-2">
                    Select Option <ArrowRight className="w-3 h-3"/>
                </div>
            </div>

            <div 
               onClick={() => { setFormData({...formData, rosterSetupMethod: 'MANUAL'}); handleNext(); }}
               className="p-8 border border-neutral-200 bg-white hover:border-[#121212] cursor-pointer transition-all group"
            >
                <Users className="w-10 h-10 mb-6 text-neutral-400 group-hover:text-[#121212]"/>
                <h3 className="font-serif text-2xl mb-2">Start Manual Entry</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">Add talent and crew profiles one by one. Best for smaller rosters or starting fresh.</p>
                <div className="mt-6 text-xs uppercase tracking-widest font-bold text-[#C73E1D] flex items-center gap-2">
                    Select Option <ArrowRight className="w-3 h-3"/>
                </div>
            </div>
        </div>
        
        <div className="flex justify-between pt-8">
            <Button variant="ghost" onClick={handleBack}>Back</Button>
        </div>
      </div>
  );

  const StepAgentManualEntry = () => {
      const handleSaveOne = (addAnother: boolean) => {
          if (!manualEntryForm.firstName || !manualEntryForm.lastName) return;
          setFormData(prev => ({
              ...prev, 
              manualRoster: [...prev.manualRoster, { ...manualEntryForm }]
          }));
          
          if (addAnother) {
              setManualEntryForm({ firstName: '', lastName: '', role: FILM_ROLES[0], unionStatus: 'NON_UNION', industry: AGENT_INDUSTRIES[0] });
          } else {
              handleFinish(); // Will process the list and finish
          }
      };

      return (
        <div className="space-y-8 max-w-xl mx-auto py-4 animate-in slide-in-from-right duration-300">
             <div>
                <Text variant="caption" className="mb-2">Step 04</Text>
                <Heading level={2}>Add Talent</Heading>
                <div className="flex items-center gap-2 mt-2">
                    <Badge color="neutral">{formData.manualRoster.length} Added</Badge>
                </div>
            </div>

            <div className="bg-white p-6 border border-neutral-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">First Name</label>
                        <Input value={manualEntryForm.firstName} onChange={e => setManualEntryForm({...manualEntryForm, firstName: e.target.value})}/>
                    </div>
                    <div>
                        <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Last Name</label>
                        <Input value={manualEntryForm.lastName} onChange={e => setManualEntryForm({...manualEntryForm, lastName: e.target.value})}/>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Role Type</label>
                    <Select value={manualEntryForm.role} onChange={e => setManualEntryForm({...manualEntryForm, role: e.target.value})}>
                        {FILM_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Union Status</label>
                        <Select value={manualEntryForm.unionStatus} onChange={e => setManualEntryForm({...manualEntryForm, unionStatus: e.target.value})}>
                            <option value="NON_UNION">Non-Union</option>
                            <option value="APPRENTICE">Apprentice / Permit</option>
                            <option value="FULL_MEMBER">Full Member</option>
                        </Select>
                     </div>
                     <div>
                        <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Industry</label>
                        <Select value={manualEntryForm.industry} onChange={e => setManualEntryForm({...manualEntryForm, industry: e.target.value})}>
                            {AGENT_INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                        </Select>
                     </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
                <Button onClick={() => handleSaveOne(true)} variant="secondary" className="w-full justify-center">Save & Add Another</Button>
                <Button onClick={() => handleSaveOne(false)} variant="primary" className="w-full justify-center">Save & Finish Setup</Button>
            </div>
            
            <div className="text-center pt-4">
                 <button onClick={handleBack} className="text-xs text-neutral-400 hover:text-neutral-900 uppercase tracking-widest">Back</button>
            </div>
        </div>
      );
  };
  
  const StepAgentImport = () => (
     <div className="space-y-8 max-w-lg mx-auto py-4 animate-in slide-in-from-right duration-300">
        <div className="text-center">
            <div className="w-16 h-16 bg-[#121212] text-white rounded-full flex items-center justify-center mx-auto mb-6">
                <FileSpreadsheet className="w-8 h-8"/>
            </div>
            <Heading level={2}>Bulk Import</Heading>
            <Text className="mt-4">Download our roster template to get started.</Text>
        </div>
        
        <div className="space-y-4">
            <Button variant="outline" className="w-full justify-center py-4" onClick={() => alert("Downloading template...")}>Download Template (CSV)</Button>
            <Button variant="primary" className="w-full justify-center py-4" onClick={handleFinish}>Upload Completed CSV</Button>
        </div>
        <div className="text-center pt-4">
             <button onClick={handleBack} className="text-xs text-neutral-400 hover:text-neutral-900 uppercase tracking-widest">Back</button>
        </div>
     </div>
  );


  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-[#F3F3F1] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-3xl">
        {step === 1 && <StepWelcome />}
        
        {/* MEMBER FLOW */}
        {!isAgent && step === 2 && <StepMemberProfile />}
        {!isAgent && step === 3 && <StepMemberUnions />}
        {!isAgent && step === 4 && <StepMemberConfig />}
        
        {/* AGENT FLOW */}
        {isAgent && step === 2 && <StepAgentRole />}
        {isAgent && step === 3 && <StepAgentIndustry />}
        {isAgent && step === 4 && <StepAgentSetupMethod />}
        {isAgent && step === 5 && formData.rosterSetupMethod === 'MANUAL' && <StepAgentManualEntry />}
        {isAgent && step === 5 && formData.rosterSetupMethod === 'IMPORT' && <StepAgentImport />}
      </div>
    </div>
  );
};
