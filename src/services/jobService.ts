
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  getDocs,
  orderBy
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Job, WorkRecord } from "../types";

const normalizeWorkRecord = (userId: string, job: Job): WorkRecord => {
  return {
    user_id: userId,
    project_name: job.productionName,
    project_type: 'feature',
    union_id: job.unionTypeId || 'non_union',
    union_local_id: job.unionName,
    role: job.role,
    department: job.department,
    date: job.startDate,
    days: 1,
    paid: !!job.grossEarnings && job.grossEarnings > 0,
    signatory_status: job.isUnion ? 'union' : 'non_union',
    location: { province: 'Ontario' },
    evidence_url: job.documentIds && job.documentIds.length > 0 ? job.documentIds[0] : undefined,
  };
};

const validateJob = (job: Partial<Job>) => {
  if (!job.productionName) throw new Error('Production Name is required');
  if (!job.startDate) throw new Error('Start date is required');
};

export const jobService = {
  // Get jobs for a specific user (either self or managed client)
  getJobs: async (userId: string): Promise<Job[]> => {
    if (!db) return [];
    try {
        const q = query(
        collection(db, "users", userId, "jobs"),
        orderBy("startDate", "desc")
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
        } as Job));
    } catch (e) {
        console.warn("Could not fetch jobs:", e);
        return [];
    }
  },

  addJob: async (userId: string, job: Omit<Job, 'id'>) => {
    validateJob(job);
    const docRef = await addDoc(collection(db, "users", userId, "jobs"), {
      ...job,
      createdAt: new Date().toISOString()
    });
    normalizeWorkRecord(userId, { ...job, id: docRef.id });
    return docRef.id;
  },

  updateJob: async (userId: string, jobId: string, updates: Partial<Job>) => {
    validateJob({ ...updates });
    const jobRef = doc(db, "users", userId, "jobs", jobId);
    await updateDoc(jobRef, updates);
  },

  deleteJob: async (userId: string, jobId: string) => {
    await deleteDoc(doc(db, "users", userId, "jobs", jobId));
  }
};
