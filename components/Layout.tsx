
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Layers, FileText, Settings, Plus, WalletCards, Bell, X, Shield, Contact } from 'lucide-react';
import { api } from '../services/storage';
import { User, CineNotification } from '../types';
import { clsx } from 'clsx';

interface LayoutProps {
  children?: React.ReactNode;
  onLogout: () => void;
}

export const Layout = ({ children, onLogout }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isClapperAnimating, setIsClapperAnimating] = useState(false);
  const [notifications, setNotifications] = useState<CineNotification[]>([]);

  useEffect(() => {
    setUser(api.auth.getUser());
    setNotifications([
      { id: '1', type: 'GST_THRESHOLD', title: 'Threshold Sync', message: 'Small Supplier limit reached 82%. Prepare registration.', timestamp: '2h ago', isRead: false, priority: 'high' },
      { id: '2', type: 'PRODUCTION_START', title: 'Session Verified', message: 'Project "Midnight" call sheet sync complete.', timestamp: '4h ago', isRead: false, priority: 'medium' }
    ]);
  }, [location]);

  const handleNotificationToggle = () => {
    setIsClapperAnimating(true);
    setShowNotifications(!showNotifications);
    setTimeout(() => setIsClapperAnimating(false), 500);
  };

  const navItems = [
    { label: 'The Wrap', icon: LayoutDashboard, path: '/' },
    { label: 'The Slate', icon: Layers, path: '/jobs' },
    { label: 'The Ledger', icon: WalletCards, path: '/finance' },
    { label: 'Continuity', icon: FileText, path: '/reports' },
    { label: 'Base Camp', icon: Settings, path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen font-sans bg-transparent">
      {/* Editorial HUD Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] h-20 px-6 md:px-12 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-4">
          <div className="cursor-pointer group flex items-center gap-3" onClick={() => navigate('/')}>
            <span className="font-serif italic text-2xl text-white">Ca</span>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">v 0.5</span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-6">
          <div className="relative">
             <button 
                onClick={handleNotificationToggle}
                className={clsx(
                  "w-10 h-10 flex flex-col items-center justify-center transition-all group",
                  showNotifications ? "text-accent" : "text-white/40 hover:text-white"
                )}
             >
                <div className={clsx(
                  "w-6 h-[2px] bg-current rounded-full mb-[2px] transition-transform duration-300 origin-left",
                  showNotifications ? "rotate-0" : "-rotate-[25deg]",
                  isClapperAnimating && "animate-snap"
                )}></div>
                <div className="w-6 h-4 border-2 border-current rounded-sm flex items-center justify-center relative">
                   {notifications.some(n => !n.isRead) && (
                     <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                   )}
                   <Bell size={10} />
                </div>
             </button>

             {showNotifications && (
               <div className="absolute top-14 right-0 w-80 glass-ui p-6 animate-in fade-in slide-in-from-top-2">
                 <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-accent italic tracking-[0.2em]">Production Alerts</span>
                    <button onClick={() => setShowNotifications(false)}><X size={14} className="text-white" /></button>
                 </div>
                 <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {notifications.map(n => (
                       <div key={n.id} className="p-4 bg-white/5 border-l-2 border-accent hover:bg-white/10 transition-colors cursor-pointer text-white">
                          <p className="text-[10px] font-bold text-white mb-1 uppercase tracking-widest">{n.title}</p>
                          <p className="text-[10px] text-white/80 leading-relaxed">{n.message}</p>
                          <span className="text-[8px] text-white/40 mt-2 block font-black">{n.timestamp}</span>
                       </div>
                    ))}
                 </div>
               </div>
             )}
          </div>

          <div 
             className="w-10 h-10 bg-white text-black font-black flex items-center justify-center text-[10px] cursor-pointer hover:bg-accent transition-colors" 
             onClick={onLogout}
          >
              {user?.name?.charAt(0)}
          </div>
        </div>
      </header>

      {/* Persistent Floating Dock */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4">
         <nav className="flex items-center gap-1 p-2 glass-ui shadow-2xl justify-center">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={clsx(
                  "relative flex items-center justify-center w-12 h-12 transition-all duration-300",
                  isActive(item.path) 
                    ? 'bg-white text-black' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                )}
                title={item.label}
              >
                <item.icon size={18} strokeWidth={isActive(item.path) ? 3 : 2} />
              </button>
            ))}
            <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
            <button
               onClick={() => navigate('/jobs/new')}
               className="flex items-center justify-center w-12 h-12 bg-accent text-black hover:scale-105 transition-all"
               title="Log Production"
            >
               <Plus size={20} strokeWidth={3} />
            </button>
         </nav>
      </div>

      <main className="mobile-wrapper pt-24 pb-40 min-h-screen">
        {children}
      </main>
    </div>
  );
};
