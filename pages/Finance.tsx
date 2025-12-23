
import React, { useState, useEffect } from 'react';
import { FinanceTransaction, FinanceStats, TransactionType, ProvinceCode, CanadianProvince } from '../types';
import { Heading, Text, Card, Badge, Button, Input, Select, ProgressBar } from '../components/ui';
import { WalletCards, Landmark, ArrowUpRight, Plus, Receipt, TrendingUp, ShieldAlert, History, Trash2, PiggyBank, Calculator, Eye, EyeOff, Lock } from 'lucide-react';
import { api } from '../services/storage';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

const TRANSACTIONS_KEY = 'cinearch_finance_transactions';

// --- Factual Canadian Tax Data (Updated for 2024/2025) ---
const PARAMS = {
    CA_FED: {
        GST_RATE: 0.05,
        SMALL_SUPPLIER_THRESHOLD: 30000,
        MEALS_DEDUCTION_RATE: 0.50,
        CPP_RATE: 0.119, 
        CPP_MAX_EARNINGS: 68500,
        CPP_BASIC_EXEMPTION: 3500
    },
    PROVINCES: {
        ON: { type: 'HST', rate: 0.13, gst: 0.05, pst: 0.08 },
        BC: { type: 'GST_PST', rate: 0.12, gst: 0.05, pst: 0.07 },
        AB: { type: 'GST', rate: 0.05, gst: 0.05, pst: 0.00 },
        QC: { type: 'GST_QST', rate: 0.14975, gst: 0.05, pst: 0.09975 }
    } as Record<string, { type: string, rate: number, gst: number, pst: number }>
};

const RULES = {
    applyMealsLimit: (category: string, amount: number) => {
        if (category === 'Meals & Entertainment') {
            return {
                deductible: amount * PARAMS.CA_FED.MEALS_DEDUCTION_RATE,
                addBack: amount * (1 - PARAMS.CA_FED.MEALS_DEDUCTION_RATE),
                tags: ['MEALS_50_LIMIT']
            };
        }
        return null;
    },
    applyFinesLimit: (category: string, amount: number) => {
        if (category === 'Fines' || category === 'Penalties') {
             return {
                deductible: 0,
                addBack: amount,
                tags: ['NON_DEDUCTIBLE_FINE']
             };
        }
        return null;
    }
};

const getStorage = <T,>(key: string, defaultVal: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultVal;
  try { return JSON.parse(stored); } catch { return defaultVal; }
};

const setStorage = (key: string, val: any) => localStorage.setItem(key, JSON.stringify(val));

export const financeApi = {
    list: (): FinanceTransaction[] => getStorage<FinanceTransaction[]>(TRANSACTIONS_KEY, []),

    add: (tx: Omit<FinanceTransaction, 'id' | 'deductibleAmount' | 'addBackAmount' | 'ruleTags'>) => {
        const transactions = getStorage<FinanceTransaction[]>(TRANSACTIONS_KEY, []);
        let deductible = tx.amountBeforeTax;
        let addBack = 0;
        let tags: string[] = [];

        if (tx.type === 'EXPENSE') {
            const mealsRule = RULES.applyMealsLimit(tx.category, tx.amountBeforeTax);
            const finesRule = RULES.applyFinesLimit(tx.category, tx.amountBeforeTax);

            if (mealsRule) {
                deductible = mealsRule.deductible;
                addBack = mealsRule.addBack;
                tags.push(...mealsRule.tags);
            } else if (finesRule) {
                deductible = finesRule.deductible;
                addBack = finesRule.addBack;
                tags.push(...finesRule.tags);
            }
        }

        const newTx: FinanceTransaction = {
            ...tx,
            id: `tx_${Date.now()}`,
            deductibleAmount: deductible,
            addBackAmount: addBack,
            ruleTags: tags
        };

        setStorage(TRANSACTIONS_KEY, [newTx, ...transactions]);
        return newTx;
    },

    delete: (id: string) => {
        const list = getStorage<FinanceTransaction[]>(TRANSACTIONS_KEY, []);
        setStorage(TRANSACTIONS_KEY, list.filter(t => t.id !== id));
    },

    getStats: (): FinanceStats & { estCPP: number, estIncomeTax: number } => {
        const transactions = getStorage<FinanceTransaction[]>(TRANSACTIONS_KEY, []);
        const grossIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amountBeforeTax, 0);
        const deductibleExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + (t.deductibleAmount ?? t.amountBeforeTax), 0);
        const netIncome = grossIncome - deductibleExpenses;
        const gstCollected = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.taxAmount, 0);
        const gstPaid = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.taxAmount, 0);

        let cppPensionable = Math.max(0, netIncome - PARAMS.CA_FED.CPP_BASIC_EXEMPTION);
        cppPensionable = Math.min(cppPensionable, PARAMS.CA_FED.CPP_MAX_EARNINGS - PARAMS.CA_FED.CPP_BASIC_EXEMPTION);
        const estCPP = Math.max(0, cppPensionable * PARAMS.CA_FED.CPP_RATE);
        const estIncomeTax = Math.max(0, netIncome * 0.25);

        return {
            grossIncomeYTD: grossIncome,
            totalExpensesYTD: transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amountBeforeTax, 0),
            deductibleExpensesYTD: deductibleExpenses,
            netIncomeYTD: netIncome,
            gstCollected,
            gstPaid,
            gstNetRemittance: gstCollected - gstPaid,
            taxableIncomeProjected: netIncome,
            estCPP,
            estIncomeTax
        };
    },

    getThresholdProgress: (grossIncome: number) => Math.min(100, (grossIncome / PARAMS.CA_FED.SMALL_SUPPLIER_THRESHOLD) * 100)
};

const PremiumFinanceOverlay = () => {
   const navigate = useNavigate();
   return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-12 text-center bg-black/60 backdrop-blur-sm">
         <div className="max-w-xl glass-ui p-16 space-y-8 animate-in zoom-in-95 duration-500 border-accent/40 shadow-2xl">
            <div className="w-16 h-16 bg-accent/20 border border-accent/40 rounded-full flex items-center justify-center mx-auto mb-6">
               <Lock className="text-accent" size={24} />
            </div>
            <div className="space-y-4">
               <Badge color="accent" className="italic uppercase tracking-widest">A-List Feature</Badge>
               <h2 className="text-4xl font-serif italic text-white uppercase tracking-tight">The Ledger is Locked.</h2>
               <p className="text-sm text-white/40 leading-relaxed italic">
                  Compliance monitoring, tax projections, and GST threshold tracking are part of our premium suite. Upgrade to A-List to access your full financial dashboard.
               </p>
            </div>
            <div className="space-y-4 pt-6">
               <Button className="w-full h-16 text-[11px] font-black uppercase tracking-widest">Upgrade to A-List</Button>
               <button onClick={() => navigate('/')} className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">Return to Dashboard</button>
            </div>
         </div>
      </div>
   );
};

export const Finance = () => {
  const [stats, setStats] = useState<ReturnType<typeof financeApi.getStats> | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const user = api.auth.getUser();

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    setStats(financeApi.getStats());
    setTransactions(financeApi.list());
  };

  if (!user) return null;

  return (
    <div className="relative min-h-screen">
      {!user.isPremium && <PremiumFinanceOverlay />}
      <div className={clsx("space-y-24 animate-in fade-in duration-700 pb-40", !user.isPremium && "blur-md pointer-events-none select-none")}>
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 pb-16 border-b border-white/5">
          <div className="space-y-4">
            <div className="flex items-center gap-6">
               <Badge color="accent" className="uppercase tracking-[0.4em] text-[9px] font-black italic">Wrap Wallet</Badge>
               <div className="flex items-center gap-3 text-[9px] font-black text-white/30 uppercase tracking-[0.5em]">
                  <PiggyBank size={12} /> YTD Compliance Ledger
               </div>
            </div>
            <h1 className="heading-huge text-white leading-[0.75]">THE <br /><span className="text-accent">LEDGER.</span></h1>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
          <Card className="p-10 border-accent/20 bg-accent/5">
             <Text variant="caption">Net Position</Text>
             <h3 className="text-6xl font-serif italic text-white mt-4">${stats?.netIncomeYTD.toLocaleString()}</h3>
             <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mt-2">After Deductibles</p>
          </Card>
          <Card className="p-10 border-white/5">
             <Text variant="caption">Gross Income</Text>
             <h3 className="text-5xl font-serif italic text-white mt-4">${stats?.grossIncomeYTD.toLocaleString()}</h3>
             <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mt-2">Before Expenses</p>
          </Card>
          <Card className="p-10 border-white/5">
             <Text variant="caption">Small Supplier</Text>
             <h3 className="text-5xl font-serif italic text-white mt-4">{Math.round(financeApi.getThresholdProgress(stats?.grossIncomeYTD || 0))}%</h3>
             <ProgressBar progress={financeApi.getThresholdProgress(stats?.grossIncomeYTD || 0)} className="mt-4" />
          </Card>
          <Card className="p-10 border-white/5">
             <Text variant="caption">Tax Reserves</Text>
             <h3 className="text-5xl font-serif italic text-white mt-4">${Math.round((stats?.estIncomeTax || 0) + (stats?.estCPP || 0)).toLocaleString()}</h3>
             <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mt-2">Est. Tax + CPP</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
           <section className="lg:col-span-2 space-y-12">
              <div className="flex justify-between items-end border-b border-white/5 pb-8">
                 <h3 className="font-serif italic text-4xl text-white">Entry Log</h3>
                 <div className="flex gap-4">
                    <Button variant="outline" className="h-12 text-[9px]">Filter</Button>
                    <Button className="h-12 text-[9px] px-8">Add Entry</Button>
                 </div>
              </div>

              <div className="space-y-1">
                 {transactions.length > 0 ? transactions.map(tx => (
                    <div key={tx.id} className="p-8 glass-ui border-white/5 hover:border-accent/30 transition-all flex items-center justify-between group">
                       <div className="flex items-center gap-8">
                          <div className={clsx(
                             "w-12 h-12 flex items-center justify-center border",
                             tx.type === 'INCOME' ? "border-green-500/20 text-green-400 bg-green-500/5" : "border-red-500/20 text-red-400 bg-red-500/5"
                          )}>
                             {tx.type === 'INCOME' ? <TrendingUp size={18} /> : <Receipt size={18} />}
                          </div>
                          <div>
                             <p className="text-xl font-serif italic text-white">{tx.description}</p>
                             <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mt-1">{tx.category} // {tx.dateIncurred}</p>
                          </div>
                       </div>
                       <div className="text-right flex items-center gap-10">
                          <div>
                             <p className={clsx("text-2xl font-serif italic", tx.type === 'INCOME' ? "text-white" : "text-white/40")}>
                                {tx.type === 'INCOME' ? '+' : '-'}${tx.amountBeforeTax.toLocaleString()}
                             </p>
                             {tx.ruleTags && tx.ruleTags.length > 0 && (
                                <p className="text-[8px] text-accent uppercase font-black tracking-widest mt-1 italic">{tx.ruleTags[0].replace(/_/g, ' ')}</p>
                             )}
                          </div>
                       </div>
                    </div>
                 )) : (
                    <div className="py-20 text-center border border-dashed border-white/5 opacity-20">
                       <p className="text-[10px] font-black uppercase tracking-widest italic">No financial movements detected.</p>
                    </div>
                 )}
              </div>
           </section>

           <aside className="space-y-12">
              <h3 className="font-serif italic text-4xl text-white border-b border-white/5 pb-8">Tax Compliance</h3>
              <Card className="border-accent/20 bg-accent/5 p-12 space-y-10">
                 <div className="flex items-center gap-4 text-accent">
                    <Calculator size={20} strokeWidth={1} />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Real-time Calculation</span>
                 </div>
                 <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                       <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Est. Income Tax</p>
                       <p className="text-2xl font-serif italic text-white">${Math.round(stats?.estIncomeTax || 0).toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                       <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Est. CPP (Sole Prop)</p>
                       <p className="text-2xl font-serif italic text-white">${Math.round(stats?.estCPP || 0).toLocaleString()}</p>
                    </div>
                 </div>
              </Card>
           </aside>
        </div>
      </div>
    </div>
  );
};
