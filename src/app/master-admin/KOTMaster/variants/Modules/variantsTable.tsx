

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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';


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


  return (
    <Box>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={0}
        my={1}
        ml={1}
        px={{ xs: 2, sm: 3 }}
        sx={{ width: "99%", boxSizing: "border-box", mt: 1 }}
      >
        <Typography className='icon-action-label'
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 750,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }}
        >
          {showDeactivated ? "Deactivated Variants" : "Active Varinats"}
        </Typography>

        <div className="flex items-center gap-4">
          {!showDeactivated && (
            <>
              <div className="icon-action-wrapper">
                <IconButton
                  color="primary"
                  onClick={handleOpen}
                  className="icon-action-button"
                  title="Add"
                >
                  <AddIcon className="icon-action-svg" />
                </IconButton>
                <Typography className="icon-action-label">Add</Typography>
              </div>
            </>
          )}
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
            sx={{
              marginLeft: 1,
              marginRight: 1,
              "& .MuiFormControlLabel-label": {
                fontSize: "0.75rem",
                fontFamily: "'Poppins', sans-serif",
              },
            }}
          />
        </div>
      </Box>


        <div className="table-container my-1" style={{ maxHeight: 'calc(90.5vh - 170px)' }}>
          <table className="custom-table">
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

                <>
                  {(showDeactivated ? deactivatedItems : variants).map((variant, index) => (
                    <tr key={variant.variantId || index}>
                      <td style={{ textAlign: 'center' }}>{index + 1}</td>
                      <td style={{ textAlign: 'center' }}>{variant.variantId}</td>
                      <td style={{ textAlign: 'center' }}>{variant.variant}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={(e) => handleClickVariances(e, variant.variantItems || [])}
                          disabled={!variant.variantItems || variant.variantItems.length === 0}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: variant.variantItems?.length ? "#252527ff" : "#999",   // Blue when clickable, gray when disabled
                            fontWeight: "500",
                            cursor: variant.variantItems?.length ? "pointer" : "default",
                            padding: "4px 8px",
                            borderRadius: "4px",
                          }}
                          onMouseEnter={(e) => {
                            if (variant.variantItems?.length) {
                              e.currentTarget.style.textDecoration = "underline";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (variant.variantItems?.length) {
                              e.currentTarget.style.textDecoration = "none";
                            }
                          }}
                        >
                          {variant.variantItems?.length || 0} SELECTED
                        </button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {showDeactivated ? (
                          <button
                            color="primary"
                            onClick={() => handleActivate(variant)}
                            className='activate-btn'
                            title='Activate'
                          >
                            <RefreshIcon />
                          </button>
                        ) : (
                          <>
                            <button color="primary" onClick={() => handleEdit(variant)} className='edit-btn' title='Edit'>
                              <EditIcon />
                            </button>
                            <button
                              color="primary"
                              onClick={() => handleDeactivate(variant)}
                              className='deactivate-btn'
                              title='Deactivate'
                            >
                              <DeleteIcon />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(showDeactivated ? deactivatedItems : variants).length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center' }}>
                        <h2 >
                          {showDeactivated ? 'No deactivated variants found' : 'No active variants found'}
                        </h2>
                      </td>
                    </tr>
                  )}
                </>
            
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
        PaperProps={{
          className: "custom-popover",
        }}
      >
        <div className="custom-popover">
          {selectedVariances.map((variance, index) => (
            <h4 key={index}>{variance}</h4>
          ))}
        </div>
      </Popover>
    </Box>
  );
};

export default VariantTableContainer;
