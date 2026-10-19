
import React, { useState, useEffect, useRef } from 'react';
import { Heading, Text, Card, Button, Input, Select, Badge, ProgressBar } from '../components/ui';
import { Lock, Crown, Plus, TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle, Calculator, PieChart, FileText, Landmark, Wallet, BadgeCheck, Upload, Sheet } from 'lucide-react';
import { api } from '../services/storage';
import { financeApi, type WalletStats } from '../services/finance';
import { User, FinanceTransaction, FinanceStats, UserUnionTracking, PLANS } from '../types';
import { findUnion } from '../services/engine';
import { clsx } from 'clsx';

type Filter = 'ALL' | 'INCOME' | 'EXPENSE' | 'NEEDS_PROOF';
const FILTERS: [Filter, string][] = [['ALL', 'All'], ['INCOME', 'Income'], ['EXPENSE', 'Expenses'], ['NEEDS_PROOF', 'Needs proof']];

export const Finance = () => {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [uploading, setUploading] = useState<string | null>(null);
  const [proofError, setProofError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const proofFor = useRef<FinanceTransaction | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tracking, setTracking] = useState<UserUnionTracking[]>([]);

  const [form, setForm] = useState({
    type: 'EXPENSE',
    category: 'MEALS_ENTERTAINMENT',
    amount: '',
    tax: '',
    desc: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const initFinance = async () => {
      const u = await api.auth.getUser();
      setUser(u);
      if (u?.isPremium && u.id) {
        setTransactions(await financeApi.list(u.id));
        setStats(await financeApi.getStats(u.id, undefined, { payType: u.payType, province: u.province, gstMethod: u.gstMethod }));
        setTracking(await api.tracking.get());
      }
    };
    initFinance();
  }, []);

  const isPremium = user?.isPremium;
  const lit = transactions.filter(t => t.proofPath).length;
  const shown = transactions.filter(t =>
    filter === 'ALL' ? true : filter === 'NEEDS_PROOF' ? !t.proofPath : t.type === filter);

  const chooseProof = (tx: FinanceTransaction) => { proofFor.current = tx; setProofError(''); fileInput.current?.click(); };
  const onProofChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; const tx = proofFor.current;
    e.target.value = '';
    if (!file || !tx) return;
    setUploading(tx.id);
    try {
      const path = await financeApi.attachProof(tx, file);
      setTransactions(ts => ts.map(t => t.id === tx.id ? { ...t, proofPath: path } : t));
    } catch (err: any) {
      setProofError(`Couldn't upload: ${err.message || 'unknown error'}`);
    } finally { setUploading(null); }
  };
  const viewProof = async (tx: FinanceTransaction) => {
    const url = await financeApi.proofUrl(tx);
    if (url) window.open(url, '_blank', 'noopener');
  };
  const exportCsv = () => {
    const blob = new Blob([financeApi.toCsv(transactions)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'CineArch Wrap Wallet.csv'; a.click();
    URL.revokeObjectURL(a.href);
  };

  const refreshData = async () => {
    if (!user?.id) return;
    setTransactions(await financeApi.list(user.id));
    setStats(await financeApi.getStats(user.id, undefined, { payType: user.payType, province: user.province, gstMethod: user.gstMethod }));
    setTracking(await api.tracking.get());
  };

  const handleAddTransaction = async () => {
    if (!user?.id) return;
    const amount = parseFloat(form.amount) || 0;
    const tax = parseFloat(form.tax) || 0;
    await financeApi.add({
      userId: user.id,
      type: form.type as any,
      category: form.category,
      amountBeforeTax: amount,
      taxAmount: tax,
      totalAmount: amount + tax,
      description: form.desc,
      dateIncurred: form.date,
      businessUsePercent: 100
    });
    setIsAddModalOpen(false);
    await refreshData();
    setForm({ type: 'EXPENSE', category: 'MEALS_ENTERTAINMENT', amount: '', tax: '', desc: '', date: new Date().toISOString().split('T')[0] });
  };

  if (!isPremium) {
    return (
      <div className="relative min-h-[80vh] flex flex-col items-center justify-center p-6 overflow-hidden border border-white/10 bg-surface">
        <div className="absolute inset-0 blur-xl opacity-30 pointer-events-none select-none">
          <div className="grid grid-cols-3 gap-4 p-8">
            <div className="h-32 bg-white/10 rounded-xl"></div>
            <div className="h-32 bg-white/10 rounded-xl"></div>
            <div className="h-32 bg-white/10 rounded-xl"></div>
            <div className="col-span-3 h-64 bg-white/5 rounded-xl"></div>
          </div>
        </div>
        <div className="relative z-10 max-w-lg text-center space-y-8 animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-accent/20 flex items-center justify-center mx-auto ring-1 ring-accent/50 shadow-[0_0_30px_rgba(250,204,21,0.4)]">
            <Lock className="w-8 h-8 text-accent" />
          </div>
          <div className="space-y-4">
            <h1 className="heading-huge text-white italic uppercase leading-none">Wrap <br/><span className="text-accent">Wallet.</span></h1>
            <Text className="text-gray-400 italic">
              Wrap Wallet comes with A-List Pro. Your film money in one place: what you earned, what you spent, your GST/HST line and what to set aside for tax.
            </Text>
          </div>
          <ul className="text-left space-y-3 border-t border-white/10 pt-6">
            {PLANS.pro.benefits.slice(1).map(b => (
              <li key={b} className="flex items-start gap-3 text-sm text-white/70 italic">
                <span className="text-accent font-bold">✓</span><span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-4">
            <Button disabled className="w-full h-20 text-[10px] tracking-[0.5em] bg-white/20 text-white/40 cursor-not-allowed font-black">
              <Crown className="w-5 h-5 mr-3" /> Go A-List Pro · $15/mo
            </Button>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">
              Upgrades open soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-40">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-white/10 pb-12">
        <div className="space-y-2">
          <Badge color="accent" className="italic tracking-widest">The Business Side</Badge>
          <h1 className="heading-huge uppercase italic leading-none">WRAP <br/><span className="text-accent">WALLET.</span></h1>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="h-16 px-10 text-[10px] tracking-[0.4em] font-black">
          <Plus className="w-4 h-4 mr-3" /> Add to the ledger
        </Button>
      </header>

      {/* Stats Overview */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-1">
          <div className="p-10 glass-ui space-y-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Income</p>
            <div className="text-4xl font-serif text-white italic">${stats.grossIncomeYTD.toLocaleString()}</div>
          </div>
          <div className="p-10 glass-ui space-y-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Expenses</p>
            <div className="text-4xl font-serif text-white italic">${stats.totalExpensesYTD.toLocaleString()}</div>
          </div>
          <div className="p-10 glass-ui space-y-6 border-accent/20 bg-accent/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-accent italic">Deductible</p>
            <div className="text-4xl font-serif text-white italic">${stats.deductibleExpensesYTD.toLocaleString()}</div>
          </div>
          <div className="p-10 glass-ui space-y-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Net (taxable)</p>
            <div className="text-4xl font-serif text-accent italic">${stats.taxableIncomeProjected.toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-12">
        {/* GST Monitor */}
        <div className="lg:col-span-2 glass-ui p-12 space-y-12">
          <div className="flex justify-between items-center border-b border-white/5 pb-8">
            <div className="space-y-1">
              <h3 className="font-serif italic text-4xl text-white">The $30k GST/HST Line</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Past $30,000 in a year, you register for GST/HST</p>
            </div>
            <Badge color="neutral">Limit: $30k</Badge>
          </div>

          {stats && (
            <div className="space-y-8">
              <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                <span className="text-white/40 italic">Current Gross</span>
                <span className={stats.selfEmployedIncome >= 30000 ? "text-accent" : "text-white"}>
                  ${stats.selfEmployedIncome.toLocaleString()}
                </span>
              </div>
              <ProgressBar progress={financeApi.getThresholdProgress(stats.selfEmployedIncome)} />
              <div className="flex justify-between text-sm text-white/60">
                <span>{stats.quickMethodRate != null ? `GST/HST owing (Quick Method, ${(stats.quickMethodRate * 100).toFixed(1)}%)` : 'GST/HST owing (charged minus paid back; meals at half)'}</span>
                <span className="text-white">${stats.gstNetRemittance.toLocaleString()}</span>
              </div>
              <div className="border-t border-white/10 pt-6 space-y-2 text-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Set aside</p>
                {user?.payType === 't4' ? (
                  <p className="text-white/60 italic">Tax and CPP come off your T4 pay, so there's nothing extra to set aside on it.</p>
                ) : stats.setAside ? (
                  <>
                    <div className="flex justify-between text-white/60"><span>{stats.setAside.pensionPlan} (both halves)</span><span className="text-white">${stats.setAside.pension.toLocaleString()}</span></div>
                    <div className="flex justify-between text-white/60"><span>Income tax</span><span className="text-white">${stats.setAside.incomeTax.toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold text-white"><span>Total</span><span>${stats.setAside.total.toLocaleString()}</span></div>
                    <p className="text-xs text-white/40 italic">{stats.setAside.year} federal and {user?.province} rates, after the basic personal amount{stats.employmentIncome > 0 ? ', on top of your T4 pay' : ''}. Rough estimate: other credits and deductions aren't included. Check with an accountant.</p>
                    {!user?.payType && <p className="text-xs text-accent">Set how you're paid in Settings: T4 pay has its tax taken off already.</p>}
                  </>
                ) : (
                  <p className="text-white/60 italic">Add your province in Settings to estimate tax.</p>
                )}
              </div>

              {financeApi.checkGstThreshold(stats.selfEmployedIncome) && (
                <div className="p-8 bg-accent/5 border border-accent/20 flex gap-6 items-start">
                  <AlertTriangle className="text-accent" size={24} />
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent italic">Time to register</p>
                    <p className="text-sm text-white/60 italic leading-relaxed">Threshold exceeded. Register for GST/HST to remain in compliance with the CRA.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Union Fee Projections */}
        <div className="p-12 glass-ui space-y-10 border-accent/20 bg-accent/5">
          <div className="flex items-center gap-4">
            <Landmark size={20} className="text-accent" />
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-accent">Union Fees Ahead</h4>
          </div>
          <div className="space-y-8">
            {tracking.length > 0 ? tracking.map(t => {
              const master = findUnion(t.unionTypeId) ?? findUnion(t.unionName);
              const fee = master?.applicationFee;
              return (
                <div key={t.id} className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40 italic">
                    <span>{t.unionName} Application</span>
                    <span className="text-white">{fee != null ? `$${fee}` : 'Application cost not yet added'}</span>
                  </div>
                  <p className="text-xs text-white/20 leading-relaxed italic">{master?.applicationFeeNotes ?? `Estimated initiation for ${t.tierLabel}.`}</p>
                </div>
              );
            }) : (
              <p className="text-xs text-white/20 italic">No union picked yet. Choose one in Your Config to see what joining costs.</p>
            )}
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h3 className="font-serif italic text-3xl md:text-4xl text-white">Ledger</h3>
          <button onClick={exportCsv} disabled={transactions.length === 0}
            className="h-11 px-5 border border-white/20 text-[10px] font-black uppercase tracking-[0.3em] text-white hover:border-accent hover:text-accent disabled:opacity-30 flex items-center gap-2">
            <Sheet size={14} /> Export spreadsheet
          </button>
        </div>

        {transactions.length > 0 && (
          <div className="glass-ui p-5 flex flex-wrap items-center gap-4" role="status">
            <BadgeCheck size={28} className={lit === transactions.length ? 'text-green-400' : 'text-white/30'} />
            <div className="flex-1 min-w-[12rem]">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-400">Green Lit</p>
              <p className="text-white">{lit} of {transactions.length} backed with proof</p>
            </div>
            {lit < transactions.length && (
              <button onClick={() => setFilter('NEEDS_PROOF')} className="h-10 px-4 bg-accent/20 text-accent text-xs font-black uppercase tracking-widest hover:bg-accent hover:text-black">
                {transactions.length - lit} need proof
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter the ledger">
          {FILTERS.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}
              className={clsx("h-10 px-4 text-xs font-black uppercase tracking-widest border", filter === id ? "bg-white text-black border-white" : "text-white/60 border-white/10 hover:border-white/30")}>
              {label}
            </button>
          ))}
        </div>

        <input ref={fileInput} type="file" accept="image/*,application/pdf" className="hidden" onChange={onProofChosen} />
        {proofError && <p className="text-xs text-red-400">{proofError}</p>}

        <div className="border border-white/5 divide-y divide-white/5">
          {shown.length === 0 && (
            <p className="py-16 text-center text-white/20 italic uppercase font-black tracking-widest text-sm">
              {transactions.length === 0 ? 'Nothing in the can yet' : filter === 'NEEDS_PROOF' ? 'Every entry is backed with proof' : 'Nothing here'}
            </p>
          )}
          {shown.map(tx => (
            <div key={tx.id} className="p-5 flex flex-wrap items-center gap-4 hover:bg-white/[0.02]">
              <div className="flex-1 min-w-[12rem]">
                <p className="font-serif italic text-lg text-white truncate">{tx.description}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-1">
                  {tx.category.replace(/_/g, ' ')} · {tx.dateIncurred}{tx.ruleTags?.includes('MEALS_50_LIMIT') ? ' · 50% rule' : ''}
                </p>
              </div>
              <span className={clsx("font-serif italic text-lg shrink-0", tx.type === 'INCOME' ? "text-accent" : "text-white")}>
                {tx.type === 'INCOME' ? '+' : '-'}${tx.totalAmount.toFixed(2)}
              </span>
              {tx.proofPath ? (
                <span className="flex items-center gap-3 shrink-0">
                  <button onClick={() => viewProof(tx)} className="text-[10px] font-black uppercase tracking-widest text-green-400 flex items-center gap-1 hover:underline"><BadgeCheck size={14} /> Green Lit · view</button>
                  <button onClick={() => chooseProof(tx)} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">Replace</button>
                </span>
              ) : (
                <button onClick={() => chooseProof(tx)} disabled={uploading === tx.id}
                  className="shrink-0 h-10 px-4 border border-accent/40 text-accent text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-black disabled:opacity-40 flex items-center gap-2">
                  <Upload size={12} /> {uploading === tx.id ? 'Uploading…' : 'Back it with proof'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="w-full max-w-xl glass-ui p-12 border-white/20 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-serif italic text-4xl text-white">Add to the ledger</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/20 hover:text-white transition-colors">CUT</button>
            </div>
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Entry Type</label>
                  <Select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="h-14 text-sm font-serif italic">
                    <option value="EXPENSE" className="bg-black">Expense</option>
                    <option value="INCOME" className="bg-black">Income</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Date</label>
                  <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="h-14 text-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Category</label>
                <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="h-16 text-sm font-serif italic">
                  {form.type === 'EXPENSE' ? (
                    <>
                      <option value="MEALS_ENTERTAINMENT" className="bg-black">Meals (50% Rule)</option>
                      <option value="UNION_DUES" className="bg-black">Union Dues</option>
                      <option value="APPLICATION_FEE" className="bg-black">Initiation/App Fee</option>
                      <option value="GEAR_SMALL_TOOLS" className="bg-black">Gear & Small Tools</option>
                      <option value="OFFICE_SUPPLIES" className="bg-black">Office Supplies</option>
                    </>
                  ) : (
                    <>
                      <option value="SERVICE_FEES" className="bg-black">Service Fees</option>
                      <option value="RESIDUAL" className="bg-black">Residuals</option>
                    </>
                  )}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Description</label>
                <Input value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} placeholder="e.g. Local 634 App Fee" className="h-16 text-lg italic" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Subtotal ($)</label>
                  <Input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="h-14 text-lg font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">GST/HST ($)</label>
                  <Input type="number" value={form.tax} onChange={e => setForm({...form, tax: e.target.value})} className="h-14 text-lg font-mono" />
                </div>
              </div>

              <div className="pt-8">
                <Button onClick={handleAddTransaction} className="w-full h-20 text-[11px] font-black uppercase tracking-[0.5em] bg-white text-black hover:bg-accent">Add it</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
