import React, { useState, useMemo, useEffect } from 'react';
import { User, CanadianProvince, UserUnionTracking } from '../types';
import { INDUSTRY_DEPARTMENTS } from '../config/industry_roles';
import { UNION_SPECS } from '../config/unions_data';
import { resolveUnionsForRole } from '../config/jurisdiction_map';
import { api } from '../services/storage';
import { Button, Input, Heading, Text, Select, Badge, Card } from '../components/ui';
import { ArrowRight, MapPin, Sparkles, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  province: string;
  region: User['region'];
  department: string;
  selectedRoles: string[];
  selectedUnions: string[];
}

interface StepProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onNext: () => void;
  onBack: () => void;
}

// ─── Production Call Overlay ─────────────────────────────────────────────────

const ProductionCallOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const [stage, setStage] = useState(0);
  const sequence = [
    "Pictures up. Calibrating Hub...",
    "Syncing Jurisdictional Rules...",
    "Assigning Guild Continuity...",
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
      </div>
    </div>
  );
};

// ─── Step 1: Welcome ─────────────────────────────────────────────────────────

const StepWelcome = ({ onNext }: { onNext: () => void }) => (
  <div className="text-center space-y-12">
    <Badge color="accent" className="tracking-[0.8em]">JURISDICTIONAL ENGINE v0.5</Badge>
    <h1 className="heading-huge text-white">LOCK IT UP.</h1>
    <Text className="max-w-xl mx-auto text-2xl text-white font-light italic leading-relaxed">
      Establishing jurisdictional coordinates. National standards apply, but provincial peculiarities drive your eligibility.
    </Text>
    <div className="pt-16">
      <Button onClick={onNext} className="h-14 px-10 text-xs tracking-[0.6em] font-black">Begin Calibration</Button>
    </div>
  </div>
);

// ─── Step 2: Coordinates ─────────────────────────────────────────────────────

const StepCoordinates = ({ formData, setFormData, onNext, onBack }: StepProps) => (
  <div className="space-y-12 animate-in slide-in-from-right duration-500">
    <div className="space-y-2">
      <Text variant="caption">Scene 01 // Coordinates</Text>
      <Heading level={2} className="text-white">Principal Hub.</Heading>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <label className="text-xs font-black uppercase tracking-[0.4em] text-white">First Name</label>
        <Input value={formData.firstName} onChange={e => setFormData(f => ({...f, firstName: e.target.value}))} className="h-24 text-2xl font-serif italic text-white" />
      </div>
      <div className="space-y-3">
        <label className="text-xs font-black uppercase tracking-[0.4em] text-white">Last Name</label>
        <Input value={formData.lastName} onChange={e => setFormData(f => ({...f, lastName: e.target.value}))} className="h-24 text-2xl font-serif italic text-white" />
      </div>
      <div className="md:col-span-2 space-y-3 pt-6">
        <label className="text-xs font-black uppercase tracking-[0.4em] text-white flex items-center gap-4"><MapPin size={12} className="text-accent" /> Base Jurisdiction</label>
        <Select value={formData.province} onChange={e => setFormData(f => ({...f, province: e.target.value as any}))} className="h-24 text-2xl font-serif italic text-white">
          {Object.values(CanadianProvince).map(v => <option key={v} value={v} className="bg-black text-white">{v}</option>)}
        </Select>
      </div>
    </div>
    <div className="flex justify-between pt-20 border-t border-white/5">
      <button onClick={onBack} className="text-xs font-black uppercase tracking-[0.5em] text-white hover:underline transition-colors">10-100</button>
      <Button onClick={onNext} className="h-14 px-10 text-xs tracking-[0.4em] font-black">Assign Dept <ArrowRight size={14} className="ml-4" /></Button>
    </div>
  </div>
);

// ─── Step 3: Roles ───────────────────────────────────────────────────────────

const StepRoles = ({ formData, setFormData, onNext, onBack }: StepProps) => (
  <div className="space-y-12 animate-in slide-in-from-right duration-500">
    <div className="flex justify-between items-end">
      <div className="space-y-2">
        <Text variant="caption">Scene 02 // Department</Text>
        <Heading level={2} className="text-white">Role Selection.</Heading>
      </div>
      <div className="flex items-center gap-6">
        <Badge color="neutral" className="opacity-40 italic">{formData.province} Rules Active</Badge>
        <Badge color="accent">{formData.selectedRoles.length} Marked</Badge>
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
      {INDUSTRY_DEPARTMENTS.map(d => (
        <button
          key={d.name}
          onClick={() => setFormData(f => ({...f, department: d.name}))}
          className={clsx(
            "p-8 border text-xs font-black uppercase tracking-widest transition-all h-32 flex items-center justify-center text-center",
            formData.department === d.name ? "bg-accent text-black border-accent" : "glass-ui text-white hover:border-white/20"
          )}
        >
          {d.name}
        </button>
      ))}
    </div>

    {formData.department && (
      <div className="grid md:grid-cols-2 gap-1 pt-10 border-t border-white/10 animate-in fade-in duration-700">
        {INDUSTRY_DEPARTMENTS.find(d => d.name === formData.department)?.roles.map(r => {
          const resolvedUnionIds = resolveUnionsForRole(formData.province, r.name, formData.department);
          const isSelected = formData.selectedRoles.includes(r.name);
          return (
            <Card
              key={r.name}
              onClick={() => setFormData(f => ({
                ...f,
                selectedRoles: isSelected ? f.selectedRoles.filter(x => x !== r.name) : [...f.selectedRoles, r.name]
              }))}
              className={clsx(
                "p-10 space-y-6 transition-all min-h-[160px] border-white/5 group",
                isSelected ? "bg-white text-black border-white" : "glass-ui text-white hover:border-accent/20"
              )}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-serif italic text-2xl leading-none">{r.name}</h4>
                {resolvedUnionIds.length > 0 && (
                  <Badge color={isSelected ? "neutral" : "accent"} className="text-xs tracking-widest">
                    {UNION_SPECS[resolvedUnionIds[0]]?.name}
                  </Badge>
                )}
              </div>
              <p className={clsx("text-xs leading-relaxed italic font-light", isSelected ? "text-black/60" : "text-white/40")}>
                {r.description}
              </p>
            </Card>
          );
        })}
      </div>
    )}

    <div className="flex justify-between pt-20 border-t border-white/5">
      <button onClick={onBack} className="text-xs font-black uppercase tracking-[0.5em] text-white hover:underline transition-colors">Back to Ones</button>
      <Button onClick={onNext} className="h-14 px-10 text-xs tracking-[0.4em] font-black" disabled={formData.selectedRoles.length === 0}>Identify Guilds <ArrowRight size={14} className="ml-4" /></Button>
    </div>
  </div>
);

// ─── Step 4: Guilds ──────────────────────────────────────────────────────────

const StepGuilds = ({
  formData,
  setFormData,
  suggestedUnionIds,
  onBack,
  onComplete,
  isSaving,
  saveError
}: StepProps & { suggestedUnionIds: string[]; onComplete: () => void; isSaving: boolean; saveError: string }) => (
  <div className="space-y-12 animate-in slide-in-from-right duration-500">
    <div className="space-y-2">
      <Text variant="caption">Scene 03 // Affiliation</Text>
      <Heading level={2} className="text-white">Guild Intelligence.</Heading>
    </div>

    <div className="p-10 bg-accent/5 border border-accent/20 glass-ui mb-8 flex items-start gap-8">
      <Sparkles className="text-accent shrink-0" size={28} />
      <div className="space-y-3">
        <p className="text-xs font-black uppercase tracking-[0.5em] text-accent">Intelligent Suggestions</p>
        <p className="text-lg text-white font-light italic leading-relaxed">
          Based on your role selection and <b>{formData.province}</b> residency, the matrix has resolved the following guild trajectories.
        </p>
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-1">
      {Object.entries(UNION_SPECS).map(([id, u]) => {
        const isSuggested = suggestedUnionIds.includes(id);
        const isSelected = formData.selectedUnions.includes(id);
        return (
          <button
            key={id}
            onClick={() => setFormData(f => ({
              ...f,
              selectedUnions: isSelected ? f.selectedUnions.filter(x => x !== id) : [...f.selectedUnions, id]
            }))}
            className={clsx(
              "p-12 border transition-all text-left group min-h-[200px] flex flex-col justify-between",
              isSelected ? "bg-accent text-black border-accent" : isSuggested ? "border-accent/30 bg-accent/5 text-white" : "glass-ui text-white hover:border-white/20"
            )}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-4xl font-serif italic block">{u.name}</span>
                {isSuggested && <Badge color={isSelected ? "neutral" : "accent"}>Matched</Badge>}
              </div>
              <span className="text-xs uppercase tracking-widest leading-relaxed opacity-60 italic">{u.description}</span>
            </div>
            <div className="pt-6 border-t border-white/5">
              <span className="text-xs font-black uppercase tracking-widest text-white/20">Protocol Coverage</span>
            </div>
          </button>
        );
      })}
    </div>

    {saveError && (
      <div className="p-6 border border-red-500/30 bg-red-500/5 flex items-center gap-4">
        <AlertTriangle size={16} className="text-red-400 shrink-0" />
        <p className="text-xs font-black uppercase tracking-widest text-red-400">{saveError}</p>
      </div>
    )}

    <div className="flex justify-between pt-20 border-t border-white/5">
      <button onClick={onBack} className="text-xs font-black uppercase tracking-[0.5em] text-white hover:underline transition-colors">Adjust Roles</button>
      <Button onClick={onComplete} disabled={isSaving} className="h-14 px-10 text-xs tracking-[0.4em] font-black disabled:opacity-40">
        {isSaving ? 'Preparing...' : 'Action // Roll Sound'}
      </Button>
    </div>
  </div>
);

// ─── Main Orchestrator ───────────────────────────────────────────────────────

export const OnboardingIndividual = ({ user, onComplete }: { user: User, onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [formData, setFormData] = useState<FormData>({
    firstName: user.name?.split(' ')[0] || '',
    lastName: user.name?.split(' ').slice(1).join(' ') || '',
    email: user.email || '',
    phone: user.phone || '',
    province: CanadianProvince.ON,
    region: 'TORONTO' as User['region'],
    department: 'Camera Department',
    selectedRoles: [] as string[],
    selectedUnions: [] as string[]
  });

  const suggestedUnionIds = useMemo(() => {
    const ids = new Set<string>();
    formData.selectedRoles.forEach(role => {
      const resolved = resolveUnionsForRole(formData.province, role, formData.department);
      resolved.forEach(id => ids.add(id));
    });
    return Array.from(ids);
  }, [formData.selectedRoles, formData.province, formData.department]);

  useEffect(() => {
    if (step === 4) {
      setFormData(prev => ({ ...prev, selectedUnions: suggestedUnionIds }));
    }
  }, [step, suggestedUnionIds]);

  const executeCompletion = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      const updates: Partial<User> = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        province: formData.province,
        region: formData.region,
        department: formData.department,
        selectedRoles: formData.selectedRoles,
        isOnboarded: true,
        role: formData.selectedRoles[0] || 'Film Professional'
      };

      const newTrackings: UserUnionTracking[] = formData.selectedUnions.map(id => {
        const spec = UNION_SPECS[id];
        return {
          id: `track_${id}_${Date.now()}`,
          userId: user.id,
          unionTypeId: id,
          unionName: spec.name,
          tierLabel: spec.tiers[0].name,
          targetType: spec.tiers[0].targetType,
          targetValue: spec.tiers[0].targetValue,
          startingValue: 0
        };
      });

      await api.auth.updateUser(updates);
      await api.tracking.save(newTrackings);
      onComplete();
    } catch (err: any) {
      setSaveError(err.message || 'Save failed. Please try again.');
      setIsPreparing(false);
      setIsSaving(false);
    }
  };

  const handleBeginSave = () => {
    setSaveError('');
    setIsPreparing(true);
  };

  const stepProps: StepProps = {
    formData,
    setFormData,
    onNext: () => setStep(s => s + 1),
    onBack: () => setStep(s => s - 1)
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 text-white bg-black relative overflow-hidden font-sans">
      {isPreparing && <ProductionCallOverlay onComplete={executeCompletion} />}
      <div className="bg-vignette-universal"></div>

      <div className="w-full max-w-5xl space-y-16 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {step === 1 && <StepWelcome onNext={stepProps.onNext} />}
        {step === 2 && <StepCoordinates {...stepProps} />}
        {step === 3 && <StepRoles {...stepProps} />}
        {step === 4 && (
          <StepGuilds
            {...stepProps}
            suggestedUnionIds={suggestedUnionIds}
            onComplete={handleBeginSave}
            isSaving={isSaving}
            saveError={saveError}
          />
        )}
      </div>
    </div>
  );
};
