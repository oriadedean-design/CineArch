import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { DocumentMetadata, DocumentType } from "../types";

export const documentService = {
  async list(userId: string): Promise<DocumentMetadata[]> {
    if (!db) return [];
    const snap = await getDocs(
      query(collection(db, "users", userId, "documents"), orderBy("uploadedAt", "desc"))
    );
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DocumentMetadata, "id">) }));
  },

  /**
   * Uploads a blob/file to Storage, then records its metadata in Firestore.
   */
  async upload(
    userId: string,
    file: Blob,
    fileName: string,
    docType: DocumentType,
    contentType?: string
  ): Promise<DocumentMetadata | null> {
    if (!db || !storage) return null;
    const storagePath = `users/${userId}/documents/${Date.now()}_${fileName}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file, { contentType });
    const url = await getDownloadURL(storageRef);

    const payload: Omit<DocumentMetadata, "id"> = {
      userId,
      fileName,
      fileType: contentType || "application/octet-stream",
      docType,
      storagePath,
      url,
      uploadedAt: new Date().toISOString(),
      verified: false,
    };

    const refDoc = await addDoc(collection(db, "users", userId, "documents"), payload);
    return { ...payload, id: refDoc.id };
  },

  async update(userId: string, docId: string, updates: Partial<DocumentMetadata>): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, "users", userId, "documents", docId), updates);
  },

  async remove(userId: string, docId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, "users", userId, "documents", docId));
  },
};
