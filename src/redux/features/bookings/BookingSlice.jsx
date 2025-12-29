import { createSlice } from "@reduxjs/toolkit";
import { fetchBookings, fetchBookingDetailsById } from "./BookingThunk";

const initialState = {
  bookings: [],
  pendingBookings: [],   // keep track of pending bookings separately
  bookingDetails: null,
  pendingCount: 0,
  loading: false,
  error: null,
};

const BookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    setBookingsRealtime: (state, action) => {
      state.bookings = action.payload;
      // Filter pending bookings
      state.pendingBookings = action.payload.filter(
        (b) => b.bookingStatus?.toLowerCase() === "pending"
      );
      state.pendingCount = state.pendingBookings.length;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Bookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.bookings = action.payload;

        // Filter pending bookings (old working logic)
        state.pendingBookings = action.payload.filter(
          (b) => b.bookingStatus?.toLowerCase() === "pending"
        );
        state.pendingCount = state.pendingBookings.length;

        state.loading = false;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // Fetch Booking Details by ID
      .addCase(fetchBookingDetailsById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingDetailsById.fulfilled, (state, action) => {
        state.bookingDetails = action.payload;
        state.loading = false;
      })
      .addCase(fetchBookingDetailsById.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

// Export action for realtime updates
export const { setBookingsRealtime } = BookingSlice.actions;

export default BookingSlice.reducer;
