

'use client';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../redux/store';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Popover,
  Switch,
  Typography,
  FormControlLabel,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';


interface Variant {
  id: string;
  variant: string;
  status: string;
  variantId: string;
  variantItems: string[];
}

interface VariantTableContainerProps {
  handleEdit: (variant: Variant) => void;
  handleDeactivate: (variant: Variant) => void;
  handleActivate: (variant: Variant) => void;
  handleOpen: () => void;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
}

const VariantTableContainer: React.FC<VariantTableContainerProps> = ({
  handleEdit,
  handleDeactivate,
  handleActivate,
  handleOpen,
  showDeactivated,
  setShowDeactivated,
}) => {
  const {
    items: variants = [],
    deactivatedItems = [],
    loading,
  } = useSelector((state: RootState) => state.variants);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedVariances, setSelectedVariances] = useState<string[]>([]);

  const handleClickVariances = (event: React.MouseEvent<HTMLElement>, variances: string[]) => {
    setAnchorEl(event.currentTarget);
    setSelectedVariances(variances);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'variances-popover' : undefined;

  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';
const visibleVariants = showDeactivated ? deactivatedItems : variants;  

return (
  <Box className="kot-master-page">
    <Box className="kot-master-toolbar">
      <Typography className="kot-master-section-title">
        {showDeactivated
          ? 'Deactivated Variants'
          : 'Active Variants'}
      </Typography>

      <Box className="kot-master-toolbar-actions">
          {!showDeactivated && (
             <Button
              type="button"
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={handleOpen}
              className="purchase-reference-action-button kot-master-action-button"
            >
              Add
            </Button>
          )}
      <Box className="purchase-reference-active-toggle kot-master-status-toggle">
        <FormControlLabel
          control={
            <Switch
              checked={showDeactivated}
              onChange={() => setShowDeactivated(!showDeactivated)}
              color="primary"
              size="small"
            />
          }
          label={label}
          className="kot-master-toggle-label"
        />
      </Box>
    </Box>
  </Box>

  <div className="kot-master-table-container">
        <table className="custom-table kot-master-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>Variant ID</th>
              <th>Variant Name</th>
              <th>Variances</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleVariants.map((variant, index) => (
              <tr key={variant.variantId || index}>
                <td>{index + 1}</td>
                <td>{variant.variantId}</td>
                <td>{variant.variant}</td>
                <td>
                  <button
                    type="button"
                    onClick={(event) => handleClickVariances(event, variant.variantItems || [])}
                    disabled={!variant.variantItems || variant.variantItems.length === 0}
                    className="kot-master-variance-pill"
                  >
                    {variant.variantItems?.length || 0} SELECTED
                  </button>
                </td>
                <td className="kot-master-actions-cell">
                  {showDeactivated ? (
                    <button
                      type="button"
                      onClick={() => handleActivate(variant)}
                      className="activate-btn kot-master-row-action"
                     title="Activate"
                      aria-label={`Activate ${variant.variant}`}
                    >
                      <RefreshRoundedIcon />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEdit(variant)}
                        className="edit-btn kot-master-row-action"
                        title="Edit"
                        aria-label={`Edit ${variant.variant}`}
                      >
                        <EditOutlinedIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeactivate(variant)}
                        className="deactivate-btn kot-master-row-action"
                        title="Deactivate"
                        aria-label={`Deactivate ${variant.variant}`}
                      >
                        <DeleteOutlineRoundedIcon />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
     


        {visibleVariants.length === 0 && (
              <tr>
              <td colSpan={5} className="kot-master-empty-cell">
                  {showDeactivated
                    ? 'No deactivated variants found'
                    : 'No active variants found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        // anchorOrigin={{
        //   vertical: "bottom",
        //   horizontal: "center",
        // }}
        // transformOrigin={{
        //   vertical: "top",
        //   horizontal: "center",
        // }}
        PaperProps={{ className: 'custom-popover kot-master-popover' }}
      >
        <div className="custom-popover kot-master-popover-content">
          {selectedVariances.map((variance, index) => (
            <h4 key={index}>{variance}</h4>
          ))}
        </div>
      </Popover>
    </Box>
  );
};

export default VariantTableContainer;
