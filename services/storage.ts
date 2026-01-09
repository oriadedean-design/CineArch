
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
    async login(email: string, password?: string, asAgent: boolean = false): Promise<User> {
        if (!password) throw new Error("SEC_ERR_04: Authentication key required.");

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
          throw error;
        }

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

      // Map CineArch UI types to DB snake_case for PostgreSQL compatibility
      const dbUpdates: any = {};
      if (updates.province) dbUpdates.province = updates.province;
      if (updates.role) dbUpdates.role = updates.role;
      if (updates.name) dbUpdates.full_name = updates.name;
      if (updates.accountType) dbUpdates.account_type = updates.accountType;
      if (updates.isPremium !== undefined) dbUpdates.is_premium = updates.isPremium;
      
      // Onboarding specific mappings
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

    async switchClient(clientId: string | null) {
      // Logic for session impersonation or context switching for agents
    },

    async revokeAgency() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { error } = await supabase
        .from('profiles')
        .update({ managing_agency_id: null })
        .eq('id', user.id);

      if (error) throw error;
      return api.auth.getUser();
    },

    async removeManagedUser(clientId: string) {
      const { error } = await supabase
        .from('profiles')
        .update({ managing_agency_id: null })
        .eq('id', clientId);
      
      if (error) throw error;
    },

    async addClient(client: User) {
      const { data: { user: agent } } = await supabase.auth.getUser();
      if (!agent) return;

      await supabase
        .from('profiles')
        .update({ managing_agency_id: agent.id })
        .eq('email', client.email);
    },

    async logout() {
      await supabase.auth.signOut();
      localStorage.removeItem('cinearch_user'); 
      window.location.reload();
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
          // Corrected from job.is_union to job.isUnion to match interface
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

    async update(job: Job): Promise<Job> {
      const { error } = await supabase
        .from('jobs')
        .update({
          production_name: job.productionName,
          role_name: job.role,
          gross_earnings: job.grossEarnings,
          start_date: job.startDate,
          is_union: job.isUnion,
          union_name: job.unionName,
          status: job.status,
          hours_worked: job.totalHours || 0
        })
        .eq('id', job.id);

      if (error) throw error;
      return job;
    },

    async delete(id: string) {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error) throw error;
    }
  },

  tracking: {
    get: async (targetId?: string): Promise<UserUnionTracking[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('union_tracking')
        .select('*')
        .eq('user_id', targetId || user.id);

      if (error) return [];
      
      // Map DB snake_case to TS camelCase
      return data.map(t => ({
        id: t.id,
        userId: t.user_id,
        unionTypeId: t.union_type_id,
        unionName: t.union_name,
        targetType: t.target_type,
        targetValue: t.target_value,
        startingValue: t.current_value,
        tierLabel: t.tier_label || 'Standard' // Default or fetch from DB
      }));
    },

    save: async (trackings: UserUnionTracking[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // We map the array to DB rows
      const dbRows = trackings.map(t => ({
        user_id: user.id,
        union_type_id: t.unionTypeId,
        union_name: t.unionName,
        target_type: t.targetType,
        // Fix: Use targetValue instead of target_value to match UserUnionTracking interface
        target_value: t.targetValue,
        current_value: t.startingValue,
        tier_label: t.tierLabel
      }));

      const { error } = await supabase
        .from('union_tracking')
        .upsert(dbRows, { onConflict: 'user_id, union_type_id' }); // Prevents duplicates

      if (error) console.error("Tracking Save Failed", error);
    },
    
    // UI Utility: Calculates progress relative to a set of jobs
    calculateProgress: (track: UserUnionTracking, jobs: Job[]) => {
      if (!track || !Array.isArray(jobs)) return { percent: 0, current: 0, target: 0 };
      
      let current = track.startingValue || 0;
      jobs.forEach(j => {
        // Intersect jurisdictional marks
        if (j.unionTypeId === track.unionTypeId || j.unionName === track.unionName) {
           if (track.targetType === 'EARNINGS') current += (j.grossEarnings || 0);
           else if (track.targetType === 'HOURS') current += (j.totalHours || 0);
           else if (track.targetType === 'DAYS') current += 1; 
           else if (track.targetType === 'CREDITS') current += 1;
        }
      });
      
      return {
        percent: Math.min(100, (current / track.targetValue) * 100),
        current,
        target: track.targetValue
      };
    }
  },

  vault: {
    async list(): Promise<ResidencyDocument[]> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.storage
        .from('user-documents')
        .list(`${user.id}/`);
         
      if (error) return [];
       
      return data.map(f => ({
        id: f.id,
        userId: user.id,
        type: 'Residency',
        fileName: f.name,
        uploadedAt: f.created_at,
        verified: true
      }));
    },

    async add(doc: ResidencyDocument, fileObj?: File) {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error("SEC_ERR_05: Session expired.");
       
       if (fileObj) {
         const filePath = `${user.id}/${Date.now()}_${fileObj.name}`;
         const { error: uploadError } = await supabase.storage
           .from('user-documents')
           .upload(filePath, fileObj);
         if (uploadError) throw uploadError;
       }

       return doc;
    },

    async delete(id: string) {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;
       await supabase.storage.from('user-documents').remove([`${user.id}/${id}`]);
    }
  },

  system: {
    async resetData() {
      localStorage.clear();
      await supabase.auth.signOut();
    }
  }
};
