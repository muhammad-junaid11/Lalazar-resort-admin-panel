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
import {
  doc,
  getDoc,
  addDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../FirebaseFireStore/Firebase";
import KeyValueBlock from "../../Components/KeyValueBlock";
import HeaderSection from "../../Components/HeaderSection";
import LoadingOverlay from "../../Components/LoadingOverlay";
import StatusChip from "../../Components/StatusChip";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FormattedDate from "../../Components/FormattedDate";
// ADDED IMPORT for ImageDialog
import ImageDialog from "../../Components/ImageDialog";

const PaymentDetails = () => {
  const { id } = useParams(); // id = bookingId now
  const [payment, setPayment] = useState(null);
  const [booking, setBooking] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [partialDialogOpen, setPartialDialogOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const [helperText, setHelperText] = useState("");
  // ADDED STATE for ImageDialog
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  const fetchPaymentDetails = async () => {
    setLoading(true);
    try {
      // Fetch booking
      const bookingSnap = await getDoc(doc(db, "bookings", id));
      if (!bookingSnap.exists()) {
        setBooking(null);
        setPayment(null);
        setPaymentHistory([]);
        return;
      }
      const bookingData = bookingSnap.data();
      bookingData.id = bookingSnap.id;

      // Rooms
      const roomIds = Array.isArray(bookingData.roomId)
        ? bookingData.roomId
        : bookingData.roomId
        ? [bookingData.roomId]
        : [];
      let totalPrice = 0;
      const roomNumbers = [];
      for (const rid of roomIds) {
        const roomSnap = await getDoc(doc(db, "rooms", rid));
        if (roomSnap.exists()) {
          const roomData = roomSnap.data();
          totalPrice += roomData.price || 0;
          roomNumbers.push(roomData.roomNo || "N/A");
        }
      }

      // User
      let userName = "N/A";
      if (bookingData.userId) {
        const userSnap = await getDoc(doc(db, "users", bookingData.userId));
        if (userSnap.exists)
          userName =
            userSnap.data().userName || userSnap.data().fullName || "N/A";
      }

      const standardizedCheckIn =
        bookingData.checkIn || bookingData.checkInDate;
      const standardizedCheckOut =
        bookingData.checkOut || bookingData.checkOutDate;

      setBooking({
        ...bookingData,
        guestName: userName,
        roomNumbers: roomNumbers.join(", "),
        standardizedCheckIn,
        standardizedCheckOut,
        totalPrice,
      });

      // Fetch all payments for this booking
      const paymentsQuery = query(
        collection(db, "payment"),
        where("bookingId", "==", bookingSnap.id),
        orderBy("paymentDate", "asc")
      );
      const paymentDocs = await getDocs(paymentsQuery);
      const allPayments = paymentDocs.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setPaymentHistory(allPayments); // Set payment history

      const paidAmountSum = allPayments.reduce(
        (sum, d) => sum + Number(d.paidAmount || 0),
        0
      );

      const lastPayment = allPayments.length
        ? allPayments[allPayments.length - 1]
        : null;

      setPayment({
        id: bookingSnap.id,
        totalAmount: totalPrice,
        paidAmount: paidAmountSum,
        status:
          paidAmountSum >= totalPrice
            ? "Paid"
            : lastPayment?.status || "Pending",
        paymentType: lastPayment?.paymentType || "Cash",
      });
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
      const remaining = booking.totalPrice - payment.paidAmount;
      if (remaining <= 0) return;

      await addDoc(collection(db, "payment"), {
        bookingId: booking.id,
        label: "Final Payment",
        paidAmount: remaining,
        paymentDate: new Date(),
        paymentType: "Cash",
        status: "Paid",
      });

      toast.success("Payment marked as PAID!");
      fetchPaymentDetails();
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark as PAID");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePartialPayment = async () => {
    if (!payment || !booking) return;
    const partial = Number(partialAmount);
    if (isNaN(partial) || partial <= 0) {
      toast.error("Enter valid positive number");
      return;
    }

    const remaining = booking.totalPrice - payment.paidAmount;
    if (partial > remaining) {
      toast.error(`Amount cannot exceed remaining balance (${remaining})`);
      return;
    }

    try {
      setUpdatingStatus(true);

      // Fetch previous payments to calculate "Advance X"
      const paymentsQuery = query(
        collection(db, "payment"),
        where("bookingId", "==", booking.id),
        orderBy("paymentDate", "asc")
      );
      const paymentDocs = await getDocs(paymentsQuery);
      const partialCount = paymentDocs.docs.filter((d) =>
        d.data().label?.startsWith("Advance")
      ).length;

      let label = "";
      if (partial + payment.paidAmount >= booking.totalPrice) {
        label = "Final Payment";
      } else {
        label = `Advance ${partialCount + 1}`;
      }

      await addDoc(collection(db, "payment"), {
        bookingId: booking.id,
        label,
        paidAmount: partial,
        paymentDate: new Date(),
        paymentType: "Cash",
        status:
          partial + payment.paidAmount >= booking.totalPrice
            ? "Paid"
            : "Pending",
      });

      toast.success(`${label} recorded!`);
      setPartialDialogOpen(false);
      setPartialAmount("");
      setHelperText("");
      fetchPaymentDetails();
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
      await updateDoc(doc(db, "payment", id), { status: "Rejected" }); // You may want to reject all payments of this booking instead
      toast.success("Payment rejected!");
      fetchPaymentDetails();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject payment");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePartialAmountChange = (e) => {
    const value = Number(e.target.value);
    const maxAllowed = booking ? booking.totalPrice - payment.paidAmount : 0;
    
    // Only update state if it's a valid number or empty string
    if (!isNaN(value) || e.target.value === "") {
        setPartialAmount(e.target.value);
    }

    if (value > maxAllowed) {
      setHelperText(`Amount cannot exceed remaining balance (${maxAllowed})`);
    } else {
      setHelperText("");
    }
  };

  const hasOutstandingBalance = payment?.totalAmount > payment?.paidAmount;

  if (loading)
    return (
      <LoadingOverlay loading message="Loading payment details..." fullScreen />
    );
  if (!payment || !booking)
    return (
      <Typography variant="h6" sx={{ textAlign: "center", mt: 5 }}>
        Payment or booking not found
      </Typography>
    );

  return (
    <Box sx={{ flexGrow: 1, mt: 0, mb: 0, py: 1 }}>
      <ToastContainer position="top-right" autoClose={3000} />
      <LoadingOverlay
        loading={updatingStatus}
        message="Processing..."
        fullScreen
      />

      <Card sx={{ borderRadius: 3, boxShadow: 4, mb: 4 }}>
        <CardContent sx={{ px: { xs: 2, sm: 4, md: 6 } }}>
          <Box
            sx={{
              mb: 3,
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Payment Detail
            </Typography>
            <StatusChip label={payment.status} isPayment />
          </Box>

          <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              disabled={
                updatingStatus ||
                !hasOutstandingBalance ||
                payment.status === "Paid" ||
                payment.status === "Rejected"
              }
              onClick={handleMarkPaid}
            >
              Mark Paid
            </Button>
            <Button
              variant="contained"
              color="warning"
              disabled={
                updatingStatus ||
                !hasOutstandingBalance ||
                payment.status === "Paid" ||
                payment.status === "Rejected"
              }
              onClick={() => setPartialDialogOpen(true)}
            >
              Partial Payment
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={
                updatingStatus ||
                payment.status === "Paid" ||
                payment.status === "Rejected"
              }
              onClick={handleReject}
            >
              Reject
            </Button>
          </Box>

          <HeaderSection title="Guest & Booking Information" />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock
                label="Guest Name"
                value={booking?.guestName || "N/A"}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock
                label="Room Number(s)"
                value={booking?.roomNumbers || "N/A"}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Check-in">
                <FormattedDate value={booking?.standardizedCheckIn} showTime />
              </KeyValueBlock>
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Check-out">
                <FormattedDate value={booking?.standardizedCheckOut} showTime />
              </KeyValueBlock>
            </Grid>
          </Grid>

          <HeaderSection title="Payment Information" />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock
                label="Paid Amount"
                value={payment.paidAmount || 0}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock
                label="Total Amount"
                value={payment.totalAmount || 0}
              />
            </Grid>
            {/* UPDATED: Use Button to trigger ImageDialog */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <KeyValueBlock label="Payment Receipt">
                {paymentHistory.length > 0 && paymentHistory[0].receiptPath ? (
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 1, px: 2, maxWidth: 180, minWidth: 100, textTransform: "none" }}
                    onClick={() => setReceiptDialogOpen(true)}
                  >
                    Show Receipt
                  </Button>
                ) : (
                  "--"
                )}
              </KeyValueBlock>
            </Grid>
          </Grid>

          <HeaderSection title="Payment History" />
          {paymentHistory.length > 0 ? (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Payment Description</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Paid Amount</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Payment Type</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Date</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentHistory
                    // Keep all payments with a label or paidAmount > 0
                    .filter(p => p.label || Number(p.paidAmount) > 0)
                    .map((p, index) => (
                      <TableRow key={index}>
                        <TableCell>{p.label || 'N/A'}</TableCell>
                        <TableCell>{p.paidAmount || 0}</TableCell>
                        <TableCell>{p.paymentType || 'N/A'}</TableCell>
                        <TableCell><FormattedDate value={p.paymentDate} showTime /></TableCell>
                      </TableRow>
                    ))
                  }
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
            helperText={helperText || `Remaining balance: ${booking?.totalPrice - payment?.paidAmount}`}
            error={!!helperText}
            inputProps={{
              min: 0,
              step: 0.01,
            }}
            onKeyDown={(e) => {
              if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPartialDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePartialPayment}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* ADDED ImageDialog Component */}
      <ImageDialog
        open={receiptDialogOpen}
        onClose={() => setReceiptDialogOpen(false)}
        title="Payment Receipt"
        // Safely access the receiptPath from the first payment in history
        imageSrc={paymentHistory.length > 0 ? paymentHistory[0].receiptPath : null}
      />
    </Box>
  );
};

export default PaymentDetails;