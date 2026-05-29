// PaymentHistoryDialog.tsx
'use client';
import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import PaymentHistoryDialogContent from './PaymentHistoryDialogConten';

interface PaymentHistoryDialogProps {
  open: boolean;
  onClose: () => void;
}

const PaymentHistoryDialog = ({ open, onClose }: PaymentHistoryDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  // Responsive dialog dimensions
  const getDialogDimensions = () => {
    if (isMobile) {
      return {
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        borderRadius: 0
      };
    }
    if (isTablet) {
      return {
        width: '95vw',
        height: '90vh',
        maxWidth: '95vw',
        maxHeight: '90vh',
        borderRadius: '12px'
      };
    }
    // Desktop and large screens
    return {
      width: '90vw',
      height: '90vh',
      maxWidth: '1400px',
      maxHeight: '90vh',
      borderRadius: '12px'
    };
  };

  const dimensions = getDialogDimensions();

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth={false}
      fullWidth={!isDesktop}
      PaperProps={{
        sx: {
          width: dimensions.width,
          height: dimensions.height,
          maxWidth: dimensions.maxWidth,
          maxHeight: dimensions.maxHeight,
          margin: isMobile ? 0 : 'auto',
          borderRadius: dimensions.borderRadius,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0',
        py: isMobile ? 1.5 : 2,
        px: isMobile ? 2 : 3,
        backgroundColor: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <Typography variant={isMobile ? "subtitle1" : "h6"} component="span" fontWeight="bold">
          Payment History
        </Typography>
        <IconButton onClick={onClose} size={isMobile ? "small" : "medium"}>
          <ClearIcon fontSize={isMobile ? "small" : "medium"} />
        </IconButton>
      </DialogTitle>
      <DialogContent 
        sx={{ 
          p: 0, 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#888',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#555',
            },
          },
        }}
      >
        <Box sx={{ 
          p: isMobile ? 1.5 : 2,
          height: '100%',
          overflow: 'auto'
        }}>
          <PaymentHistoryDialogContent onRequestClose={onClose} />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentHistoryDialog;