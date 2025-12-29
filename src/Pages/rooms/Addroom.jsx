import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  MenuItem,
  Button,
  Card,
  CardContent,
  Grid,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchAllHotels } from "../../services/HotelService";
import { fetchAllCategories } from "../../services/CategoryService";


import Textfieldinput from "../../Components/Forms/Textfieldinput";

// ✅ SERVICES
import {
  addRoom,
  updateRoom,
  fetchRoomById,
} from "../../services/RoomService";

const roomStatuses = ["Available", "Booked", "Maintenance", "Cleaning"];
const propertyTypes = ["Owned", "Partnered"];

const AddRoom = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const location = useLocation();

  const isEditMode = location.pathname.endsWith("/edit") && roomId !== "0";

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [categories, setCategories] = useState([]);

  const { handleSubmit, control, reset } = useForm({
    defaultValues: {
      hotelName: "",
      category: "",
      roomNumber: "",
      price: "",
      status: "",
      propertyType: "",
    },
  });

  /* ================= Dropdown data ================= */
 useEffect(() => {
  const fetchDropdowns = async () => {
    try {
      // Fetch hotels and map to {id, name} array
      const hotelsData = await fetchAllHotels(); // returns {id: hotelName, ...}
      setHotels(
        Object.entries(hotelsData).map(([id, name]) => ({ id, name }))
      );

      // Fetch categories and map to {id, name} array
      const categoriesData = await fetchAllCategories(); // returns [{id, categoryName}]
      setCategories(
        categoriesData.map((c) => ({
          id: c.id,
          name: c.categoryName,
        }))
      );
    } catch (error) {
      console.error("Failed to load dropdowns:", error);
      toast.error("Failed to load hotels or categories");
    }
  };

  fetchDropdowns();
}, []);


  /* ================= Prefill (Edit mode) ================= */
  useEffect(() => {
    if (!isEditMode) {
      setLoading(false);
      return;
    }

    const loadRoom = async () => {
      try {
        const room = await fetchRoomById(roomId);
        if (!room) {
          navigate("/rooms");
          return;
        }

        reset({
          hotelName: room.hotelName || "",
          category: room.categoryName || "",
          roomNumber: room.roomNo || "",
          price: room.price || "",
          status: room.status || "",
          propertyType: room.propertyType || "",
        });
      } catch (err) {
        console.error("Failed to load room", err);
        navigate("/rooms");
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [isEditMode, roomId, navigate, reset]);

  /* ================= Submit ================= */
  const onSubmit = async (formData) => {
    const hotel = hotels.find((h) => h.name === formData.hotelName);
    const category = categories.find((c) => c.name === formData.category);

    if (!hotel || !category) {
      toast.error("Invalid hotel or category");
      return;
    }

    const roomData = {
      hotelId: hotel.id,
      categoryId: category.id,
      roomNo: Number(formData.roomNumber),
      price: Number(formData.price),
      status: formData.status,
      propertyType: formData.propertyType,
    };

    try {
      setSaving(true);

      if (isEditMode) {
        await updateRoom(roomId, roomData);
        toast.success("Room updated successfully");
      } else {
        await addRoom(roomData);
        toast.success("Room added successfully");
      }

      navigate("/rooms");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save room");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

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
            >
              <Typography
                variant="h5"
                fontWeight="bold"
                color={theme.palette.primary.main}
              >
                {isEditMode ? "Edit Room" : "Add Room"}
              </Typography>

              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Save"
                )}
              </Button>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Textfieldinput
                  name="hotelName"
                  control={control}
                  label="Hotel"
                  select
                >
                  {hotels.map((h) => (
                    <MenuItem key={h.id} value={h.name}>
                      {h.name}
                    </MenuItem>
                  ))}
                </Textfieldinput>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Textfieldinput
                  name="roomNumber"
                  control={control}
                  label="Room No"
                  type="number"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Textfieldinput
                  name="price"
                  control={control}
                  label="Price (PKR)"
                  type="number"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Textfieldinput
                  name="category"
                  control={control}
                  label="Category"
                  select
                >
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.name}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Textfieldinput>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Textfieldinput
                  name="status"
                  control={control}
                  label="Status"
                  select
                >
                  {roomStatuses.map((st) => (
                    <MenuItem key={st} value={st}>
                      {st}
                    </MenuItem>
                  ))}
                </Textfieldinput>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Textfieldinput
                  name="propertyType"
                  control={control}
                  label="Property Type"
                  select
                >
                  {propertyTypes.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Textfieldinput>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AddRoom;
