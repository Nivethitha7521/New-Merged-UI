'use client';

import React from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import type {
  DialogActionsProps,
  DialogContentProps,
  DialogProps,
  DialogTitleProps,
} from '@mui/material';

/**
 * Thin YEN ERP dialog primitives.
 *
 * These components intentionally add presentation only. They do not own form
 * state, validation, API calls, Redux state, submit handlers, or close logic.
 * Existing MUI dialogs are also styled by styles/yenDialog.css, so modules can
 * migrate to these primitives gradually without a behavior change.
 */
export const YenDialog: React.FC<DialogProps> = ({ className, ...props }) => (
  <Dialog
    {...props}
    className={['yen-dialog', className].filter(Boolean).join(' ')}
  />
);

export interface YenDialogHeaderProps extends Omit<DialogTitleProps, 'title'> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose?: () => void;
  closeLabel?: string;
}

export const YenDialogHeader: React.FC<YenDialogHeaderProps> = ({
  title,
  subtitle,
  onClose,
  closeLabel = 'Close dialog',
  className,
  ...props
}) => (
  <DialogTitle
    {...props}
    className={['yen-dialog-title', className].filter(Boolean).join(' ')}
  >
    <Box className="yen-dialog-title-layout">
      <Box className="yen-dialog-title-copy">
        <Typography component="span" className="yen-dialog-heading">
          {title}
        </Typography>
        {subtitle ? (
          <Typography component="span" className="yen-dialog-subtitle">
            {subtitle}
          </Typography>
        ) : null}
      </Box>

      {onClose ? (
        <IconButton
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="yen-dialog-close-button"
          size="small"
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      ) : null}
    </Box>
  </DialogTitle>
);

export const YenDialogContent: React.FC<DialogContentProps> = ({
  className,
  ...props
}) => (
  <DialogContent
    {...props}
    className={['yen-dialog-content', className].filter(Boolean).join(' ')}
  />
);

export const YenDialogActions: React.FC<DialogActionsProps> = ({
  className,
  ...props
}) => (
  <DialogActions
    {...props}
    className={['yen-dialog-actions', className].filter(Boolean).join(' ')}
  />
);

export default YenDialog;
