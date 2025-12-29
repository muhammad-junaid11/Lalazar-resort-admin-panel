import { useEffect, useState } from "react";
import { Box, Card, CardContent, Grid, Typography, useTheme, Button } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";

import LoadingOverlay from "../../Components/LoadingOverlay";
import HeaderSection from "../../Components/HeaderSection";
import KeyValueBlock from "../../Components/KeyValueBlock";
import StatusChip from "../../Components/StatusChip"; 
import FormattedDate from "../../Components/FormattedDate";
import { fetchUserById } from "../../services/UserService";

const UserDetails = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const u = await fetchUserById(userId);
        if (u?.dob && u.dob.seconds !== undefined) {
          u.dob = u.dob.toDate();
        }
        setUser(u);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleEdit = () => {
    navigate(`/users/${userId}/edit`);
  };

  return (
    <Box sx={{ flexGrow: 1, mt: 0, mb: 0, py: 1, position: "relative" }}>
      <LoadingOverlay loading={loading} message="Loading user details..." fullScreen={true} />

      {user ? (
        <Card sx={{ borderRadius: 3, boxShadow: 4, mb: 4 }}>
          <CardContent sx={{ px: { xs: 2, sm: 4, md: 6 }, position: "relative" }}>
            
            {/* Header with title and edit button */}
            <Grid container justifyContent="space-between" alignItems="center" mb={3}>
              <Grid item>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: theme.palette.primary.main }}>
                  User Details
                </Typography>
              </Grid>
              <Grid item>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {user.status && <StatusChip label={user.status} />}
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ fontWeight: 600, textTransform: "none", py: 1, px: 2 }}
                    onClick={handleEdit}
                  >
                    Edit
                  </Button>
                </Box>
              </Grid>
            </Grid>

            <HeaderSection title="User Overview" />

            <Grid container spacing={2} sx={{ px: 0.5 }}>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="Name" value={user.userName} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="Email" value={user.email} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="Phone" value={user.phone} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="Gender" value={user.gender} />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="DOB">
                  <FormattedDate value={user.dob} type="date" />
                </KeyValueBlock>
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                <KeyValueBlock label="Address" value={user.address} />
              </Grid>
            </Grid>

          </CardContent>
        </Card>
      ) : (
        !loading && (
          <Typography variant="h6" sx={{ textAlign: "center", mt: 5, color: "text.secondary" }}>
            User not found
          </Typography>
        )
      )}
    </Box>
  );
};

export default UserDetails;
