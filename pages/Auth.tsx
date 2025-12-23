import React, { useState } from 'react';
import { Button, Input, Heading, Text, Badge } from '../components/ui';
import { api } from '../services/storage';
import { User } from '../types';
import { Briefcase, ArrowLeft, Camera, Shield } from 'lucide-react';
import { clsx } from 'clsx';

export const Auth = ({ onLogin, onBack, initialAgentMode = false }: { onLogin: (u: User) => void, onBack: () => void, initialAgentMode?: boolean }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAgent, setIsAgent] = useState(initialAgentMode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    
    // Simulate set prep and security clearance
    setTimeout(() => {
      const user = api.auth.login(email, isAgent);
      onLogin(user);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-black overflow-hidden font-sans">
      {/* Background Cinematic Texture */}
      <div className="absolute inset-0 bg-cinematic-universal opacity-20 pointer-events-none"></div>
      <div className="bg-vignette-universal"></div>

      {/* Back to First Positions */}
      <div 
        className="absolute top-12 left-12 cursor-pointer z-50 flex items-center gap-4 group" 
        onClick={onBack}
      >
         <ArrowLeft className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
         <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 group-hover:text-white transition-colors">Back to Ones</span>
      </div>

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex justify-center mb-8">
             <div className="w-16 h-16 border border-white/20 glass-ui flex items-center justify-center">
                <span className="font-serif italic text-3xl text-white">Ca</span>
             </div>
          </div>
          <h1 className="heading-huge text-white mb-4">CINEARCH.</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.8em] text-accent">Professional Registry</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 flex items-center gap-2">
                <Shield size={10} className="text-accent" /> Personnel Coordinate
              </label>
              <Input 
                type="email" 
                required 
                placeholder="Production Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-20 text-xl font-serif italic"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Access Key</label>
              <Input 
                type="password" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-20 text-xl font-serif italic"
              />
            </div>
          </div>
          
          <div className="pt-8">
            <Button 
              type="submit"
              className="w-full h-24 text-[11px] font-black uppercase tracking-[0.6em] transition-all hover:scale-[1.02]" 
              isLoading={loading}
            >
              {loading ? "Checking the Gate..." : isLogin ? "Report to Set" : "Sign for the Block"}
            </Button>
          </div>

          <div className="text-center space-y-8 pt-8">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 hover:text-white transition-colors"
            >
              {isLogin ? "New Personnel? Register" : "Existing Member? Authenticate"}
            </button>
            <div className="pt-8 border-t border-white/5">
              <button 
                type="button"
                onClick={() => setIsAgent(!isAgent)}
                className={clsx(
                  "text-[9px] font-black uppercase tracking-[0.4em] transition-all px-8 py-3 border",
                  isAgent ? "border-accent text-accent bg-accent/5" : "border-white/10 text-white/40 hover:text-white hover:border-white/30"
                )}
              >
                {isAgent ? "Switch to Individual Access" : "Switch to Agency Command"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};