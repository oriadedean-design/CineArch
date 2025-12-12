import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { TaxRule } from "../types";

const COLLECTION = "tax_rules";

export const taxRuleService = {
  async list(): Promise<TaxRule[]> {
    if (!db) return [];
    const snap = await getDocs(collection(db, COLLECTION));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TaxRule, "id">) }));
  },

  async getByProvinceYear(provinceCode: string, year: number): Promise<TaxRule | null> {
    if (!db) return null;
    const id = `${provinceCode}_${year}`;
    const ref = doc(db, COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<TaxRule, "id">) };
  },
};
