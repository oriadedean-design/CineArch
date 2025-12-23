
import React, { useState } from 'react';
import Papa from 'papaparse';
import { api } from '../services/storage';
import { Job, UNIONS } from '../types';
import { Upload, AlertCircle } from 'lucide-react';

export const BulkJobUpload = ({ userId, onComplete }: { userId: string, onComplete: () => void }) => {
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

          // 1. Map CSV columns to Job columns based on the "Golden Master" Template
          const jobsToInsert: Job[] = rows.map((row) => {
            // Google Sheets exports checkboxes as "TRUE" or "FALSE" strings
            const isUnion = row['Is Union?']?.toString().toUpperCase() === 'TRUE';
            const unionName = isUnion ? row['Union / Guild'] : undefined;
            
            // Try to match union name to ID if possible
            const unionObj = UNIONS.find(u => u.name === unionName || u.name.includes(unionName || 'xyz'));

            return {
              id: `job_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: userId,
              
              // 1. Primary Context
              role: row['Role'] || 'Unknown Role',
              
              // 2. Metrics
              totalHours: parseFloat(row['Total Hours'] || '0'),
              // Note: Job type in types.ts doesn't strictly have totalDays, but we handle logic elsewhere.
              // We'll store it if we extend the type, or just rely on hours for now as per current schema.
              
              // 3. Dates (Handle potential empty strings)
              startDate: row['Start Date'] ? new Date(row['Start Date']).toISOString() : new Date().toISOString(),
              endDate: row['End Date'] ? new Date(row['End Date']).toISOString() : undefined,
              
              // 4. Union Logic
              isUnion: isUnion,
              // Only save the Union Name if "Is Union?" was checked
              unionName: unionName,
              unionTypeId: unionObj?.id,
              
              // 5. Production Details
              productionName: row['Production Name'] || 'Untitled Import',
              companyName: row['Company Name'] || '',
              province: row['Province'] || '',
              department: row['Department'] || '',
              
              // 6. Earnings (Strip '$' and ',' symbols)
              grossEarnings: parseFloat(row['Gross Earnings']?.replace(/[$,]/g, '') || '0'),
              
              status: 'CONFIRMED', // Bulk uploaded past jobs are assumed confirmed
              
              documentCount: 0,
              createdAt: new Date().toISOString()
            } as Job;
          });

          // 2. Validate Data
          // Ensure at least the Role and Production Name exist (minimal requirement)
          const validJobs = jobsToInsert.filter(j => j.role && j.productionName);

          if (validJobs.length === 0) {
            throw new Error("No valid jobs found. Please ensure 'Role' and 'Production Name' are filled out.");
          }

          // 3. Send to Storage (Simulating DB Insert)
          validJobs.forEach(job => api.jobs.add(job));

          alert(`Successfully uploaded ${validJobs.length} jobs!`);
          onComplete();
          
        } catch (err: any) {
          console.error(err);
          setError(err.message || "Failed to parse CSV");
        } finally {
          setUploading(false);
          // Reset file input so user can try again if needed
          e.target.value = ''; 
        }
      }
    });
  };

  return (
    <div className="p-6 border-2 border-dashed border-white/10 rounded-lg text-center bg-surfaceHighlight/20 hover:border-accent transition-colors group">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-textPrimary">Bulk Import Past Jobs</h3>
        <p className="text-sm text-textTertiary">
          Download our <a href="https://docs.google.com/spreadsheets/d/1Np119wruDAChusfx-Yr_IytthsNjqQgAEfJoGexNAO8/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-accent underline">Optimized Google Sheet Template</a>, fill it out, download as CSV, and upload here.
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 text-red-300 p-3 rounded-md mb-4 flex items-center justify-center gap-2 border border-red-500/30 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <label className="cursor-pointer inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-md hover:bg-gray-200 transition shadow-glow font-bold text-sm uppercase tracking-wide">
        <Upload size={18} />
        {uploading ? "Processing..." : "Select CSV File"}
        <input 
          type="file" 
          accept=".csv" 
          className="hidden" 
          onChange={handleFileUpload}
          disabled={uploading} 
        />
      </label>
    </div>
  );
};
