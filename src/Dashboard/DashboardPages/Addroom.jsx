// src/Dashboard/DashboardPages/AddRoom.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  MenuItem,
  Button,
  Card,
  CardContent,
  Stack,
  useTheme,
  TextField,
  CircularProgress,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { addDoc, collection, doc, getDoc, updateDoc, getDocs } from "firebase/firestore";
import { db } from "../../FirebaseFireStore/Firebase";

const roomStatuses = ["Available", "Booked", "Maintenance", "Cleaning"];
const propertyTypes = ["Owned", "Partnered"];

const Textfieldinput = ({ name, control, label, placeholder, type = "text", select, children, rules }) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          type={type}
          label={label}
          placeholder={placeholder}
          select={select}
          size="small"
          fullWidth
          error={!!error}
          helperText={error ? error.message : null}
          InputProps={{ sx: { py: 0.5 } }}
          InputLabelProps={{ sx: { mt: 0 } }}
          SelectProps={{
            MenuProps: {
              PaperProps: {
                sx: {
                  maxHeight: 220,
                  "& .MuiMenuItem-root:hover": { backgroundColor: "#f5f5f5" },
                },
              },
            },
            sx: { py: 0.5, "&:hover": { backgroundColor: "#f5f5f5" } },
          }}
        >
          {children}
        </TextField>
      )}
    />
  );
};

const AddRoom = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const location = useLocation();

  const isAddMode = location.pathname.endsWith("/add");
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

  // Fetch hotel names and categories
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const hotelSnapshot = await getDocs(collection(db, "hotel"));
        const hotelList = hotelSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().hotelName || "" }));
        setHotels(hotelList);

        const categorySnapshot = await getDocs(collection(db, "roomCategory"));
        const categoryList = categorySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().categoryName || "" }));
        setCategories(categoryList);

        if (hotelList.length === 0) toast.warning("No hotels found in Firestore");
        if (categoryList.length === 0) toast.warning("No room categories found in Firestore");
      } catch (err) {
        console.error("Error fetching dropdowns:", err);
        toast.error("Failed to load dropdown values. Check Firestore collection names and rules.");
      }
    };
    fetchDropdowns();
  }, []);

  // Prefill form in Edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchRoom = async () => {
        try {
          const roomRef = doc(db, "rooms", roomId);
          const roomSnap = await getDoc(roomRef);
          if (roomSnap.exists()) {
            const data = roomSnap.data();

            // Fetch hotel name
            let hotelName = "";
            if (data.hotelId) {
              const hotelSnap = await getDoc(doc(db, "hotel", data.hotelId));
              if (hotelSnap.exists()) hotelName = hotelSnap.data().hotelName || "";
            }

            // Fetch category name
            let categoryName = "";
            if (data.categoryId) {
              const catSnap = await getDoc(doc(db, "roomCategory", data.categoryId));
              if (catSnap.exists()) categoryName = catSnap.data().categoryName || "";
            }

            reset({
              hotelName,
              roomNumber: data.roomNo?.toString() || "",
              price: data.price?.toString() || "",
              status: data.status || "",
              propertyType: data.propertyType || "",
              category: categoryName,
            });
          } else {
            toast.error("Room not found!");
            navigate("/rooms");
          }
        } catch (err) {
          console.error("Error fetching room:", err);
          toast.error("Error fetching room data.");
        } finally {
          setLoading(false);
        }
      };
      fetchRoom();
    } else if (isAddMode) {
      setLoading(false);
    }
  }, [isEditMode, isAddMode, roomId, reset, navigate]);

  const onSubmit = async (formData) => {
    try {
      setSaving(true);

      const hotel = hotels.find(h => h.name === formData.hotelName);
      const category = categories.find(c => c.name === formData.category);

      if (!hotel || !category) {
        toast.error("Invalid hotel or category selected.");
        setSaving(false);
        return;
      }

      const payload = {
        hotelId: hotel.id,
        categoryId: category.id,
        roomNo: parseInt(formData.roomNumber, 10),
        price: parseFloat(formData.price),
        status: formData.status,
        propertyType: formData.propertyType,
      };

      if (isNaN(payload.roomNo) || isNaN(payload.price)) {
        toast.error("Room Number and Price must be valid numbers.");
        setSaving(false);
        return;
      }

      if (isEditMode) {
        await updateDoc(doc(db, "rooms", roomId), payload);
        toast.success("Room updated successfully!", { autoClose: 2000 });
      } else {
        await addDoc(collection(db, "rooms"), payload);
        toast.success("Room added successfully!", { autoClose: 2000 });
      }

      navigate("/rooms");
    } catch (err) {
      console.error("Error saving room:", err);
      toast.error("Error saving room: " + (err.message || "Unexpected error"));
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
    <Box sx={{ flexGrow: 1, mt: 0, mb: 0, py: 1 }}>
      <Card sx={{ borderRadius: 2, boxShadow: 2, width: "100%", backgroundColor: theme.palette.background.paper }}>
        <CardContent sx={{ p: 2 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h5" fontWeight="bold" color={theme.palette.primary.main}>
                {isEditMode ? "Edit Room" : "Add New Room"}
              </Typography>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ borderRadius: 2, py: 1, px: 2, fontWeight: 600, textTransform: "none" }}
                disabled={saving} // Disabled when saving
              >
                {saving ? <CircularProgress size={20} color="inherit" /> : "Save"}
              </Button>
            </Box>

            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5}>
                <Box sx={{ flex: 1 }}>
                  <Textfieldinput
                    name="hotelName"
                    control={control}
                    label="Hotel Name"
                    select
                    rules={{ required: "Hotel Name is required" }}
                  >
                    {hotels.length === 0 ? (
                      <MenuItem disabled>Loading...</MenuItem>
                    ) : (
                      hotels.map(h => <MenuItem key={h.id} value={h.name}>{h.name}</MenuItem>)
                    )}
                  </Textfieldinput>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Textfieldinput
                    name="roomNumber"
                    control={control}
                    label="Room No"
                    type="number"
                    placeholder="e.g., 205"
                    rules={{ required: "Room No is required", min: { value: 1, message: "Room No must be > 0" } }}
                  />
                </Box>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5}>
                <Box sx={{ flex: 1 }}>
                  <Textfieldinput
                    name="price"
                    control={control}
                    label="Price (PKR)"
                    type="number"
                    rules={{ required: "Price is required", min: { value: 1, message: "Price must be > 0" } }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Textfieldinput
                    name="category"
                    control={control}
                    label="Category"
                    select
                    rules={{ required: "Category is required" }}
                  >
                    {categories.length === 0 ? (
                      <MenuItem disabled>Loading...</MenuItem>
                    ) : (
                      categories.map(c => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)
                    )}
                  </Textfieldinput>
                </Box>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5}>
                <Box sx={{ flex: 1 }}>
                  <Textfieldinput
                    name="status"
                    control={control}
                    label="Status"
                    select
                    rules={{ required: "Status is required" }}
                  >
                    {roomStatuses.map(st => <MenuItem key={st} value={st}>{st}</MenuItem>)}
                  </Textfieldinput>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Textfieldinput
                    name="propertyType"
                    control={control}
                    label="Type"
                    select
                    rules={{ required: "Type is required" }}
                  >
                    {propertyTypes.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                  </Textfieldinput>
                </Box>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AddRoom;
