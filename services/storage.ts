
import { supabase } from './supabase';
import { User, Job, UserUnionTracking, ResidencyDocument } from '../types';

/**
 * CINEARCH DATA BRIDGE (SUPABASE VERSION)
 * High-performance persistence layer utilizing Supabase Auth, PostgreSQL, and S3-compatible Storage.
 * Mapped to maintain compatibility with CineArch editorial UI.
 */

export const api = {
  auth: {
    // 1. Get Current Session & Profile
    getUser: async (): Promise<User | null> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      // Fetch the "Profile" row which contains CineArch-specific metadata
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) return null;

      // If Agent, fetch their roster
      let managedUsers: User[] = [];
      if (profile.account_type === 'AGENT') {
        const { data: roster } = await supabase
          .from('profiles')
          .select('*')
          .eq('managing_agency_id', profile.id);
        
        if (roster) {
          managedUsers = roster.map(r => ({
            id: r.id,
            name: r.full_name || r.email,
            email: r.email,
            role: r.role || 'Member',
            province: r.province,
            isOnboarded: true,
            accountType: 'INDIVIDUAL',
            selectedRoles: r.selected_roles
          } as User));
        }
      }

      return {
        id: profile.id,
        name: profile.full_name || session.user.email,
        email: profile.email || session.user.email!,
        role: profile.role || 'Member',
        province: profile.province,
        isOnboarded: !!profile.province, 
        accountType: (profile.account_type as 'INDIVIDUAL' | 'AGENT') || 'INDIVIDUAL',
        isPremium: profile.is_premium,
        managedByAgencyId: profile.managing_agency_id,
        department: profile.department,
        selectedRoles: profile.selected_roles,
        managedUsers,
        activeViewId: undefined 
      };
    },
    
    // 2. Database Authentication (Login)
    // Updated signature to accept optional asAgent flag
    async login(email: string, password?: string, asAgent?: boolean): Promise<User> {
        if (!password) throw new Error("SEC_ERR_04: Authentication key required.");

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        if (!data.user) throw new Error("AUTH_ERR: Failed to retrieve user session.");

        const user = await api.auth.getUser();
        if (!user) throw new Error("PROFILE_ERR: CineArch profile not found.");
        return user;
    },

    // 2b. Database Registration (New Personnel)
    async register(email: string, password?: string, asAgent: boolean = false): Promise<User> {
      if (!password) throw new Error("SEC_ERR_04: Access key required.");
      if (password.length < 6) throw new Error("AUTH_ERR: Access key must be at least 6 characters.");

      // 1. Create Auth User
      const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
              data: { 
                  full_name: email.split('@')[0],
                  account_type: asAgent ? 'AGENT' : 'INDIVIDUAL'
              }
          }
      });

      if (error) throw error;
      if (!data.user) throw new Error("AUTH_ERR: Personnel record creation failed.");

      // 2. Create Profile Row (Fallback for SQL triggers)
      const { error: profileError } = await supabase.from('profiles').upsert([{
          id: data.user.id,
          email: email,
          role: asAgent ? 'Agent' : 'Member',
          account_type: asAgent ? 'AGENT' : 'INDIVIDUAL',
          province: '', 
          full_name: email.split('@')[0]
      }]);

      if (profileError && !profileError.message.includes('duplicate')) {
          console.error("Profile creation warning:", profileError);
      }

      // 3. Handle Email Confirmation Edge Case
      if (!data.session) {
          throw new Error("REG_SUCCESS: Verification required. Please check your digital coordinate (email).");
      }

      // 4. Return Hydrated User
      const user = await api.auth.getUser();
      if (!user) throw new Error("PROFILE_ERR: CineArch profile initialization failed.");
      return user;
    },

    // 3. Update User Profile
    async updateUser(updates: Partial<User>): Promise<User | null> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const dbUpdates: any = {};
      if (updates.province) dbUpdates.province = updates.province;
      if (updates.role) dbUpdates.role = updates.role;
      if (updates.name) dbUpdates.full_name = updates.name;
      if (updates.accountType) dbUpdates.account_type = updates.accountType;
      if (updates.isPremium !== undefined) dbUpdates.is_premium = updates.isPremium;
      if (updates.department) dbUpdates.department = updates.department;
      if (updates.selectedRoles) dbUpdates.selected_roles = updates.selectedRoles;
      if (updates.hasAgentFee !== undefined) dbUpdates.has_agent_fee = updates.hasAgentFee;
      if (updates.agentFeePercentage !== undefined) dbUpdates.agent_fee_percentage = updates.agentFeePercentage;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id);

      if (error) throw error;
      return api.auth.getUser();
    },

    async logout() {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Sign Out Error:", error);
      localStorage.removeItem('cinearch_user'); 
      window.location.reload();
    },

    // Manage active client context for agents
    switchClient: async (clientId: string | null): Promise<void> => {
      if (clientId) localStorage.setItem('cinearch_active_client', clientId);
      else localStorage.removeItem('cinearch_active_client');
    },

    // Add managed individual to agent's roster
    addClient: async (client: User): Promise<void> => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;
       await supabase.from('profiles').upsert([{
         id: client.id,
         email: client.email,
         full_name: client.name,
         role: client.role,
         province: client.province,
         account_type: 'INDIVIDUAL',
         managing_agency_id: user.id,
         is_onboarded: true
       }]);
    },

    // Revoke agency access to individual's profile
    revokeAgency: async (): Promise<void> => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;
       await supabase.from('profiles').update({ managing_agency_id: null }).eq('id', user.id);
    },

    // Remove a managed individual from an agent's roster
    removeManagedUser: async (clientId: string): Promise<void> => {
       await supabase.from('profiles').update({ managing_agency_id: null }).eq('id', clientId);
    }
  },

  jobs: {
    async list(): Promise<Job[]> {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(j => ({
        id: j.id,
        userId: j.user_id,
        productionName: j.production_name,
        role: j.role_name,
        grossEarnings: j.gross_earnings, 
        startDate: j.start_date,
        isUnion: j.is_union,
        unionName: j.union_name,
        status: j.status,
        province: j.province,
        totalHours: j.hours_worked || 0,
        documentCount: 0,
        createdAt: j.created_at
      } as Job));
    },

    async listForClient(clientId: string): Promise<Job[]> {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', clientId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(j => ({
        id: j.id,
        userId: j.user_id,
        productionName: j.production_name,
        role: j.role_name,
        startDate: j.start_date,
        isUnion: j.is_union,
        unionName: j.union_name,
        status: j.status,
        grossEarnings: j.gross_earnings,
        totalHours: j.hours_worked,
        documentCount: 0
      } as Job));
    },

    async add(job: Job): Promise<Job> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("SEC_ERR_05: Session expired.");

      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          user_id: job.userId || user.id,
          production_name: job.productionName,
          role_name: job.role,
          gross_earnings: job.grossEarnings,
          start_date: job.startDate,
          province: job.province,
          is_union: job.isUnion,
          union_name: job.unionName,
          status: job.status,
          hours_worked: job.totalHours || 0
        }])
        .select()
        .single();

      if (error) throw error;
      return { ...job, id: data.id };
    },

    // Update existing job record
    async update(job: Job): Promise<Job> {
      const { error } = await supabase
        .from('jobs')
        .update({
          production_name: job.productionName,
          role_name: job.role,
          gross_earnings: job.grossEarnings,
          start_date: job.startDate,
          province: job.province,
          is_union: job.isUnion,
          union_name: job.unionName,
          status: job.status,
          hours_worked: job.totalHours || 0
        })
        .eq('id', job.id);
      if (error) throw error;
      return job;
    }
  },

  tracking: {
    // Retrieve union tracking records for a user
    get: async (userId?: string): Promise<UserUnionTracking[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      const targetId = userId || user?.id;
      if (!targetId) return [];
      const { data } = await supabase.from('union_tracking').select('*').eq('user_id', targetId);
      return (data || []).map(t => ({
        id: t.id,
        userId: t.user_id,
        unionTypeId: t.union_type_id,
        unionName: t.union_name,
        tierLabel: t.tier_label,
        targetType: t.target_type,
        targetValue: t.target_value,
        startingValue: t.starting_value
      }));
    },
    // Persist union tracking records
    save: async (trackings: UserUnionTracking[]): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const rows = trackings.map(t => ({
        id: t.id,
        user_id: user.id,
        union_type_id: t.unionTypeId,
        union_name: t.unionName,
        tier_label: t.tier_label,
        target_type: t.target_type,
        target_value: t.target_value,
        starting_value: t.startingValue
      }));
      await supabase.from('union_tracking').upsert(rows);
    },
    // Calculate progress towards union tier requirements
    calculateProgress: (track: UserUnionTracking, jobs: Job[]) => {
      const relevantJobs = jobs.filter(j => j.unionName === track.unionName);
      let current = track.startingValue || 0;
      if (track.targetType === 'HOURS') {
        current += relevantJobs.reduce((acc, job) => acc + (job.totalHours || 0), 0);
      } else {
        current += relevantJobs.length;
      }
      const percent = Math.min(100, (current / track.targetValue) * 100);
      return { percent, current, target: track.targetValue };
    }
  },

  vault: {
    // List archival documents for current user
    list: async (): Promise<ResidencyDocument[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from('vault').select('*').eq('user_id', user.id);
      return (data || []).map(d => ({
        id: d.id,
        userId: d.user_id,
        type: d.type,
        fileName: d.file_name,
        uploadedAt: d.uploaded_at,
        verified: d.verified
      }));
    },
    // Add document to the vault
    add: async (doc: ResidencyDocument): Promise<void> => {
      await supabase.from('vault').insert([{
        id: doc.id,
        user_id: doc.userId,
        type: doc.type,
        file_name: doc.fileName,
        uploaded_at: doc.uploadedAt,
        verified: doc.verified
      }]);
    },
    // Delete document from the vault
    delete: async (id: string): Promise<void> => {
      await supabase.from('vault').delete().eq('id', id);
    }
  },

  system: {
    // Purge user data (reset protocol)
    resetData: async (): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await Promise.all([
        supabase.from('jobs').delete().eq('user_id', user.id),
        supabase.from('union_tracking').delete().eq('user_id', user.id),
        supabase.from('vault').delete().eq('user_id', user.id)
      ]);
    }
  }
};
