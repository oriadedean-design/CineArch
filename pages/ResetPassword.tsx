import React, { useState } from 'react';
import { Button, Input } from '../components/ui';
import { api } from '../services/storage';
import { Shield } from 'lucide-react';

// Shown after opening a password-reset email link. The link has already
// signed the user in with a short-lived recovery session; this sets the new key.
export const ResetPassword = ({ onDone, linkError }: { onDone: () => void, linkError?: string | null }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(linkError ?? null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("The two access keys don't match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.auth.updatePassword(password);
      alert("Access key updated.");
      onDone();
    } catch (err: any) {
      setError(err.message || "Could not update the access key.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black font-sans p-6 relative">
      <div className="absolute inset-0 bg-cinematic-universal opacity-20 pointer-events-none"></div>
      <div className="w-full max-w-xl relative z-10 space-y-12">
        <div className="text-center">
          <h1 className="heading-huge text-white mb-4">{linkError ? 'LINK EXPIRED.' : 'RESET KEY.'}</h1>
          {!linkError && <p className="text-[10px] font-black uppercase tracking-[0.8em] text-accent">Choose a new access key</p>}
        </div>

        {linkError ? (
          <div className="space-y-8 text-center">
            <p className="text-white/70">{linkError}. Request a new link from the login screen.</p>
            <Button className="w-full h-20 text-[11px] font-black uppercase tracking-[0.6em]" onClick={onDone}>
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 flex items-center gap-2">
                <Shield size={10} className="text-accent" /> New Access Key
              </label>
              <Input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-20 text-xl font-serif italic"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Confirm Access Key</label>
              <Input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="h-20 text-xl font-serif italic"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button
              className="w-full h-24 text-[11px] font-black uppercase tracking-[0.6em]"
              isLoading={loading}
              type="submit"
            >
              Save Access Key
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
