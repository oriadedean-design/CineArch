
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Layers, WalletCards, Users, Settings, Plus, ChevronDown, Check, Building2, User } from 'lucide-react';
import { api } from '../services/api';
import { Profile, OrgMembership } from '../types';

interface LayoutProps {
  children?: React.ReactNode;
  onLogout: () => void;
}

export const Layout = ({ children, onLogout }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
        const p = await api.auth.getProfile();
        setProfile(p);
        const mems = await api.auth.getMyMemberships();
        setMemberships(mems);
        
        // Context Logic
        const stored = localStorage.getItem('cinearch_org_id');
        if (stored) {
            setActiveOrgId(stored);
        } else if (mems.length > 0) {
            // Default to first org found (usually personal if created on signup)
            setActiveOrgId(mems[0].org_id);
            localStorage.setItem('cinearch_org_id', mems[0].org_id);
        }
    };
    init();
  }, [location]);

  const handleSwitch = (orgId: string) => {
      api.orgs.switchOrg(orgId);
  };

  const currentOrg = memberships.find(m => m.org_id === activeOrgId)?.organization;
  const isAgency = currentOrg?.org_type === 'agency';

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/' },
    { label: 'Projects', icon: Layers, path: '/jobs' },
    { label: 'Finance', icon: WalletCards, path: '/finance' },
    ...(isAgency ? [{ label: 'Agency Portal', icon: Users, path: '/agency' }] : []),
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background text-textPrimary font-sans selection:bg-accent selection:text-white">
      {/* Top Bar - Cinematic Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 px-6 md:px-12 flex items-center justify-between bg-gradient-to-b from-background/95 to-transparent pointer-events-none border-b border-white/5">
        <div className="pointer-events-auto flex items-center gap-6">
            <div 
              className="cursor-pointer group flex items-center gap-3"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 rounded-full border border-light/20 flex items-center justify-center bg-light/5 backdrop-blur-md group-hover:bg-light/10 transition-colors">
                <span className="font-serif italic text-xl text-light">Ca</span>
              </div>
            </div>

            {/* Org Switcher */}
            <div className="relative">
                <button 
                    onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                >
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] uppercase tracking-widest text-textTertiary">Workspace</span>
                        <span className="text-sm font-bold text-light flex items-center gap-2">
                            {currentOrg?.name || 'Loading...'} 
                            <ChevronDown className="w-3 h-3 text-textTertiary"/>
                        </span>
                    </div>
                </button>

                {isSwitcherOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2 space-y-1">
                            {memberships.map(mem => (
                                <button
                                    key={mem.org_id}
                                    onClick={() => handleSwitch(mem.org_id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left group ${activeOrgId === mem.org_id ? 'bg-accent/20' : 'hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-md ${mem.organization?.org_type === 'agency' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-white'}`}>
                                            {mem.organization?.org_type === 'agency' ? <Building2 className="w-4 h-4"/> : <User className="w-4 h-4"/>}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${activeOrgId === mem.org_id ? 'text-accent' : 'text-textPrimary'}`}>{mem.organization?.name}</p>
                                            <p className="text-[10px] text-textTertiary uppercase">{mem.member_role}</p>
                                        </div>
                                    </div>
                                    {activeOrgId === mem.org_id && <Check className="w-4 h-4 text-accent"/>}
                                </button>
                            ))}
                        </div>
                        <div className="p-2 border-t border-white/10 bg-white/5">
                            <button className="w-full text-xs font-bold text-center py-2 text-textTertiary hover:text-white transition-colors">
                                + Create Organization
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-6">
           <div className="w-10 h-10 rounded-full overflow-hidden border border-light/20 hover:border-light transition-colors cursor-pointer" onClick={onLogout}>
              <div className="w-full h-full bg-gradient-to-tr from-surfaceHighlight to-surface flex items-center justify-center">
                 <span className="font-serif italic text-textSecondary">{profile?.name?.charAt(0)}</span>
              </div>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-32 px-4 md:px-12 max-w-7xl mx-auto min-h-screen animate-in fade-in duration-700">
        {children}
      </main>

      {/* Floating Dock */}
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
