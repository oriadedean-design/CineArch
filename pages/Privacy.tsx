import React from 'react';
import { Heading, Text, Card, Badge } from '../components/ui';
import { Shield, Lock, EyeOff, Scale, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Privacy = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-24 animate-in fade-in duration-700 max-w-5xl mx-auto">
      <button onClick={() => navigate('/resources')} className="mb-12 flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-textTertiary hover:text-white transition-colors">
          <ArrowLeft size={14} /> Back to Library
      </button>

      <header className="text-center space-y-4">
         <span className="text-accent text-[10px] font-black uppercase tracking-[0.6em] block">Legal Architecture</span>
         <h1 className="heading-huge">THE <br/><span className="text-accent">CHARTER.</span></h1>
         <p className="text-lg text-textSecondary font-light italic">How we protect your craft through radical transparency and zero-exploitation protocols.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-10">
         <div className="space-y-12">
            <section className="space-y-4">
               <div className="flex items-center gap-4 text-accent border-b border-white/5 pb-4 w-fit">
                  <Shield size={16} />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Zero Exploitation</h3>
               </div>
               <p className="text-textSecondary leading-relaxed font-light text-sm">We do not sell your financial data. Your earnings, voucher uploads, and tax metadata are encrypted as soon as they reach our servers. Our business model is membership, not data brokering.</p>
            </section>

            <section className="space-y-4">
               <div className="flex items-center gap-4 text-accent border-b border-white/5 pb-4 w-fit">
                  <Lock size={16} />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Local Encryption</h3>
               </div>
               <p className="text-textSecondary leading-relaxed font-light text-sm">CineArch utilizes client-side encryption for all uploaded documents. This ensures your private deal memos are unreadable even to our administrators.</p>
            </section>
         </div>

         <div className="space-y-12">
            <section className="space-y-4">
               <div className="flex items-center gap-4 text-accent border-b border-white/5 pb-4 w-fit">
                  <EyeOff size={16} />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Anonymous Signals</h3>
               </div>
               <p className="text-textSecondary leading-relaxed font-light text-sm">We collect telemetry solely to optimize system performance. These signals are anonymized and never linked to your financial logbook.</p>
            </section>

            <section className="space-y-4">
               <div className="flex items-center gap-4 text-accent border-b border-white/5 pb-4 w-fit">
                  <Scale size={16} />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">The Purge Protocol</h3>
               </div>
               <p className="text-textSecondary leading-relaxed font-light text-sm">At any time, you may trigger an Account Purge in your settings. This immediately and permanently deletes all records and documents across our backup environments.</p>
            </section>
         </div>
      </div>

      <Card className="p-10 border-accent/20 bg-accent/5">
         <h3 className="font-serif italic text-3xl text-white mb-4">Compliance Status</h3>
         <div className="flex flex-wrap gap-4">
            <Badge color="accent">GDPR READY</Badge>
            <Badge color="accent">PIPEDA COMPLIANT</Badge>
            <Badge color="accent">SOC2 ENCRYPTION</Badge>
         </div>
         <p className="text-[9px] text-textTertiary font-black uppercase tracking-[0.3em] mt-8">Last Updated: October 2024 // v 0.5 BUILD</p>
      </Card>
    </div>
  );
};