import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, CssBaseline, useTheme } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import theme from "./Theme/theme";
import Login from "./Pages/auth/Login";
import Signup from "./Pages/auth/Signup";
import Dashboard from "./Pages/dashboard/Dashboard";
import BookingDetails from "./Pages/bookings/BookingDetails";
import Rooms from "./Pages/rooms/Rooms";
import AddRoom from "./Pages/rooms/Addroom";
import Payment from "./Pages/payments/Payment";
import RoomDetails from "./Pages/rooms/Roomdetails";
import DashboardLayoutpage from "./Components/Dashboadlayout/DashboardLayoutpage";
import "react-big-calendar/lib/css/react-big-calendar.css";
import RoomCategories from "./Pages/roomcategory/RoomCategories";
import AddEditCategory from "./Pages/roomcategory/AddEditCategory";
import PaymentDetails from "./Pages/payments/PaymentDetails";
import { fetchBookings, startBookingsRealtime } from "./redux/features/bookings/BookingThunk";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import Users from "./Pages/users/Users";
import UserDetails from "./Pages/users/UserDetails";
import EditUser from "./Pages/users/EditUser";
import Bookings from "./Pages/bookings/Bookings";

function AppContent() {
  const theme = useTheme();
  const dispatch = useDispatch();

useEffect(() => {
  // 1️⃣ initial fetch
  dispatch(fetchBookings());

  // 2️⃣ start realtime listener
  const unsubscribe = dispatch(startBookingsRealtime());

  // 3️⃣ cleanup on unmount
  return () => {
    if (unsubscribe) unsubscribe();
  };
}, [dispatch]);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar
        theme="colored"
        toastStyle={{
          backgroundColor: theme.palette.primary.main,
          color: "#fff",
        }}
      />

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/" element={<DashboardLayoutpage />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="bookings/:id" element={<BookingDetails />} />
          <Route path="payments" element={<Payment />} />
          <Route path="payments/:id" element={<PaymentDetails />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="rooms/add" element={<AddRoom />} />
          <Route path="rooms/:roomId" element={<RoomDetails />} />
          <Route path="rooms/:roomId/add" element={<AddRoom />} />
          <Route path="rooms/:roomId/edit" element={<AddRoom />} />
          <Route path="rooms-categories" element={<RoomCategories />} />
          <Route path="rooms-categories/add" element={<AddEditCategory />} />
          <Route path="rooms-categories/:id" element={<AddEditCategory />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:userId" element={<UserDetails />} />
          <Route path="users/:userId/edit" element={<EditUser />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;