import React, { useState } from 'react';
import { api } from '../services/storage';
import { Button, Input } from './ui';

// Settings > Delete account. Permanent and immediate (App Store 5.1.1(v)):
// removes the login, profile, jobs, documents and finance records.
export const DeleteAccount = ({ isAgent = false }: { isAgent?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.auth.deleteAccount();
      window.location.replace(window.location.pathname + '#/');
      window.location.reload();
    } catch (e: any) {
      setError(`Couldn't delete your account: ${e.message || 'unknown error'}. Nothing was deleted; try again.`);
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4 border border-red-500/30 p-6">
      <h3 className="text-xs font-black uppercase tracking-[0.4em] text-red-400">Delete account</h3>
      <p className="text-sm text-white/60 leading-relaxed">
        Permanently deletes your account and everything in it: your jobs, union progress, documents and finance records.
        {isAgent && ' Your clients keep their own accounts; they are just disconnected from your agency.'}
        {' '}This happens immediately and can't be undone.
      </p>
      {!open ? (
        <Button variant="danger" onClick={() => setOpen(true)}>Delete account</Button>
      ) : (
        <div className="space-y-4">
          <label className="block text-sm text-white/80">Type <strong>DELETE</strong> to confirm.</label>
          <Input value={typed} onChange={e => setTyped(e.target.value)} autoCapitalize="characters" autoComplete="off" aria-label="Type DELETE to confirm" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <Button variant="danger" onClick={remove} disabled={typed.trim() !== 'DELETE' || busy} isLoading={busy}>Delete permanently</Button>
            <Button variant="ghost" onClick={() => { setOpen(false); setTyped(''); setError(null); }} disabled={busy}>Cancel</Button>
          </div>
        </div>
      )}
    </section>
  );
};
