
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heading, Text, Badge, Button, Card } from '../components/ui';
import { ArrowLeft, Calendar, User, Clock, Share2, Shield, FileText, Phone } from 'lucide-react';
import { Article, UNIONS } from '../types';

// --- Editorial Content Data ---
const ARTICLES: Article[] = [
  {
    slug: 'union-handbooks-2025',
    title: 'The 2025 Union Handbook Guide',
    subtitle: 'Everything you need to know about rates, fringes, and eligibility for Canadian film unions.',
    category: 'UNION',
    date: 'Dec 12, 2024',
    readTime: '8 min read',
    author: 'CineArch Editorial',
    imageUrl: 'https://i.pinimg.com/1200x/5e/42/57/5e4257679a36daca5536198bb55a92dc.jpg',
    content: (
      <div className="space-y-6">
        <p className="text-xl font-serif leading-relaxed text-gray-300">
          Navigating the landscape of Canadian film unions can feel like decoding a cipher. From ACTRA's IPA to IATSE's Tier structures, understanding where you fit is the first step to a sustainable career.
        </p>
        <h3 className="text-2xl font-bold text-white mt-8 mb-4">The Major Players</h3>
        <p className="text-gray-400 leading-relaxed">
          In English-speaking Canada, the industry is primarily governed by three pillars: ACTRA (Performers), IATSE (Technicians & Artisans), and the DGC (Directors & Production Team). Each has specific entry requirements that often serve as the first major hurdle for new entrants.
        </p>
        <div className="grid md:grid-cols-2 gap-4 my-8">
           {UNIONS.map(u => (
              <div key={u.id} className="p-6 bg-surfaceHighlight border border-white/10 rounded-xl">
                 <h4 className="font-serif text-xl text-white mb-2">{u.name}</h4>
                 <p className="text-sm text-gray-400">{u.description}</p>
                 <div className="mt-4 text-xs font-bold uppercase tracking-widest text-accent">Rate: {(u.defaultDuesRate * 100).toFixed(2)}% Dues</div>
              </div>
           ))}
        </div>
        <p className="text-gray-400 leading-relaxed">
          For IATSE specifically, the "Permit" system is often misunderstood. You are not strictly a "non-member" when working on a permit; you are a prospective member under observation. Every hour counts towards your eventual application.
        </p>
      </div>
    )
  },
  {
    slug: 'set-safety-hotlines',
    title: 'Essential Safety Hotlines & Procedures',
    subtitle: 'Who to call when things go wrong. A mandatory resource for every call sheet.',
    category: 'COMPLIANCE',
    date: 'Nov 04, 2024',
    readTime: '3 min read',
    author: 'Safety Team',
    imageUrl: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=2080&auto=format&fit=crop',
    content: (
      <div className="space-y-6">
        <p className="text-xl leading-relaxed text-gray-300">
          Safety on set is non-negotiable. While the 1st AD is responsible for set safety, every crew member has the right to refuse unsafe work. Here are the direct lines to ministry and union safety reps.
        </p>
        
        <div className="my-8 space-y-4">
            <div className="flex items-center justify-between p-6 bg-red-900/20 border border-red-500/30 rounded-xl">
                <div>
                   <h4 className="font-bold text-white">Ontario Ministry of Labour</h4>
                   <p className="text-sm text-red-200">Report Critical Injuries or Refusals</p>
                </div>
                <div className="text-xl font-mono text-white">1-877-202-0008</div>
            </div>
            
            <div className="flex items-center justify-between p-6 bg-surfaceHighlight border border-white/10 rounded-xl">
                <div>
                   <h4 className="font-bold text-white">IATSE Safety Hotline</h4>
                   <p className="text-sm text-gray-400">Anonymous Reporting 24/7</p>
                </div>
                <div className="text-xl font-mono text-white">844-422-9273</div>
            </div>

            <div className="flex items-center justify-between p-6 bg-surfaceHighlight border border-white/10 rounded-xl">
                <div>
                   <h4 className="font-bold text-white">Actsafe (BC)</h4>
                   <p className="text-sm text-gray-400">Injury Prevention & Resources</p>
                </div>
                <div className="text-xl font-mono text-white">604-733-4682</div>
            </div>
        </div>
        
        <h3 className="text-2xl font-bold text-white mt-8 mb-4">The Refusal Process</h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-400">
            <li>Report the hazard to your supervisor (Key or Head of Dept).</li>
            <li>If unresolved, report to the 1st AD or Producer.</li>
            <li>If still unsafe, you have the legal right to refuse work without reprisal. Call the Ministry hotline immediately.</li>
        </ul>
      </div>
    )
  },
  {
    slug: 'freelance-tax-guide',
    title: 'The Freelancer\'s Guide to Taxes',
    subtitle: 'From T2200s to GST remittance. Keep your hard-earned money.',
    category: 'GUIDE',
    date: 'Oct 28, 2024',
    readTime: '12 min read',
    author: 'Finance Dept',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop',
    content: (
      <div className="space-y-6">
        <p className="text-xl leading-relaxed text-gray-300">
          The difference between a "hobby" and a "business" in the eyes of the CRA often comes down to documentation. As a film worker, you are likely a sole proprietor.
        </p>
        <h3 className="text-2xl font-bold text-white mt-8 mb-4">The T2200 Declaration</h3>
        <p className="text-gray-400 leading-relaxed">
           If you are an employee (T4), you cannot deduct expenses unless your employer signs a T2200 "Declaration of Conditions of Employment". This is rare for daily hires but common for contract staff writers or production office staff.
        </p>
        <h3 className="text-2xl font-bold text-white mt-8 mb-4">GST/HST: The $30k Rule</h3>
        <p className="text-gray-400 leading-relaxed">
           Once you bill over $30,000 in a calendar year (or four consecutive quarters), you <strong>must</strong> register for GST/HST. Failing to do so can result in penalties equal to the tax you <em>should</em> have collected.
        </p>
        <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-xl my-6">
            <h4 className="font-bold text-blue-200 mb-2">Pro Tip: Voluntary Registration</h4>
            <p className="text-sm text-blue-100/70">
                You can register before hitting $30k. This allows you to claim "Input Tax Credits" (refunds) on the GST you pay for gear, computers, and agents.
            </p>
        </div>
      </div>
    )
  }
];

// --- Components ---

// Explicitly add key to ArticleCard props to fix type mismatch error on line 265
const ArticleCard = ({ article, onClick }: { article: Article, onClick: () => void, key?: React.Key }) => (
  <div 
    onClick={onClick}
    className="group cursor-pointer flex flex-col gap-4 border-b border-white/10 pb-12 hover:border-white/30 transition-colors"
  >
    <div className="aspect-[16/9] w-full overflow-hidden rounded-md bg-surfaceHighlight relative">
       <img 
         src={article.imageUrl} 
         alt={article.title}
         className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
       />
       <div className="absolute top-4 left-4">
          <Badge color="neutral">{article.category}</Badge>
       </div>
    </div>
    <div className="space-y-2 mt-2">
       <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
          <span>{article.date}</span>
          <span>•</span>
          <span>{article.readTime}</span>
       </div>
       <h3 className="text-3xl font-serif text-white group-hover:text-accent transition-colors leading-tight">
          {article.title}
       </h3>
       <p className="text-gray-400 leading-relaxed line-clamp-2">
          {article.subtitle}
       </p>
    </div>
  </div>
);

const ArticleDetail = ({ article }: { article: Article }) => {
    const navigate = useNavigate();
    
    return (
        <article className="animate-in fade-in duration-700">
           {/* Header */}
           <div className="h-[50vh] relative w-full overflow-hidden">
               <div className="absolute inset-0 bg-black/40 z-10" />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-20" />
               <img src={article.imageUrl} className="w-full h-full object-cover" alt="Hero" />
               
               <div className="absolute bottom-0 left-0 w-full z-30 px-6 md:px-12 pb-12">
                   <div className="max-w-4xl mx-auto">
                        <Button 
                            variant="ghost" 
                            className="text-white/70 hover:text-white hover:bg-white/10 mb-6 pl-0"
                            onClick={() => navigate('/resources')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Resources
                        </Button>
                        <Badge color="accent">{article.category}</Badge>
                        <h1 className="text-4xl md:text-6xl font-serif text-white mt-4 mb-6 leading-tight max-w-3xl">
                            {article.title}
                        </h1>
                        <div className="flex items-center gap-6 text-sm font-medium text-gray-300">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {article.author}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {article.date}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {article.readTime}
                            </div>
                        </div>
                   </div>
               </div>
           </div>

           {/* Content Body */}
           <div className="px-6 md:px-12 py-12 md:py-20 bg-black min-h-screen">
               <div className="max-w-3xl mx-auto">
                   <p className="text-xl md:text-2xl text-gray-400 font-serif italic mb-12 border-l-2 border-accent pl-6 leading-relaxed">
                       {article.subtitle}
                   </p>
                   
                   <div className="prose prose-invert prose-lg max-w-none">
                       {article.content}
                   </div>
                   
                   <div className="border-t border-white/10 mt-16 pt-8 flex justify-between items-center">
                       <span className="text-xs uppercase tracking-widest text-gray-500">Share this article</span>
                       <div className="flex gap-4">
                           <Button variant="outline" className="h-10 w-10 p-0 rounded-full flex items-center justify-center border-white/20">
                               <Share2 className="w-4 h-4" />
                           </Button>
                       </div>
                   </div>
               </div>
           </div>
        </article>
    );
};

export const Resources = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const activeArticle = ARTICLES.find(a => a.slug === slug);

  // If slug is present but not found, redirect to list
  React.useEffect(() => {
     if (slug && !activeArticle) navigate('/resources');
  }, [slug, activeArticle, navigate]);

  // Detail View
  if (activeArticle) {
      return <ArticleDetail article={activeArticle} />;
  }

  // List View
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Editorial Header */}
      <header className="px-6 md:px-12 py-8 flex justify-between items-center border-b border-white/10 sticky top-0 z-40 bg-black/80 backdrop-blur-md">
         <span className="font-serif text-2xl cursor-pointer" onClick={() => navigate('/')}>CineArch</span>
         <div className="flex gap-4">
             <Button variant="ghost" onClick={() => navigate('/')}>Home</Button>
             <Button onClick={() => navigate('/auth')}>Sign In</Button>
         </div>
      </header>
      
      <main className="px-6 md:px-12 py-20 max-w-7xl mx-auto">
         <div className="mb-20 text-center max-w-3xl mx-auto">
            <span className="text-accent text-xs font-bold uppercase tracking-[0.3em] mb-4 block">Knowledge Base</span>
            <Heading level={1} className="mb-6">The Industry Standard</Heading>
            <Text className="text-xl text-gray-400">
               Expert insights, compliance guides, and essential resources for the modern film worker.
            </Text>
         </div>

         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {ARTICLES.map(article => (
               <ArticleCard 
                  key={article.slug} 
                  article={article} 
                  onClick={() => navigate(`/resources/${article.slug}`)} 
               />
            ))}
         </div>

         {/* Footer CTA */}
         <div className="mt-32 p-12 bg-surfaceHighlight/20 rounded-3xl border border-white/10 text-center">
             <Heading level={2} className="mb-4">Join the Network</Heading>
             <Text className="max-w-xl mx-auto mb-8 text-gray-400">
                Access professional tracking tools, document vaults, and automated tax compliance.
             </Text>
             <Button onClick={() => navigate('/auth')} className="h-14 px-8 text-lg">Get Started</Button>
         </div>
      </main>
    </div>
  );
};
