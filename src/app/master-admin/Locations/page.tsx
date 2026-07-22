



"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLocation,
  createLocation,
  updateLocation,
  activateLocation,
  deactivateLocation,
  clearErrors,
  Exportlocation,
  Importlocation,
  rollbackLocations,
  setSnackbarOpen,
  setSnackbarMessage,
  Exportheader,
  fetchOrderType,
} from "../Locations/Features/locationSlice";
import { Location } from "../Locations/Models/locationModels";
import { AppDispatch, RootState } from "@/redux/store";
import {
  Box,
  Typography,
  IconButton,
  FormControlLabel,
  Switch,
  Checkbox,
  Popover,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  debounce,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import GetAppIcon from "@mui/icons-material/GetApp";
import UploadIcon from "@mui/icons-material/Upload";
import UndoIcon from "@mui/icons-material/Undo";
import DescriptionIcon from "@mui/icons-material/Description";
import SearchIcon from "@mui/icons-material/Search";
import LocationTableComponent from "../Locations/Modules/locationTable";
import ConfirmationDialog from "../Locations/Modules/confirmationAction";
import LocationDialog from "../Locations/Modules/locationDialog";
import MasterAdminMenu from "../page";
import { AxiosError } from "axios";

// ── Import the global result dialog ──────────────────────────────────────────
import ImportResultDialog, {
  ImportResultData,
} from "../../Components/ImportResultDialog";

// ─────────────────────────────────────────────────────────────────────────────

const initialLocationForm: Location = {
  branchName: "",
  aliasName: "",
  type: "",
  status: "active",
  address: "",
  country: "",
  state: "",
  city: "",
  postalCode: 0,
  phoneNumber: 0,
  email: "",
  latitude: 0,
  longitude: 0,
  description: "",
  code: "",
  managerName: "",
  managerContact: 0,
  createdBy: "",
  openingHours: null,
  closingHours: null,
  createdDate: null,
  lastUpdatedDate: null,
  salesTypes: [],
};

// ─────────────────────────────────────────────────────────────────────────────

const LocationMaster: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    locations,
    error,
    snackbarOpen,
    snackbarMessage,
    orderType,
    loading,
    page,
  } = useSelector((state: RootState) => state.locations);

  const [searchValue, setSearchValue] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Location | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [formData, setFormData] = useState<Location>({ ...initialLocationForm });
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<() => Promise<void>>(
    () => Promise.resolve()
  );
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const [confirmLocationName, setConfirmLocationName] = useState<string>("");

  // Import dialog states
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<"import" | "merge" | "replace">("import");

  // Validation error dialog (pre-import file-level errors)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // ── NEW: Import result dialog state ──────────────────────────────────────
  const [importResultDialogOpen, setImportResultDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    sNo: true,
    locationId: true,
    branchName: true,
    aliasName: true,
    type: true,
    status: false,
    address: false,
    country: false,
    state: false,
    city: false,
    postalCode: false,
    phoneNumber: false,
    email: false,
    salesTypes: false,
    latitude: false,
    longitude: false,
    description: false,
    managerName: true,
    managerContact: true,
    createdDate: false,
    lastUpdatedDate: false,
    createdBy: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const columnLabels: Record<string, string> = {
    sNo: "S.No",
    locationId: "Location ID",
    branchName: "Branch Name",
    aliasName: "Alias Name",
    type: "Type",
    status: "Status",
    address: "Address",
    country: "Country",
    state: "State",
    city: "City",
    postalCode: "Postal Code",
    phoneNumber: "Phone Number",
    email: "Email",
    latitude: "Latitude",
    longitude: "Longitude",
    description: "Description",
    managerName: "Manager Name",
    managerContact: "Manager Contact",
    createdDate: "Created Date",
    lastUpdatedDate: "Last Updated Date",
    createdBy: "Created By",
    salesTypes: "Sales Types",
  };

  // ── Debounced search ────────────────────────────────────────────────────
  const debouncedFetch = useMemo(
    () =>
      debounce((value: string) => {
        dispatch(fetchLocation({ search: value, page: 1 }));
        dispatch(fetchOrderType());
      }, 600),
    [dispatch]
  );

  useEffect(() => {
    debouncedFetch(searchValue);
    return () => {
      debouncedFetch.clear();
    };
  }, [searchValue, debouncedFetch]);

  useEffect(() => {
    if (error) {
      dispatch(setSnackbarMessage(error));
      dispatch(setSnackbarOpen(true));
      dispatch(clearErrors());
    }
  }, [error, dispatch]);

  // ── Column toggle ───────────────────────────────────────────────────────
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseFilter = () => setAnchorEl(null);

  // ── Add / Edit ──────────────────────────────────────────────────────────
  const handleAddNew = () => {
    setEditData(null);
    setFormData({ ...initialLocationForm });
    setDialogOpen(true);
  };

  const handleEdit = (location: Location) => {
    if (!location) {
      dispatch(setSnackbarMessage("Invalid location data"));
      dispatch(setSnackbarOpen(true));
      return;
    }
    setEditData(location);
    setFormData({
      ...location,
      country: location.country || "",
      state: location.state || "",
      city: location.city || "",
      postalCode: Number(location.postalCode) || 0,
      latitude: Number(location.latitude) || 0,
      longitude: Number(location.longitude) || 0,
    });
    setDialogOpen(true);
  };

  // const handleSubmitRequest = (values: Location) => {
  //   const branchNameLower = values.branchName?.toLowerCase();
  //   const aliasNameLower = values.aliasName?.toLowerCase();
  //   const isDuplicate = locations.some(
  //     (loc) =>
  //       (loc.branchName?.toLowerCase() === branchNameLower ||
  //         loc.aliasName?.toLowerCase() === aliasNameLower) &&
  //       loc.branchId !== editData?.branchId
  //   );
  //   if (isDuplicate) {
  //     dispatch(
  //       setSnackbarMessage(
  //         "Branch Name or Alias Name already exists (case-insensitive)"
  //       )
  //     );
  //     dispatch(setSnackbarOpen(true));
  //     return;
  //   }
  //   const isEdit = !!editData?.branchId;
  //   setConfirmationMessage(
  //     `Are you sure you want to ${isEdit ? "update" : "create"} this location?`
  //   );
  //   setConfirmationAction(() => () => handleConfirmSubmit(values));
  //   setConfirmDialogOpen(true);
  // };


  const handleSubmitRequest = (values: Location) => {
    const branchNameLower = values.branchName?.toLowerCase();
    const aliasNameLower = values.aliasName?.toLowerCase();
    const isDuplicate = locations.some(
      (loc) =>
        (loc.branchName?.toLowerCase() === branchNameLower ||
          loc.aliasName?.toLowerCase() === aliasNameLower) &&
        loc.branchId !== editData?.branchId
    );
    if (isDuplicate) {
      dispatch(
        setSnackbarMessage(
          "Branch Name or Alias Name already exists (case-insensitive)"
        )
      );
      dispatch(setSnackbarOpen(true));
      return;
    }
    const isEdit = !!editData?.branchId;
    setConfirmLocationName(values.branchName || "");                // ✅ set name
    setConfirmationMessage(
      `Are you sure you want to ${isEdit ? "update" : "create"}`   // ✅ no trailing "?"
    );
    setConfirmationAction(() => () => handleConfirmSubmit(values));
    setConfirmDialogOpen(true);
  };



  const handleConfirmSubmit = async (values: Location) => {
    try {
      if (editData?.branchId) {
        await dispatch(
          updateLocation({ branchId: editData.branchId, updates: values })
        ).unwrap();
        dispatch(setSnackbarMessage("Location updated successfully"));
      } else {
        await dispatch(createLocation(values)).unwrap();
        dispatch(setSnackbarMessage("Location created successfully"));
      }
      dispatch(setSnackbarOpen(true));
      dispatch(fetchLocation({ search: searchValue, page }));
      setDialogOpen(false);
      setEditData(null);
      setFormData({ ...initialLocationForm });
    } catch (error) {
      const err = error as AxiosError;
      dispatch(setSnackbarMessage(err?.message || "Operation failed"));
      dispatch(setSnackbarOpen(true));
    } finally {
      setConfirmDialogOpen(false);
    }
  };

  // ── Status change ───────────────────────────────────────────────────────
  const handleStatusChange = async (location: Location, activate: boolean) => {
    if (!location.branchId) {
      dispatch(setSnackbarMessage("Invalid Location ID"));
      dispatch(setSnackbarOpen(true));
      return;
    }
    try {
      if (activate) {
        await dispatch(activateLocation(location.branchId)).unwrap();
        dispatch(setSnackbarMessage("Location activated successfully"));
      } else {
        await dispatch(deactivateLocation(location.branchId)).unwrap();
        dispatch(setSnackbarMessage("Location deactivated successfully"));
      }
      dispatch(setSnackbarOpen(true));
      setConfirmDialogOpen(false);
      dispatch(fetchLocation({ search: searchValue, page }));
    } catch (error) {
      const err = error as AxiosError;
      const message =
        err.response?.data && typeof err.response.data === "string"
          ? err.response.data
          : err.message || "Status change failed";
      dispatch(setSnackbarMessage(message));
      dispatch(setSnackbarOpen(true));
      setConfirmDialogOpen(false);
    }
  };


  const confirmStatusChange = (location: Location, activate: boolean) => {
    setConfirmLocationName(location.branchName || "");   // ✅
    setConfirmationMessage(
      `Are you sure you want to ${activate ? "activate" : "deactivate"}`
    );
    setConfirmationAction(() => () => handleStatusChange(location, activate));
    setConfirmDialogOpen(true);
  };

  // ── Export ──────────────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    dispatch(Exportlocation());
  };

  // ── Import ──────────────────────────────────────────────────────────────
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validExtensions = [".csv", ".xlsx", ".xls"];
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."));
      if (!validExtensions.includes(fileExtension)) {
        dispatch(setSnackbarMessage("Please upload a valid CSV or Excel file"));
        dispatch(setSnackbarOpen(true));
        return;
      }
      setSelectedFile(file);
      setImportMode("import");
      setImportDialogOpen(true);
    }
    if (event.target) event.target.value = "";
  };

  const handleImportSubmit = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    setImportDialogOpen(false);

    try {
      // unwrap() returns the ImportResultData from the slice
      const result = await dispatch(
        Importlocation({ file: selectedFile, mode: importMode })
      ).unwrap();

      // Refresh table
      dispatch(fetchLocation({ search: searchValue, page }));
      setValidationErrors([]);

      // ── Open the result dialog with backend response ─────────────────
      setImportResult(result as unknown as ImportResultData);
      setImportResultDialogOpen(true);
    } catch (error: any) {
      console.error("Import error:", error);

      if (error && typeof error === "object") {
        if (
          error.errors &&
          Array.isArray(error.errors) &&
          error.errors.length > 0
        ) {
          // File-level validation errors → show in the simpler error dialog
          setValidationErrors(error.errors);
          setErrorDialogOpen(true);
        } else if (error.message && typeof error.message === "string") {
          dispatch(setSnackbarMessage(error.message));
          dispatch(setSnackbarOpen(true));
        }
      } else if (typeof error === "string") {
        dispatch(setSnackbarMessage(error));
        dispatch(setSnackbarOpen(true));
      } else {
        dispatch(setSnackbarMessage("Failed to import Location data"));
        dispatch(setSnackbarOpen(true));
      }
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
    }
  };

  // ── Rollback ────────────────────────────────────────────────────────────
  const handleRollback = async () => {
    setConfirmationMessage(
      "Are you sure you want to rollback to the previous data? This will undo the last replace operation."
    );
    setConfirmationAction(() => async () => {
      try {
        await dispatch(rollbackLocations()).unwrap();
        dispatch(fetchLocation({ search: searchValue, page }));
        setConfirmDialogOpen(false);
      } catch (error) {
        console.error("Rollback error:", error);
        setConfirmDialogOpen(false);
      }
    });
    setConfirmDialogOpen(true);
  };

  // ── Sample CSV ──────────────────────────────────────────────────────────
  const handleDownloadSampleCSV = async () => {
    setIsImporting(true);
    try {
      await dispatch(Exportheader());
      dispatch(setSnackbarMessage("Sample CSV downloaded successfully"));
      dispatch(setSnackbarOpen(true));
    } catch {
      dispatch(setSnackbarMessage("Failed to download sample CSV"));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsImporting(false);
    }
  };

  // ── Misc dialog helpers ─────────────────────────────────────────────────
  const handleDialogClose = () => {
    setDialogOpen(false);
    setFormData({ ...initialLocationForm });
  };
  const handleDiscardChanges = () => {
    setFormData({ ...initialLocationForm });
    setDialogOpen(false);
  };
  const handleImportDialogClose = () => {
    setImportDialogOpen(false);
    setSelectedFile(null);
  };

  const openPopover = Boolean(anchorEl);
  const id = openPopover ? "column-filter-popover" : undefined;
  const label = showDeactivated ? "Show Activated" : "Show Deactivated";

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <Box marginLeft={1}>
      <MasterAdminMenu />

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={2}
        my={2}
        px={{ xs: 2, sm: 3 }}
        sx={{ width: "100%", boxSizing: "border-box" }}
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
          {showDeactivated ? "Deactivated Locations" : "Active Locations"}
        </Typography>

        {/* Search */}
        <Box sx={{ position: "relative", width: "280px" }}>
          <SearchIcon
            sx={{
              position: "absolute",
              top: "50%",
              left: "10px",
              transform: "translateY(-50%)",
              color: "text.secondary",
              fontSize: "1.2rem",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search section..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{
              padding: "6px 10px 6px 38px",
              fontSize: "0.8rem",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontFamily: "Poppins, sans-serif",
              width: "280px",
            }}
          />
        </Box>

        {/* Action buttons */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1.5, sm: 2, md: 1.5 },
            flexWrap: "nowrap",
            overflowX: "auto",
            paddingBottom: "4px",
            scrollbarWidth: "thin",
            "&::-webkit-scrollbar": { height: "6px" },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              background: "#c1c1c1",
              borderRadius: "3px",
            },
          }}
        >
          {!showDeactivated && (
            <>
              <div className="icon-action-wrapper">
                <IconButton
                  color="primary"
                  onClick={handleAddNew}
                  className="icon-action-button"
                  size="small"
                  disabled={isImporting}
                >
                  <AddIcon className="icon-action-svg" />
                </IconButton>
                <Typography className="icon-action-label">Add</Typography>
              </div>

              <div className="icon-action-wrapper">
                <IconButton
                  color="primary"
                  onClick={handleImportClick}
                  className="icon-action-button"
                  size="small"
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <CircularProgress size={20} className="icon-action-svg" />
                  ) : (
                    <GetAppIcon className="icon-action-svg" />
                  )}
                </IconButton>
                <Typography className="icon-action-label">
                  {isImporting ? "Importing..." : "Import"}
                </Typography>
              </div>

              <div className="icon-action-wrapper">
                <IconButton
                  color="primary"
                  onClick={handleExportCSV}
                  className="icon-action-button"
                  size="small"
                  disabled={isImporting}
                >
                  <UploadIcon className="icon-action-svg" />
                </IconButton>
                <Typography className="icon-action-label">Export</Typography>
              </div>

              <div className="icon-action-wrapper">
                <IconButton
                  color="primary"
                  onClick={handleDownloadSampleCSV}
                  disabled={isImporting}
                  className="icon-action-button"
                >
                  <DescriptionIcon className="icon-action-svg" />
                </IconButton>
                <Typography className="icon-action-label">Sample</Typography>
              </div>

              <div className="icon-action-wrapper">
                <IconButton
                  color="secondary"
                  onClick={handleRollback}
                  className="icon-action-button"
                  size="small"
                  disabled={isImporting}
                >
                  <UndoIcon className="icon-action-svg" />
                </IconButton>
                <Typography className="icon-action-label">Rollback</Typography>
              </div>
            </>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={showDeactivated}
                onChange={() => setShowDeactivated(!showDeactivated)}
                color="primary"
                size="small"
                disabled={isImporting}
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

          <div className="icon-action-wrapper">
            <IconButton
              onClick={handleFilterClick}
              className="icon-action-button"
              size="small"
              sx={{ borderColor: "#6b7280" }}
              disabled={isImporting}
            >
              <FilterListIcon className="icon-action-svg" />
            </IconButton>
            <Typography className="icon-action-label">Filter</Typography>
          </div>
        </Box>
      </Box>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".csv,.xlsx,.xls"
        style={{ display: "none" }}
      />

      {/* ── Import Mode Dialog ──────────────────────────────────────────── */}
      <Dialog
        open={importDialogOpen}
        onClose={handleImportDialogClose}
        PaperProps={{ className: "dialog-paper-small" }}
      >
        <DialogTitle
          className="dialog-title"
          sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}
        >
          Select Import Mode
        </DialogTitle>

        <DialogContent className="dialog-content">
          <Box sx={{ pt: 1 }}>
            <Typography
              variant="body2"
              sx={{
                mb: 1,
                fontFamily: "'Poppins', sans-serif",
                fontSize: "0.7rem",
              }}
            >
              Selected file: <strong>{selectedFile?.name}</strong>
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography
              sx={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                mb: 2,
                fontSize: "0.8rem",
              }}
            >
              Choose import mode:
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                alignItems: "center",
              }}
            >
              {(
                [
                  { mode: "import", color: "primary", label: "Import" },
                  { mode: "merge", color: "secondary", label: "Merge" },
                  { mode: "replace", color: "error", label: "Replace" },
                ] as const
              ).map(({ mode, color, label }) => (
                <Box
                  key={mode}
                  onClick={() => setImportMode(mode)}
                  sx={{
                    width: 180,
                    py: 1,
                    px: 2,
                    borderRadius: "8px",
                    border: "2px solid",
                    borderColor:
                      importMode === mode
                        ? color === "primary"
                          ? "#1976d2"
                          : color === "secondary"
                            ? "#9c27b0"
                            : "#d32f2f"
                        : "#e2e8f0",
                    backgroundColor:
                      importMode === mode
                        ? color === "primary"
                          ? "#eff6ff"
                          : color === "secondary"
                            ? "#fdf4ff"
                            : "#fef2f2"
                        : "white",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.15s",
                    "&:hover": {
                      borderColor:
                        color === "primary"
                          ? "#1976d2"
                          : color === "secondary"
                            ? "#9c27b0"
                            : "#d32f2f",
                      backgroundColor:
                        color === "primary"
                          ? "#eff6ff"
                          : color === "secondary"
                            ? "#fdf4ff"
                            : "#fef2f2",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      color:
                        color === "primary"
                          ? "#1976d2"
                          : color === "secondary"
                            ? "#9c27b0"
                            : "#d32f2f",
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions className="dialog-actions" sx={{ px: 3, pb: 2 }}>
          <button className="btn-secondary" onClick={handleImportDialogClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleImportSubmit}>
            Confirm
          </button>
        </DialogActions>
      </Dialog>

      {/* ── Validation Error Dialog (pre-import file-level errors) ─────── */}
      <Dialog
        open={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        PaperProps={{ className: "dialog-paper-medium" }}
      >
        <DialogTitle
          className="dialog-title"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            color: "error.main",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            component="span"
            sx={{
              backgroundColor: "error.light",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            !
          </Box>
          Validation Failed
        </DialogTitle>
        <DialogContent className="dialog-content">
          <Box sx={{ pt: 0 }}>
            <Typography
              variant="body1"
              sx={{
                mb: 2,
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                fontSize: "0.7rem",
              }}
            >
              Import failed with {validationErrors.length} error(s):
            </Typography>
            <Box
              sx={{
                maxHeight: "400px",
                overflowY: "auto",
                backgroundColor: "#f5f5f5",
                borderRadius: 1,
                p: 2,
              }}
            >
              {validationErrors.map((error, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 1.5,
                    p: 1.5,
                    backgroundColor: "white",
                    borderLeft: "3px solid",
                    borderColor: "error.main",
                    borderRadius: 1,
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "text.primary",
                    }}
                  >
                    {error}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Typography
              variant="caption"
              sx={{
                mt: 2,
                display: "block",
                fontFamily: "'Poppins', sans-serif",
                color: "text.secondary",
              }}
            >
              Please fix the errors in your file and try importing again.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions className="dialog-actions" sx={{ px: 3, pb: 2 }}>
          <button
            className="btn-primary"
            onClick={() => setErrorDialogOpen(false)}
          >
            Close
          </button>
        </DialogActions>
      </Dialog>

      {/* ── Global Import Result Dialog ─────────────────────────────────── */}
      <ImportResultDialog
        open={importResultDialogOpen}
        onClose={() => {
          setImportResultDialogOpen(false);
          setImportResult(null);
        }}
        result={importResult}
        moduleName="Location"
      />

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <LocationTableComponent
        filteredTypes={locations}
        showDeactivatedTable={showDeactivated}
        onOpenEdit={handleEdit}
        onAddNew={handleAddNew}
        onActivate={(location) => confirmStatusChange(location, true)}
        onDeactivate={(location) => confirmStatusChange(location, false)}
        visibleColumns={visibleColumns}
        resultDialogOpen={false}
        onCloseResultDialog={() => { }}
        importResult={null}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
      />

      {/* ── Column filter popover ───────────────────────────────────────── */}
      <Popover
        id={id}
        open={openPopover}
        anchorEl={anchorEl}
        onClose={handleCloseFilter}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            width: 220,
            maxWidth: "95vw",
            maxHeight: "62vh",
            overflow: "auto",
            fontFamily: "'Poppins', sans-serif",
          },
        }}
      >
        <Box p={3} display="flex" flexDirection="column" gap={1}>
          <Typography
            variant="subtitle2"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            Select Columns
          </Typography>
          {Object.entries(visibleColumns).map(([key, value]) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  checked={value}
                  onChange={() => toggleColumn(key)}
                  size="small"
                  sx={{
                    "& .MuiSvgIcon-root": { fontSize: 32 },
                    transform: "scale(0.8)",
                    padding: "8px",
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "0.78rem",
                    fontWeight: 400,
                  }}
                >
                  {columnLabels[key] || key}
                </Typography>
              }
              sx={{ m: 0 }}
            />
          ))}
        </Box>
      </Popover>

      {/* ── Location form dialog ────────────────────────────────────────── */}
      <LocationDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        handleSubmit={handleSubmitRequest}
        formData={formData}
        editMode={!!editData}
        handleDiscardChanges={handleDiscardChanges}
        orderTypes={orderType}
        loading={loading}
      />

      {/* ── Confirmation dialog ─────────────────────────────────────────── */}
      {/* <ConfirmationDialog
        open={confirmDialogOpen}
        onCancel={() => setConfirmDialogOpen(false)}
        onConfirm={confirmationAction}
        message={confirmationMessage}
      /> */}


      <ConfirmationDialog
        open={confirmDialogOpen}                // ✅ was dialogOpen
        message={confirmationMessage}           // ✅ was missing
        branchName={confirmLocationName}      // ✅ "Pamban" shows bold
        onConfirm={confirmationAction}
        onCancel={() => setConfirmDialogOpen(false)}  // ✅ was setDialogOpen
        confirmText="Confirm"
        cancelText="Cancel"
      />

      {/* ── Snackbar ────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => dispatch(setSnackbarOpen(false))}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={() => dispatch(setSnackbarOpen(false))}
          severity="info"
          sx={{ width: "100%", backgroundColor: "#1976d2", color: "white" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LocationMaster;