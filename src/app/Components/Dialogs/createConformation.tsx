'use client';
import React, { useState } from "react";
import { ConfirmDialogView } from "@/components/feedback/ConfirmDialogView";

interface CreateConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

const CreateConfirmationDialog: React.FC<CreateConfirmationDialogProps> = ({
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
      message="Are you sure you want to Create The Data?"
      confirmText="Confirm"
      cancelText="Cancel"
      tone="primary"
      loading={loading}
      onCancel={onClose}
      onConfirm={handleConfirm}
    />
  );
};

export default CreateConfirmationDialog;
