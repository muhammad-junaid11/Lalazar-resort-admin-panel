// src/Dashboard/DashboardPages/RoomDetails.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
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

import KeyValueBlock from "../../Components/KeyValueBlock";
import HeaderSection from "../../Components/HeaderSection";
import LoadingOverlay from "../../Components/LoadingOverlay";
import StatusChip from "../../Components/StatusChip";

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
          where("roomId", "array-contains", roomId),
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
            userMap[doc.id] = userData.userName || userData.fullName || "Guest";
          });
        }

        const calendarEvents = rawBookings
          .map((d) => {
            const checkIn = d.checkInDate?.toDate?.() || null;
            const checkOut = d.checkOutDate?.toDate?.() || null;
            if (!checkIn || !checkOut) return null;

            const userName = userMap[d.userId] || "Guest";
            const title = `Booking by ${userName}`;

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

  return (
    <Box sx={{ flexGrow: 1, mt: 0, mb: 0, py: 1, position: "relative" }}>
      <LoadingOverlay
        loading={loading}
        message="Loading room details..."
        fullScreen={true}
      />

      {room ? (
        <Card sx={{ borderRadius: 3, boxShadow: 4, mb: 4 }}>
          <CardContent
            sx={{ px: { xs: 2, sm: 4, md: 6 }, position: "relative" }}
          >
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

            <HeaderSection title="Room Overview" />
            <Grid container sx={{ px: 0.5 }} spacing={2}>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="Room Number" value={room.roomNumber} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="Hotel Name" value={room.hotelName} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="Category" value={room.category} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="Price (PKR)" value={room.price} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="Property Type" value={room.propertyType} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="Current Status" value={room.status} />
              </Grid>
            </Grid>

            <HeaderSection title="Room Booking Calendar" />
            <Box
              sx={{
                height: 600,
                mt: 2,
                position: "relative",
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
                overflow: "hidden",
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
      ) : (
        !loading && (
          <Typography
            variant="h6"
            sx={{ textAlign: "center", mt: 5, color: "text.secondary" }}
          >
            Room not found
          </Typography>
        )
      )}
    </Box>
  );
};

export default RoomDetails;
