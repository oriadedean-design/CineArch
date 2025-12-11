
// NOTE: This file is an adapter for the new Modular Services. 
// It is recommended to import directly from src/services/* in new components.

import { authService } from './authService';
import { jobService } from './jobService';
import { trackingService } from './trackingService';
import { User, Job, UserUnionTracking } from '../types';

export const api = {
  auth: {
    // These now throw errors if used synchronously. Components must be updated to await them.
    getUser: () => { console.warn("Sync getUser deprecated. Use AuthContext."); return null; }, 
    login: authService.login,
    logout: authService.logout,
    updateUser: (data: Partial<User>) => console.warn("Use authService.updateUser directly"),
    switchClient: (id: string | undefined) => console.warn("Use authService.switchClientView directly"),
    addClient: (c: User) => console.log("Agency service implementation pending")
  },
  jobs: {
    list: () => [], // Deprecated sync call
    add: jobService.addJob,
    update: jobService.updateJob,
    delete: jobService.deleteJob
  },
  tracking: {
    get: () => [], // Deprecated sync call
    save: trackingService.saveTrackers,
    calculateProgress: trackingService.calculateProgress
  },
  vault: {
    list: () => [],
    add: () => {},
    delete: () => {}
  }
};
