'use client';
import React, { useMemo, useState } from "react";
import { Event } from "../Models/eventModels";
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
  Typography,TextField,
  FormControlLabel,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import SearchIcon from '@mui/icons-material/Search';

export interface EventTableProps {
  items: Event[];
  loading: boolean;
  viewDeactivated: boolean;
  setViewDeactivated: (value: boolean) => void;
  handleOpen: () => void;
  handleEdit: (event: Event) => void;
  handleDeactivate: (event: Event) => void;
  handleActivate: (event: Event) => void;
}


const EventTableComponent: React.FC<EventTableProps> = ({
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
 const filteredEvents = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return items.filter((event) => {
      const matchesStatus = viewDeactivated
        ? event.status === "deactivated"
        : event.status === "active";

      if (!matchesStatus) return false;
      if (!query) return true;

      return (
        event.eventname?.toLowerCase().includes(query) ||
        event.remarks?.toLowerCase().includes(query)
      );
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
              {viewDeactivated ? "Deactivated Events" : "Active Events"}
            </Typography>
          </Box>

          <Box className="item-master-search-slot" sx={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
            <TextField
              size="small"
              variant="outlined"
              autoComplete="off"
              placeholder="Search Events..."
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
      <Box>


    <div className="item-master-table-container">
        <table className="item-master-table item-master-lookup-table sale-order-lookup-table--4">
          <thead>
                <tr>
                  <th style={{ textAlign: "center" }}>S.NO</th>
                  <th style={{ textAlign: "center" }}>Event Name</th>
                  <th style={{ textAlign: "center" }}>Remarks</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                  <>
                   {filteredEvents.map((event, index) => (
                        <tr key={event.eventId} className="item-master-data-row">
                          <td style={{ textAlign: "center" }}>{index + 1}</td>
                          <td style={{ textAlign: "center" }}>{event.eventname || "-"}</td>
                          <td style={{ textAlign: "center" }}>{event.remarks || "-"}</td>
 <td className="item-master-actions-cell">
                            <div>
                              {viewDeactivated ? (
                                <IconButton
                                  onClick={() => handleActivate(event)}
                                  className="purchase-master-action-button is-activate"
                                  title="Activate"
                                  size="small"
                                >
                                  <RestoreRoundedIcon />
                                </IconButton>
                              ) : (
                                <>
                                  <IconButton
                                    onClick={() => handleEdit(event)}
                                    className="purchase-master-action-button is-edit"
                                    title="Edit"
                                    size="small"
                                  >
                                    <EditOutlinedIcon />
                                  </IconButton>

                                  <IconButton
                                    onClick={() => handleDeactivate(event)}
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
                   {filteredEvents.length === 0 && (
                      <tr>
                        <td colSpan={4} className="empty-state">
                          <h2>No data found</h2>
                        </td>
                      </tr>
                    )}
                  </>
              </tbody>
            </table>
          </div>
      </Box>
    </>
  );
}

export default EventTableComponent;