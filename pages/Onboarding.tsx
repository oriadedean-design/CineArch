
import React, { useState, useMemo, useEffect } from 'react';
import { User, CanadianProvince, UNIONS, UserUnionTracking } from '../types';
import { INDUSTRY_DEPARTMENTS, IndustryRole } from '../config/industry_roles';
import { api } from '../services/storage';
import { Button, Input, Heading, Text, Select, Badge, PhoneInput } from '../components/ui';
import { ArrowRight, Star, Shield, Briefcase, Zap, Check, Target, Landmark, X, Sparkles, Mail, Phone, Camera } from 'lucide-react';
import { clsx } from 'clsx';

const ProductionCallOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const [stage, setStage] = useState(0);
  const sequence = [
    "Pictures up. Last looks everyone.",
    "HMU doing last looks...",
    "Good on last looks. Going for picture.",
    "Let’s roll sound.",
    "Sound: Speed.",
    "Scene 1 Alpha, Take 1.",
    "Roll camera.",
    "1st AC: Speed.",
    "2nd AC: Mark.",
    "Director: Action."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStage(prev => {
        if (prev >= sequence.length - 1) {
          clearInterval(timer);
          setTimeout(onComplete, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 450);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-12 text-center">
      <div className="space-y-8 animate-in fade-in duration-500">
         <div className="w-24 h-[2px] bg-accent mx-auto animate-snap origin-left"></div>
         <p className="text-3xl md:text-5xl font-serif italic text-white tracking-tight leading-tight max-w-2xl">
           "{sequence[stage]}"
         </p>
         <div className="pt-12">
            <div className="flex gap-1 justify-center">
               {sequence.map((_, i) => (
                 <div key={i} className={clsx("w-8 h-1 transition-all duration-300", i <= stage ? "bg-accent" : "bg-white/10")}></div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export const Onboarding = ({ user, onComplete }: { user: User, onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [isPreparing, setIsPreparing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.name?.split(' ')[0] || '',
    lastName: user.name?.split(' ').slice(1).join(' ') || '',
    email: user.email || '',
    phone: user.phone || '',
    province: CanadianProvince.ON,
    department: 'Camera', 
    selectedRoles: [] as string[],
    selectedUnions: [] as string[],
    careerFocus: 'PRODUCTION',
    goals: [] as string[]
  });

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const suggestedUnions = useMemo(() => {
    const unions = new Set<string>();
    formData.selectedRoles.forEach(roleName => {
      INDUSTRY_DEPARTMENTS.forEach(dept => {
        const roleObj = dept.roles.find(r => r.name === roleName);
        if (roleObj) {
          if (roleObj.primaryUnion.includes('ACTRA')) unions.add('ACTRA');
          else if (roleObj.primaryUnion.includes('IATSE')) unions.add('IATSE');
          else if (roleObj.primaryUnion.includes('DGC')) unions.add('DGC');
          else if (roleObj.primaryUnion.includes('WGC')) unions.add('WGC');
          else if (roleObj.primaryUnion !== 'Non-Union') {
             const baseName = roleObj.primaryUnion.split(' ')[0];
             unions.add(baseName);
          }
        }
      });
    });
    return Array.from(unions);
  }, [formData.selectedRoles]);

  React.useEffect(() => {
    if (step === 4 && formData.selectedUnions.length === 0) {
      setFormData(prev => ({ ...prev, selectedUnions: suggestedUnions }));
    }
  }, [step, suggestedUnions]);

  const handleFinish = () => {
    setIsPreparing(true);
  };

  const executeCompletion = () => {
    const updates: Partial<User> = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      phone: formData.phone,
      province: formData.province,
      department: formData.department,
      selectedRoles: formData.selectedRoles,
      careerFocus: formData.careerFocus,
      goals: formData.goals,
      isOnboarded: true,
      role: formData.selectedRoles[0] || 'Film Professional'
    };
    
    const newTrackings: UserUnionTracking[] = formData.selectedUnions.map(unionName => {
      const unionMaster = UNIONS.find(u => u.name === unionName);
      return {
        id: `track_${unionName}_${Date.now()}`,
        userId: user.id,
        unionTypeId: unionMaster?.id || 'custom',
        unionName: unionName,
        tierLabel: unionMaster?.tiers[0].name || 'General Member',
        targetType: unionMaster?.tiers[0].targetType || 'HOURS',
        targetValue: unionMaster?.tiers[0].targetValue || 1000,
        startingValue: 0
      };
    });

    api.auth.updateUser(updates);
    api.tracking.save(newTrackings);
    onComplete();
  };

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(role) 
        ? prev.selectedRoles.filter(r => r !== role) 
        : [...prev.selectedRoles, role]
    }));
  };

  const toggleUnion = (union: string) => {
    setFormData(prev => ({
      ...prev,
      selectedUnions: prev.selectedUnions.includes(union) 
        ? prev.selectedUnions.filter(u => u !== union) 
        : [...prev.selectedUnions, union]
    }));
  };

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) 
        ? prev.goals.filter(g => g !== goal) 
        : [...prev.goals, goal]
    }));
  };

  const currentDeptData = INDUSTRY_DEPARTMENTS.find(d => d.name === formData.department);

  if (isPreparing) return <ProductionCallOverlay onComplete={executeCompletion} />;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 text-white relative overflow-hidden bg-black font-sans">
      <div className="absolute inset-0 bg-cinematic-universal opacity-20 pointer-events-none"></div>
      <div className="bg-vignette-universal"></div>
      
      <div className="w-full max-w-4xl space-y-16 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {step === 1 && (
          <div className="text-center space-y-12">
            <div className="w-20 h-20 border border-white/20 glass-ui flex items-center justify-center mx-auto mb-10">
              <span className="font-serif text-4xl italic text-white">Ca</span>
            </div>
            <h1 className="heading-huge text-white">LOCK IT UP.</h1>
            <Text className="max-w-xl mx-auto text-2xl text-white font-light italic leading-relaxed">
              Pictures up. We are calibrating your professional profile to match the guilds and departments you serve.
            </Text>
            <div className="pt-16">
              <Button onClick={handleNext} className="h-24 px-20 text-[11px] tracking-[0.6em] font-black">Report for Duty</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-12 animate-in slide-in-from-right duration-500">
             <div className="space-y-2">
                <Text variant="caption">Scene 01 // The Dossier</Text>
                <Heading level={2} className="text-white">Principal Coordinates.</Heading>
             </div>
             <div className="grid md:grid-cols-2 gap-2">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">First Name</label>
                   <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="h-24 text-2xl font-serif italic text-white" />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Last Name</label>
                   <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="h-24 text-2xl font-serif italic text-white" />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 flex items-center gap-2">
                     <Mail size={12} className="text-accent" /> Digital Coordinate
                   </label>
                   <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-24 text-xl font-serif italic text-white" />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 flex items-center gap-2">
                     <Phone size={12} className="text-accent" /> Set Voice Line
                   </label>
                   <PhoneInput value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-24 text-xl font-serif italic text-white" />
                </div>
                <div className="md:col-span-2 space-y-3 pt-6">
                   <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Base of Operations</label>
                   <Select value={formData.province} onChange={e => setFormData({...formData, province: e.target.value as any})} className="h-24 text-2xl font-serif italic text-white">
                      {Object.values(CanadianProvince).map(v => <option key={v} value={v} className="bg-black text-white">{v}</option>)}
                   </Select>
                </div>
             </div>
             <div className="flex justify-between pt-20 border-t border-white/5">
               <button onClick={handleBack} className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 hover:text-white transition-colors">10-100</button>
               <Button onClick={handleNext} className="h-20 px-16 text-[10px] tracking-[0.4em] font-black" disabled={!formData.firstName || !formData.lastName || !formData.email}>Next Setup <ArrowRight size={14} className="ml-4" /></Button>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-12 animate-in slide-in-from-right duration-500">
             <div className="flex justify-between items-end">
                <div className="space-y-2">
                   <Text variant="caption">Scene 02 // Call Sheet</Text>
                   <Heading level={2} className="text-white">Active Assignment.</Heading>
                </div>
                <div className="glass-ui px-6 py-3 border-accent/20 border flex items-center gap-4">
                   <span className="text-[10px] font-black uppercase tracking-widest text-accent">Selected Marks</span>
                   <Badge color="accent">{formData.selectedRoles.length}</Badge>
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                {INDUSTRY_DEPARTMENTS.map(d => {
                  const rolesInDept = d.roles.filter(r => formData.selectedRoles.includes(r.name)).length;
                  return (
                    <button 
                      key={d.name} 
                      onClick={() => setFormData({...formData, department: d.name})}
                      className={clsx(
                        "p-8 border text-[10px] font-black uppercase tracking-widest transition-all duration-700 text-center relative h-32 flex items-center justify-center", 
                        formData.department === d.name ? "bg-accent text-black border-accent" : "glass-ui text-white hover:border-white/20"
                      )}
                    >
                      {d.name}
                      {rolesInDept > 0 && <span className="absolute top-4 right-4 w-2 h-2 bg-current rounded-full"></span>}
                    </button>
                  );
                })}
             </div>

             {formData.department && currentDeptData && (
                <div className="space-y-10 pt-16 border-t border-white/10 animate-in fade-in duration-700">
                   <div className="flex items-center gap-4 text-accent">
                      <Star size={14} fill="currentColor" />
                      <span className="text-[11px] font-black uppercase tracking-[0.5em] text-white">Department Focus: {formData.department}</span>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                      {currentDeptData.roles.map((r: IndustryRole) => (
                        <button 
                          key={r.name} 
                          onClick={() => toggleRole(r.name)}
                          className={clsx(
                            "p-8 border text-[10px] font-black uppercase tracking-widest transition-all duration-700 flex flex-col items-start gap-4 text-left min-h-[120px]", 
                            formData.selectedRoles.includes(r.name) ? "bg-white text-black border-white" : "glass-ui text-white hover:border-white/30"
                          )}
                        >
                          <span className="font-serif italic text-lg leading-tight">{r.name}</span>
                          <span className={clsx("text-[8px] font-black tracking-[0.2em] uppercase", formData.selectedRoles.includes(r.name) ? "text-black/60" : "text-accent")}>
                            {r.primaryUnion}
                          </span>
                        </button>
                      ))}
                   </div>
                </div>
             )}

             <div className="flex justify-between pt-20 border-t border-white/5">
               <button onClick={handleBack} className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 hover:text-white transition-colors">Back to Ones</button>
               <Button onClick={handleNext} className="h-20 px-16 text-[10px] tracking-[0.4em] font-black" disabled={formData.selectedRoles.length === 0}>Identify Guilds <ArrowRight size={14} className="ml-4" /></Button>
             </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-12 animate-in slide-in-from-right duration-500">
             <div className="space-y-2">
                <Text variant="caption">Scene 03 // Affiliation</Text>
                <Heading level={2} className="text-white">Guild Continuity.</Heading>
             </div>
             
             <div className="p-10 bg-accent/5 border border-accent/20 glass-ui mb-8 flex items-start gap-8">
                <Sparkles className="text-accent shrink-0" size={28} />
                <div className="space-y-3">
                   <p className="text-[11px] font-black uppercase tracking-[0.5em] text-accent">OS Intelligence Note</p>
                   <p className="text-lg text-white font-light italic leading-relaxed">
                     Based on your marks (<b>{formData.selectedRoles.join(', ')}</b>), the OS is preparing trajectories for the following guilds.
                   </p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {UNIONS.map(u => {
                  const isSuggested = suggestedUnions.includes(u.name);
                  const isSelected = formData.selectedUnions.includes(u.name);
                  return (
                    <button 
                      key={u.id}
                      onClick={() => toggleUnion(u.name)}
                      className={clsx(
                        "p-12 border transition-all duration-700 flex flex-col gap-6 text-left group min-h-[220px]", 
                        isSelected ? "bg-accent text-black border-accent" : isSuggested ? "border-accent/30 bg-accent/5 text-white hover:bg-accent/10" : "glass-ui text-white hover:border-white/20"
                      )}
                    >
                      <div className="flex justify-between items-center">
                         <Landmark size={24} strokeWidth={1} />
                         {isSuggested && <Badge color={isSelected ? "neutral" : "accent"}>Production Recommended</Badge>}
                      </div>
                      <span className="text-3xl font-serif italic leading-none">{u.name}</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 leading-relaxed">{u.description}</span>
                    </button>
                  );
                })}
             </div>

             <div className="flex justify-between pt-20 border-t border-white/5">
               <button onClick={handleBack} className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 hover:text-white transition-colors">Back to Ones</button>
               <Button onClick={handleNext} className="h-20 px-16 text-[10px] tracking-[0.4em] font-black" disabled={formData.selectedUnions.length === 0}>Establish Objectives <ArrowRight size={14} className="ml-4" /></Button>
             </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-12 animate-in slide-in-from-right duration-500">
             <div className="space-y-2">
                <Text variant="caption">Scene 04 // Objectives</Text>
                <Heading level={2} className="text-white">The Long Shot.</Heading>
             </div>
             
             <div className="grid md:grid-cols-2 gap-2">
                {[
                  { id: 'UNION_JOIN', label: 'Guild Admission', icon: Shield },
                  { id: 'TIER_UP', label: 'Member Upgrade', icon: Zap },
                  { id: 'AUDIT_PROOF', label: 'Continuity Audit', icon: Briefcase },
                  { id: 'GST_LIMIT', label: 'Tax Compliance', icon: Target }
                ].map((goal) => (
                  <button 
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={clsx(
                      "p-16 transition-all duration-700 border flex flex-col items-center text-center gap-10", 
                      formData.goals.includes(goal.id) ? "bg-accent text-black border-accent" : "glass-ui text-white hover:border-white/20"
                    )}
                  >
                    <goal.icon size={32} strokeWidth={1} />
                    <span className="text-[11px] font-black uppercase tracking-[0.5em]">{goal.label}</span>
                  </button>
                ))}
             </div>

             <div className="flex justify-between pt-20 border-t border-white/5">
               <button onClick={handleBack} className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 hover:text-white transition-colors">Back to Ones</button>
               <Button onClick={handleFinish} className="h-24 px-20 bg-white text-black font-black uppercase tracking-[0.6em] text-[11px]">Print It // Action</Button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};
