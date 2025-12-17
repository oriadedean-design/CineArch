import React, { useState } from 'react';
import { User, CanadianProvince, FILM_ROLES, UNIONS, UserUnionTracking, DEPARTMENTS, AGENT_ROLES, AGENT_INDUSTRIES, DEPARTMENT_ROLES } from '../types';
import { api } from '../services/api';
import { Button, Input, Select, Heading, Text } from '../components/ui';
import { BulkJobUpload } from '../components/BulkJobUpload';
import { Check, ArrowRight, Building, Phone, Mail, AlertCircle, Star, User as UserIcon, Briefcase, HelpCircle } from 'lucide-react';

interface OnboardingProps {
  user: User;
  onComplete: () => void;
}

// Mapping for Recommendations
const DEPT_UNION_MAP: Record<string, string[]> = {
  "Performers (Principal)": ['u1'], // ACTRA
  "Background Performers": ['u1'],
  "Stunts": ['u1'], 
  "Camera Department": ['u2', 'u5'], // IATSE, NABET
  "Lighting (Electric)": ['u2', 'u5'],
  "Grip (Rigging & Camera Support)": ['u2', 'u5'],
  "Costume & Wardrobe": ['u2', 'u5'],
  "Hair & Makeup": ['u2', 'u5'],
  "Sound (Production)": ['u2', 'u5'],
  "Special Effects": ['u2', 'u5'],
  "Construction": ['u2'],
  "Scenic (Paint)": ['u2'],
  "Greens": ['u2'],
  "Props": ['u2', 'u5'],
  "Set Decoration": ['u2', 'u5'],
  "Catering & Craft Services": ['u2'],
  "Direction & Continuity": ['u3'], // DGC
  "Art Department": ['u3', 'u2'], 
  "Locations": ['u3'],
  "Post-Production (Picture)": ['u3'],
  "Post-Production (Sound)": ['u3'],
  "Script & Writing": ['u4'], // WGC
};

export const Onboarding = ({ user, onComplete }: OnboardingProps) => {
  const isAgent = user.accountType === 'AGENT';
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: user.name?.split(' ')[0] || '',
    lastName: user.name?.split(' ').slice(1).join(' ') || '',
    phone: user.phone || '',
    orgName: user.organizationName || '',
    province: user.province || CanadianProvince.ON,
    businessStructure: 'SOLE_PROPRIETORSHIP' as User['businessStructure'],
    selectedDepartments: [] as string[],
    selectedRoles: [] as string[],
    selectedUnions: [] as string[],
    activeTrackers: [] as Partial<UserUnionTracking>[],
    agentRole: AGENT_ROLES[0],
    agentIndustries: [] as string[],
    rosterSetupMethod: 'IMPORT' as 'IMPORT' | 'MANUAL',
    manualRoster: [] as any[] 
  });
  
  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleFinish = async () => {
    const updates: Partial<User> = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      phone: formData.phone,
      organizationName: formData.orgName,
      province: formData.province,
      isOnboarded: true,
      businessStructure: formData.businessStructure,
    };

    if (isAgent) {
        updates.role = formData.agentRole;
        updates.primaryIndustry = formData.agentIndustries[0]; 
        
        // Agency logic handled here if needed
    } else {
        updates.role = formData.selectedRoles[0] || 'Film Worker';
        
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
        await api.tracking.save(trackingData);
    }

    await api.auth.updateUser(updates);
    onComplete();
  };

  const StepWelcome = () => (
    <div className="text-center space-y-8 py-12 animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-surface border border-white/10 text-white flex items-center justify-center mx-auto mb-8 rounded-none shadow-glow">
        <span className="font-serif text-4xl italic">Ca</span>
      </div>
      <Heading level={1}>CineArch OS</Heading>
      <Text className="max-w-md mx-auto text-lg leading-relaxed text-textSecondary">
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

  const StepPersonalDetails = () => (
      <div className="space-y-8 max-w-lg mx-auto py-4 animate-in slide-in-from-right duration-300">
          <div>
            <Text variant="caption" className="mb-2">Step 01</Text>
            <Heading level={2}>Account Details</Heading>
            <Text variant="subtle">Tell us who is behind the camera.</Text>
          </div>

          <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-medium uppercase tracking-widest text-textTertiary mb-2">First Name</label>
                      <Input 
                        value={formData.firstName} 
                        onChange={e => setFormData({...formData, firstName: e.target.value})} 
                        placeholder="Jane"
                        className="bg-surfaceHighlight border-white/10"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-medium uppercase tracking-widest text-textTertiary mb-2">Last Name</label>
                      <Input 
                        value={formData.lastName} 
                        onChange={e => setFormData({...formData, lastName: e.target.value})} 
                        placeholder="Doe"
                        className="bg-surfaceHighlight border-white/10"
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-medium uppercase tracking-widest text-textTertiary mb-2">Organization Name <span className="text-gray-600 normal-case">(Optional)</span></label>
                  <div className="relative">
                      <Building className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                      <Input 
                        value={formData.orgName} 
                        onChange={e => setFormData({...formData, orgName: e.target.value})} 
                        placeholder={isAgent ? "Acme Talent Agency" : "Jane Doe Productions"}
                        className="pl-10 bg-surfaceHighlight border-white/10"
                      />
                  </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-medium uppercase tracking-widest text-textTertiary mb-2">Phone Number</label>
                      <div className="relative">
                          <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                          <Input 
                            value={formData.phone} 
                            onChange={e => setFormData({...formData, phone: e.target.value})} 
                            placeholder="(555) 000-0000"
                            type="tel"
                            className="pl-10 bg-surfaceHighlight border-white/10"
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-medium uppercase tracking-widest text-textTertiary mb-2">Email Address</label>
                      <div className="relative opacity-70">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                          <Input 
                            value={user.email} 
                            disabled
                            className="pl-10 bg-surfaceHighlight border-white/10 cursor-not-allowed text-gray-500"
                          />
                      </div>
                  </div>
              </div>
          </div>

          <div className="flex justify-between pt-12">
            <Button variant="ghost" onClick={handleBack}>Back</Button>
            <Button onClick={handleNext} disabled={!formData.firstName || !formData.lastName || !formData.phone}>Next <ArrowRight className="w-4 h-4 ml-2"/></Button>
          </div>
      </div>
  );

  const StepMemberProfile = () => (
    <div className="space-y-8 max-w-lg mx-auto py-4 animate-in slide-in-from-right duration-300">
      <div>
        <Text variant="caption" className="mb-2">Step 02</Text>
        <Heading level={2}>Business Profile</Heading>
        <Text variant="subtle">Establish your operating jurisdiction and structure.</Text>
      </div>

      <div className="space-y-6">
         <div>
          <label className="block text-xs font-medium uppercase tracking-widest text-textTertiary mb-2">Primary Province of Residence</label>
          <Select 
            value={formData.province} 
            onChange={e => setFormData({...formData, province: e.target.value})}
          >
            {Object.entries(CanadianProvince).map(([k, v]) => <option key={k} value={v} className="bg-surface text-textPrimary">{v}</option>)}
          </Select>
        </div>

        <div>
           <label className="block text-xs font-medium uppercase tracking-widest text-textTertiary mb-3">Business Structure</label>
           <div className="grid grid-cols-1 gap-3">
              {[
                  { id: 'SOLE_PROPRIETORSHIP', icon: UserIcon, label: 'Sole Proprietorship', sub: 'Self-employed individual (Most Common)' },
                  { id: 'INCORPORATED', icon: Building, label: 'Incorporated (Loan-Out)', sub: 'For higher earners & tax deferral' },
                  { id: 'EMPLOYEE', icon: Briefcase, label: 'Employee', sub: 'Studio staff or permanent hires' },
                  { id: 'NONE', icon: HelpCircle, label: 'None / Unsure', sub: 'Just starting out' }
              ].map((option) => (
                  <div 
                     key={option.id}
                     onClick={() => setFormData({...formData, businessStructure: option.id as any})}
                     className={`p-4 border cursor-pointer flex justify-between items-center transition-all duration-300 ${
                         formData.businessStructure === option.id 
                            ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                            : 'bg-surface border-white/10 text-textSecondary hover:border-white/30 hover:bg-surfaceHighlight'
                     }`}
                  >
                      <div className="flex items-center gap-3">
                          <option.icon className="w-5 h-5"/>
                          <div>
                              <p className="font-bold text-sm text-inherit">{option.label}</p>
                              <p className={`text-xs ${formData.businessStructure === option.id ? 'text-gray-600' : 'text-textTertiary'}`}>{option.sub}</p>
                          </div>
                      </div>
                      {formData.businessStructure === option.id && <Check className="w-4 h-4"/>}
                  </div>
              ))}
           </div>
        </div>
      </div>
      
      <div className="flex justify-between pt-12">
        <Button variant="ghost" onClick={handleBack}>Back</Button>
        <Button onClick={handleNext}>Next <ArrowRight className="w-4 h-4 ml-2"/></Button>
      </div>
    </div>
  );

  const StepMemberRoles = () => {
     const toggleDept = (dept: string) => {
         const exists = formData.selectedDepartments.includes(dept);
         let newDepts = exists 
            ? formData.selectedDepartments.filter(d => d !== dept)
            : [...formData.selectedDepartments, dept];
         setFormData({...formData, selectedDepartments: newDepts});
     };

     const toggleRole = (role: string) => {
         const exists = formData.selectedRoles.includes(role);
         let newRoles = exists
            ? formData.selectedRoles.filter(r => r !== role)
            : [...formData.selectedRoles, role];
         setFormData({...formData, selectedRoles: newRoles});
     };

     return (
        <div className="space-y-8 max-w-2xl mx-auto py-4 animate-in slide-in-from-right duration-300">
           <div>
              <Text variant="caption" className="mb-2">Step 03</Text>
              <Heading level={2}>Career Focus</Heading>
              <Text variant="subtle">Select the departments you work in to unlock specific role tracking.</Text>
           </div>

           <div className="space-y-4">
              <label className="block text-xs font-medium uppercase tracking-widest text-textTertiary">Departments</label>
              <div className="flex flex-wrap gap-2">
                 {DEPARTMENTS.map(dept => {
                    const selected = formData.selectedDepartments.includes(dept);
                    return (
                       <button
                         key={dept}
                         onClick={() => toggleDept(dept)}
                         className={`px-4 py-2 border text-sm transition-all rounded-sm ${
                             selected 
                                ? 'bg-white text-black border-white shadow-glow' 
                                : 'bg-surface text-textSecondary border-white/10 hover:border-white/30 hover:bg-surfaceHighlight'
                         }`}
                       >
                          {dept}
                       </button>
                    )
                 })}
              </div>
           </div>

           {formData.selectedDepartments.length > 0 && (
               <div className="space-y-6 pt-6 border-t border-white/10 animate-in fade-in">
                   <div className="space-y-1">
                      <Heading level={3}>Your Roles</Heading>
                      <Text variant="small">Select the specific positions you want to track credits for.</Text>
                   </div>
                   
                   {formData.selectedDepartments.map(dept => (
                      <div key={dept} className="space-y-3">
                         <h4 className="font-serif text-lg text-textTertiary">{dept}</h4>
                         <div className="flex flex-wrap gap-2">
                             {DEPARTMENT_ROLES[dept].map(role => {
                                 const isSelected = formData.selectedRoles.includes(role);
                                 return (
                                    <button
                                        key={role}
                                        onClick={() => toggleRole(role)}
                                        className={`px-3 py-1.5 border text-xs font-medium transition-all ${
                                            isSelected 
                                                ? 'bg-accent text-white border-accent' 
                                                : 'bg-surfaceHighlight text-textTertiary border-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        {role}
                                    </button>
                                 )
                             })}
                         </div>
                      </div>
                   ))}
               </div>
           )}

           <div className="flex justify-between pt-12">
                <Button variant="ghost" onClick={handleBack}>Back</Button>
                <Button onClick={handleNext} disabled={formData.selectedRoles.length === 0}>Next <ArrowRight className="w-4 h-4 ml-2"/></Button>
            </div>
        </div>
     );
  };

  const StepMemberUnions = () => {
    const recommendedUnionIds = new Set<string>();
    formData.selectedDepartments.forEach(dept => {
        const unions = DEPT_UNION_MAP[dept];
        if (unions) unions.forEach(u => recommendedUnionIds.add(u));
    });

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
          department: defaultTier.requiresDepartment ? (formData.selectedDepartments[0] || DEPARTMENTS[0]) : undefined,
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
          <Text variant="caption" className="mb-2">Step 04</Text>
          <Heading level={2}>Affiliations</Heading>
          <Text variant="subtle" className="mt-2">Confirm the Unions you are currently tracking or working towards.</Text>
        </div>
        
        <div className="space-y-3">
          {UNIONS.map(union => {
            const isSelected = formData.selectedUnions.includes(union.id);
            const isRecommended = recommendedUnionIds.has(union.id);
            
            return (
              <div 
                key={union.id}
                onClick={() => toggleUnion(union.id)}
                className={`p-5 cursor-pointer transition-all duration-300 border relative overflow-hidden group 
                   ${isSelected 
                      ? 'bg-white border-white text-black' 
                      : isRecommended 
                          ? 'bg-surface border-accent shadow-[0_0_20px_rgba(199,62,29,0.3)] ring-1 ring-accent/30' 
                          : 'bg-surface border-white/10 hover:border-white/30 text-textPrimary'
                   }`}
              >
                {isRecommended && !isSelected && (
                   <div className="absolute top-0 right-0 bg-accent text-white text-[9px] font-bold uppercase px-2 py-0.5 tracking-wider shadow-sm">
                       Recommended
                   </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-serif text-xl flex items-center gap-2 ${isSelected ? 'text-black' : 'text-textPrimary'}`}>
                        {union.name} 
                        {isRecommended && !isSelected && <Star className="w-3 h-3 text-accent fill-accent animate-pulse" />}
                    </h3>
                    <p className={`text-sm mt-1 ${isSelected ? 'text-gray-600' : 'text-textTertiary'}`}>{union.description}</p>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-black" />}
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
    const updateTracker = (index: number, updates: Partial<UserUnionTracking>) => {
        const newTrackers = [...formData.activeTrackers];
        newTrackers[index] = { ...newTrackers[index], ...updates };
        setFormData({ ...formData, activeTrackers: newTrackers });
    };

    return (
      <div className="space-y-8 max-w-2xl mx-auto py-4 animate-in slide-in-from-right duration-300">
        <div>
          <Text variant="caption" className="mb-2">Step 05</Text>
          <Heading level={2}>Configuration</Heading>
          <Text variant="subtle">Establish your starting baselines.</Text>
        </div>
        
        <BulkJobUpload userId={user.id} onComplete={() => {}} />

        <div className="relative py-4">
             <div className="absolute inset-0 flex items-center" aria-hidden="true">
               <div className="w-full border-t border-white/10"></div>
             </div>
             <div className="relative flex justify-center">
               <span className="bg-black px-2 text-xs text-textTertiary uppercase tracking-widest">Or configure manually</span>
             </div>
        </div>

        <div className="space-y-8">
            {formData.activeTrackers.map((tracker, idx) => {
                const union = UNIONS.find(u => u.id === tracker.unionTypeId)!;
                const tierDef = union.tiers.find(t => t.name === tracker.tierLabel);
                
                return (
                   <div key={idx} className="bg-surface p-6 border border-white/10 shadow-sm relative group hover:border-white/30 transition-all">
                      <div className="absolute top-4 right-4 text-textTertiary group-hover:text-accent transition-colors">
                          <AlertCircle className="w-4 h-4" />
                      </div>
                      <h3 className="font-serif text-2xl mb-4 text-textPrimary">{tracker.unionName} Path</h3>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-medium uppercase tracking-widest text-textTertiary mb-2">Target Tier</label>
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
                                className="bg-surfaceHighlight border-white/10 focus:border-accent focus:ring-accent"
                            >
                                {union.tiers.map(t => <option key={t.name} value={t.name} className="bg-surface text-white">{t.name}</option>)}
                            </Select>
                        </div>
                        {tierDef?.requiresDepartment && (
                            <div>
                                <label className="block text-xs font-medium uppercase tracking-widest text-textTertiary mb-2">Department</label>
                                <Select 
                                  value={tracker.department} 
                                  onChange={e => updateTracker(idx, { department: e.target.value })}
                                  className="bg-surfaceHighlight border-white/10 focus:border-accent focus:ring-accent"
                                >
                                    {formData.selectedDepartments.length > 0 
                                        ? formData.selectedDepartments.map(d => <option key={d} value={d} className="bg-surface text-white">{d}</option>)
                                        : DEPARTMENTS.map(d => <option key={d} value={d} className="bg-surface text-white">{d}</option>)
                                    }
                                </Select>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium uppercase tracking-widest text-textTertiary mb-2">Current {tracker.targetType}</label>
                            <Input 
                                type="number" 
                                value={tracker.startingValue} 
                                onChange={e => updateTracker(idx, { startingValue: Number(e.target.value) })} 
                                className="bg-surfaceHighlight border-white/10 focus:border-accent focus:ring-accent"
                            />
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

  const StepAgentRole = () => (
      <div className="space-y-8 max-w-md mx-auto py-4 animate-in slide-in-from-right duration-300">
        <div>
          <Text variant="caption" className="mb-2">Step 02</Text>
          <Heading level={2}>Tell us your role</Heading>
          <Text variant="subtle">Which of these best describes your organization?</Text>
        </div>
        <div className="space-y-3">
            {AGENT_ROLES.map(role => (
                <div 
                  key={role}
                  onClick={() => setFormData({...formData, agentRole: role})}
                  className={`p-4 border cursor-pointer flex justify-between items-center transition-all duration-300 ${
                     formData.agentRole === role 
                        ? 'bg-white text-black border-white shadow-glow' 
                        : 'bg-surface border-white/10 text-textSecondary hover:border-white/30 hover:bg-surfaceHighlight'
                  }`}
                >
                    <span className="font-bold text-sm text-inherit">{role}</span>
                    {formData.agentRole === role && <Check className="w-4 h-4"/>}
                </div>
            ))}
        </div>

        <div className="flex justify-between pt-12">
            <Button variant="ghost" onClick={handleBack}>Back</Button>
            <Button onClick={handleFinish}>Complete Setup <ArrowRight className="w-4 h-4 ml-2"/></Button>
        </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-background text-textPrimary p-6 md:p-12 flex flex-col">
       <div className="flex-1 flex flex-col justify-center">
         {step === 1 && <StepWelcome />}
         {step === 2 && <StepPersonalDetails />}
         
         {!isAgent && (
           <>
             {step === 3 && <StepMemberProfile />}
             {step === 4 && <StepMemberRoles />}
             {step === 5 && <StepMemberUnions />}
             {step === 6 && <StepMemberConfig />}
           </>
         )}

         {isAgent && (
            <>
              {step === 3 && <StepAgentRole />}
            </>
         )}
       </div>
    </div>
  );
};
