
import React from 'react';
import { Heading, Text, Button, Card, Badge } from '../components/ui';
import { 
  Briefcase, 
  ArrowRight, 
  Shield, 
  Zap, 
  Target,
  Clapperboard,
  History,
  Info,
  Layers,
  Sparkles,
  Lock,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-accent selection:text-black font-sans">
      <main className="mobile-wrapper pt-12 pb-40 space-y-32">
        
        {/* Editorial Hero */}
        <header className="max-w-5xl space-y-12">
           <div className="space-y-6">
              <Badge color="accent" className="italic tracking-widest uppercase">The Vision</Badge>
              <h1 className="heading-huge uppercase tracking-tighter text-white leading-[0.85]">EDITORIAL-GRADE <br/><span className="text-accent">INFRASTRUCTURE.</span></h1>
           </div>
           <p className="text-3xl font-serif italic text-white/40 leading-relaxed max-w-3xl">
              CineArch is a Cinematic ERP platform that centralizes the fragmented professional lives of film crew, performers, and agents in Canada.
           </p>
        </header>

        {/* The Core Mission Sections */}
        <div className="grid lg:grid-cols-2 gap-24 items-start">
           <div className="space-y-16">
              <section className="space-y-8 border-l border-white/10 pl-12">
                 <h2 className="text-5xl font-serif italic text-white uppercase tracking-tight">The Problem: <br/><span className="text-white/20">The Professional Wrap</span></h2>
                 <p className="text-lg text-white/40 leading-relaxed italic font-light">
                    Freelance film workers in Canada operate in a high-complexity, high-chaos environment where documentation is fragmented, union math is manual, and fiscal blindness leads to massive GST/HST penalties.
                 </p>
                 <div className="grid grid-cols-1 gap-4 pt-6">
                    {[
                       "Pay stubs and residency proofs scattered in emails.",
                       "Manual calculations for IATSE, ACTRA, or DGC status.",
                       "Small Supplier threshold ignorance ($30k risk).",
                       "Commission and union dues friction."
                    ].map((point, i) => (
                       <div key={i} className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-white/30">
                          <div className="w-1.5 h-1.5 bg-accent/40"></div>
                          {point}
                       </div>
                    ))}
                 </div>
              </section>

              <section className="space-y-8 border-l border-accent/20 pl-12">
                 <h2 className="text-5xl font-serif italic text-white uppercase tracking-tight text-accent">The Goal: <br/>Choreographing the Chaos</h2>
                 <p className="text-lg text-white/60 leading-relaxed italic font-light">
                    We turn "Administrative Overhead" into "Archival Security." Every minute worked is captured, every dollar billed is compliant, and every step toward union membership is automated.
                 </p>
              </section>
           </div>

           <Card className="p-16 border-accent/20 bg-accent/5 space-y-12 relative overflow-hidden">
              <Sparkles size={120} className="absolute -top-12 -right-12 text-accent/10 rotate-12" />
              <div className="space-y-6 relative z-10">
                 <Badge color="accent" className="font-black italic">The Elevator Pitch</Badge>
                 <h3 className="text-5xl font-serif italic text-white leading-tight uppercase tracking-tighter">Your legacy <br/>structured as <br/>your craft.</h3>
                 <p className="text-xl text-white/60 leading-relaxed italic font-light">
                    "You didn't join the film industry to manage spreadsheets. CineArch is the first architectural-grade platform designed to navigate the professional complexities of a Canadian film career. From 'Roll Camera' to 'Audit Season,' we ensure your record is as structured as your craft."
                 </p>
              </div>
              <div className="pt-8 relative z-10">
                 <Button onClick={() => navigate('/auth')} className="h-20 px-12 text-[11px] font-black tracking-[0.6em] accent-glow uppercase">Enter the System</Button>
              </div>
           </Card>
        </div>

        {/* Architecture of the Set */}
        <section className="space-y-24">
           <div className="text-center space-y-4">
              <h2 className="heading-huge uppercase tracking-tighter text-white">ARCHITECTURE OF THE SET.</h2>
              <p className="text-[11px] font-black uppercase tracking-[0.8em] text-accent italic">Design Principles</p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-1">
              {[
                { 
                  icon: Layers, 
                  title: "Cinematic ERP", 
                  desc: "Enterprise Resource Planning built for the specific pressure of a 14-hour production day." 
                },
                { 
                  icon: History, 
                  title: "Continuity First", 
                  desc: "The second log is always easier than the first. We remember your history so you don't have to." 
                },
                { 
                  icon: Shield, 
                  title: "Data Sanctuary", 
                  desc: "Professional records secured by zero-exploitation protocols and radical transparency." 
                }
              ].map((m, i) => (
                 <div key={i} className="p-16 glass-ui border-white/5 space-y-8 group hover:border-accent/40 transition-all">
                    <m.icon size={32} className="text-accent/30 group-hover:text-accent transition-colors" strokeWidth={1} />
                    <div className="space-y-4">
                       <h4 className="text-[11px] font-black uppercase tracking-widest text-white italic">{m.title}</h4>
                       <p className="text-sm text-white/40 leading-relaxed font-light italic">{m.desc}</p>
                    </div>
                 </div>
              ))}
           </div>
        </section>

        {/* Final Bridge */}
        <div className="py-24 border-y border-white/5 flex flex-col md:flex-row justify-between items-center gap-16">
           <div className="space-y-4 text-center md:text-left">
              <h3 className="text-4xl font-serif italic text-white uppercase tracking-tight">Ready to mark the slate?</h3>
              <p className="text-[11px] font-black uppercase tracking-widest text-white/30 italic">Initialize your professional continuity record today.</p>
           </div>
           <div className="flex flex-col sm:flex-row gap-6">
              <Button onClick={() => navigate('/auth')} className="h-16 px-12 text-[10px] tracking-[0.4em] font-black uppercase">Mark a day</Button>
              <Button variant="outline" onClick={() => navigate('/resources')} className="h-16 px-10 text-[10px] tracking-[0.3em] font-black uppercase italic">Browse Library</Button>
           </div>
        </div>

      </main>
    </div>
  );
};
