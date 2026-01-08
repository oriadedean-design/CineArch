import { User, Job, UserUnionTracking, ResidencyDocument } from '../types';

const USER_KEY = 'cinearch_user';
const DATA_PREFIX = 'cinearch_data_';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

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

const getKeys = () => {
  const id = getContextId();
  return {
    JOBS: `${DATA_PREFIX}jobs_${id}`,
    TRACKING: `${DATA_PREFIX}tracking_${id}`,
    VAULT: `${DATA_PREFIX}vault_${id}`
  };
};

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
      await delay(200);
      const user = getStorage<User | null>(USER_KEY, null);
      if (user) {
        const updated = { ...user, ...updates };
        setStorage(USER_KEY, updated);
        return updated;
      }
      return null;
    },

    async addClient(client: User) {
      await delay(300);
      const agent = getStorage<User | null>(USER_KEY, null);
      if (agent && agent.accountType === 'AGENT') {
        const managed = agent.managedUsers || [];
        setStorage(USER_KEY, { ...agent, managedUsers: [...managed, client] });
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
      await delay(100);
      const keys = getKeys();
      return getStorage<Job[]>(keys.JOBS, []).sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
    },

    async add(job: Job): Promise<Job> {
      await delay(200);
      const keys = getKeys();
      const jobs = getStorage<Job[]>(keys.JOBS, []);
      setStorage(keys.JOBS, [job, ...jobs]);
      return job;
    },

    async update(job: Job): Promise<Job> {
      await delay(200);
      const keys = getKeys();
      const jobs = getStorage<Job[]>(keys.JOBS, []);
      const updated = jobs.map(j => j.id === job.id ? job : j);
      setStorage(keys.JOBS, updated);
      return job;
    },

    async delete(id: string) {
      await delay(200);
      const keys = getKeys();
      const jobs = getStorage<Job[]>(keys.JOBS, []);
      setStorage(keys.JOBS, jobs.filter(j => j.id !== id));
    }
  },

  tracking: {
    get: (): UserUnionTracking[] => {
      const keys = getKeys();
      return getStorage<UserUnionTracking[]>(keys.TRACKING, []);
    },
    save: (trackings: UserUnionTracking[]) => {
      const keys = getKeys();
      setStorage(keys.TRACKING, trackings);
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
      await delay(150);
      return getStorage<ResidencyDocument[]>(getKeys().VAULT, []);
    },

    async add(doc: ResidencyDocument) {
      await delay(400);
      const keys = getKeys();
      const docs = getStorage<ResidencyDocument[]>(keys.VAULT, []);
      setStorage(keys.VAULT, [doc, ...docs]);
      return doc;
    },

    async delete(id: string) {
      await delay(200);
      const keys = getKeys();
      const docs = getStorage<ResidencyDocument[]>(keys.VAULT, []);
      setStorage(keys.VAULT, docs.filter(d => d.id !== id));
    }
  },

  system: {
    async resetData() {
      const keys = getKeys();
      Object.values(keys).forEach(k => localStorage.removeItem(k));
      localStorage.removeItem(USER_KEY);
    }
  }
};