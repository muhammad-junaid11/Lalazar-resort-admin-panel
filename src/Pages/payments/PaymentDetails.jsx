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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import KeyValueBlock from "../../Components/KeyValueBlock";
import HeaderSection from "../../Components/HeaderSection";
import LoadingOverlay from "../../Components/LoadingOverlay";
import StatusChip from "../../Components/StatusChip";
import FormattedDate from "../../Components/FormattedDate";
import ImageDialog from "../../Components/ImageDialog";

// SERVICES
import { fetchBookingByIdForUI } from "../../services/BookingService";
import { fetchPaymentsByBookingId, addPayment, rejectPayment } from "../../services/PaymentService";

const PaymentDetails = () => {
  const { id } = useParams(); // bookingId
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [partialDialogOpen, setPartialDialogOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const [helperText, setHelperText] = useState("");
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  // ==================== UPDATED fetchDetails ====================
  const fetchDetails = async () => {
  setLoading(true);
  try {
    // Booking info
    const bookingData = await fetchBookingByIdForUI(id);
    if (!bookingData) {
      setBooking(null);
      setPayment(null);
      setPaymentHistory([]);
      return;
    }
    setBooking(bookingData);

    // Fetch all payments for this booking
    const paymentHistoryArray = await fetchPaymentsByBookingId(id);
    setPaymentHistory(paymentHistoryArray);

    // Sum of paid amounts
    const totalPaid = paymentHistoryArray.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0);

    // Get totalAmount from the latest payment (if exists), otherwise fallback to booking total
    const latestPayment = paymentHistoryArray[paymentHistoryArray.length - 1];
    const totalAmount = latestPayment ? Number(latestPayment.totalAmount || 0) : Number(bookingData.totalAmount || 0);

    setPayment({
      paidAmount: totalPaid,
      totalAmount: totalAmount,
      status: totalPaid >= totalAmount && totalAmount > 0 ? "Paid" : "Pending",
    });

  } catch (err) {
    console.error(err);
    toast.error("Failed to fetch payment details");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchDetails();
  }, [id]);

  const hasOutstandingBalance = payment?.totalAmount > payment?.paidAmount;

  const handleMarkPaid = async () => {
    if (!booking || !payment) return;

    try {
      setUpdatingStatus(true);
      const remaining = payment.totalAmount - payment.paidAmount;
      if (remaining <= 0) return;

      await addPayment({
        bookingId: booking.id,
        label: "Final Payment",
        paidAmount: remaining,
        totalAmount: payment.totalAmount,
        paymentType: "Cash",
        status: "Paid",
      });

      toast.success("Payment marked as PAID!");
      fetchDetails();
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark as PAID");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePartialPayment = async () => {
    if (!booking || !payment) return;

    const partial = Number(partialAmount);
    if (isNaN(partial) || partial <= 0) {
      toast.error("Enter valid positive number");
      return;
    }

    const remaining = payment.totalAmount - payment.paidAmount;
    if (partial > remaining) {
      toast.error(`Amount cannot exceed remaining balance (${remaining})`);
      return;
    }

    try {
      setUpdatingStatus(true);

      // Determine label
      let label = "";
      if (partial + payment.paidAmount >= payment.totalAmount) {
        label = "Final Payment";
      } else {
        const advanceCount = paymentHistory.filter(p => p.label?.startsWith("Advance")).length;
        label = `Advance ${advanceCount + 1}`;
      }

      await addPayment({
        bookingId: booking.id,
        label,
        paidAmount: partial,
        totalAmount: payment.totalAmount,
        paymentType: "Cash",
        status: partial + payment.paidAmount >= payment.totalAmount ? "Paid" : "Pending",
      });

      toast.success("Partial payment recorded!");
      setPartialDialogOpen(false);
      setPartialAmount("");
      setHelperText("");
      fetchDetails();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add partial payment");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReject = async () => {
    if (!payment) return;

    try {
      setUpdatingStatus(true);
      const paymentsArray = await fetchPaymentsByBookingId(id);
      for (const p of paymentsArray) {
        await rejectPayment(p.id);
      }
      toast.success("Payment rejected!");
      fetchDetails();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject payment");
    } finally {
      setUpdatingStatus(false);
    }
  };

const handlePartialAmountChange = (e) => {
  const inputValue = e.target.value;
  const value = Number(inputValue);
  
  // Calculate remaining balance
  const maxAllowed = payment ? payment.totalAmount - payment.paidAmount : 0;

  // 1. Always allow empty string so user can backspace
  if (inputValue === "") {
    setPartialAmount("");
    setHelperText("");
    return;
  }

  if (value > maxAllowed) {
    setHelperText(`Amount cannot exceed remaining balance (${maxAllowed})`);
    return; 
  }


  if (!isNaN(value)) {
    setPartialAmount(inputValue);
    setHelperText("");
  }
};

  if (loading)
    return <LoadingOverlay loading message="Loading payment details..." fullScreen />;

  if (!payment || !booking)
    return (
      <Typography variant="h6" sx={{ textAlign: "center", mt: 5 }}>
        Payment or booking not found
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
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Guest Name" value={booking.guestName || "N/A"} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Room Number(s)" value={booking.roomNumbers || "N/A"} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Check-in"><FormattedDate value={booking.checkIn} showTime /></KeyValueBlock>
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Check-out"><FormattedDate value={booking.checkOut} showTime /></KeyValueBlock>
            </Grid>
          </Grid>

          <HeaderSection title="Payment Information" />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Paid Amount" value={payment.paidAmount} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Total Amount" value={payment.totalAmount || "--"} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Payment Receipt">
                {paymentHistory.length > 0 && paymentHistory[0].receiptPath ? (
                  <Button variant="contained" color="primary" onClick={() => setReceiptDialogOpen(true)}>
                    Show Receipt
                  </Button>
                ) : "--"}
              </KeyValueBlock>
            </Grid>
          </Grid>

          <HeaderSection title="Payment History" />
          {paymentHistory.length > 0 ? (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Payment Description</strong></TableCell>
                    <TableCell><strong>Paid Amount</strong></TableCell>
                    <TableCell><strong>Payment Type</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentHistory.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell>{p.label || "N/A"}</TableCell>
                      <TableCell>{p.paidAmount}</TableCell>
                      <TableCell>{p.paymentType || "N/A"}</TableCell>
                      <TableCell><FormattedDate value={p.paymentDate} showTime /></TableCell>
                      <TableCell>{p.status || "Pending"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" sx={{ textAlign: "center", mt: 2 }}>
              No payment history available.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Dialog open={partialDialogOpen} onClose={() => setPartialDialogOpen(false)} maxWidth="sm" fullWidth>
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
            helperText={helperText || `Remaining balance: ${payment?.totalAmount - payment?.paidAmount}`}
            error={!!helperText}
            inputProps={{ min: 0, step: 0.01 }}
            onKeyDown={e => { if (["e","E","+","-"].includes(e.key)) e.preventDefault(); }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPartialDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePartialPayment}>Submit</Button>
        </DialogActions>
      </Dialog>

      <ImageDialog open={receiptDialogOpen} onClose={() => setReceiptDialogOpen(false)} title="Payment Receipt" imageSrc={paymentHistory.length > 0 ? paymentHistory[0].receiptPath : null} />
    </Box>
  );
};

export default PaymentDetails;
