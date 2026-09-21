'use client';
import React from 'react';
import { RootState } from '../../../../redux/store';
import { useSelector } from 'react-redux';
import {
  Box,
  FormControlLabel,
  IconButton,
  Switch,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import { prefix } from '../Models/prefixModel';
import PermissionIconButton from '@/components/Permissions/PermissionIconButton';
interface PrefixTableProps {
  handleOpen: () => void;
  handleEdit: (prefix: prefix) => void;
  handleActivate: (prefix: prefix) => void;
  handleDeactivate: (prefix: prefix) => void;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
}

const PrefixTable: React.FC<PrefixTableProps> = ({
  handleOpen,
  handleEdit,
  handleActivate,
  handleDeactivate,
  showDeactivated,
  setShowDeactivated,
}) => {
  const {
    items: prefixes,
    deactivatedItems,
    loading,
  } = useSelector((state: RootState) => state.prefixType);

const displayedPrefix = showDeactivated ? deactivatedItems : prefixes;
  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';

  return (
    <>
        <Box className="item-master-toolbar-shell">
        <Box className="purchase-reference-toolbar item-master-toolbar">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography className="yen-pos-toolbar-title">
              {showDeactivated ? 'Deactivated Prefix Types' : 'Active Prefix Types'}
            </Typography>
          </Box>

          <Box className="purchase-reference-actions item-master-actions">
            {!showDeactivated && (
              <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
               <PermissionIconButton
                  app="pos"
                  module="prefix_master"
                  action="add"
                  tooltip="Add"
                  onClick={handleOpen}
                  icon={<AddIcon className="icon-action-svg" />}
                  className="icon-action-button"
 ariaLabel="Add"
               />
                <Typography className="icon-action-label">Add</Typography>
              </div>
            )}
 
           <FormControlLabel
              className="purchase-reference-active-toggle item-master-active-toggle"
              control={
                <Switch
                  checked={showDeactivated}
                  onChange={() => setShowDeactivated(!showDeactivated)}
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
        <table className="item-master-table item-master-lookup-table item-master-lookup-table--4 yen-pos-prefix-table">

          <thead>
            <tr>
              <th>S.NO</th>
              <th>Prefix ID</th>
              <th>Prefix Name</th>
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
                 {displayedPrefix.map((item, index) => (
                  <tr
                    key={item.invoicePrefixId || item.id}
                    className="item-master-data-row"
                  >
                    <td>{index + 1}</td>
                    <td>{item.invoicePrefixId}</td>
                    <td>{item.invoicePrefix}</td>
                    <td className="item-master-actions-cell">
                      <div>
                        {showDeactivated ? (
                        <PermissionIconButton
                            app="pos"
                            module="prefix_master"
                            action="edit"
                            rollback
                            tooltip="Activate"
                            onClick={() => handleActivate(item)}
                            icon={<RestoreRoundedIcon />}
                            className="purchase-master-action-button is-activate"
                           ariaLabel="Activate"
                         />
                        ) : (
                          <>
                            <PermissionIconButton
                              app="pos"
                              module="prefix_master"
                              action="edit"
                              tooltip="Edit"
                              onClick={() => handleEdit(item)}
                              icon={<EditOutlinedIcon />}
                              className="purchase-master-action-button is-edit"
ariaLabel="Edit"
                            />
                         <PermissionIconButton
  app="pos"
  module="prefix_master"
  action="delete"
  tooltip="Deactivate"
  onClick={() => handleDeactivate(item)}
  icon={<DeleteOutlineRoundedIcon />}
  className="purchase-master-action-button is-delete"
  ariaLabel="Deactivate"
/>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {displayedPrefix.length === 0 && (
                  <tr>
                   <td colSpan={4} className="empty-state">
                      <h2>
                        {showDeactivated
                          ? 'No deactivated prefix types found'
                          : 'No active prefix types found'}                      </h2>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default PrefixTable;