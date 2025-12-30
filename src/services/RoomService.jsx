import {
  collection,
  getDocs,
  doc,
  query,
  where,
  documentId,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../FirebaseFireStore/Firebase";
import { fetchCategoriesByIds } from "./CategoryService";
import { fetchHotelById } from "./HotelService";


export const fetchRoomsByIds = async (roomIds = []) => {
  if (!roomIds.length) return {};

  const result = {};
  const chunks = [];

  for (let i = 0; i < roomIds.length; i += 10) {
    chunks.push(roomIds.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    const q = query(
      collection(db, "rooms"),
      where(documentId(), "in", chunk)
    );

    const snap = await getDocs(q);

    snap.docs.forEach((d) => {
      const data = d.data();
      result[d.id] = {
        id: d.id,
        roomNo: data.roomNo || "N/A",
        categoryId: data.categoryId || null,
        hotelId: data.hotelId || null,
        price: Number(data.price || 0),
        status: data.status || "Available",
        propertyType: data.propertyType || "Owned",
      };
    });
  }

  return result;
};


export const fetchRoomsWithCategory = async (roomIds = []) => {
  const rooms = await fetchRoomsByIds(roomIds);
  if (!Object.keys(rooms).length) return {};

  const categoryIds = [
    ...new Set(
      Object.values(rooms)
        .map((r) => r.categoryId)
        .filter(Boolean)
    ),
  ];

  const categories = await fetchCategoriesByIds(categoryIds);

  Object.keys(rooms).forEach((id) => {
    rooms[id].categoryName =
      categories[rooms[id].categoryId]?.categoryName || "Unknown";
  });

  return rooms;
};


export const fetchRoomsWithCategoryAndHotel = async (roomIds = []) => {
  const rooms = await fetchRoomsByIds(roomIds);
  if (!Object.keys(rooms).length) return {};

  const categoryIds = [
    ...new Set(
      Object.values(rooms)
        .map((r) => r.categoryId)
        .filter(Boolean)
    ),
  ];
  const categories = await fetchCategoriesByIds(categoryIds);

  const hotelIds = [
    ...new Set(
      Object.values(rooms)
        .map((r) => r.hotelId)
        .filter(Boolean)
    ),
  ];

  const hotels = {};
  await Promise.all(
    hotelIds.map(async (hid) => {
      const hotel = await fetchHotelById(hid);
      hotels[hid] = hotel?.hotelName || "Unknown";
    })
  );

  Object.keys(rooms).forEach((id) => {
    rooms[id] = {
      ...rooms[id],
      categoryName:
        categories[rooms[id].categoryId]?.categoryName || "Unknown",
      hotelName: hotels[rooms[id].hotelId] || "Unknown",
    };
  });

  return rooms;
};


export const fetchRoomById = async (roomId) => {
  if (!roomId) return null;

  const rooms = await fetchRoomsWithCategoryAndHotel([roomId]);
  return rooms[roomId] || null;
};


export const fetchAllRooms = async () => {
  const snap = await getDocs(collection(db, "rooms"));
  const roomIds = snap.docs.map((d) => d.id);

  if (!roomIds.length) return [];

  const roomsMap = await fetchRoomsWithCategoryAndHotel(roomIds);
  return Object.values(roomsMap);
};


export const addRoom = async (payload) => {
  const docRef = await addDoc(collection(db, "rooms"), payload);
  return { id: docRef.id, ...payload };
};


export const updateRoom = async (roomId, payload) => {
  await updateDoc(doc(db, "rooms", roomId), payload);
  return { id: roomId, ...payload };
};


export const deleteRoomById = async (roomId) => {
  await deleteDoc(doc(db, "rooms", roomId));
  return roomId;
};


export const fetchRoomBookings = async (roomId) => {
  if (!roomId) return [];
  try {
    const q = query(collection(db, "bookings"), where("roomId", "array-contains", roomId));
    const snap = await getDocs(q);
    if (snap.size === 0) return [];

    return snap.docs.map((d) => {
      const data = d.data();
      
      const checkInDate = data.checkInDate?.toDate ? data.checkInDate.toDate() : new Date(data.checkInDate || Date.now());
      const checkOutDate = data.checkOutDate?.toDate ? data.checkOutDate.toDate() : new Date(data.checkOutDate || Date.now());

      return {
        id: d.id,
        guestName: data.guestName || "Guest",
        userName: data.userName || data.userEmail || data.guestName || "Guest", // ✅ Ensure userName is passed
        start: checkInDate,
        end: checkOutDate,
        status: data.status,
      };
    });
  } catch (error) {
    console.error("❌ Error fetching bookings:", error);
    return [];
  }
};
