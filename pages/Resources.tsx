
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heading, Badge, Card } from '../components/ui';
import { ArrowLeft } from 'lucide-react';
import { Article } from '../types';
import { getDepartments, getCoverage, getUnionSpec } from '../services/engine';

// Which union covers each catalog role in Ontario (outside Ottawa and Northern Ontario).
const OntarioCoverage = () => {
  const byUnion = new Map<string, string[]>();
  for (const d of getDepartments()) for (const r of d.roles) {
    for (const c of getCoverage('Ontario', r.name, d.name)) {
      byUnion.set(c.unionId, [...(byUnion.get(c.unionId) ?? []), r.name]);
    }
  }
  return (
    <div className="space-y-6">
      <p className="text-xl font-serif leading-relaxed text-gray-300 italic">
        "The landscape of Ontario film is a puzzle of specific Locals. Knowing where your role fits isn't just about dues—it's about eligibility."
      </p>
      <p className="text-gray-400 leading-relaxed">
        Who covers each role in Ontario, from CineArch's union engine. Some roles appear under more than one union where
        jurisdiction is shared. Ottawa and Northern Ontario differ: see the <a className="text-accent underline" href="/guide/provinces/ontario/">Ontario guide</a>.
      </p>
      {[...byUnion].sort((a, b) => b[1].length - a[1].length).map(([unionId, roles]) => (
        <div key={unionId} className="p-6 glass-ui border-white/10">
          <h4 className="text-accent font-black uppercase text-[10px] tracking-widest mb-3 italic">{getUnionSpec(unionId)?.name ?? unionId}</h4>
          <p className="text-sm text-white/70">{roles.join(' · ')}</p>
        </div>
      ))}
    </div>
  );
};

const ARTICLES: Article[] = [
  {
    slug: 'ontario-union-guide',
    title: 'Ontario Jurisdictional Alignment',
    subtitle: 'Which union covers which role in Ontario, from the CineArch union engine.',
    category: 'UNION',
    date: 'Jan 15, 2025',
    readTime: '10 min read',
    author: 'CineArch Editorial',
    imageUrl: 'https://i.pinimg.com/1200x/5e/42/57/5e4257679a36daca5536198bb55a92dc.jpg',
    // Built from the union engine, so it changes when the engine's data does.
    content: <OntarioCoverage />
  }
];

export const Resources = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  if (slug) {
    const article = ARTICLES.find(a => a.slug === slug);
    if (!article) return null;
    return (
      <div className="max-w-4xl mx-auto py-20 space-y-16 animate-in fade-in duration-1000">
        <button onClick={() => navigate('/resources')} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">
           <ArrowLeft size={16} /> Back to Archive
        </button>
        <img src={article.imageUrl} className="w-full aspect-video object-cover grayscale brightness-50" />
        <div className="space-y-8">
           <Badge color="accent">{article.category}</Badge>
           <Heading level={1} className="text-8xl italic leading-[0.75] uppercase">{article.title}</Heading>
           <div className="prose prose-invert max-w-none text-white/60 leading-relaxed font-light italic text-xl">
             {article.content}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-24 pb-40">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-white/10 pb-12">
        <div className="space-y-2">
           <Badge color="accent" className="italic tracking-widest">Industry Library</Badge>
           <h1 className="heading-huge uppercase italic leading-none">THE <br/><span className="text-accent">CHRONICLE.</span></h1>
        </div>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-1">
        {ARTICLES.map(a => (
          <Card key={a.slug} onClick={() => navigate(`/resources/${a.slug}`)} className="p-0 border-white/5 group overflow-hidden h-[450px]">
             <div className="h-1/2 overflow-hidden relative">
                <img src={a.imageUrl} className="w-full h-full object-cover grayscale transition-all duration-[2000ms] group-hover:scale-110 group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-black/40" />
             </div>
             <div className="p-10 space-y-4">
                <span className="text-xs font-black text-accent uppercase tracking-widest">{a.category}</span>
                <h3 className="text-3xl font-serif italic text-white leading-tight">{a.title}</h3>
                <p className="text-xs text-white/40 italic line-clamp-3">{a.subtitle}</p>
             </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
