import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  useTheme,
  Grid,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate, Link } from "react-router-dom";

import ConfirmDialog from "../../Components/ConfirmDialog";
import LoadingOverlay from "../../Components/LoadingOverlay";

import {
  fetchAllCategories,
  deleteCategory,
} from "../../services/CategoryService";

const RoomCategories = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchAllCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      await deleteCategory(selectedId);
      setCategories((prev) => prev.filter((c) => c.id !== selectedId));
      setConfirmOpen(false);
    } catch (err) {
      console.error("Failed to delete category", err);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, position: "relative" }}>
      <LoadingOverlay loading={loading} message="Loading categories..." fullScreen={true} />

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: 3,
          width: "100%",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="bold" color={theme.palette.primary.main}>
              Room Categories
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              color="primary"
              onClick={() => navigate("/rooms-categories/add")}
              sx={{ borderRadius: 2, py: 1, px: 2, fontWeight: 600, textTransform: "none" }}
            >
              Add Category
            </Button>
          </Grid>

          {!loading && categories.length === 0 ? (
            <Typography align="center" sx={{ py: 5 }}>
              No categories found.
            </Typography>
          ) : (
            categories.map((cat) => (
              <Box
                key={cat.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 1.5,
                  borderBottom: "1px solid #eee",
                }}
              >
                <Typography variant="body1">{cat.categoryName}</Typography>
                <Box>
                  <IconButton component={Link} to={`/rooms-categories/${cat.id}`} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => {
                      setSelectedId(cat.id);
                      setConfirmOpen(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            ))
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Category"
        description="Are you sure you want to delete this category?"
        onConfirm={handleDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </Box>
  );
};

export default RoomCategories;
