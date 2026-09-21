'use client';
import React, { useState } from "react";
import { ConfirmDialogView } from "@/components/feedback/ConfirmDialogView";

interface EditConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

const EditConfirmationDialog: React.FC<EditConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (loading) return; // prevent double click
    setLoading(true);

    try {
      await onConfirm(); // supports async or sync
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmDialogView
      open={open}
      title="Confirmation"
      message="Are you sure you want to save the changes?"
      confirmText="Confirm"
      cancelText="Cancel"
      tone="primary"
      loading={loading}
      onCancel={onClose}
      onConfirm={handleConfirm}
    />
  );
};

export default EditConfirmationDialog;
