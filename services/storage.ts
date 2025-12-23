
import { User, Job, UserUnionTracking, UNIONS, ResidencyDocument } from '../types';
import { financeApi } from './finance';

// Keys
const USER_KEY = 'cinearch_user';
const DATA_PREFIX = 'cinearch_data_';
const PENDING_JOB_KEY = 'cinearch_pending_job';
const RESUME_PATH_KEY = 'cinearch_resume_path';
const BULK_UPLOAD_COUNT_KEY = 'cinearch_bulk_count_';

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
  // If agent is possessing a client, use client's ID for data context
  return user.activeViewId || user.id;
};

const getKeys = (contextId?: string) => {
  const cid = contextId || getActiveContextId();
  return {
    JOBS: `${DATA_PREFIX}jobs_${cid}`,
    TRACKING: `${DATA_PREFIX}tracking_${cid}`,
    VAULT: `${DATA_PREFIX}vault_${cid}`
  };
};

// Internal Ledger Sync
const syncJobToLedger = (job: Job) => {
  const user = api.auth.getUser();
  if (!user) return;

  const txs = financeApi.list();
  const linked = txs.filter(t => t.jobId === job.id);
  linked.forEach(t => financeApi.delete(t.id));

  if (job.grossEarnings && job.grossEarnings > 0) {
    financeApi.add({
      userId: getActiveContextId(),
      jobId: job.id,
      type: 'INCOME',
      category: 'SERVICE_FEES',
      description: `Production Earnings: ${job.productionName}`,
      amountBeforeTax: job.grossEarnings,
      taxAmount: 0,
      totalAmount: job.grossEarnings,
      dateIncurred: job.startDate,
      businessUsePercent: 100
    });
  }
};

export const api = {
  auth: {
    getUser: (): User | null => getStorage<User | null>(USER_KEY, null),
    login: (email: string, asAgent: boolean = false): User => {
      let user = getStorage<User | null>(USER_KEY, null);
      
      if (!user || user.email !== email) {
        // Initialize sample roster for demonstration
        const managedUsers: User[] = asAgent ? [
          {
            id: 'client_123',
            name: 'Sarah Jenkins',
            email: 'sarah@example.com',
            role: '1st AC',
            province: 'Ontario',
            isOnboarded: true,
            accountType: 'INDIVIDUAL',
            selectedRoles: ['1st AC'],
            allowAgentFinance: true,
            cohort: 'Commercial'
          },
          {
            id: 'client_456',
            name: 'Marcus Thorne',
            email: 'marcus@example.com',
            role: 'Grip',
            province: 'BC',
            isOnboarded: true,
            accountType: 'INDIVIDUAL',
            selectedRoles: ['Key Grip'],
            allowAgentFinance: false,
            cohort: 'Narrative'
          }
        ] : [];

        user = {
          id: asAgent ? `agent_${Date.now()}` : `user_${Date.now()}`,
          name: asAgent ? 'Talent Manager' : 'Film Worker',
          email,
          role: asAgent ? 'Showrunner' : '',
          province: '',
          isOnboarded: false,
          isPremium: asAgent,
          memberStatus: 'ASPIRING',
          country: 'Canada',
          language: 'English',
          accountType: asAgent ? 'AGENT' : 'INDIVIDUAL',
          managedUsers,
          activeViewId: undefined,
          hasAgentFee: false,
          agentFeePercentage: 10,
          premiumSeatsTotal: asAgent ? 35 : 0,
          premiumSeatsUsed: asAgent ? 2 : 0,
          allowAgentFinance: true
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
    switchClient: (id: string | undefined) => {
      const user = getStorage<User | null>(USER_KEY, null);
      if (user && user.accountType === 'AGENT') {
        const updated = { ...user, activeViewId: id };
        setStorage(USER_KEY, updated);
        // Persistence of possession state requires a reload to reset all data hooks
        window.location.reload();
        return updated;
      }
      return user;
    },
    logout: () => {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(RESUME_PATH_KEY);
      // Explicitly redirect to the root Welcome page
      window.location.href = '/#/'; 
    },
    getResumePath: () => localStorage.getItem(RESUME_PATH_KEY),
    setResumePath: (path: string) => localStorage.setItem(RESUME_PATH_KEY, path)
  },

  jobs: {
    setPending: (job: Partial<Job>) => setStorage(PENDING_JOB_KEY, job),
    list: (contextId?: string): Job[] => {
      const keys = getKeys(contextId);
      return getStorage<Job[]>(keys.JOBS, []).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    },
    add: (job: Job) => {
      const keys = getKeys();
      const jobs = getStorage<Job[]>(keys.JOBS, []);
      setStorage(keys.JOBS, [job, ...jobs]);
      syncJobToLedger(job);
      return job;
    },
    update: (updatedJob: Job) => {
      const keys = getKeys();
      const jobs = getStorage<Job[]>(keys.JOBS, []);
      setStorage(keys.JOBS, jobs.map(j => j.id === updatedJob.id ? updatedJob : j));
      syncJobToLedger(updatedJob);
    },
    getBulkUploadCount: (contextId?: string): number => {
      const cid = contextId || getActiveContextId();
      return getStorage<number>(`${BULK_UPLOAD_COUNT_KEY}${cid}`, 0);
    },
    incrementBulkUploadCount: (contextId?: string) => {
      const cid = contextId || getActiveContextId();
      const count = getStorage<number>(`${BULK_UPLOAD_COUNT_KEY}${cid}`, 0);
      setStorage(`${BULK_UPLOAD_COUNT_KEY}${cid}`, count + 1);
    }
  },

  tracking: {
    get: (contextId?: string): UserUnionTracking[] => {
      const keys = getKeys(contextId);
      return getStorage<UserUnionTracking[]>(keys.TRACKING, []);
    },
    save: (trackings: UserUnionTracking[]) => {
      const keys = getKeys();
      setStorage(keys.TRACKING, trackings);
    },
    calculateProgress: (trackingId: string, jobs: Job[], contextId?: string) => {
      const tracks = getStorage<UserUnionTracking[]>(getKeys(contextId).TRACKING, []);
      const track = tracks.find(t => t.id === trackingId);
      if (!track) return { current: 0, target: 100, percent: 0 };
      const filtered = jobs.filter(j => j.isUnion && (j.unionName === track.unionName || j.unionTypeId === track.unionTypeId));
      let current = track.startingValue || 0;
      if (track.targetType === 'HOURS') current += filtered.reduce((s, j) => s + (j.totalHours || 0), 0);
      else if (track.targetType === 'DAYS') current += filtered.length;
      return { current, target: track.targetValue, percent: Math.min(100, (current / track.targetValue) * 100) };
    }
  },

  vault: {
    list: (contextId?: string): ResidencyDocument[] => getStorage<ResidencyDocument[]>(getKeys(contextId).VAULT, []),
    add: (doc: ResidencyDocument) => {
      const keys = getKeys();
      const docs = getStorage<ResidencyDocument[]>(keys.VAULT, []);
      setStorage(keys.VAULT, [doc, ...docs]);
      return doc;
    }
  }
};
