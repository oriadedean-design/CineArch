
import React, { useState, useEffect } from 'react';
import { Heading, Text, Button, Badge } from '../components/ui';
import { ArrowRight, CheckCircle, Shield, Award, Clapperboard, Users, Heart, Zap, Globe, BarChart, FileText, Calculator, Calendar } from 'lucide-react';
import { UNIONS } from '../types';
import { useNavigate } from 'react-router-dom';

interface WelcomeProps {
  onEnter: (asAgent?: boolean) => void;
  isLoggedIn?: boolean;
}

const HERO_IMAGES = [
  "https://www.herenow.film/wp-content/uploads/2024/12/image-124.jpeg",
  "https://i.pinimg.com/1200x/5e/42/57/5e4257679a36daca5536198bb55a92dc.jpg",
  "https://i.pinimg.com/736x/2f/e4/e2/2fe4e287633eaed874b09bb0ea45d695.jpg",
  "https://i.pinimg.com/1200x/a7/cd/7b/a7cd7b40aaa13946f78ccaaeaccfb608.jpg",
  "https://i.pinimg.com/1200x/93/12/3d/93123dd53e97af01df8790876de7a553.jpg",
  "https://s.studiobinder.com/wp-content/uploads/2021/11/Production-Assistant-Job-Description-StudioBinder.jpg"
];

const PricingCard = ({ title, price, period, features, recommended = false, onClick }: any) => (
  <div className={`p-8 rounded-3xl border flex flex-col relative overflow-hidden transition-all duration-300 hover:-translate-y-2 ${recommended ? 'bg-light text-background border-light' : 'bg-surface border-light/10 text-light hover:border-light/30'}`}>
      {recommended && <div className="absolute top-4 right-4 bg-accent text-white text-[10px] font-bold uppercase px-2 py-1 rounded">Best Value</div>}
      <h3 className="font-serif text-3xl mb-2">{title}</h3>
      <div className="flex items-baseline gap-1 mb-6">
         <span className="text-4xl font-bold">{price}</span>
         <span className={`text-sm ${recommended ? 'text-surfaceHighlight' : 'text-textTertiary'}`}>{period}</span>
      </div>
      <ul className="space-y-3 mb-8 flex-1">
         {features.map((f: string, i: number) => (
            <li key={i} className="flex items-center gap-3 text-sm font-medium">
               <CheckCircle className={`w-4 h-4 ${recommended ? 'text-accent' : 'text-secondary'}`} />
               {f}
            </li>
         ))}
      </ul>
      <Button 
         onClick={onClick} 
         variant={recommended ? 'primary' : 'outline'} 
         className={`w-full ${recommended ? 'bg-background text-light hover:bg-surface border-none' : ''}`}
      >
         Get Started
      </Button>
  </div>
);

export const Welcome = ({ onEnter }: WelcomeProps) => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Image Carousel Timer
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000); 

    // Scroll Listener for Liquid Glass Effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden font-sans text-light">
      {/* Liquid Glass Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center transition-all duration-500 ease-in-out border-b ${
          scrolled 
            ? 'py-4 px-6 md:px-12 bg-background/60 backdrop-blur-xl border-light/10 shadow-2xl pointer-events-auto' 
            : 'py-6 md:py-10 px-6 md:px-12 bg-gradient-to-b from-background/90 to-transparent border-transparent pointer-events-none'
        }`}
      >
         <span 
            className={`font-serif text-2xl tracking-tight pointer-events-auto transition-transform duration-300 cursor-pointer ${scrolled ? 'scale-90 origin-left text-light' : 'text-light'}`}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
         >
            CineArch
         </span>
         <div className="flex items-center gap-6 pointer-events-auto">
             <button onClick={() => navigate('/resources')} className="text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors hidden md:block">Resources</button>
             <button onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior: 'smooth'})} className="text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors hidden md:block">Pricing</button>
             <Button onClick={() => onEnter(false)} variant="glass" className="h-10 text-xs px-6 uppercase tracking-widest hover:bg-light hover:text-background transition-all">Sign In</Button>
         </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-end pb-32 px-6 md:px-20 max-w-8xl mx-auto overflow-hidden">
        <div className="absolute inset-0 z-0">
            {HERO_IMAGES.map((src, index) => (
                <div 
                    key={src}
                    className={`absolute inset-0 transition-all duration-[2000ms] ease-in-out ${
                        index === currentImageIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                    }`}
                >
                    <img 
                        src={src} 
                        className="w-full h-full object-cover opacity-40 grayscale"
                        alt={`Cinematic Background ${index + 1}`}
                    />
                </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        <div className="relative z-10 w-full animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-12 h-[2px] bg-accent shadow-[0_0_10px_rgba(124,150,166,0.5)]"></div>
               <span className="text-accent text-xs font-bold uppercase tracking-[0.3em]">For Canadian Film Workers</span>
            </div>
            
            <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tighter mb-8 drop-shadow-2xl text-light">
               Track <br />
               <span className="italic text-textSecondary">Your Journey.</span>
            </h1>
            
            <p className="max-w-xl text-lg md:text-xl text-textSecondary font-light leading-relaxed mb-12">
               The operating system for the industry. Organize your career eligibility, manage production logs, and forecast your union status with military-grade precision.
            </p>

            <div className="flex flex-col md:flex-row gap-6">
               <Button onClick={() => onEnter(false)} className="bg-light text-background h-14 px-10 text-sm tracking-widest uppercase hover:scale-105 transition-transform">
                  Enter System <ArrowRight className="w-4 h-4 ml-3" />
               </Button>
               <Button onClick={() => onEnter(true)} variant="outline" className="h-14 px-10 text-sm tracking-widest uppercase border-light/20 hover:bg-light/10">
                  Agency Portal
               </Button>
            </div>
        </div>
      </section>

      {/* Featured Unions Section */}
      <section className="py-24 border-y border-light/5 bg-background">
          <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
              <Text variant="caption" className="mb-16 block text-textTertiary">Featured Unions</Text>
              
              <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-80">
                  {/* ACTRA - White on Black Logo */}
                  <div className="h-16 w-32 md:w-48 flex items-center justify-center opacity-60 hover:opacity-100 transition-all duration-500 group">
                      <img 
                        src="https://actratoronto.com/wp-content/uploads/2024/10/ACTRA-TORONTO-LOGO_OUTLINED_WHITE-ON-BLACK_3840X2160_100224.png" 
                        alt="ACTRA" 
                        className="max-h-full max-w-full object-contain brightness-0 invert sepia-[.2] hue-rotate-180 saturate-[.2] group-hover:brightness-100 group-hover:invert-0 group-hover:sepia-0 transition-all duration-500" 
                      />
                  </div>

                  {/* DGC */}
                  <div className="h-16 w-32 md:w-48 flex items-center justify-center opacity-60 hover:opacity-100 transition-all duration-500 group">
                      <img 
                        src="https://www.reelasian.com/wp-content/uploads/2021/10/DGC-National-logo.png" 
                        alt="DGC" 
                        className="max-h-full max-w-full object-contain brightness-0 invert sepia-[.2] hue-rotate-180 saturate-[.2] group-hover:brightness-100 group-hover:invert-0 group-hover:sepia-0 transition-all duration-500" 
                      />
                  </div>

                  {/* IATSE */}
                  <div className="h-20 w-32 md:w-40 flex items-center justify-center opacity-60 hover:opacity-100 transition-all duration-500 group">
                      <img 
                        src="https://prideatwork.ca/wp-content/uploads/2024/10/IATSE-logo-450x207.png" 
                        alt="IATSE" 
                        className="max-h-full max-w-full object-contain brightness-0 invert sepia-[.2] hue-rotate-180 saturate-[.2] group-hover:brightness-100 group-hover:invert-0 group-hover:sepia-0 transition-all duration-500" 
                      />
                  </div>

                  {/* WGC */}
                  <div className="h-16 w-32 md:w-48 flex items-center justify-center opacity-60 hover:opacity-100 transition-all duration-500 group">
                      <img 
                        src="https://www.wgc.ca/sites/default/files/styles/news_hero/public/article/WGC%20logo_stacked_col_1.png?itok=MKWXceDc" 
                        alt="WGC" 
                        className="max-h-full max-w-full object-contain brightness-0 invert sepia-[.2] hue-rotate-180 saturate-[.2] group-hover:brightness-100 group-hover:invert-0 group-hover:sepia-0 transition-all duration-500" 
                      />
                  </div>
              </div>
          </div>
      </section>

      {/* About / Mission */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div className="sticky top-24">
                  <Heading level={2} className="mb-6 leading-tight">Human error is a wrap.</Heading>
                  <Text className="text-xl text-textSecondary leading-relaxed mb-6">
                      You didn't join this industry to manage spreadsheets or calculate fringe rates. You are here to tell stories.
                  </Text>
                  <Text className="text-xl text-textSecondary leading-relaxed">
                      CineArch replaces the anxiety of "Did I qualify?" with the clarity of "I am ready." We account for all roles, all departments, and all possibilities.
                  </Text>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-6 bg-surface border border-light/10 rounded-2xl hover:bg-light/5 transition-colors">
                      <BarChart className="w-8 h-8 text-secondary mb-4" />
                      <h3 className="font-bold text-lg mb-2">Automated Dues Calculation</h3>
                      <p className="text-sm text-textTertiary">Math that works while you sleep. We track every hour and every dollar.</p>
                  </div>
                  <div className="p-6 bg-surface border border-light/10 rounded-2xl hover:bg-light/5 transition-colors translate-y-8">
                      <Calendar className="w-8 h-8 text-accent mb-4" />
                      <h3 className="font-bold text-lg mb-2">Tentative Booking Forecasts</h3>
                      <p className="text-sm text-textTertiary">See how potential jobs will impact your eligibility timeline before you even book them.</p>
                  </div>
                  <div className="p-6 bg-surface border border-light/10 rounded-2xl hover:bg-light/5 transition-colors">
                      <FileText className="w-8 h-8 text-accent mb-4" />
                      <h3 className="font-bold text-lg mb-2">Document Vault</h3>
                      <p className="text-sm text-textTertiary">Upload and organize vouchers, pay stubs, and call sheets securely.</p>
                  </div>
                  <div className="p-6 bg-surface border border-light/10 rounded-2xl hover:bg-light/5 transition-colors translate-y-8">
                      <Calculator className="w-8 h-8 text-secondary mb-4" />
                      <h3 className="font-bold text-lg mb-2">Automatic Tax Calculation</h3>
                      <p className="text-sm text-textTertiary">Estimates based on location and region.</p>
                      <p className="text-[10px] text-textTertiary mt-2 italic">*CineArch provides tax estimates only and does not file taxes on your behalf.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* The New Standard / Visual Section */}
      <section className="py-20 px-6 border-y border-light/5 bg-surfaceHighlight/30">
          <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-12 items-center">
              <div className="md:col-span-7 relative group">
                   <div className="aspect-[4/5] md:aspect-[16/9] rounded-sm overflow-hidden relative grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out">
                        <img src="https://i.pinimg.com/1200x/a7/cd/7b/a7cd7b40aaa13946f78ccaaeaccfb608.jpg" alt="Editorial Portrait" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
                        
                        {/* UI Overlay Mockup */}
                        <div className="absolute bottom-8 left-8 right-8">
                            <div className="bg-background/80 backdrop-blur-md border border-light/10 p-6 rounded-xl shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-accent font-bold mb-1">Eligibility Status</p>
                                        <h3 className="font-serif text-2xl text-light">ACTRA Apprentice</h3>
                                    </div>
                                    <Badge color="success">Active</Badge>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono text-textSecondary">
                                        <span>PROGRESS</span>
                                        <span>75%</span>
                                    </div>
                                    <div className="h-1 w-full bg-light/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-accent to-secondary w-3/4"></div>
                                    </div>
                                    <p className="text-xs text-light pt-1">1200 / 1600 HRS LOGGED</p>
                                </div>
                            </div>
                        </div>
                   </div>
              </div>
              <div className="md:col-span-5 space-y-6">
                   <div className="flex items-center gap-3">
                       <div className="h-[1px] w-8 bg-accent"></div>
                       <span className="text-accent text-xs font-bold uppercase tracking-widest">Set Life</span>
                   </div>
                   <h2 className="text-5xl md:text-6xl font-serif leading-none text-light">THE NEW <br/> STANDARD</h2>
                   <blockquote className="text-2xl font-light text-textSecondary italic border-l-2 border-light/10 pl-6 py-2">
                       "Finally, software that respects the hustle."
                   </blockquote>
              </div>
          </div>
      </section>

      {/* Agency & Enterprise Segment */}
      <section className="py-32 bg-surfaceHighlight/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-accent/5 skew-x-12 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
              <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
                  <div className="max-w-2xl">
                      <div className="flex items-center gap-2 mb-4">
                          <Users className="w-5 h-5 text-accent" />
                          <span className="text-accent text-xs font-bold uppercase tracking-widest">Enterprise Solutions</span>
                      </div>
                      <Heading level={2}>For Agents & Organizations</Heading>
                      <Text className="mt-4 text-xl text-textSecondary">
                          Powerful roster management for Talent Agents, Managers, and Non-Profit Arts Organizations.
                      </Text>
                  </div>
                  <Button onClick={() => onEnter(true)} variant="outline" className="border-light/20">Access Agency Portal</Button>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                  <div className="p-8 bg-surface/50 border border-light/10 rounded-3xl backdrop-blur-sm">
                      <Users className="w-10 h-10 text-light mb-6" />
                      <h3 className="font-serif text-2xl mb-3 text-light">Roster Management</h3>
                      <p className="text-textTertiary text-sm leading-relaxed">
                          Manage unlimited clients. Switch views instantly to log jobs or check eligibility on their behalf. Perfect for highly active rosters.
                      </p>
                  </div>
                  <div className="p-8 bg-surface/50 border border-light/10 rounded-3xl backdrop-blur-sm">
                      <Zap className="w-10 h-10 text-light mb-6" />
                      <h3 className="font-serif text-2xl mb-3 text-light">Eligibility Forecasting</h3>
                      <p className="text-textTertiary text-sm leading-relaxed">
                          Know exactly when your talent will qualify for full union membership. Strategize their bookings to hit targets faster.
                      </p>
                  </div>
                  <div className="p-8 bg-surface/50 border border-light/10 rounded-3xl backdrop-blur-sm">
                      <Heart className="w-10 h-10 text-light mb-6" />
                      <h3 className="font-serif text-2xl mb-3 text-light">Arts Organizations</h3>
                      <p className="text-textTertiary text-sm leading-relaxed">
                          For non-profit art organizations: save program coordination time and money. Automate tracking to focus on finding opportunities for those you serve.
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
              <Heading level={2} className="mb-6">Simple Pricing</Heading>
              <div className="inline-flex items-center bg-surface border border-light/10 rounded-full p-1 gap-1">
                  <button 
                    onClick={() => setIsAnnual(false)}
                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${!isAnnual ? 'bg-light text-background' : 'text-textTertiary hover:text-light'}`}
                  >
                      Monthly
                  </button>
                  <button 
                    onClick={() => setIsAnnual(true)}
                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${isAnnual ? 'bg-light text-background' : 'text-textTertiary hover:text-light'}`}
                  >
                      Annually <span className="text-accent ml-1">-30%</span>
                  </button>
              </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <PricingCard 
                  title="Free" 
                  price="$0" 
                  period="Forever" 
                  features={["3 Active Projects", "Basic Union Tracking", "Manual Entry"]}
                  onClick={() => onEnter(false)}
              />
              <PricingCard 
                  title="Pro" 
                  price={isAnnual ? "$10.50/mo" : "$15/mo"}
                  period={isAnnual ? "Billed $126 yearly" : "Billed monthly"} 
                  recommended={true}
                  features={["Unlimited Projects", "Bulk CSV Import", "PDF Reports", "Document Vault", "All Union Tiers"]}
                  onClick={() => onEnter(false)}
              />
              <PricingCard 
                  title="Agency Portal" 
                  price={isAnnual ? "$63/mo" : "$90/mo"}
                  period={isAnnual ? "Billed $756 yearly" : "Billed monthly"} 
                  features={[
                      "Includes 35 Pro Accounts", 
                      "Just $2.57/seat (vs $15)",
                      "Save over $400/month",
                      "Global Roster Switcher", 
                      "Centralized Compliance"
                  ]}
                  onClick={() => onEnter(true)}
              />
          </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-light/5 bg-background py-12 px-6 text-center">
          <span className="font-serif text-2xl tracking-tight block mb-4 text-light">CineArch</span>
          <p className="text-xs text-textTertiary uppercase tracking-widest">© 2024 CineArch Systems. All Rights Reserved.</p>
      </footer>
    </div>
  );
};
