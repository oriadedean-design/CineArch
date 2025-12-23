
import React from 'react';
import { Heading, Text, Button, Card } from '../components/ui';
import { ArrowRight, Plus, Shield, Target, FileText, HelpCircle, Globe, Users, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PLANS } from '../types';
import { clsx } from 'clsx';

const FAQS = [
  { q: "What is an Audit Pack™?", a: "A single, locally encrypted export of all vouchers, call sheets, and tax documents for any period." },
  { q: "How do you track GST?", a: "We monitor gross billings in real-time and alert you once you reach 80% of the small supplier threshold." },
  { q: "Can I import old jobs?", a: "Our bulk importer handles CSV files from any spreadsheet software seamlessly." },
  { q: "Is my data private?", a: "We utilize client-side encryption. Your financial metadata is never sold or shared." }
];

export const Welcome = ({ onEnter }: { onEnter: (asAgent?: boolean) => void }) => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen font-sans text-textPrimary">
      
      {/* 1. Hero: The Industry Interface */}
      <section className="relative h-[90vh] flex flex-col justify-center items-center px-6">
        <nav className="fixed top-0 left-0 right-0 z-[100] h-24 px-6 md:px-12 flex justify-between items-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-4">
            <span className="font-serif text-2xl tracking-tighter text-white italic">Ca</span>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-textSecondary">v 0.5</span>
          </div>
          <div className="pointer-events-auto flex items-center gap-10">
            <button onClick={() => navigate('/resources')} className="text-[9px] font-black uppercase tracking-[0.4em] text-textSecondary hover:text-white hidden md:block transition-colors">Library</button>
            <button onClick={() => onEnter(false)} className="text-[9px] font-black uppercase tracking-[0.4em] text-white border-b border-accent pb-1">Authenticate</button>
          </div>
        </nav>

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

      {/* 2. Explanation: Editorial */}
      <section className="py-32 md:py-52 bg-black/40 border-y border-white/5 backdrop-blur-3xl">
        <div className="mobile-wrapper grid lg:grid-cols-12 gap-20 items-center">
           <div className="lg:col-span-8 space-y-12">
              <h2 className="font-serif text-5xl md:text-7xl italic text-white tracking-tighter leading-none">Designed for <br/> the modern crew.</h2>
              <div className="space-y-8 text-xl md:text-2xl font-light text-textSecondary leading-relaxed max-w-3xl">
                 <p>CineArch is a cinematic platform built to navigate the complexities of the Canadian film industry. We bridge the gap between chaotic production schedules and professional compliance.</p>
                 <p>Our tools empower you to log jobs, track union eligibility, and secure financial records with absolute architectural focus.</p>
              </div>
              <div className="pt-8">
                 <Button onClick={() => navigate('/resources')} variant="outline" className="h-16 border-white/20 text-white">
                    <BookOpen size={16} className="mr-4" /> Explore the Library
                 </Button>
              </div>
           </div>
        </div>
      </section>

      {/* 3. How It Works: Glass Panels */}
      <section className="py-40 bg-transparent">
        <div className="mobile-wrapper">
          <Heading level={2} className="mb-24 text-center">THE PROTOCOL.</Heading>
          <div className="grid md:grid-cols-3 gap-1">
             {[
               { icon: Target, title: "Track", text: "Automated eligibility mapping for ACTRA, IATSE, and DGC based on real log data." },
               { icon: Shield, title: "Secure", text: "Zero-exploitation encrypted storage for vouchers, stubs, and residency proofs." },
               { icon: FileText, title: "Audit", text: "Generate comprehensive Audit Packs™ for tax season or membership applications." }
             ].map((item, i) => (
               <Card key={i} className="bg-black/20 border-white/5 hover:border-accent/40 flex flex-col items-center text-center p-16 gap-8">
                  <div className="w-12 h-12 bg-accent/10 flex items-center justify-center text-accent">
                     <item.icon size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-3xl italic text-white">{item.title}</h3>
                  <p className="text-textSecondary leading-relaxed font-light">{item.text}</p>
               </Card>
             ))}
          </div>
        </div>
      </section>

      {/* 4. Social Proof: Trust Cues */}
      <section className="py-24 border-y border-white/5">
         <div className="mobile-wrapper flex flex-wrap justify-center gap-20 opacity-30 grayscale contrast-150">
            {['ACTRA', 'IATSE 873', 'DGC', 'IATSE 667', 'NABET'].map(guild => (
              <span key={guild} className="text-[10px] font-black tracking-[0.6em] text-white">{guild}</span>
            ))}
         </div>
      </section>

      {/* 5. Pricing: Member Tiers */}
      <section className="py-40 bg-black/60">
        <div className="mobile-wrapper">
          <h2 className="heading-huge text-center mb-32">MEMBERSHIP.</h2>
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

      {/* 6. FAQ: Glass Accordion */}
      <section className="py-40 border-t border-white/5">
         <div className="mobile-wrapper max-w-4xl mx-auto">
            <Heading level={2} className="mb-20 text-center">F.A.Q.</Heading>
            <div className="space-y-1">
               {FAQS.map((faq, i) => (
                 <div key={i} className="glass-ui p-10 group cursor-pointer hover:bg-white/5 transition-all">
                    <h4 className="font-serif text-2xl text-white italic mb-4 flex justify-between">
                       {faq.q}
                       <HelpCircle size={18} className="text-textTertiary group-hover:text-accent transition-colors" />
                    </h4>
                    <p className="text-textSecondary font-light leading-relaxed max-w-2xl">{faq.a}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* 7. Persuasion Block */}
      <section className="py-40 md:py-64 bg-accent/5 border-y border-accent/20">
        <div className="mobile-wrapper text-center space-y-12">
           <h2 className="heading-huge leading-[0.7]">HUMAN ERROR <br/> <span className="text-accent">IS A WRAP.</span></h2>
           <p className="max-w-3xl mx-auto text-xl font-light text-textSecondary leading-relaxed italic">You didn’t join this industry to manage spreadsheets. CineArch choreographs the paperwork so you can stay behind the lens.</p>
        </div>
      </section>

      {/* 8. Sub-Hero: The New Standard */}
      <section className="py-40 bg-black">
        <div className="mobile-wrapper grid lg:grid-cols-2 gap-24 items-center">
           <div className="space-y-10">
              <h2 className="font-serif text-5xl italic text-white tracking-tighter leading-tight">The new standard for <br/> production personnel.</h2>
              <p className="text-base text-textSecondary font-light leading-relaxed">Built by industry veterans for the next generation of leadership. We provide the stability your creative career requires.</p>
              <div className="grid grid-cols-2 gap-10 pt-6">
                 <div className="space-y-2">
                    <Globe size={20} className="text-accent" />
                    <p className="text-[10px] font-black uppercase text-white tracking-widest">Global Sync</p>
                    <p className="text-[10px] text-textTertiary leading-relaxed">Cross-province residency compliance engine.</p>
                 </div>
                 <div className="space-y-2">
                    <Users size={20} className="text-accent" />
                    <p className="text-[10px] font-black uppercase text-white tracking-widest">Guild Ready</p>
                    <p className="text-[10px] text-textTertiary leading-relaxed">Direct support for IATSE, ACTRA, and DGC.</p>
                 </div>
              </div>
           </div>
           <div className="aspect-video glass-ui grayscale opacity-50 relative overflow-hidden rounded-sm">
              <img src="https://i.pinimg.com/1200x/f9/30/4b/f9304b1f391afde057dca62a0a1f2ca4.jpg" className="w-full h-full object-cover" alt="Interface" />
           </div>
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="py-64 text-center">
         <div className="mobile-wrapper space-y-12">
            <h2 className="heading-huge italic">YOUR LEGACY DESERVES <br/> A BETTER SYSTEM.</h2>
            <Button onClick={() => onEnter(false)} className="h-24 px-20 text-xs tracking-[0.5em] bg-white text-black hover:bg-accent font-black">Initialize Interface</Button>
         </div>
      </section>

      {/* 10. Footer */}
      <footer className="py-24 border-t border-white/5 text-center">
         <span className="font-serif text-5xl text-accent italic mb-12 block">Ca</span>
         <div className="flex justify-center gap-12 text-[10px] font-black uppercase tracking-[0.5em] text-textTertiary">
            <button onClick={() => navigate('/resources')} className="hover:text-accent transition-colors">Resources</button>
            <button onClick={() => navigate('/privacy')} className="hover:text-accent transition-colors">Privacy</button>
            <button onClick={() => navigate('/terms')} className="hover:text-accent transition-colors">Terms</button>
            <button onClick={() => navigate('/contact')} className="hover:text-accent transition-colors">Contact</button>
         </div>
         <p className="text-[8px] text-accent/30 font-black uppercase mt-12 tracking-widest">Version 0.5 BUILD // CineArch Systems</p>
      </footer>
    </div>
  );
};
