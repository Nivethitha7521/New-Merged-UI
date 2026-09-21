'use client';
import React, { useState } from "react";
import { ConfirmDialogView } from "@/components/feedback/ConfirmDialogView";

interface ActivateDeactivateConfirmationDialogProps {
  open: boolean;
  actionType: "deactivate" | "activate" | "delete" | null;
  itemName?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

/**
 * Same props / behaviour as before (async confirm with spinner, locked while
 * loading). Only the visual layer changed: it now renders the global YEN ERP
 * confirmation dialog, so it looks identical in every module.
 */
const ActivateDeactivateConfirmationDialog: React.FC<
  ActivateDeactivateConfirmationDialogProps
> = ({ open, actionType, itemName, onClose, onConfirm }) => {
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
    <ConfirmDialogView
      open={open}
      title="Confirmation"
      message={getMessage()}
      confirmText="Confirm"
      cancelText="Cancel"
      tone={actionType === "activate" ? "primary" : "danger"}
      loading={loading}
      onCancel={onClose}
      onConfirm={handleConfirm}
    />
  );
};

export default ActivateDeactivateConfirmationDialog;
