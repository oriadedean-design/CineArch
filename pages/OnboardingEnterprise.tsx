
import React, { useState, useEffect } from 'react';
import { User, CanadianProvince, EntityType } from '../types';
import { api } from '../services/storage';
import { Button, Input, Heading, Text, Select, Badge, Card } from '../components/ui';
import { ArrowRight, Shield, Zap, Landmark, Mail, Phone, Percent, UserCheck, Users, Building, GraduationCap, UploadCloud, Plus, X } from 'lucide-react';
import { clsx } from 'clsx';
import { BulkJobUpload } from '../components/BulkJobUpload';

const ProductionCallOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const [stage, setStage] = useState(0);
  const sequence = [
    "Pictures up. Agency interface active.",
    "Syncing Roster Ledger...",
    "Calibrating Guild Compliance...",
    "Let’s roll sound.",
    "Showrunner Mode: Active.",
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

export const OnboardingEnterprise = ({ user, onComplete }: { user: User, onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [isPreparing, setIsPreparing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: '',
    province: CanadianProvince.ON,
    entityType: EntityType.AGENCY,
    organizationName: '',
    role: 'Talent Agent', // Agency role by default
    hasAgentFee: true,
    agentFeePercentage: 10,
    cohortYear: new Date().getFullYear().toString(),
    programName: '',
    managedUsers: [] as { name: string, email: string, role: string }[]
  });

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleAddTempUser = () => {
    setFormData(prev => ({
      ...prev,
      managedUsers: [...prev.managedUsers, { name: '', email: '', role: '' }]
    }));
  };

  const updateTempUser = (index: number, field: string, value: string) => {
    const newList = [...formData.managedUsers];
    newList[index] = { ...newList[index], [field]: value };
    setFormData({ ...formData, managedUsers: newList });
  };

  const handleFinish = () => {
    setIsPreparing(true);
  };

  const executeCompletion = () => {
    const clients: User[] = formData.managedUsers
      .filter(u => u.name && u.email)
      .map(u => ({
        id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: u.name,
        email: u.email,
        role: u.role || 'Talent',
        province: formData.province,
        isOnboarded: true,
        accountType: 'INDIVIDUAL',
        isPremium: true
      }));

    const updates: Partial<User> = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      province: formData.province,
      entityType: formData.entityType,
      organizationName: formData.organizationName,
      role: formData.role,
      hasAgentFee: formData.entityType === EntityType.AGENCY ? formData.hasAgentFee : false,
      agentFeePercentage: formData.agentFeePercentage,
      cohortYear: formData.cohortYear,
      programName: formData.programName,
      managedUsers: clients,
      isOnboarded: true
    };

    api.auth.updateUser(updates);
    onComplete();
  };

  if (isPreparing) return <ProductionCallOverlay onComplete={executeCompletion} />;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 text-white relative overflow-hidden bg-black font-sans">
      <div className="absolute inset-0 bg-cinematic-universal opacity-20 pointer-events-none"></div>
      <div className="bg-vignette-universal"></div>
      
      <div className="w-full max-w-4xl space-y-16 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {step === 1 && (
          <div className="text-center space-y-12">
            <Badge color="accent" className="tracking-[0.8em]">SHOWRUNNER v0.5</Badge>
            <h1 className="heading-huge text-white">COMMAND BASE.</h1>
            <Text className="max-w-xl mx-auto text-2xl text-white font-light italic leading-relaxed">
              We are initializing your Enterprise Terminal. This interface is optimized for roster management, compliance auditing, and tactical scheduling.
            </Text>
            <div className="pt-16">
              <Button onClick={handleNext} className="h-14 px-10 text-[11px] tracking-[0.6em] font-black">Initialize Terminal</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-12 animate-in slide-in-from-right duration-500">
             <div className="space-y-2">
                <Text variant="caption">Scene 01 // Contact Dossier</Text>
                <Heading level={2} className="text-white">Principal Coordinates.</Heading>
             </div>
             <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Point of Contact Name</label>
                   <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-24 text-2xl font-serif italic text-white" />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Organization Name</label>
                   <Input value={formData.organizationName} onChange={e => setFormData({...formData, organizationName: e.target.value})} className="h-24 text-2xl font-serif italic text-white" />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Direct Line</label>
                   <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-24 text-xl font-serif italic text-white" />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Headquarters</label>
                   <Select value={formData.province} onChange={e => setFormData({...formData, province: e.target.value as any})} className="h-24 text-2xl font-serif italic text-white">
                      {Object.values(CanadianProvince).map(v => <option key={v} value={v} className="bg-black text-white">{v}</option>)}
                   </Select>
                </div>
             </div>
             <div className="flex justify-between pt-20 border-t border-white/5">
               <button onClick={handleBack} className="text-[10px] font-black uppercase tracking-[0.5em] text-white hover:underline transition-colors">10-100</button>
               <Button onClick={handleNext} className="h-14 px-10 text-[10px] tracking-[0.4em] font-black" disabled={!formData.name || !formData.organizationName}>Define Entity <ArrowRight size={14} className="ml-4" /></Button>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-12 animate-in slide-in-from-right duration-500">
             <div className="space-y-2">
                <Text variant="caption">Scene 02 // Structure</Text>
                <Heading level={2} className="text-white">Operational Category.</Heading>
             </div>

             <div className="grid md:grid-cols-3 gap-1">
                {[
                  { id: EntityType.AGENCY, label: 'Agency', icon: Building, desc: 'Talent or Casting representation.' },
                  { id: EntityType.ARTS_ORG, label: 'Arts Org', icon: Users, desc: 'Non-profit or guild association.' },
                  { id: EntityType.TRAINING_INST, label: 'Institution', icon: GraduationCap, desc: 'Schools, film labs, or cohorts.' }
                ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => setFormData({...formData, entityType: item.id})}
                    className={clsx(
                      "p-12 border transition-all duration-700 flex flex-col items-center text-center gap-8 h-64 justify-center", 
                      formData.entityType === item.id ? "bg-accent text-black border-accent" : "glass-ui text-white hover:border-white/20"
                    )}
                  >
                    <item.icon size={32} strokeWidth={1} />
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-widest block">{item.label}</span>
                      <span className="text-[9px] uppercase tracking-wider opacity-60 leading-relaxed">{item.desc}</span>
                    </div>
                  </button>
                ))}
             </div>

             {/* Dynamic Form based on Entity */}
             <div className="animate-in fade-in duration-700 pt-12 space-y-12 border-t border-white/5">
                {formData.entityType === EntityType.AGENCY ? (
                   <div className="space-y-10">
                      <div className="flex items-center gap-6">
                         <Badge color="accent" className="italic tracking-widest">COMMISSION LOGIC</Badge>
                         <div className="h-px flex-1 bg-white/5"></div>
                      </div>
                      <div className="flex items-center gap-8 p-12 glass-ui border-accent/20">
                         <div className="space-y-6 flex-1">
                            <label className="text-[11px] font-black uppercase tracking-[0.4em] text-accent">Global Commission Rate</label>
                            <div className="flex items-center gap-6">
                               <Input 
                                 type="number" 
                                 value={formData.agentFeePercentage} 
                                 onChange={e => setFormData({...formData, agentFeePercentage: Number(e.target.value)})}
                                 className="h-24 text-6xl font-serif italic text-white w-48 text-center"
                               />
                               <span className="text-4xl font-serif text-white italic">%</span>
                            </div>
                         </div>
                         <div className="max-w-xs space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Deducted from all client production logs to track "Net Yield" automatically.</p>
                         </div>
                      </div>
                   </div>
                ) : (
                   <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Program Name</label>
                         <Input placeholder="e.g. Cinema Production Lab" value={formData.programName} onChange={e => setFormData({...formData, programName: e.target.value})} className="h-20 text-xl font-serif italic" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Cohort / Year</label>
                         <Input value={formData.cohortYear} onChange={e => setFormData({...formData, cohortYear: e.target.value})} className="h-20 text-xl font-serif italic" />
                      </div>
                   </div>
                )}
             </div>

             <div className="flex justify-between pt-20 border-t border-white/5">
               <button onClick={handleBack} className="text-[10px] font-black uppercase tracking-[0.5em] text-white hover:underline transition-colors">Back to Contact</button>
               <Button onClick={handleNext} className="h-14 px-10 text-[10px] tracking-[0.4em] font-black">Build Roster <ArrowRight size={14} className="ml-4" /></Button>
             </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-12 animate-in slide-in-from-right duration-500">
             <div className="flex justify-between items-end">
                <div className="space-y-2">
                   <Text variant="caption">Scene 03 // Roster Initialization</Text>
                   <Heading level={2} className="text-white">Personnel Sync.</Heading>
                </div>
                <Badge color="accent">{formData.managedUsers.length} Pending</Badge>
             </div>

             <div className="grid md:grid-cols-2 gap-8">
                <Card className="p-12 border-accent/20 bg-accent/5 space-y-8 flex flex-col justify-between">
                   <div className="space-y-6 text-center">
                      <UploadCloud size={48} strokeWidth={1} className="mx-auto text-accent" />
                      <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-white">Bulk Audit Import</h4>
                      <p className="text-xs text-white/40 italic leading-relaxed">Import your entire roster spreadsheet via CSV to bypass manual entry.</p>
                   </div>
                   <div className="pt-6">
                      <BulkJobUpload userId={user.id} onComplete={() => handleNext()} />
                   </div>
                </Card>

                <div className="space-y-4">
                   <h4 className="text-[11px] font-black uppercase tracking-widest text-white/40 mb-6">Manual Entry</h4>
                   <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {formData.managedUsers.map((u, i) => (
                        <div key={i} className="p-6 glass-ui border-white/5 space-y-4">
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase text-accent italic">Entry {i+1}</span>
                              <button onClick={() => setFormData({...formData, managedUsers: formData.managedUsers.filter((_, idx) => idx !== i)})}><X size={14} className="text-white/20" /></button>
                           </div>
                           <Input placeholder="Talent Name" value={u.name} onChange={e => updateTempUser(i, 'name', e.target.value)} className="h-12 text-sm" />
                           <Input placeholder="Email Coordinate" value={u.email} onChange={e => updateTempUser(i, 'email', e.target.value)} className="h-12 text-sm" />
                        </div>
                      ))}
                      <button 
                        onClick={handleAddTempUser}
                        className="w-full py-8 border border-dashed border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-4"
                      >
                         <Plus size={14} /> Add Personnel
                      </button>
                   </div>
                </div>
             </div>

             <div className="flex justify-between pt-20 border-t border-white/5">
               <button onClick={handleNext} className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 hover:text-white transition-colors">Skip to Dashboard</button>
               <Button onClick={handleFinish} className="h-16 px-16 text-[12px] tracking-[0.5em] accent-glow">Action // Roll Sound</Button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};
