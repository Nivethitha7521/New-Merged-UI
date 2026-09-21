// ConfirmationDialog.tsx
import React from 'react';
import { ConfirmDialogView } from '@/components/feedback/ConfirmDialogView';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  return (
    <ConfirmDialogView
      open={open}
      title={title}
      message={message}
      confirmText="Confirm"
      cancelText="Cancel"
      onCancel={onClose}
      onConfirm={onConfirm}
    />
  );
};

export default ConfirmationDialog;
