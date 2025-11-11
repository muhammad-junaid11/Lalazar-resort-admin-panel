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
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Dashboard from "./Dashboard/Dashboard";
import Bookings from "./Dashboard/DashboardPages/Bookings";
import GuestDetails from "./Dashboard/DashboardPages/Guestdetails";
import Rooms from "./Dashboard/DashboardPages/Rooms";
import AddRoom from "./Dashboard/DashboardPages/Addroom";
import RoomDetails from "./Dashboard/DashboardPages/Roomdetails";
import DashboardLayoutpage from "./Dashboard/Dashboadlayout/DashboardLayoutpage";
import "react-big-calendar/lib/css/react-big-calendar.css";
import RoomCategories from "./Dashboard/DashboardPages/RoomCategories";
import AddEditCategory from "./Dashboard/DashboardPages/AddEditCategory";

function AppContent() {
  const theme = useTheme();

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
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Dashboard Routes */}
        <Route path="/" element={<DashboardLayoutpage />}>
          {/* Dashboard Overview */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* Bookings */}
          <Route path="bookings" element={<Bookings />} />
          <Route path="bookings/:id" element={<GuestDetails />} />

          {/* Rooms */}
          <Route path="rooms" element={<Rooms />} />
          <Route path="rooms/add" element={<AddRoom />} />
          <Route path="rooms/:roomId" element={<RoomDetails />} />
          <Route path="rooms/:roomId/add" element={<AddRoom />} />
          <Route path="rooms/:roomId/edit" element={<AddRoom />} />

          {/* ✅ Room Categories (now inside layout) */}
          <Route path="rooms-categories" element={<RoomCategories />} />
          <Route path="rooms-categories/add" element={<AddEditCategory />} />
          <Route path="rooms-categories/:id" element={<AddEditCategory />} />
        </Route>

        {/* Catch-all */}
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
