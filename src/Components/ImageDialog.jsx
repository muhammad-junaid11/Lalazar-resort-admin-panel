import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from "@mui/material";

const ImageDialog = ({ open, onClose, title = "Image Preview", imageSrc }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ display: "flex", justifyContent: "center" }}>
        <Box
          component="img"
          src={imageSrc}
          alt={title}
          sx={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          sx={{ px: 2, textTransform: "none" }}
          onClick={onClose}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageDialog;
