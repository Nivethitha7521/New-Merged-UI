'use client';
import React from 'react';
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

// Explicitly import ChangeEvent from React
import { ChangeEvent } from 'react';

interface PurchaseTaxActionsProps {
  searchQuery: string;
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDialogOpen: () => void;
  showDeactivated: boolean;
  onToggleShowDeactivated: () => void;
   permissions?: {
    add?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
}

const PurchaseTaxActions: React.FC<PurchaseTaxActionsProps> = ({
  searchQuery,
  onSearchChange,
  onDialogOpen,
  showDeactivated,
  onToggleShowDeactivated, permissions = { add: true, edit: true, delete: true },
}) => {
 const { add = true } = permissions;
return (
  <Box className="purchase-reference-toolbar-section">
    <Box className="purchase-reference-toolbar">
      <TextField
        autoComplete="off"
        placeholder="Search by tax name or ID..."
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
          onClick={onDialogOpen}
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
            size="small"
          />
        </Box>
      </Box>
    </Box>
  </Box>
);
};

export default PurchaseTaxActions;