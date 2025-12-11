
import { User, Job, UserUnionTracking, UNIONS, ResidencyDocument } from '../types';

// Keys
const USER_KEY = 'cinearch_user';
const DATA_PREFIX = 'cinearch_data_'; // Prefix for user-specific data

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

// Helper to get current active context ID (either the user themselves or the client they are managing)
const getActiveContextId = (): string => {
  const user = getStorage<User | null>(USER_KEY, null);
  if (!user) return 'anon';
  // If agent has selected a view, use that ID. Otherwise use their own ID.
  return user.activeViewId || user.id;
};

// Keys Generator
const getKeys = () => {
  const contextId = getActiveContextId();
  return {
    JOBS: `${DATA_PREFIX}jobs_${contextId}`,
    TRACKING: `${DATA_PREFIX}tracking_${contextId}`,
    VAULT: `${DATA_PREFIX}vault_${contextId}`
  };
};

// API
export const api = {
  auth: {
    getUser: (): User | null => getStorage<User | null>(USER_KEY, null),
    login: (email: string, asAgent: boolean = false): User => {
      let user = getStorage<User | null>(USER_KEY, null);
      // Basic mock login logic - usually would check password etc.
      if (!user || user.email !== email) {
        user = {
          id: asAgent ? 'agent_1' : 'user_1',
          name: asAgent ? 'Talent Manager' : 'Film Worker',
          email,
          role: asAgent ? 'Agent' : '',
          province: '',
          isOnboarded: false,
          isPremium: asAgent, // Agents usually premium
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
      // Keep data but clear session state in real app
    },
    
    // Agency Methods
    addClient: (client: User) => {
      const agent = getStorage<User | null>(USER_KEY, null);
      if (agent && agent.accountType === 'AGENT') {
        const managed = agent.managedUsers || [];
        const updatedAgent = { ...agent, managedUsers: [...managed, client] };
        setStorage(USER_KEY, updatedAgent);
        
        // Also initialize client data if needed
        // For MVP, we don't strictly separate the "User Object Store" from the "Session Store"
        // But the data keys rely on client.id, so just having the client in the list is enough
      }
    },
    switchClient: (clientId: string | undefined) => {
      const agent = getStorage<User | null>(USER_KEY, null);
      if (agent && agent.accountType === 'AGENT') {
        const updatedAgent = { ...agent, activeViewId: clientId };
        setStorage(USER_KEY, updatedAgent);
      }
    }
  },

  system: {
    resetData: () => {
      const keys = getKeys();
      localStorage.removeItem(keys.JOBS);
      localStorage.removeItem(keys.TRACKING);
      localStorage.removeItem(keys.VAULT);
    },
    deleteAccount: () => {
       const keys = getKeys();
       localStorage.removeItem(keys.JOBS);
       localStorage.removeItem(keys.TRACKING);
       localStorage.removeItem(keys.VAULT);
       localStorage.removeItem(USER_KEY);
       window.location.reload();
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
      const keys = getKeys();
      const tracks = getStorage<UserUnionTracking[]>(keys.TRACKING, []);
      const track = tracks.find(t => t.id === trackingId);
      if (!track) return { current: 0, potential: 0, target: 0, percent: 0, potentialPercent: 0 };

      // Base Filter: Union matches
      let baseJobs = jobs.filter(j => j.isUnion && j.unionName === track.unionName);
      
      // Department Filter
      if (track.department) {
        baseJobs = baseJobs.filter(j => j.department === track.department);
      }
      
      // Helpers to count based on type
      const countValue = (jList: Job[]) => {
        if (track.targetType === 'HOURS') {
          return jList.reduce((sum, j) => sum + j.totalHours, 0);
        } else if (track.targetType === 'DAYS') {
          return jList.length; 
        } else if (track.targetType === 'CREDITS') {
          return jList.filter(j => 
            j.creditType && ['PRINCIPAL', 'ACTOR', 'STUNT', 'CREW'].includes(j.creditType)
          ).length;
        } else if (track.targetType === 'EARNINGS') {
          return jList.reduce((sum, j) => sum + (j.grossEarnings || 0), 0);
        }
        return 0;
      };

      // Split into Confirmed vs Tentative
      const confirmedJobs = baseJobs.filter(j => j.status === 'CONFIRMED');
      const tentativeJobs = baseJobs.filter(j => j.status === 'TENTATIVE');

      const confirmedVal = countValue(confirmedJobs);
      const tentativeVal = countValue(tentativeJobs);

      const totalConfirmed = track.startingValue + confirmedVal;
      const totalPotential = totalConfirmed + tentativeVal;

      const percent = Math.min((totalConfirmed / track.targetValue) * 100, 100);
      const potentialPercent = Math.min((totalPotential / track.targetValue) * 100, 100);
      
      return { 
        current: totalConfirmed, 
        potential: totalPotential, 
        target: track.targetValue, 
        percent,
        potentialPercent
      };
    }
  },

  vault: {
    list: (): ResidencyDocument[] => {
      const keys = getKeys();
      return getStorage<ResidencyDocument[]>(keys.VAULT, []);
    },
    add: (doc: ResidencyDocument) => {
      const keys = getKeys();
      const docs = getStorage<ResidencyDocument[]>(keys.VAULT, []);
      const newDocs = [doc, ...docs];
      setStorage(keys.VAULT, newDocs);
      return doc;
    },
    delete: (id: string) => {
      const keys = getKeys();
      const docs = getStorage<ResidencyDocument[]>(keys.VAULT, []);
      setStorage(keys.VAULT, docs.filter(d => d.id !== id));
    }
  }
};
