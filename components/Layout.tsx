
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Layers, FileText, Settings, LogOut, Plus, Users, ChevronDown, User as UserIcon, BookOpen, WalletCards } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface LayoutProps {
  children?: React.ReactNode;
  onLogout: () => void;
}

export const Layout = ({ children, onLogout }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
        const u = await api.auth.getUser();
        setUser(u);
    };
    fetchUser();
  }, [location]);

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/' },
    { label: 'Projects', icon: Layers, path: '/jobs' },
    { label: 'Finance', icon: WalletCards, path: '/finance' },
    { label: 'Reports', icon: FileText, path: '/reports' },
    { label: 'Resources', icon: BookOpen, path: '/resources' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background text-textPrimary font-sans selection:bg-accent selection:text-white">
      {/* Top Bar - Cinematic Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 px-6 md:px-12 flex items-center justify-between bg-gradient-to-b from-background/95 to-transparent pointer-events-none">
        <div 
          className="pointer-events-auto cursor-pointer group flex items-center gap-3"
          onClick={() => navigate('/')}
        >
          <div className="w-10 h-10 rounded-full border border-light/20 flex items-center justify-center bg-light/5 backdrop-blur-md group-hover:bg-light/10 transition-colors">
             <span className="font-serif italic text-xl text-light">Ca</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-light drop-shadow-lg group-hover:text-accent transition-colors">CineArch</h1>
            <span className="text-[10px] uppercase tracking-[0.2em] text-textTertiary">OS v2.5</span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-6">
           {user?.activeViewId && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/30 text-accent text-xs font-bold uppercase tracking-widest animate-pulse">
                 Viewing Client
              </div>
           )}
           <div className="w-10 h-10 rounded-full overflow-hidden border border-light/20 hover:border-light transition-colors cursor-pointer" onClick={onLogout}>
              <div className="w-full h-full bg-gradient-to-tr from-surfaceHighlight to-surface flex items-center justify-center">
                 <span className="font-serif italic text-textSecondary">{user?.name?.charAt(0)}</span>
              </div>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-32 px-4 md:px-12 max-w-7xl mx-auto min-h-screen animate-in fade-in duration-700">
        {children}
      </main>

      {/* Floating Glass Dock Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
         <nav className="flex items-center gap-2 px-2 py-2 rounded-2xl glass border border-light/10 shadow-2xl shadow-black/80 ring-1 ring-light/5 backdrop-blur-2xl">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl transition-all duration-300 ease-out group ${
                  isActive(item.path) 
                    ? 'bg-light text-background shadow-[0_0_20px_rgba(201,204,199,0.3)] scale-110 -translate-y-2' 
                    : 'text-textTertiary hover:text-light hover:bg-light/10'
                }`}
              >
                <item.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={isActive(item.path) ? 2.5 : 2} />
                {isActive(item.path) && (
                   <span className="absolute -bottom-6 text-[10px] font-bold uppercase tracking-widest text-light whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 px-2 py-1 rounded-md border border-light/10">
                     {item.label}
                   </span>
                )}
              </button>
            ))}
            
            <div className="w-[1px] h-8 bg-light/10 mx-2"></div>
            
            <button
               onClick={() => navigate('/jobs/new')}
               className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl bg-accent text-background hover:bg-accentGlow transition-all shadow-glow hover:scale-105 active:scale-95"
            >
               <Plus className="w-6 h-6" />
            </button>
         </nav>
      </div>
    </div>
  );
};
