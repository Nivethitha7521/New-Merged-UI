'use client';

import React, { useId } from 'react';
import { Modal } from '@mui/material';
import type { ConfirmTone } from './feedbackBus';
import { ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from './feedbackIcons';

export interface ConfirmDialogViewProps {
  open: boolean;
  title?: React.ReactNode;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  /** Shows a spinner in the confirm button and locks the dialog. */
  loading?: boolean;
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ToneIcon: React.FC<{ tone: ConfirmTone }> = ({ tone }) => {
  if (tone === 'danger') return <ErrorIcon size={24} />;
  if (tone === 'warning') return <WarningIcon size={24} />;
  if (tone === 'success') return <SuccessIcon size={24} />;
  return <InfoIcon size={24} />;
};

/**
 * The ONE confirmation-dialog UI for the whole ERP.
 *
 * - Built on MUI <Modal> (focus trap, Escape, scroll lock, aria) but NOT on
 *   <Dialog>/<Paper>, so none of the per-module `.dialog-paper`, `.btn-primary`,
 *   `.MuiDialog-paper` overrides can reach it.
 * - All styling lives in feedback.css under unique `yen-fb-*` class names.
 * - Presentation only: it owns no business logic. Callers own open/loading state.
 */
export const ConfirmDialogView: React.FC<ConfirmDialogViewProps> = ({
  open,
  title = 'Confirmation',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'primary',
  loading = false,
  hideCancel = false,
  onConfirm,
  onCancel,
}) => {
  const uid = useId();
  const titleId = `yen-fb-title-${uid}`;
  const messageId = `yen-fb-message-${uid}`;

  const requestCancel = () => {
    if (!loading) onCancel();
  };

  // Destructive dialogs focus "Cancel" first so a stray Enter can't delete anything.
  const focusCancel = tone === 'danger' && !hideCancel;

  return (
    <Modal
      open={open}
      onClose={requestCancel}
      hideBackdrop
      className="yen-fb-modal"
      style={{ zIndex: 1700 }}
    >
      <div
        className="yen-fb-layer"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) requestCancel();
        }}
      >
        <div
          className={`yen-fb-dialog yen-fb-tone-${tone}`}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={message ? messageId : undefined}
          aria-busy={loading || undefined}
        >
          <div className="yen-fb-dialog-body">
            <span className="yen-fb-dialog-icon" aria-hidden="true">
              <ToneIcon tone={tone} />
            </span>
            <div className="yen-fb-dialog-copy">
              <div className="yen-fb-dialog-title" id={titleId}>
                {title}
              </div>
              {message ? (
                <div className="yen-fb-dialog-message" id={messageId}>
                  {message}
                </div>
              ) : null}
            </div>
          </div>

          <div className="yen-fb-dialog-actions">
            {!hideCancel && (
              <button
                type="button"
                className="yen-fb-btn yen-fb-btn-secondary"
                onClick={requestCancel}
                disabled={loading}
                autoFocus={focusCancel}
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              className="yen-fb-btn yen-fb-btn-primary"
              onClick={onConfirm}
              disabled={loading}
              autoFocus={!focusCancel}
            >
              {loading ? (
                <>
                  <span className="yen-fb-spinner" aria-hidden="true" />
                  <span className="yen-fb-sr-only">Please wait</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialogView;
