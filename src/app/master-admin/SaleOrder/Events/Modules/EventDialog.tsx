'use client';
import React, { useEffect, useRef } from "react";
import { Event } from "../Models/eventModels";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";


export interface EventDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  eventData: Event;
  loading: boolean;
  mode: "Edit" | "Add";
  validationErrors: {
    eventname: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}





// ─── Validation helpers ───────────────────────────────────────────────────────

// At least one letter required
const hasLetter = /[a-zA-Z]/;

// Shows "Must contain at least one letter" if value has no letter,
// otherwise returns the parent validation error
const getHelperText = (value: string, parentError: string): string => {
  if (value && !hasLetter.test(value)) return 'Must contain at least one letter';
  return parentError;
};

// Returns true if field has a value but no letter — used for error highlight + submit block
const hasLetterError = (value: string): boolean =>
  !!value && !hasLetter.test(value);

// Strips all special chars (keeps letters, digits, spaces, - . ,) and caps at 30,
// then forwards a synthetic event to the parent handler
const createTextHandler = (
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
) => (e: React.ChangeEvent<HTMLInputElement>) => {
  const filtered = e.target.value
    .replace(/[^a-zA-Z0-9\s\-.,]/g, '')
    .slice(0, 30);
  const syntheticEvent = {
    ...e,
    target: { ...e.target, value: filtered, name: e.target.name },
  } as React.ChangeEvent<HTMLInputElement>;
  handleChange(syntheticEvent);
};




const EventDialog: React.FC<EventDialogProps> = ({
  open,
  loading,
  mode,
  onClose,
  onSubmit,
  eventData,
  validationErrors,
  handleChange,
}) => {



  const inputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = createTextHandler(handleChange);


  // ← ADD THIS: Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Select text if editing existing record
          if (eventData.eventId) {
            inputRef.current.select();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, eventData.eventId]);


  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: "dialog-paper-small",
      }}
      TransitionProps={{
        // ← ADD THIS: Fallback focus on transition end
        onEntered: () => {
          if (inputRef.current) {
            inputRef.current.focus();
            if (eventData.eventId) {
              inputRef.current.select();
            }
          }
        }
      }}
    >
      <DialogTitle className="dialog-title">
        {eventData.eventId ? "Edit" : "Add"} Event
      </DialogTitle>
      <DialogContent className="dialog-content">
        <div className="form-section">
          <TextField
            label="Event Name"
            name="eventname"
            autoComplete="off"
            type="text"
            value={eventData.eventname}
            onChange={handleTextChange}
            inputProps={{ maxLength: 30 }}
            margin="normal"
            fullWidth
            inputRef={inputRef}
            error={!!validationErrors.eventname}
            helperText={validationErrors.eventname}
            className="custom-textfield"
            InputLabelProps={{ className: "custom-label" }}
            InputProps={{ className: "custom-input" }}
          />

          <TextField
            label="Remarks"
            name="remarks"
            autoComplete="off"
            value={eventData.remarks}
           onChange={handleTextChange}
            inputProps={{ maxLength: 30 }}
            margin="normal"
            fullWidth
            className="custom-textfield"
            InputLabelProps={{ className: "custom-label" }}
            InputProps={{ className: "custom-input" }}
          />
        </div>
      </DialogContent>
    <DialogActions className="dialog-actions">
        <button onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={onSubmit}
          className="btn-primary"
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : eventData.eventId ? (
            'Update'
          ) : (
            'Create'
          )}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default EventDialog;