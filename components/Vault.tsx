import React, { useEffect, useState } from 'react';
import { Lock, Trash2, Upload } from 'lucide-react';
import { api } from '../services/storage';
import { PLANS, RESIDENCY_DOC_TYPES, type ResidencyDocument, type User } from '../types';
import { Card, Select } from './ui';

// The Vault: pay stubs and proof for your union application. A-List Pro;
// on the free plan you can still open and delete what you saved earlier.
export const Vault = ({ user }: { user: User | null }) => {
  const [docs, setDocs] = useState<ResidencyDocument[]>([]);
  const [type, setType] = useState<keyof typeof RESIDENCY_DOC_TYPES>('PAY_STUB');
  const [busy, setBusy] = useState(false);
  const isPro = !!user?.isPremium;

  const refresh = async () => setDocs(await api.vault.list());
  useEffect(() => { refresh(); }, []);

  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try { await api.vault.upload(file, type); await refresh(); }
    catch (e: any) { alert(`Upload failed: ${e.message}`); }
    finally { setBusy(false); }
  };

  const open = async (d: ResidencyDocument) => window.open(await api.vault.getUrl(d), '_blank', 'noopener');
  const remove = async (d: ResidencyDocument) => {
    if (!confirm(`Delete ${d.fileName}?`)) return;
    await api.vault.delete(d.id); refresh();
  };

  return (
    <Card className="p-8 space-y-6 border-white/10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-serif italic text-white leading-none">The Vault</h3>
          <p className="text-xs text-white/40 italic mt-2">Pay stubs, vouchers and proof for your union application.</p>
        </div>
        {!isPro && <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-accent"><Lock size={12} /> {PLANS.pro.label}</span>}
      </div>

      {isPro ? (
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={type} onChange={e => setType(e.target.value as keyof typeof RESIDENCY_DOC_TYPES)} className="h-12 flex-1">
            {Object.entries(RESIDENCY_DOC_TYPES).map(([k, v]) => <option key={k} value={k} className="bg-black">{v}</option>)}
          </Select>
          <label className="h-12 px-6 flex items-center justify-center gap-2 bg-accent text-black text-[10px] font-black uppercase tracking-[0.3em] cursor-pointer">
            <Upload size={14} /> {busy ? 'Uploading…' : 'Add a file'}
            <input type="file" accept="application/pdf,image/*" className="hidden" disabled={busy} onChange={e => upload(e.target.files?.[0])} />
          </label>
        </div>
      ) : (
        <p className="text-sm text-white/60 italic">The Vault comes with {PLANS.pro.label} ({PLANS.pro.price}/month). Upgrades open soon.</p>
      )}

      {docs.length > 0 && (
        <ul className="divide-y divide-white/5 border-t border-white/5">
          {docs.map(d => (
            <li key={d.id} className="flex items-center justify-between gap-4 py-3">
              <button onClick={() => open(d)} className="text-left">
                <p className="text-sm text-white">{d.fileName}</p>
                <p className="text-[10px] uppercase tracking-widest text-white/30">{RESIDENCY_DOC_TYPES[d.type as keyof typeof RESIDENCY_DOC_TYPES] ?? d.type} · {d.uploadedAt.slice(0, 10)}</p>
              </button>
              <button onClick={() => remove(d)} className="text-white/30 hover:text-red-400" aria-label={`Delete ${d.fileName}`}><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
