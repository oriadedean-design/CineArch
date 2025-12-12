import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { AgencyAssignment, User } from "../types";

const COLLECTION = "agency_assignments";

export const agencyService = {
  /**
   * Fetch all active assignments for a given agent, ordered by creation date.
   */
  async getRoster(agentId: string): Promise<AgencyAssignment[]> {
    if (!db) return [];
    const q = query(
      collection(db, COLLECTION),
      where("agentId", "==", agentId),
      where("status", "==", "ACTIVE"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AgencyAssignment, "id">) }));
  },

  /**
   * Create a pending assignment invitation that can later be accepted by the member.
   */
  async invite(agentId: string, member: Pick<User, "id" | "email">): Promise<string | null> {
    if (!db) return null;
    const payload: Omit<AgencyAssignment, "id"> = {
      agentId,
      memberId: member.id,
      memberEmail: member.email,
      status: "PENDING",
      createdAt: Timestamp.now().toDate().toISOString(),
      permissions: { canEditJobs: true, canViewFinancials: true },
    };
    const ref = await addDoc(collection(db, COLLECTION), payload);
    return ref.id;
  },

  /**
   * Promote a pending assignment to active or archive an existing relationship.
   */
  async updateStatus(assignmentId: string, status: AgencyAssignment["status"]): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, COLLECTION, assignmentId), { status });
  },

  /**
   * Remove an assignment entirely (hard delete).
   */
  async remove(assignmentId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, COLLECTION, assignmentId));
  },
};
