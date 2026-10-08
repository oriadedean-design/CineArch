import React, { useState } from 'react';
import Papa from 'papaparse';
import { api } from '../services/storage';
import { IMPORT_FIELDS, TEMPLATE_CSV, buildImport, guessMapping, type ImportField, type ImportResult } from '../services/job_import';
import { Upload, CheckCircle, Settings2, ArrowRight, Download, AlertTriangle } from 'lucide-react';
import { Button, Select, Badge } from './ui';

/**
 * Spreadsheet import: pick a CSV, match its columns, review what will be
 * added (totals, problem rows, duplicates), then import. Rows are priced
 * with the same union rules as the job form.
 */

type Step = 'IDLE' | 'MAPPING' | 'REVIEW' | 'DONE';

const money = (n: number) => `$${n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const BulkJobUpload = ({ userId, onComplete }: { userId: string, onComplete: () => void }) => {
  const [step, setStep] = useState<Step>('IDLE');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<ImportField, string>>>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [imported, setImported] = useState(0);

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'cinearch-jobs-template.csv' });
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';  // allow re-picking the same file
    if (!file) return;
    if (/\.(xlsx?|numbers)$/i.test(file.name)) {
      setError('Save the spreadsheet as CSV first (File → Download / Save as → CSV), then upload that file.');
      return;
    }
    setError(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: h => h.trim(),
      complete: (parsed) => {
        const fields = (parsed.meta.fields ?? []).filter(Boolean);
        if (parsed.data.length === 0 || fields.length === 0) {
          setError('That file has no rows. The first row should be the column names.');
          return;
        }
        setHeaders(fields);
        setRows(parsed.data);
        setMapping(guessMapping(fields));
        setStep('MAPPING');
      },
      error: (err) => setError(`Couldn't read the file: ${err.message}`),
    });
  };

  const review = async () => {
    setBusy(true);
    setError(null);
    try {
      const existing = userId && userId !== 'anon' ? await api.jobs.listForClient(userId) : await api.jobs.list();
      const user = await api.auth.getUser();
      setResult(await buildImport(rows, mapping, { userId, defaultProvince: user?.province || 'Ontario', existing }));
      setStep('REVIEW');
    } catch (e: any) {
      setError(`Couldn't check the rows: ${e.message || 'unknown error'}`);
    } finally {
      setBusy(false);
    }
  };

  const importJobs = async () => {
    if (!result) return;
    setBusy(true);
    setError(null);
    try {
      await api.jobs.addMany(result.jobs.map((j, i) => ({ ...j, id: `import_${Date.now()}_${i}` })), userId);
      setImported(result.jobs.length);
      setStep('DONE');
      setTimeout(() => { onComplete(); setStep('IDLE'); setResult(null); }, 1500);
    } catch (e: any) {
      setError(`Import failed: ${e.message || 'unknown error'}`);
    } finally {
      setBusy(false);
    }
  };

  const missingRequired = IMPORT_FIELDS.filter(f => f.required && !mapping[f.key]);
  const hasHours = !!(mapping.hoursPerDay || mapping.totalHours);

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="text-sm text-red-400 italic">{error}</p>}

      {step === 'IDLE' && (
        <div className="border-2 border-dashed border-white/20 p-8 md:p-12 text-center glass-ui space-y-6">
          <Upload className="mx-auto text-white/40" size={32} />
          <div className="space-y-2">
            <h4 className="text-xl font-serif italic text-white">Import your work history</h4>
            <p className="text-[11px] text-white/50 uppercase tracking-widest italic">
              A CSV from Excel, Google Sheets, Numbers, EP Canada or Cast &amp; Crew. One row per job or run of days.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <label className="cursor-pointer">
              <input type="file" accept=".csv,.tsv,.txt,text/csv" className="hidden" onChange={handleFile} />
              <span className="inline-flex items-center justify-center h-14 px-8 border border-accent bg-accent text-black text-xs font-black uppercase tracking-widest">Choose CSV file</span>
            </label>
            <Button variant="outline" onClick={downloadTemplate} className="h-14 border-white/20 flex items-center justify-center">
              <Download size={14} className="mr-3" /> Download template
            </Button>
          </div>
        </div>
      )}

      {step === 'MAPPING' && (
        <div className="glass-ui p-6 md:p-10 space-y-8 animate-in zoom-in duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <div className="flex items-center gap-4">
              <Settings2 size={20} className="text-accent" />
              <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-white italic">Match your columns</h4>
            </div>
            <Badge color="accent">{rows.length} rows</Badge>
          </div>

          <div className="grid gap-4">
            {IMPORT_FIELDS.map(field => (
              <div key={field.key} className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-white/70 italic">
                    {field.label}{field.required && <span className="text-accent"> *</span>}
                  </label>
                  {field.hint && <p className="text-[11px] text-white/30 italic">{field.hint}</p>}
                </div>
                <Select
                  className="h-12 min-h-0 py-2 md:min-w-[260px] text-base"
                  value={mapping[field.key] || ''}
                  onChange={e => setMapping({ ...mapping, [field.key]: e.target.value || undefined })}
                >
                  <option value="" className="bg-black">— Not in my file —</option>
                  {headers.map(h => <option key={h} value={h} className="bg-black">{h}</option>)}
                </Select>
              </div>
            ))}
          </div>

          {!hasHours && <p className="text-xs text-white/50 italic">Without an hours column, jobs are imported with 0 hours and won't count toward hour-based union requirements.</p>}

          <div className="pt-4 flex justify-end gap-4">
            <Button variant="ghost" onClick={() => setStep('IDLE')}>Start over</Button>
            <Button onClick={review} isLoading={busy} disabled={missingRequired.length > 0}>
              Check rows <ArrowRight className="ml-4" size={14} />
            </Button>
          </div>
        </div>
      )}

      {step === 'REVIEW' && result && (
        <div className="glass-ui p-6 md:p-10 space-y-8 animate-in zoom-in duration-300">
          <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-white italic border-b border-white/10 pb-6">Ready to import</h4>

          <dl className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              ['Jobs', result.totals.rows.toString()],
              ['Hours worked', result.totals.hours.toLocaleString('en-CA')],
              ['Overtime hours', result.totals.overtimeHours.toLocaleString('en-CA')],
              ['Gross pay', money(result.totals.gross)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</dt>
                <dd className="text-2xl font-serif italic text-white">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-white/50 italic">
            {result.totals.union} on union sets, {result.totals.nonUnion} non-union.
            {result.duplicates > 0 && ` ${result.duplicates} already on your slate (same production, role and date) will be skipped.`}
          </p>

          {result.totals.belowScale > 0 && (
            <p className="flex items-start gap-2 text-sm text-amber-300 italic">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {result.totals.belowScale} union {result.totals.belowScale === 1 ? 'job is' : 'jobs are'} below the union minimum for the position. Check the rate, or raise it with the union.
            </p>
          )}
          {result.ambiguousDates && (
            <p className="flex items-start gap-2 text-sm text-amber-300 italic">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" /> Dates like 03/04/2026 were read as month/day (March 4). If your file uses day/month, change those dates to YYYY-MM-DD and upload again.
            </p>
          )}

          {result.errors.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-red-400 italic">{result.errors.length} {result.errors.length === 1 ? 'row needs' : 'rows need'} fixing and won't be imported:</p>
              <ul className="text-xs text-white/60 space-y-1 max-h-48 overflow-y-auto">
                {result.errors.slice(0, 100).map(e => <li key={e.row}>Row {e.row}: {e.message}</li>)}
              </ul>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-4">
            <Button variant="ghost" onClick={() => setStep('MAPPING')}>Back</Button>
            <Button onClick={importJobs} isLoading={busy} disabled={result.jobs.length === 0}>
              Import {result.jobs.length} {result.jobs.length === 1 ? 'job' : 'jobs'} <ArrowRight className="ml-4" size={14} />
            </Button>
          </div>
        </div>
      )}

      {step === 'DONE' && (
        <div className="p-12 text-center glass-ui animate-in fade-in zoom-in duration-500">
          <CheckCircle className="mx-auto mb-6 text-accent" size={48} />
          <h4 className="text-3xl font-serif italic text-white uppercase">Ledger Locked.</h4>
          <p className="text-[11px] text-white/50 uppercase tracking-widest italic mt-4">{imported} jobs added</p>
        </div>
      )}
    </div>
  );
};
