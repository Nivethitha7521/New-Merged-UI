

"use client";

import React from 'react';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { logout } from '../yen-recipie/RecipeManagement/Features/authSlice';

interface LogoutDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const LogoutDialog: React.FC<LogoutDialogProps> = ({ open, setOpen }) => {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleClose = () => {
    setOpen(false);
  };

  const handleLogout = () => {
    // Dispatch logout action (clears Redux state)
    dispatch(logout());

    // Safely clear localStorage only in the browser
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }

    // Close dialog and redirect
    handleClose();
    router.push('/');
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-description"
      PaperProps={{
        className: "dialog-paper-small"
      }}
    >
      <DialogTitle className='dialog-title' id="logout-dialog-title">Confirm Logout</DialogTitle>
      <DialogContent className='dialog-content'>
        <DialogContentText id="logout-dialog-description">
          Are you sure you want to log out?
        </DialogContentText>
      </DialogContent>
      <DialogActions className='dialog-actions'>
        <button className='btn-secondary' onClick={handleClose} color="primary">
          Cancel
        </button>
        <button className='btn-primary' onClick={handleLogout} color="secondary" autoFocus>
          Logout
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default LogoutDialog;