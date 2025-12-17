
import { FinanceTransaction, FinanceStats, TransactionType } from '../types';

const TRANSACTIONS_KEY = 'cinearch_finance_transactions';

// --- Tax Parameters (From Provided JSON) ---
const PARAMS = {
    CA_FED: {
        GST_RATE: 0.05,
        SMALL_SUPPLIER_THRESHOLD: 30000,
        MEALS_DEDUCTION_RATE: 0.50
    },
    PROVINCES: {
        ON: { HST_RATE: 0.13 },
        BC: { PST_RATE: 0.07, GST_RATE: 0.05 }, // 12% total usually, but PST often not recoverable
        AB: { GST_RATE: 0.05 },
        QC: { QST_RATE: 0.09975, GST_RATE: 0.05 }
    }
};

const RULES = {
    // Rule SP-010: Meals 50% Limit
    applyMealsLimit: (category: string, amount: number) => {
        if (category === 'MEALS_ENTERTAINMENT') {
            return {
                deductible: amount * PARAMS.CA_FED.MEALS_DEDUCTION_RATE,
                addBack: amount * (1 - PARAMS.CA_FED.MEALS_DEDUCTION_RATE),
                tags: ['MEALS_50_LIMIT']
            };
        }
        return null;
    },

    // Rule SP-012: Fines
    applyFinesLimit: (category: string, amount: number) => {
        if (category === 'FINES_PENALTIES') {
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
    list: (): FinanceTransaction[] => {
        return getStorage<FinanceTransaction[]>(TRANSACTIONS_KEY, []);
    },

    add: (tx: Omit<FinanceTransaction, 'id' | 'deductibleAmount' | 'addBackAmount' | 'ruleTags'>) => {
        const transactions = getStorage<FinanceTransaction[]>(TRANSACTIONS_KEY, []);
        
        // --- RUN ENGINE ---
        let deductible = tx.amountBeforeTax;
        let addBack = 0;
        let tags: string[] = [];

        // Apply Deduction Rules
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
            // Income is fully taxable
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

    getStats: (): FinanceStats => {
        const transactions = getStorage<FinanceTransaction[]>(TRANSACTIONS_KEY, []);
        
        const grossIncome = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amountBeforeTax, 0);
            
        const totalExpenses = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amountBeforeTax, 0);

        const deductibleExpenses = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + (t.deductibleAmount ?? t.amountBeforeTax), 0);

        const gstCollected = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.taxAmount, 0);

        const gstPaid = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.taxAmount, 0);

        return {
            grossIncomeYTD: grossIncome,
            totalExpensesYTD: totalExpenses,
            deductibleExpensesYTD: deductibleExpenses,
            netIncomeYTD: grossIncome - deductibleExpenses,
            gstCollected,
            gstPaid,
            gstNetRemittance: gstCollected - gstPaid,
            taxableIncomeProjected: grossIncome - deductibleExpenses
        };
    },
    
    // Check if GST threshold warning is needed (Rule GST-001)
    checkGstThreshold: (grossIncome: number) => {
        return grossIncome >= PARAMS.CA_FED.SMALL_SUPPLIER_THRESHOLD;
    },
    
    getThresholdProgress: (grossIncome: number) => {
        return Math.min(100, (grossIncome / PARAMS.CA_FED.SMALL_SUPPLIER_THRESHOLD) * 100);
    }
};
