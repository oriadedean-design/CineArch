import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SubscriptionRecord } from '../types';

const COLLECTION = 'users';
const SUB_COLLECTION = 'subscriptions';

export const subscriptionService = {
  /**
   * Create a subscription record under the user for audit history.
   */
  async add(userId: string, payload: Omit<SubscriptionRecord, 'id'>): Promise<string | null> {
    if (!db) return null;
    const ref = await addDoc(collection(doc(db, COLLECTION, userId), SUB_COLLECTION), payload);
    return ref.id;
  },

  /**
   * Update subscription status fields (e.g., cancel, end) while keeping the audit trail intact.
   */
  async update(userId: string, subscriptionId: string, data: Partial<SubscriptionRecord>): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, COLLECTION, userId, SUB_COLLECTION, subscriptionId), data);
  },

  /**
   * Fetch all subscription records for a user ordered by creation date.
   */
  async list(userId: string, status?: SubscriptionRecord['status']): Promise<SubscriptionRecord[]> {
    if (!db) return [];
    const baseCollection = collection(doc(db, COLLECTION, userId), SUB_COLLECTION);
    const q = status
      ? query(baseCollection, where('status', '==', status), orderBy('created', 'desc'))
      : query(baseCollection, orderBy('created', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SubscriptionRecord, 'id'>) }));
  },
};
