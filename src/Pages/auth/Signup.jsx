import React, { useState } from "react";
import Authlayout from "../../Components/Authlayout.jsx";
import {
  Box,
  Button,
  Typography,
  Link,
  CircularProgress,
  useTheme, // ⬅️ NEW: Import useTheme
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Textfieldinput from "../../Components/Forms/Textfieldinput.jsx";
import { auth, db } from "../../FirebaseFireStore/Firebase.jsx";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const Signup = () => {
  const theme = useTheme(); // ⬅️ Access the theme palette

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    const { fullName, email, password } = data;
    try {
      // 1️⃣ Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2️⃣ Store extra info in Firestore
      await setDoc(doc(db, "adminUsers", user.uid), {
  fullName,
  email,
  createdAt: new Date(),
});

      // 3️⃣ Show toast and redirect
      toast.success("Account created successfully!");
      navigate("/login");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Authlayout>
      {/* 1. Main Heading */}
      <Typography
        variant="h4"
        component="h1"
        fontWeight="bold"
        gutterBottom
        // ⬇️ Use theme text color
        sx={{ mb: 1.5, color: theme.palette.text.primary }}
      >
        Sign Up
      </Typography>


      <Typography
        variant="body1"
        sx={{ mb: 4, color: theme.palette.text.secondary }}
      >
        Join now for exclusive access to travel deals!
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold', color: theme.palette.text.primary }}>
          Full Name
        </Typography>
        <Textfieldinput
          name="fullName"
          label="" 
          control={control}
          rules={{
            required: "Full Name is required",
            minLength: {
              value: 2,
              message: "Name must be at least 2 characters",
            },
          }}
          sx={{ mb: 2 }}
        />


        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold', color: theme.palette.text.primary }}>
          Email
        </Typography>
        <Textfieldinput
          name="email"
          label="" 
          control={control}
          type="email"
          rules={{
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Invalid email format",
            },
          }}
          sx={{ mb: 2 }}
        />


        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold', color: theme.palette.text.primary }}>
          Password
        </Typography>
        <Textfieldinput
          name="password"
          label="" 
          control={control}
          type="password"
          rules={{
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
          }}
          sx={{ mb: 4 }}
        />

        <Button
          variant="contained"
          fullWidth
          type="submit"
          sx={{
            mt: 0,
            height: 48,
            fontSize: '1.1rem',
            bgcolor: theme.palette.primary.main, 
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
            color: theme.palette.primary.contrastText,
            boxShadow: `0px 4px 10px ${theme.palette.primary.main}33`, 
          }}
          disabled={loading}
        >
          {loading ? (
            <>
              <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
              Creating...
            </>
          ) : (
            "CREATE ACCOUNT"
          )}
        </Button>
      </Box>


      <Typography variant="body2" textAlign="center" sx={{ mt: 3, color: theme.palette.text.secondary }}>
        Already have an account?{" "}
        <Link
          component={RouterLink}
          to="/login"
          underline="none"
          fontWeight="bold"
          sx={{ color: theme.palette.primary.main }}
        >
          Sign In
        </Link>
      </Typography>
    </Authlayout>
  );
};

export default Signup;