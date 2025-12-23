
import React, { useState } from 'react';
import Papa from 'papaparse';
import { api } from '../services/storage';
import { Job, UNIONS } from '../types';
import { Upload, AlertCircle, Lock } from 'lucide-react';
import { Badge, Button } from './ui';

export const BulkJobUpload = ({ userId, onComplete }: { userId: string, onComplete: () => void }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = api.auth.getUser();
  
  const uploadCount = api.jobs.getBulkUploadCount();
  const isGated = !user?.isPremium && uploadCount >= 1;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isGated) return;
    
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
            const unionObj = UNIONS.find(u => u.name === unionName || u.name.includes(unionName || 'xyz'));

            return {
              id: `job_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: userId,
              role: row['Role'] || 'Unknown Role',
              totalHours: parseFloat(row['Total Hours'] || '0'),
              startDate: row['Start Date'] ? new Date(row['Start Date']).toISOString() : new Date().toISOString(),
              endDate: row['End Date'] ? new Date(row['End Date']).toISOString() : undefined,
              isUnion: isUnion,
              unionName: unionName,
              unionTypeId: unionObj?.id,
              productionName: row['Production Name'] || 'Untitled Import',
              companyName: row['Company Name'] || '',
              province: row['Province'] || '',
              department: row['Department'] || '',
              grossEarnings: parseFloat(row['Gross Earnings']?.replace(/[$,]/g, '') || '0'),
              status: 'CONFIRMED',
              documentCount: 0,
              createdAt: new Date().toISOString()
            } as Job;
          });

          const validJobs = jobsToInsert.filter(j => j.role && j.productionName);

          if (validJobs.length === 0) {
            throw new Error("No valid jobs found. Please ensure 'Role' and 'Production Name' are filled out.");
          }

          validJobs.forEach(job => api.jobs.add(job));
          api.jobs.incrementBulkUploadCount();

          alert(`Successfully uploaded ${validJobs.length} jobs!`);
          onComplete();
          
        } catch (err: any) {
          console.error(err);
          setError(err.message || "Failed to parse CSV");
        } finally {
          setUploading(false);
          e.target.value = ''; 
        }
      }
    });
  };

  if (isGated) {
     return (
        <div className="p-12 glass-ui border-accent/20 text-center space-y-8 animate-in fade-in">
           <div className="w-16 h-16 bg-accent/20 border border-accent/40 rounded-full flex items-center justify-center mx-auto">
              <Lock className="text-accent" size={24} />
           </div>
           <div className="space-y-3">
              <Badge color="accent" className="italic uppercase tracking-widest">A-List Upgrade Required</Badge>
              <h3 className="text-2xl font-serif italic text-white uppercase tracking-tight">Bulk Trial Completed.</h3>
              <p className="text-sm text-white/40 italic leading-relaxed max-w-sm mx-auto">
                 You've used your one-time bulk ingest. Upgrade to A-List to import unlimited professional history.
              </p>
           </div>
           <Button className="h-14 px-10 uppercase italic text-[10px] tracking-widest">Upgrade to A-List</Button>
        </div>
     );
  }

  return (
    <div className="p-8 border-2 border-dashed border-white/10 text-center bg-white/[0.02] hover:border-accent/40 transition-colors group">
      <div className="mb-6 space-y-2">
        <h3 className="text-xl font-serif italic text-white">Ingest Production History</h3>
        <p className="text-sm text-white/40 italic leading-relaxed">
          Use our <a href="https://docs.google.com/spreadsheets/d/1Np119wruDAChusfx-Yr_IytthsNjqQgAEfJoGexNAO8/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:text-white transition-colors">Google Sheet Template</a> to format your history for import.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-400 p-4 mb-6 flex items-center justify-center gap-2 border border-red-500/20 text-xs italic uppercase tracking-widest">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <label className="cursor-pointer inline-flex items-center gap-4 bg-white text-black px-10 py-4 hover:bg-accent transition-all font-black text-[11px] uppercase tracking-[0.4em]">
        <Upload size={18} />
        {uploading ? "Processing Set Data..." : "Select CSV File"}
        <input 
          type="file" 
          accept=".csv" 
          className="hidden" 
          onChange={handleFileUpload}
          disabled={uploading} 
        />
      </label>
      
      {!user?.isPremium && (
         <p className="text-[10px] text-white/10 uppercase tracking-widest font-black mt-6 italic">One-time free trial ingest included with Indie accounts.</p>
      )}
    </div>
  );
};
