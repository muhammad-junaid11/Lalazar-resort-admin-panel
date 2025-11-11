// src/Dashboard/DashboardPages/RoomDetails.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  documentId,
} from "firebase/firestore";
import { db } from "../../FirebaseFireStore/Firebase";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const RoomDetails = () => {
  const { roomId } = useParams();
  const theme = useTheme();

  const [room, setRoom] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month");

  useEffect(() => {
    const fetchRoomAndBookings = async () => {
      try {
        const roomRef = doc(db, "rooms", roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
          setRoom(null);
          setLoading(false);
          return;
        }

        const roomData = { id: roomSnap.id, ...roomSnap.data() };

        const [hotelSnap, categorySnap] = await Promise.all([
          roomData.hotelId
            ? getDoc(doc(db, "hotel", roomData.hotelId))
            : Promise.resolve(null),
          roomData.categoryId
            ? getDoc(doc(db, "roomCategory", roomData.categoryId))
            : Promise.resolve(null),
        ]);

        const hotelName = hotelSnap?.exists()
          ? hotelSnap.data().hotelName
          : "Unknown Hotel";
        const categoryName = categorySnap?.exists()
          ? categorySnap.data().categoryName
          : "Unknown Category";

        const mergedRoom = {
          ...roomData,
          hotelName,
          category: categoryName,
          roomNumber: roomData.roomNo,
        };
        setRoom(mergedRoom);

        const bookingQuery = query(
          collection(db, "bookings"),
          where("roomId", "==", roomId),
          where("status", "==", "confirmed")
        );
        const bookingSnap = await getDocs(bookingQuery);

        const rawBookings = bookingSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        const userIds = [
          ...new Set(rawBookings.map((b) => b.userId).filter(Boolean)),
        ];

        let userMap = {};
        if (userIds.length > 0) {
          const chunk = userIds.slice(0, 10);
          const usersQuery = query(
            collection(db, "users"),
            where(documentId(), "in", chunk)
          );
          const usersSnap = await getDocs(usersQuery);

          usersSnap.docs.forEach((doc) => {
            const userData = doc.data();
            userMap[doc.id] =
              userData.userName || userData.fullName || "Guest";
          });
        }

        const calendarEvents = rawBookings
          .map((d) => {
            const checkIn = d.checkInDate?.toDate?.() || null;
            const checkOut = d.checkOutDate?.toDate?.() || null;
            if (!checkIn || !checkOut) return null;

            const userName = userMap[d.userId] || "Guest";
            const title = `Booking #${d.bookingId || d.id.substring(
              0,
              4
            )} by ${userName}`;

            return {
              id: d.id,
              title,
              start: checkIn,
              end: checkOut,
              status: d.status,
            };
          })
          .filter(Boolean);

        setBookings(calendarEvents);
      } catch (err) {
        console.error("Error fetching room/bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomAndBookings();
  }, [roomId]);

  const StatusChip = ({ label }) => {
    const colors = {
      Available: theme.palette.success.main,
      Booked: theme.palette.error.main,
      Maintenance: theme.palette.warning.main,
      Cleaning: theme.palette.info.main,
    };
    const color = colors[label] || theme.palette.grey[500];
    return (
      <Chip
        label={label}
        size="small"
        sx={{
          backgroundColor: color + "33",
          color,
          fontWeight: 600,
          ml: 1,
        }}
      />
    );
  };

  const KeyValueBlock = ({ label, value }) => (
    <Box sx={{ flexBasis: { xs: "100%", sm: "30%" } }}>
      <Typography
        variant="body2"
        sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: "bold" }}>
        {value || "--"}
      </Typography>
    </Box>
  );

  const Row = ({ children }) => (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 5,
      }}
    >
      {children}
    </Box>
  );

  const SectionHeader = ({ title }) => (
    <Box
      sx={{
        backgroundColor: "#F0F9F8",
        px: 2,
        py: 1,
        borderRadius: 1,
        mb: 2,
        mt: 3,
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: "bold", color: theme.palette.primary.main }}
      >
        {title}
      </Typography>
    </Box>
  );

  if (loading)
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2 }}>Loading room details...</Typography>
      </Box>
    );

  if (!room)
    return (
      <Typography
        variant="h6"
        sx={{ textAlign: "center", mt: 5, color: "text.secondary" }}
      >
        Room not found
      </Typography>
    );

  return (
    <Box sx={{ flexGrow: 1, mt: 0, mb: 0, py: 1 }}>
      <Card sx={{ borderRadius: 3, boxShadow: 4, mb: 4 }}>
        <CardContent sx={{ px: { xs: 2, sm: 4, md: 6 } }}>
          <Box
            sx={{
              mb: 3,
              display: "flex",
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", color: theme.palette.primary.main }}
            >
              Room Details: #{room.roomNumber}
            </Typography>
            <StatusChip label={room.status} />
          </Box>

          <SectionHeader title="Room Overview" />
          <Stack spacing={5}>
            <Row>
              <KeyValueBlock label="Room Number" value={room.roomNumber} />
              <KeyValueBlock label="Hotel Name" value={room.hotelName} />
              <KeyValueBlock label="Category" value={room.category} />
            </Row>
            <Row>
              <KeyValueBlock label="Price (PKR)" value={room.price} />
              <KeyValueBlock label="Property Type" value={room.propertyType} />
              <KeyValueBlock label="Current Status" value={room.status} />
            </Row>
          </Stack>

          <SectionHeader title="Room Booking Calendar" />
          <Box
            sx={{
              height: 600,
              mt: 2,
              position: "relative",
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              overflow: "hidden",

              // ✅ Toolbar styling fix
              "& .rbc-toolbar": {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.common.white,
                borderRadius: 1,
                mb: 1,
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
              },
              "& .rbc-toolbar button": {
                color: theme.palette.common.white,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  backgroundColor: theme.palette.grey[300],
                  color: theme.palette.primary.main,
                },
              },
              "& .rbc-toolbar .rbc-active": {
                backgroundColor: theme.palette.grey[300],
                color: theme.palette.primary.main,
                fontWeight: "bold",
              },
              // ✅ Make left buttons (Today, Back, Next) interactive
              "& .rbc-btn-group:first-of-type button:hover": {
                backgroundColor: theme.palette.grey[300],
                color: theme.palette.primary.main,
              },

              "& .rbc-event": {
                backgroundColor: theme.palette.primary.main,
                color: "white",
                borderRadius: "6px",
                border: "none",
                fontWeight: 500,
                padding: "2px 4px",
              },
              "& .rbc-today": {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Calendar
              localizer={localizer}
              events={bookings}
              startAccessor="start"
              endAccessor="end"
              titleAccessor="title"
              views={["month", "week", "day", "agenda"]}
              popup
              date={currentDate}
              view={currentView}
              onNavigate={(date) => setCurrentDate(date)}
              onView={(view) => setCurrentView(view)}
              style={{ height: "100%" }}
              messages={{
                noEventsInRange: "No confirmed bookings for this room",
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RoomDetails;
