
import React from 'react';
import { Heading, Text, Button, Card, Badge } from '../components/ui';
import { ArrowRight, Plus, Shield, Target, FileText, HelpCircle, Globe, Users, BookOpen, Landmark, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PLANS, UNIONS } from '../types';
import { clsx } from 'clsx';

export const Welcome = ({ onEnter }: { onEnter: (asAgent?: boolean) => void }) => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen font-sans text-textPrimary bg-black">
      
      {/* 1. Global HUD Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] h-24 px-6 md:px-12 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-4">
          <span className="font-serif text-3xl tracking-tighter text-white italic">Ca</span>
          <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-textSecondary">v 0.5</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-8 md:gap-12">
          <button onClick={() => navigate('/about')} className="text-[9px] font-black uppercase tracking-[0.4em] text-textSecondary hover:text-accent transition-colors">About</button>
          <button onClick={() => navigate('/resources')} className="text-[9px] font-black uppercase tracking-[0.4em] text-textSecondary hover:text-accent transition-colors">Resources</button>
          <button onClick={() => navigate('/manual')} className="hidden md:block text-[9px] font-black uppercase tracking-[0.4em] text-accent border-b border-accent/20 pb-1">Field Manual</button>
          <button onClick={() => onEnter(false)} className="text-[9px] font-black uppercase tracking-[0.4em] text-white bg-white/5 border border-white/10 px-6 py-2 hover:bg-white hover:text-black transition-all">Authenticate</button>
        </div>
      </nav>

      {/* 2. Hero: The Industry Interface */}
      <section className="relative h-[90vh] flex flex-col justify-center items-center px-6">
        <div className="text-center space-y-6 z-10">
          <span className="block text-accent text-[10px] font-black uppercase tracking-[0.8em] animate-in fade-in slide-in-from-bottom-4">Digital Platform for Cinema</span>
          <h1 className="heading-huge animate-in fade-in slide-in-from-bottom-8 duration-700">THE INDUSTRY <br /> <span className="text-accent">INTERFACE.</span></h1>
          <div className="pt-10 flex flex-col md:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000">
             <Button onClick={() => onEnter(false)} className="h-16 px-12 text-[10px] tracking-[0.4em]">Initialize Profile <ArrowRight className="ml-4" size={14}/></Button>
             <Button onClick={() => onEnter(true)} variant="secondary" className="h-16 px-12 text-[10px] tracking-[0.4em]">Agency Command</Button>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl h-full pointer-events-none opacity-20">
           <img src="https://i.pinimg.com/736x/86/bc/62/86bc625fc438194940ed2003b8c263d1.jpg" className="absolute top-20 right-0 w-64 grayscale" alt="Set" />
           <img src="https://i.pinimg.com/736x/84/ec/58/84ec58f9ee5d374d9ebbb0c0bfea1885.jpg" className="absolute bottom-20 left-0 w-72 grayscale" alt="Lighting" />
        </div>
      </section>

      {/* 3. Nuanced Coverage: Unions */}
      <section className="py-40 border-y border-white/5 bg-surface/50 backdrop-blur-3xl">
         <div className="mobile-wrapper space-y-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
               <div className="space-y-6 max-w-2xl">
                  <Badge color="accent">Jurisdictional Intelligence</Badge>
                  <h2 className="font-serif text-7xl italic text-white leading-[0.8]">Calibrated for <br/> the Ontario Hub.</h2>
                  <p className="text-xl text-white/40 font-light italic leading-relaxed">CineArch recognizes the specific boundaries between technical locals. From IATSE 873 Toronto to Local 634 Northern Ontario and the DGC/ACTRA National standards.</p>
               </div>
               <Button onClick={() => navigate('/manual')} variant="outline" className="h-20 border-accent/20 text-accent group px-10">
                  Browse Field Manual <ChevronRight size={14} className="ml-3 group-hover:translate-x-1 transition-transform" />
               </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1">
               {UNIONS.map(u => (
                  <div key={u.id} className="p-10 glass-ui flex flex-col justify-between gap-12 group hover:border-accent/30 transition-all min-h-[280px]">
                     <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">{u.name}</span>
                        <span className="text-[8px] font-black uppercase text-white/20 tracking-widest leading-relaxed block">{u.description}</span>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase text-white/10 tracking-widest">Entry Protocol</p>
                        <p className="text-xs text-white/40 font-serif italic">${u.applicationFee || 0} Initiation</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* 4. Editorial: The Philosophy */}
      <section className="py-52 bg-black">
        <div className="mobile-wrapper grid lg:grid-cols-12 gap-20 items-center">
           <div className="lg:col-span-8 space-y-12">
              <h2 className="font-serif text-5xl md:text-8xl italic text-white tracking-tighter leading-none uppercase">Authority. <br/>Precision. <br/>Discretion.</h2>
              <div className="space-y-8 text-xl md:text-2xl font-light text-textSecondary leading-relaxed max-w-3xl italic">
                 <p>CineArch is a cinematic platform built to navigate the complexities of the Canadian film industry. We bridge the gap between chaotic production schedules and professional compliance.</p>
                 <p>Our tools empower you to log jobs, track union eligibility, and secure financial records with absolute architectural focus.</p>
              </div>
              <div className="pt-12">
                 <button onClick={() => navigate('/about')} className="text-accent text-[11px] font-black uppercase tracking-[0.8em] border-b border-accent/30 pb-2 hover:text-white transition-colors">Read the Charter</button>
              </div>
           </div>
        </div>
      </section>

      {/* 5. Pricing: Member Tiers */}
      <section className="py-40 bg-black/60 border-t border-white/5">
        <div className="mobile-wrapper">
          <h2 className="heading-huge text-center mb-32 uppercase italic">Membership.</h2>
          <div className="grid md:grid-cols-3 gap-1">
             {Object.values(PLANS).map((plan) => (
               <div key={plan.id} className={clsx("p-12 border border-white/5 flex flex-col transition-all duration-700", plan.id === 'pro' ? "bg-accent/5 border-accent/20" : "bg-black/40")}>
                 <h3 className="text-2xl font-serif italic text-white mb-2">{plan.label}</h3>
                 <div className="mb-12">
                    <div className="text-7xl font-serif text-white italic tracking-tighter">{plan.price}<span className="text-xs font-sans text-textTertiary ml-2">/mo</span></div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-textTertiary mt-4">{plan.desc}</p>
                 </div>
                 <ul className="space-y-6 mb-20 flex-1 border-t border-white/10 pt-12">
                    {plan.benefits.map((benefit, j) => (
                      <li key={j} className="flex items-start gap-4 text-xs font-medium text-textSecondary">
                        <Plus size={14} className="text-accent mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                 </ul>
                 <Button onClick={() => onEnter(plan.id === 'agency')} className={clsx("w-full h-20 text-[10px] tracking-[0.4em]", plan.id === 'pro' ? "bg-accent text-black" : "bg-white/10 text-white hover:bg-white")}>Select Tier</Button>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* 6. Technical Footer */}
      <footer className="py-24 border-t border-white/5 text-center bg-[#050505]">
         <span className="font-serif text-5xl text-accent italic mb-12 block">Ca</span>
         <div className="flex justify-center gap-12 text-[10px] font-black uppercase tracking-[0.5em] text-textTertiary">
            <button onClick={() => navigate('/about')} className="hover:text-accent transition-colors">About</button>
            <button onClick={() => navigate('/resources')} className="hover:text-accent transition-colors">Resources</button>
            <button onClick={() => navigate('/privacy')} className="hover:text-accent transition-colors">Privacy</button>
            <button onClick={() => navigate('/terms')} className="hover:text-accent transition-colors">Contact</button>
         </div>
         <p className="text-[8px] text-accent/30 font-black uppercase mt-12 tracking-widest">Version 0.5 BUILD // CineArch Systems</p>
      </footer>
    </div>
  );
};
