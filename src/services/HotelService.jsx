// src/services/HotelService.js
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "../FirebaseFireStore/Firebase";

/**
 * Fetch all hotels as a map { id: hotelName }
 */
export const fetchAllHotels = async () => {
  const snapshot = await getDocs(collection(db, "hotel"));
  const hotels = {};
  snapshot.docs.forEach((docSnap) => {
    hotels[docSnap.id] = docSnap.data().hotelName;
  });
  return hotels;
};

/**
 * Fetch single hotel by ID
 */
export const fetchHotelById = async (hotelId) => {
  const snap = await getDoc(doc(db, "hotel", hotelId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
