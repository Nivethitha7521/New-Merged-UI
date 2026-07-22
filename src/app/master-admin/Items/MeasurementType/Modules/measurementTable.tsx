



import React from "react";
import { RootState } from "../../../../../redux/store";
import { useSelector } from "react-redux";
import {
  Box,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { setSnackbarMessage, setSnackbarOpen, fetchMeasurementTypes } from "../Features/measurementSlice";
import { MeasurementType } from "../Models/measurementTypeModels";

interface MeasurementTypeTableProps {
  handleOpen: () => void;
  handleEdit: (measurementType: MeasurementType) => void;
  handleActivate: (measurementType: MeasurementType) => void;
  handleDeactivate: (measurementType: MeasurementType) => void;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
}

const MeasurementTypeTable: React.FC<MeasurementTypeTableProps> = ({
  handleOpen,
  handleEdit,
  handleActivate,
  handleDeactivate,
  showDeactivated,
  setShowDeactivated,
}) => {
  const {
    items: measurementTypes,
    deactivatedItems,
    loading,
    error,
  } = useSelector((state: RootState) => state.measurementType);

  const displayedMeasurementTypes = showDeactivated ? deactivatedItems : measurementTypes;


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
        sx={{ width: "99%", boxSizing: "border-box", mt: -1 }}
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
          {showDeactivated ? "Deactivated Measurement Types" : "Active Measurement Types"}
        </Typography>

        {/* RIGHT SIDE — ALL ACTIONS */}
        <Box
          display="flex"
          alignItems="center"
          gap={4}
          sx={{ whiteSpace: "nowrap" }}
        >
          {/* ADD BUTTON (only when active mode) */}
          {/* {!showDeactivated && (
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
          )} */}

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
              <th>S.NO</th>
              <th>Measurement type Id</th>
              <th>Measurement Type Name</th>
              <th>Actions</th>
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
                {displayedMeasurementTypes.map((measurementType, index) => (
                  <tr key={measurementType.measureId || measurementType.id}>
                    <td style={{ textAlign: "center" }}>{index + 1}</td>
                    <td style={{ textAlign: "center" }}>{measurementType.measureId}</td>
                    <td style={{ textAlign: "center" }}>{measurementType.measurementType}</td>
                    <td style={{ textAlign: "center" }}>
                      {showDeactivated ? (
                        <button
                          onClick={() => handleActivate(measurementType)}
                          className="activate-btn"
                          title="Activate"
                        >
                          <RefreshIcon />
                        </button>
                      ) : (
                        <>
                          {/* <button
                          onClick={() => handleEdit(measurementType)}
                          className="edit-btn"
                          title="Edit">
                          <EditIcon />
                        </button> */}

                          <button
                            onClick={() => handleDeactivate(measurementType)}
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
                {displayedMeasurementTypes.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center" }}>
                      <h2 >
                        {showDeactivated ? "No deactivated measurement types found" : "No active measurement types found"}
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

export default MeasurementTypeTable;