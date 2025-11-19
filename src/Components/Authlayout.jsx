import { Grid, Box } from "@mui/material";
import React from "react";
import Features from "./Features";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import HotelIcon from "@mui/icons-material/Hotel";
import StarIcon from "@mui/icons-material/Star";
import beach from "../assets/beach.jpg";

const cardStyles = {
  p: 2,
  my: 2.5,
  borderRadius: 2,
  width: "80%",
  maxWidth: 400,
  mx: "auto",
  backdropFilter: "blur(10px)",
  bgcolor: "rgba(255, 255, 255, 0.45)",
  boxShadow: "0 4px 12px 0 rgba(31, 38, 135, 0.2)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  zIndex: 1,
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  minHeight: 120,
};

const Authlayout = ({ children }) => {
  return (
    <Grid
      container
      sx={{
        minHeight: "100vh",
        flexWrap: "nowrap",
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "stretch",
      }}
    >
      {/* LEFT SIDE (Visual section) */}
      <Grid
        item
        md={6}
        sx={{
          flexBasis: "50%",
          maxWidth: "50%",
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          backgroundImage: `url(${beach})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          p: 6,
          position: "relative",
          color: "white",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        <Box mb={6} sx={{ zIndex: 1, position: "relative" }}>
          <img
            src="/logo.jpg"
            alt="logo"
            style={{
              height: 80,
              filter: "drop-shadow(0 0 5px rgba(0,0,0,0.5))",
            }}
          />
        </Box>

        {/* Feature cards */}
        <Box sx={cardStyles}>
          <Features
            icon={<BeachAccessIcon sx={{ fontSize: 28, color: "white" }} />}
            title="Effortless Booking"
            subtitle="Plan your dream vacation in minutes with a smooth, stress-free booking experience that feels effortless."
          />
        </Box>

        <Box sx={cardStyles}>
          <Features
            icon={<HotelIcon sx={{ fontSize: 28, color: "white" }} />}
            title="Luxurious Retreats"
            subtitle="Enjoy premium, handpicked resorts offering world-class hospitality, comfort, and luxury for every perfect traveler."
          />
        </Box>

        <Box sx={cardStyles}>
          <Features
            icon={<StarIcon sx={{ fontSize: 28, color: "white" }} />}
            title="Personalized Experience"
            subtitle="Discover resorts tailored to your budget and preferences for an unforgettable getaway."
          />
        </Box>
      </Grid>

      {/* RIGHT SIDE (Form section) */}
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          flexBasis: { xs: "100%", md: "50%" },
          maxWidth: { xs: "100%", md: "50%" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#ffffff",
          p: { xs: 5, sm: 4, md: 6 }, // small but visible padding on xs/sm
          overflowY: "auto",
        }}
      >
        <Box
          width="100%"
          maxWidth={{ xs: "100%", sm: 420, md: 480 }}
          mx="auto"
          sx={{
            transition: "none",
          }}
        >
          {children}
        </Box>
      </Grid>
    </Grid>
  );
};

export default Authlayout;
