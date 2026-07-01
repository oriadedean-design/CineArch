
import React from 'react';
import { Heading, Text, Badge, Card } from '../components/ui';
import { Shield, Camera, Landmark, Eye, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const About = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-32 py-20 animate-in fade-in duration-1000 max-w-5xl mx-auto px-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white/40 hover:text-white transition-colors">
         <ArrowLeft size={16} /> Previous Scene
      </button>

      <header className="space-y-6">
        <Badge color="accent">Brand Charter</Badge>
        <h1 className="heading-huge text-white uppercase italic leading-none">Authority. <br/><span className="text-accent">Precision.</span></h1>
        <p className="text-2xl text-white/40 font-light italic leading-relaxed max-w-2xl">
          CineArch exists in the space between the camera lens and the archival vault. We build precision tools for the technical and creative backbone of the Canadian film industry.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-1">
        <Card className="p-16 border-white/5 space-y-8">
           <div className="w-12 h-12 bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Shield size={20} />
           </div>
           <h3 className="text-4xl font-serif italic text-white">Discretion.</h3>
           <p className="text-sm text-white/60 leading-relaxed font-light italic">
              Your professional coordinates are your own. We utilize client-side encryption and sovereign data protocols to ensure your deal memos and financial records remain private.
           </p>
        </Card>
        <Card className="p-16 border-white/5 space-y-8">
           <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
              <Camera size={20} />
           </div>
           <h3 className="text-4xl font-serif italic text-white">Cinema Native.</h3>
           <p className="text-sm text-white/60 leading-relaxed font-light italic">
              Everything we build respects the unit economics of set life. No rounded corners. No clutter. Just technical UI built for crew, by people who understand the gate.
           </p>
        </Card>
      </div>

      <section className="space-y-12 border-t border-white/10 pt-24">
         <div className="flex items-center gap-6">
            <Landmark className="text-accent" size={24} />
            <h2 className="text-5xl font-serif italic text-white uppercase tracking-tighter">The Legacy.</h2>
         </div>
         <div className="space-y-8 text-xl text-white/40 font-light italic leading-relaxed">
            <p>CineArch was conceived to bridge the gap between chaotic production schedules and the need for rigorous financial compliance. We recognize the nuanced boundaries between technical Locals—from the IATSE 873 hub in Toronto to the vast 634 jurisdiction in Northern Ontario.</p>
            <p>We are not just a logbook. We are a digital infrastructure designed to track your journey from permittee to full guild membership.</p>
         </div>
      </section>

      <footer className="text-center py-20 border-t border-white/5">
         <span className="font-serif italic text-5xl text-accent block mb-4">Ca</span>
         <p className="text-[10px] font-black uppercase tracking-[0.8em] text-white/20">Archival Systems // v 0.5 BUILD</p>
      </footer>
    </div>
  );
};
