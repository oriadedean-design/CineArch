import React, { useState, useEffect } from 'react';
import { api } from '../services/storage';
import { User } from '../types';
import { Select, Badge } from './ui';
import { BulkJobUpload } from './BulkJobUpload';

// Agency import: pick the client, then the same spreadsheet import (and
// union pricing) as the personal app.
export const BulkJobUploadEnterprise = ({ userId, onComplete }: { userId: string, onComplete: () => void }) => {
  const [agent, setAgent] = useState<User | null>(null);
  const [targetUserId, setTargetUserId] = useState<string>(userId);

  useEffect(() => {
    api.auth.getUser().then(setAgent);
  }, []);

  return (
    <div className="p-6 md:p-12 border-2 border-dashed border-accent/20 bg-accent/5 space-y-8">
      <div className="space-y-2">
        <Badge color="accent">Roster Import</Badge>
        <h3 className="font-serif italic text-4xl text-white">Import a client's work history</h3>
      </div>
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Client</label>
        <Select value={targetUserId} onChange={e => setTargetUserId(e.target.value)} className="h-16 border-white/5 bg-black">
          <option value={userId}>Self (Organization Record)</option>
          {agent?.managedUsers?.filter(u => !u.inviteStatus).map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
          ))}
        </Select>
      </div>
      <BulkJobUpload key={targetUserId} userId={targetUserId} onComplete={onComplete} />
    </div>
  );
};
