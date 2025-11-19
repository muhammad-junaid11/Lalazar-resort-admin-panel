import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../FirebaseFireStore/Firebase";
import KeyValueBlock from "../../Components/KeyValueBlock";
import HeaderSection from "../../Components/HeaderSection";
import LoadingOverlay from "../../Components/LoadingOverlay";
import StatusChip from "../../Components/StatusChip";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ImageDialog from "../../Components/ImageDialog";
import FormattedDate from "../../Components/FormattedDate";

const PaymentDetails = () => {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [partialDialogOpen, setPartialDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const [helperText, setHelperText] = useState("");

  const fetchPaymentDetails = async () => {
    setLoading(true);
    try {
      const paymentSnap = await getDoc(doc(db, "payment", id));
      if (!paymentSnap.exists()) {
        setPayment(null);
        return;
      }
      const paymentData = { id: paymentSnap.id, ...paymentSnap.data() };

      let totalPrice = 0;
      let bookingData = null;
      if (paymentData.bookingId) {
        const bookingSnap = await getDoc(doc(db, "bookings", paymentData.bookingId));
        if (bookingSnap.exists()) {
          bookingData = bookingSnap.data();
          const roomIds = Array.isArray(bookingData.roomId)
            ? bookingData.roomId
            : bookingData.roomId ? [bookingData.roomId] : [];

          const roomNumbers = [];
          for (const rid of roomIds) {
            const roomSnap = await getDoc(doc(db, "rooms", rid));
            if (roomSnap.exists) {
              const roomData = roomSnap.data();
              totalPrice += roomData.price || 0;
              roomNumbers.push(roomData.roomNo || "N/A");
            }
          }

          let userName = "N/A";
          if (bookingData.userId) {
            const userSnap = await getDoc(doc(db, "users", bookingData.userId));
            if (userSnap.exists)
              userName = userSnap.data().userName || userSnap.data().fullName || "N/A";
          }

          const standardizedCheckIn = bookingData.checkIn || bookingData.checkInDate;
          const standardizedCheckOut = bookingData.checkOut || bookingData.checkOutDate;

          setBooking({
            ...bookingData,
            guestName: userName,
            roomNumbers: roomNumbers.join(", "),
            standardizedCheckIn,
            standardizedCheckOut,
            totalPrice,
          });
        }
      }

      paymentData.totalAmount = totalPrice;
      paymentData.paidAmount = Number(paymentData.paidAmount || 0);

      setPayment(paymentData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch payment details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentDetails();
  }, [id]);

  const handleMarkPaid = async () => {
    if (!payment || !booking) return;
    try {
      setUpdatingStatus(true);
      const totalAmount = booking.totalPrice || 0;
      await updateDoc(doc(db, "payment", payment.id), {
        paidAmount: totalAmount,
        status: "Paid",
      });
      setPayment((prev) => ({ ...prev, paidAmount: totalAmount, status: "Paid" }));
      toast.success("Payment marked as PAID!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePartialPayment = async () => {
    if (!payment) return;
    const partial = Number(partialAmount);
    if (isNaN(partial) || partial <= 0) {
      toast.error("Enter valid positive number");
      return;
    }
    try {
      setUpdatingStatus(true);
      const newPaidAmount = payment.paidAmount + partial;
      const newStatus = newPaidAmount >= payment.totalAmount ? "Paid" : "Pending";
      await updateDoc(doc(db, "payment", payment.id), {
        paidAmount: newPaidAmount,
        status: newStatus,
      });
      setPayment((prev) => ({
        ...prev,
        paidAmount: newPaidAmount,
        status: newStatus,
      }));
      toast.success("Partial payment applied!");
      setPartialDialogOpen(false);
      setPartialAmount("");
      setHelperText(""); // clear helper text
    } catch (err) {
      console.error(err);
      toast.error("Failed to update payment");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReject = async () => {
    if (!payment) return;
    try {
      setUpdatingStatus(true);
      await updateDoc(doc(db, "payment", payment.id), { status: "Rejected" });
      setPayment((prev) => ({ ...prev, status: "Rejected" }));
      toast.success("Payment rejected!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject payment");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePartialAmountChange = (e) => {
    const value = Number(e.target.value);
    const maxAllowed = payment.totalAmount - payment.paidAmount;

    if (value > maxAllowed) {
      setHelperText(`Amount cannot exceed remaining balance (${maxAllowed})`);
    } else {
      setHelperText("");
      setPartialAmount(e.target.value);
    }
  };

  const hasOutstandingBalance = payment?.totalAmount > payment?.paidAmount;

  if (loading)
    return <LoadingOverlay loading message="Loading payment details..." fullScreen />;
  if (!payment)
    return (
      <Typography variant="h6" sx={{ textAlign: "center", mt: 5 }}>
        Payment not found
      </Typography>
    );

  return (
    <Box sx={{ flexGrow: 1, mt: 0, mb: 0, py: 1 }}>
      <ToastContainer position="top-right" autoClose={3000} />

      <LoadingOverlay loading={updatingStatus} message="Processing..." fullScreen />

      <Card sx={{ borderRadius: 3, boxShadow: 4, mb: 4 }}>
        <CardContent sx={{ px: { xs: 2, sm: 4, md: 6 } }}>
          <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>Payment Detail</Typography>
            <StatusChip label={payment.status} isPayment />
          </Box>

          <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              disabled={updatingStatus || !hasOutstandingBalance || payment.status === "Paid" || payment.status === "Rejected"}
              onClick={handleMarkPaid}
            >
              Mark Paid
            </Button>
            <Button
              variant="contained"
              color="warning"
              disabled={updatingStatus || !hasOutstandingBalance || payment.status === "Paid" || payment.status === "Rejected"}
              onClick={() => setPartialDialogOpen(true)}
            >
              Partial Payment
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={updatingStatus || payment.status === "Paid" || payment.status === "Rejected"}
              onClick={handleReject}
            >
              Reject
            </Button>
          </Box>

          <HeaderSection title="Guest & Booking Information" />
          <Grid container spacing={2}>
            <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Guest Name" value={booking?.guestName || "N/A"} />
            </Grid>
            <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Room Number(s)" value={booking?.roomNumbers || "N/A"} />
            </Grid>
            <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Check-in">
                <FormattedDate value={booking?.standardizedCheckIn} showTime />
              </KeyValueBlock>
            </Grid>
            <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Check-out">
                <FormattedDate value={booking?.standardizedCheckOut} showTime />
              </KeyValueBlock>
            </Grid>
          </Grid>

          <HeaderSection title="Payment Information" />
          <Grid container spacing={2}>
            <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Paid Amount" value={payment.paidAmount || 0} />
            </Grid>
            <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Total Amount" value={payment.totalAmount || 0} />
            </Grid>
            <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Payment Method" value={payment.paymentType || "--"} />
            </Grid>
            {payment.receiptPath && (
              <Grid item size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="Payment Receipt">
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 1, px: 2, textTransform: "none" }}
                    onClick={() => setReceiptDialogOpen(true)}
                  >
                    Show Receipt
                  </Button>
                </KeyValueBlock>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Dialog
        open={partialDialogOpen}
        onClose={() => setPartialDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Enter Partial Payment Amount</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={partialAmount}
            onChange={handlePartialAmountChange}
            helperText={helperText}
            inputProps={{
              max: payment.totalAmount - payment.paidAmount,
              min: 0,
              step: 0.01,
            }}
            onKeyDown={(e) => {
              if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPartialDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePartialPayment}>Submit</Button>
        </DialogActions>
      </Dialog>

      <ImageDialog
        open={receiptDialogOpen}
        onClose={() => setReceiptDialogOpen(false)}
        title="Payment Receipt"
        imageSrc={payment.receiptPath}
      />
    </Box>
  );
};

export default PaymentDetails;
