import React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface AssetSnackbarProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

const AssetSnackbar: React.FC<AssetSnackbarProps> = ({
  open,
  message,
  onClose,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Alert 
        onClose={onClose} 
        severity="info"
        sx={{ width: '100%', backgroundColor: '#1976d2', color: 'white' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AssetSnackbar;