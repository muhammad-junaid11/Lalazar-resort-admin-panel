// UserService.js
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  documentId,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "../FirebaseFireStore/Firebase";

// Used by Booking UI
export const fetchUsersByBookingIds = async (userIds) => {
  if (!userIds?.length) return {};
  const result = {};
  const chunks = [];

  for (let i = 0; i < userIds.length; i += 10) {
    chunks.push(userIds.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    const q = query(collection(db, "users"), where(documentId(), "in", chunk));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => {
      const data = d.data();
      result[d.id] = {
        id: d.id,
        userName: data.userName || data.fullName || "Guest",
        email: data.userEmail || "",
        number: data.number || "--", // ✅ Fix here
      };
    });
  }

  return result;
};

// ✅ Minimal user fetch for Payments
export const fetchUsersByIds = async (userIds) => {
  if (!userIds?.length) return {};
  const users = await fetchUsersByBookingIds(userIds);

  Object.keys(users).forEach((id) => {
    users[id] = {
      id,
      userName: users[id].userName,
    };
  });

  return users;
};

export const fetchFullUsersByIds = async (userIds) => {
  if (!userIds?.length) return {};
  const result = {};
  const chunks = [];

  for (let i = 0; i < userIds.length; i += 10) {
    chunks.push(userIds.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    const q = query(collection(db, "users"), where(documentId(), "in", chunk));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => {
      const data = d.data();
      result[d.id] = {
        id: d.id,
        userName: data.userName || data.fullName || "Guest",
        gender: data.gender || "--",
        dob: data.dob ? data.dob.toDate() : null,
        number: data.number || "--", // ✅ Fix here
        email: data.email || data.userEmail || "--",
        address: data.address || "--",
      };
    });
  }

  return result;
};

// Fetch single user by ID
export const fetchUserById = async (userId) => {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    id: snap.id,
    userName: data.userName || data.fullName || "Guest",
    gender: data.gender || "--",
    dob: data.dob ? data.dob.toDate() : null, // Convert Firestore Timestamp to JS Date
    phone: data.number || "--",
    email: data.userEmail || "--",
    address: data.address || "--",
  };
};

// Fetch all users
export const fetchAllUsers = async () => {
  const snap = await getDocs(collection(db, "users"));
  const users = {};
  snap.docs.forEach((d) => {
    const data = d.data();
    users[d.id] = {
      id: d.id,
      userName: data.userName || data.fullName || "Guest",
      gender: data.gender || "--",
      dob: data.dob ? data.dob.toDate() : null,  // Convert Firestore Timestamp to JS Date
      phone: data.number || "--", 
      email: data.userEmail || "--",
      address: data.address || "--",
    };
  });
  return users;
};

// Update user with safe DOB handling
export const updateUser = async (userId, payload) => {
  const userRef = doc(db, "users", userId);

  // Only include dob if valid
  const updatePayload = { ...payload };
  if (payload.dob) {
    const dobDate = new Date(payload.dob);
    if (!isNaN(dobDate)) {
      updatePayload.dob = dobDate;
    } else {
      delete updatePayload.dob;
    }
  } else {
    delete updatePayload.dob;
  }

  await updateDoc(userRef, updatePayload);
};

// Delete user
export const deleteUser = async (userId) => {
  await deleteDoc(doc(db, "users", userId));
};
