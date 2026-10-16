
import React, { useState, useEffect } from 'react';
import { api } from '../services/storage';
import { DeleteAccount } from '../components/DeleteAccount';
import { PlanCard } from '../components/PlanCard';
import { UnionGoals } from '../components/UnionGoals';
import { Vault } from '../components/Vault';
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
        alert("Saved.");
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
    if (!confirm('Clear all your jobs, union goals and documents? This can\'t be undone.')) return;
    try {
      await api.system.resetData();
      window.location.reload();
    } catch (e: any) {
      alert(`Purge failed: ${e.message}`);
    }
  };

  const handleRevokeAgency = async () => {
    if (window.confirm("Unlink your agency? They will stop seeing your jobs and union progress right away.")) {
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
        <Badge color="accent">Your Trailer</Badge>
        <h1 className="heading-huge italic leading-none">BASE <br/><span className="text-accent">CAMP.</span></h1>
      </header>

      <div className="grid md:grid-cols-12 gap-12">
        <aside className="md:col-span-4 space-y-8">
          <PlanCard user={user} />

          <Card className="p-8 space-y-6 border-white/5">
            <div className="flex items-center gap-3 text-white/40">
              <Users size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Agency Link</span>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-serif italic text-white">
                {isLinked
                  ? agencyName ? `Linked to ${agencyName}` : "Linked to your agency"
                  : "Not linked to an agency"}
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
                <label className="text-xs font-black uppercase tracking-[0.4em] text-white">Province you work in</label>
                <Select value={profileForm.province} onChange={e => setProfileForm({...profileForm, province: e.target.value})} className="h-20 text-2xl font-serif italic">
                  {Object.values(CanadianProvince).map(v => <option key={v} value={v} className="bg-black text-white">{v}</option>)}
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <label htmlFor="earning-goal" className="text-xs font-black uppercase tracking-[0.4em] text-white">Earning goal for {new Date().getFullYear()} ($)</label>
              <Input id="earning-goal" type="number" min={0} step={1000} inputMode="numeric" placeholder="Not set"
                value={profileForm.earningGoal ?? ''}
                onChange={e => setProfileForm({ ...profileForm, earningGoal: e.target.value === '' ? undefined : Number(e.target.value) })}
                className="h-20 text-2xl font-serif italic" />
              <p className="text-xs text-white/50 italic">From film work, before tax. Your Wrap shows how close you are.</p>
            </div>
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-[0.4em] text-white">Email</label>
              <Input value={profileForm.email || ''} disabled className="h-20 opacity-30 cursor-not-allowed font-serif italic" />
            </div>
            <div className="pt-12 border-t border-white/5 flex justify-between items-center">
              <button onClick={handlePurge} className="text-xs font-black uppercase tracking-widest text-red-500/40 hover:text-red-500 transition-colors">Clear my data</button>
              <Button onClick={handleSave} className="h-16 px-12">Save</Button>
            </div>
          </div>
          <UnionGoals />
          <Vault user={user} />
          <DeleteAccount />
        </main>
      </div>
    </div>
  );
};
