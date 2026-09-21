
// export default AssetDialog;
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
} from '@mui/material';

interface AssetData {
  assetName: string;
  serialNo: string;
}

interface ValidationErrors {
  assetName: string;
  serialNo: string;
}

interface AssetDialogProps {
  open: boolean;
  editMode: boolean;
  assetData: AssetData;
  validationErrors: ValidationErrors;
  isSubmitting: boolean;
  handleDialogClose: (event: React.SyntheticEvent, reason: "backdropClick" | "escapeKeyDown") => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
  handleClose: () => void;
}

const AssetDialog: React.FC<AssetDialogProps> = ({
  open,
  editMode,
  assetData,
  validationErrors,
  isSubmitting,
  handleDialogClose,
  handleChange,
  handleSubmit,
  handleClose,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Only allow numbers (0-9), backspace, delete, tab, and arrow keys
    if (!/[0-9]|Backspace|Delete|Tab|Arrow/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <Dialog open={open} onClose={handleDialogClose}>
      <DialogTitle>{editMode ? 'Edit' : 'Add'} Asset</DialogTitle>
      <DialogContent>
        <TextField
          autoComplete='off'
          margin="dense"
          label="Asset Name"
          name="assetName"
          value={assetData.assetName}
          onChange={handleChange}
          fullWidth
          required
          error={!!validationErrors.assetName}
          helperText={validationErrors.assetName}
          disabled={isSubmitting}
        />
        <TextField
          autoComplete='off'
          margin="dense"
          label="Serial No"
          name="serialNo"
          value={assetData.serialNo}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          fullWidth
          required
          error={!!validationErrors.serialNo}
          helperText={validationErrors.serialNo}
          disabled={isSubmitting}
          inputProps={{
            inputMode: 'numeric', // Shows numeric keyboard on mobile
            pattern: '[0-9]*', // HTML5 validation
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {editMode ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssetDialog;