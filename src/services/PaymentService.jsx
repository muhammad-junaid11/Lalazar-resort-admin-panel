import { collection, getDocs, query, where, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../FirebaseFireStore/Firebase";
import { fetchBookingsForPayment } from "./BookingService";
import { fetchUsersByIds } from "./UserService";


export const fetchPaymentsByBookingIds = async (bookingIds) => {
  if (!bookingIds?.length) return {};

  const payments = {};
  const chunks = [];

  for (let i = 0; i < bookingIds.length; i += 10) {
    chunks.push(bookingIds.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    const q = query(collection(db, "payment"), where("bookingId", "in", chunk));
    const snap = await getDocs(q);

    snap.docs.forEach(d => {
      const data = d.data();
      if (!payments[data.bookingId])
        payments[data.bookingId] = { paidAmount: 0, totalAmount: 0, paymentDates: [], receiptPaths: [] };

      payments[data.bookingId].paidAmount += Number(data.paidAmount || 0);
      payments[data.bookingId].totalAmount = Number(data.totalAmount || 0);

      if (data.paymentDate) payments[data.bookingId].paymentDates.push(data.paymentDate);
      if (data.receiptPath) payments[data.bookingId].receiptPaths.push(data.receiptPath);
    });
  }

  return payments;
};



export const fetchPaymentsByBookingId = async (bookingId) => {
  if (!bookingId) return [];

  const paymentsQuery = query(
    collection(db, "payment"),
    where("bookingId", "==", bookingId)
  );

  const paymentDocs = await getDocs(paymentsQuery);
  return paymentDocs.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
};


export const addPayment = async (paymentData) => {
  if (!paymentData.bookingId || !paymentData.paidAmount) {
    throw new Error("bookingId and paidAmount are required");
  }

  await addDoc(collection(db, "payment"), {
    bookingId: paymentData.bookingId,
    label: paymentData.label || "Payment",
    paidAmount: Number(paymentData.paidAmount),
    totalAmount: Number(paymentData.totalAmount || 0),
    paymentDate: paymentData.paymentDate || new Date(),
    paymentType: paymentData.paymentType || "Cash",
    status: paymentData.status || "Pending",
    receiptPath: paymentData.receiptPath || null,
  });
};


export const rejectPayment = async (paymentId) => {
  if (!paymentId) throw new Error("paymentId is required");

  await updateDoc(doc(db, "payment", paymentId), { status: "Rejected" });
};


export const fetchPaymentsForUI = async () => {
  const bookings = await fetchBookingsForPayment();
  const bookingIds = bookings.map(b => b.id);
  const userIds = [...new Set(bookings.map(b => b.userId).filter(Boolean))];

  const users = await fetchUsersByIds(userIds);
  const paymentsData = await fetchPaymentsByBookingIds(bookingIds);

  return bookings.map(b => {
    const payment = paymentsData[b.id] || { paidAmount: 0, totalAmount: 0 };
    return {
      bookingId: b.id,
      guestName: users[b.userId]?.userName || "Guest",
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      paidAmount: payment.paidAmount,
      totalAmount: payment.totalAmount,
      paymentStatus: payment.paidAmount > 0 ? "Paid" : "Pending",
      bookingStatus: b.status,
    };
  });
};
