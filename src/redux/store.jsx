// src/redux/store.jsx
import { configureStore } from "@reduxjs/toolkit";
import bookingReducer from "./features/bookings/BookingSlice";


export const store = configureStore({
  reducer: {
    booking: bookingReducer,
  },
});
