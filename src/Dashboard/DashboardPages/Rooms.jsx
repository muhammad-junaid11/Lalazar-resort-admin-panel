import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  useTheme,
  MenuItem,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
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

const roomStatuses = ["Available", "Booked", "Maintenance", "Cleaning"];
const propertyTypes = ["Owned", "Partnered"];

const Rooms = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterProperty, setFilterProperty] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDescription, setConfirmDescription] = useState("");
  const [confirmAction, setConfirmAction] = useState(() => () => {});

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const roomsSnap = await getDocs(collection(db, "rooms"));
        const roomsList = roomsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        const hotelsSnap = await getDocs(collection(db, "hotel"));
        const hotelMap = {};
        hotelsSnap.docs.forEach((doc) => {
          hotelMap[doc.id] = doc.data().hotelName;
        });

        const categoriesSnap = await getDocs(collection(db, "roomCategory"));
        const categoryMap = {};
        categoriesSnap.docs.forEach((doc) => {
          categoryMap[doc.id] = doc.data().categoryName;
        });

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

  const getChipStyle = (color) => ({
    backgroundColor: color + "33",
    color,
    fontWeight: 600,
  });

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
      renderCell: (params) => {
        const colors = {
          Available: theme.palette.success.main,
          Booked: theme.palette.error.main,
          Maintenance: theme.palette.warning.main,
          Cleaning: theme.palette.info.main,
        };
        const color = colors[params.value] || theme.palette.grey[500];
        return (
          <Box sx={commonCellStyle}>
            <Chip label={params.value} size="small" sx={getChipStyle(color)} />
          </Box>
        );
      },
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
                <Grid item>
                  <TextField
                    size="small"
                    placeholder="Search by Room No or Hotel Name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ minWidth: 220, "& .MuiInputBase-input": { padding: "6px 10px", textAlign: "left" } }}
                  />
                </Grid>
                <Grid item>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={filterCategory}
                      label="Category"
                      onChange={(e) => setFilterCategory(e.target.value)}
                      sx={{ "& .MuiSelect-select": { textAlign: "center" } }}
                    >
                      <MenuItem value="">All</MenuItem>
                      {Array.from(new Set(rows.map((r) => r.category))).map((c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={filterProperty}
                      label="Type"
                      onChange={(e) => setFilterProperty(e.target.value)}
                      sx={{ "& .MuiSelect-select": { textAlign: "center" } }}
                    >
                      <MenuItem value="">All</MenuItem>
                      {propertyTypes.map((p) => (
                        <MenuItem key={p} value={p}>
                          {p}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Status"
                      onChange={(e) => setFilterStatus(e.target.value)}
                      sx={{ "& .MuiSelect-select": { textAlign: "center" } }}
                    >
                      <MenuItem value="">All</MenuItem>
                      {roomStatuses.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Customdatagriddesktop
              rows={filteredRows}
              columns={columns}
              getRowId={(row) => row.id}
              autoHeight
              pageSize={10}
              rowsPerPageOptions={[10]}
              onRowClick={(params) => handleRowClick(params.row)}
              sx={{
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: theme.palette.background.paper,
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: "1px solid #e0e0e0",
                },
              }}
            />
          )}
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