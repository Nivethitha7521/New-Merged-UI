

'use client';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../redux/store';
import {
  Box,
  IconButton,
  Popover,Button,
  Switch,
  Typography,
  FormControlLabel,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

interface AddOn {
  id: string;
  addOn: string;
  value: number;
  status: string;
  addOnId: string;
  addOnItems: string[];
}

interface AddOnTableContainerProps {
  handleEdit: (addOn: AddOn) => void;
  handleDeactivate: (addOn: AddOn) => void;
  handleActivate: (addOn: AddOn) => void;
  handleOpen: () => void;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
}

const AddOnTableContainer: React.FC<AddOnTableContainerProps> = ({
  handleEdit,
  handleDeactivate,
  handleActivate,
  handleOpen,
  showDeactivated,
  setShowDeactivated,
}) => {
  const {
    items: addOns = [],
    deactivatedItems = [],
    loading,
  } = useSelector((state: RootState) => state.addOn);

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
const visibleAddOns = showDeactivated ? deactivatedItems : addOns;

  return (
    <Box className="kot-master-page kot-master-addon-page">
      <Box className="kot-master-toolbar">
        <Typography className="kot-master-toolbar-title">
          {showDeactivated ? 'Deactivated Addons' : 'Active Addons'}
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
              <th>AddOn ID</th>
              <th>AddOn Name</th>
              <th>Value</th>
              <th>Variances</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
           
              {visibleAddOns.map((addOn, index) => (
              <tr key={addOn.addOnId || index}>
                <td>{index + 1}</td>
                <td>{addOn.addOnId}</td>
                <td>{addOn.addOn}</td>
                <td>{addOn.value}</td>
                <td>
                  <button
                    type="button"
                    onClick={(event) => handleClickVariances(event, addOn.addOnItems || [])}
                    disabled={!addOn.addOnItems || addOn.addOnItems.length === 0}
                    className="kot-master-variance-pill"
                  >
                    {addOn.addOnItems?.length || 0} SELECTED
                  </button>
                </td>
                <td className="kot-master-actions-cell">
                  {showDeactivated ? (
                    <button
                      type="button"
                      onClick={() => handleActivate(addOn)}
                      className="activate-btn kot-master-row-action"
                      title="Activate"
                      aria-label={`Activate ${addOn.addOn}`}
                    >
                      <RefreshRoundedIcon />
                    </button>
                  ) : (
                    <>

                      <button
type="button"
                        onClick={() => handleEdit(addOn)}
                        className="edit-btn kot-master-row-action"
                        title="Edit"
                        aria-label={`Edit ${addOn.addOn}`}
                      >
                       <EditOutlinedIcon />
                      </button>
                    <button
                        type="button"
                        onClick={() => handleDeactivate(addOn)}
                        className="deactivate-btn kot-master-row-action"
                        title="Deactivate"
                        aria-label={`Deactivate ${addOn.addOn}`}
                      >
                        <DeleteOutlineRoundedIcon />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {visibleAddOns.length === 0 && (
              <tr>
                <td colSpan={6} className="kot-master-empty-cell">
                  {showDeactivated
                    ? 'No deactivated addOns found'
                    : 'No active addOns found'}
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

export default AddOnTableContainer;