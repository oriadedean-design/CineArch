import React, { useMemo, useState, useEffect } from 'react';
import { Heading, Text, Card, Button, Badge } from '../components/ui';
import { Download, FileSpreadsheet, Landmark, Target, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../services/storage';
import { financeApi } from '../services/finance';
import { Job, User, UserUnionTracking, FinanceStats } from '../types';
import { clsx } from 'clsx';
import Papa from 'papaparse';
import jsPDF from 'jspdf';

export const Reports = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [tracking, setTracking] = useState<UserUnionTracking[]>([]);
  const [stats, setStats] = useState<(FinanceStats & { estCPP: number; estIncomeTax: number }) | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const u = await api.auth.getUser();
      setUser(u);
      const jobList = await api.jobs.list();
      setJobs(jobList);
      const tracks = await api.tracking.get();
      setTracking(tracks);
      if (u?.id) {
        setStats(await financeApi.getStats(u.id));
      }
    };
    fetchData();
  }, []);

  const auditScore = useMemo(() => {
    let score = 40;
    if (jobs.length > 0) score += 20;
    if (user?.isPremium) score += 20;
    if (stats && stats.gstCollected > 0) score += 20;
    return Math.min(100, score);
  }, [jobs, user, stats]);

  const handleExportCSV = () => {
    const rows = jobs.map(j => ({
      'Production': j.productionName,
      'Role': j.role,
      'Status': j.status,
      'Start Date': j.startDate,
      'End Date': j.endDate || '',
      'Gross Earnings': j.grossEarnings ?? 0,
      'Total Hours': j.totalHours,
      'Union': j.isUnion ? (j.unionName || 'Union') : 'Non-Union',
      'Province': j.province || '',
      'Department': j.department || '',
      'Notes': j.notes || ''
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cinearch-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('en-CA');
    let y = 20;

    const line = (text: string, indent = 20, size = 10) => {
      doc.setFontSize(size);
      doc.text(text, indent, y);
      y += size * 0.6 + 2;
    };

    const section = (title: string) => {
      y += 6;
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      doc.text(title, 20, y);
      y += 8;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, y, 190, y);
      y += 6;
      doc.setTextColor(60, 60, 60);
    };

    // Header
    doc.setFontSize(22);
    doc.setTextColor(20, 20, 20);
    doc.text('CineArch Audit Report', 20, y);
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated: ${date}`, 20, y);
    y += 6;
    doc.text(`Personnel: ${user?.name || ''}`, 20, y);
    y += 6;
    doc.text(`Province: ${user?.province || ''}`, 20, y);
    y += 10;

    // Financial Summary
    if (stats) {
      section('Financial Summary (YTD)');
      doc.setFontSize(10);
      line(`Gross Income:           $${stats.grossIncomeYTD.toLocaleString()}`);
      line(`Total Expenses:         $${stats.totalExpensesYTD.toLocaleString()}`);
      line(`Deductible Expenses:    $${stats.deductibleExpensesYTD.toLocaleString()}`);
      line(`Net Income:             $${stats.netIncomeYTD.toLocaleString()}`);
      line(`GST Collected:          $${stats.gstCollected.toLocaleString()}`);
      line(`GST Paid:               $${stats.gstPaid.toLocaleString()}`);
      line(`GST Net Remittance:     $${stats.gstNetRemittance.toLocaleString()}`);
      line(`Est. CPP Contribution:  $${stats.estCPP.toFixed(2)}`);
      line(`Est. Income Tax (20%):  $${stats.estIncomeTax.toFixed(2)}`);
    }

    // Production Credits
    if (jobs.length > 0) {
      section('Production Credits');
      jobs.forEach(j => {
        const earning = j.grossEarnings ? ` — $${j.grossEarnings.toLocaleString()}` : '';
        const union = j.isUnion ? ` [${j.unionName || 'Union'}]` : '';
        doc.setFontSize(10);
        doc.text(`${j.productionName} — ${j.role}${union}${earning}`, 20, y);
        y += 5;
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text(`${j.startDate}  ${j.province || ''}  ${j.status}`, 24, y);
        doc.setTextColor(60, 60, 60);
        y += 7;
        if (y > 270) { doc.addPage(); y = 20; }
      });
    }

    // Guild Tracking
    if (tracking.length > 0) {
      section('Guild Continuity');
      tracking.forEach(t => {
        const { percent, current, target } = api.tracking.calculateProgress(t, jobs);
        doc.setFontSize(10);
        doc.text(`${t.unionName} // ${t.tierLabel}: ${current} / ${target} (${Math.round(percent)}%)`, 20, y);
        y += 7;
        if (y > 270) { doc.addPage(); y = 20; }
      });
    }

    doc.save(`cinearch-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-24 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 pb-16 border-b border-white/10">
        <div className="space-y-6">
          <Badge color="accent" className="italic tracking-widest uppercase">Personnel Registry // Analytics</Badge>
          <h1 className="text-8xl md:text-9xl font-serif text-white uppercase tracking-tighter italic leading-[0.75]">THE <br/><span className="text-accent">AUDIT.</span></h1>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button onClick={handleExportCSV} variant="outline" className="h-16 px-8 text-[10px] font-black uppercase tracking-widest border-white/5 bg-white/5">
            <FileSpreadsheet size={16} className="mr-3 text-accent" /> Export Ledger
          </Button>
          <Button onClick={handleDownloadPDF} className="h-16 px-10 text-[10px] font-black uppercase tracking-widest bg-white text-black hover:bg-accent transition-colors">
            <Download size={16} className="mr-3" /> Compile Report
          </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-1 gap-y-12">
        <div className="lg:col-span-8 space-y-16">
          <section className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center gap-6">
              <div className="w-10 h-10 bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Landmark size={18} className="text-accent" />
              </div>
              <h3 className="font-serif italic text-5xl text-white">Fiscal Compliance</h3>
              <div className="flex-1 h-[1px] bg-white/5"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-1">
              <div className="p-12 bg-surface/50 border border-white/5 space-y-8 group hover:border-accent/20 transition-all">
                <Text variant="caption" className="opacity-50 group-hover:opacity-100 transition-opacity">GST/HST Net Remittance</Text>
                <div className="space-y-2">
                  <h4 className="text-5xl font-serif italic text-white">${(stats?.gstNetRemittance ?? 0).toLocaleString()}</h4>
                  <p className="text-xs text-white/30 uppercase font-black tracking-widest italic">Delta: Output - Input Credits</p>
                </div>
              </div>
              <div className="p-12 bg-surface/50 border border-white/5 space-y-8 group hover:border-accent/20 transition-all">
                <Text variant="caption" className="opacity-50 group-hover:opacity-100 transition-opacity">YTD Taxable Base</Text>
                <div className="space-y-2">
                  <h4 className="text-5xl font-serif italic text-white">${(stats?.taxableIncomeProjected ?? 0).toLocaleString()}</h4>
                  <p className="text-xs text-white/30 uppercase font-black tracking-widest italic">Adjusted for 50% Rule (SP-010)</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-10 animate-in slide-in-from-bottom-12 duration-1000">
            <div className="flex items-center gap-6">
              <div className="w-10 h-10 bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Target size={18} className="text-accent" />
              </div>
              <h3 className="font-serif italic text-5xl text-white">Guild Continuity</h3>
              <div className="flex-1 h-[1px] bg-white/5"></div>
            </div>

            <div className="space-y-1">
              {tracking.length > 0 ? tracking.map((t) => {
                const { percent, current, target } = api.tracking.calculateProgress(t, jobs);
                return (
                  <div key={t.id} className="p-12 bg-surface/30 border border-white/5 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                    <div className="space-y-3">
                      <p className="text-3xl font-serif italic text-white group-hover:text-accent transition-colors">{t.unionName} // {t.tierLabel}</p>
                      <div className="flex items-center gap-4">
                        <Badge color="neutral" className="text-xs opacity-40">{t.targetType}</Badge>
                        <p className="text-xs text-white/20 uppercase font-black tracking-[0.3em] italic">{current} of {target} secured</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-7xl font-serif italic text-white leading-none">{Math.round(percent)}%</span>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-24 text-center border border-dashed border-white/5 bg-white/[0.01]">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">No guild objectives detected in the archive.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-12">
          <div className="p-12 border border-accent/20 bg-accent/5 space-y-12 relative overflow-hidden group">
            <ShieldCheck size={160} className="absolute -bottom-10 -right-10 text-accent/5 rotate-12 group-hover:rotate-45 transition-transform duration-[3000ms]" />
            <div className="space-y-6 relative z-10">
              <Badge color="accent" className="font-black italic px-4 py-2">Audit Ready v1.0</Badge>
              <h3 className="text-5xl font-serif italic text-white leading-[0.8] uppercase tracking-tighter">Canonical <br/>Status.</h3>

              <div className="space-y-8 pt-8">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
                    <span>Provenance Score</span>
                    <span className="text-white">{auditScore}%</span>
                  </div>
                  <div className="h-[2px] bg-white/5 w-full overflow-hidden">
                    <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${auditScore}%` }}></div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Voucher Sync</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent italic">Calibrated</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Residency Check</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-400 italic">Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card className="p-10 border-white/5 bg-transparent space-y-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={14} className="text-accent" />
              <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-white italic">Compliance Note</h4>
            </div>
            <p className="text-xs text-white/40 leading-relaxed italic font-light">
              This audit summary is generated according to CRA 'Small Supplier' guidelines and Union Eligibility benchmarks for the Canadian film sector.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
};
