import React, { useState } from 'react';
import { Button, Input, Heading, Text, Badge } from '../components/ui';
import { api } from '../services/storage';
import { User } from '../types';
import { Briefcase, ArrowLeft, Camera, Shield, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

export const Auth = ({ onLogin, onBack, initialAgentMode = false }: { onLogin: (u: User) => void, onBack: () => void, initialAgentMode?: boolean }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAgent, setIsAgent] = useState(initialAgentMode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let user;
      if (isLogin) {
        // Mode: AUTH_LOGIN
        user = await api.auth.login(email, password);
      } else {
        // Mode: AUTH_REGISTER
        user = await api.auth.register(email, password, isAgent);
      }
      onLogin(user);
    } catch (err: any) {
      console.error("CineArch Auth Failure:", err);
      alert("Authentication Denied: " + (err.message || "Invalid Coordinates"));
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      await api.auth.loginWithGoogle();
      // Page will redirect to Google immediately.
    } catch (err: any) {
      console.error("Google Auth Failed:", err);
      alert("Google Sign-In Error: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-black overflow-hidden font-sans">
      <div className="absolute inset-0 bg-cinematic-universal opacity-20 pointer-events-none"></div>
      <div className="bg-vignette-universal"></div>

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

        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          {/* Google Auth Option */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full h-24 border border-white/10 glass-ui hover:border-accent hover:bg-accent/5 transition-all flex items-center justify-center gap-6 group disabled:opacity-30 active:scale-95"
            >
              <div className="w-8 h-8 bg-white rounded-none flex items-center justify-center p-1.5 shadow-glow">
                 <svg viewBox="0 0 24 24" className="w-full h-full">
                   <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                   <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                   <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                   <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                 </svg>
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/80 group-hover:text-white transition-colors">
                {isLogin ? "Authenticate via Google" : "Register via Google"}
              </span>
            </button>

            <div className="flex items-center gap-6 opacity-20">
              <div className="h-px bg-white flex-1" />
              <span className="text-[9px] uppercase font-black tracking-[0.5em] text-white">OR USE ACCESS KEY</span>
              <div className="h-px bg-white flex-1" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
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
                className="w-full h-24 text-[11px] font-black uppercase tracking-[0.6em] transition-all hover:scale-[1.02]" 
                isLoading={loading}
                type="submit"
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
    </div>
  );
};