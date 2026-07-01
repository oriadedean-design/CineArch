import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Layers, FileText, Settings, Plus, WalletCards, X, Users, BookOpen, Eye } from 'lucide-react';
import { api } from '../services/storage';
import { User, CineNotification } from '../types';
import { clsx } from 'clsx';
import { isDemoMode, exitDemoMode } from '../services/demo';

export const Layout = ({ children, onLogout }: { children?: React.ReactNode, onLogout: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const refreshUser = async () => {
      const u = await api.auth.getUser();
      setUser(u);
    };
    refreshUser();
  }, [location]);

  const handleExitClientView = async () => {
    await api.auth.switchClient(null);
    const u = await api.auth.getUser();
    setUser(u);
    navigate('/');
  };

  const isDashboardMode = user && user.isOnboarded;
  const isAuthPage = location.pathname === '/auth';
  const isViewingClient = !!user?.activeViewId;

  const navItems = user?.accountType === 'AGENT' ? [
    { icon: LayoutDashboard, path: '/', label: 'Your Wrap' },
    { icon: Users, path: '/roster', label: 'Your Roster' },
    { icon: Layers, path: '/jobs', label: 'Your Aggregate' },
    { icon: WalletCards, path: '/finance', label: 'Your Wallet' },
    { icon: FileText, path: '/reports', label: 'Your Ledger' },
    { icon: Settings, path: '/settings', label: 'Your Config' },
  ] : [
    { icon: LayoutDashboard, path: '/', label: 'Your Wrap' },
    { icon: Layers, path: '/jobs', label: 'Your Slate' },
    { icon: WalletCards, path: '/finance', label: 'Your Wallet' },
    { icon: FileText, path: '/reports', label: 'Your Ledger' },
    { icon: Settings, path: '/settings', label: 'Your Config' },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Demo Mode Banner */}
      {isDemoMode() && (
        <div className="fixed top-0 left-0 right-0 z-[300] bg-accent text-black flex items-center justify-between px-4 md:px-6 py-2">
          <div className="flex items-center gap-2">
            <Eye size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">Preview Mode — No data is saved</span>
          </div>
          <button
            onClick={exitDemoMode}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:opacity-70 transition-opacity"
          >
            <X size={12} /> Exit Preview
          </button>
        </div>
      )}

      {/* Impersonation Banner */}
      {isViewingClient && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-accent text-black flex items-center justify-between px-6 py-2">
          <span className="text-xs font-black uppercase tracking-widest">
            Viewing as {user.name}
          </span>
          <button
            onClick={handleExitClientView}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:opacity-70 transition-opacity"
          >
            <X size={14} /> Exit View
          </button>
        </div>
      )}

      {/* THE HUD: Singular Global Header */}
      {!isAuthPage && (
        <header className={clsx(
          "fixed left-0 right-0 z-[100] h-14 md:h-20 px-4 md:px-12 flex items-center justify-between pointer-events-none safe-top",
          isDemoMode() ? "top-8" : isViewingClient ? "top-8" : "top-0"
        )}>
          <div className="pointer-events-auto flex items-center gap-4">
            <div className="cursor-pointer group flex items-center gap-2 md:gap-3" onClick={() => navigate('/')}>
              <span className="font-serif italic text-2xl md:text-4xl text-white">Ca</span>
              <div className="flex flex-col">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white">CineArch</span>
                <span className="hidden sm:block text-[9px] md:text-xs font-black uppercase tracking-[0.2em] text-white/30 italic">Registry // v0.5</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-10 ml-10 border-l border-white/10 pl-10">
              <button onClick={() => navigate('/manual')} className={clsx("text-xs font-black uppercase tracking-[0.4em] transition-colors flex items-center gap-3", location.pathname === '/manual' ? "text-accent" : "text-white/30 hover:text-white")}>
                <BookOpen size={14}/> Your Manual
              </button>
              <button onClick={() => navigate('/resources')} className={clsx("text-xs font-black uppercase tracking-[0.4em] transition-colors", location.pathname === '/resources' ? "text-accent" : "text-white/30 hover:text-white")}>
                Your Archive
              </button>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 md:gap-4 bg-white/5 border border-white/10 px-3 md:px-5 py-2 hover:bg-white/10 transition-all cursor-pointer group" onClick={() => navigate('/settings')}>
                <div className="w-7 h-7 bg-white text-black font-black flex items-center justify-center text-xs shrink-0">
                  {user.name?.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors leading-none">{user.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); onLogout(); }} className="text-[10px] font-black uppercase tracking-widest text-accent mt-1 text-left">Exit</button>
                </div>
                {/* Mobile: tap avatar to go to settings, long-press hint */}
                <button
                  onClick={(e) => { e.stopPropagation(); onLogout(); }}
                  className="sm:hidden text-[9px] font-black uppercase tracking-widest text-accent"
                >
                  Exit
                </button>
              </div>
            ) : (
              <button onClick={() => navigate('/')} className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] bg-white text-black px-5 md:px-10 py-3 md:py-4 shadow-glow hover:bg-accent transition-all">
                Verify
              </button>
            )}
          </div>
        </header>
      )}

      {/* COMMAND DOCK: Dashboard Controls */}
      {isDashboardMode && (
        <nav className="fixed bottom-8 left-0 right-0 z-[100] flex justify-center px-6 safe-bottom">
          <div className="flex items-center gap-2 p-2 glass-ui shadow-2xl w-full max-w-lg justify-around md:justify-center">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={clsx(
                  "relative flex flex-col items-center justify-center w-14 h-14 transition-all duration-300",
                  location.pathname === item.path ? 'bg-white text-black' : 'text-white/30 hover:text-white'
                )}
                title={item.label}
              >
                <item.icon size={18} strokeWidth={location.pathname === item.path ? 3 : 2} />
                <span className="text-xs font-black uppercase tracking-widest mt-1">{item.label.split(' ')[1]}</span>
              </button>
            ))}
            <div className="w-px h-8 bg-white/10 mx-2"></div>
            <button
              onClick={() => navigate(user?.accountType === 'AGENT' ? '/roster' : '/jobs/new')}
              className="flex items-center justify-center w-14 h-14 bg-accent text-black hover:scale-105 transition-all shadow-glow"
            >
              <Plus size={24} strokeWidth={3} />
            </button>
          </div>
        </nav>
      )}

      <main className={clsx(
        "mobile-wrapper flex-1 pt-24 pb-40",
        isDashboardMode ? "md:pt-36" : "md:pt-28",
        isViewingClient && "pt-32 md:pt-44"
      )}>
        {children}
      </main>
    </div>
  );
};
