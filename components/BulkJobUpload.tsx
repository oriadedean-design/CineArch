
import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { api } from '../services/storage';
import { Job, UNIONS } from '../types';
import { Upload, AlertCircle, CheckCircle, Settings2, ArrowRight } from 'lucide-react';
import { Button, Input, Select, Badge } from './ui';

/**
 * THE INGESTOR v2.0
 * Includes a Column Mapping step to handle various industry payroll exports.
 */

export const BulkJobUpload = ({ userId, onComplete }: { userId: string, onComplete: () => void }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [step, setStep] = useState<'IDLE' | 'MAPPING' | 'FINISHING'>('IDLE');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const REQUIRED_FIELDS = [
    { key: 'productionName', label: 'Production Name' },
    { key: 'role', label: 'Role' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'grossEarnings', label: 'Gross Earnings' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          setCsvHeaders(Object.keys(results.data[0]));
          setRawRows(results.data);
          setStep('MAPPING');
        } else {
          setError("CSV appears empty.");
        }
      }
    });
  };

  const processImport = async () => {
    setUploading(true);
    try {
      const jobsToInsert: Job[] = rawRows.map((row) => {
        const earningsRaw = row[mapping['grossEarnings']]?.toString() || '0';
        const isUnionRaw = (row[mapping['unionName']] || '').length > 0;

        return {
          id: `import_${Date.now()}_${Math.random()}`,
          userId: userId,
          productionName: row[mapping['productionName']] || 'Untitled Import',
          role: row[mapping['role']] || 'Crew',
          startDate: row[mapping['startDate']] || new Date().toISOString(),
          grossEarnings: parseFloat(earningsRaw.replace(/[$,]/g, '')) || 0,
          isUnion: isUnionRaw,
          unionName: row[mapping['unionName']],
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
          documentCount: 0
        } as Job;
      });

      for (const job of jobsToInsert) {
        await api.jobs.add(job);
      }

      setStep('FINISHING');
      setTimeout(() => {
        onComplete();
        setStep('IDLE');
      }, 1500);
    } catch (e) {
      setError("Import failed during processing.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {step === 'IDLE' && (
        <label className="block w-full cursor-pointer">
          <div className="border-2 border-dashed border-white/10 p-12 text-center glass-ui hover:border-accent transition-all group">
            <Upload className="mx-auto mb-6 text-white/20 group-hover:text-accent" size={32} />
            <h4 className="text-xl font-serif italic text-white mb-2">Initialize Roster Ingest</h4>
            <p className="text-[10px] text-white/40 uppercase tracking-widest italic mb-8">Supports EP Canada, Cast & Crew, or Manual CSVs</p>
            <Button variant="outline" className="h-14 border-white/10 pointer-events-none">Select Data Source</Button>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </div>
        </label>
      )}

      {step === 'MAPPING' && (
        <div className="glass-ui p-10 space-y-8 animate-in zoom-in duration-300">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
             <div className="flex items-center gap-4">
                <Settings2 size={20} className="text-accent" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white italic">Column Alignment</h4>
             </div>
             <Badge color="accent">Step 2 of 3</Badge>
          </div>

          <div className="grid gap-6">
            {REQUIRED_FIELDS.map(field => (
              <div key={field.key} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/60 italic">{field.label}</label>
                <Select 
                  className="h-14 min-w-[240px]" 
                  value={mapping[field.key] || ''} 
                  onChange={e => setMapping({...mapping, [field.key]: e.target.value})}
                >
                  <option value="">Select CSV Header</option>
                  {csvHeaders.map(h => <option key={h} value={h} className="bg-black">{h}</option>)}
                </Select>
              </div>
            ))}
          </div>

          <div className="pt-8 flex justify-end gap-4">
             <Button variant="ghost" onClick={() => setStep('IDLE')}>Discard</Button>
             <Button onClick={processImport} isLoading={uploading} disabled={REQUIRED_FIELDS.some(f => !mapping[f.key])}>
               Action Mark <ArrowRight className="ml-4" size={14} />
             </Button>
          </div>
        </div>
      )}

      {step === 'FINISHING' && (
        <div className="p-12 text-center glass-ui animate-in fade-in zoom-in duration-500">
           <CheckCircle className="mx-auto mb-6 text-accent" size={48} />
           <h4 className="text-3xl font-serif italic text-white uppercase">Ledger Locked.</h4>
           <p className="text-[10px] text-white/40 uppercase tracking-widest italic mt-4">Synchronization Complete</p>
        </div>
      )}
    </div>
  );
};
