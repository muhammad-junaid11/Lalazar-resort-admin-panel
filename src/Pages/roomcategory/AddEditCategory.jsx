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
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchCategoryById,
  addCategory,
  updateCategory,
} from "../../services/CategoryService";

const AddEditCategory = () => {
  const { id } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // ---------------- Fetch category for edit ----------------
  useEffect(() => {
    if (!isEdit) {
      setLoading(false);
      return;
    }

    const loadCategory = async () => {
      try {
        const cat = await fetchCategoryById(id);
        if (!cat) {
          navigate("/rooms-categories");
          return;
        }
        setCategoryName(cat.categoryName || "");
      } catch (err) {
        console.error("Failed to fetch category", err);
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [id, isEdit, navigate]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      setSaving(true);
      if (isEdit) {
        await updateCategory(id, { categoryName });
      } else {
        await addCategory({ categoryName });
      }
      navigate("/rooms-categories");
    } catch (err) {
      console.error("Failed to save category", err);
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
            <Typography variant="h5" fontWeight="bold" color={theme.palette.primary.main}>
              {isEdit ? "Edit Category" : "Add New Category"}
            </Typography>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              form="category-form"
              sx={{ borderRadius: 2, py: 1, px: 2, fontWeight: 600, textTransform: "none" }}
              disabled={saving}
            >
              {saving ? <CircularProgress size={20} color="inherit" /> : "Save"}
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
