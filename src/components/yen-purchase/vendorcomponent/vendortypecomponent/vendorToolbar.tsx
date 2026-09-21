'use client';
import React from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Switch,
} from '@mui/material';

import {
  Add as AddIcon,
  SearchRounded as SearchIcon,
} from '@mui/icons-material';

interface VendorToolbarProps {
  searchQuery: string;
  showDeactivated: boolean;
  onSearch: (query: string) => void;
  onAdd: () => void;
  onToggleDeactivated: () => void;
  showAddButton: boolean;
}

const VendorToolbar: React.FC<VendorToolbarProps> = ({
  searchQuery,
  showDeactivated,
  onSearch,
  onAdd,
  onToggleDeactivated,
  showAddButton = true,
}) => {
return (
  <Box className="purchase-reference-toolbar-section">
    <Box className="purchase-reference-toolbar">
      <TextField
        autoComplete="off"
        type="search"
        placeholder="Search by vendor type name or ID..."
        variant="outlined"
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        className="purchase-reference-search"
        InputProps={{
          startAdornment: (
            <SearchIcon className="purchase-reference-search-icon" />
          ),
        }}
      />

      <Box className="purchase-reference-actions">
        {showAddButton && (
          <Button
            type="button"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={onAdd}
            className="purchase-reference-action-button"
          >
            Add New
          </Button>
        )}

        <Box className="purchase-reference-active-toggle">
          <Typography component="span">
            Show Active Only
          </Typography>

          <Switch
            checked={!showDeactivated}
            onChange={onToggleDeactivated}
            size="small"
            inputProps={{
              'aria-label': 'Show active vendor types only',
            }}
          />
        </Box>
      </Box>
    </Box>
  </Box>
);
};

export default VendorToolbar;