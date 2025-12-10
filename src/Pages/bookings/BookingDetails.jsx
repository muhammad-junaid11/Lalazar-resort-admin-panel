import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Grid,
  useTheme,
} from "@mui/material";
import { useParams } from "react-router-dom";
import ImageDialog from "../../Components/ImageDialog";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../FirebaseFireStore/Firebase";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmDialog from "../../Components/ConfirmDialog";
import KeyValueBlock from "../../Components/KeyValueBlock";
import HeaderSection from "../../Components/HeaderSection";
import LoadingOverlay from "../../Components/LoadingOverlay";
import StatusChip from "../../Components/StatusChip";
import FormattedDate from "../../Components/FormattedDate";

const BookingDetails = () => {
  const { id } = useParams();
  const theme = useTheme();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

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

      let userData = {};
      if (bookingData.userId) {
        const userSnap = await getDoc(doc(db, "users", bookingData.userId));
        if (userSnap.exists) userData = userSnap.data();
      }

      const paymentRef = collection(db, "payment");
      const paymentQuery = query(
        paymentRef,
        where("bookingId", "==", bookingDocId)
      );
      const paymentSnap = await getDocs(paymentQuery);

      let totalAmount = 0; // **manual total amount**
      let paymentDate = "--";
      let paymentMethod = bookingData.paymentMethod || "--";
      let paymentStatus = "Pending";
      let paymentId = "--";
      let paymentReceiptUrl = "";

      if (!paymentSnap.empty) {
        let latestPaymentTimestamp = 0;
        let latestPaymentData = null;

        paymentSnap.docs.forEach((payDoc) => {
          const payData = payDoc.data();
          if (payData.receiptPath) paymentReceiptUrl = payData.receiptPath;

          const paymentTimestamp = payData.paymentDate?.seconds || 0;
          if (paymentTimestamp >= latestPaymentTimestamp) {
            latestPaymentTimestamp = paymentTimestamp;
            latestPaymentData = payData;
            paymentId = payDoc.id;
          }
        });

        if (latestPaymentData) {
          paymentMethod = latestPaymentData.paymentType || paymentMethod;
          paymentStatus = latestPaymentData.status
            ? latestPaymentData.status.charAt(0).toUpperCase() +
              latestPaymentData.status.slice(1)
            : "Pending";
          paymentDate = latestPaymentData.paymentDate || null;
        }
      }

      // Fetch room details and calculate **manual total amount**
      let roomsDetails = [];
      if (Array.isArray(bookingData.roomId) && bookingData.roomId.length > 0) {
        const roomPromises = bookingData.roomId.map(async (roomId) => {
          const roomSnap = await getDoc(doc(db, "rooms", roomId));
          if (!roomSnap.exists) return null;
          const roomData = roomSnap.data();

          let categoryName = "--";
          if (roomData.categoryId) {
            const categorySnap = await getDoc(
              doc(db, "roomCategory", roomData.categoryId)
            );
            if (categorySnap.exists)
              categoryName = categorySnap.data().categoryName;
          }

          let hotelName = "--";
          if (roomData.hotelId) {
            const hotelSnap = await getDoc(doc(db, "hotel", roomData.hotelId));
            if (hotelSnap.exists) hotelName = hotelSnap.data().hotelName;
          }

          totalAmount += Number(roomData.price || 0); // **add room price to total**

          return {
            id: roomSnap.id, // Added room id to use for updating status
            roomNo: roomData.roomNo || "N/A",
            category: categoryName,
            hotel: hotelName,
            price: roomData.price || 0, // optional
          };
        });

        roomsDetails = (await Promise.all(roomPromises)).filter(Boolean);
      }

      setBooking({
        id: bookingDocId,
        bookingId: bookingDocId,
        bookingStatus:
          bookingData.status?.charAt(0).toUpperCase() +
            bookingData.status?.slice(1) || "New",
        userName: userData.userName || userData.fullName || "N/A",
        gender: userData.gender || "N/A",
        dob: userData.dob || null,
        number: userData.number || "--",
        email: userData.email || userData.userEmail || "--",
        address: userData.address || "--",
        idProof: userData.idProof || "--",
        userId: bookingData.userId || "--",
        roomsDetails,
        paymentId,
        totalAmount, // **calculated manually**
        paymentMethod,
        paymentStatus,
        paymentDate,
        paymentReceipt: paymentReceiptUrl,
        persons: bookingData.persons || "--",
        checkIn: bookingData.checkInDate || null,
        checkOut: bookingData.checkOutDate || null,
        adminId: bookingData.adminId || "--",
        secondaryEmail: bookingData.secondaryEmail || "--",
      });
    } catch (error) {
      console.error("Error:", error);
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

      // ✅ If booking is approved, mark rooms as "Booked"
      if (newStatus === "Confirmed" && booking?.roomsDetails?.length) {
        const roomUpdates = booking.roomsDetails.map(async (room) => {
          await updateDoc(doc(db, "rooms", room.id), { status: "Booked" });
        });
        await Promise.all(roomUpdates);
      }

      if (newStatus === "Rejected") toast.error("Booking rejected!");
      else if (newStatus === "Confirmed") toast.success("Booking accepted!");

      setBooking((prev) =>
        prev ? { ...prev, bookingStatus: newStatus } : prev
      );
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading)
    return (
      <LoadingOverlay
        loading={loading}
        message="Loading booking details..."
        fullScreen
      />
    );

  if (!booking)
    return (
      <Typography
        variant="h6"
        sx={{ textAlign: "center", mt: 5, color: "text.secondary" }}
      >
        Booking not found
      </Typography>
    );

  return (
    <Box sx={{ flexGrow: 1, mt: 0, mb: 0, py: 1 }}>
      <ToastContainer position="top-right" autoClose={3000} />

      <Card sx={{ borderRadius: 3, boxShadow: 4, mb: 4 }}>
        <CardContent sx={{ px: { xs: 2, sm: 4, md: 6 } }}>
          {/* Status Section */}
          <Box
            sx={{
              mb: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", color: theme.palette.primary.main }}
            >
              Booking Detail:
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={1.5}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>
                  Booking Status:
                </Typography>
                <StatusChip label={booking.bookingStatus} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>
                  Payment Status:
                </Typography>
                <StatusChip label={booking.paymentStatus} isPayment />
              </Box>
            </Stack>
          </Box>

          {/* Accept / Reject Buttons */}
          <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              disabled={updatingStatus || booking.bookingStatus === "Confirmed"}
              onClick={() => {
                setDialogAction("Confirmed");
                setDialogOpen(true);
              }}
            >
              Accept
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={
                updatingStatus ||
                booking.bookingStatus === "Rejected" ||
                booking.bookingStatus === "Confirmed"
              }
              onClick={() => {
                setDialogAction("Rejected");
                setDialogOpen(true);
              }}
            >
              Reject
            </Button>
          </Box>

          {/* Guest Info */}
          <HeaderSection title="Guest Information" />
          <Grid container sx={{ px: 0.5 }} spacing={2}>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Guest Name" value={booking.userName} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Gender" value={booking.gender} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock
                label="Date of Birth"
                value={<FormattedDate value={booking.dob} type="date" />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Phone No" value={booking.number} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Email" value={booking.email} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Address" value={booking.address} />
            </Grid>
          </Grid>

          {/* Rooms Info */}
          <HeaderSection title="Rooms Information" />
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              justifyContent: "flex-start",
            }}
          >
            {booking.roomsDetails.map((room, idx) => (
              <Card
                key={idx}
                sx={{
                  width: 250,
                  height: 150,
                  p: 2,
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 1,
                  },
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  Room {idx + 1}
                </Typography>
                <Typography>Room Number: {room.roomNo}</Typography>
                <Typography>Category: {room.category}</Typography>
                <Typography>Hotel: {room.hotel}</Typography>
                <Typography>Price: {room.price}</Typography>
              </Card>
            ))}
          </Box>

          {/* Reservation & Payment */}
          <HeaderSection title="Reservation & Payment Details" />
          <Grid container sx={{ px: 0.5 }} spacing={2}>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Guests" value={booking.persons} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock
                label="Check-In"
                value={<FormattedDate value={booking.checkIn} type="time" />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock
                label="Check-Out"
                value={<FormattedDate value={booking.checkOut} type="time" />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Total Amount" value={booking.totalAmount} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Payment Method" value={booking.paymentMethod} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Payment Date">
                {booking.paymentDate && (
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <FormattedDate value={booking.paymentDate} type="date" />
                    <FormattedDate value={booking.paymentDate} type="time" />
                  </Box>
                )}
              </KeyValueBlock>
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Payment Receipt">
                {booking.paymentReceipt && (
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 1, px: 2, maxWidth: 180, minWidth: 100, textTransform: "none" }}
                    onClick={() => setReceiptDialogOpen(true)}
                  >
                    Show Receipt
                  </Button>
                )}
              </KeyValueBlock>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={dialogAction === "Confirmed" ? "Confirm Booking" : "Reject Booking"}
        description={
          dialogAction === "Confirmed"
            ? "Are you sure you want to accept this booking?"
            : "Are you sure you want to reject this booking?"
        }
        onConfirm={() => handleStatusUpdate(dialogAction)}
        confirmText={dialogAction === "Confirmed" ? "Accept" : "Reject"}
        cancelText="Cancel"
      />

      <ImageDialog
        open={receiptDialogOpen}
        onClose={() => setReceiptDialogOpen(false)}
        title="Payment Receipt"
        imageSrc={booking?.paymentReceipt}
      />
    </Box>
  );
};

export default BookingDetails;
