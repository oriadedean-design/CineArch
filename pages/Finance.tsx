
import React, { useState, useEffect } from 'react';
import { Heading, Text, Card, Button, Input, Select, Badge, ProgressBar } from '../components/ui';
import { Lock, Crown, Plus, TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle, Calculator, PieChart, FileText } from 'lucide-react';
import { api } from '../services/storage';
import { financeApi } from '../services/finance';
import { User, FinanceTransaction, FinanceStats } from '../types';

export const Finance = () => {
  const [user, setUser] = useState<User | null>(api.auth.getUser());
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Local Form State
  const [form, setForm] = useState({
      type: 'EXPENSE',
      category: 'MEALS_ENTERTAINMENT',
      amount: '',
      tax: '',
      desc: '',
      date: new Date().toISOString().split('T')[0]
  });

  const isPremium = user?.isPremium;

  useEffect(() => {
    if (isPremium) {
       refreshData();
    }
  }, [isPremium]);

  const refreshData = () => {
      setTransactions(financeApi.list());
      setStats(financeApi.getStats());
  };

  const handleUpgrade = () => {
      // Simulate upgrade
      if (user) {
          const updated = { ...user, isPremium: true };
          api.auth.updateUser(updated);
          setUser(updated);
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

  // --- PREMIUM GATE VIEW ---
  if (!isPremium) {
      return (
          <div className="relative min-h-[80vh] flex flex-col items-center justify-center p-6 overflow-hidden rounded-3xl border border-white/10 bg-surface">
              {/* Blurred Background Mockup */}
              <div className="absolute inset-0 blur-xl opacity-30 pointer-events-none select-none">
                  <div className="grid grid-cols-3 gap-4 p-8">
                      <div className="h-32 bg-white/10 rounded-xl"></div>
                      <div className="h-32 bg-white/10 rounded-xl"></div>
                      <div className="h-32 bg-white/10 rounded-xl"></div>
                      <div className="col-span-3 h-64 bg-white/5 rounded-xl"></div>
                  </div>
              </div>

              <div className="relative z-10 max-w-lg text-center space-y-8 animate-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto ring-1 ring-accent/50 shadow-[0_0_30px_rgba(199,62,29,0.4)]">
                      <Lock className="w-8 h-8 text-accent" />
                  </div>
                  
                  <div className="space-y-4">
                      <Heading level={2}>Wrap Wallet</Heading>
                      <Text className="text-gray-400">
                          Unlock military-grade budgeting tools. Automate your tax compliance, track deductions with our 
                          <span className="text-white font-bold"> Audit Pack™</span> engine, and forecast your GST status.
                      </Text>
                  </div>

                  <div className="bg-surfaceHighlight border border-white/10 rounded-xl p-6 text-left space-y-3">
                      <div className="flex items-center gap-3">
                          <Calculator className="w-5 h-5 text-accent" />
                          <span className="text-sm font-bold text-white">Automated Meal Deductions (50% Rule)</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-accent" />
                          <span className="text-sm font-bold text-white">GST Threshold Alerts ($30k Warning)</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <PieChart className="w-5 h-5 text-accent" />
                          <span className="text-sm font-bold text-white">Profit & Loss Real-time Analysis</span>
                      </div>
                  </div>

                  <Button onClick={handleUpgrade} className="w-full h-14 text-lg bg-accent hover:bg-accentGlow shadow-glow">
                      <Crown className="w-5 h-5 mr-2" /> Upgrade to Pro - $15/mo
                  </Button>
                  <p className="text-xs text-gray-600 uppercase tracking-widest">Cancel anytime. Tax deductible.</p>
              </div>
          </div>
      );
  }

  // --- UNLOCKED VIEW ---
  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <Badge color="accent">Pro Unlocked</Badge>
          </div>
          <Heading level={1}>Wrap Wallet</Heading>
        </div>
        <Button onClick={() => setIsAddModalOpen(!isAddModalOpen)}>
            <Plus className="w-4 h-4 mr-2" /> Log Transaction
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
          <div className="grid md:grid-cols-4 gap-4">
             <Card className="p-6 bg-surfaceHighlight/30 border-white/10">
                 <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Gross Income</p>
                 <p className="text-3xl font-serif text-white flex items-center gap-2">
                     <TrendingUp className="w-5 h-5 text-green-500" />
                     ${stats.grossIncomeYTD.toLocaleString()}
                 </p>
             </Card>
             <Card className="p-6 bg-surfaceHighlight/30 border-white/10">
                 <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Expenses</p>
                 <p className="text-3xl font-serif text-white flex items-center gap-2">
                     <TrendingDown className="w-5 h-5 text-red-400" />
                     ${stats.totalExpensesYTD.toLocaleString()}
                 </p>
             </Card>
             <Card className="p-6 bg-surfaceHighlight/30 border-white/10 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-1 bg-accent text-[9px] font-bold uppercase text-white rounded-bl-lg">Deductible</div>
                 <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Audit Safe Expenses</p>
                 <p className="text-3xl font-serif text-white">
                     ${stats.deductibleExpensesYTD.toLocaleString()}
                 </p>
                 <p className="text-[10px] text-gray-500 mt-1">
                    Difference: <span className="text-red-400">${(stats.totalExpensesYTD - stats.deductibleExpensesYTD).toLocaleString()}</span> (Non-Deductible)
                 </p>
             </Card>
             <Card className="p-6 bg-surfaceHighlight/30 border-white/10">
                 <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Est. Taxable Income</p>
                 <p className="text-3xl font-serif text-white text-accent">
                     ${stats.taxableIncomeProjected.toLocaleString()}
                 </p>
             </Card>
          </div>
      )}

      {/* Compliance Section */}
      <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 p-8 border-white/10">
             <div className="flex items-center justify-between mb-6">
                 <Heading level={3}>GST/HST Threshold Monitor</Heading>
                 <span className="text-xs text-gray-500 font-mono">Limit: $30,000.00</span>
             </div>
             
             {stats && (
                 <div className="space-y-4">
                     <div className="flex justify-between text-sm">
                         <span className="text-gray-400">Current Gross Income</span>
                         <span className={stats.grossIncomeYTD >= 30000 ? "text-red-500 font-bold" : "text-white"}>
                             ${stats.grossIncomeYTD.toLocaleString()} / $30k
                         </span>
                     </div>
                     <ProgressBar progress={financeApi.getThresholdProgress(stats.grossIncomeYTD)} className="h-4" />
                     
                     {financeApi.checkGstThreshold(stats.grossIncomeYTD) ? (
                         <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-lg mt-4">
                             <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                             <div>
                                 <p className="text-sm font-bold text-red-400">Threshold Exceeded</p>
                                 <p className="text-xs text-gray-400 mt-1">Rule GST-001: You have exceeded the small supplier threshold. You must register for GST/HST immediately to remain compliant.</p>
                             </div>
                         </div>
                     ) : (
                         <p className="text-xs text-gray-500 mt-2">You are a Small Supplier. GST registration is optional but recommended if you have significant expenses.</p>
                     )}
                 </div>
             )}
          </Card>

          <Card className="p-6 bg-surfaceHighlight/10 border-white/10">
              <Heading level={3} className="mb-4">Quick Actions</Heading>
              <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start text-xs border-white/10">
                      <Calculator className="w-4 h-4 mr-2" /> Estimate Income Tax
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs border-white/10">
                      <FileText className="w-4 h-4 mr-2" /> Export Audit Pack
                  </Button>
              </div>
          </Card>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
          <Heading level={3}>Recent Transactions</Heading>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-surface">
              <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-gray-400 font-medium uppercase tracking-wider text-xs">
                      <tr>
                          <th className="p-4">Date</th>
                          <th className="p-4">Description</th>
                          <th className="p-4">Category</th>
                          <th className="p-4 text-right">Amount</th>
                          <th className="p-4 text-right">Deductible</th>
                          <th className="p-4 text-center">Rules</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                      {transactions.length === 0 && (
                          <tr><td colSpan={6} className="p-8 text-center text-gray-500">No transactions logged.</td></tr>
                      )}
                      {transactions.map(tx => (
                          <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 text-gray-400 font-mono">{tx.dateIncurred}</td>
                              <td className="p-4 text-white font-medium">{tx.description}</td>
                              <td className="p-4 text-gray-500 text-xs uppercase">{tx.category.replace(/_/g, ' ')}</td>
                              <td className={tx.type === 'INCOME' ? "p-4 text-right text-green-400" : "p-4 text-right text-white"}>
                                  {tx.type === 'INCOME' ? '+' : '-'}${tx.totalAmount.toFixed(2)}
                              </td>
                              <td className="p-4 text-right text-gray-400">
                                  {tx.type === 'EXPENSE' ? `$${tx.deductibleAmount?.toFixed(2)}` : '-'}
                              </td>
                              <td className="p-4 text-center">
                                  {tx.ruleTags && tx.ruleTags.length > 0 && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-accent/20 text-accent uppercase border border-accent/30">
                                          {tx.ruleTags[0].replace('MEALS_50_LIMIT', '50% Rule')}
                                      </span>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Add Transaction Modal (Simplified Inline) */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <Card className="w-full max-w-md bg-surface border-white/20 shadow-2xl animate-in zoom-in duration-300">
                  <Heading level={3} className="mb-6">Log Transaction</Heading>
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs uppercase text-gray-500 font-bold">Type</label>
                              <Select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="bg-black border-white/10">
                                  <option value="EXPENSE">Expense</option>
                                  <option value="INCOME">Income</option>
                              </Select>
                          </div>
                          <div>
                              <label className="text-xs uppercase text-gray-500 font-bold">Date</label>
                              <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="bg-black border-white/10" />
                          </div>
                      </div>
                      
                      <div>
                          <label className="text-xs uppercase text-gray-500 font-bold">Category</label>
                          <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="bg-black border-white/10">
                              {form.type === 'EXPENSE' ? (
                                  <>
                                      <option value="MEALS_ENTERTAINMENT">Meals (50% Rule)</option>
                                      <option value="TRAVEL">Travel</option>
                                      <option value="EQUIPMENT_RENTAL">Equipment Rental</option>
                                      <option value="GEAR_SMALL_TOOLS">Gear & Small Tools</option>
                                      <option value="UNION_DUES">Union Dues</option>
                                      <option value="AGENT_COMMISSIONS">Agent Commissions</option>
                                      <option value="TRAINING_WORKSHOPS">Training & Workshops</option>
                                      <option value="OFFICE_SUPPLIES">Office Supplies</option>
                                      <option value="FINES_PENALTIES">Fines (Non-Deductible)</option>
                                  </>
                              ) : (
                                  <>
                                      <option value="SERVICE_FEES">Service Fees</option>
                                      <option value="ROYALTY">Royalty</option>
                                  </>
                              )}
                          </Select>
                      </div>

                      <div>
                          <label className="text-xs uppercase text-gray-500 font-bold">Description</label>
                          <Input value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} placeholder="e.g. Lunch with Director" className="bg-black border-white/10" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs uppercase text-gray-500 font-bold">Amount ($)</label>
                              <Input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="bg-black border-white/10" />
                          </div>
                          <div>
                              <label className="text-xs uppercase text-gray-500 font-bold">Tax Paid/Coll ($)</label>
                              <Input type="number" value={form.tax} onChange={e => setForm({...form, tax: e.target.value})} className="bg-black border-white/10" />
                          </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                          <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} className="flex-1">Cancel</Button>
                          <Button onClick={handleAddTransaction} className="flex-1">Save Entry</Button>
                      </div>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
};
