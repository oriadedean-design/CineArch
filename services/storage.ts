
import { User, Job, UserUnionTracking, UNIONS, ResidencyDocument } from '../types';

// Keys
const USER_KEY = 'cinearch_user';
const DATA_PREFIX = 'cinearch_data_';

// Helpers
const getStorage = <T>(key: string, defaultVal: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultVal;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultVal;
  }
};

const setStorage = (key: string, val: any) => {
  localStorage.setItem(key, JSON.stringify(val));
};

const getActiveContextId = (): string => {
  const user = getStorage<User | null>(USER_KEY, null);
  if (!user) return 'anon';
  // Context is either the agent themselves, or the client they have selected to 'view'
  return user.activeViewId || user.id;
};

const getKeys = () => {
  const contextId = getActiveContextId();
  return {
    JOBS: `${DATA_PREFIX}jobs_${contextId}`,
    TRACKING: `${DATA_PREFIX}tracking_${contextId}`,
    VAULT: `${DATA_PREFIX}vault_${contextId}`
  };
};

export const api = {
  auth: {
    getUser: (): User | null => getStorage<User | null>(USER_KEY, null),
    login: (email: string, asAgent: boolean = false): User => {
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
          memberStatus: 'ASPIRING',
          country: 'Canada',
          language: 'English',
          accountType: asAgent ? 'AGENT' : 'INDIVIDUAL',
          managedUsers: asAgent ? [] : undefined,
          activeViewId: undefined
        };
        setStorage(USER_KEY, user);
      }
      return user;
    },
    updateUser: (updates: Partial<User>) => {
      const user = getStorage<User | null>(USER_KEY, null);
      if (user) {
        const updated = { ...user, ...updates };
        setStorage(USER_KEY, updated);
        return updated;
      }
      return null;
    },
    logout: () => {
      // Session cleanup if needed
    },
    addClient: (client: User) => {
      const agent = getStorage<User | null>(USER_KEY, null);
      if (agent && agent.accountType === 'AGENT') {
        const managed = agent.managedUsers || [];
        const updatedAgent = { ...agent, managedUsers: [...managed, client] };
        setStorage(USER_KEY, updatedAgent);
      }
    },
    switchClient: (clientId: string | undefined) => {
      const agent = getStorage<User | null>(USER_KEY, null);
      if (agent && agent.accountType === 'AGENT') {
        const updatedAgent = { ...agent, activeViewId: clientId };
        setStorage(USER_KEY, updatedAgent);
        // Refresh to apply new context
        window.location.reload();
      }
    }
  },

  system: {
    resetData: () => {
      const keys = getKeys();
      localStorage.removeItem(keys.JOBS);
      localStorage.removeItem(keys.TRACKING);
      localStorage.removeItem(keys.VAULT);
    }
  },

  jobs: {
    list: (): Job[] => {
      const keys = getKeys();
      return getStorage<Job[]>(keys.JOBS, []).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    },
    add: (job: Job) => {
      const keys = getKeys();
      const jobs = getStorage<Job[]>(keys.JOBS, []);
      const newJobs = [job, ...jobs];
      setStorage(keys.JOBS, newJobs);
      return job;
    },
    update: (updatedJob: Job) => {
      const keys = getKeys();
      const jobs = getStorage<Job[]>(keys.JOBS, []);
      const newJobs = jobs.map(j => j.id === updatedJob.id ? updatedJob : j);
      setStorage(keys.JOBS, newJobs);
    },
    delete: (id: string) => {
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
    calculateProgress: (trackingId: string, jobs: Job[]) => {
      const tracks = getStorage<UserUnionTracking[]>(getKeys().TRACKING, []);
      const track = tracks.find(t => t.id === trackingId);
      if (!track) return { current: 0, potential: 0, target: 0, percent: 0, potentialPercent: 0 };

      let baseJobs = jobs.filter(j => j.isUnion && j.unionName === track.unionName);
      if (track.department) baseJobs = baseJobs.filter(j => j.department === track.department);
      
      const countValue = (jList: Job[]) => {
        if (track.targetType === 'HOURS') return jList.reduce((sum, j) => sum + (j.totalHours || 0), 0);
        if (track.targetType === 'DAYS') return jList.length; 
        if (track.targetType === 'CREDITS') return jList.length;
        if (track.targetType === 'EARNINGS') return jList.reduce((sum, j) => sum + (j.grossEarnings || 0), 0);
        return 0;
      };

      const confirmedVal = countValue(baseJobs.filter(j => j.status === 'CONFIRMED'));
      const totalConfirmed = track.startingValue + confirmedVal;
      const percent = Math.min((totalConfirmed / track.targetValue) * 100, 100);
      
      return { 
        current: totalConfirmed, 
        potential: totalConfirmed, 
        target: track.targetValue, 
        percent,
        potentialPercent: percent
      };
    }
  },

  vault: {
    list: (): ResidencyDocument[] => getStorage<ResidencyDocument[]>(getKeys().VAULT, []),
    add: (doc: ResidencyDocument) => {
      const keys = getKeys();
      const docs = getStorage<ResidencyDocument[]>(keys.VAULT, []);
      setStorage(keys.VAULT, [doc, ...docs]);
      return doc;
    },
    delete: (id: string) => {
      const keys = getKeys();
      const docs = getStorage<ResidencyDocument[]>(keys.VAULT, []);
      setStorage(keys.VAULT, docs.filter(d => d.id !== id));
    }
  }
};
