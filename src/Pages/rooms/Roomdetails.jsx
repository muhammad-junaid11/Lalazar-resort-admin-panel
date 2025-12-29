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
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addDays,
} from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

import KeyValueBlock from "../../Components/KeyValueBlock";
import HeaderSection from "../../Components/HeaderSection";
import LoadingOverlay from "../../Components/LoadingOverlay";
import StatusChip from "../../Components/StatusChip";
import { fetchRoomBookings, fetchRoomById } from "../../services/RoomService";

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
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month");
  const [bookings, setBookings] = useState([]);

  // ================= Fetch room =================
  useEffect(() => {
    const loadRoom = async () => {
      setLoading(true);
      try {
        const data = await fetchRoomById(roomId);
        setRoom(data);
      } catch (err) {
        console.error("Failed to fetch room details", err);
        setRoom(null);
      } finally {
        setLoading(false);
      }
    };

    if (roomId) loadRoom();
  }, [roomId]);

  // ================= Fetch room bookings =================
  // ================= Fetch room bookings =================
// ================= Fetch room bookings =================
useEffect(() => {
  const loadBookings = async () => {
    if (!roomId) return;

    try {
      const data = await fetchRoomBookings(roomId);

      // ✅ Format events properly for the calendar
      const calendarEvents = data.map((b) => {
        // Ensure dates are valid Date objects
        const startDate = b.start instanceof Date ? b.start : new Date(b.start);
        const endDate = b.end instanceof Date ? b.end : new Date(b.end);

        // ✅ FIX: Don't add extra day - the checkout date is already the last day of stay
        // For hotel bookings, if someone books Dec 2-5, they occupy the room on Dec 2,3,4,5
        // and check out on Dec 5, so we don't need to add an extra day
        
        return {
          id: b.id,
          title: `Booked by ${b.userName}`, // ✅ Show "Booked by [userName]"
          start: startDate,
          end: endDate, // No adjustment needed
          allDay: true,
          resource: {
            status: b.status,
            guestName: b.guestName,
            userName: b.userName,
          },
        };
      });

      console.log("Calendar events:", calendarEvents); // Debug log
      setBookings(calendarEvents);
    } catch (err) {
      console.error("Failed to load room bookings", err);
      setBookings([]);
    }
  };

  loadBookings();
}, [roomId]);

  // ✅ Custom event style getter for better visibility
  const eventStyleGetter = (event) => {
    const backgroundColor = event.resource?.status === "CheckedIn" 
      ? theme.palette.success.main 
      : theme.palette.primary.main;

    return {
      style: {
        backgroundColor,
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
        fontWeight: 500,
        padding: "2px 6px",
      },
    };
  };

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
            sx={{
              px: { xs: 2, sm: 4, md: 6 },
              position: "relative",
            }}
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
                sx={{
                  fontWeight: "bold",
                  color: theme.palette.primary.main,
                }}
              >
                Room Details: #{room.roomNo}
              </Typography>
              <StatusChip label={room.status} />
            </Box>

            <HeaderSection title="Room Overview" />

            <Grid container spacing={2} sx={{ px: 0.5 }}>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="Room Number" value={room.roomNo} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="Hotel Name" value={room.hotelName} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="Category" value={room.categoryName} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="Price (PKR)" value={room.price} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock
                  label="Property Type"
                  value={room.propertyType}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="Current Status" value={room.status} />
              </Grid>
            </Grid>

            <HeaderSection title="Room Booking Calendar" />

            {/* ✅ Show booking count */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {bookings.length} confirmed booking{bookings.length !== 1 ? "s" : ""} found
            </Typography>

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
                  padding: "8px",
                },
                "& .rbc-toolbar button": {
                  color: theme.palette.common.white,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: "4px",
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
                  padding: "2px 6px",
                },
                "& .rbc-today": {
                  backgroundColor: theme.palette.action.hover,
                },
                "& .rbc-month-view, & .rbc-time-view": {
                  border: `1px solid ${theme.palette.divider}`,
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
                eventPropGetter={eventStyleGetter}
                style={{ height: "100%" }}
                messages={{
                  noEventsInRange: "No confirmed bookings for this room",
                  agenda: "Bookings",
                }}
                tooltipAccessor={(event) => 
                  `${event.resource.guestName} - ${event.resource.status}`
                }
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