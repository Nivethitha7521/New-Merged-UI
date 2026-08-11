



'use client';
import React, { useMemo, useState } from "react";
import { Charges } from "../Models/chargeModels";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Switch,
  Typography,
  FormControlLabel, TextField,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import SearchIcon from '@mui/icons-material/Search';

export interface ChargeTableProps {
  items: Charges[];
  loading: boolean;
  viewDeactivated: boolean;
  setViewDeactivated: (value: boolean) => void;
  handleOpen: () => void;
  handleEdit: (charge: Charges) => void;
  handleDeactivate: (charge: Charges) => void;
  handleActivate: (charge: Charges) => void;
}


const ChargeTableComponent: React.FC<ChargeTableProps> = ({
  items,
  loading,
  viewDeactivated,
  setViewDeactivated,
  handleOpen,
  handleEdit,
  handleDeactivate,
  handleActivate,

}) => {

const [searchValue, setSearchValue] = useState('');
  const label = viewDeactivated ? 'Show Activated' : 'Show Deactivated';
 const filteredCharges = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return items.filter((charge) => {
      const matchesStatus = viewDeactivated
        ? charge.status === "deactivated"
        : charge.status === "active";

      if (!matchesStatus) return false;
      if (!query) return true;

      return charge.chargeType?.toLowerCase().includes(query);
    });
  }, [items, searchValue, viewDeactivated]);

  return (
    <>
     <Box className="item-master-toolbar-shell" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Box
          className="purchase-reference-toolbar item-master-toolbar"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}
        >
 <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography className="sale-order-toolbar-title">
              {viewDeactivated ? "Deactivated Charges" : "Active Charges"}
            </Typography>
          </Box>

          <Box className="item-master-search-slot" sx={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
            <TextField
              size="small"
              variant="outlined"
              autoComplete="off"
              placeholder="Search Charges..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="custom-textfield purchase-reference-search item-master-search"
              sx={{ width: '300px' }}
              InputProps={{ startAdornment: <SearchIcon className="purchase-reference-search-icon" /> }}
            />
          </Box>

          <Box
            className="purchase-reference-actions item-master-actions"
            sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}
          >
            {!viewDeactivated && (
              <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
                <IconButton color="primary" onClick={handleOpen} className="icon-action-button" title="Add">
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
       <table className="item-master-table item-master-lookup-table sale-order-lookup-table--3">
          <thead>
            <tr>
              <th style={{ textAlign: "center" }}>S.NO</th>
              <th style={{ textAlign: "center" }}>Charge Type</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
              <>
              {filteredCharges.map((charge, index) => (
                    <tr key={charge.chargeId} className="item-master-data-row">
                      <td style={{ textAlign: "center" }}>{index + 1}</td>
                      <td style={{ textAlign: "center" }}>{charge.chargeType || "-"}</td>
                     <td className="item-master-actions-cell">
                        <div>
                          {viewDeactivated ? (
                            <IconButton
                              onClick={() => handleActivate(charge)}
                              className="purchase-master-action-button is-activate"
                              title="Activate"
                              size="small"
                            >
                             <RestoreRoundedIcon />
                            </IconButton>
                          ) : (
                            <>
                              <IconButton
                                onClick={() => handleEdit(charge)}
                                className="purchase-master-action-button is-edit"
                                title="Edit"
                                size="small"
                              >
                                <EditOutlinedIcon />
                              </IconButton>

                              <IconButton
                                onClick={() => handleDeactivate(charge)}
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
              {filteredCharges.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-state">
                      <h2>No data found</h2>
                    </td>
                  </tr>
                )}
              </>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ChargeTableComponent;