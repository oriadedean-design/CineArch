
import React, { useState } from 'react';
import Papa from 'papaparse';
import { api } from '../services/storage';
import { Job, UNIONS } from '../types';
import { Upload, AlertCircle, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { Button, Text, Badge } from './ui';

export const BulkJobUploadIndividual = ({ userId, onComplete }: { userId: string, onComplete: () => void }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as any[];
          if (rows.length === 0) throw new Error("CSV appears empty");

          const jobsToInsert: Job[] = rows.map((row) => {
            const isUnion = row['Is Union?']?.toString().toUpperCase() === 'TRUE';
            const unionName = isUnion ? row['Union / Guild'] : undefined;
            const unionObj = UNIONS.find(u => u.name === unionName);

            return {
              id: `job_indiv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              userId: userId,
              role: row['Role'] || 'Talent',
              totalHours: parseFloat(row['Total Hours'] || '0'),
              startDate: row['Start Date'] ? new Date(row['Start Date']).toISOString() : new Date().toISOString(),
              isUnion: isUnion,
              unionName: unionName,
              unionTypeId: unionObj?.id,
              productionName: row['Production Name'] || 'Untitled',
              grossEarnings: parseFloat(row['Gross Earnings']?.replace(/[$,]/g, '') || '0'),
              status: 'CONFIRMED',
              documentCount: 0,
              createdAt: new Date().toISOString()
            } as Job;
          });

          jobsToInsert.forEach(job => api.jobs.add(job));
          onComplete();
        } catch (err: any) {
          setError(err.message || "Parse failed");
        } finally {
          setUploading(false);
        }
      }
    });
  };

  return (
    <div className="p-12 border-2 border-dashed border-white/10 glass-ui text-center space-y-8">
      <FileSpreadsheet size={40} className="mx-auto text-white/20" strokeWidth={1} />
      <div className="space-y-2">
        <h3 className="font-serif italic text-3xl text-white">Individual Slate Import</h3>
        <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.4em]">Sync historical logs via CSV</p>
      </div>
      {error && <div className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</div>}
      <label className="inline-block">
        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        <Button variant="outline" className="h-16 border-white/10 hover:border-accent" isLoading={uploading}>
          {uploading ? "Analyzing Gate" : "Select Personal CSV"}
        </Button>
      </label>
    </div>
  );
};
