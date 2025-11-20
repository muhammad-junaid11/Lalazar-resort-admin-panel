import React, { useEffect } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  Chip,  // Added import for Chip
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import HolidayVillageIcon from "@mui/icons-material/HolidayVillage";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BookIcon from "@mui/icons-material/Book";
import PaymentIcon from "@mui/icons-material/Payment";
import PeopleIcon from "@mui/icons-material/People";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../FirebaseFireStore/Firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { onSnapshot, collection } from "firebase/firestore";
import {
  setPendingBookings,
  setLoading,
  setError,
} from "../../redux/features/bookings/BookingSlice";
import { db } from "../../FirebaseFireStore/Firebase";

const drawerWidth = 240;

const DashboardLayoutpage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isLgUp = useMediaQuery(theme.breakpoints.up("lg"));
  const [drawerOpen, setDrawerOpen] = React.useState(isLgUp);

  // --- Redux hooks MUST be inside component ---
  const dispatch = useDispatch();
  const { pendingCount } = useSelector((state) => state.booking);

  // ===== Auth Redirect =====
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) navigate("/login", { replace: true });
    });
    return () => unsubscribe();
  }, [navigate]);

  // ===== Pending Bookings Snapshot =====
  useEffect(() => {
    dispatch(setLoading());

    const unsubscribe = onSnapshot(
      collection(db, "bookings"),
      (snapshot) => {
        const bookings = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const pending = bookings.filter(
          (b) => b.status?.toLowerCase() === "pending"
        );

        dispatch(setPendingBookings(pending));
      },
      (error) => {
        dispatch(setError(error.message));
      }
    );

    return () => unsubscribe();
  }, [dispatch]);

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Bookings", icon: <BookIcon />, path: "/bookings" },
    { text: "Payments", icon: <PaymentIcon />, path: "/payments" },
    { text: "Rooms", icon: <HolidayVillageIcon />, path: "/rooms" },
    { text: "Room Categories", icon: <HomeWorkIcon />, path: "/rooms-categories" },
    { text: "Users", icon: <PeopleIcon />, path: "/users" },
  ];

  const toggleDrawer = () => setDrawerOpen((prev) => !prev);

  const handleLogout = async () => {
    await signOut(auth);
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  const getFirstPathSegment = (path) => path.split("/")[1] || "";
  const currentSegment = getFirstPathSegment(location.pathname);

  return (
    <Box sx={{ display: "flex", width: "100%" }}>
      {/* ===== App Bar ===== */}
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          zIndex: (t) => t.zIndex.drawer + 1,
          boxShadow: 2,
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={toggleDrawer} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ fontWeight: "bold" }}>
            Lalazar Resort
          </Typography>
        </Toolbar>
      </AppBar>

      {/* ===== Drawer ===== */}
      <Drawer
        variant={isLgUp ? "persistent" : "temporary"}
        open={drawerOpen}
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            backgroundColor: "#fff",
            color: theme.palette.text.primary,
            borderRight: `1px solid ${theme.palette.grey[300]}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          },
        }}
      >
        <Box>
          <Toolbar />
          <List>
            {menuItems.map((item) => {
              const itemSegment = getFirstPathSegment(item.path);
              const isActive = itemSegment === currentSegment;

              return (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    onClick={() => {
                      navigate(item.path);
                      if (!isLgUp) toggleDrawer();
                    }}
                    sx={{
                      borderRadius: 1,
                      mx: 1,
                      backgroundColor: isActive
                        ? theme.palette.primary.main + "10"
                        : "transparent",
                      "&:hover": {
                        backgroundColor: theme.palette.primary.main + "05",
                      },
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        color: isActive
                          ? theme.palette.primary.main
                          : theme.palette.text.secondary,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between", // Justify between: text on left, number on right
                            width: "100%",
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: isActive ? 600 : 400,
                              color: isActive
                                ? theme.palette.primary.main
                                : theme.palette.text.primary,
                            }}
                          >
                            {item.text}
                          </Typography>
                          {/* Conditionally add a Chip with just the number, styled like StatusChip for "Pending" */}
                          {item.text === "Bookings" && pendingCount > 0 && (
                            <Chip
                              label={pendingCount} // Only the number
                              size="small"
                              sx={{
                                backgroundColor: theme.palette.warning.main + "33", // Semi-transparent like StatusChip for "Pending"
                                color: theme.palette.warning.main, // Color for "Pending" status
                                fontWeight: 600,
                                ml: 1, // Small margin if needed
                              }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleLogout}
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              borderRadius: 2,
              boxShadow: 2,
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Log Out
          </Button>
        </Box>
      </Drawer>

      {/* ===== MAIN CONTENT ===== */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          mt: "64px",
          ml: { lg: drawerOpen ? `${drawerWidth}px` : 0 },
          transition: "margin 0.3s ease",
          bgcolor: theme.palette.grey[50],
          minHeight: "100vh",
          overflowX: "hidden",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayoutpage;
