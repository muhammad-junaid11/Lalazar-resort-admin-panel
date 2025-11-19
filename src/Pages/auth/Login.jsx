import React, { useState } from "react";
import Authlayout from "../../Components/Authlayout.jsx";
import {
  Box,
  Button,
  Typography,
  Link,
  CircularProgress,
  Divider,
  useTheme, 
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Textfieldinput from "../../Components/Forms/Textfieldinput.jsx";
import { auth, db } from "../../FirebaseFireStore/Firebase.jsx";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import TravelExploreIcon from '@mui/icons-material/TravelExplore';

const Login = () => {
  const theme = useTheme(); 

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    const { email, password } = data;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docRef = doc(db, "adminUsers", user.uid);
      const docSnap = await getDoc(docRef);

      let fullName = "User";
      if (docSnap.exists()) {
        fullName = docSnap.data().fullName;
      }

      toast.success(`Welcome, ${fullName}!`);
      navigate("/dashboard", { state: { fullName } });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Authlayout>
      {/* Main Heading */}
      <Typography
        variant="h4"
        component="h1"
        fontWeight="bold"
        gutterBottom
        sx={{ mb: 1.5, color: theme.palette.text.primary }}
      >
        Sign In
      </Typography>

 
      <Typography
        variant="body1"
        sx={{ mb: 4, color: theme.palette.text.secondary }} 
      >
        Welcome! Please enter details to Sign In.
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold', color: theme.palette.text.primary }}>
          Email
        </Typography>
        <Textfieldinput
          name="email"
          label="" 
          control={control}
          rules={{
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Invalid email format",
            },
          }}
          sx={{ mb: 2 }}
        />

        {/* Password Label and Input */}
        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold', color: theme.palette.text.primary }}>
          Password
        </Typography>
        <Textfieldinput
          name="password"
          label="" 
          type="password"
          control={control}
          rules={{
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Minimum 6 characters required",
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
              Signing In...
            </>
          ) : (
            "SIGN IN"
          )}
        </Button>
      </Box>

      {/* "OR" Divider */}
      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>

      {/* New User Prompt */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          borderRadius: 1,
          bgcolor: 'transparent',
          border: `1px solid ${theme.palette.grey[300]}`,
          boxShadow: `0 2px 5px ${theme.palette.grey[200]}`,
          mt: 2,
        }}
      >
        <TravelExploreIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
        <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
          New user?{" "}
          <Link
            component={RouterLink}
            to="/signup"
            underline="none"
            fontWeight="bold"
            sx={{ color: theme.palette.primary.main }}
          >
            Sign Up
          </Link>{" "}
          for exclusive travel deals!
        </Typography>
      </Box>
    </Authlayout>
  );
};

export default Login;