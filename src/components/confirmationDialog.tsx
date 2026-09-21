import React from 'react';
import { ConfirmDialogView } from '@/components/feedback/ConfirmDialogView';
import type { ConfirmTone } from '@/components/feedback/feedbackBus';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string | React.ReactNode; // Allow string or ReactNode
  confirmText?: string; // Optional with default value
  cancelText?: string;  // Optional with default value
  /** Optional. When omitted, destructive wording (deactivate/delete/remove/reject/discard) is shown in red. */
  tone?: ConfirmTone;
}

const DESTRUCTIVE = /deactivat|delet|remov|reject|discard|cancel order|\bvoid\b/i;

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm', // Default value
  cancelText = 'Cancel',   // Default value
  tone,
}) => {
  const resolvedTone: ConfirmTone =
    tone ?? (DESTRUCTIVE.test(`${confirmText} ${title}`) ? 'danger' : 'primary');

  return (
    <ConfirmDialogView
      open={open}
      title={title}
      message={description}
      confirmText={confirmText}
      cancelText={cancelText}
      tone={resolvedTone}
      onCancel={onClose}
      onConfirm={onConfirm}
    />
  );
};

export default ConfirmationDialog;
