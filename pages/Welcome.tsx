
import React, { useState } from 'react';
import { Heading, Text, Button, Card, Badge, Input, Select } from '../components/ui';
import { 
  ArrowRight, 
  ChevronDown, 
  Target, 
  CheckCircle,
  Briefcase,
  User,
  Users,
  GraduationCap,
  Plus,
  Sparkles,
  Menu,
  X,
  Mail,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PLANS, UNIONS } from '../types';
import { clsx } from 'clsx';
import { api } from '../services/storage';

type Segment = 'CREW' | 'TALENT' | 'AGENTS' | 'ORG';

const PathSelectorModal = ({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (asAgent: boolean) => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
      <div className="w-full max-w-2xl glass-ui p-12 space-y-12 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <Badge color="accent" className="italic tracking-[0.5em] uppercase">Set Protocol</Badge>
            <h2 className="text-5xl font-serif italic text-white uppercase tracking-tighter">Choose your Path.</h2>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <button 
            onClick={() => onSelect(false)}
            className="p-12 border border-white/10 hover:border-accent hover:bg-accent/5 transition-all text-left space-y-8 group"
          >
            <User size={40} strokeWidth={1} className="text-white/40 group-hover:text-accent" />
            <div className="space-y-3">
              <h3 className="text-3xl font-serif italic text-white uppercase tracking-tight">Solo Profile</h3>
              <p className="text-sm text-white/40 font-light italic leading-relaxed">For you if you're managing an independent career as crew or talent.</p>
            </div>
          </button>
          <button 
            onClick={() => onSelect(true)}
            className="p-12 border border-white/10 hover:border-accent hover:bg-accent/5 transition-all text-left space-y-8 group"
          >
            <Users size={40} strokeWidth={1} className="text-white/40 group-hover:text-accent" />
            <div className="space-y-3">
              <h3 className="text-3xl font-serif italic text-white uppercase tracking-tight">Agency Command</h3>
              <p className="text-sm text-white/40 font-light italic leading-relaxed">For you if you're managing a roster of professional talent.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

const FAQ_DATA = [
  { q: "How does union tracking work?", a: "CineArch maps your logged hours and credits against the specific eligibility tiers of Canadian guilds like IATSE, DGC, and ACTRA automatically." },
  { q: "Is my financial data secure?", a: "Yes. Your earnings and stubs are for your eyes (and your agent's, if you permit it) only. We never sell your data." },
  { q: "What is the 'Small Supplier' threshold?", a: "In Canada, once you bill $30,000 in a year, you must register for GST/HST. CineArch helps you monitor this to avoid penalties." },
  { q: "Can I manage a roster of clients?", a: "Yes. The 'Showrunner' plan is designed for agents to oversee up to 35 professional talent profiles from one command center." }
];

export const Welcome = ({ onEnter }: { onEnter: (asAgent?: boolean) => void }) => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeSegment, setActiveSegment] = useState<Segment>('CREW');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPathModalOpen, setIsPathModalOpen] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // Hero Log Form State
  const [firstLog, setFirstLog] = useState({
    productionName: '',
    grossEarnings: '',
    unionTypeId: '',
    role: ''
  });

  const handleMailingListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValue) return;
    setEmailStatus('loading');
    setTimeout(() => {
      setEmailStatus('success');
      setEmailValue('');
    }, 1500);
  };

  const handleFirstLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    api.jobs.setPending({
      productionName: firstLog.productionName,
      grossEarnings: parseFloat(firstLog.grossEarnings) || 0,
      unionTypeId: firstLog.unionTypeId,
      role: firstLog.role,
      startDate: new Date().toISOString().split('T')[0],
      isUnion: !!firstLog.unionTypeId,
      unionName: firstLog.unionTypeId ? UNIONS.find(u => u.id === firstLog.unionTypeId)?.name : undefined
    });
    navigate('/auth');
  };

  const segments = {
    CREW: {
      label: "Crew",
      icon: Briefcase,
      hero: "Capture your days. Lock your hours.",
      sub: "Built for crew who move fast. CineArch remembers your show metadata so you can mark the slate and get back to the frame.",
      cta: "Log your first day",
      onSelect: () => navigate('/auth'),
      features: [
        { title: "One-Tap Dailies", desc: "Log your hours, production title, and role in seconds." },
        { title: "Eligibility Engine", desc: "Automatic calculation of IATSE/DGC permit and membership hours." }
      ]
    },
    TALENT: {
      label: "Talent",
      icon: User,
      hero: "Verify your bookings. Track your credits.",
      sub: "Our record treats your 'Booking' as the unit of truth, syncing your contract details and residency requirements.",
      cta: "Mark a booking",
      onSelect: () => navigate('/auth'),
      features: [
        { title: "Credit Registry", desc: "Build a persistent record of your principal and background credits." },
        { title: "Booking History", desc: "Sync contract details across multiple agencies effortlessly." }
      ]
    },
    AGENTS: {
      label: "Reps and Agents",
      icon: Users,
      hero: "Monitor the roster. Manage the seats.",
      sub: "Oversee a roster of up to 35 clients. Track their union progress and financial health in a high-fidelity dashboard.",
      cta: "Open the Roster",
      onSelect: () => { onEnter(true); navigate('/auth'); },
      features: [
        { title: "Roster Command", desc: "Monitor the professional health of your entire roster from one screen." },
        { title: "Compliance Audit", desc: "Identify clients nearing union thresholds or GST registration." }
      ]
    },
    ORG: {
      label: "Organizations",
      icon: GraduationCap,
      hero: "Sync your cohorts. Standardize continuity.",
      sub: "Maintain structured work records for emerging talent to ensure every hour of training is secured.",
      cta: "Secure Cohort Record",
      onSelect: () => { onEnter(true); navigate('/auth'); },
      features: [
        { title: "Cohort Tracking", desc: "Standardize career logging for your entire graduating class." },
        { title: "Placement Data", desc: "Aggregated analytics on where and how often your students are working." }
      ]
    }
  };

  const current = segments[activeSegment];

  return (
    <div className="relative min-h-screen font-sans text-textPrimary overflow-x-hidden bg-black">
      
      <PathSelectorModal 
        isOpen={isPathModalOpen} 
        onClose={() => setIsPathModalOpen(false)}
        onSelect={(asAgent) => {
          setIsPathModalOpen(false);
          onEnter(asAgent);
          navigate('/auth');
        }}
      />

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-[110] h-20 md:h-24 px-6 md:px-12 flex items-center justify-between glass-ui pointer-events-auto border-b border-white/5">
        <div 
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <span className="font-serif italic text-2xl md:text-3xl text-white group-hover:text-accent transition-colors">CineArch</span>
        </div>
        
        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-12">
          <button onClick={() => navigate('/about')} className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 hover:text-white hover:underline transition-all">The Vision</button>
          <button onClick={() => document.getElementById('audiences')?.scrollIntoView({ behavior: 'smooth' })} className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 hover:text-white hover:underline transition-all">Every Craft</button>
          <button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 hover:text-white hover:underline transition-all">FAQ</button>
          <button onClick={() => navigate('/auth')} className="text-[11px] font-black uppercase tracking-[0.4em] text-white hover:text-accent hover:underline transition-all border-l border-white/10 pl-12">Sign In</button>
        </div>

        {/* Mobile Nav Toggle */}
        <div className="lg:hidden flex items-center gap-4">
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-white hover:text-accent transition-colors">
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
           </button>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <Button onClick={() => setIsPathModalOpen(true)} className="h-12 px-8 text-[11px] tracking-[0.3em] font-black uppercase">Start Project</Button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[105] bg-black/95 backdrop-blur-xl pt-32 px-10 flex flex-col gap-12 animate-in fade-in slide-in-from-top-4 duration-300">
          <button onClick={() => { setIsMobileMenuOpen(false); navigate('/about'); }} className="text-4xl font-serif italic text-left text-white uppercase tracking-tighter hover:text-accent">The Vision</button>
          <button onClick={() => { setIsMobileMenuOpen(false); document.getElementById('audiences')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-4xl font-serif italic text-left text-white uppercase tracking-tighter hover:text-accent">Every Craft</button>
          <button onClick={() => { setIsMobileMenuOpen(false); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-4xl font-serif italic text-left text-white uppercase tracking-tighter hover:text-accent">FAQ</button>
          <button onClick={() => { setIsMobileMenuOpen(false); navigate('/auth'); }} className="text-4xl font-serif italic text-left text-accent uppercase tracking-tighter">Sign In</button>
        </div>
      )}

      {/* 1. HERO - Quick Mark Flow */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-6 md:px-12 pt-32 lg:pt-24 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[url('https://i.pinimg.com/1200x/f8/ae/1d/f8ae1d1629a7c473761391eb308986dd.jpg')] bg-cover bg-center grayscale blur-2xl"></div>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
           <div className="space-y-12 text-center lg:text-left">
              <div className="space-y-6">
                <span className="text-accent text-[12px] font-black uppercase tracking-[0.8em] block italic">Professional Productivity</span>
                <h1 className="heading-huge text-white uppercase tracking-tighter leading-[0.8]">YOUR RECORD <br/>AS STRUCTURED <br/>AS <span className="text-accent">YOUR CRAFT.</span></h1>
              </div>
              <p className="text-2xl md:text-3xl font-serif italic text-white/40 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                The only editorial-grade platform built to help you track union eligibility and earnings in the Canadian film industry.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8 opacity-40">
                 <div className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">IATSE Ready</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">DGC Compliant</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">ACTRA Verified</span>
                 </div>
              </div>
           </div>

           {/* LOG FIRST FORM */}
           <div className="w-full">
              <Card className="p-10 md:p-12 border-accent/20 bg-accent/5 backdrop-blur-md accent-glow space-y-8">
                 <div className="space-y-2">
                    <Badge color="accent" className="italic tracking-widest font-black">Quick Mark</Badge>
                    <h2 className="text-3xl font-serif italic text-white uppercase">Log your first day.</h2>
                    <p className="text-sm text-white/40 italic">We'll save this record to your profile in the next step.</p>
                 </div>

                 <form onSubmit={handleFirstLogSubmit} className="space-y-6">
                    <div className="space-y-4">
                       <Input 
                          placeholder="PRODUCTION TITLE"
                          required
                          value={firstLog.productionName}
                          onChange={e => setFirstLog({...firstLog, productionName: e.target.value})}
                       />
                       <div className="grid grid-cols-2 gap-4">
                          <Input 
                             placeholder="EST. GROSS ($)"
                             type="number"
                             required
                             value={firstLog.grossEarnings}
                             onChange={e => setFirstLog({...firstLog, grossEarnings: e.target.value})}
                          />
                          <Select 
                             required
                             value={firstLog.unionTypeId}
                             onChange={e => setFirstLog({...firstLog, unionTypeId: e.target.value})}
                          >
                             <option value="" className="bg-black text-white/30 italic">UNION / INDIE</option>
                             {UNIONS.map(u => <option key={u.id} value={u.id} className="bg-black">{u.name}</option>)}
                             <option value="none" className="bg-black">Non-Union / Indie</option>
                          </Select>
                       </div>
                       <Input 
                          placeholder="YOUR ROLE (E.G. 1ST AC)"
                          required
                          value={firstLog.role}
                          onChange={e => setFirstLog({...firstLog, role: e.target.value})}
                       />
                    </div>
                    <Button type="submit" className="w-full h-20 text-[11px] font-black uppercase tracking-[0.6em] group">
                       Secure this log <ArrowUpRight className="ml-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={16} />
                    </Button>
                 </form>
              </Card>
           </div>
        </div>
      </section>

      {/* 2. THE PROBLEM */}
      <section className="py-40 bg-black border-y border-white/5">
        <div className="mobile-wrapper grid lg:grid-cols-2 gap-32 items-center">
          <div className="space-y-12">
            <Badge color="accent" className="italic tracking-widest uppercase">The Reality</Badge>
            <h2 className="heading-huge leading-[0.85] uppercase tracking-tighter text-white">LOSE THE <br/><span className="text-white/20">PAPERWORK.</span></h2>
            <p className="text-3xl text-white/40 font-serif italic leading-relaxed">Freelance film workers in Canada operate in a high-complexity environment. Managing your data shouldn't be another full-time job.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {[
               { title: "Fragmented Data", desc: "Keep your pay stubs and memos in one place, not scattered across folders." },
               { title: "Union Math", desc: "Automated tracking for your hours so you always know where you stand." },
               { title: "Threshold Monitoring", desc: "We help you stay ahead of the $30k GST/HST registration point." },
               { title: "Commission Logic", desc: "Quickly see your net earnings after agent fees and dues." }
             ].map((item, i) => (
               <Card key={i} className="p-10 border-white/5 bg-surface/40 hover:border-accent/40 transition-all group">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-accent mb-6 italic group-hover:translate-x-2 transition-transform">{item.title}</h4>
                  <p className="text-sm text-white/60 leading-relaxed font-light italic">{item.desc}</p>
               </Card>
             ))}
          </div>
        </div>
      </section>

      {/* 3. BREATHE SECTION (Reassurance) */}
      <section className="py-40 bg-surface/20 border-b border-white/5 overflow-hidden">
        <div className="mobile-wrapper max-w-5xl text-center space-y-12 relative">
           <div className="space-y-6">
              <span className="text-[12px] font-black uppercase tracking-[0.8em] text-accent italic">A Better Way</span>
              <h2 className="font-serif italic text-7xl md:text-8xl text-white leading-none uppercase tracking-tighter">Breathe.</h2>
           </div>
           
           <p className="text-3xl md:text-4xl text-white/80 leading-relaxed font-light italic max-w-4xl mx-auto">
              Those frustrating days are over. CineArch ensures that every minute you worked on set is captured and usable. We help you stay on top of your union hours and earnings without the typical administrative headache.
           </p>

           <div className="pt-12 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="p-12 glass-ui border-white/5 space-y-6 group hover:border-white/20 transition-colors">
                 <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-white italic group-hover:text-accent transition-colors">Usable History</h4>
                 <p className="text-sm text-white/60 leading-relaxed italic">We remember your show and role history, making your next log twice as fast.</p>
              </div>
              <div className="p-12 glass-ui border-white/5 space-y-6 group hover:border-white/20 transition-colors">
                 <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-white italic group-hover:text-accent transition-colors">One Source of Truth</h4>
                 <p className="text-sm text-white/60 leading-relaxed italic">A persistent professional record that follows you from set to set, regardless of the agency.</p>
              </div>
           </div>
        </div>
      </section>

      {/* 4. EVERY CRAFT */}
      <section id="audiences" className="py-60 px-6 md:px-12 bg-black relative">
        <div className="max-w-7xl mx-auto space-y-32">
          
          <div className="text-center space-y-6">
             <h2 className="heading-huge text-white uppercase tracking-tighter leading-none">EVERY CRAFT.</h2>
             <p className="text-[12px] font-black uppercase tracking-[0.6em] text-accent italic">How do you mark the slate?</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 border border-white/5 bg-white/5">
            {(Object.keys(segments) as Segment[]).map((key) => {
              const S = segments[key];
              const Icon = S.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSegment(key)}
                  className={clsx(
                    "flex flex-col items-center justify-center p-12 gap-8 transition-all duration-500 min-h-[220px] focus:outline-none focus:ring-2 focus:ring-accent",
                    activeSegment === key ? "bg-accent text-black" : "text-white/20 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon size={32} strokeWidth={activeSegment === key ? 3 : 1} />
                  <span className="text-[11px] font-black uppercase tracking-[0.5em]">{S.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-12 gap-20 items-start py-12 animate-in fade-in duration-700">
             <div className="lg:col-span-7 space-y-16">
                <div className="space-y-6">
                   <Badge color="accent" className="font-black italic tracking-widest uppercase">{activeSegment} Workflow</Badge>
                   <h3 className="text-7xl md:text-8xl font-serif italic text-white tracking-tighter leading-[0.8]">{current.hero}</h3>
                </div>
                <p className="text-2xl md:text-4xl font-serif italic text-white/40 leading-relaxed max-w-3xl">{current.sub}</p>
                <div className="pt-12">
                   <Button onClick={current.onSelect} className="h-24 px-20 text-[13px] font-black tracking-[0.6em] accent-glow uppercase">Start Your Log</Button>
                </div>
             </div>

             <div className="lg:col-span-5 space-y-4">
                {current.features.map((f, i) => (
                   <div key={i} className="p-12 glass-ui border-white/5 space-y-8 group hover:border-accent/40 transition-all duration-500">
                      <div className="flex items-center gap-6">
                         <CheckCircle size={20} className="text-accent/30 group-hover:text-accent transition-colors" />
                         <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-white italic">{f.title}</h4>
                      </div>
                      <p className="text-base text-white/60 leading-relaxed font-light italic pl-10">{f.desc}</p>
                   </div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING */}
      <section className="py-40">
        <div className="mobile-wrapper space-y-40">
          <div className="text-center space-y-6">
            <h2 className="heading-huge text-white uppercase tracking-tighter">CHOOSE YOUR <br/><span className="text-accent">VOLUME.</span></h2>
            <p className="text-white/30 font-black uppercase tracking-[0.6em] text-[12px] italic">Flexible plans for your career stage</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-1">
            {Object.values(PLANS).map((plan) => (
               <div 
                 key={plan.id} 
                 onClick={() => navigate('/auth')}
                 className={clsx(
                   "p-16 border flex flex-col transition-all duration-700 h-full relative group cursor-pointer", 
                   plan.id === 'pro' 
                    ? "border-accent bg-accent/[0.03] z-10 lg:scale-105" 
                    : "bg-black/40 border-white/5 hover:border-accent/20 hover:bg-accent/[0.01]"
                 )}
               >
                 {plan.id === 'pro' && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                       <Badge color="accent" className="px-10 py-3 text-[11px] font-black italic">Recommended</Badge>
                    </div>
                 )}
                 <h3 className="text-5xl font-serif italic text-white mb-6 uppercase tracking-tight">{plan.label}</h3>
                 <div className="mb-20">
                    <div className="text-8xl font-serif text-white italic tracking-tighter leading-none">
                      <span>{plan.price}</span>
                      {plan.price !== 'Free' && <span className="text-sm font-sans text-white/40 ml-4 not-italic uppercase tracking-widest">/mo</span>}
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/30 mt-8 italic">{plan.desc}</p>
                 </div>
                 <ul className="space-y-8 mb-24 flex-1 border-t border-white/10 pt-16">
                    {plan.id === 'pro' && (
                      <li className="text-[11px] font-black uppercase tracking-widest text-accent italic mb-4">Everything in Indie Log, plus:</li>
                    )}
                    {plan.id === 'agency' && (
                      <li className="text-[11px] font-black uppercase tracking-widest text-accent italic mb-4">Everything in A-List, plus:</li>
                    )}
                    {plan.benefits.map((benefit, j) => (
                      <li key={j} className="flex items-start gap-6 text-[13px] font-medium text-white/80 uppercase tracking-widest leading-relaxed">
                        <Plus size={18} className="text-accent mt-0.5 shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                 </ul>
                 <Button className={clsx("w-full h-24 text-[12px] tracking-[0.6em] font-black uppercase", plan.id === 'pro' ? "bg-accent text-black" : "bg-white/10 text-white hover:bg-white hover:text-black")}>
                   Get Started
                 </Button>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* 6. MAILING LIST */}
      <section className="py-60 bg-surface/30 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-accent/5 blur-[120px] rounded-full scale-150 -z-10"></div>
        <div className="mobile-wrapper max-w-4xl text-center space-y-20">
          <div className="space-y-8">
            <Badge color="accent" className="italic tracking-[0.5em] uppercase">Industry Update</Badge>
            <h2 className="heading-huge uppercase tracking-tighter text-white leading-none">THE INSIDE <br/><span className="text-accent">TRACK.</span></h2>
            <p className="text-3xl text-white/40 font-serif italic leading-relaxed max-w-2xl mx-auto">
              Be the first to know about industry shifts in union compliance and operational updates.
            </p>
          </div>

          <form onSubmit={handleMailingListSubmit} className="max-w-2xl mx-auto">
             {emailStatus === 'success' ? (
               <div className="glass-ui p-16 space-y-8 animate-in zoom-in-95 duration-500 border-accent/40 shadow-2xl">
                 <CheckCircle className="text-accent mx-auto" size={64} />
                 <div className="space-y-3">
                   <h3 className="text-4xl font-serif italic text-white uppercase tracking-tight">Access Logged.</h3>
                   <p className="text-sm text-white/60 italic font-light uppercase tracking-widest">You are now registered for CineArch updates.</p>
                 </div>
               </div>
             ) : (
               <div className="flex flex-col md:flex-row gap-4 h-auto">
                  <div className="relative w-full">
                    <Mail className="absolute left-8 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                    <Input 
                      required
                      type="email"
                      value={emailValue}
                      onChange={(e) => setEmailValue(e.target.value)}
                      placeholder="ENTER PRODUCTION EMAIL"
                      className="h-20 pl-20 w-full"
                    />
                  </div>
                  <Button 
                    type="submit"
                    isLoading={emailStatus === 'loading'}
                    className="h-20 px-12 w-full md:w-auto bg-accent text-black font-black uppercase tracking-[0.4em] shadow-2xl"
                  >
                    Subscribe
                  </Button>
               </div>
             )}
             <p className="text-[10px] text-white/10 uppercase tracking-[0.6em] font-black mt-12 italic">Professional Updates Only // Secure Transmission</p>
          </form>
        </div>
      </section>

      {/* 7. FAQ */}
      <section id="faq" className="py-40 bg-black">
        <div className="mobile-wrapper max-w-5xl mx-auto space-y-32">
          <div className="text-center space-y-6">
            <h2 className="heading-huge text-white uppercase tracking-tighter">KNOWLEDGE BASE.</h2>
            <p className="text-white/40 font-black uppercase tracking-[0.6em] text-[12px] italic">The Mechanics</p>
          </div>
          <div className="space-y-1">
            {FAQ_DATA.map((faq, i) => (
              <div 
                key={i} 
                className={clsx(
                  "border transition-all duration-500 overflow-hidden",
                  openFaq === i ? "border-accent/40 bg-accent/5" : "border-white/5 hover:border-white/20"
                )}
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-12 flex justify-between items-center group focus:outline-none focus:bg-accent/5"
                >
                  <span className="font-serif text-3xl md:text-4xl text-white italic transition-colors group-hover:text-accent tracking-tight">{faq.q}</span>
                  <ChevronDown className={clsx("text-white/20 transition-transform duration-500", openFaq === i && "rotate-180 text-accent")} size={24} />
                </button>
                <div 
                  className={clsx(
                    "transition-all duration-500 ease-in-out px-12",
                    openFaq === i ? "max-h-96 pb-12 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <p className="text-white/60 text-2xl font-light leading-relaxed max-w-4xl italic border-l border-accent/20 pl-10">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-40 border-t border-white/5 bg-black">
        <div className="mobile-wrapper flex flex-col md:flex-row justify-between items-center gap-24">
          <div className="flex flex-col items-center md:items-start gap-8">
             <span className="font-serif text-8xl text-accent italic leading-none hover:scale-105 transition-transform cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>Ca</span>
             <div className="space-y-1 text-center md:text-left">
               <p className="text-[11px] text-accent/30 font-black uppercase tracking-[0.6em] italic underline">CINEARCH SYSTEMS // CANADA</p>
               <p className="text-[9px] text-white/10 font-black uppercase tracking-widest italic opacity-20">Editorial Grade Infrastructure v0.5</p>
             </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-20 text-[12px] font-black uppercase tracking-[0.6em] text-white/20">
             <button onClick={() => navigate('/about')} className="hover:text-white hover:underline transition-all">About Us</button>
             <button onClick={() => navigate('/resources')} className="hover:text-accent hover:underline transition-all">The Library</button>
             <button onClick={() => navigate('/privacy')} className="hover:text-accent hover:underline transition-all">Privacy</button>
             <button className="hover:text-accent hover:underline transition-all">Terms</button>
             <button className="hover:text-accent hover:underline transition-all">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
