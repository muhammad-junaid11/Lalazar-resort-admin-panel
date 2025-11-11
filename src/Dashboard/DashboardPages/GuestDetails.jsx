import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  CircularProgress,
  useTheme,
  Button,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, where, updateDoc } from "firebase/firestore";
import { db } from "../../FirebaseFireStore/Firebase";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const GuestDetails = () => {
  const { id } = useParams();
  const theme = useTheme();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const parseTimestamp = (value) => {
    if (!value) return null;
    if (value.seconds !== undefined && value.nanoseconds !== undefined) {
      return new Date(value.seconds * 1000);
    } else if (value instanceof Date) {
      return value;
    } else if (typeof value === "string") {
      return new Date(value);
    } else {
      return null;
    }
  };

  const formatDateTime = (value) => {
    const date = parseTimestamp(value);
    if (!date) return "--";
    return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  };

  const formatDateOnly = (value) => {
    const date = parseTimestamp(value);
    if (!date) return "--";
    return date.toISOString().split("T")[0];
  };

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const bookingRef = doc(db, "bookings", id);
      const bookingSnap = await getDoc(bookingRef);
      if (!bookingSnap.exists()) {
        setBooking(null);
        return;
      }
      const bookingData = bookingSnap.data();
      const bookingDocId = bookingSnap.id;

      // Fetch user info
      let userData = {};
      if (bookingData.userId) {
        const userSnap = await getDoc(doc(db, "users", bookingData.userId));
        if (userSnap.exists()) userData = userSnap.data();
      }

      // Fetch payment info
      const paymentRef = collection(db, "payment");
      const paymentQuery = query(paymentRef, where("bookingId", "==", bookingDocId));
      const paymentSnap = await getDocs(paymentQuery);

      let totalAmount = 0;
      let paymentDate = "--";
      let paymentMethod = "--";
      let paymentStatus = "Pending";
      let paymentId = "--";

      if (!paymentSnap.empty) {
        paymentSnap.docs.forEach((payDoc) => {
          const payData = payDoc.data();
          totalAmount += Number((payData.amount || "0").toString().replace(/[^0-9.]/g, ""));
        });

        const latestPaymentDoc = paymentSnap.docs[paymentSnap.docs.length - 1];
        const latestPaymentData = latestPaymentDoc.data();
        paymentId = latestPaymentDoc.id;
        paymentMethod = latestPaymentData.paymentType || "--";
        paymentStatus = latestPaymentData.status
          ? latestPaymentData.status.charAt(0).toUpperCase() + latestPaymentData.status.slice(1)
          : "Pending";
        paymentDate = latestPaymentData.paymentDate ? formatDateTime(latestPaymentData.paymentDate) : "--";
      }

      // Fetch rooms, categories, hotels
      let roomNumbers = [];
      let roomCategories = new Set();
      let hotelNames = new Set();

      if (Array.isArray(bookingData.roomId) && bookingData.roomId.length > 0) {
        const roomPromises = bookingData.roomId.map(async (roomId) => {
          const roomSnap = await getDoc(doc(db, "rooms", roomId));
          if (!roomSnap.exists()) return null;
          const roomData = roomSnap.data();

          // Room number
          roomNumbers.push(roomData.roomNo || "N/A");

          // Room category (deduplicated)
          if (roomData.categoryId) {
            const categorySnap = await getDoc(doc(db, "roomCategory", roomData.categoryId));
            if (categorySnap.exists()) roomCategories.add(categorySnap.data().categoryName);
          }

          // Hotel name (deduplicated)
          if (roomData.hotelId) {
            const hotelSnap = await getDoc(doc(db, "hotel", roomData.hotelId));
            if (hotelSnap.exists()) hotelNames.add(hotelSnap.data().hotelName);
          }

          return true;
        });

        await Promise.all(roomPromises);
      }

      setBooking({
        id: bookingDocId,
        bookingId: bookingDocId,
        bookingStatus:
          bookingData.status?.charAt(0).toUpperCase() + bookingData.status?.slice(1) || "New",
        userName: userData.userName || userData.fullName || "N/A",
        gender: userData.gender || "N/A",
        dob: formatDateOnly(userData.dob),
        number: userData.number || "--",
        email: userData.email || userData.userEmail || "--",
        address: userData.address || "--",
        idProof: userData.idProof || "--",
        userId: bookingData.userId || "--",
        rooms: roomNumbers.join(", "),
        roomTypes: Array.from(roomCategories).join(", "),
        hotelNames: Array.from(hotelNames).join(", "),
        paymentId,
        totalAmount,
        paymentMethod,
        paymentStatus,
        paymentDate,
        persons: bookingData.persons || "--",
        checkIn: formatDateTime(bookingData.checkInDate),
        checkOut: formatDateTime(bookingData.checkOutDate),
        adminId: bookingData.adminId || "--",
        secondaryEmail: bookingData.secondaryEmail || "--",
      });
    } catch (error) {
      console.error("Error fetching booking details:", error);
      toast.error("Failed to fetch booking details");
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      await updateDoc(doc(db, "bookings", id), { status: newStatus });

      // Show toast
      if (newStatus === "Rejected") toast.error("Booking rejected!");
      else if (newStatus === "Confirmed") toast.success("Booking accepted!");

      // Update local booking state to reflect status immediately
      setBooking((prev) => prev ? { ...prev, bookingStatus: newStatus } : prev);

    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getChipColor = (status, isPayment = false) => {
    const bookingColors = {
      New: theme.palette.primary.main,
      Pending: theme.palette.warning.main,
      Confirmed: theme.palette.success.main,
      "Checked Out": theme.palette.info.main,
      Cancelled: theme.palette.error.main,
      Rejected: theme.palette.error.main,
    };
    const paymentColors = {
      Paid: theme.palette.success.main,
      Pending: theme.palette.warning.main,
      Refunded: theme.palette.info.main,
      Failed: theme.palette.error.main,
      Waived: theme.palette.grey[600],
    };
    return isPayment ? paymentColors[status] || theme.palette.grey[500] : bookingColors[status] || theme.palette.grey[500];
  };

  const StatusChip = ({ label, isPayment = false }) => {
    const color = getChipColor(label, isPayment);
    return (
      <Chip label={label || "--"} size="small" sx={{ backgroundColor: color + "33", color, fontWeight: 600, ml: 1 }} />
    );
  };

  const KeyValueBlock = ({ label, value }) => (
    <Box sx={{ flexBasis: { xs: "100%", sm: "30%" } }}>
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>{label}</Typography>
      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: "bold" }}>{value || "--"}</Typography>
    </Box>
  );

  const Row = ({ children }) => <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 5 }}>{children}</Box>;

  const SectionHeader = ({ title }) => (
    <Box sx={{ backgroundColor: "#F0F9F8", px: 2, py: 1, borderRadius: 1, mb: 2, mt: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: theme.palette.primary.main }}>{title}</Typography>
    </Box>
  );

  if (loading) return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <CircularProgress size={40} />
      <Typography sx={{ mt: 2 }}>Loading booking details...</Typography>
    </Box>
  );

  if (!booking) return <Typography variant="h6" sx={{ textAlign: "center", mt: 5, color: "text.secondary" }}>Booking not found</Typography>;

  return (
    <Box sx={{ flexGrow: 1, mt: 0, mb: 0, py: 1 }}>
      <ToastContainer position="top-right" autoClose={3000} />
      <Card sx={{ borderRadius: 3, boxShadow: 4, mb: 4 }}>
        <CardContent sx={{ px: { xs: 2, sm: 4, md: 6 } }}>
          <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: theme.palette.primary.main }}>Booking Detail:</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>Booking Status:</Typography>
                <StatusChip label={booking.bookingStatus} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>Payment Status:</Typography>
                <StatusChip label={booking.paymentStatus} isPayment />
              </Box>
            </Stack>
          </Box>

          <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              disabled={updatingStatus}
              onClick={() => handleStatusUpdate("Confirmed")}
            >
              Accept
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={booking.bookingStatus === "Rejected" || updatingStatus}
              onClick={() => handleStatusUpdate("Rejected")}
            >
              Reject
            </Button>
          </Box>

          {/* Guest, Rooms, Payment Sections */}
          <SectionHeader title="Guest Information" />
          <Stack spacing={5}>
            <Row>
              <KeyValueBlock label="Guest Name" value={booking.userName} />
              <KeyValueBlock label="Gender" value={booking.gender} />
              <KeyValueBlock label="Date of Birth" value={booking.dob} />
            </Row>
            <Row>
              <KeyValueBlock label="Phone No" value={booking.number} />
              <KeyValueBlock label="User ID" value={booking.userId} />
              <KeyValueBlock label="Email" value={booking.email} />
            </Row>
            <Row>
              <KeyValueBlock label="Address" value={booking.address} />
              <Box sx={{ flex: 1 }} />
            </Row>
          </Stack>

          <SectionHeader title="Rooms Information" />
          <Stack spacing={5}>
            <Row>
              <KeyValueBlock label="Room Numbers" value={booking.rooms} />
              <KeyValueBlock label="Room Categories" value={booking.roomTypes} />
              <KeyValueBlock label="Hotel Names" value={booking.hotelNames} />
            </Row>
          </Stack>

          <SectionHeader title="Reservation & Payment Details" />
          <Stack spacing={5}>
            <Row>
              <KeyValueBlock label="Payment ID" value={booking.paymentId} />
              <KeyValueBlock label="Guests" value={booking.persons} />
              <KeyValueBlock label="Check-In" value={booking.checkIn} />
            </Row>
            <Row>
              <KeyValueBlock label="Check-Out" value={booking.checkOut} />
              <KeyValueBlock label="Total Amount" value={booking.totalAmount} />
              <KeyValueBlock label="Payment Method" value={booking.paymentMethod} />
            </Row>
            <Row>
              <KeyValueBlock label="Payment Date" value={booking.paymentDate} />
            </Row>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GuestDetails;
