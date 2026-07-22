import React from "react";
import { Snackbar, Alert } from "@mui/material";

interface LocationSnackbarProps {
  isOpen: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
  onClose: () => void;
}

const LocationSnackbar: React.FC<LocationSnackbarProps> = ({
  isOpen,
  message,
  severity,
  onClose,
}) => {
  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={3000}
      onClose={onClose}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        sx={{
          width: "100%",
          backgroundColor: (theme) => theme.palette.primary.main,
          color: "#ffffff",
          "& .MuiAlert-icon": {
            color: "#ffffff",
          },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default LocationSnackbar;
