
import React, { useState, useEffect } from 'react';
import { api } from '../services/storage';
import { User, Job } from '../types';
import { Heading, Text, Card, Badge, Button, Input } from '../components/ui';
// Added X to imports
import { Search, Plus, UserPlus, Mail, Phone, ChevronRight, UploadCloud, ArrowUpRight, FileText, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BulkJobUpload } from '../components/BulkJobUpload';
// Added clsx import
import { clsx } from 'clsx';

export const Management = () => {
  const navigate = useNavigate();
  const [agent, setAgent] = useState<User | null>(null);
  const [roster, setRoster] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showIngest, setShowIngest] = useState<string | null>(null);

  // Correct async session handling for Management component
  useEffect(() => {
    const initManagement = async () => {
      const u = await api.auth.getUser();
      if (u?.accountType !== 'AGENT') {
        navigate('/');
        return;
      }
      setAgent(u);
      setRoster(u.managedUsers || []);
    };
    initManagement();
  }, [navigate]);

  const filteredRoster = roster.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImpersonate = (clientId: string) => {
    api.auth.switchClient(clientId);
    navigate('/');
  };

  const handleAddClient = () => {
    const name = prompt("Enter Talent Name:");
    if (!name) return;
    const email = prompt("Enter Talent Email:");
    if (!email) return;

    const newClient: User = {
      id: `client_${Date.now()}`,
      name,
      email,
      role: 'Talent',
      province: 'Ontario',
      isOnboarded: true,
      accountType: 'INDIVIDUAL',
      isPremium: true
    };
    api.auth.addClient(newClient);
    setRoster([...roster, newClient]);
  };

  return (
    <div className="space-y-24 animate-in fade-in duration-1000 pb-40">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 pb-16 border-b border-white/10 relative">
        <div className="space-y-6">
           <Badge color="accent" className="italic tracking-widest uppercase">Management Terminal v0.5</Badge>
           <h1 className="text-8xl md:text-9xl font-serif text-white uppercase tracking-tighter italic leading-[0.75]">THE <br/><span className="text-accent">ROSTER.</span></h1>
        </div>
        <div className="flex gap-4">
           <Button onClick={handleAddClient} variant="outline" className="h-16 border-white/10">
              <UserPlus size={16} className="mr-3" /> Add Personnel
           </Button>
        </div>
      </header>

      <div className="space-y-12">
         {/* Search Bar */}
         <div className="relative group max-w-2xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-accent transition-colors" size={20} />
            <Input 
              placeholder="Filter roster by name or coordinate..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-16 h-20 text-xl font-serif italic border-white/5 focus:border-accent/40"
            />
         </div>

         <div className="grid grid-cols-1 gap-1">
            {filteredRoster.map((client) => (
               <Card key={client.id} className="p-0 border-white/5 bg-transparent group overflow-hidden">
                  <div className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-10 group-hover:bg-white/[0.02] transition-colors">
                     <div className="flex items-center gap-10">
                        <div className="w-20 h-20 bg-accent/5 border border-accent/20 flex items-center justify-center font-serif italic text-5xl text-accent group-hover:bg-accent group-hover:text-black transition-all">
                           {client.name.charAt(0)}
                        </div>
                        <div className="space-y-2">
                           <h3 className="text-4xl font-serif italic text-white group-hover:text-accent transition-colors">{client.name}</h3>
                           <div className="flex items-center gap-6">
                              <Badge color="neutral" className="opacity-40">{client.selectedRoles?.[0] || 'Member'}</Badge>
                              <div className="flex items-center gap-3 text-[10px] text-white/20 uppercase font-black tracking-widest italic">
                                 <Mail size={12} className="text-accent" /> {client.email}
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowIngest(showIngest === client.id ? null : client.id)}
                          className={clsx("h-14 px-8 text-[9px] border-white/5", showIngest === client.id && "bg-accent text-black")}
                        >
                           <UploadCloud size={14} className="mr-3" /> Mark Slate
                        </Button>
                        <Button 
                          onClick={() => handleImpersonate(client.id)}
                          className="h-14 px-10 text-[9px] bg-white text-black hover:bg-accent"
                        >
                           View Drive <ArrowUpRight size={14} className="ml-3" />
                        </Button>
                     </div>
                  </div>

                  {/* Inline Proxy Ingestor */}
                  {showIngest === client.id && (
                     <div className="p-12 bg-white/[0.03] border-t border-white/10 animate-in slide-in-from-top-4 duration-500">
                        <div className="mb-8 flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent italic">Proxy Ingest Engine // {client.name}</span>
                           <button onClick={() => setShowIngest(null)} className="text-white/20 hover:text-white"><X size={16} /></button>
                        </div>
                        <BulkJobUpload userId={client.id} onComplete={() => setShowIngest(null)} />
                     </div>
                  )}
               </Card>
            ))}

            {filteredRoster.length === 0 && (
               <div className="py-40 text-center border border-dashed border-white/5 opacity-30 italic font-black uppercase tracking-[0.4em] text-[11px] space-y-6">
                  <p>No personnel records found in active roster.</p>
                  <Button onClick={handleAddClient} variant="outline" className="h-14 px-10 border-white/10">Initial Sync Required</Button>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};
