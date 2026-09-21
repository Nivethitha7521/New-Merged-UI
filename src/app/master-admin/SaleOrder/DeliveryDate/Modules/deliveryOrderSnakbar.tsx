"use client";
import React from "react";
import { Snackbar, Alert } from "@mui/material";

interface SnackbarNotificationProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

const SnackbarNotification: React.FC<SnackbarNotificationProps> = ({
  open,
  message,
  onClose,
}) => {
  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={onClose}>
      <Alert
        onClose={onClose}
        severity="info" // Use info as base
        sx={{
          width: "100%",
          backgroundColor: (theme) => theme.palette.primary.main,
          color: "#ffffff",
          "& .MuiAlert-icon": {
            color: "#ffffff", // Make icon white to match
          },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default SnackbarNotification;
