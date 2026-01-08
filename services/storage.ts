import { User, Job, UserUnionTracking, ResidencyDocument } from '../types';
import { supabase } from './supabase';

const USER_KEY = 'cinearch_user';
const DATA_PREFIX = 'cinearch_data_';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * LOCAL FALLBACK HANDLERS
 * Used for demo purposes or when Supabase keys are unconfigured.
 */
const getStorage = <T>(key: string, defaultVal: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultVal;
  try { return JSON.parse(stored); } catch { return defaultVal; }
};

const setStorage = (key: string, val: any) => {
  localStorage.setItem(key, JSON.stringify(val));
};

const getContextId = (): string => {
  const user = getStorage<User | null>(USER_KEY, null);
  return user?.activeViewId || user?.id || 'anon';
};

const getKeys = (targetId?: string) => {
  const id = targetId || getContextId();
  return {
    JOBS: `${DATA_PREFIX}jobs_${id}`,
    TRACKING: `${DATA_PREFIX}tracking_${id}`,
    VAULT: `${DATA_PREFIX}vault_${id}`
  };
};

/**
 * CINEARCH DATA BRIDGE
 * Primary: Supabase (Remote DB)
 * Secondary: LocalStorage (Local Cache / Fallback)
 */
export const api = {
  auth: {
    getUser: (): User | null => getStorage<User | null>(USER_KEY, null),
    
    async login(email: string, asAgent: boolean = false): Promise<User> {
      await delay(600);
      let user = getStorage<User | null>(USER_KEY, null);
      if (!user || user.email !== email) {
        user = {
          id: asAgent ? `agent_${Date.now()}` : `user_${Date.now()}`,
          name: asAgent ? 'Talent Manager' : 'Film Worker',
          email,
          role: asAgent ? 'Agent' : '',
          province: '',
          isOnboarded: false,
          isPremium: asAgent,
          accountType: asAgent ? 'AGENT' : 'INDIVIDUAL',
          managedUsers: asAgent ? [] : undefined,
          hasAgentFee: false,
          agentFeePercentage: 10
        };
        setStorage(USER_KEY, user);
      }
      return user;
    },

    async updateUser(updates: Partial<User>): Promise<User | null> {
      const user = getStorage<User | null>(USER_KEY, null);
      if (user) {
        const updated = { ...user, ...updates };
        setStorage(USER_KEY, updated);

        // Remote Sync
        try {
          const { error } = await supabase.from('profiles').upsert({ id: user.id, ...updates });
          if (error) throw error;
        } catch (e) {
          console.debug("Remote profile sync pending (local update succeeded)");
        }
        
        return updated;
      }
      return null;
    },

    async addClient(client: User) {
      const agent = getStorage<User | null>(USER_KEY, null);
      if (agent && agent.accountType === 'AGENT') {
        const managed = agent.managedUsers || [];
        const updatedAgent = { ...agent, managedUsers: [...managed, client] };
        setStorage(USER_KEY, updatedAgent);
        
        // Remote Sync
        try {
          await supabase.from('agency_clients').insert({ agent_id: agent.id, client_id: client.id });
        } catch (e) {
          console.debug("Remote link sync pending");
        }
      }
    },

    async revokeAgency() {
      const user = getStorage<User | null>(USER_KEY, null);
      if (user) {
        // PRODUCTION: Kill RLS by removing the agency link in DB
        try {
          await supabase
            .from('jobs')
            .update({ managing_agency_id: null })
            .eq('user_id', user.id);
        } catch (e) {
          console.debug("Remote RLS revocation pending");
        }

        const updated = { ...user, hasAgentFee: false, managedByAgencyId: undefined };
        setStorage(USER_KEY, updated);
        return updated;
      }
      return null;
    },

    async removeManagedUser(clientId: string) {
      const agent = getStorage<User | null>(USER_KEY, null);
      if (agent && agent.accountType === 'AGENT') {
        const managed = agent.managedUsers?.filter(u => u.id !== clientId) || [];
        setStorage(USER_KEY, { ...agent, managedUsers: managed });

        try {
          await supabase.from('agency_clients').delete().match({ agent_id: agent.id, client_id: clientId });
        } catch (e) {
          console.debug("Remote unlink pending");
        }
      }
    },

    switchClient(clientId: string | null) {
      const user = getStorage<User | null>(USER_KEY, null);
      if (user) {
        setStorage(USER_KEY, { ...user, activeViewId: clientId || undefined });
      }
    },

    async logout() {
      localStorage.removeItem(USER_KEY);
      window.location.reload();
    }
  },

  jobs: {
    async list(): Promise<Job[]> {
      const user = api.auth.getUser();
      const targetId = getContextId();

      // Remote Primary
      try {
        const { data, error } = await supabase
          .from(user?.accountType === 'AGENT' && user.activeViewId ? 'agency_jobs_view' : 'jobs')
          .select('*')
          .eq('user_id', targetId)
          .order('startDate', { ascending: false });
        
        if (error) throw error;
        if (data) return data as Job[];
      } catch (e) {
        console.debug("Supabase unavailable, falling back to local storage");
      }

      // Local Fallback
      const keys = getKeys();
      const rawJobs = getStorage<Job[]>(keys.JOBS, []).sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );

      // Apply restricted view masking if via Local fallback
      if (user?.accountType === 'AGENT' && user.activeViewId) {
        return rawJobs.map(j => ({
          ...j,
          grossEarnings: undefined,
          hourlyRate: undefined,
          unionDeductions: undefined
        }));
      }

      return rawJobs;
    },

    async listForClient(clientId: string): Promise<Job[]> {
      const user = api.auth.getUser();

      try {
        const { data, error } = await supabase
          .from(user?.accountType === 'AGENT' ? 'agency_jobs_view' : 'jobs')
          .select('*')
          .eq('user_id', clientId);
        
        if (error) throw error;
        if (data) return data as Job[];
      } catch (e) {
        console.debug("Remote client fetch failed, using local");
      }

      const keys = getKeys(clientId);
      const rawJobs = getStorage<Job[]>(keys.JOBS, []);
      
      if (user?.accountType === 'AGENT') {
        return rawJobs.map(j => ({ ...j, grossEarnings: undefined, hourlyRate: undefined }));
      }
      return rawJobs;
    },

    async add(job: Job): Promise<Job> {
      // Local Sync
      const keys = getKeys();
      const jobs = getStorage<Job[]>(keys.JOBS, []);
      setStorage(keys.JOBS, [job, ...jobs]);

      // Remote Sync
      try {
        const { error } = await supabase.from('jobs').insert(job);
        if (error) throw error;
      } catch (e) {
        console.debug("Remote job insert pending");
      }
      return job;
    },

    async update(job: Job): Promise<Job> {
      const keys = getKeys();
      const jobs = getStorage<Job[]>(keys.JOBS, []);
      const updated = jobs.map(j => j.id === job.id ? job : j);
      setStorage(keys.JOBS, updated);

      try {
        const { error } = await supabase.from('jobs').update(job).eq('id', job.id);
        if (error) throw error;
      } catch (e) {
        console.debug("Remote job update pending");
      }
      return job;
    },

    async delete(id: string) {
      const keys = getKeys();
      const jobs = getStorage<Job[]>(keys.JOBS, []);
      setStorage(keys.JOBS, jobs.filter(j => j.id !== id));

      try {
        await supabase.from('jobs').delete().eq('id', id);
      } catch (e) {
        console.debug("Remote job deletion pending");
      }
    }
  },

  tracking: {
    get: (targetId?: string): UserUnionTracking[] => {
      // Future: Replace with async Supabase call
      const keys = getKeys(targetId);
      return getStorage<UserUnionTracking[]>(keys.TRACKING, []);
    },
    save: (trackings: UserUnionTracking[]) => {
      const keys = getKeys();
      setStorage(keys.TRACKING, trackings);
      
      try {
        supabase.from('union_tracking').upsert(trackings);
      } catch (e) {
        console.debug("Remote tracking sync pending");
      }
    },
    calculateProgress: (trackId: string, jobs: Job[]) => {
      const trackings = getStorage<UserUnionTracking[]>(getKeys().TRACKING, []);
      const track = trackings.find(t => t.id === trackId);
      if (!track || !Array.isArray(jobs)) return { percent: 0, current: 0, target: 0 };
      
      let current = track.startingValue;
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
      try {
        const { data } = await supabase.from('vault').select('*').eq('user_id', getContextId());
        if (data) return data as ResidencyDocument[];
      } catch (e) {
        console.debug("Remote vault list failed, using local");
      }
      return getStorage<ResidencyDocument[]>(getKeys().VAULT, []);
    },

    async add(doc: ResidencyDocument) {
      const keys = getKeys();
      const docs = getStorage<ResidencyDocument[]>(keys.VAULT, []);
      setStorage(keys.VAULT, [doc, ...docs]);

      try {
        await supabase.from('vault').insert(doc);
      } catch (e) {
        console.debug("Remote vault insert pending");
      }
      return doc;
    },

    async delete(id: string) {
      const keys = getKeys();
      const docs = getStorage<ResidencyDocument[]>(keys.VAULT, []);
      setStorage(keys.VAULT, docs.filter(d => d.id !== id));

      try {
        await supabase.from('vault').delete().eq('id', id);
      } catch (e) {
        console.debug("Remote vault deletion pending");
      }
    }
  },

  system: {
    async resetData() {
      const keys = getKeys();
      Object.values(keys).forEach(k => localStorage.removeItem(k));
      localStorage.removeItem(USER_KEY);
      // Caution: Remote reset requires explicit confirmation or admin bypass
    }
  }
};