
import React, { useState } from 'react';
import { Button, Input, Heading, Text } from '../components/ui';
import { authService } from '../services/authService';
import { User } from '../types';

export const Auth = ({ onLogin, onBack, initialAgentMode = false }: { onLogin: (u: User) => void, onBack: () => void, initialAgentMode?: boolean }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAgent, setIsAgent] = useState(initialAgentMode);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      let user;
      if (isLogin) {
        user = await authService.login(email, password);
      } else {
        user = await authService.register(email, password, isAgent);
      }
      onLogin(user);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F3F3F1] relative">
      {/* Absolute Logo Button returning to Landing Page */}
      <div 
        className="absolute top-8 left-8 cursor-pointer z-10" 
        onClick={onBack}
      >
         <span className="font-serif text-2xl tracking-tight text-black hover:text-[#C73E1D] transition-colors">CineArch</span>
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-12">
          <Heading level={1} className="mb-2 text-black">CineArch</Heading>
          <Text variant="subtle">Operating System v2.0</Text>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 md:p-12 border border-neutral-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="space-y-1">
             <Heading level={3} className="text-black">
               {isAgent ? 'Agency Portal ' : 'Member '}
               {isLogin ? 'Sign In' : 'Register'}
             </Heading>
             <Text variant="small">Enter your credentials to access the system.</Text>
          </div>

          <div className="space-y-6 pt-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Email</label>
              <Input 
                type="email" 
                required 
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-neutral-50 border-neutral-200 text-black focus:border-black focus:ring-0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-neutral-500 mb-2">Password</label>
              <Input 
                type="password" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-neutral-50 border-neutral-200 text-black focus:border-black focus:ring-0"
              />
            </div>
          </div>
          
          {error && <div className="text-red-500 text-sm bg-red-50 p-3">{error}</div>}

          <div className="pt-4">
            <Button className="w-full bg-black text-white hover:bg-neutral-800" isLoading={loading}>
              {isLogin ? 'Authenticate' : 'Create Account'}
            </Button>
          </div>

          <div className="text-center pt-4 space-y-4">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="block w-full text-xs font-medium uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              {isLogin ? "Need an account? Register" : "Have an account? Sign in"}
            </button>
            <div className="border-t border-neutral-100 pt-4">
              <button 
                type="button"
                onClick={() => setIsAgent(!isAgent)}
                className="text-xs font-bold uppercase tracking-widest text-[#C73E1D] hover:underline"
              >
                {isAgent ? "Switch to Individual Login" : "Switch to Agency Portal"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
