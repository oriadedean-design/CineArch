
import React, { useState, useEffect } from 'react';
import { Heading, Text, Card, Button, Input, Select, Badge, ProgressBar } from '../components/ui';
import { Lock, Crown, Plus, TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle, Calculator, PieChart, FileText, Landmark, Wallet } from 'lucide-react';
import { api } from '../services/storage';
import { financeApi } from '../services/finance';
import { User, FinanceTransaction, FinanceStats, UNIONS, UserUnionTracking } from '../types';
import { clsx } from 'clsx';

export const Finance = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tracking, setTracking] = useState<UserUnionTracking[]>([]);
  
  // Local Form State
  const [form, setForm] = useState({
      type: 'EXPENSE',
      category: 'MEALS_ENTERTAINMENT',
      amount: '',
      tax: '',
      desc: '',
      date: new Date().toISOString().split('T')[0]
  });

  // Handle async session retrieval and finance data initialization
  useEffect(() => {
    const initFinance = async () => {
      const u = await api.auth.getUser();
      setUser(u);
      if (u?.isPremium) {
        setTransactions(financeApi.list());
        setStats(financeApi.getStats());
        // Fix: Await async tracking retrieval
        const tracks = await api.tracking.get();
        setTracking(tracks);
      }
    };
    initFinance();
  }, []);

  const isPremium = user?.isPremium;

  const refreshData = async () => {
      setTransactions(financeApi.list());
      setStats(financeApi.getStats());
      // Fix: Await async tracking retrieval
      const tracks = await api.tracking.get();
      setTracking(tracks);
  };

  const handleUpgrade = async () => {
      if (user) {
          const updated = { ...user, isPremium: true };
          await api.auth.updateUser(updated);
          setUser(updated);
          refreshData();
      }
  };

  const handleAddTransaction = () => {
      const amount = parseFloat(form.amount) || 0;
      const tax = parseFloat(form.tax) || 0;
      financeApi.add({
          userId: user?.id || 'unknown',
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
      refreshData();
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
                          Unlock precision budgeting for the Canadian guild landscape. Automate tax compliance, track union initiation fees, and forecast your GST status.
                      </Text>
                  </div>
                  <Button onClick={handleUpgrade} className="w-full h-20 text-[10px] tracking-[0.5em] bg-white text-black hover:bg-accent font-black">
                      <Crown className="w-5 h-5 mr-3" /> Initialize Wallet // $15 mo
                  </Button>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-16 pb-40">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-white/10 pb-12">
        <div className="space-y-2">
           <Badge color="accent" className="italic tracking-widest">Financial Terminal</Badge>
           <h1 className="heading-huge uppercase italic leading-none">WRAP <br/><span className="text-accent">WALLET.</span></h1>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="h-16 px-10 text-[10px] tracking-[0.4em] font-black">
            <Plus className="w-4 h-4 mr-3" /> Log Transaction
        </Button>
      </header>

      {/* Stats Overview */}
      {stats && (
          <div className="grid md:grid-cols-4 gap-1">
             <div className="p-10 glass-ui space-y-6">
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Gross Scale</p>
                 <div className="text-4xl font-serif text-white italic">${stats.grossIncomeYTD.toLocaleString()}</div>
             </div>
             <div className="p-10 glass-ui space-y-6">
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Expenses</p>
                 <div className="text-4xl font-serif text-white italic">${stats.totalExpensesYTD.toLocaleString()}</div>
             </div>
             <div className="p-10 glass-ui space-y-6 border-accent/20 bg-accent/5">
                 <p className="text-[10px] font-black uppercase tracking-widest text-accent italic">Audit Safe Yield</p>
                 <div className="text-4xl font-serif text-white italic">${stats.deductibleExpensesYTD.toLocaleString()}</div>
             </div>
             <div className="p-10 glass-ui space-y-6">
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Est. Taxable Base</p>
                 <div className="text-4xl font-serif text-accent italic">${stats.taxableIncomeProjected.toLocaleString()}</div>
             </div>
          </div>
      )}

      <div className="grid lg:grid-cols-3 gap-12">
          {/* GST Monitor */}
          <div className="lg:col-span-2 glass-ui p-12 space-y-12">
             <div className="flex justify-between items-center border-b border-white/5 pb-8">
                 <div className="space-y-1">
                    <h3 className="font-serif italic text-4xl text-white">Small Supplier Status</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Threshold Tracking: Rule GST-001</p>
                 </div>
                 <Badge color="neutral">Limit: $30k</Badge>
             </div>
             
             {stats && (
                 <div className="space-y-8">
                     <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                         <span className="text-white/40 italic">Current Gross</span>
                         <span className={stats.grossIncomeYTD >= 30000 ? "text-accent" : "text-white"}>
                             ${stats.grossIncomeYTD.toLocaleString()}
                         </span>
                     </div>
                     <ProgressBar progress={financeApi.getThresholdProgress(stats.grossIncomeYTD)} />
                     
                     {financeApi.checkGstThreshold(stats.grossIncomeYTD) && (
                         <div className="p-8 bg-accent/5 border border-accent/20 flex gap-6 items-start">
                             <AlertTriangle className="text-accent" size={24} />
                             <div className="space-y-2">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-accent italic">Action Required</p>
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
                 <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-accent">Compliance Budget</h4>
              </div>
              <div className="space-y-8">
                 {tracking.length > 0 ? tracking.map(t => {
                    const master = UNIONS.find(u => u.name === t.unionName);
                    if (!master?.applicationFee) return null;
                    return (
                        <div key={t.id} className="space-y-3">
                           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40 italic">
                              <span>{t.unionName} Application</span>
                              <span className="text-white">${master.applicationFee}</span>
                           </div>
                           <p className="text-[9px] text-white/20 leading-relaxed italic">Estimated initiation for {t.tierLabel}.</p>
                        </div>
                    );
                 }) : (
                    <p className="text-xs text-white/20 italic">No guild fees initialized. Set targets in Base Camp to forecast initiation costs.</p>
                 )}
              </div>
          </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-10">
          <h3 className="font-serif italic text-4xl text-white">Production Ledger</h3>
          <div className="overflow-x-auto border border-white/5">
              <table className="w-full text-left text-sm font-sans">
                  <thead className="bg-white/[0.02] border-b border-white/5">
                      <tr className="text-[9px] font-black uppercase tracking-widest text-white/40">
                          <th className="p-6">Date</th>
                          <th className="p-6">Context</th>
                          <th className="p-6">Sector</th>
                          <th className="p-6 text-right">Magnitude</th>
                          <th className="p-6 text-center">Protocol</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                      {transactions.length === 0 && (
                          <tr><td colSpan={5} className="p-20 text-center text-white/20 italic uppercase font-black tracking-widest">Slate Clear</td></tr>
                      )}
                      {transactions.map(tx => (
                          <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="p-6 font-mono text-[10px] text-white/30">{tx.dateIncurred}</td>
                              <td className="p-6 font-serif italic text-lg text-white">{tx.description}</td>
                              <td className="p-6 text-[10px] font-black uppercase tracking-widest text-white/20">{tx.category.replace(/_/g, ' ')}</td>
                              <td className={clsx("p-6 text-right font-serif italic text-lg", tx.type === 'INCOME' ? "text-accent" : "text-white")}>
                                  {tx.type === 'INCOME' ? '+' : '-'}${tx.totalAmount.toFixed(2)}
                              </td>
                              <td className="p-6 text-center">
                                  {tx.ruleTags && tx.ruleTags.length > 0 && (
                                      <Badge color="accent" className="text-[8px]">{tx.ruleTags[0].replace('MEALS_50_LIMIT', '50% Rule')}</Badge>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Modal - Shutter Style */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
              <div className="w-full max-w-xl glass-ui p-12 border-white/20 animate-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-center mb-10">
                     <h3 className="font-serif italic text-4xl text-white">Log Mark</h3>
                     <button onClick={() => setIsAddModalOpen(false)} className="text-white/20 hover:text-white transition-colors">DISCARD</button>
                  </div>
                  <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Entry Type</label>
                              <Select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="h-16 text-sm font-serif italic">
                                  <option value="EXPENSE" className="bg-black">Expense</option>
                                  <option value="INCOME" className="bg-black">Income</option>
                              </Select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Date</label>
                              <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="h-16 text-sm" />
                          </div>
                      </div>
                      
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Sector</label>
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

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Subtotal ($)</label>
                              <Input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="h-16 text-lg font-mono" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">GST/HST ($)</label>
                              <Input type="number" value={form.tax} onChange={e => setForm({...form, tax: e.target.value})} className="h-16 text-lg font-mono" />
                          </div>
                      </div>

                      <div className="pt-8">
                         <Button onClick={handleAddTransaction} className="w-full h-20 text-[11px] font-black uppercase tracking-[0.5em] bg-white text-black hover:bg-accent">Print Record</Button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
