

import React, { useRef } from "react";
import { RootState, AppDispatch } from "../../../../../redux/store";
import { useSelector, useDispatch } from "react-redux";
import {
  Alert,
  Box,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import GetAppIcon from "@mui/icons-material/GetApp";
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadIcon from "@mui/icons-material/Upload";
import { Exportitemgroup, Importitemgroup } from "../Features/itemgroupSlice";
import { TrackChanges } from "@mui/icons-material";

interface itemGroup {
  id: string;
  itemGroupName: string;
  status: string;
  itemGroupId: string;
}

interface ItemGroupTableProbs {
  handleOpen: () => void;
  handleEdit: (itemgroup: itemGroup) => void;
  handleActivate: (itemgroup: itemGroup) => void;
  handleDeactivate: (itemgroup: itemGroup) => void;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
}

const ItemGroupTable: React.FC<ItemGroupTableProbs> = ({
  handleOpen,
  handleEdit,
  handleActivate,
  handleDeactivate,
  showDeactivated,
  setShowDeactivated
}) => {
  const {
    items: itemGroups,
    deactivatedItems,
    loading,
    error
  } = useSelector((state: RootState) => state.itemGroup);

  const displayeditemGroups = showDeactivated ? deactivatedItems : itemGroups;

  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    dispatch(Exportitemgroup());
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      dispatch(Importitemgroup(file));
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
    }
  };


  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';

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
        sx={{ width: "99%", boxSizing: "border-box", mt:-2 }}
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
          {showDeactivated ? "Deactivated ItemGroup" : "Active ItemGroup"}
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

              {/* <div className="icon-action-wrapper">
                <IconButton
                  color="primary"
                  component="label"
                  htmlFor="import-file"
                  className="icon-action-button cursor-pointer"
                  title="Import"
                >
                  <GetAppIcon className="icon-action-svg" />
                </IconButton>
                <Typography className="icon-action-label">Import</Typography>
              </div>

              <div className="icon-action-wrapper">
                <IconButton
                  color='primary'
                  onClick={handleExportCSV}
                  className="icon-action-button"
                  title="Export"
                >
                  <UploadIcon className="icon-action-svg" />
                </IconButton>
                <Typography className="icon-action-label">Export</Typography>
              </div> */}

              <input
                accept=".csv"
                style={{ display: 'none' }}
                id="import-file"
                type="file"
                ref={fileInputRef}
                onChange={handleImportCSV}
              />
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


        <div className="table-container my-1" style={{ maxHeight: 'calc(86.5vh - 170px)' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>ItemGroup Id</th>
                <th>Item Group Name</th>
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
              {displayeditemGroups.map((itemGroup, index) => (
                <tr key={itemGroup.itemGroupId || index}>
                  <td style={{ textAlign: "center" }}>{index + 1}</td>
                  <td style={{ textAlign: 'center' }}>{itemGroup.itemGroupId}</td>
                  <td style={{ textAlign: "center" }}>{itemGroup.itemGroupName}</td>
                  <td style={{ textAlign: "center" }}>
                    {showDeactivated ? (
                      <button
                        color="primary"
                        onClick={() => handleActivate(itemGroup)}
                        className="activate-btn"
                        title="Activate"
                      >
                        <RefreshIcon fontSize="small" />
                      </button>
                    ) : (
                      <>
                        <button
                          color="primary"
                          onClick={() => handleEdit(itemGroup)}
                          className="edit-btn"
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </button>
                        <button
                          color="primary"
                          onClick={() => handleDeactivate(itemGroup)}
                          style={{ marginLeft: "10px" }}
                          className="deactivate-btn"
                          title="Deactivate"
                        >
                          <DeleteIcon fontSize="small" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {displayeditemGroups.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    <h2 >
                      {showDeactivated ? "No deactivated item groups found" : "No active item groups found"}
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

export default ItemGroupTable;