
'use client';
import React, { useCallback, useState } from 'react';
import { Reasons } from '../Models/reasonModels';
import {
  Box,
  IconButton,FormControlLabel, Popover,
  Switch,
  Typography,
 } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';

export interface ReasonTableProps {
  items: Reasons[];
  loading: boolean;
  viewDeactivated: boolean;
  setViewDeactivated: (value: boolean) => void;
  handleOpen: () => void;
  handleEdit: (reason: Reasons) => void;
  handleDeactivate: (reason: Reasons) => void;
  handleActivate: (reason: Reasons) => void;
}

const ReasonTableComponent: React.FC<ReasonTableProps> = ({
  items,loading,
  viewDeactivated,
  setViewDeactivated,
  handleOpen,
  handleEdit,
  handleDeactivate,
  handleActivate,
}) => {
const label = viewDeactivated ? 'Show Activated' : 'Show Deactivated';
 
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  const handleClickReasons = useCallback(
    (event: React.MouseEvent<HTMLElement>, reasonList: string[]) => {
      setAnchorEl(event.currentTarget);
      setSelectedReasons(reasonList);
    },
    []
  );

  const handleClosePopover = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const openPopover = Boolean(anchorEl);
const filtered = items.filter((reason) =>
    viewDeactivated
      ? reason.status === 'deactivated'
      : reason.status === 'active'
  );

  return (
    <>
       <Box className="item-master-toolbar-shell">
        <Box className="purchase-reference-toolbar item-master-toolbar">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography className="yen-pos-toolbar-title">
              {viewDeactivated ? 'Deactivated Reasons' : 'Active Reasons'}
            </Typography>
          </Box>

          <Box className="purchase-reference-actions item-master-actions">
             {!viewDeactivated && (
             <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
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
            )}

            <FormControlLabel
              className="purchase-reference-active-toggle item-master-active-toggle"
              control={
                <Switch
                  checked={viewDeactivated}
                  onChange={() => setViewDeactivated(!viewDeactivated)}
                  color="primary"
                  size="small"
                />
              }
              label={label}
            />
          </Box>
        </Box>

      </Box>

       <div className="item-master-table-container">
        <table className="item-master-table item-master-lookup-table item-master-lookup-table--4 yen-pos-reason-table">

          <thead>
            <tr>
               <th>S.NO</th>
              <th>Reason Name</th>
              <th>Reasons</th>
              <th>Actions</th>
            </tr>
          </thead>
         <tbody>
  {loading ? (
    <tr>
      <td colSpan={4} className="empty-state">
        <h2>Loading...</h2>
      </td>
    </tr>
  ) : (
    <>
      {filtered.map((reason, index) => (
        <tr
          key={reason.id}
          className="item-master-data-row"
        >
          <td>
            {index + 1}
          </td>

          <td>
            {reason.module || '-'}
          </td>

          <td>
            <button
              type="button"
              onClick={(event) =>
                handleClickReasons(
                  event,
                  reason.reason || []
                )
              }
              disabled={
                !reason.reason ||
                reason.reason.length === 0
              }
              className="yen-pos-view-pill"
            >
              {reason.reason?.length || 0} SELECTED
            </button>
          </td>

          <td className="item-master-actions-cell">
            <div>
              {viewDeactivated ? (
                <IconButton
                  onClick={() =>
                    handleActivate(reason)
                  }
                  className="purchase-master-action-button is-activate"
                  title="Activate"
                  size="small"
                >
                  <RestoreRoundedIcon />
                </IconButton>
              ) : (
                <>
                  <IconButton
                    onClick={() =>
                      handleEdit(reason)
                    }
                    className="purchase-master-action-button is-edit"
                    title="Edit"
                    size="small"
                  >
                    <EditOutlinedIcon />
                  </IconButton>

                  <IconButton
                    onClick={() =>
                      handleDeactivate(reason)
                    }
                    className="purchase-master-action-button is-delete"
                    title="Deactivate"
                    size="small"
                  >
                    <DeleteOutlineRoundedIcon />
                  </IconButton>
                </>
              )}
            </div>
          </td>
        </tr>
      ))}

      {filtered.length === 0 && (
        <tr>
          <td
            colSpan={4}
            className="empty-state"
          >
            <h2>No data found</h2>
          </td>
        </tr>
      )}
    </>
  )}
</tbody>
        </table>
      </div>

      <Popover
        open={openPopover}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
      PaperProps={{ className: 'custom-popover' }}
      >
        <div className="custom-popover yen-pos-reasons-popover">
          {selectedReasons.map((reasonText, index) => (
            <h4 key={index}>{reasonText}</h4>
          ))}
        </div>
      </Popover>
    </>
  );
};

export default ReasonTableComponent;