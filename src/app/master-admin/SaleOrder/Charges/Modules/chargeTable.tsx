



'use client';
import React from "react";
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
  FormControlLabel,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';

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


  const label = viewDeactivated ? 'Show Activated' : 'Show Deactivated';


  return (
    <>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={0}
        my={1}
        ml={1}
        px={{ xs: 2, sm: 3 }}
        sx={{ width: "99%", boxSizing: "border-box", mt: 2 }}
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
          {viewDeactivated ? "Deactivated Charges" : "Active Charges"}
        </Typography>


        <div className="flex items-center gap-4">
          {!viewDeactivated && (
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
                checked={viewDeactivated}
                onChange={() => setViewDeactivated(!viewDeactivated)}
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
              <th style={{ textAlign: "center" }}>S.NO</th>
              <th style={{ textAlign: "center" }}>Charge Type</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
              <>
                {items
                  .filter((charge) => (viewDeactivated ? charge.status === "deactivated" : charge.status === "active"))
                  .map((charge, index) => (
                    <tr key={charge.chargeId} >
                      <td style={{ textAlign: "center" }}>{index + 1}</td>
                      <td style={{ textAlign: "center" }}>{charge.chargeType || "-"}</td>
                      <td style={{ textAlign: "center" }}>
                        {viewDeactivated ? (
                          <button
                            color="primary"
                            onClick={() => handleActivate(charge)}
                            className="activate-btn"
                            title="Activate"
                          >
                            <RefreshIcon />
                          </button>
                        ) : (
                          <>
                            <button
                              color="primary"
                              onClick={() => handleEdit(charge)}
                              className="edit-btn"
                              title="Edit"
                            >
                              <EditIcon />
                            </button>

                            <button
                              color="primary"
                              onClick={() => handleDeactivate(charge)}
                              className="deactivate-btn"
                              title="Deactivate"
                            >
                              <DeleteIcon />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                {items.filter((charge) => (viewDeactivated ? charge.status === "deactivated" : charge.status === "active")).length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center" }}>
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