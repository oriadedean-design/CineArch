import { addDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { CalculationRecord } from "../types";

export const calculationService = {
  async list(userId: string): Promise<CalculationRecord[]> {
    if (!db) return [];
    const snap = await getDocs(
      query(collection(db, "users", userId, "calculations"), orderBy("generatedAt", "desc"))
    );
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CalculationRecord, "id">) }));
  },

  async save(userId: string, record: Omit<CalculationRecord, "id">): Promise<string | null> {
    if (!db) return null;
    const ref = await addDoc(collection(db, "users", userId, "calculations"), record);
    return ref.id;
  },
};
