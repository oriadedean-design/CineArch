
import React, { useState } from 'react';
import { Button, Input, Heading, Text, Badge } from '../components/ui';
import { api } from '../services/api'; // Switched to API
import { User } from '../types';
import { Briefcase, ArrowLeft } from 'lucide-react';

export const Auth = ({ onLogin, onBack, initialAgentMode = false }: { onLogin: (u: User) => void, onBack: () => void, initialAgentMode?: boolean }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAgent, setIsAgent] = useState(initialAgentMode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        await api.auth.login(email);
        alert("Check your email for the login link!");
        setLoading(false);
        // In a real app, we'd wait for session state change in App.tsx to trigger onLogin
    } catch (e: any) {
        alert("Error logging in: " + e.message);
        setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative transition-colors duration-500 ${isAgent ? 'bg-background' : 'bg-surfaceHighlight'}`}>
      {/* Back to Landing Page Button */}
      <div 
        className="absolute top-6 left-6 cursor-pointer z-10 flex items-center gap-2 group" 
        onClick={onBack}
      >
         <ArrowLeft className={`w-5 h-5 transition-colors text-textTertiary group-hover:text-light`} />
         <span className={`text-sm font-medium uppercase tracking-widest transition-colors text-textTertiary group-hover:text-light`}>Back</span>
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-12 mt-12 md:mt-0">
          {isAgent ? (
             <div className="flex items-center gap-2 mb-2">
                 <div className="p-1 bg-accent rounded text-background"><Briefcase className="w-4 h-4"/></div>
                 <span className="text-light text-xs uppercase tracking-[0.2em] font-medium">Enterprise Access</span>
             </div>
          ) : (
             <Heading level={1} className="mb-2 text-light">CineArch</Heading>
          )}
          {isAgent ? (
             <Heading level={1} className="text-light">Agency Portal</Heading>
          ) : (
             <Text variant="subtle">Built for the passionate crew.</Text>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-surface p-6 md:p-12 border border-light/10 shadow-2xl relative overflow-hidden rounded-2xl md:rounded-none">
          {isAgent && <div className="absolute top-0 left-0 w-full h-1 bg-accent" />}
          
          <div className="space-y-1">
             <div className="flex justify-between items-baseline">
                <Heading level={3} className="text-light">
                    {isLogin ? 'Sign In' : 'Register'}
                </Heading>
                {!isLogin && isAgent && <Badge color="accent">Agent License</Badge>}
             </div>
             <Text variant="small">{isAgent ? 'Manage your roster and billing.' : 'Enter your email to receive a secure login link.'}</Text>
          </div>

          <div className="space-y-6 pt-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-textTertiary mb-2">{isAgent ? 'Work Email' : 'Email'}</label>
              <Input 
                type="email" 
                required 
                placeholder={isAgent ? "agent@agency.com" : "you@example.com"}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-surfaceHighlight border-light/10 text-light focus:border-accent focus:ring-0"
              />
            </div>
          </div>
          
          <div className="pt-4">
            <Button className="w-full bg-light text-background hover:bg-white" isLoading={loading}>
              {isLogin ? 'Send Magic Link' : 'Create Account'}
            </Button>
          </div>

          <div className="text-center pt-4 space-y-4">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="block w-full text-xs font-medium uppercase tracking-widest text-textTertiary hover:text-light transition-colors"
            >
              {isLogin ? "Need an account? Register" : "Have an account? Sign in"}
            </button>
            <div className="border-t border-light/5 pt-4">
              <button 
                type="button"
                onClick={() => setIsAgent(!isAgent)}
                className="text-xs font-bold uppercase tracking-widest text-accent hover:underline"
              >
                {isAgent ? "Switch to Individual Login" : "SWITCH TO AGENCY PORTAL"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
