
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { api } from '../services/storage';
import { Job, User } from '../types';
import { findUnion } from '../services/union_engine';
import { UploadCloud, Users, AlertCircle, FileJson } from 'lucide-react';
import { Button, Select, Badge } from './ui';

export const BulkJobUploadEnterprise = ({ userId, onComplete }: { userId: string, onComplete: () => void }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agent, setAgent] = useState<User | null>(null);
  const [targetUserId, setTargetUserId] = useState<string>(userId);

  // Await async user retrieval on mount
  useEffect(() => {
    api.auth.getUser().then(setAgent);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          const jobsToInsert = rows.map((row) => {
            const isUnion = row['Is Union?']?.toString().toUpperCase() === 'TRUE';
            const unionObj = isUnion ? findUnion(row['Union / Guild']) : null;
            return {
              id: `job_ent_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              userId: targetUserId,
              role: row['Role'] || 'Talent',
              productionName: row['Production Name'] || 'Untitled',
              startDate: row['Start Date'] || new Date().toISOString(),
              isUnion,
              unionName: isUnion ? (unionObj?.name ?? row['Union / Guild']) : undefined,
              unionTypeId: unionObj?.id,
              grossEarnings: parseFloat(row['Gross Earnings']?.replace(/[$,]/g, '') || '0'),
              status: 'CONFIRMED',
              createdAt: new Date().toISOString()
            } as Job;
          });

          // RLS allows agents to write jobs for clients on their roster
          await api.jobs.addMany(jobsToInsert, targetUserId);
          onComplete();
        } catch (err: any) {
          setError(err.message || "Bulk process interrupted");
        } finally {
          setUploading(false);
        }
      }
    });
  };

  return (
    <div className="p-12 border-2 border-dashed border-accent/20 bg-accent/5 space-y-10">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Badge color="accent">Enterprise Ingestor</Badge>
          <h3 className="font-serif italic text-4xl text-white">Roster Sync Engine</h3>
        </div>
        <FileJson size={32} className="text-accent/20" />
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Select Target Personnel</label>
        <Select value={targetUserId} onChange={e => setTargetUserId(e.target.value)} className="h-16 border-white/5 bg-black">
          <option value={userId}>Self (Organization Record)</option>
          {agent?.managedUsers?.filter(u => !u.inviteStatus).map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
          ))}
        </Select>
      </div>

      <label className="block w-full">
        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        <Button className="w-full h-20 bg-white text-black font-black uppercase tracking-[0.6em]" isLoading={uploading}>
          {uploading ? "Processing Roster Data" : "Initialize CSV Ingest"}
        </Button>
      </label>
    </div>
  );
};
