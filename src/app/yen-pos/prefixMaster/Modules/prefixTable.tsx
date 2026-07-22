







import React from "react";
import { RootState } from "../../../../redux/store";
import { useSelector } from "react-redux";
import {
  Box,
  FormControlLabel,
  IconButton,
  Switch,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { prefix } from "../Models/prefixModel";

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
    items: prefix,
    deactivatedItems,
    loading,
  } = useSelector((state: RootState) => state.prefixType);

  const displayedPrefix = showDeactivated ? deactivatedItems : prefix;

  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';

  return (
    <>
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        my={1}
        ml={1}
        px={{ xs: 2, sm: 3 }}
        sx={{ width: "99%", boxSizing: "border-box", mt: 2 }}
      >

        {/* LEFT SIDE — TITLE */}
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
          {showDeactivated ? "Deactivated Prefix Types" : "Active Prefix Types"}
        </Typography>

        {/* RIGHT SIDE — ALL ACTIONS */}
        <Box
          display="flex"
          alignItems="center"
          gap={4}
          sx={{ whiteSpace: "nowrap" }}
        >
          {/* ADD BUTTON (only when active mode) */}
          {!showDeactivated && (
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
          )}

          {/* SWITCH + LABEL */}
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
              "& .MuiFormControlLabel-label": {
                fontSize: "0.75rem",
                fontFamily: "'Poppins', sans-serif",
              },
            }}
          />
        </Box>
      </Box>



      <div className="table-container" style={{ maxHeight: 'calc(86.5vh - 170px)' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ textAlign: "center" }} >S.NO</th>
              <th style={{ textAlign: "center" }} >Prefix Id</th>
              <th style={{ textAlign: "center" }} >prefix Name</th>
              <th style={{ textAlign: "center" }} >Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center' }}>
                  <h3 style={{ fontWeight: 'bold' }}>Loading...</h3>
                </td>
              </tr>
            ) : (
              <>
                {displayedPrefix.map((prefix, index) => (
                  <tr key={prefix.invoicePrefixId || prefix.id}>
                    <td style={{ textAlign: "center" }}>{index + 1}</td>
                    <td style={{ textAlign: 'center' }}>{prefix.invoicePrefixId}</td>
                    <td style={{ textAlign: "center" }}>{prefix.invoicePrefix}</td>
                    <td style={{ textAlign: "center" }}>
                      {showDeactivated ? (
                        <button
                          color="primary"
                          onClick={() => handleActivate(prefix)}
                          className="activate-btn"
                          title="Activate"
                        >
                          <RefreshIcon />
                        </button>
                      ) : (
                        <>
                          <button
                            color="primary"
                            onClick={() => handleEdit(prefix)}
                            className="edit-btn"
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            color="primary"
                            onClick={() => handleDeactivate(prefix)}
                            style={{ marginLeft: "10px" }}
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
                {displayedPrefix.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center" }}>
                      <h2 >
                        {showDeactivated ? "No deactivated prefix types found" : "No active prefix types found"}
                      </h2>
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