
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { User } from "../types";

// Fallback Mock for UI development without keys
const mockUser: User = {
  id: 'mock_user_1',
  email: 'demo@cinearch.com',
  name: 'Demo User',
  role: 'Actor',
  province: 'Ontario',
  isOnboarded: false,
  isPremium: false,
  memberStatus: 'ASPIRING',
  accountType: 'INDIVIDUAL',
  onboardingOptOut: false
};

export const authService = {
  // Sign Up
  register: async (email: string, pass: string, isAgent: boolean): Promise<User> => {
    if (!auth) return mockUser;
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = userCredential.user.uid;

    const newUser: User = {
      id: uid,
      email,
      name: '', // Collected in onboarding
      role: isAgent ? 'Agent' : 'Film Worker',
      accountType: isAgent ? 'AGENT' : 'INDIVIDUAL',
      province: 'Ontario', // Default
      isOnboarded: false,
      isPremium: isAgent,
      memberStatus: 'ASPIRING',
      country: 'Canada',
      language: 'English',
      onboardingOptOut: false
    };

    // Create Firestore Document
    await setDoc(doc(db, "users", uid), newUser);
    return newUser;
  },

  // Login
  login: async (email: string, pass: string): Promise<User> => {
    if (!auth) return mockUser;
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const uid = userCredential.user.uid;
    
    // Fetch extra profile data from Firestore
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    } else {
      throw new Error("User profile not found");
    }
  },

  logout: async () => {
    if(auth) await signOut(auth);
  },

  // Helper to get current user profile
  getCurrentUserProfile: async (): Promise<User | null> => {
    if (!auth) return null;
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    return userDoc.exists() ? (userDoc.data() as User) : null;
  },
  
  updateUser: async (uid: string, data: Partial<User>) => {
    if (db) await updateDoc(doc(db, "users", uid), data);
    if (!auth) Object.assign(mockUser, data);
  },

  // Switch View (Client Management)
  switchClientView: async (agentId: string, clientId: string | undefined) => {
      // In Firestore, we just update the local user state to reflect activeViewId
      // and persist it to the agent's doc so it survives refresh
      await updateDoc(doc(db, "users", agentId), { activeViewId: clientId || null });
  }
};
