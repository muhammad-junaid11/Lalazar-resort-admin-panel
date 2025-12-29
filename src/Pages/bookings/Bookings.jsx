import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  Button,
} from "@mui/material";
import { Link } from "react-router-dom";

import Customdatagriddesktop from "../../Components/Customdatagriddesktop";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HotelIcon from "@mui/icons-material/Hotel";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import StatusChip from "../../Components/StatusChip";
import FormattedDate from "../../Components/FormattedDate";

import { useForm } from "react-hook-form";
import Textfieldinput from "../../Components/Forms/Textfieldinput";
import Selectinput from "../../Components/Forms/Selectinput";

import { useSelector } from "react-redux";
import { fetchAllCategories } from "../../services/CategoryService";

const statuses = ["Pending", "Confirmed", "Cancelled"];

const stats = [
  { label: "Active Bookings", value: "85%", change: "+5%", icon: <HotelIcon sx={{ fontSize: 32, color: "#fff" }} /> },
  { label: "Room Occupancy", value: "65%", change: "-10%", icon: <MeetingRoomIcon sx={{ fontSize: 32, color: "#fff" }} /> },
  { label: "Guest Satisfaction", value: "6.0/10", change: "-4%", icon: <EmojiEmotionsIcon sx={{ fontSize: 32, color: "#fff" }} /> },
  { label: "Revenue Growth", value: "12%", change: "+8%", icon: <TrendingUpIcon sx={{ fontSize: 32, color: "#fff" }} /> },
];

const Bookings = () => {
  const theme = useTheme();

  // Get bookings directly from Redux - payment status is now calculated correctly in the service
  const { bookings, loading: reduxLoading } = useSelector((state) => state.booking);

  const [categories, setCategories] = useState([]);

  const { control, watch } = useForm({
    defaultValues: { search: "", status: "", category: "" },
  });

  const searchQuery = watch("search");
  const filterStatus = watch("status");
  const filterCategory = watch("category");

  // Fetch categories
  useEffect(() => {
    const getCategories = async () => {
      try {
        const data = await fetchAllCategories();
        setCategories(data);
      } catch (err) { 
        console.error("Failed to fetch categories", err); 
      }
    };
    getCategories();
  }, []);

  // Map bookings with category IDs - no need to sync or re-fetch
  const mappedBookings = useMemo(() => {
    return bookings.map((b) => {
      const cat = categories.find((c) => c.categoryName === b.category);
      return { ...b, categoryId: cat ? cat.id : null };
    });
  }, [bookings, categories]);

  const columns = [
    { field: "userName", headerName: "Guest Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "roomCount", headerName: "No. of Rooms", flex: 0.7, headerAlign: "center", align: "center" },
    { field: "checkIn", headerName: "Check In", flex: 0.8, renderCell: (params) => <FormattedDate value={params.value} type="date" /> },
    { field: "checkOut", headerName: "Check Out", flex: 0.8, renderCell: (params) => <FormattedDate value={params.value} type="date" /> },
    { field: "bookingStatus", headerName: "Booking Status", flex: 1, renderCell: (params) => <StatusChip label={params.value} /> },
    { field: "paymentStatus", headerName: "Payment Status", flex: 1, renderCell: (params) => <StatusChip label={params.value} isPayment /> },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.6,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Button 
          component={Link} 
          to={`/bookings/${params.row.id}`} 
          size="small" 
          color="info" 
          variant="outlined" 
          sx={{ minWidth: "auto", p: 0.5 }}
        >
          <VisibilityIcon fontSize="small" />
        </Button>
      ),
    },
  ];

  const filteredRows = useMemo(() => {
    return mappedBookings.filter((row) => {
      const matchesSearch =
        row.bookingId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.roomNumber?.toString().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus ? row.bookingStatus === filterStatus : true;
      const matchesCategory = filterCategory ? row.categoryId === filterCategory : true;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [mappedBookings, searchQuery, filterStatus, filterCategory]);

  return (
    <Box sx={{ px: 2, py: 3, flexGrow: 1 }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((s) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={s.label}>
            <Card sx={{ 
              backgroundColor: theme.palette.primary.main, 
              color: theme.palette.primary.contrastText, 
              borderRadius: 3, 
              boxShadow: 3 
            }}>
              <CardContent sx={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between", 
                p: 3 
              }}>
                <Box sx={{ 
                  backgroundColor: "rgba(255,255,255,0.2)", 
                  borderRadius: "50%", 
                  width: 64, 
                  height: 64, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}>
                  {s.icon}
                </Box>
                <Box sx={{ textAlign: "right", flex: 1, ml: 2 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {s.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold", lineHeight: 1.2 }}>
                    {s.value}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: s.change.startsWith("+") 
                        ? theme.palette.success.light 
                        : theme.palette.error.light, 
                      fontWeight: 500 
                    }}
                  >
                    {s.change}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ boxShadow: 3, borderRadius: 3, p: 3 }}>
        <Box sx={{ 
          display: "flex", 
          flexDirection: { xs: "column", sm: "row" }, 
          justifyContent: "flex-end", 
          alignItems: { xs: "flex-start", sm: "center" }, 
          gap: 2, 
          mb: 3, 
          flexWrap: "wrap" 
        }}>
          <Textfieldinput 
            name="search" 
            control={control} 
            label="Search" 
            placeholder="Search by Name, Room No or Email" 
            fullWidth={false} 
            sx={{ minWidth: { xs: "100%", sm: 220 } }} 
          />
          <Selectinput 
            name="status" 
            control={control} 
            label="Status" 
            options={[
              { label: "All", value: "" }, 
              ...statuses.map((s) => ({ label: s, value: s }))
            ]} 
            sx={{ minWidth: { xs: "100%", sm: 180 } }} 
          />
          <Selectinput 
            name="category" 
            control={control} 
            label="Category" 
            options={[
              { label: "All", value: "" }, 
              ...categories.map((c) => ({ label: c.categoryName, value: c.id }))
            ]} 
            sx={{ minWidth: { xs: "100%", sm: 180 } }} 
          />
        </Box>

        <Box sx={{ position: "relative" }}>
          <Customdatagriddesktop
            rows={filteredRows}
            columns={columns}
            pageSizeOptions={[5, 10, 20]}
            defaultPageSize={10}
            getRowId={(row) => row.id}
            loading={reduxLoading}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Bookings;