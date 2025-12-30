import { createSlice } from "@reduxjs/toolkit";
import { fetchBookings, fetchBookingDetailsById } from "./BookingThunk";

const initialState = {
  bookings: [],
  pendingBookings: [], 
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
      state.pendingBookings = action.payload.filter(
        (b) => b.bookingStatus?.toLowerCase() === "pending"
      );
      state.pendingCount = state.pendingBookings.length;
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.bookings = action.payload;


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

export const { setBookingsRealtime } = BookingSlice.actions;

export default BookingSlice.reducer;
