// src/Dashboard/DashboardPages/RoomCategories.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  useTheme,
  Grid,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../FirebaseFireStore/Firebase";
import { useNavigate, Link } from "react-router-dom";
import ConfirmDialog from "../../Components/ConfirmDialog";

const RoomCategories = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "roomCategory"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "roomCategory", selectedId));
      setCategories((prev) => prev.filter((item) => item.id !== selectedId));
      setConfirmOpen(false);
    } catch (error) {
      console.error("Error deleting category:", error);
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
          <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              color={theme.palette.primary.main}
            >
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

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress />
            </Box>
          ) : categories.length === 0 ? (
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
                  <IconButton
                    component={Link}
                    to={`/rooms-categories/${cat.id}`}
                    color="primary"
                  >
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
