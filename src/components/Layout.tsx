import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Layers, FileText, Settings, Plus, Users, ChevronDown, Menu, X } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../types';

interface LayoutProps {
  user: User;
  children?: React.ReactNode;
  onLogout: () => void;
  onGoHome: () => void;
}

export const Layout = ({ user, children, onLogout, onGoHome }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleClientSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value === 'SELF' ? undefined : e.target.value;
    authService.switchClientView(user.id, clientId);
    setMobileMenuOpen(false); // Close menu on selection
  };

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/' },
    { label: 'Roadmap', icon: Layers, path: '/roadmap' },
    { label: 'Career Log', icon: Layers, path: '/jobs' },
    { label: 'Tax', icon: FileText, path: '/tax' },
    { label: 'Reports', icon: FileText, path: '/reports' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Shared Sidebar Content
  const SidebarContent = () => (
    <>
      <div 
        className="p-8 pb-8 cursor-pointer group"
        onClick={() => { onGoHome(); setMobileMenuOpen(false); }}
      >
        <h1 className="text-3xl font-serif font-medium tracking-tight text-[#121212] group-hover:text-[#C73E1D] transition-colors">CineArch</h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-1.5 h-1.5 bg-[#C73E1D] rounded-full"></div>
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-medium">Compliance OS</p>
        </div>
      </div>
      
      {/* Agent Client Switcher */}
      {user?.accountType === 'AGENT' && (
        <div className="px-8 mb-6">
          <label className="block text-[10px] uppercase tracking-widest text-neutral-400 mb-2 font-bold">Manage View</label>
          <div className="relative">
            <select 
              className="w-full bg-white border border-neutral-200 px-3 py-2 text-sm appearance-none rounded-none focus:outline-none focus:border-[#C73E1D]"
              value={user.activeViewId || 'SELF'}
              onChange={handleClientSwitch}
            >
              <option value="SELF">My Dashboard</option>
              <optgroup label="Client Roster">
                {user.managedUsers?.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-2.5 text-neutral-400 pointer-events-none" />
          </div>
          {user.activeViewId && (
            <div className="mt-2 text-xs text-[#C73E1D] font-medium flex items-center gap-1">
               <div className="w-1.5 h-1.5 bg-[#C73E1D] rounded-full animate-pulse" />
               Viewing Client Data
            </div>
          )}
          
          <button 
            onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-[#121212] text-white py-2 text-xs uppercase tracking-widest font-bold hover:bg-neutral-800 transition-colors"
          >
            <Users className="w-3 h-3" />
            Add Crew / Talent
          </button>
        </div>
      )}

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-all group ${
              isActive(item.path)
                ? 'text-[#121212]'
                : 'text-neutral-500 hover:text-[#121212]'
            }`}
          >
            <item.icon className={`w-4 h-4 mr-3 transition-colors ${isActive(item.path) ? 'text-[#121212]' : 'text-neutral-400 group-hover:text-[#121212]'}`} strokeWidth={1.5} />
            {item.label}
            {isActive(item.path) && <div className="ml-auto w-1 h-1 bg-[#121212] rounded-full" />}
          </button>
        ))}
      </nav>

      <div className="p-8">
        <button
          onClick={onLogout}
          className="flex items-center text-xs font-medium text-neutral-400 hover:text-[#121212] transition-colors uppercase tracking-widest"
        >
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F3F3F1]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#F3F3F1] border-r border-neutral-200 h-screen sticky top-0 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-64 bg-[#F3F3F1] h-full shadow-xl flex flex-col animate-in slide-in-from-left duration-300">
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-black"
            >
              <X className="w-6 h-6" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
        {/* Mobile Header with Logo & Menu Toggle */}
        <div className="md:hidden sticky top-0 z-30 bg-[#F3F3F1] border-b border-neutral-200 px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)}>
                <Menu className="w-6 h-6 text-[#121212]" />
              </button>
              <div onClick={onGoHome} className="cursor-pointer">
                <span className="font-serif text-xl tracking-tight text-[#121212]">CineArch</span>
              </div>
            </div>
            <div className="w-2 h-2 bg-[#C73E1D] rounded-full"></div>
        </div>

        {user?.activeViewId && (
           <div className="bg-[#121212] text-white px-4 py-2 text-xs text-center md:hidden">
              Viewing Client: {user.managedUsers?.find(u => u.id === user.activeViewId)?.name || 'Unknown'}
           </div>
        )}
        <div className="max-w-6xl mx-auto p-4 md:p-12 lg:p-16 animate-in fade-in duration-700 slide-in-from-bottom-4">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-40 px-6 py-4 pb-safe shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-center">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${
                isActive(item.path) ? 'text-[#121212]' : 'text-neutral-400'
              }`}
            >
              <item.icon className="w-6 h-6" strokeWidth={isActive(item.path) ? 2 : 1.5} />
              {isActive(item.path) && <div className="mt-1 w-1 h-1 bg-[#121212] rounded-full" />}
            </button>
          ))}
        </div>
      </nav>
      
      {/* Mobile Floating Action Button */}
      {location.pathname !== '/jobs/new' && (
         <button 
           onClick={() => navigate('/jobs/new')}
           className="md:hidden fixed bottom-24 right-6 bg-[#121212] text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center z-30 active:scale-95 transition-transform"
         >
           <Plus className="w-6 h-6" strokeWidth={1.5} />
         </button>
      )}
    </div>
  );
};
