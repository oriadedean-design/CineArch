
import { supabase } from './supabase';
import { FinanceTransaction, FinanceStats, TransactionType } from '../types';
import { isDemoMode, DEMO_TRANSACTIONS, DEMO_STATS } from './demo';
import type { Tables } from './database.types';

/**
 * MASTER FISCAL PARAMETERS (CANADIAN COMPLIANCE)
 */
export const CA_FISCAL_CONFIG = {
  GST_RATE: 0.05,
  SMALL_SUPPLIER_THRESHOLD: 30000,
  MEALS_DEDUCTION_LIMIT: 0.50,
  SELF_EMPLOYED_CPP_RATE: 0.119,
  CPP_EXEMPTION: 3500,
  PROJECTED_INCOME_TAX_RATE: 0.20
};

const RULES = {
  // Rule SP-010: Meals & Entertainment (50% deductible)
  applyMealsLimit: (category: string, amount: number) => {
    const cat = category.toUpperCase();
    if (cat.includes('MEAL') || cat.includes('ENTERTAINMENT')) {
      return {
        deductible: amount * CA_FISCAL_CONFIG.MEALS_DEDUCTION_LIMIT,
        addBack: amount * (1 - CA_FISCAL_CONFIG.MEALS_DEDUCTION_LIMIT),
        tags: ['MEALS_50_LIMIT']
      };
    }
    return null;
  },

  // Rule SP-012: Fines & Penalties (Non-deductible)
  applyFinesLimit: (category: string, amount: number) => {
    const cat = category.toUpperCase();
    if (cat.includes('FINE') || cat.includes('PENALTY')) {
      return {
        deductible: 0,
        addBack: amount,
        tags: ['NON_DEDUCTIBLE_FINE']
      };
    }
    return null;
  }
};

const applyRules = (type: string, category: string, amountBeforeTax: number) => {
  let deductible = amountBeforeTax;
  let addBack = 0;
  let tags: string[] = [];

  if (type === 'EXPENSE') {
    const mealsRule = RULES.applyMealsLimit(category, amountBeforeTax);
    const finesRule = RULES.applyFinesLimit(category, amountBeforeTax);

    if (mealsRule) {
      deductible = mealsRule.deductible;
      addBack = mealsRule.addBack;
      tags.push(...mealsRule.tags);
    } else if (finesRule) {
      deductible = finesRule.deductible;
      addBack = finesRule.addBack;
      tags.push(...finesRule.tags);
    }
  } else {
    deductible = 0;
    addBack = 0;
  }

  return { deductible, addBack, tags };
};

const rowToTransaction = (row: Tables<'finance_transactions'>): FinanceTransaction => ({
  id: row.id,
  userId: row.user_id,
  jobId: row.job_id,
  type: row.type as TransactionType,
  category: row.category,
  amountBeforeTax: row.amount_before_tax,
  taxAmount: row.tax_amount,
  totalAmount: row.total_amount,
  description: row.description,
  dateIncurred: row.date_incurred,
  businessUsePercent: row.business_use_percent,
  deductibleAmount: row.deductible_amount,
  addBackAmount: row.add_back_amount,
  ruleTags: row.rule_tags || []
});

export const financeApi = {
  // Most recent transactions first, paged (totals come from getStats, not this list)
  list: async (userId: string, { limit = 200, offset = 0 } = {}): Promise<FinanceTransaction[]> => {
    if (isDemoMode()) return DEMO_TRANSACTIONS;
    const { data, error } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date_incurred', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data || []).map(rowToTransaction);
  },

  add: async (
    tx: Omit<FinanceTransaction, 'id' | 'deductibleAmount' | 'addBackAmount' | 'ruleTags'>
  ): Promise<FinanceTransaction> => {
    const { deductible, addBack, tags } = applyRules(tx.type, tx.category, tx.amountBeforeTax);

    const { data, error } = await supabase
      .from('finance_transactions')
      .insert([{
        user_id: tx.userId,
        job_id: tx.jobId || null,
        type: tx.type,
        category: tx.category,
        amount_before_tax: tx.amountBeforeTax,
        tax_amount: tx.taxAmount,
        total_amount: tx.totalAmount,
        description: tx.description,
        date_incurred: tx.dateIncurred,
        business_use_percent: tx.businessUsePercent,
        deductible_amount: deductible,
        add_back_amount: addBack,
        rule_tags: tags
      }])
      .select()
      .single();

    if (error) throw error;
    return { ...tx, id: data.id, deductibleAmount: deductible, addBackAmount: addBack, ruleTags: tags };
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('finance_transactions').delete().eq('id', id);
    if (error) throw error;
  },

  // Year-to-date totals, aggregated in Postgres (see finance_stats RPC)
  getStats: async (userId: string, year?: number): Promise<FinanceStats & { estCPP: number; estIncomeTax: number }> => {
    if (isDemoMode()) return DEMO_STATS;
    const { data, error } = await supabase.rpc('finance_stats', { p_user_id: userId, p_year: year });
    if (error) throw error;
    const t = data?.[0];

    const grossIncome = Number(t?.gross_income ?? 0);
    const deductibleExpenses = Number(t?.deductible_expenses ?? 0);
    const gstCollected = Number(t?.gst_collected ?? 0);
    const gstPaid = Number(t?.gst_paid ?? 0);
    const netIncome = grossIncome - deductibleExpenses;

    const pensionable = Math.max(0, netIncome - CA_FISCAL_CONFIG.CPP_EXEMPTION);
    const estCPP = pensionable * CA_FISCAL_CONFIG.SELF_EMPLOYED_CPP_RATE;
    const estIncomeTax = Math.max(0, netIncome) * CA_FISCAL_CONFIG.PROJECTED_INCOME_TAX_RATE;

    return {
      grossIncomeYTD: grossIncome,
      totalExpensesYTD: Number(t?.total_expenses ?? 0),
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

  checkGstThreshold: (grossIncome: number) => {
    return grossIncome >= CA_FISCAL_CONFIG.SMALL_SUPPLIER_THRESHOLD;
  },

  getThresholdProgress: (grossIncome: number) => {
    return Math.min(100, (grossIncome / CA_FISCAL_CONFIG.SMALL_SUPPLIER_THRESHOLD) * 100);
  }
};
