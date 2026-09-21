'use client';
import React from "react";
import { ConfirmDialogView } from "@/components/feedback/ConfirmDialogView";

interface CloseConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CloseConfirmationDialog: React.FC<CloseConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  return (
    <ConfirmDialogView
      open={open}
      title="Confirmation"
      message="Are you sure you want to close the form? Any unsaved changes will be lost."
      confirmText="Confirm"
      cancelText="Keep Editing"
      tone="warning"
      onCancel={onClose}
      onConfirm={onConfirm}
    />
  );
};

export default CloseConfirmationDialog;
