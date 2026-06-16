
'use client';
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";

interface ActivateDeactivateConfirmationDialogProps {
  open: boolean;
  actionType: "deactivate" | "activate" | "delete" | null;
  itemName?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

const ActivateDeactivateConfirmationDialog: React.FC<
  ActivateDeactivateConfirmationDialogProps
> = ({ open, actionType, itemName,  onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const getMessage = () => {
    const name = itemName ? ` "${itemName}"` : "";

    // switch (actionType) {
    //   case "deactivate":
    //     return "Are you sure you want to deactivate this ${name}?";
    //   case "activate":
    //     return "Are you sure you want to activate this ${name}?";
    //   case "delete":
    //     return "Are you sure you want to delete this data?";
    //   default:
    //     return "";
    // }

    switch (actionType) {
    case "deactivate":
      return `Are you sure you want to deactivate this${name}?`;
    case "activate":
      return `Are you sure you want to activate this${name}?`;
    case "delete":
      return `Are you sure you want to delete this${name}?`;
    default:
      return "";
  }

  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      PaperProps={{
  sx: {
    width: '100%',
    maxWidth: '360px !important',
    borderRadius: '4px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.18)',
  }
}}
    >
     <DialogTitle sx={{ padding:'14px 18px 12px !important', fontSize:'13px', fontWeight:600, color:'#111827', borderBottom:'1px solid #e5e7eb', background:'#fff', fontFamily:"'Poppins',sans-serif" }}>
Confirmation</DialogTitle>

      <DialogContent sx={{ padding:'12px 18px 12px !important', fontSize:'13px', color:'#374151', textAlign:'center', lineHeight:1.6, fontFamily:"'Poppins',sans-serif" }}>
        <label>{getMessage()}</label>
      </DialogContent>

      <DialogActions sx={{ padding:'10px 18px !important', borderTop:'1px solid #e5e7eb', background:'#f9fafb', justifyContent:'flex-end', gap:'10px' }}>
        <button onClick={onClose} disabled={loading} style={{ width:'90px', height:'34px', borderRadius:'6px', fontSize:'12px', fontWeight:500, background:'#fff', border:'1px solid #d1d5db', color:'#374151', fontFamily:"'Poppins',sans-serif", cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
          Cancel
        </button>

       <button onClick={handleConfirm} disabled={loading} style={{ width:'90px', height:'34px', borderRadius:'6px', fontSize:'12px', fontWeight:600, color:'white', border:'none', background:'linear-gradient(to right, #3b82f6, #2563eb)', boxShadow:'0 2px 6px rgba(37,99,235,0.25)', fontFamily:"'Poppins',sans-serif", cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>

          {loading ? (
            <CircularProgress size={18} sx={{ color: "#fff" }} />
          ) : (
            "Confirm"
          )}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default ActivateDeactivateConfirmationDialog;
