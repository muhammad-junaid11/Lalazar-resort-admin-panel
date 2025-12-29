import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Stack,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useTheme } from "@mui/material/styles";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";

import Customdatagriddesktop from "../../Components/Customdatagriddesktop";
import StatusChip from "../../Components/StatusChip";
import Textfieldinput from "../../Components/Forms/Textfieldinput";
import Selectinput from "../../Components/Forms/Selectinput";
import FormattedDate from "../../Components/FormattedDate";
import { fetchPaymentsForUI } from "../../services/PaymentService";


const Payment = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  const { control, watch } = useForm({
    defaultValues: {
      guestName: "",
      status: "",
    },
  });

  const filterGuest = watch("guestName");
  const filterStatus = watch("status");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const paymentsData = await fetchPaymentsForUI();
        setPayments(paymentsData);
      } catch (err) {
        console.error("Failed to fetch payments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const columns = [
    { field: "guestName", headerName: "Guest Name", flex: 1 },
    { field: "paidAmount", headerName: "Paid Amount", flex: 1 },
    { field: "totalAmount", headerName: "Total Amount", flex: 1 },
    {
      field: "dates",
      headerName: "Check-in → Check-out",
      flex: 1.5,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <span>
          <FormattedDate value={params.row.checkIn} type="date" /> →{" "}
          <FormattedDate value={params.row.checkOut} type="date" />
        </span>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => <StatusChip label={params.row.paymentStatus} />,
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.8,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            alignItems: "center",
          }}
        >
          <Stack direction="row" spacing={1}>
            <Link to={`/payments/${params.row.bookingId}`} style={{ textDecoration: "none" }}>
              <Button size="small" variant="outlined" color="info">
                <VisibilityIcon fontSize="small" />
              </Button>
            </Link>
          </Stack>
        </Box>
      ),
    },
  ];

  const filteredRows = useMemo(() => {
    return payments.filter((row) => {
      const searchValue = filterGuest.toLowerCase();
      const matchesGuest = row.guestName?.toLowerCase().includes(searchValue);
      const matchesRoom = row.roomNo?.toLowerCase().includes(searchValue);
      const matchesStatus = filterStatus ? row.paymentStatus === filterStatus : true;
      return (matchesGuest || matchesRoom) && matchesStatus;
    });
  }, [payments, filterGuest, filterStatus]);

  return (
    <Box>
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Grid container justifyContent="flex-end" spacing={2} sx={{ mb: 2 }}>
            <Grid item>
              <Textfieldinput
                name="guestName"
                control={control}
                placeholder="Search by Guest Name or Room No."
                fullWidth={false}
                sx={{ minWidth: 220 }}
              />
            </Grid>
            <Grid item>
              <Selectinput
                name="status"
                control={control}
                label="Status"
                options={[
                  { label: "All", value: "" },
                  { label: "Pending", value: "Pending" },
                  { label: "Rejected", value: "Rejected" },
                  { label: "Paid", value: "Paid" },
                ]}
                sx={{ minWidth: 180 }}
              />
            </Grid>
          </Grid>

          <Box sx={{ width: "100%", minWidth: 600, position: "relative" }}>
            <Customdatagriddesktop
              rows={filteredRows}
              columns={columns}
              pageSizeOptions={[5, 10, 20]}
              defaultPageSize={10}
              getRowId={(row) => row.bookingId}
              loading={loading}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Payment;
