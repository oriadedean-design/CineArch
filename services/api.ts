
import { supabase } from '../lib/supabase';
import { 
  Profile, Organization, OrgMembership, OrgSeat, Subscription, 
  IncomeEntry, Expense, FinancialProfile, Job, UsageCounter, User, UserUnionTracking, ResidencyDocument
} from '../types';

// Helpers
const getActiveOrgId = () => localStorage.getItem('cinearch_org_id');
const setActiveOrgId = (id: string) => localStorage.setItem('cinearch_org_id', id);

export const api = {
  auth: {
    getSession: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    
    getProfile: async (): Promise<Profile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      // Mock if table empty during dev
      if (!data) return { id: user.id, email: user.email!, name: 'New User', updated_at: new Date().toISOString() };
      return data;
    },

    getUser: async (): Promise<User | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        // Mock User Mapping from Profile
        const p = await api.auth.getProfile();
        return {
            id: user.id,
            email: user.email || '',
            name: p?.name || 'User',
            accountType: 'INDIVIDUAL',
            // Default props to satisfy User interface
            role: '',
            province: '',
            isOnboarded: !!p?.name,
        } as User;
    },

    login: async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
    },

    updateUser: async (updates: Partial<User>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // In real app, map User updates to Profile updates or other tables
        const { error } = await supabase.from('profiles').update({ name: updates.name }).eq('id', user.id);
        if (error) console.error("Update profile failed", error);
    },

    // Get all organizations the user belongs to
    getMyMemberships: async (): Promise<OrgMembership[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('org_memberships')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) console.error("Error fetching memberships:", error);
      return data || [];
    },

    logout: async () => {
      await supabase.auth.signOut();
      localStorage.removeItem('cinearch_org_id');
      window.location.href = '/';
    }
  },

  // --- Organization & Agency Logic ---
  orgs: {
    // Switch context
    switchOrg: (orgId: string) => {
      setActiveOrgId(orgId);
      window.location.reload();
    },

    getCurrentContext: async (): Promise<{ org: Organization, role: string } | null> => {
      const orgId = getActiveOrgId();
      if (!orgId) return null;
      
      const { data } = await supabase.from('organizations').select('*').eq('id', orgId).single();
      const { data: mem } = await supabase.from('org_memberships').select('member_role').eq('org_id', orgId).eq('user_id', (await supabase.auth.getUser()).data.user?.id).single();
      
      if (!data) return null;
      return { org: data, role: mem?.member_role || 'member' };
    },

    getSeats: async (orgId: string): Promise<OrgSeat[]> => {
      const { data } = await supabase
        .from('org_seats')
        .select(`*, assigned_profile:profiles(*)`)
        .eq('org_id', orgId);
      return data || [];
    },

    getRoster: async (orgId: string): Promise<OrgMembership[]> => {
      const { data } = await supabase
        .from('org_memberships')
        .select(`*, profile:profiles(*)`)
        .eq('org_id', orgId);
      return data || [];
    },

    inviteMember: async (orgId: string, email: string) => {
       const { error } = await supabase.from('org_invitations').insert({
         org_id: orgId,
         email,
         token: Math.random().toString(36),
         expires_at: new Date(Date.now() + 86400000).toISOString(),
         created_by: (await supabase.auth.getUser()).data.user?.id
       });
       if (error) throw error;
    },

    getUsage: async (orgId: string): Promise<UsageCounter | null> => {
       const period = new Date().getFullYear() * 100 + (new Date().getMonth() + 1);
       const { data } = await supabase.from('usage_counters').select('*').eq('org_id', orgId).eq('period_yyyymm', period).single();
       return data;
    },
    
    getSubscription: async (orgId: string): Promise<Subscription | null> => {
        const { data } = await supabase.from('subscriptions').select('*').eq('org_id', orgId).single();
        return data;
    }
  },

  // --- Financials (Scoped to Org) ---
  finance: {
    getProfile: async (orgId: string): Promise<FinancialProfile | null> => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return null;
       const { data } = await supabase.from('financial_profiles')
         .select('*')
         .eq('user_id', user.id) 
         .single();
       return data;
    },

    listIncome: async (orgId: string): Promise<IncomeEntry[]> => {
      const { data } = await supabase.from('income_entries')
        .select('*')
        .eq('org_id', orgId)
        .order('date_invoiced', { ascending: false });
      return data || [];
    },

    listExpenses: async (orgId: string): Promise<Expense[]> => {
      const { data } = await supabase.from('expenses')
        .select('*')
        .eq('org_id', orgId)
        .order('date_incurred', { ascending: false });
      return data || [];
    },

    addExpense: async (expense: Partial<Expense>) => {
       const { error } = await supabase.from('expenses').insert(expense);
       if (error) throw error;
    }
  },

  // --- Jobs ---
  jobs: {
    list: async (orgId?: string): Promise<Job[]> => {
       const { data } = await supabase.from('jobs').select('*');
       return (data || []).map((row: any) => ({
           id: row.id,
           org_id: orgId || '',
           userId: row.user_id,
           status: row.status,
           productionName: row.production_name,
           companyName: row.company_name,
           role: row.role_name,
           startDate: row.start_date,
           totalHours: row.total_hours,
           isUnion: row.is_union,
           grossEarnings: row.gross_earnings,
           documentCount: 0,
           imageUrl: row.image_url,
           genre: row.genre
       }));
    },
    add: async (job: Job) => {
        // Map to DB columns
        const { error } = await supabase.from('jobs').insert({
            user_id: job.userId,
            status: job.status,
            production_name: job.productionName,
            start_date: job.startDate,
            total_hours: job.totalHours
            // ... other fields
        });
        if (error) console.error(error);
    },
    update: async (job: Job) => {
        const { error } = await supabase.from('jobs').update({
            production_name: job.productionName,
            // ...
        }).eq('id', job.id);
        if (error) console.error(error);
    },
    delete: async (id: string) => {
        await supabase.from('jobs').delete().eq('id', id);
    }
  },

  // --- Tracking ---
  tracking: {
      get: async (userId?: string): Promise<UserUnionTracking[]> => {
          // Placeholder for tracking table
          return [];
      },
      save: async (trackings: UserUnionTracking[]) => {
          // Placeholder for save
      },
      calculateProgress: (trackingId: string, jobs: Job[], allTrackings: UserUnionTracking[]) => {
          const track = allTrackings.find(t => t.id === trackingId);
          if (!track) return { current: 0, potential: 0, target: 0, percent: 0, potentialPercent: 0 };

          // Basic logic replication
          let baseJobs = jobs.filter(j => j.isUnion && j.unionName === track.unionName);
          if (track.department) {
            baseJobs = baseJobs.filter(j => j.department === track.department);
          }
          
          const countValue = (jList: Job[]) => {
            if (track.targetType === 'HOURS') return jList.reduce((sum, j) => sum + j.totalHours, 0);
            if (track.targetType === 'DAYS') return jList.length; 
            if (track.targetType === 'CREDITS') return jList.length;
            if (track.targetType === 'EARNINGS') return jList.reduce((sum, j) => sum + (j.grossEarnings || 0), 0);
            return 0;
          };

          const confirmedVal = countValue(baseJobs.filter(j => j.status === 'CONFIRMED'));
          const tentativeVal = countValue(baseJobs.filter(j => j.status === 'TENTATIVE'));
          const totalConfirmed = track.startingValue + confirmedVal;
          const totalPotential = totalConfirmed + tentativeVal;

          return { 
            current: totalConfirmed, 
            potential: totalPotential, 
            target: track.targetValue, 
            percent: Math.min((totalConfirmed / (track.targetValue || 1)) * 100, 100),
            potentialPercent: Math.min((totalPotential / (track.targetValue || 1)) * 100, 100)
          };
      }
  },

  // --- Vault ---
  vault: {
      list: async (): Promise<ResidencyDocument[]> => {
          return [];
      },
      add: async (doc: ResidencyDocument) => {},
      delete: async (id: string) => {}
  }
};
