
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  getDocs, 
  orderBy,
  Timestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Job } from "../types";

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
    const docRef = await addDoc(collection(db, "users", userId, "jobs"), {
      ...job,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  },

  updateJob: async (userId: string, jobId: string, updates: Partial<Job>) => {
    const jobRef = doc(db, "users", userId, "jobs", jobId);
    await updateDoc(jobRef, updates);
  },

  deleteJob: async (userId: string, jobId: string) => {
    await deleteDoc(doc(db, "users", userId, "jobs", jobId));
  }
};
