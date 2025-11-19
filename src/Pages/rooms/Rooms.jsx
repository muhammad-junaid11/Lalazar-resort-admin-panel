import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  useTheme,
  Grid,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HandshakeIcon from "@mui/icons-material/Handshake";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../FirebaseFireStore/Firebase";
import Customdatagriddesktop from "../../Components/Customdatagriddesktop";
import ConfirmDialog from "../../Components/ConfirmDialog";
import { Link, useNavigate } from "react-router-dom";
import StatusChip from "../../Components/StatusChip";
import { useForm } from "react-hook-form";
import Textfieldinput from "../../Components/Forms/Textfieldinput";
import Selectinput from "../../Components/Forms/Selectinput";

const roomStatuses = ["Available", "Booked", "Maintenance", "Cleaning"];
const propertyTypes = ["Owned", "Partnered"];

const Rooms = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]); // State to hold unique categories dynamically

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDescription, setConfirmDescription] = useState("");
  const [confirmAction, setConfirmAction] = useState(() => () => {});

  // ===========================================
  // 🔄 React Hook Form Setup
  // ===========================================
  const { control, watch } = useForm({
    defaultValues: {
      search: "",
      category: "",
      property: "",
      status: "",
    },
  });

  // Watch filter values
  const searchQuery = watch("search");
  const filterCategory = watch("category");
  const filterProperty = watch("property");
  const filterStatus = watch("status");

  // Fetch Rooms Data
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const [roomsSnap, hotelsSnap, categoriesSnap] = await Promise.all([
          getDocs(collection(db, "rooms")),
          getDocs(collection(db, "hotel")),
          getDocs(collection(db, "roomCategory")),
        ]);

        const hotelMap = {};
        hotelsSnap.docs.forEach((doc) => {
          hotelMap[doc.id] = doc.data().hotelName;
        });

        const categoryMap = {};
        categoriesSnap.docs.forEach((doc) => {
          const categoryName = doc.data().categoryName || "Unknown Category";
          categoryMap[doc.id] = categoryName;
        });
        
        // Populate the categories state for the Selectinput options
        setCategories(Object.values(categoryMap)); 

        const roomsList = roomsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        const mergedRooms = roomsList.map((room) => ({
          ...room,
          hotelName: hotelMap[room.hotelId] || "Unknown Hotel",
          category: categoryMap[room.categoryId] || "Unknown Category",
          roomNumber: room.roomNo,
        }));

        setRows(mergedRooms);
      } catch (err) {
        console.error("Error fetching rooms:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const commonCellStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  };

  const handleDeleteClick = (row) => {
    setConfirmDescription(`Are you sure you want to remove room number ${row.roomNumber}?`);
    setConfirmAction(() => async () => {
      try {
        await deleteDoc(doc(db, "rooms", row.id));
        setRows((prev) => prev.filter((r) => r.id !== row.id));
      } catch (err) {
        console.error("Failed to delete room:", err);
      }
    });
    setConfirmOpen(true);
  };

  const columns = [
    {
      field: "roomNumber",
      headerName: "Room No",
      flex: 0.8,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Box sx={commonCellStyle}>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "hotelName",
      headerName: "Hotel Name",
      flex: 1.2,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Box sx={commonCellStyle}>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "category",
      headerName: "Category",
      flex: 1.2,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Box sx={commonCellStyle}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "propertyType",
      headerName: "Type",
      flex: 1,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const isOwned = params.value === "Owned";
        const iconColor = isOwned ? theme.palette.success.main : theme.palette.warning.main;
        const Icon = isOwned ? HomeWorkIcon : HandshakeIcon;
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              gap: 0.8,
            }}
          >
            <Icon sx={{ color: iconColor }} />
            <Typography variant="body2" sx={{ color: iconColor, fontWeight: 600 }}>
              {params.value}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "price",
      headerName: "Price",
      flex: 0.8,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Box sx={commonCellStyle}>
          <Typography variant="body2">PKR {params.row?.price ?? 0}</Typography>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => <StatusChip label={params.value} />,
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const row = params.row;
        return (
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
            <Button
              component={Link}
              to={`/rooms/${row.id}`}
              size="small"
              color="info"
              variant="outlined"
              sx={{ minWidth: "auto", p: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
            <Button
              component={Link}
              to={`/rooms/${row.id}/edit`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ minWidth: "auto", p: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              <EditIcon fontSize="small" />
            </Button>
            <Button
              size="small"
              color="error"
              variant="outlined"
              sx={{ minWidth: "auto", p: 0.5 }}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(row);
              }}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Box>
        );
      },
    },
  ];

  const handleAddRoom = () => navigate("/rooms/0/add");
  const handleRowClick = (row) => navigate(`/rooms/${row.id}`);

  // Apply Filters using RHF watch variables
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        row.roomNumber?.toString().includes(searchQuery) ||
        row.hotelName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory ? row.category === filterCategory : true;
      const matchesProperty = filterProperty ? row.propertyType === filterProperty : true;
      const matchesStatus = filterStatus ? row.status === filterStatus : true;
      
      return matchesSearch && matchesCategory && matchesProperty && matchesStatus;
    });
  }, [rows, searchQuery, filterCategory, filterProperty, filterStatus]);

  return (
    <Box sx={{ flexGrow: 1, mb: 2 }}>
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          
          {/* Header and Add Button */}
          <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                color="primary"
                onClick={handleAddRoom}
                sx={{ fontWeight: "bold", borderRadius: 2, textTransform: "none", boxShadow: 2, minHeight: 36 }}
              >
                Add Room
              </Button>
            </Grid>

            <Grid item>
              <Grid container spacing={1} alignItems="center">
                
                {/* Search Input */}
                <Grid item>
                  <Textfieldinput
                    name="search"
                    control={control}
                    placeholder="Search by Room No or Hotel Name"
                    fullWidth={false}
                    sx={{ minWidth: 220 }}
                  />
                </Grid>

                {/* Category Filter */}
                <Grid item>
                  <Selectinput
                    name="category"
                    control={control}
                    label="Category"
                    options={[
                        { label: "All", value: "" },
                        ...categories.map((c) => ({ label: c, value: c })),
                    ]}
                    sx={{ minWidth: 180 }}
                  />
                </Grid>

                {/* Property Type Filter */}
                <Grid item>
                  <Selectinput
                    name="property"
                    control={control}
                    label="Type"
                    options={[
                        { label: "All", value: "" },
                        ...propertyTypes.map((p) => ({ label: p, value: p })),
                    ]}
                    sx={{ minWidth: 180 }}
                  />
                </Grid>
                
                {/* Status Filter */}
                <Grid item>
                  <Selectinput
                    name="status"
                    control={control}
                    label="Status"
                    options={[
                        { label: "All", value: "" },
                        ...roomStatuses.map((s) => ({ label: s, value: s })),
                    ]}
                    sx={{ minWidth: 180 }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
          </Grid>

          <Customdatagriddesktop
            rows={filteredRows}
            columns={columns}
            getRowId={(row) => row.id}
            autoHeight
            pageSize={10}
            rowsPerPageOptions={[10]}
            onRowClick={(params) => handleRowClick(params.row)}
            loading={loading}
            sx={{
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: theme.palette.background.paper,
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid #e0e0e0",
              },
            }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        description={confirmDescription}
        onConfirm={() => {
          confirmAction();
          setConfirmOpen(false);
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </Box>
  );
};

export default Rooms;