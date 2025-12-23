
import { FinanceTransaction, FinanceStats, TransactionType } from '../types';

const TRANSACTIONS_KEY = 'cinearch_finance_transactions';

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

const getStorage = <T>(key: string, defaultVal: T): T => {
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
    } else {
      deductible = 0;
      addBack = 0;
    }

    const newTx: FinanceTransaction = {
      ...tx,
      id: `tx_${Date.now()}`,
      deductibleAmount: deductible,
      addBackAmount: addBack,
      ruleTags: tags
    };

    const updated = [newTx, ...transactions];
    setStorage(TRANSACTIONS_KEY, updated);
    return newTx;
  },

  delete: (id: string) => {
    const list = getStorage<FinanceTransaction[]>(TRANSACTIONS_KEY, []);
    setStorage(TRANSACTIONS_KEY, list.filter(t => t.id !== id));
  },

  getStats: (): FinanceStats & { estCPP: number; estIncomeTax: number } => {
    const transactions = getStorage<FinanceTransaction[]>(TRANSACTIONS_KEY, []);
    
    const grossIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amountBeforeTax, 0);
      
    const deductibleExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + (t.deductibleAmount ?? t.amountBeforeTax), 0);

    const netIncome = grossIncome - deductibleExpenses;

    const gstCollected = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.taxAmount, 0);

    const gstPaid = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.taxAmount, 0);

    // CPP Projection Logic
    let pensionable = Math.max(0, netIncome - CA_FISCAL_CONFIG.CPP_EXEMPTION);
    const estCPP = pensionable * CA_FISCAL_CONFIG.SELF_EMPLOYED_CPP_RATE;

    // Blended Tax Projection
    const estIncomeTax = netIncome * CA_FISCAL_CONFIG.PROJECTED_INCOME_TAX_RATE;

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

  // Added missing helper to check if income exceeds GST threshold
  checkGstThreshold: (grossIncome: number) => {
    return grossIncome >= CA_FISCAL_CONFIG.SMALL_SUPPLIER_THRESHOLD;
  },

  getThresholdProgress: (grossIncome: number) => {
    return Math.min(100, (grossIncome / CA_FISCAL_CONFIG.SMALL_SUPPLIER_THRESHOLD) * 100);
  }
};
