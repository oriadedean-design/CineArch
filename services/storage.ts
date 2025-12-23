
import { User, Job, UserUnionTracking, UNIONS, ResidencyDocument } from '../types';
import { financeApi } from './finance';

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

// Internal Ledger Sync
const syncJobToLedger = (job: Job) => {
  const user = api.auth.getUser();
  if (!user) return;

  // 1. Clear existing linked transactions for this job
  const txs = financeApi.list();
  const linked = txs.filter(t => t.jobId === job.id);
  linked.forEach(t => financeApi.delete(t.id));

  // 2. Add Income Transaction
  if (job.grossEarnings && job.grossEarnings > 0) {
    financeApi.add({
      userId: user.id,
      jobId: job.id,
      type: 'INCOME',
      category: 'SERVICE_FEES',
      description: `Production Earnings: ${job.productionName}`,
      amountBeforeTax: job.grossEarnings,
      taxAmount: 0, // Simplified: Users log taxes separately in Finance if needed
      totalAmount: job.grossEarnings,
      dateIncurred: job.startDate,
      businessUsePercent: 100
    });

    // 3. Add Agent Commission if applicable
    if (user.hasAgentFee && user.agentFeePercentage && user.agentFeePercentage > 0) {
      const commissionAmount = job.grossEarnings * (user.agentFeePercentage / 100);
      financeApi.add({
        userId: user.id,
        jobId: job.id,
        type: 'EXPENSE',
        category: 'AGENT_COMMISSIONS',
        description: `Agent Commission: ${job.productionName}`,
        amountBeforeTax: commissionAmount,
        taxAmount: 0,
        totalAmount: commissionAmount,
        dateIncurred: job.startDate,
        businessUsePercent: 100
      });
    }
  }
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
          activeViewId: undefined,
          hasAgentFee: false,
          agentFeePercentage: 10
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
      localStorage.removeItem(USER_KEY);
      window.location.reload();
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
      syncJobToLedger(job);
      return job;
    },
    update: (updatedJob: Job) => {
      const keys = getKeys();
      const jobs = getStorage<Job[]>(keys.JOBS, []);
      const newJobs = jobs.map(j => j.id === updatedJob.id ? updatedJob : j);
      setStorage(keys.JOBS, newJobs);
      syncJobToLedger(updatedJob);
    },
    delete: (id: string) => {
      const keys = getKeys();
      const jobs = getStorage<Job[]>(keys.JOBS, []);
      setStorage(keys.JOBS, jobs.filter(j => j.id !== id));
      
      // Clean up ledger
      const txs = financeApi.list().filter(t => t.jobId === id);
      txs.forEach(t => financeApi.delete(t.id));
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
