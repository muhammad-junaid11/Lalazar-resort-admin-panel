import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  MenuItem,
  Button,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchUserById, updateUser } from "../../services/UserService";
import Textfieldinput from "../../Components/Forms/Textfieldinput";

const genders = ["male", "female", "other"];

const EditUser = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { userId } = useParams();
  const location = useLocation();

  const isEditMode = location.pathname.includes("/edit") && userId !== "0";

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  const { handleSubmit, control, reset } = useForm({
    defaultValues: {
      userName: "",
      email: "",
      phone: "",
      gender: "",
      dob: "",
      address: "",
    },
  });

  // Prefill user data
  useEffect(() => {
    if (!isEditMode) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const user = await fetchUserById(userId);
        if (!user) {
          toast.error("User not found");
          navigate("/users");
          return;
        }

        reset({
          userName: user.userName || "",
          email: user.email || "",
          phone: user.phone || "",
          gender: user.gender || "",
          dob: user.dob
            ? new Date(user.dob).toISOString().split("T")[0]
            : "",
          address: user.address || "",
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch user data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isEditMode, userId, navigate, reset]);

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      await updateUser(userId, {
        userName: data.userName,
        userEmail: data.email,
        number: data.phone,
        dob: data.dob ? new Date(data.dob) : null,
        gender: data.gender,
        address: data.address,
      });
      toast.success("User updated successfully");
      navigate("/users");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ py: 2 }}>
      <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid
              container
              justifyContent="space-between"
              alignItems="center"
              mb={2}
              spacing={2}
            >
              <Grid item>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color={theme.palette.primary.main}
                >
                  Edit User
                </Typography>
              </Grid>
              <Grid item>
                <Button type="submit" variant="contained" disabled={saving}>
                  {saving ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{xs:12,md:6}}>
                <Textfieldinput name="userName" control={control} label="Name" />
              </Grid>
              <Grid size={{xs:12,md:6}}>
                <Textfieldinput
                  name="email"
                  control={control}
                  label="Email"
                  type="email"
                />
              </Grid>
              <Grid size={{xs:12,md:6}}>
                <Textfieldinput
                  name="phone"
                  control={control}
                  label="Phone"
                  type="text"
                />
              </Grid>
              <Grid size={{xs:12,md:6}}>
                <Textfieldinput
                  name="dob"
                  control={control}
                  label="Date of Birth"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{xs:12,md:6}}>
                <Textfieldinput name="gender" control={control} label="Gender" select>
                  {genders.map((g) => (
                    <MenuItem key={g} value={g}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </MenuItem>
                  ))}
                </Textfieldinput>
              </Grid>
              <Grid size={{xs:12,md:6}}>
                <Textfieldinput name="address" control={control} label="Address" />
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EditUser;
