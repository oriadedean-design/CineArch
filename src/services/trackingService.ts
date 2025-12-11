
import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserUnionTracking, Job } from "../types";

export const trackingService = {
  getTrackers: async (userId: string): Promise<UserUnionTracking[]> => {
    if (!db) return [];
    try {
        const snapshot = await getDocs(collection(db, "users", userId, "trackers"));
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as UserUnionTracking));
    } catch (e) {
        console.warn("Could not fetch trackers", e);
        return [];
    }
  },

  // Save multiple trackers at once (e.g. during Onboarding)
  saveTrackers: async (userId: string, trackers: UserUnionTracking[]) => {
    const batch = writeBatch(db);
    trackers.forEach(track => {
      // Create new doc ref if no ID, or reference existing
      const ref = track.id 
        ? doc(db, "users", userId, "trackers", track.id)
        : doc(collection(db, "users", userId, "trackers"));
      
      batch.set(ref, track);
    });
    await batch.commit();
  },

  // Calculation Logic (Client-side for now, can move to Cloud Functions for heavy lifting)
  calculateProgress: (track: UserUnionTracking, jobs: Job[]) => {
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
};
