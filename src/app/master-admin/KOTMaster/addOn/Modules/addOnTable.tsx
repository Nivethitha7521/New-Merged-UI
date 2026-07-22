

'use client';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../redux/store';
import {
  Box,
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
          {showDeactivated ? "Deactivated Addons" : "Active Addons"}
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
              <th>AddOn Id</th>
              <th>AddOn Name</th>
              <th>Value</th>
              <th>Variances</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
           
              <>
                {(showDeactivated ? deactivatedItems : addOns).map((addOn, index) => (
                  <tr key={addOn.addOnId || index}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ textAlign: 'center' }}>{addOn.addOnId}</td>
                    <td style={{ textAlign: 'center' }}>{addOn.addOn}</td>
                    <td style={{ textAlign: 'center' }}>{addOn.value}</td>
                    <td style={{ textAlign: 'center' }}>

                      <button
                        onClick={(e) => handleClickVariances(e, addOn.addOnItems || [])}
                        disabled={!addOn.addOnItems || addOn.addOnItems.length === 0}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: addOn.addOnItems?.length ? "#030303ff" : "#056eb4ff",   // Blue when clickable, gray when disabled
                          fontWeight: "500",
                          cursor: addOn.addOnItems?.length ? "pointer" : "default",
                          padding: "4px 8px",
                          borderRadius: "4px",
                        }}
                        onMouseEnter={(e) => {
                          if (addOn.addOnItems?.length) {
                            e.currentTarget.style.textDecoration = "underline";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (addOn.addOnItems?.length) {
                            e.currentTarget.style.textDecoration = "none";
                          }
                        }}
                      >
                        {addOn.addOnItems?.length || 0} SELECTED
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {showDeactivated ? (
                        <button
                          color="primary"
                          onClick={() => handleActivate(addOn)}
                          className='activate-btn'
                          title='Activate'
                        >
                          <RefreshIcon />
                        </button>
                      ) : (
                        <>
                          <button color="primary" onClick={() => handleEdit(addOn)} className='edit-btn' title='Edit'>
                            <EditIcon />
                          </button>

                          <button
                            color="primary"
                            onClick={() => handleDeactivate(addOn)}
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
                {(showDeactivated ? deactivatedItems : addOns).length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center' }}>
                      <h2>
                        {showDeactivated ? 'No deactivated addOns found' : 'No active addOns found'}
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

export default AddOnTableContainer;