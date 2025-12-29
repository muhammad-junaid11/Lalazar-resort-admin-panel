import { doc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../FirebaseFireStore/Firebase";
import { fetchRoomsWithCategory, fetchRoomsWithCategoryAndHotel } from "./RoomService";
import { fetchUsersByBookingIds, fetchFullUsersByIds } from "./UserService";
import { fetchPaymentsByBookingIds } from "./PaymentService";

/**
 * Fetch all bookings for UI (Bookings List page)
 * NOW PROPERLY CALCULATES PAYMENT STATUS
 */
export const fetchBookingsForUI = async () => {
  const snap = await getDocs(collection(db, "bookings"));
  const bookings = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      checkIn: data.checkInDate?.toDate?.()?.toISOString(),
      checkOut: data.checkOutDate?.toDate?.()?.toISOString(),
      rawStatus: data.status || "pending",
    };
  });

  const userIds = [...new Set(bookings.map(b => b.userId).filter(Boolean))];
  const roomIds = [...new Set(bookings.flatMap(b => b.roomId || []))];
  const bookingIds = bookings.map(b => b.id);

  const users = await fetchUsersByBookingIds(userIds);
  const rooms = await fetchRoomsWithCategory(roomIds);
  const payments = await fetchPaymentsByBookingIds(bookingIds);

  return bookings.map(b => {
    const roomList = (b.roomId || []).map(rid => rooms[rid]).filter(Boolean);
    const totalAmount = roomList.reduce((sum, r) => sum + (r.price || 0), 0);
    
    // FIX: Get the actual paid amount from payments
    const paymentData = payments[b.id];
    const paidAmount = paymentData?.paidAmount || 0;

    return {
      id: b.id,
      bookingId: b.bookingId || b.id, // Include bookingId for search
      userName: users[b.userId]?.userName || users[b.userId]?.fullName || "Guest",
      email: users[b.userId]?.email || users[b.userId]?.userEmail || "N/A",
      number: users[b.userId]?.number || "--",
      roomNumber: roomList.map(r => r.roomNo).join(", ") || "--",
      category: roomList.map(r => r.categoryName).join(", ") || "--",
      roomCount: roomList.length,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      rawStatus: b.rawStatus,
      bookingStatus: b.rawStatus
        ? b.rawStatus.charAt(0).toUpperCase() + b.rawStatus.slice(1)
        : "Pending",
      // FIX: Properly calculate payment status
      paymentStatus: paidAmount >= totalAmount ? "Paid" : "Pending",
      totalAmount, // Add for reference
      paidAmount,  // Add for reference
    };
  });
};

export const updateBookingStatus = async (bookingId, status) => {
  if (!bookingId || !status) throw new Error("Booking ID and status are required");

  await updateDoc(doc(db, "bookings", bookingId), { status: status.toLowerCase() });
};

/**
 * Fetch single booking for Booking Details page
 */
export const fetchBookingByIdForUI = async (bookingId) => {
  const bookingSnap = await getDoc(doc(db, "bookings", bookingId));
  if (!bookingSnap.exists()) return null;

  const bookingData = bookingSnap.data();
  const roomsIds = bookingData.roomId || [];
  const userId = bookingData.userId ? [bookingData.userId] : [];

  const users = await fetchFullUsersByIds(userId);
  const rooms = await fetchRoomsWithCategoryAndHotel(roomsIds);
  const payments = await fetchPaymentsByBookingIds([bookingId]);

  let totalAmount = 0;
  const roomNumbers = [];
  const roomsDetails = roomsIds
    .map((rid) => {
      const r = rooms[rid];
      if (!r) return null;
      totalAmount += Number(r.price || 0);
      roomNumbers.push(r.roomNo);
      return r;
    })
    .filter(Boolean);

  const paidAmount = payments[bookingId]?.paidAmount || 0;

  // Latest payment date
  let latestPaymentDate = null;
  if (payments[bookingId]?.paymentDates?.length) {
    latestPaymentDate = payments[bookingId].paymentDates
      .map(d => d.toDate ? d.toDate() : new Date(d))
      .sort((a, b) => b - a)[0];
  }

  // Latest receipt
  const latestReceipt = payments[bookingId]?.receiptPaths?.slice(-1)[0] || "";
  
  const rawStatus = bookingData.status || "pending";

  return {
    id: bookingSnap.id,
    rawStatus: rawStatus,
    bookingStatus: rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1),
    guestName: users[bookingData.userId]?.userName || users[bookingData.userId]?.fullName || "Guest",
    email: users[bookingData.userId]?.email || users[bookingData.userId]?.userEmail || "--",
    number: users[bookingData.userId]?.number || users[bookingData.userId]?.phone || "--",
    gender: users[bookingData.userId]?.gender || "--",
    dob: users[bookingData.userId]?.dob || null,
    address: users[bookingData.userId]?.address || "--",
    roomNumbers: roomNumbers.join(", "),
    roomsDetails,
    totalAmount,
    paymentStatus: paidAmount >= totalAmount ? "Paid" : "Pending",
    paymentDate: latestPaymentDate,
    paymentReceipt: latestReceipt,
    checkIn: bookingData.checkInDate?.toDate?.() || null,
    checkOut: bookingData.checkOutDate?.toDate?.() || null,
    persons: bookingData.persons || "--",
    paymentMethod: bookingData.paymentMethod || "--",
    adminId: bookingData.adminId || "--",
    secondaryEmail: bookingData.secondaryEmail || "--",
    paidAmount, // Add for reference
  };
};

/**
 * Minimal bookings for Payments ONLY
 */
export const fetchBookingsForPayment = async () => {
  const snap = await getDocs(collection(db, "bookings"));

  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId || null,
      checkIn: data.checkInDate?.toDate?.()?.toISOString(),
      checkOut: data.checkOutDate?.toDate?.()?.toISOString(),
      status: data.status || "pending",
    };
  });
};

export const updateBookingStatusWithRooms = async (bookingId, status, roomsDetails = []) => {
  if (!bookingId || !status) throw new Error("Booking ID and status are required");

  await updateDoc(doc(db, "bookings", bookingId), { status: status.toLowerCase() });

  if (status.toLowerCase() === "confirmed" && roomsDetails.length) {
    const roomUpdates = roomsDetails.map(async (room) => {
      await updateDoc(doc(db, "rooms", room.id), { status: "Booked" });
    });
    await Promise.all(roomUpdates);
  }

  return { bookingId, status };
};