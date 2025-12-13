
import React, { useState, useEffect } from 'react';
import { Heading, Text, Button, Card, Badge } from '../components/ui';
import { ArrowRight, Shield, Layers, Feather, CheckCircle, Briefcase, Star, Users, Zap, Plus, LayoutDashboard } from 'lucide-react';

interface WelcomeProps {
  onEnter: (asAgent?: boolean) => void;
  isLoggedIn?: boolean;
}

// Cinematic Asset Collection
const HERO_IMAGES = [
  "https://i.pinimg.com/1200x/ae/44/57/ae44577cea516ae481d7babcb3747cb8.jpg", // Dark moody set
  "https://i.pinimg.com/1200x/7a/a2/2a/7aa22a1073d2365b5a78f9de60682e1e.jpg", // Cinematic lighting
  "https://i.pinimg.com/736x/09/a1/70/09a17076e25094febd49bdef18019c75.jpg", // Vintage noir
  "https://i.pinimg.com/1200x/47/26/5b/47265b869ab688c4220f4800fb442dbf.jpg", // Dramatic silhouette
];

const LOGOS = [
  { name: "ACTRA", src: "https://actratoronto.com/wp-content/uploads/2024/10/ACTRA-TORONTO-LOGO_OUTLINED_WHITE-ON-BLACK_3840X2160_100224.png", invert: true },
  { name: "DGC", src: "https://www.reelasian.com/wp-content/uploads/2021/10/DGC-National-logo.png", invert: false },
  { name: "IATSE 873", src: "https://prideatwork.ca/wp-content/uploads/2024/10/IATSE-logo-450x207.png", invert: false },
  { name: "WGC", src: "https://www.wgc.ca/sites/default/files/styles/news_hero/public/article/WGC%20logo_stacked_col_1.png?itok=MKWXceDc", invert: false },
  { name: "CMPA", src: "https://cmpa.ca/wp-content/uploads/2023/11/CMPA-logo-colour-for-light-background.png", invert: false },
];

export const Welcome = ({ onEnter, isLoggedIn = false }: WelcomeProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Background Slider Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000); // Change image every 6 seconds
    return () => clearInterval(interval);
  }, []);

  // Scroll Listener for Navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F3F1] overflow-x-hidden selection:bg-[#C73E1D] selection:text-white">
      
      {/* --- Navigation --- */}
      <nav className={`fixed top-0 left-0 right-0 p-6 md:p-8 flex justify-between items-center z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4 text-[#121212]' : 'bg-transparent text-white'}`}>
        <span 
          className="font-serif text-2xl tracking-tight relative z-50 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          CineArch
        </span>
        <div className="flex gap-4 relative z-50">
          {!isLoggedIn ? (
            <>
              <button
                onClick={() => onEnter(true)}
                className={`text-xs uppercase tracking-widest font-medium hover:opacity-70 transition-opacity px-4 py-3 flex items-center gap-2 ${scrolled ? 'text-[#121212]' : 'text-white'}`}
              >
                <Briefcase className="w-3 h-3" />
                Agency Portal
              </button>
              <button
                onClick={() => onEnter(false)}
                className={`text-xs uppercase tracking-widest font-medium hover:opacity-70 transition-opacity border px-6 py-3 ${scrolled ? 'border-[#121212]' : 'border-white'}`}
              >
                Member Sign In
              </button>
            </>
          ) : (
            <button
              onClick={() => onEnter(false)}
              className={`text-xs uppercase tracking-widest font-medium hover:opacity-70 transition-opacity border px-6 py-3 flex items-center gap-2 ${scrolled ? 'border-[#121212] text-[#121212]' : 'border-white text-white'}`}
            >
              <LayoutDashboard className="w-3 h-3" />
              Go to Dashboard
            </button>
          )}
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative h-screen min-h-[800px] flex flex-col justify-end pb-32 px-6 md:px-12 overflow-hidden">
        {/* Background Slider */}
        {HERO_IMAGES.map((img, index) => (
          <div 
            key={img}
            className={`absolute inset-0 z-0 transition-opacity duration-[2000ms] ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <img 
              src={img} 
              alt="Cinematic atmosphere" 
              className="w-full h-full object-cover transform scale-105 animate-[subtle-zoom_20s_infinite_alternate]"
            />
            {/* Gradient Overlay for Text Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent" />
            <div className="absolute inset-0 bg-black/20" /> 
          </div>
        ))}

        <div className="relative z-10 max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-[1px] bg-[#C73E1D]"></div>
            <span className="text-white/90 text-xs uppercase tracking-[0.25em] font-medium">Professional Interface v2.0</span>
          </div>
          
          <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl text-[#F3F3F1] leading-[0.9] mb-8 tracking-tight drop-shadow-2xl">
            The Industry<br />
            <span className="italic text-white/60">Interface.</span>
          </h1>
          
          <div className="max-w-xl mb-12">
            <p className="text-lg md:text-xl text-white/80 font-light leading-relaxed drop-shadow-md">
              The unified operating system designed for the film workforce. Manage your union eligibility, forecast your dues, and secure your financial future.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            <Button 
              onClick={() => onEnter(false)} 
              className="bg-white text-[#121212] hover:bg-[#F3F3F1] hover:scale-105 transform transition-all duration-300 border-none px-10 py-5 text-sm tracking-widest uppercase h-auto shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
            >
              {isLoggedIn ? 'Resume Session' : 'And Action'} <ArrowRight className="w-4 h-4 ml-3" />
            </Button>
            {!isLoggedIn && (
              <Button 
                onClick={() => onEnter(true)}
                className="bg-[#121212] text-white hover:bg-neutral-900 border border-white/20 px-10 py-5 text-sm tracking-widest uppercase h-auto"
              >
                Manager Login
              </Button>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 animate-bounce">
          <span className="text-[10px] uppercase tracking-widest text-white">Scroll</span>
          <div className="w-[1px] h-12 bg-white"></div>
        </div>
      </section>

      {/* --- Trust / Union Section --- */}
      <section className="bg-white py-20 border-b border-neutral-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
           <Text variant="caption" className="text-center mb-12 block opacity-50">Authorized Compliance Architecture For</Text>
           
           <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
             {LOGOS.map(logo => (
               <img 
                key={logo.name} 
                src={logo.src} 
                alt={logo.name} 
                className={`h-12 md:h-16 object-contain transition-all duration-500 ${logo.invert ? 'invert' : ''}`} 
               />
             ))}
             <span className="font-serif text-2xl text-neutral-400 italic px-4">...and more</span>
           </div>
        </div>
      </section>

      {/* --- Narrative / Empathy Section --- */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <div className="space-y-10 order-2 md:order-1">
            <Heading level={2} className="text-4xl md:text-6xl leading-[1.1]">
              Human error is a wrap.
            </Heading>
            <div className="w-24 h-1 bg-[#C73E1D]"></div>
            <Text className="text-xl leading-relaxed text-neutral-600 font-light">
              You didn't join this industry to manage spreadsheets or calculate fringe rates. You are here to tell stories.
              <br /><br />
              CineArch replaces the anxiety of "Did I qualify?" with the clarity of "I am ready." We account for all roles, all departments, and all possibilities.
            </Text>

            <div className="space-y-4 pt-4">
              {[
                "Automated Dues Calculation",
                "Tentative Booking Forecasts",
                "Instant Manager Dispatch"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-neutral-800">
                  <CheckCircle className="w-5 h-5 text-[#C73E1D]" />
                  <span className="font-medium tracking-wide">{item}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative order-1 md:order-2 group">
            <div className="aspect-[4/5] overflow-hidden rounded-sm editorial-shadow relative">
              <img 
                src="https://i.pinimg.com/1200x/58/b6/c5/58b6c5d54db46b51cdb52e6ba6c224bf.jpg" 
                alt="Editorial portrait" 
                className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-neutral-900/10 group-hover:bg-transparent transition-colors duration-700"></div>
            </div>
            
            {/* Floating Card Element */}
            <div className="absolute -bottom-12 -left-8 bg-[#F3F3F1] p-8 max-w-xs editorial-shadow border border-neutral-200 hidden md:block animate-in slide-in-from-bottom-4 duration-1000 delay-300">
              <span className="text-xs uppercase tracking-widest text-[#C73E1D] mb-3 block font-bold">Eligibility Status</span>
              <div className="font-serif text-3xl mb-1 text-[#121212]">ACTRA Apprentice</div>
              <div className="w-full bg-neutral-200 h-1 mt-4 mb-2">
                <div className="w-[75%] bg-[#121212] h-full"></div>
              </div>
              <div className="text-[10px] text-neutral-400 text-right uppercase tracking-wider">1200 / 1600 HRS Logged</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Visual Break / Parallax --- */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden my-20">
         <div className="absolute inset-0 z-0">
           <img 
             src="https://i.pinimg.com/736x/ec/ce/3d/ecce3db3321f4ee53f84df17c78bdb93.jpg" 
             className="w-full h-full object-cover opacity-90 fixed-background" 
             alt="Set life"
           />
           <div className="absolute inset-0 bg-neutral-900/60" />
         </div>
         <div className="relative z-10 text-center text-white max-w-3xl px-6">
            <span className="block text-[#C73E1D] text-sm uppercase tracking-[0.3em] mb-6">The New Standard</span>
            <h2 className="font-serif text-5xl md:text-7xl leading-tight mb-8">
              "Finally, software that respects the hustle."
            </h2>
            <div className="w-16 h-16 rounded-full border border-white/30 flex items-center justify-center mx-auto backdrop-blur-sm">
               <Feather className="w-6 h-6" />
            </div>
         </div>
      </section>

      {/* --- Pricing / Access Tiers --- */}
      <section className="py-24 px-6 md:px-12 bg-[#F9F9F8]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
             <Text variant="caption" className="mb-4 text-[#C73E1D] font-bold">Access Levels</Text>
             <Heading level={2}>Choose Your Role</Heading>
             <Text className="mt-4 text-neutral-500">Professional tools for every stage of your career.</Text>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
             
             {/* Free Tier */}
             <div className="bg-white border border-neutral-200 p-8 hover:border-[#121212] transition-colors relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-neutral-200 group-hover:bg-[#121212] transition-colors"></div>
                <h3 className="font-serif text-3xl mb-2">Member</h3>
                <div className="flex items-baseline gap-1 mb-6">
                   <span className="text-4xl font-bold">Free</span>
                   <span className="text-neutral-400">/ forever</span>
                </div>
                <p className="text-sm text-neutral-500 mb-8 h-10">Essential tracking for aspiring talent and crew.</p>
                <ul className="space-y-4 mb-8 text-sm">
                   <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#121212]"/> <span>Basic Eligibility Tracking</span></li>
                   <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#121212]"/> <span>Limited Job Logging</span></li>
                   <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#121212]"/> <span>Standard PDF Exports</span></li>
                   <li className="flex items-center gap-3 text-neutral-400"><Shield className="w-4 h-4"/> <span>200MB Document Limit</span></li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => onEnter(false)}>{isLoggedIn ? 'Access' : 'Get Started'}</Button>
             </div>

             {/* Premium Tier */}
             <div className="bg-[#121212] text-white p-8 relative transform md:-translate-y-4 shadow-xl">
                <div className="absolute top-0 right-0 bg-[#C73E1D] text-white text-[10px] uppercase font-bold px-3 py-1 tracking-widest">Recommended</div>
                <h3 className="font-serif text-3xl mb-2">Pro Member</h3>
                <div className="flex items-baseline gap-1 mb-6">
                   <span className="text-4xl font-bold">$10</span>
                   <span className="text-white/50">/ month</span>
                </div>
                <p className="text-sm text-white/60 mb-8 h-10">Advanced compliance & unlimited storage for working professionals.</p>
                <ul className="space-y-4 mb-8 text-sm">
                   <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#C73E1D]"/> <span>Unlimited Uploads & Storage</span></li>
                   <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#C73E1D]"/> <span>Advanced Union Educational Resources</span></li>
                   <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#C73E1D]"/> <span>Agent & Manager Dispatch</span></li>
                   <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#C73E1D]"/> <span>Bulk CSV Import</span></li>
                   <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#C73E1D]"/> <span>Secure Residency Vault</span></li>
                </ul>
                <Button className="w-full bg-white text-[#121212] hover:bg-neutral-200 border-none" onClick={() => onEnter(false)}>{isLoggedIn ? 'Access' : 'Go Pro'}</Button>
             </div>

             {/* Agency Tier */}
             <div className="bg-white border border-neutral-200 p-8 hover:border-[#121212] transition-colors relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-neutral-200 group-hover:bg-[#121212] transition-colors"></div>
                <h3 className="font-serif text-3xl mb-2">Agency Portal</h3>
                <div className="flex items-baseline gap-1 mb-6">
                   <span className="text-4xl font-bold">$90</span>
                   <span className="text-neutral-400">/ month</span>
                </div>
                <p className="text-sm text-neutral-500 mb-8 h-10">Roster management for up to 50 active accounts.</p>
                <ul className="space-y-4 mb-8 text-sm">
                   <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#121212]"/> <span>Manage 50 Talent Profiles</span></li>
                   <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#121212]"/> <span>Global Roster Switcher</span></li>
                   <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#121212]"/> <span>Instant "Log Opportunity"</span></li>
                   <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#121212]"/> <span>Bulk Team Import</span></li>
                   <li className="flex items-center gap-3 pt-4 border-t border-neutral-100 text-xs text-neutral-500">
                      <Plus className="w-3 h-3"/> <span>Add-ons: +$35/mo (50 users)</span>
                   </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => onEnter(true)}>{isLoggedIn ? 'Access' : 'Agency Login'}</Button>
             </div>

          </div>
        </div>
      </section>

      {/* --- Footer CTA --- */}
      <section className="py-32 px-6 md:px-12 text-center bg-[#121212] text-[#F3F3F1]">
        <div className="max-w-3xl mx-auto space-y-10">
          <Heading level={2} className="text-white text-5xl md:text-7xl">Your legacy deserves a better system.</Heading>
          <Text className="text-white/60 text-xl">Join the thousands of Canadian film workers upgrading to CineArch.</Text>
          <div className="pt-8">
            <Button 
              onClick={() => onEnter(false)}
              className="bg-[#C73E1D] text-white hover:bg-[#A63216] hover:scale-105 transition-transform duration-300 border-none px-12 py-6 h-auto text-sm tracking-widest uppercase shadow-2xl"
            >
              {isLoggedIn ? 'Resume' : 'And Action'}
            </Button>
          </div>
        </div>
        
        <div className="mt-32 pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-white/30 uppercase tracking-widest">
           <span>© 2024 CineArch OS. Made in Toronto.</span>
           <div className="flex gap-6 mt-4 md:mt-0">
             <span>Privacy</span>
             <span>Terms</span>
             <span>Support</span>
           </div>
        </div>
      </section>
    </div>
  );
};
