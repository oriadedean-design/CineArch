import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
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
   * Create an active assignment while ensuring the client has a user profile for downstream reads.
   */
  async attachClient(
    agent: User,
    client: Pick<User, "email" | "name" | "role" | "province" | "memberStatus"> & { id?: string }
  ): Promise<AgencyAssignment | null> {
    if (!db) return null;

    const memberId = client.id || doc(collection(db, "users")).id;
    const memberPayload: User = {
      id: memberId,
      email: client.email,
      name: client.name,
      role: client.role,
      province: client.province,
      isOnboarded: true,
      isPremium: false,
      memberStatus: client.memberStatus,
      accountType: "INDIVIDUAL",
      onboardingOptOut: true,
    } as User;

    await setDoc(doc(db, "users", memberId), memberPayload, { merge: true });

    const payload: Omit<AgencyAssignment, "id"> = {
      agentId: agent.id,
      memberId,
      memberEmail: client.email,
      status: "ACTIVE",
      createdAt: Timestamp.now().toDate().toISOString(),
      permissions: { canEditJobs: true, canViewFinancials: true },
    };

    const ref = await addDoc(collection(db, COLLECTION), payload);
    return { ...payload, id: ref.id };
  },

  /**
   * Remove an assignment entirely (hard delete).
   */
  async remove(assignmentId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, COLLECTION, assignmentId));
  },
};
