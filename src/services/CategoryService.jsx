import { collection, getDocs, getDoc, doc, query, where, documentId, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../FirebaseFireStore/Firebase";

// ---------------- Fetch multiple categories by IDs ----------------
export const fetchCategoriesByIds = async (categoryIds) => {
  if (!categoryIds?.length) return {};

  const result = {};
  const chunks = [];

  for (let i = 0; i < categoryIds.length; i += 10) {
    chunks.push(categoryIds.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    const q = query(collection(db, "roomCategory"), where(documentId(), "in", chunk));
    const snap = await getDocs(q);
    snap.docs.forEach(d => {
      result[d.id] = { categoryName: d.data().categoryName || "Unknown" };
    });
  }

  return result;
};

// ---------------- Fetch single category ----------------
export const fetchCategoryById = async (categoryId) => {
  const snap = await getDoc(doc(db, "roomCategory", categoryId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// ---------------- Fetch all categories ----------------
export const fetchAllCategories = async () => {
  const snap = await getDocs(collection(db, "roomCategory"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ---------------- Add new category ----------------
export const addCategory = async (payload) => {
  const docRef = await addDoc(collection(db, "roomCategory"), payload);
  return { id: docRef.id, ...payload };
};

// ---------------- Update existing category ----------------
export const updateCategory = async (id, payload) => {
  const docRef = doc(db, "roomCategory", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error("Category not found");

  await updateDoc(docRef, payload);
  return { id, ...payload };
};

// ---------------- Delete category ----------------
export const deleteCategory = async (id) => {
  await deleteDoc(doc(db, "roomCategory", id));
  return id;
};
