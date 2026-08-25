'use client';
import React, { useRef } from 'react';
import {
  Box,
  TextField,
  Switch,
  Button,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  SearchRounded as SearchIcon,
} from '@mui/icons-material';

interface UOMActionsProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
   onDialogOpen: (action?: 'add' | 'edit') => void; // ✅ UPDATE TYPE
  showDeactivated: boolean;
  onToggleShowDeactivated: () => void;
   permissions?: { // ✅ ADD PERMISSIONS PROP
    add?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
}

const UOMActions: React.FC<UOMActionsProps> = ({
  searchQuery,
  onSearchChange,
  onDialogOpen,
  showDeactivated,
  onToggleShowDeactivated,
  permissions = { add: true, edit: true, delete: true } // ✅ DEFAULT PERMISSIONS
}) => {
  
const { add = true } = permissions; // ✅ DESTRUCTURE PERMISSIONS
return (
  <Box className="purchase-reference-toolbar-section">
    <Box className="purchase-reference-toolbar">
      <TextField
        autoComplete="off"
        placeholder="Search by UOM name or ID..."
        variant="outlined"
        value={searchQuery}
        onChange={onSearchChange}
        className="purchase-reference-search"
        InputProps={{
          startAdornment: (
            <SearchIcon className="purchase-reference-search-icon" />
          ),
        }}
      />

      <Box className="purchase-reference-actions">
        <Button
          type="button"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => onDialogOpen('add')}
          disabled={!add}
          className="purchase-reference-action-button"
        >
          Add New
        </Button>

        <Box className="purchase-reference-active-toggle">
          <Typography component="span">
            Show Active Only
          </Typography>

          <Switch
            checked={!showDeactivated}
            onChange={onToggleShowDeactivated}
            name="showDeactivated"
            size="small"
          />
        </Box>
      </Box>
    </Box>
  </Box>
);
};

export default UOMActions;