import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Button, useTheme } from "@mui/material";
import { Link } from "react-router-dom";
import Customdatagriddesktop from "../../Components/Customdatagriddesktop";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import { fetchAllUsers } from "../../services/UserService";

const Users = () => {
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersObj = await fetchAllUsers();
      setUsers(Object.values(usersObj));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    {
      field: "userName",
      headerName: "Name",
      flex: 1,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "phone",
      headerName: "Contact",
      flex: 1,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "address",
      headerName: "Address",
      flex: 1,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      filterable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <Button
            component={Link}
            to={`/users/${params.row.id}`}
            size="small"
            color="info"
            variant="outlined"
            sx={{ minWidth: "auto", p: 0.5 }}
          >
            <VisibilityIcon fontSize="small" />
          </Button>
          <Button
            component={Link}
            to={`/users/${params.row.id}/edit`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ minWidth: "auto", p: 0.5 }}
          >
            <EditIcon fontSize="small" />
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, mb: 2 }}>
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Customdatagriddesktop
            rows={users}
            columns={columns}
            getRowId={(row) => row.id}
            autoHeight
            pageSize={10}
            rowsPerPageOptions={[10, 20]}
            loading={loading}
            sx={{
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: theme.palette.background.paper,
              },
              "& .MuiDataGrid-cell": { borderBottom: "1px solid #e0e0e0" },
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default Users;
