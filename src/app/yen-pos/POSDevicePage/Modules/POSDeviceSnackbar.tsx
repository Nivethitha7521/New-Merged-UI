




import React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface POSDeviceSnackbarProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

const POSDeviceSnackbar: React.FC<POSDeviceSnackbarProps> = ({
  open,
  message,
  onClose,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Alert
        onClose={onClose}
        severity="info"
        sx={{ 
          width: '100%', 
          backgroundColor: '#1976d2', // MUI blue primary.main
          color: '#ffffff', // White text
          '& .MuiAlert-icon': {
            color: '#ffffff', // White icon
          }
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default POSDeviceSnackbar;