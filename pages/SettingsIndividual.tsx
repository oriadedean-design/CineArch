
import React, { useState, useEffect } from 'react';
import { api } from '../services/storage';
import { User, CanadianProvince } from '../types';
import { Heading, Text, Button, Input, Select, Card, Badge } from '../components/ui';
import { Shield, User as UserIcon, Lock, Landmark, FileText, Trash2, Users, XCircle } from 'lucide-react';

export const SettingsIndividual = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profileForm, setProfileForm] = useState<Partial<User>>({});
  const [agencyName, setAgencyName] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const u = await api.auth.getUser();
      setUser(u);
      setProfileForm(u || {});

      if (u?.managedByAgencyId) {
        const agency = await api.auth.getAgency().catch(() => null);
        if (agency) setAgencyName(agency.name);
      }
    };
    init();
  }, []);

  const handleSave = async () => {
    if (profileForm) {
      try {
        const u = await api.auth.updateUser(profileForm);
        setUser(u);
        alert("Profile Canonical Synchronized.");
      } catch (e: any) {
        alert(`Save failed: ${e.message}`);
      }
    }
  };

  const handleInvite = async (inviteId: string, accept: boolean) => {
    try {
      await api.auth.respondToInvite(inviteId, accept);
      const u = await api.auth.getUser();
      setUser(u);
      if (accept && u?.managedByAgencyId) {
        const agency = await api.auth.getAgency().catch(() => null);
        setAgencyName(agency?.name ?? null);
      }
    } catch (e: any) {
      alert(`Could not update invite: ${e.message}`);
    }
  };

  const handlePurge = async () => {
    if (!confirm('Purge Drive?')) return;
    try {
      await api.system.resetData();
      window.location.reload();
    } catch (e: any) {
      alert(`Purge failed: ${e.message}`);
    }
  };

  const handleRevokeAgency = async () => {
    if (window.confirm("CRITICAL ACTION: Revoking agency access will immediately disconnect your ledger from their command terminal. Proceed?")) {
      await api.auth.revokeAgency();
      const u = await api.auth.getUser();
      setUser(u);
      setAgencyName(null);
      alert("Agency RLS Access Killed.");
    }
  };

  const isLinked = !!user?.managedByAgencyId;

  return (
    <div className="space-y-24 animate-in fade-in duration-700">
      <header className="space-y-4 border-b border-white/10 pb-12">
        <Badge color="accent">Personnel File</Badge>
        <h1 className="heading-huge italic leading-none">BASE <br/><span className="text-accent">CAMP.</span></h1>
      </header>

      <div className="grid md:grid-cols-12 gap-12">
        <aside className="md:col-span-4 space-y-8">
          <Card className="p-8 border-accent/20 bg-accent/5 space-y-6">
            <Shield className="text-accent" size={24} />
            <h3 className="text-2xl font-serif italic text-white leading-none">Identity Integrity</h3>
            <p className="text-xs text-white/40 leading-relaxed font-light">Your professional coordinates drive all automated guild trajectory logic. Accuracy is mandatory.</p>
          </Card>

          <Card className="p-8 space-y-6 border-white/5">
            <div className="flex items-center gap-3 text-white/40">
              <Users size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Agency Link</span>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-serif italic text-white">
                {isLinked
                  ? agencyName ? `Linked to ${agencyName}` : "Linked to Agency Terminal"
                  : "No Active Agency Link"}
              </p>
              {user?.pendingInvites?.map(invite => (
                <div key={invite.id} className="space-y-3 pt-4 border-t border-white/5">
                  <p className="text-xs text-white/60 leading-relaxed">
                    <span className="text-white">{invite.agencyName}</span> wants to manage your jobs and union tracking. Your finances and documents stay private.
                  </p>
                  <div className="flex gap-4">
                    <button onClick={() => handleInvite(invite.id, true)} className="text-xs font-black uppercase tracking-widest text-accent hover:text-white transition-colors">Accept</button>
                    <button onClick={() => handleInvite(invite.id, false)} className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-red-500 transition-colors">Decline</button>
                  </div>
                </div>
              ))}
              {isLinked && (
                <button
                  onClick={handleRevokeAgency}
                  className="text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors flex items-center gap-2"
                >
                  <XCircle size={12} /> Revoke Agency Access
                </button>
              )}
            </div>
          </Card>
        </aside>

        <main className="md:col-span-8 space-y-12">
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-[0.4em] text-white">Full Name</label>
                <Input value={profileForm.name || ''} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="h-20 text-2xl font-serif italic" />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-[0.4em] text-white">Jurisdiction</label>
                <Select value={profileForm.province} onChange={e => setProfileForm({...profileForm, province: e.target.value})} className="h-20 text-2xl font-serif italic">
                  {Object.values(CanadianProvince).map(v => <option key={v} value={v} className="bg-black text-white">{v}</option>)}
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-[0.4em] text-white">Digital Coordinate (Email)</label>
              <Input value={profileForm.email || ''} disabled className="h-20 opacity-30 cursor-not-allowed font-serif italic" />
            </div>
            <div className="pt-12 border-t border-white/5 flex justify-between items-center">
              <button onClick={handlePurge} className="text-xs font-black uppercase tracking-widest text-red-500/40 hover:text-red-500 transition-colors">Purge Data</button>
              <Button onClick={handleSave} className="h-16 px-12">Print Updates</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
