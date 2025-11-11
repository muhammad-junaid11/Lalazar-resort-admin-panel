import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  CircularProgress,
  Button,
} from "@mui/material";
import { Link } from "react-router-dom";
import { auth, db } from "../../FirebaseFireStore/Firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Customdatagriddesktop from "../../Components/Customdatagriddesktop";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HotelIcon from "@mui/icons-material/Hotel";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const statuses = ["New", "Pending", "Confirmed", "Checked Out", "Cancelled"];


const stats = [
  { label: "Active Bookings", value: "85%", change: "+5%", icon: <HotelIcon sx={{ fontSize: 32, color: "#fff" }} /> },
  { label: "Room Occupancy", value: "65%", change: "-10%", icon: <MeetingRoomIcon sx={{ fontSize: 32, color: "#fff" }} /> },
  { label: "Guest Satisfaction", value: "6.0/10", change: "-4%", icon: <EmojiEmotionsIcon sx={{ fontSize: 32, color: "#fff" }} /> },
  { label: "Revenue Growth", value: "12%", change: "+8%", icon: <TrendingUpIcon sx={{ fontSize: 32, color: "#fff" }} /> },
];

const formatDate = (val) => {
  if (!val) return "N/A";
  try {
    const date = val.toDate ? val.toDate() : new Date(val);
    return isNaN(date.getTime()) ? "N/A" : date.toISOString().split("T")[0];
  } catch {
    return "N/A";
  }
};

const Bookings = () => {
  const [adminName, setAdminName] = useState("Admin");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = useTheme();

  // Fetch admin name
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          setAdminName(docSnap.exists() ? docSnap.data().userName || docSnap.data().fullName || "Admin" : "Admin");
        } catch {
          setAdminName("Admin");
        }
      } else setAdminName("Admin");
    });
    return () => unsubscribe();
  }, []);

  // Fetch bookings data
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const [roomsSnap, usersSnap, categoriesSnap, bookingSnap, paymentSnap] = await Promise.all([
          getDocs(collection(db, "rooms")),
          getDocs(collection(db, "users")),
          getDocs(collection(db, "roomCategory")),
          getDocs(collection(db, "bookings")),
          getDocs(collection(db, "payment")),
        ]);

        const categoryMap = {};
        categoriesSnap.docs.forEach(doc => {
          categoryMap[doc.id] = doc.data().categoryName || "Unknown";
        });
        setCategories(Object.values(categoryMap));

        const roomMap = {};
        roomsSnap.docs.forEach(doc => {
          const data = doc.data();
          roomMap[doc.id] = {
            roomNo: data.roomNo || "N/A",
            categoryName: categoryMap[data.categoryId] || "Unknown Category",
          };
        });

        const userMap = {};
        usersSnap.docs.forEach(doc => {
          const data = doc.data();
          userMap[doc.id] = {
            userName: data.userName || data.fullName || "Unknown User",
            userEmail: data.userEmail || data.email || "N/A",
          };
        });

        const paymentMap = {};
        paymentSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.bookingId)
            paymentMap[data.bookingId] = {
              status: data.status?.charAt(0).toUpperCase() + data.status?.slice(1).toLowerCase() || "Pending",
            };
        });

        const mergedBookings = bookingSnap.docs.map(docSnap => {
          const data = docSnap.data();
          const userData = userMap[data.userId] || {};
          const paymentData = paymentMap[docSnap.id] || paymentMap[data.bookingId] || {};

          let roomNumbers = [];
          let categoriesList = [];

          if (Array.isArray(data.roomId)) {
            data.roomId.forEach(rid => {
              if (roomMap[rid]) {
                roomNumbers.push(roomMap[rid].roomNo);
                categoriesList.push(roomMap[rid].categoryName);
              }
            });
          } else if (data.roomId && roomMap[data.roomId]) {
            roomNumbers.push(roomMap[data.roomId].roomNo);
            categoriesList.push(roomMap[data.roomId].categoryName);
          }

          return {
            id: docSnap.id,
            bookingId: data.bookingId || docSnap.id.substring(0, 8),
            userName: userData.userName,
            email: userData.userEmail,
            category: categoriesList.join(", ") || "Unknown Category",
            roomNumber: roomNumbers.join(", ") || "N/A",
            roomCount: Array.isArray(data.roomId) ? data.roomId.length : data.roomId ? 1 : 0,
            checkIn: formatDate(data.checkInDate || data.checkIn),
            checkOut: formatDate(data.checkOutDate || data.checkOut),
            bookingStatus: data.status?.charAt(0).toUpperCase() + data.status?.slice(1) || "New",
            paymentStatus: paymentData.status || "Pending",
          };
        });

        setBookings(mergedBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const getChipStyle = (color) => ({
    backgroundColor: color + "33",
    color: color,
    fontWeight: 600,
  });

  const columns = [
    { field: "userName", headerName: "Guest Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "roomCount",
      headerName: "No. of Rooms",
      flex: 0.7,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}>
          <Typography>{params.value}</Typography>
        </Box>
      ),
    },
    { field: "checkIn", headerName: "Check In", flex: 0.8 },
    { field: "checkOut", headerName: "Check Out", flex: 0.8 },
    {
      field: "bookingStatus",
      headerName: "Booking Status",
      flex: 1,
      renderCell: (params) => {
        const colors = {
          New: theme.palette.primary.main,
          Pending: theme.palette.warning.main,
          Confirmed: theme.palette.success.main,
          "Checked Out": theme.palette.info.main,
          Cancelled: theme.palette.error.main,
        };
        return <Chip label={params.value} size="small" sx={getChipStyle(colors[params.value] || theme.palette.grey[500])} />;
      },
    },
    {
      field: "paymentStatus",
      headerName: "Payment Status",
      flex: 1,
      renderCell: (params) => {
        const colors = {
          Paid: theme.palette.success.main,
          Pending: theme.palette.warning.main,
          Refunded: theme.palette.info.main,
          Failed: theme.palette.error.main,
        };
        return <Chip label={params.value} size="small" sx={getChipStyle(colors[params.value] || theme.palette.grey[600])} />;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.6,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <Button
            component={Link}
            to={`/bookings/${params.row.id}`}
            size="small"
            color="info"
            variant="outlined"
            sx={{ minWidth: "auto", p: 0.5, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <VisibilityIcon fontSize="small" />
          </Button>
        </Box>
      ),
    },
  ];

  const filteredRows = useMemo(() => {
    return bookings.filter((row) => {
      const matchesSearch =
        row.bookingId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.roomNumber?.toString().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus ? row.bookingStatus === filterStatus : true;
      const matchesCategory = filterCategory ? row.category === filterCategory : true;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [bookings, searchQuery, filterStatus, filterCategory]);

  return (
    <Box sx={{ px: 2, py: 3, flexGrow: 1 }}>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <Card sx={{ backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText, borderRadius: 3, boxShadow: 3 }}>
              <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 3 }}>
                <Box sx={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "50%", width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {s.icon}
                </Box>
                <Box sx={{ textAlign: "right", flex: 1, ml: 2 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>{s.label}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold", lineHeight: 1.2 }}>{s.value}</Typography>
                  <Typography variant="body2" sx={{ color: s.change.startsWith("+") ? theme.palette.success.light : theme.palette.error.light, fontWeight: 500 }}>{s.change}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters and Table */}
      <Box sx={{ boxShadow: 3, borderRadius: 3, p: 3, position: "relative" }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "flex-end", alignItems: { xs: "flex-start", sm: "center" }, gap: 2, mb: 3, flexWrap: "wrap" }}>
          <TextField size="small" label="Search" placeholder="Search by Name, Room No or Email" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ minWidth: { xs: "100%", sm: 220 } }} />
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
            <InputLabel>Status</InputLabel>
            <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
            <InputLabel>Category</InputLabel>
            <Select value={filterCategory} label="Category" onChange={(e) => setFilterCategory(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        <Customdatagriddesktop
          rows={filteredRows}
          columns={columns}
          pageSizeOptions={[5, 10, 20]}
          defaultPageSize={10}
          getRowId={(row) => row.id}
        />

        {loading && (
          <Box sx={{ position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.6)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading data...</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Bookings;
