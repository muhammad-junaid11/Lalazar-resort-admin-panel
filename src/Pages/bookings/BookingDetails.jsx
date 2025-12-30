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
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmDialog from "../../Components/ConfirmDialog";
import KeyValueBlock from "../../Components/KeyValueBlock";
import HeaderSection from "../../Components/HeaderSection";
import LoadingOverlay from "../../Components/LoadingOverlay";
import StatusChip from "../../Components/StatusChip";
import FormattedDate from "../../Components/FormattedDate";

import { fetchBookingByIdForUI, updateBookingStatus,updateBookingStatusWithRooms } from "../../services/BookingService";

const BookingDetails = () => {
  const { id } = useParams();
  const theme = useTheme();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      
      const data = await fetchBookingByIdForUI(id);

      if (!data) {
        setBooking(null);
        return;
      }

      setBooking({
        ...data,
        userName: data.guestName || "N/A",
        number: data.number || "--",  
        paymentDate: data.paymentDate || null,
        paymentReceipt: data.paymentReceipt || "",
      });
    } catch (error) {
      console.error("Error fetching details:", error);
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

    await updateBookingStatusWithRooms(id, newStatus, booking?.roomsDetails || []);

    if (newStatus === "Rejected") toast.error("Booking rejected!");
    else if (newStatus === "Confirmed") toast.success("Booking accepted!");

    setBooking((prev) =>
      prev ? { ...prev, bookingStatus: newStatus } : prev
    );
  } catch (error) {
    console.error("Error updating status:", error);
    toast.error("Failed to update status");
  } finally {
    setUpdatingStatus(false);
    setDialogOpen(false);
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
              {/* Fixed: use booking.number instead of booking.phone */}
              <KeyValueBlock label="Phone No" value={booking.number} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Email" value={booking.email} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Address" value={booking.address} />
            </Grid>
          </Grid>

      
          <HeaderSection title="Rooms Information" />
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              justifyContent: "flex-start",
            }}
          >
            {booking.roomsDetails && booking.roomsDetails.map((room, idx) => (
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
                <Typography>Category: {room.categoryName || room.category}</Typography>
                <Typography>Hotel: {room.hotelName || room.hotel}</Typography>
                <Typography>Price: {room.price}</Typography>
              </Card>
            ))}
          </Box>

      
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
                {booking.paymentDate ? (
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <FormattedDate value={booking.paymentDate} type="time" />
                  </Box>
                ) : "--"}
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
