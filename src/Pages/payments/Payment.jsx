import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Stack,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useTheme } from "@mui/material/styles";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../FirebaseFireStore/Firebase";
import Customdatagriddesktop from "../../Components/Customdatagriddesktop";
import StatusChip from "../../Components/StatusChip";
import { useForm } from "react-hook-form";
import Textfieldinput from "../../Components/Forms/Textfieldinput";
import Selectinput from "../../Components/Forms/Selectinput";
import { Link } from "react-router-dom";
import FormattedDate from "../../Components/FormattedDate"; // your date component

const Payment = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  const { control, watch } = useForm({
    defaultValues: {
      guestName: "",
      status: "",
    },
  });

  const filterGuest = watch("guestName");
  const filterStatus = watch("status");

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Fetch static collections once
        const [roomsSnap, usersSnap, categoriesSnap, bookingSnap] =
          await Promise.all([
            getDocs(collection(db, "rooms")),
            getDocs(collection(db, "users")),
            getDocs(collection(db, "roomCategory")),
            getDocs(collection(db, "bookings")),
          ]);

        // Map categories
        const categoryMap = {};
        categoriesSnap.docs.forEach((doc) => {
          categoryMap[doc.id] = doc.data().categoryName || "Unknown";
        });

        // Map rooms
        const roomMap = {};
        roomsSnap.docs.forEach((doc) => {
          const data = doc.data();
          roomMap[doc.id] = {
            roomNo: data.roomNo || "N/A",
            price: data.price || 0,
            categoryName: categoryMap[data.categoryId] || "Unknown Category",
          };
        });

        // Map users
        const userMap = {};
        usersSnap.docs.forEach((doc) => {
          const data = doc.data();
          userMap[doc.id] = {
            userName: data.userName || data.fullName || "Unknown User",
            userEmail: data.userEmail || data.email || "N/A",
          };
        });

        // Map bookings
        const bookingsMap = {};
        bookingSnap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          let roomNumbers = [];
          let totalRoomPrice = 0;
          const roomIds = Array.isArray(data.roomId)
            ? data.roomId
            : data.roomId
            ? [data.roomId]
            : [];

          roomIds.forEach((rid) => {
            if (roomMap[rid]) {
              roomNumbers.push(roomMap[rid].roomNo);
              totalRoomPrice += roomMap[rid].price; // sum all room prices
            }
          });

          bookingsMap[docSnap.id] = {
            guestName: userMap[data.userId]?.userName || "Unknown",
            checkIn: data.checkInDate || data.checkIn,
            checkOut: data.checkOutDate || data.checkOut,
            roomNumbers: roomNumbers.join(", ") || "N/A",
            totalPrice: totalRoomPrice,
          };
        });

        const unsubscribe = onSnapshot(collection(db, "payment"), (snapshot) => {
          const paymentsData = snapshot.docs
            .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
            .filter(p => p.bookingId); // only include payments with a bookingId

          // Group payments by bookingId
          const grouped = {};
          paymentsData.forEach((p) => {
            if (!grouped[p.bookingId]) grouped[p.bookingId] = [];
            grouped[p.bookingId].push(p);
          });

          // Merge grouped payments with bookings and filter out invalid/empty
          const mergedData = Object.entries(grouped)
            .filter(([bookingId, paymentsArray]) => paymentsArray && paymentsArray.length > 0)
            .map(([bookingId, paymentsArray]) => {
              const booking = bookingsMap[bookingId];
              if (!booking) return null;

              const totalPaid = paymentsArray.reduce(
                (sum, p) => sum + Number(p.paidAmount || 0),
                0
              );
              const totalAmount = booking.totalPrice || 0;

              let status = "Pending";
              if (paymentsArray.some((p) => p.status === "Rejected")) status = "Rejected";
              else if (totalPaid >= totalAmount) status = "Paid";

              return {
                id: bookingId,
                guestName: booking.guestName || "N/A",
                roomNo: booking.roomNumbers || "N/A",
                startDate: booking.checkIn || null,
                endDate: booking.checkOut || null,
                paidAmount: totalPaid,
                totalAmount,
                status,
              };
            })
            .filter(Boolean); // remove nulls

          setPayments(mergedData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("Failed to fetch payments:", err);
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const columns = [
    { field: "guestName", headerName: "Guest Name", flex: 1 },
    { field: "paidAmount", headerName: "Paid Amount", flex: 1 },
    { field: "totalAmount", headerName: "Total Amount", flex: 1 },
    {
      field: "dates",
      headerName: "Check-in → Check-out",
      flex: 1.5,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <span>
          <FormattedDate value={params.row.startDate} type="date" /> →{" "}
          <FormattedDate value={params.row.endDate} type="date" />
        </span>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => <StatusChip label={params.value} />,
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.8,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            alignItems: "center",
          }}
        >
          <Stack direction="row" spacing={1}>
            <Link to={`/payments/${params.row.id}`} style={{ textDecoration: "none" }}>
              <Button size="small" variant="outlined" color="info">
                <VisibilityIcon fontSize="small" />
              </Button>
            </Link>
          </Stack>
        </Box>
      ),
    },
  ];

  const filteredRows = useMemo(() => {
    return payments.filter((row) => {
      const searchValue = filterGuest.toLowerCase();
      const matchesGuest = row.guestName?.toLowerCase().includes(searchValue);
      const matchesRoom = row.roomNo?.toLowerCase().includes(searchValue);
      const matchesStatus = filterStatus ? row.status === filterStatus : true;
      return (matchesGuest || matchesRoom) && matchesStatus;
    });
  }, [payments, filterGuest, filterStatus]);

  return (
    <Box>
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          {/* Filters Top-Right */}
          <Grid container justifyContent="flex-end" spacing={2} sx={{ mb: 2 }}>
            <Grid item>
              <Textfieldinput
                name="guestName"
                control={control}
                placeholder="Search by Guest Name or Room No."
                fullWidth={false}
                sx={{ minWidth: 220 }}
              />
            </Grid>
            <Grid item>
              <Selectinput
                name="status"
                control={control}
                label="Status"
                options={[
                  { label: "All", value: "" },
                  { label: "Pending", value: "Pending" },
                  { label: "Rejected", value: "Rejected" },
                  { label: "Paid", value: "Paid" },
                ]}
                sx={{ minWidth: 180 }}
              />
            </Grid>
          </Grid>

          <Box sx={{ width: "100%", minWidth: 600, position: "relative" }}>
            <Customdatagriddesktop
              rows={filteredRows}
              columns={columns}
              pageSizeOptions={[5, 10, 20]}
              defaultPageSize={10}
              getRowId={(row) => row.id}
              loading={loading}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Payment;
