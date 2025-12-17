
import { supabase } from '../lib/supabase';
import { User, Job, UserUnionTracking, FinanceTransaction, FinanceStats, ResidencyDocument } from '../types';

// --- MAPPERS: Translate DB Snake_Case to Frontend CamelCase ---

const mapJob = (row: any): Job => ({
  id: row.id,
  userId: row.user_id,
  status: row.status,
  productionName: row.production_name,
  companyName: row.company_name,
  role: row.role_name,
  department: row.role_name, // Simplified mapping, ideally department is separate col
  isUnion: row.is_union,
  unionTypeId: row.union_type_id,
  unionName: row.union_name,
  productionTier: row.production_tier,
  genre: row.genre,
  imageUrl: row.image_url,
  startDate: row.start_date,
  endDate: row.end_date,
  totalHours: Number(row.total_hours),
  grossEarnings: Number(row.gross_earnings),
  unionDeductions: 0, 
  documentCount: row.document_count || 0,
  createdAt: row.created_at
});

const mapTracking = (row: any): UserUnionTracking => ({
  id: row.id,
  userId: row.user_id,
  unionTypeId: row.union_type_id,
  unionName: row.union_name,
  tierLabel: row.tier_label,
  department: row.department,
  targetType: row.target_type as any,
  targetValue: Number(row.target_value),
  startingValue: Number(row.starting_value)
});

// --- API SERVICE ---

export const api = {
  auth: {
    getUser: async (): Promise<User | null> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      // Parallel fetch: Profile + Financial Settings
      const [profileRes, financeRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('financial_profiles').select('*').eq('user_id', session.user.id).single()
      ]);

      const profile = profileRes.data;
      if (!profile) {
        // Fallback if profile doesn't exist yet (registration edge case)
        return {
           id: session.user.id,
           email: session.user.email!,
           name: '',
           role: '',
           province: '',
           isOnboarded: false,
           accountType: 'INDIVIDUAL'
        };
      }
      
      const activeViewId = localStorage.getItem('cinearch_active_view') || undefined;

      return {
        id: profile.id,
        email: profile.email || session.user.email!,
        name: profile.name,
        phone: profile.phone,
        organizationName: profile.organization_name,
        role: profile.role,
        province: profile.province,
        isOnboarded: profile.is_onboarded,
        isPremium: profile.is_premium,
        accountType: profile.account_type as any,
        memberStatus: profile.member_status as any,
        businessStructure: financeRes.data?.business_structure,
        primaryIndustry: profile.primary_industry,
        managedUsers: [], // Hydration of roster would happen here for agents via a separate query if needed
        activeViewId: activeViewId
      };
    },

    login: async (email: string) => {
      // Magic Link Login for simplicity in this demo, or Password
      const { data, error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      return data;
    },

    updateUser: async (updates: Partial<User>) => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;

       // Map frontend User fields back to DB columns
       const profileUpdates: any = {};
       if (updates.name) profileUpdates.name = updates.name;
       if (updates.phone) profileUpdates.phone = updates.phone;
       if (updates.organizationName) profileUpdates.organization_name = updates.organizationName;
       if (updates.role) profileUpdates.role = updates.role;
       if (updates.province) profileUpdates.province = updates.province;
       if (updates.isOnboarded !== undefined) profileUpdates.is_onboarded = updates.isOnboarded;
       if (updates.primaryIndustry) profileUpdates.primary_industry = updates.primaryIndustry;
       if (updates.accountType) profileUpdates.account_type = updates.accountType;

       if (Object.keys(profileUpdates).length > 0) {
           await supabase.from('profiles').update(profileUpdates).eq('id', user.id);
       }

       if (updates.businessStructure) {
           await supabase.from('financial_profiles').upsert({
               user_id: user.id,
               business_structure: updates.businessStructure
           });
       }
    },
    
    // Stub for Agent specific logic
    addClient: async (client: any) => { 
        console.log("Add client logic: In a full implementation, this creates a shadow profile in 'profiles' table with managed_by set to current agent.");
    },

    switchClient: (clientId: string | undefined) => {
        if (clientId) localStorage.setItem('cinearch_active_view', clientId);
        else localStorage.removeItem('cinearch_active_view');
        // Force reload to update context across the app
        window.location.reload(); 
    },

    logout: async () => {
      await supabase.auth.signOut();
      localStorage.removeItem('cinearch_active_view');
      window.location.href = '/';
    }
  },

  jobs: {
    list: async (userId?: string): Promise<Job[]> => {
      let targetId = userId;
      if (!targetId) {
        const { data } = await supabase.auth.getUser();
        targetId = data.user?.id;
      }
      if (!targetId) return [];

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', targetId)
        .order('start_date', { ascending: false });

      if (error) { console.error("Error fetching jobs", error); return []; }
      return data.map(mapJob);
    },

    add: async (job: Job) => {
      const { data, error } = await supabase.from('jobs').insert({
        user_id: job.userId,
        production_name: job.productionName,
        company_name: job.companyName,
        status: job.status,
        role_name: job.role,
        start_date: job.startDate,
        end_date: job.endDate,
        total_hours: job.totalHours,
        gross_earnings: job.grossEarnings,
        is_union: job.isUnion,
        union_name: job.unionName,
        union_type_id: job.unionTypeId,
        genre: job.genre,
        image_url: job.imageUrl
      }).select().single();

      if (error) throw error;
      
      // Auto-Create Income Entry if earnings > 0
      if (job.grossEarnings && job.grossEarnings > 0) {
         await supabase.from('income_entries').insert({
             job_id: data.id,
             user_id: job.userId,
             subtotal: job.grossEarnings,
             date_invoiced: job.startDate, 
             place_of_supply: 'ON', 
             description: `Production Fee: ${job.productionName}`,
             category: 'PRODUCTION_FEE'
         });
      }
      return mapJob(data);
    },

    update: async (job: Job) => {
       // Implementation of update
       await supabase.from('jobs').update({
        production_name: job.productionName,
        company_name: job.companyName,
        status: job.status,
        role_name: job.role,
        start_date: job.startDate,
        end_date: job.endDate,
        total_hours: job.totalHours,
        gross_earnings: job.grossEarnings,
        is_union: job.isUnion,
        union_name: job.unionName,
        union_type_id: job.unionTypeId,
        genre: job.genre,
        image_url: job.imageUrl
       }).eq('id', job.id);
    },

    delete: async (id: string) => {
        await supabase.from('jobs').delete().eq('id', id);
    }
  },

  tracking: {
    get: async (userId?: string) => {
      let targetId = userId;
      if (!targetId) {
         const { data } = await supabase.auth.getUser();
         targetId = data.user?.id;
      }
      if (!targetId) return [];

      const { data } = await supabase.from('user_union_tracking').select('*').eq('user_id', targetId);
      return (data || []).map(mapTracking);
    },

    save: async (trackings: UserUnionTracking[]) => {
        const rows = trackings.map(t => ({
            user_id: t.userId,
            union_type_id: t.unionTypeId,
            union_name: t.unionName,
            tier_label: t.tierLabel,
            department: t.department,
            target_type: t.targetType,
            target_value: t.targetValue,
            starting_value: t.startingValue
        }));
        
        await supabase.from('user_union_tracking').upsert(rows);
    },

    calculateProgress: (trackingId: string, allJobs: Job[], trackings: UserUnionTracking[]) => {
       const track = trackings.find(t => t.id === trackingId);
       if (!track) return { current: 0, potential: 0, target: 0, percent: 0, potentialPercent: 0 };

       let relevantJobs = allJobs.filter(j => j.isUnion && j.unionName === track.unionName);
       if (track.department) {
           // Loose matching for department/role for now
           relevantJobs = relevantJobs.filter(j => j.role.includes(track.department!) || j.department === track.department);
       }

       const countValue = (jobs: Job[]) => {
           if (track.targetType === 'HOURS') return jobs.reduce((acc, j) => acc + j.totalHours, 0);
           if (track.targetType === 'DAYS') return jobs.length; 
           if (track.targetType === 'EARNINGS') return jobs.reduce((acc, j) => acc + (j.grossEarnings || 0), 0);
           return jobs.length; 
       };

       const confirmed = countValue(relevantJobs.filter(j => j.status === 'CONFIRMED'));
       const tentative = countValue(relevantJobs.filter(j => j.status === 'TENTATIVE'));
       
       const currentTotal = track.startingValue + confirmed;
       const potentialTotal = currentTotal + tentative;

       return {
           current: currentTotal,
           potential: potentialTotal,
           target: track.targetValue,
           percent: Math.min(100, (currentTotal / track.targetValue) * 100),
           potentialPercent: Math.min(100, (potentialTotal / track.targetValue) * 100)
       };
    }
  },

  finance: {
    getTransactions: async (userId?: string): Promise<FinanceTransaction[]> => {
       let targetId = userId;
       if (!targetId) {
          const { data } = await supabase.auth.getUser();
          targetId = data.user?.id;
       }
       if (!targetId) return [];

       const [incomeRes, expenseRes] = await Promise.all([
           supabase.from('income_entries').select('*').eq('user_id', targetId),
           supabase.from('expenses').select('*').eq('user_id', targetId)
       ]);

       const income = (incomeRes.data || []).map((row: any) => ({
           id: row.id,
           userId: row.user_id,
           type: 'INCOME' as const,
           dateIncurred: row.date_invoiced,
           description: row.description || 'Income',
           category: row.category || 'SERVICE_FEES',
           amountBeforeTax: Number(row.subtotal),
           taxAmount: Number(row.tax_collected_gst) + Number(row.tax_collected_pst_qst),
           totalAmount: Number(row.subtotal) + Number(row.tax_collected_gst) + Number(row.tax_collected_pst_qst),
           businessUsePercent: 100
       }));

       const expenses = (expenseRes.data || []).map((row: any) => ({
           id: row.id,
           userId: row.user_id,
           type: 'EXPENSE' as const,
           dateIncurred: row.date_incurred,
           description: row.description,
           category: row.category,
           amountBeforeTax: Number(row.amount), 
           taxAmount: Number(row.tax_paid_gst) + Number(row.tax_paid_pst),
           totalAmount: Number(row.amount) + Number(row.tax_paid_gst) + Number(row.tax_paid_pst),
           businessUsePercent: 100,
           deductibleAmount: (Number(row.amount) * (Number(row.claimable_percentage) / 100))
       }));

       return [...income, ...expenses].sort((a, b) => 
           new Date(b.dateIncurred).getTime() - new Date(a.dateIncurred).getTime()
       );
    },

    add: async (tx: Partial<FinanceTransaction>) => {
       if (tx.type === 'INCOME') {
           await supabase.from('income_entries').insert({
               user_id: tx.userId,
               subtotal: tx.amountBeforeTax,
               tax_collected_gst: tx.taxAmount,
               date_invoiced: tx.dateIncurred,
               description: tx.description,
               category: tx.category
           });
       } else {
           const claimable = tx.category === 'MEALS_ENTERTAINMENT' ? 50 : 100;
           await supabase.from('expenses').insert({
               user_id: tx.userId,
               amount: tx.amountBeforeTax,
               tax_paid_gst: tx.taxAmount,
               date_incurred: tx.dateIncurred,
               description: tx.description,
               category: tx.category,
               claimable_percentage: claimable
           });
       }
    },

    getStats: (transactions: FinanceTransaction[]): FinanceStats => {
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
    
    checkGstThreshold: (grossIncome: number) => grossIncome >= 30000,
    getThresholdProgress: (grossIncome: number) => Math.min(100, (grossIncome / 30000) * 100)
  },

  vault: {
      list: async (): Promise<ResidencyDocument[]> => {
          // Stub for now or fetch from a 'documents' table if it existed
          return []; 
      },
      add: async (doc: ResidencyDocument) => {
          console.log("Upload to Supabase Storage bucket 'vault' would happen here", doc);
      },
      delete: async (id: string) => {
          console.log("Delete from Supabase Storage", id);
      }
  }
};
