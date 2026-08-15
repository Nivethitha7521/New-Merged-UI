'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import SearchIcon from '@mui/icons-material/Search';

import { RootState, AppDispatch } from '../../../../redux/store';
import {
  fetchWhatsApps,
  setWhatsAppData,
  setDialogOpen,
  updateWhatsApp,
  setSnackbarMessage,
  setSnackbarOpen,
} from '../Features/whatsAppSlice';
import { WhatsApp as WhatsAppType } from '../Models/whatsappAdminModels';
import ActivateDeactivateConfirmationDialog from '../../../Components/Dialogs/ActivateDeactivateConfirmationDialog';
 
interface WhatsAppTableComponentProps {
  viewDeactivated: boolean;
  setViewDeactivated: (value: boolean) => void;
  handleOpen: () => void;
}

const WhatsAppTableComponent: React.FC<WhatsAppTableComponentProps> = ({
  viewDeactivated,
  setViewDeactivated,
  handleOpen,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, deactivatedItems, loading } = useSelector(
    (state: RootState) => state.WhatsApp,
  );
 
  const [searchValue, setSearchValue] = useState('');

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [selectedWhatsApp, setSelectedWhatsApp] =
    useState<WhatsAppType | null>(null);
  const [actionType, setActionType] =
    useState<'deactivate' | 'activate' | null>(null);

  useEffect(() => {
    dispatch(fetchWhatsApps());
  }, [dispatch]);
const displayedItems = viewDeactivated ? deactivatedItems : items;

  const filteredItems = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return displayedItems;

    return displayedItems.filter((whatsApp) => {
      const roleName = whatsApp.whatsAppRollName?.toLowerCase() || '';
      const mobileNumber = String(whatsApp.mobileNumber || '').toLowerCase();

      return roleName.includes(query) || mobileNumber.includes(query);
    });
  }, [displayedItems, searchValue]);
  const handleEdit = (whatsApp: WhatsAppType) => {
    setSelectedWhatsApp(whatsApp);
    dispatch(setWhatsAppData(whatsApp));
   dispatch(setDialogOpen('edit'));
  };

  const handleDeactivate = (whatsApp: WhatsAppType) => {
    setSelectedWhatsApp(whatsApp);
   setActionType('deactivate');
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (whatsApp: WhatsAppType) => {
    setSelectedWhatsApp(whatsApp);
   setActionType('activate');
    setConfirmationDialogOpen(true);
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
    setSelectedWhatsApp(null);
    setActionType(null);
  };

const handleConfirmationDialogConfirm = async () => {
  if (selectedWhatsApp && actionType) {
    if (actionType === 'deactivate') {
      await dispatch(
        updateWhatsApp({
          ...selectedWhatsApp,
          status: 'deactivated',
        }),
      );

      dispatch(
        setSnackbarMessage('WhatsApp role deactivated!'),
      );
    } else if (actionType === 'activate') {
      await dispatch(
        updateWhatsApp({
          ...selectedWhatsApp,
          status: 'active',
        }),
      );

      dispatch(
        setSnackbarMessage('WhatsApp role activated!'),
      );
    }

    dispatch(fetchWhatsApps());
    dispatch(setSnackbarOpen(true));
  }

  handleConfirmationDialogClose();
};

  const label = viewDeactivated ? 'Show Activated' : 'Show Deactivated';

  return (
    <>
 <Box className="item-master-toolbar-shell">
        <Box className="purchase-reference-toolbar item-master-toolbar whatsapp-admin-toolbar">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography className="whatsapp-toolbar-title">
              {viewDeactivated
                ? 'Deactivated WhatsApp Roles'
                : 'Active WhatsApp Roles'}
            </Typography>
          </Box>
 <Box
            className="item-master-search-slot"
            sx={{
              flex: '0 1 auto',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <TextField
              size="small"
              variant="outlined"
              autoComplete="off"
              placeholder="Search WhatsApp Role..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="custom-textfield purchase-reference-search item-master-search"
              InputProps={{
                startAdornment: (
                  <SearchIcon className="purchase-reference-search-icon" />
                ),
              }}
            />
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
        <table className="item-master-table item-master-lookup-table item-master-lookup-table--4 whatsapp-admin-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>WhatsApp Role Name</th>
              <th>Mobile Number</th>
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
  {filteredItems.map((whatsApp, index) => (
                  <tr
                    key={whatsApp.moduleAdminId}
                    className={`item-master-data-row ${
                      viewDeactivated ? 'is-deactivated' : ''
                    }`}
                  >
                    <td>{index + 1}</td>
                    <td>{whatsApp.whatsAppRollName || '-'}</td>
                    <td>{whatsApp.mobileNumber || '-'}</td>
                    <td className="item-master-actions-cell">
                      <div>
                        {viewDeactivated ? (
                          <IconButton
                            onClick={() => handleActivate(whatsApp)}
                            className="purchase-master-action-button is-activate"
                            title="Activate"
                            size="small"
                           >
                          
                           <RestoreRoundedIcon />
                          </IconButton>
                        ) : (
                          <>
                            <IconButton
                              onClick={() => handleEdit(whatsApp)}
                              className="purchase-master-action-button is-edit"
                              title="Edit"
                              size="small"
                            >
                              <EditOutlinedIcon />
                            </IconButton>

                            <IconButton
                              onClick={() => handleDeactivate(whatsApp)}
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
               {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      <h2>
                        {searchValue.trim()
                          ? 'No matching WhatsApp roles found'
                          : viewDeactivated
                            ? 'No deactivated WhatsApp roles found'
                            : 'No active WhatsApp roles found'}
                      </h2>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        onClose={handleConfirmationDialogClose}
        onConfirm={handleConfirmationDialogConfirm}
      />
    </>
  );
};

export default WhatsAppTableComponent;