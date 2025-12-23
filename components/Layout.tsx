
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Plus, WalletCards, Bell, UserX, Users, Layers } from 'lucide-react';
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
  const [notifications, setNotifications] = useState<CineNotification[]>([]);

  useEffect(() => {
    setUser(api.auth.getUser());
    setNotifications([
      { id: '1', type: 'GST_THRESHOLD', title: 'Threshold Sync', message: 'Small Supplier limit reached 82%.', timestamp: '2h ago', isRead: false, priority: 'high' }
    ]);
  }, [location]);

  const isShowrunner = user?.accountType === 'AGENT';
  const isPossessing = isShowrunner && user?.activeViewId;
  const activeClientName = user?.managedUsers?.find(u => u.id === user.activeViewId)?.name;

  // Updated Nav order as per user request: Contacts, Wrap Wallet, Reports
  const navItems = isShowrunner && !isPossessing 
    ? [
        { label: 'Contacts', icon: Users, path: '/app/contacts' },
        { label: 'Wrap Wallet', icon: WalletCards, path: '/app/finance' },
        { label: 'Reports', icon: FileText, path: '/app/reports' },
      ]
    : [
        { label: 'The Wrap', icon: LayoutDashboard, path: '/app/dashboard' },
        { label: 'The Slate', icon: Layers, path: '/app/jobs' },
        { label: 'Wrap Wallet', icon: WalletCards, path: '/app/finance' },
        { label: 'Reports', icon: FileText, path: '/app/reports' },
      ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen font-sans bg-transparent">
      <header className="fixed top-0 left-0 right-0 z-[100] h-20 md:h-24 px-6 md:px-12 flex items-center justify-between glass-ui border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className="cursor-pointer group flex items-center gap-3" onClick={() => navigate('/app/dashboard')}>
            <span className="font-serif italic text-2xl md:text-3xl text-white group-hover:text-accent transition-colors">CineArch</span>
          </div>

          {isPossessing && (
            <div className="flex items-center gap-4 border-l border-white/10 pl-6 animate-in slide-in-from-left duration-500">
               <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white italic">Possessing: {activeClientName}</span>
               <button onClick={() => api.auth.switchClient(undefined)} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors">
                 <UserX size={14} /> Exit
               </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-8">
          <button onClick={() => setShowNotifications(!showNotifications)} className={clsx("w-12 h-12 flex items-center justify-center transition-all", showNotifications ? "text-accent" : "text-white/40 hover:text-white")}>
            <Bell size={20} />
          </button>
        </div>
      </header>

      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-4">
        <button onClick={() => navigate('/app/settings')} className="w-14 h-14 bg-accent text-black flex items-center justify-center shadow-xl hover:scale-110 transition-all group">
          <Settings size={22} className="group-hover:rotate-45 transition-transform" />
        </button>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] w-full max-w-xl px-6">
         <nav className="flex items-center gap-1 p-2 glass-ui shadow-2xl justify-center backdrop-blur-2xl h-24">
            {navItems.map((item) => (
              <button key={item.path} onClick={() => navigate(item.path)} className={clsx("relative flex flex-col items-center justify-center w-24 h-20 transition-all", isActive(item.path) ? 'bg-white text-black' : 'text-white/30 hover:text-white')}>
                <item.icon size={20} className="mb-2" />
                <span className="text-[8px] font-black uppercase tracking-[0.3em]">{item.label}</span>
              </button>
            ))}
            <div className="w-[1px] h-12 bg-white/10 mx-3"></div>
            <button onClick={() => navigate('/app/jobs/new')} className="flex flex-col items-center justify-center w-24 h-20 bg-accent text-black hover:scale-105 transition-all">
               <Plus size={22} strokeWidth={4} />
               <span className="text-[8px] font-black uppercase tracking-[0.3em]">Log</span>
            </button>
         </nav>
      </div>

      <main className="mobile-wrapper pt-32 md:pt-40 pb-56 min-h-screen">
        {children}
      </main>
    </div>
  );
};
