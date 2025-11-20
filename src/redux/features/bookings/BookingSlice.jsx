import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  pendingBookings: [],
  pendingCount: 0,
  loading: true,
  error: null,
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    setPendingBookings: (state, action) => {
      state.pendingBookings = action.payload;
      state.pendingCount = action.payload.length;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state) => {
      state.loading = true;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setPendingBookings, setLoading, setError } = bookingSlice.actions;
export default bookingSlice.reducer;
