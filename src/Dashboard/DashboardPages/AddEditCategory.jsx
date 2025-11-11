// src/Dashboard/DashboardPages/AddEditCategory.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { db } from "../../FirebaseFireStore/Firebase";
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";

const AddEditCategory = () => {
  const { id } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(id);

  useEffect(() => {
    const fetchCategory = async () => {
      if (!isEdit) return;
      try {
        const docRef = doc(db, "roomCategory", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCategoryName(docSnap.data().categoryName);
        }
      } catch (error) {
        console.error("Error fetching category:", error);
      }
    };
    fetchCategory();
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await updateDoc(doc(db, "roomCategory", id), { categoryName });
      } else {
        await addDoc(collection(db, "roomCategory"), { categoryName });
      }
      navigate("/rooms-categories");
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, mt: 0, mb: 0, py: 1 }}>
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: 2,
          width: "100%",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              color={theme.palette.primary.main}
            >
              {isEdit ? "Edit Category" : "Add New Category"}
            </Typography>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              form="category-form"
              sx={{
                borderRadius: 2,
                py: 1,
                px: 2,
                fontWeight: 600,
                textTransform: "none",
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : "Save"}
            </Button>
          </Box>

          <form id="category-form" onSubmit={handleSubmit}>
            <TextField
              label="Category Name"
              fullWidth
              size="small"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AddEditCategory;
