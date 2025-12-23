
import React, { useState } from 'react';
import { User, CanadianProvince } from '../types';
import { api } from '../services/storage';
import { Button, Input, Heading, Text, Badge } from '../components/ui';
import { clsx } from 'clsx';

export const Onboarding = ({ user, onComplete }: { user: User, onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: user.name?.split(' ')[0] || '',
    lastName: user.name?.split(' ').slice(1).join(' ') || '',
    email: user.email || '',
    province: 'ON',
    initialTalentName: '',
    feeModel: 'COMMISSION' as 'COMMISSION' | 'FLAT_FEE' | 'NONE',
    rate: 10
  });

  const isShowrunner = user.accountType === 'AGENT';

  const handleFinish = () => {
    const updates: Partial<User> = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      isOnboarded: true,
      feeModel: formData.feeModel,
      agentFeePercentage: formData.feeModel === 'COMMISSION' ? formData.rate : 0
    };
    api.auth.updateUser(updates);
    onComplete();
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 text-white bg-black font-sans">
      <div className="w-full max-w-4xl space-y-16 animate-in fade-in duration-1000">
        
        {step === 1 && (
          <div className="text-center space-y-12">
            <h1 className="heading-huge uppercase tracking-tighter">
              {isShowrunner ? "COMMAND CENTER." : "REPORT TO SET."}
            </h1>
            <Text className="max-w-2xl mx-auto text-2xl font-serif italic text-white/60">
              {isShowrunner 
                ? "You’re managing a roster in a high-pressure industry. Let’s calibrate your console so you can focus on the talent, not the paperwork." 
                : "We know your schedule is uncertain and the paperwork is heavy. Let's get your professional record locked so you can get back to the frame."}
            </Text>
            <Button onClick={() => setStep(2)} className="h-16 px-12 text-[11px] font-black uppercase tracking-[0.5em] accent-glow">Initialize System</Button>
          </div>
        )}

        {isShowrunner && step === 2 && (
          <div className="space-y-12 animate-in slide-in-from-right">
             <div className="space-y-2">
                <Badge color="accent">Step 02</Badge>
                <Heading level={2}>The Operating Model.</Heading>
                <Text variant="subtle" className="italic">Choose how you represent your roster. Fees drive your financial analytics.</Text>
             </div>
             <div className="grid md:grid-cols-3 gap-4">
                {[
                  { id: 'COMMISSION', label: 'Commission', desc: 'Industry standard percentage.' },
                  { id: 'FLAT_FEE', label: 'Flat Fee', desc: 'Fixed monthly retainer.' },
                  { id: 'NONE', label: 'None', desc: 'No monetization tracking.' }
                ].map(m => (
                  <button 
                    key={m.id}
                    onClick={() => setFormData({...formData, feeModel: m.id as any})}
                    className={clsx(
                      "p-10 border text-left space-y-4 transition-all",
                      formData.feeModel === m.id ? "border-accent bg-accent/5" : "border-white/5 hover:border-white/20"
                    )}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent">{m.label}</p>
                    <p className="text-sm text-white font-serif italic">{m.desc}</p>
                  </button>
                ))}
             </div>
             
             {formData.feeModel !== 'NONE' && (
                <div className="space-y-6 animate-in fade-in">
                   <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">
                     {formData.feeModel === 'COMMISSION' ? 'Commission Rate (%)' : 'Monthly Fee ($)'}
                   </label>
                   <Input 
                      type="number" 
                      value={formData.rate} 
                      onChange={e => setFormData({...formData, rate: Number(e.target.value)})} 
                      className="h-20 text-5xl font-serif italic" 
                   />
                </div>
             )}

             <Button onClick={handleFinish} className="h-16 px-12">Launch Console</Button>
          </div>
        )}

        {!isShowrunner && step === 2 && (
           <div className="space-y-12 animate-in slide-in-from-right">
              <div className="space-y-2">
                 <Badge color="accent">Step 02</Badge>
                 <Heading level={2}>Personnel Verified.</Heading>
                 <Text variant="subtle" className="italic">Let's verify your identity for guild compliance.</Text>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <Input placeholder="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="h-20 text-2xl font-serif italic" />
                 <Input placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="h-20 text-2xl font-serif italic" />
              </div>
              <Button onClick={handleFinish} className="h-16 px-12">Complete Profile</Button>
           </div>
        )}
      </div>
    </div>
  );
};
