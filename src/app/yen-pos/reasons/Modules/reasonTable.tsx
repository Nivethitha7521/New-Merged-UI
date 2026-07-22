
'use client';
import React, { useCallback, useState } from "react";
import { Reasons } from "../Models/reasonModels";
import {
  Box,
  IconButton,
  Switch,
  Typography,
  FormControlLabel,
  Popover,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";

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
  items,
  viewDeactivated,
  setViewDeactivated,
  handleOpen,
  handleEdit,
  handleDeactivate,
  handleActivate,
}) => {
  const label = viewDeactivated ? "Show Activated" : "Show Deactivated";

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

  const filtered = items.filter((r) =>
    viewDeactivated ? r.status === "deactivated" : r.status === "active"
  );

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
        <Typography
          className="icon-action-label"
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
          {viewDeactivated ? "Deactivated Reasons" : "Active Reasons"}
        </Typography>

        <div className="flex items-center gap-4">
          {!viewDeactivated && (
            <div className="icon-action-wrapper">
              <IconButton color="primary" onClick={handleOpen} className="icon-action-button" title="Add">
                <AddIcon className="icon-action-svg" />
              </IconButton>
              <Typography className="icon-action-label">Add</Typography>
            </div>
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
              "& .MuiFormControlLabel-label": { fontSize: "0.75rem", fontFamily: "'Poppins', sans-serif" },
            }}
          />
        </div>
      </Box>

      <div className="table-container my-1" style={{ maxHeight: "calc(90.5vh - 170px)" }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ textAlign: "center" }}>S.NO</th>
              <th style={{ textAlign: "center" }}>Reason Name</th>
              <th style={{ textAlign: "center" }}>Reasons</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            <>
              {filtered.map((r, index) => (
                <tr key={r.id}>
                  <td style={{ textAlign: "center" }}>{index + 1}</td>
                  <td style={{ textAlign: "center" }}>{r.module || "-"}</td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={(e) => handleClickReasons(e, r.reason || [])}
                      disabled={!r.reason || r.reason.length === 0}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: r.reason?.length ? "#252527ff" : "#056eb4ff",
                        fontWeight: 500,
                        cursor: r.reason?.length ? "pointer" : "default",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontFamily: "'Poppins', sans-serif",
                      }}
                      onMouseEnter={(e) => {
                        if (r.reason?.length) {
                          e.currentTarget.style.textDecoration = "underline";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (r.reason?.length) {
                          e.currentTarget.style.textDecoration = "none";
                        }
                      }}
                    >
                      {r.reason?.length || 0} SELECTED
                    </button>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {viewDeactivated ? (
                      <button onClick={() => handleActivate(r)} className="activate-btn" title="Activate">
                        <RefreshIcon fontSize="small" />
                      </button>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(r)} className="edit-btn" title="Edit">
                          <EditIcon fontSize="small" />
                        </button>
                        <button onClick={() => handleDeactivate(r)} className="deactivate-btn" title="Deactivate">
                          <DeleteIcon fontSize="small" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    <h2>No data found</h2>
                  </td>
                </tr>
              )}
            </>
          </tbody>
        </table>
      </div>

      <Popover
        open={openPopover}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        PaperProps={{ className: "custom-popover" }}
      >
        <div className="custom-popover">
          {selectedReasons.map((reasonText, index) => (
            <h4 key={index}>{reasonText}</h4>
          ))}
        </div>
      </Popover>
    </>
  );
};

export default ReasonTableComponent;