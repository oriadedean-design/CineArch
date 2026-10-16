import React, { useState, useMemo, useEffect } from 'react';
import { User, CanadianProvince, UserUnionTracking, ONTARIO_REGION_LABELS, type OntarioRegion } from '../types';
import { resolveGuildsForRole, getUnionSpec, getUnionsForProvince, getDepartments } from '../services/engine';
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
  memberStatus: 'ASPIRING' | 'MEMBER';
  hasAgent: boolean;
  agentPct: string;
  earningGoal: string;
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
    "Roll sound…",
    "Speed. Roll camera…",
    "Marker.",
    "Action."
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
    <Badge color="accent" className="tracking-[0.4em]">Setting the Scene · 4 questions</Badge>
    <h1 className="heading-huge text-white">SETTING THE SCENE.</h1>
    <Text className="max-w-xl mx-auto text-2xl text-white font-light italic leading-relaxed">
      Give us the context, so we can shape CineArch around you: where you're based, what you do, who's in your corner and what you're working toward. You can change any of it later in Your Trailer.
    </Text>
    <div className="pt-16">
      <Button onClick={onNext} className="h-14 px-10 text-xs tracking-[0.6em] font-black">Start: where you're based</Button>
    </div>
  </div>
);

// ─── Step 2: Coordinates ─────────────────────────────────────────────────────

const StepCoordinates = ({ formData, setFormData, onNext, onBack }: StepProps) => (
  <div className="space-y-12 animate-in slide-in-from-right duration-500">
    <div className="space-y-2">
      <Text variant="caption">Scene 01 // Where you're based</Text>
      <Heading level={2} className="text-white">Your home base.</Heading>
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
        <label className="text-xs font-black uppercase tracking-[0.4em] text-white flex items-center gap-4"><MapPin size={12} className="text-accent" /> Province or territory</label>
        <p className="text-xs text-white/50 italic">This decides which unions and rules apply to you.</p>
        <Select value={formData.province} onChange={e => setFormData(f => ({...f, province: e.target.value as any}))} className="h-24 text-2xl font-serif italic text-white">
          {Object.values(CanadianProvince).map(v => <option key={v} value={v} className="bg-black text-white">{v}</option>)}
        </Select>
      </div>
      {formData.province === CanadianProvince.ON && (
        <div className="md:col-span-2 space-y-3">
          <label className="text-xs font-black uppercase tracking-[0.4em] text-white">Region in Ontario</label>
          <Select value={formData.region} onChange={e => setFormData(f => ({...f, region: e.target.value as User['region']}))} className="h-24 text-2xl font-serif italic text-white">
            {(Object.entries(ONTARIO_REGION_LABELS) as [OntarioRegion, string][]).map(([v, label]) => <option key={v} value={v} className="bg-black text-white">{label}</option>)}
          </Select>
        </div>
      )}
    </div>
    <div className="flex justify-between pt-20 border-t border-white/5">
      <button onClick={onBack} className="text-xs font-black uppercase tracking-[0.5em] text-white hover:underline transition-colors">Back</button>
      <Button onClick={onNext} className="h-14 px-10 text-xs tracking-[0.4em] font-black">Next: your work <ArrowRight size={14} className="ml-4" /></Button>
    </div>
  </div>
);

// ─── Step 3: Roles ───────────────────────────────────────────────────────────

const StepRoles = ({ formData, setFormData, onNext, onBack }: StepProps) => (
  <div className="space-y-12 animate-in slide-in-from-right duration-500">
    <div className="flex justify-between items-end">
      <div className="space-y-2">
        <Text variant="caption">Scene 02 // Your work</Text>
        <Heading level={2} className="text-white">What do you do on set?</Heading>
      </div>
      <div className="flex items-center gap-6">
        <Badge color="neutral" className="opacity-40 italic">{formData.province} Rules Active</Badge>
        <Badge color="accent">{formData.selectedRoles.length} Marked</Badge>
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
      {getDepartments().map(d => (
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
        {getDepartments().find(d => d.name === formData.department)?.roles.map(r => {
          const resolvedUnionIds = resolveGuildsForRole(formData.province, r.name, formData.department, { region: formData.region });
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
                    {getUnionSpec(resolvedUnionIds[0])?.name}
                  </Badge>
                )}
              </div>
              <p className={clsx("text-xs leading-relaxed italic font-light", isSelected ? "text-black/60" : "text-white/40")}>
                {r.description || 'Description coming soon'}
              </p>
            </Card>
          );
        })}
      </div>
    )}

    <div className="flex justify-between pt-20 border-t border-white/5">
      <button onClick={onBack} className="text-xs font-black uppercase tracking-[0.5em] text-white hover:underline transition-colors">Back</button>
      <Button onClick={onNext} className="h-14 px-10 text-xs tracking-[0.4em] font-black" disabled={formData.selectedRoles.length === 0}>Next: your team <ArrowRight size={14} className="ml-4" /></Button>
    </div>
  </div>
);

// ─── Step 4: Your team ───────────────────────────────────────────────────────

const Choice = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} aria-pressed={on}
    className={clsx("px-6 py-4 text-xs font-black uppercase tracking-widest border transition-all", on ? "bg-accent text-black border-accent" : "text-white/60 border-white/10 hover:border-white/30")}>
    {children}
  </button>
);

const StepTeam = ({ formData, setFormData, onNext, onBack }: StepProps) => (
  <div className="space-y-12 animate-in slide-in-from-right duration-500">
    <div className="space-y-2">
      <Text variant="caption">Scene 03 // Your team</Text>
      <Heading level={2} className="text-white">Who's in your corner?</Heading>
    </div>
    <div className="space-y-4">
      <label className="text-xs font-black uppercase tracking-[0.4em] text-white">Are you a union member yet?</label>
      <div className="flex flex-wrap gap-2">
        <Choice on={formData.memberStatus === 'ASPIRING'} onClick={() => setFormData(f => ({ ...f, memberStatus: 'ASPIRING' }))}>Not yet</Choice>
        <Choice on={formData.memberStatus === 'MEMBER'} onClick={() => setFormData(f => ({ ...f, memberStatus: 'MEMBER' }))}>Yes, I'm a member</Choice>
      </div>
    </div>
    <div className="space-y-4">
      <label className="text-xs font-black uppercase tracking-[0.4em] text-white">Do you have an agent?</label>
      <div className="flex flex-wrap gap-2">
        <Choice on={!formData.hasAgent} onClick={() => setFormData(f => ({ ...f, hasAgent: false }))}>No</Choice>
        <Choice on={formData.hasAgent} onClick={() => setFormData(f => ({ ...f, hasAgent: true }))}>Yes</Choice>
      </div>
      {formData.hasAgent && (
        <div className="space-y-3 max-w-xs">
          <label className="text-xs font-black uppercase tracking-[0.4em] text-white">Their commission (%)</label>
          <Input type="number" min={0} max={100} step={0.5} inputMode="decimal" value={formData.agentPct}
            onChange={e => setFormData(f => ({ ...f, agentPct: e.target.value }))} placeholder="%" className="h-16 text-2xl font-serif italic text-white" />
        </div>
      )}
      <p className="text-xs text-white/50 italic">Saved to your profile. You can change it any time in Your Trailer.</p>
    </div>
    <div className="flex justify-between pt-20 border-t border-white/5">
      <button onClick={onBack} className="text-xs font-black uppercase tracking-[0.5em] text-white hover:underline transition-colors">Back</button>
      <Button onClick={onNext} className="h-14 px-10 text-xs tracking-[0.4em] font-black">Next: your goals <ArrowRight size={14} className="ml-4" /></Button>
    </div>
  </div>
);

// ─── Step 5: Unions ──────────────────────────────────────────────────────────

const StepGuilds = ({
  formData,
  setFormData,
  suggestedUnionIds,
  onBack,
  onComplete,
  isSaving,
  saveError
}: StepProps & { suggestedUnionIds: string[]; onComplete: () => void; isSaving: boolean; saveError: string }) => {
  // Suggested first, then every other local that operates where they work.
  const local = getUnionsForProvince(formData.province, formData.region);
  const unions = [
    ...suggestedUnionIds.map(id => getUnionSpec(id)).filter((u): u is NonNullable<typeof u> => !!u),
    ...local.filter(u => !suggestedUnionIds.includes(u.id)),
  ];
  return (
  <div className="space-y-12 animate-in slide-in-from-right duration-500">
    <div className="space-y-2">
      <Text variant="caption">Scene 04 // Your goals</Text>
      <Heading level={2} className="text-white">What you're working toward.</Heading>
    </div>

    <div className="space-y-3 max-w-sm">
      <label htmlFor="earning-goal" className="text-xs font-black uppercase tracking-[0.4em] text-white">Earning goal for {new Date().getFullYear()} ($)</label>
      <Input id="earning-goal" type="number" min={0} step={1000} inputMode="numeric" value={formData.earningGoal}
        onChange={e => setFormData(f => ({ ...f, earningGoal: e.target.value }))} placeholder="Optional, e.g. 40000" className="h-16 text-2xl font-serif italic text-white" />
      <p className="text-xs text-white/50 italic">What you'd like to earn from film work this year, before tax. Your Wrap shows how close you are.</p>
    </div>

    <label className="block text-xs font-black uppercase tracking-[0.4em] text-white pt-4">Union goals</label>

    <div className="p-10 bg-accent/5 border border-accent/20 glass-ui mb-8 flex items-start gap-8">
      <Sparkles className="text-accent shrink-0" size={28} />
      <div className="space-y-3">
        <p className="text-xs font-black uppercase tracking-[0.5em] text-accent">Picked for you</p>
        <p className="text-lg text-white font-light italic leading-relaxed">
          These unions cover your roles in <b>{formData.province}</b>. Tap the ones you're working toward: days on their sets will count, member or not.
        </p>
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-1">
      {unions.map(u => {
        const id = u.id;
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
                {isSuggested && <Badge color={isSelected ? "neutral" : "accent"}>Covers your role</Badge>}
              </div>
              <span className="text-xs uppercase tracking-widest leading-relaxed opacity-60 italic">{u.description}</span>
            </div>
            <div className="pt-6 border-t border-white/5">
              <span className="text-xs font-black uppercase tracking-widest text-white/20">{isSelected ? 'Tracking ✓' : 'Tap to track'}</span>
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
      <button onClick={onBack} className="text-xs font-black uppercase tracking-[0.5em] text-white hover:underline transition-colors">Back</button>
      <Button onClick={onComplete} disabled={isSaving} className="h-14 px-10 text-xs tracking-[0.4em] font-black disabled:opacity-40">
        {isSaving ? 'Saving…' : 'Save and open Your Wrap'}
      </Button>
    </div>
  </div>
  );
};

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
    selectedUnions: [] as string[],
    memberStatus: user.memberStatus === 'MEMBER' ? 'MEMBER' : 'ASPIRING',
    hasAgent: !!user.hasAgentFee,
    agentPct: user.agentFeePercentage != null ? String(user.agentFeePercentage) : '',
    earningGoal: user.earningGoal != null ? String(user.earningGoal) : '',
  });

  const suggestedUnionIds = useMemo(() => {
    const ids = new Set<string>();
    formData.selectedRoles.forEach(role => {
      const resolved = resolveGuildsForRole(formData.province, role, formData.department, { region: formData.region });
      resolved.forEach(id => ids.add(id));
    });
    return Array.from(ids);
  }, [formData.selectedRoles, formData.province, formData.region, formData.department]);

  useEffect(() => {
    if (step === 5) {
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
        region: formData.province === CanadianProvince.ON ? formData.region : undefined,
        department: formData.department,
        selectedRoles: formData.selectedRoles,
        isOnboarded: true,
        memberStatus: formData.memberStatus,
        hasAgentFee: formData.hasAgent,
        agentFeePercentage: formData.hasAgent && formData.agentPct !== '' ? Number(formData.agentPct) : 0,
        earningGoal: formData.earningGoal !== '' ? Number(formData.earningGoal) : undefined,
        role: formData.selectedRoles[0] || 'Film Professional'
      };

      const newTrackings: UserUnionTracking[] = formData.selectedUnions.flatMap(id => {
        const spec = getUnionSpec(id);
        // Unions without a published tier (e.g. requirements not yet sourced) can't be tracked yet.
        if (!spec || spec.tiers.length === 0) return [];
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
        {step === 4 && <StepTeam {...stepProps} />}
        {step === 5 && (
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
