import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchBookingsForUI,
  fetchBookingByIdForUI,
} from "../../../services/BookingService";
import { setBookingsRealtime } from "./BookingSlice";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../FirebaseFireStore/Firebase";


export const fetchBookings = createAsyncThunk(
  "booking/fetchBookings",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchBookingsForUI();
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.message || "Failed to fetch bookings"
      );
    }
  }
);


export const fetchBookingDetailsById = createAsyncThunk(
  "booking/fetchBookingDetailsById",
  async (bookingId, { rejectWithValue }) => {
    try {
      const data = await fetchBookingByIdForUI(bookingId);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.message || "Failed to fetch booking details"
      );
    }
  }
);

export const startBookingsRealtime = () => (dispatch) => {
  const ref = collection(db, "bookings");

  const unsubscribe = onSnapshot(ref, async () => {
    const updatedBookings = await fetchBookingsForUI();
    dispatch(setBookingsRealtime(updatedBookings));
  });

  return unsubscribe;
};