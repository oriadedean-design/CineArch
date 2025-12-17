
import React, { useState, useEffect } from 'react';
import { Heading, Text, Card, Button, Input, Select, Badge } from '../components/ui';
import { TrendingUp, TrendingDown, Plus, AlertTriangle, Calculator, Loader2, Filter } from 'lucide-react';
import { api } from '../services/api';
import { IncomeEntry, Expense } from '../types';

export const Finance = () => {
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState(localStorage.getItem('cinearch_org_id'));
  const [income, setIncome] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txType, setTxType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  // Form State
  const [formData, setFormData] = useState({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      description: '',
      category: 'Meals & Entertainment',
      taxPaid: ''
  });

  useEffect(() => {
    if (!orgId) return;
    refresh();
  }, [orgId]);

  const refresh = async () => {
      if (!orgId) return;
      setLoading(true);
      const [inc, exp] = await Promise.all([
          api.finance.listIncome(orgId),
          api.finance.listExpenses(orgId)
      ]);
      setIncome(inc);
      setExpenses(exp);
      setLoading(false);
  };

  const handleSave = async () => {
      if (!orgId) return;
      // Basic mock save logic
      const userId = (await api.auth.getSession())?.user.id;
      if (!userId) return;

      if (txType === 'EXPENSE') {
          await api.finance.addExpense({
              org_id: orgId,
              user_id: userId,
              date_incurred: formData.date,
              amount: parseFloat(formData.amount),
              description: formData.description,
              category: formData.category as any,
              tax_paid_gst: parseFloat(formData.taxPaid) || 0,
              claimable_percentage: formData.category === 'Meals & Entertainment' ? 50 : 100
          });
      }
      setIsModalOpen(false);
      refresh();
  };

  // Stats Calcs
  const totalIncome = income.reduce((sum, i) => sum + i.subtotal, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const gstCollected = income.reduce((sum, i) => sum + (i.tax_collected_gst || 0), 0);
  const gstPaid = expenses.reduce((sum, e) => sum + (e.tax_paid_gst || 0), 0);

  if (loading) return <Loader2 className="animate-spin text-accent w-8 h-8 mx-auto mt-20" />;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <Badge color="accent">Fiscal Year 2025</Badge>
          <Heading level={1}>Finance</Heading>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Log Transaction
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-6 bg-surfaceHighlight/20 border-white/10">
              <span className="text-xs font-bold uppercase text-gray-500">Gross Income</span>
              <div className="text-3xl font-serif text-white mt-2">${totalIncome.toLocaleString()}</div>
          </Card>
           <Card className="p-6 bg-surfaceHighlight/20 border-white/10">
              <span className="text-xs font-bold uppercase text-gray-500">Expenses</span>
              <div className="text-3xl font-serif text-white mt-2 text-red-300">-${totalExpense.toLocaleString()}</div>
          </Card>
           <Card className="p-6 bg-surfaceHighlight/20 border-white/10">
              <span className="text-xs font-bold uppercase text-gray-500">Net Income</span>
              <div className="text-3xl font-serif text-white mt-2">${(totalIncome - totalExpense).toLocaleString()}</div>
          </Card>
           <Card className="p-6 bg-surfaceHighlight/20 border-white/10">
              <span className="text-xs font-bold uppercase text-gray-500">GST Net Remittance</span>
              <div className="text-3xl font-serif text-white mt-2 flex items-center gap-2">
                  ${(gstCollected - gstPaid).toLocaleString()}
                  {gstCollected - gstPaid > 0 ? <TrendingUp className="w-4 h-4 text-red-400"/> : <TrendingDown className="w-4 h-4 text-green-400"/>}
              </div>
          </Card>
      </div>

      {/* Threshold Monitor */}
      <div className="p-6 border border-white/10 rounded-xl bg-surface relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
              <Heading level={3}>GST Registration Threshold</Heading>
              <span className="text-xs font-mono text-gray-400">$30,000.00 Limit</span>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-green-500 to-red-500" style={{ width: `${Math.min(100, (totalIncome / 30000) * 100)}%` }} />
          </div>
          {totalIncome > 30000 && (
               <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                   <AlertTriangle className="w-4 h-4" />
                   <span>You have exceeded the small supplier threshold. Registration required.</span>
               </div>
          )}
      </div>

      {/* Transaction Table */}
      <div className="space-y-4">
          <Heading level={3}>Ledger</Heading>
          <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-gray-400 font-bold uppercase text-xs">
                      <tr>
                          <th className="p-4">Date</th>
                          <th className="p-4">Description</th>
                          <th className="p-4">Category</th>
                          <th className="p-4 text-right">Amount</th>
                          <th className="p-4 text-right">GST</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                      {/* Combine arrays and manually map to a display interface to avoid TS union errors */}
                      {[
                        ...income.map(i => ({
                            id: i.id, date: i.date_invoiced, description: i.description, 
                            category: i.category || 'Income', amount: i.subtotal, gst: i.tax_collected_gst, type: 'INCOME'
                        })), 
                        ...expenses.map(e => ({
                            id: e.id, date: e.date_incurred, description: e.description,
                            category: e.category, amount: e.amount, gst: e.tax_paid_gst, type: 'EXPENSE'
                        }))
                      ]
                        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((tx, idx) => (
                          <tr key={idx} className="hover:bg-white/5">
                              <td className="p-4 font-mono text-gray-500">{tx.date}</td>
                              <td className="p-4 text-white font-medium">{tx.description}</td>
                              <td className="p-4 text-xs uppercase text-gray-500">{tx.category}</td>
                              <td className={`p-4 text-right font-bold ${tx.type === 'INCOME' ? 'text-green-400' : 'text-white'}`}>
                                  {tx.type === 'INCOME' ? '+' : '-'}${tx.amount.toFixed(2)}
                              </td>
                              <td className="p-4 text-right text-gray-500">
                                  ${(tx.gst || 0).toFixed(2)}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Simple Add Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
              <Card className="w-full max-w-md bg-surface p-8">
                  <Heading level={3} className="mb-6">Log Transaction</Heading>
                  <div className="space-y-4">
                      <div className="flex gap-2 p-1 bg-white/10 rounded-lg">
                          <button onClick={() => setTxType('EXPENSE')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${txType === 'EXPENSE' ? 'bg-accent text-white' : 'text-gray-400'}`}>Expense</button>
                          <button onClick={() => setTxType('INCOME')} className={`flex-1 py-2 text-xs font-bold uppercase rounded ${txType === 'INCOME' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>Income</button>
                      </div>
                      
                      <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                      <Input placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                      
                      {txType === 'EXPENSE' && (
                          <Select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                              <option>Meals & Entertainment</option>
                              <option>Travel</option>
                              <option>Kit Rental</option>
                              <option>Union Dues</option>
                              <option>Other</option>
                          </Select>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                          <Input type="number" placeholder="Amount" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                          <Input type="number" placeholder="GST" value={formData.taxPaid} onChange={e => setFormData({...formData, taxPaid: e.target.value})} />
                      </div>

                      <div className="flex gap-4 pt-4">
                          <Button variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                          <Button className="flex-1" onClick={handleSave}>Save</Button>
                      </div>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
};
