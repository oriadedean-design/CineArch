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
        activeViewId: undefined 
      };
    },
    
    // 2. Database Authentication
    async login(email: string, password?: string, asAgent: boolean = false): Promise<User> {
        if (!password) throw new Error("SEC_ERR_04: Authentication key required.");

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
          // If user doesn't exist in demo mode, we might auto-signup, but for CineArch we follow strict protocols
          throw error;
        }

        if (!data.user) throw new Error("AUTH_ERR: Failed to retrieve user session.");

        const user = await api.auth.getUser();
        if (!user) throw new Error("PROFILE_ERR: CineArch profile not found.");
        return user;
    },

    // 3. Update User Profile
    async updateUser(updates: Partial<User>): Promise<User | null> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Map CineArch UI types to DB snake_case
      const dbUpdates: any = {};
      if (updates.province) dbUpdates.province = updates.province;
      if (updates.role) dbUpdates.role = updates.role;
      if (updates.name) dbUpdates.full_name = updates.name;
      if (updates.accountType) dbUpdates.account_type = updates.accountType;
      if (updates.isPremium !== undefined) dbUpdates.is_premium = updates.isPremium;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id);

      if (error) throw error;
      return api.auth.getUser();
    },

    async switchClient(clientId: string | null) {
      // For Supabase, we might use a state management library, but here we update a session-level state
      // This is primarily for Agent view logic
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
      // In production, this would involve sending an invite
      // For demo: updates the target user's profile to link to this agent
      const { data: { user: agent } } = await supabase.auth.getUser();
      if (!agent) return;

      await supabase
        .from('profiles')
        .update({ managing_agency_id: agent.id })
        .eq('email', client.email);
    },

    async logout() {
      await supabase.auth.signOut();
      localStorage.removeItem('cinearch_user'); // Cleanup any legacy keys
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
    get: (targetId?: string): UserUnionTracking[] => {
      // Synchronous return fallback for local UI state - ideally moved to async DB fetch
      return JSON.parse(localStorage.getItem(`cinearch_tracking_${targetId || 'me'}`) || '[]');
    },
    save: (trackings: UserUnionTracking[]) => {
      localStorage.setItem(`cinearch_tracking_me`, JSON.stringify(trackings));
    },
    calculateProgress: (trackId: string, jobs: Job[]) => {
      const trackings = JSON.parse(localStorage.getItem(`cinearch_tracking_me`) || '[]');
      const track = trackings.find((t: any) => t.id === trackId);
      if (!track || !Array.isArray(jobs)) return { percent: 0, current: 0, target: 0 };
      
      let current = track.startingValue || 0;
      jobs.forEach(j => {
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

       // Mirror to DB if a vault table exists, otherwise Storage is source of truth
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
      // Client-side cleanup
      localStorage.clear();
      await supabase.auth.signOut();
    }
  }
};