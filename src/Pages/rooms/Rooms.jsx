import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import HandshakeIcon from "@mui/icons-material/Handshake";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import Customdatagriddesktop from "../../Components/Customdatagriddesktop";
import ConfirmDialog from "../../Components/ConfirmDialog";
import StatusChip from "../../Components/StatusChip";
import Textfieldinput from "../../Components/Forms/Textfieldinput";
import Selectinput from "../../Components/Forms/Selectinput";

import {
  fetchAllRooms,
  fetchRoomById,
  deleteRoomById,
} from "../../services/RoomService";

const roomStatuses = ["Available", "Booked", "Maintenance", "Cleaning"];
const propertyTypes = ["Owned", "Partnered"];

const Rooms = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDescription, setConfirmDescription] = useState("");
  const [confirmAction, setConfirmAction] = useState(() => () => {});

  const { control, watch } = useForm({
    defaultValues: { search: "", category: "", property: "", status: "" },
  });

  const searchQuery = watch("search");
  const filterCategory = watch("category");
  const filterProperty = watch("property");
  const filterStatus = watch("status");

  // ================= Fetch rooms =================
  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);
      try {
        const data = await fetchAllRooms();
        setRows(data);
      } catch (err) {
        console.error("Failed to fetch rooms", err);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

  const categories = useMemo(() => {
    return [...new Set(rows.map((r) => r.categoryName).filter(Boolean))];
  }, [rows]);

  const commonCellStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  };

  const handleDeleteClick = (row) => {
    setConfirmDescription(
      `Are you sure you want to remove room number ${row.roomNo}?`
    );

    setConfirmAction(() => async () => {
      try {
        await deleteRoomById(row.id);
        setRows((prev) => prev.filter((r) => r.id !== row.id));
      } catch (err) {
        console.error("Failed to delete room", err);
      }
    });

    setConfirmOpen(true);
  };

  const columns = [
    {
      field: "roomNo",
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
      field: "categoryName",
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
        const iconColor = isOwned
          ? theme.palette.success.main
          : theme.palette.warning.main;
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
            <Typography
              variant="body2"
              sx={{ color: iconColor, fontWeight: 600 }}
            >
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
          <Typography variant="body2">
            PKR {params.row?.price ?? 0}
          </Typography>
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
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <Button
            component={Link}
            to={`/rooms/${params.row.id}`}
            size="small"
            color="info"
            variant="outlined"
            sx={{ minWidth: "auto", p: 0.5 }}
            onClick={(e) => e.stopPropagation()}
          >
            <VisibilityIcon fontSize="small" />
          </Button>

          <Button
            size="small"
            color="primary"
            variant="outlined"
            sx={{ minWidth: "auto", p: 0.5 }}
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await fetchRoomById(params.row.id);
                navigate(`/rooms/${params.row.id}/edit`);
              } catch (err) {
                console.error("Failed to fetch room for edit", err);
              }
            }}
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
              handleDeleteClick(params.row);
            }}
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      ),
    },
  ];

  const handleAddRoom = () => navigate("/rooms/0/add");
  const handleRowClick = (row) => navigate(`/rooms/${row.id}`);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        row.roomNo?.toString().includes(searchQuery) ||
        row.hotelName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory
        ? row.categoryName === filterCategory
        : true;
      const matchesProperty = filterProperty
        ? row.propertyType === filterProperty
        : true;
      const matchesStatus = filterStatus
        ? row.status === filterStatus
        : true;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesProperty &&
        matchesStatus
      );
    });
  }, [rows, searchQuery, filterCategory, filterProperty, filterStatus]);

  return (
    <Box sx={{ flexGrow: 1, mb: 2 }}>
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Grid
            container
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
          >
            <Grid item>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                color="primary"
                onClick={handleAddRoom}
                sx={{
                  fontWeight: "bold",
                  borderRadius: 2,
                  textTransform: "none",
                  boxShadow: 2,
                  minHeight: 36,
                }}
              >
                Add Room
              </Button>
            </Grid>

            <Grid item>
              <Grid container spacing={1} alignItems="center">
                <Grid item>
                  <Textfieldinput
                    name="search"
                    control={control}
                    placeholder="Search by Room No or Hotel Name"
                    fullWidth={false}
                    sx={{ minWidth: 220 }}
                  />
                </Grid>
                <Grid item>
                  <Selectinput
                    name="category"
                    control={control}
                    label="Category"
                    options={[
                      { label: "All", value: "" },
                      ...categories.map((c) => ({
                        label: c,
                        value: c,
                      })),
                    ]}
                    sx={{ minWidth: 180 }}
                  />
                </Grid>
                <Grid item>
                  <Selectinput
                    name="property"
                    control={control}
                    label="Type"
                    options={[
                      { label: "All", value: "" },
                      ...propertyTypes.map((p) => ({
                        label: p,
                        value: p,
                      })),
                    ]}
                    sx={{ minWidth: 180 }}
                  />
                </Grid>
                <Grid item>
                  <Selectinput
                    name="status"
                    control={control}
                    label="Status"
                    options={[
                      { label: "All", value: "" },
                      ...roomStatuses.map((s) => ({
                        label: s,
                        value: s,
                      })),
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
