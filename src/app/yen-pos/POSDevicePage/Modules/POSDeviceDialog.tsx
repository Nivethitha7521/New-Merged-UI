


import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
  Switch,
} from '@mui/material';
import { Device } from "../Models/PosDeviceModel";

type InputOrSelectChangeEvent =
  | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  | SelectChangeEvent<string>;

interface ValidationErrors {
  deviceName: string;
  branchName: string;
  companyName: string;
}

interface POSDeviceDialogProps {
  open: boolean;
  isOpen: boolean;
  mode: 'add' | 'edit';
  deviceData: Device;
  branchOptions: { value: string; label: string; alias: string }[];
  isSubmitting: boolean;
  validationErrors: ValidationErrors;
  handleClose: () => void;
  handleChange: (event: InputOrSelectChangeEvent) => void;
  handleGenerateCode: () => void;
  handleSubmit: () => void;

  serverConflict: { existingDevice: Device | null } | null;
  onServerConflictCancel: () => void;
  onServerConflictConfirm: () => void;
}

const POSDeviceDialog: React.FC<POSDeviceDialogProps> = ({
  open,
  isOpen,
  mode,
  deviceData,
  branchOptions,
  isSubmitting,
  validationErrors,
  handleClose,
  handleChange,
  handleGenerateCode,
  handleSubmit,
  serverConflict,
  onServerConflictCancel,
  onServerConflictConfirm
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        if (deviceData.id) inputRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, deviceData.id]);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: "dialog-paper-medium",
      }}
      TransitionProps={{
        onEntered: () => {
          inputRef.current?.focus();
          if (deviceData.id) inputRef.current?.select();
        },
      }}
    >

      <DialogTitle className="dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2 }}>
        <span>{mode === 'edit' ? 'Edit Device' : 'Add New Device'}</span>

        {/* isServer Toggle — Header Right Corner */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '12px', fontFamily: "'Poppins', sans-serif", color: 'inherit' }}>
            Is-Server
          </span>
          <Switch
            name="isServer"
            checked={deviceData.isServer ?? false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange({
                target: { name: 'isServer', value: e.target.checked },
              } as any)
            }
            disabled={isSubmitting}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#fff',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#4caf50',
              },
            }}
          />
          <span style={{
            fontSize: '12px',
            fontFamily: "'Poppins', sans-serif",
            color: deviceData.isServer ? '#4caf50' : '#9e9e9e',
            minWidth: '52px',
          }}>
            {deviceData.isServer ? 'Enabled' : 'Disabled'}
          </span>
        </Box>
      </DialogTitle>

      <DialogContent dividers className="dialog-content">
        <div className="form-section">

          {/* Row 1: Device Name | Original Name | Branch Name */}
          <div className="form-grid-manager" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
            {/* Device Name */}
            <div className="form-field">
              <TextField
                label="Device Name "
                name="deviceName"
                value={deviceData.deviceName || ''}
                onChange={handleChange}
                fullWidth
                required
                inputRef={inputRef}
                disabled={isSubmitting}
                autoComplete="off"
                error={!!validationErrors.deviceName}
                helperText={validationErrors.deviceName}
                className="custom-textfield"
                InputLabelProps={{ className: "custom-label" }}
                InputProps={{ className: "custom-input" }}
              />
            </div>

            {/* Device Original Name */}
            <div className="form-field">
              <TextField
                label="Device Original Name "
                name="companyName"
                value={deviceData.companyName || ''}
                onChange={handleChange}
                fullWidth
                required
                disabled={isSubmitting}
                autoComplete="off"
                error={!!validationErrors.companyName}
                helperText={validationErrors.companyName}
                className="custom-textfield"
                InputLabelProps={{ className: "custom-label" }}
                InputProps={{ className: "custom-input" }}
              />
            </div>

            {/* Branch Name */}
            <div className="form-field">
              <FormControl
                fullWidth
                //  disabled={isSubmitting}
                disabled={isSubmitting || mode === 'edit'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgb(156, 163, 175)',  // ⭐ focus border color
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'rgb(156, 163, 175)',  // ⭐ label color on focus
                  },
                  '& .MuiInputBase-root': {
                    height: 45,
                    fontSize: '12px',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '13px',
                    minHeight: '32px',
                  },
                }}
              >
                <InputLabel className="custom-label">Branch Name *</InputLabel>
                <Select
                  name="branchName"
                  value={deviceData.branchName || ''}
                  onChange={handleChange}
                  label="Branch Name *"
                  error={!!validationErrors.branchName}
                  required
                  className="custom-textfield"
                  inputProps={{ className: "custom-input" }}
                  MenuProps={{ PaperProps: { style: { maxHeight: 150 } }, }}
                >
                  {branchOptions.length > 0 ? (
                    branchOptions.map((opt) => (
                      <MenuItem
                        key={opt.value}
                        value={opt.value}
                        sx={{
                          fontSize: '12px',
                          minHeight: '16px',
                          paddingY: '8px',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        {opt.label}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No branches available</MenuItem>
                  )}

                </Select>
                {validationErrors.branchName && (
                  <Box sx={{ fontSize: '0.75rem', color: '#d32f2f', ml: 1.75, mt: 0.5 }}>
                    {validationErrors.branchName}
                  </Box>
                )}
              </FormControl>
            </div>
          </div>

          {/* Row 2: Alias Name | Till ID | Device Code */}
          <div className="form-grid-manager" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
            {/* Alias Name (read-only) */}
            <div className="form-field">
              <TextField
                label="Alias Name"
                name="alaisName"
                value={deviceData.aliasName || ''}
                fullWidth
                disabled={isSubmitting}
                InputProps={{
                  readOnly: true,
                  className: "custom-input",
                  style: { backgroundColor: '#f9f9f9' },
                }}
                sx={{ '& .MuiInputBase-root': { pointerEvents: 'none' } }}
                className="custom-textfield"
                InputLabelProps={{ className: "custom-label" }}
              />
            </div>

            {/* Till ID (read-only) */}
            <div className="form-field">
              <TextField
                label="Till ID"
                name="tillId"
                value={deviceData.tillId || ''}
                fullWidth
                disabled={isSubmitting}
                InputProps={{
                  readOnly: true,
                  className: "custom-input",
                  style: { backgroundColor: '#f9f9f9' },
                }}
                sx={{ '& .MuiInputBase-root': { pointerEvents: 'none' } }}
                className="custom-textfield"
                InputLabelProps={{ className: "custom-label" }}
              />
            </div>

            {/* Device Code (read-only) */}
            <div className="form-field">
              <TextField
                label="Device Code"
                name="deviceCode"
                value={deviceData.deviceCode || ''}
                fullWidth
                disabled={isSubmitting}
                InputProps={{
                  readOnly: true,
                  className: "custom-input",
                  style: { backgroundColor: '#f9f9f9' },
                }}
                sx={{ '& .MuiInputBase-root': { pointerEvents: 'none' } }}
                className="custom-textfield"
                InputLabelProps={{ className: "custom-label" }}
              />
            </div>
          </div>

          {/* Row 3: Description + Generate Button */}
          <div className="form-grid-manager" style={{ gap: '0.75rem', alignItems: 'flex-end' }}>
            {/* Description */}
            <div className="form-field form-field-span-2" style={{ flex: '1 1 65%' }}>
              <TextField
                label="Description"
                name="description"
                value={deviceData.description || ''}
                onChange={handleChange}
                fullWidth
                // multiline
                disabled={isSubmitting}
                autoComplete="off"
                className="custom-textfield"
                InputLabelProps={{ className: "custom-label" }}
                InputProps={{ className: "custom-input" }}
              />
            </div>

            {/* Generate / Regenerate Button */}
            <div className="form-field" style={{ flex: '1 1 35%', display: 'flex' }}>
              <button
                onClick={handleGenerateCode}
                disabled={isSubmitting}
                className="btn-primary"
                style={{ height: 40, minWidth: 140 }}
              >
                {mode === 'edit' ? 'Device Code Regenerate' : 'Device Code Generate'}
              </button>
            </div>
          </div>

        </div>
      </DialogContent>

      <DialogActions className="dialog-actions">
        <button onClick={handleClose} disabled={isSubmitting} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting && <CircularProgress size={20} />}
          {mode === 'edit' ? 'Update' : 'Create'}
        </button>
      </DialogActions>


      {/* isServer conflict confirmation dialog */}
      <Dialog
        open={!!serverConflict}
        onClose={onServerConflictCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: "'Poppins', sans-serif", fontSize: '14px', fontWeight: 600 }}>
          Change Server Device?
        </DialogTitle>
        <DialogContent>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
            Do you want to set <strong>{deviceData.deviceName}</strong> as the server?
            <br />
            <strong style={{ color: '#e57373' }}>{serverConflict?.existingDevice?.deviceName}</strong> is
            currently the server and will be changed to <strong>Client</strong>.
          </p>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <button onClick={onServerConflictCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onServerConflictConfirm} className="btn-primary">
            Confirm
          </button>
        </DialogActions>
      </Dialog>

    </Dialog>
  );
};

export default POSDeviceDialog;