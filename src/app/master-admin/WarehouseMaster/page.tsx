

"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLocation,
  createLocation,
  updateLocation,
  activateLocation,
  deactivateLocation,
  clearErrors,
  Exportwarehouse,
  Importwarehouse,
  rollbackWarehouses,
  setSnackbarOpen,
  setSnackbarMessage,
  Exportheader,
} from "../WarehouseMaster/Features/warehouseSlice";
import { WareHouse } from "../WarehouseMaster/Models/warehouseModels";
import { AppDispatch, RootState } from "@/redux/store";
import {
  Box,
  IconButton,
  FormControlLabel,
  Switch,
  Checkbox,
  Popover,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import UploadIcon from "@mui/icons-material/Upload";
import GetAppIcon from "@mui/icons-material/GetApp";
import UndoIcon from "@mui/icons-material/Undo";
import DescriptionIcon from "@mui/icons-material/Description";
import { AxiosError } from "axios";
import ConfirmationDialog from "../WarehouseMaster/Modules/confirmationaction";
import MasterAdminMenu from "../page";
import WareHouseDialog from "../WarehouseMaster/Modules/wareHouseDialog";
import WareHouseTableComponent from "../WarehouseMaster/Modules/wareHouseTable";
import ImportResultDialog, {
  ImportResultData,
} from "@/app/Components/ImportResultDialog";

// ── Constants ─────────────────────────────────────────────────────────────────

const IMPORT_MODES = ["import", "merge", "replace"] as const;
type ImportMode = (typeof IMPORT_MODES)[number];

const IMPORT_MODE_CONFIG: Record<
  ImportMode,
  { label: string; border: string; bg: string; text: string; hover: string }
> = {
  import: {
    label: "Import",
    border: "#1976d2",
    bg: "#eff6ff",
    text: "#1976d2",
    hover: "#eff6ff",
  },
  merge: {
    label: "Merge",
    border: "#9c27b0",
    bg: "#fdf4ff",
    text: "#9c27b0",
    hover: "#fdf4ff",
  },
  replace: {
    label: "Replace",
    border: "#d32f2f",
    bg: "#fef2f2",
    text: "#d32f2f",
    hover: "#fef2f2",
  },
};

const VALID_FILE_EXTENSIONS = [".csv", ".xlsx", ".xls"] as const;

const initialLocationForm: WareHouse = {
  warehouseName: "",
  aliasName: "",
  status: "active",
  type: "",
  subWarehouseName: "",
  address: "",
  country: "",
  state: "",
  city: "",
  postalCode: 0,
  phoneNumber: "",
  email: "",
  latitude: 0,
  longitude: 0,
  description: "",
  managerName: "",
  managerContact: "",
  openingHours: null,
  closingHours: null,
  createdDate: null,
  lastUpdatedDate: null,
  createdBy: "",
};

// ── Column config ─────────────────────────────────────────────────────────────

const initialVisibleColumns: Record<string, boolean> = {
  sNo: true,
  warehouseId: true,
  warehouseName: true,
  aliasName: true,
  status: false,
  type: true,
  address: false,
  country: false,
  state: false,
  city: true,
  postalCode: false,
  phoneNumber: true,
  email: false,
  latitude: false,
  longitude: false,
  description: false,
  openingHours: false,
  closingHours: false,
  managerName: true,
  managerContact: true,
  createdDate: false,
  lastUpdatedDate: false,
  createdBy: false, // fixed: was "CreatedBy" (capital C) — now matches model field
};

const columnLabels: Record<string, string> = {
  sNo: "S.No",
  warehouseId: "WareHouse ID",
  warehouseName: "WareHouse Name",
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
  openingHours: "Opening Hours",
  closingHours: "Closing Hours",
  managerName: "Manager Name",
  managerContact: "Manager Contact",
  createdDate: "Created Date",
  lastUpdatedDate: "Last Updated Date",
  createdBy: "Created By", // fixed: label value was wrong (was "createdBy")
};

// ── Component ─────────────────────────────────────────────────────────────────

const WareHouseMaster: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { wareHouse, error, snackbarOpen, snackbarMessage } = useSelector(
    (state: RootState) => state.warehouses
  );

  // ── Dialog / UI state ─────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editData, setEditData] = useState<WareHouse | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showDeactivated, setShowDeactivated] = useState(false);

  // ── Confirmation dialog ───────────────────────────────────────────────────
  const [confirmWarehouseName, setConfirmWarehouseName] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirmationAction, setConfirmationAction] = useState<
    () => Promise<void>
  >(() => Promise.resolve());

  // ── Form state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<WareHouse>({ ...initialLocationForm });

  // ── Import state ──────────────────────────────────────────────────────────
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("import");
  const [importResultDialogOpen, setImportResultDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);

  // ── Validation error state ────────────────────────────────────────────────
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // ── Column visibility ─────────────────────────────────────────────────────
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    initialVisibleColumns
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    dispatch(fetchLocation());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      dispatch(setSnackbarMessage(error));
      dispatch(setSnackbarOpen(true));
      dispatch(clearErrors());
    }
  }, [error, dispatch]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showSnackbar = useCallback(
    (message: string) => {
      dispatch(setSnackbarMessage(message));
      dispatch(setSnackbarOpen(true));
    },
    [dispatch]
  );

  const isFormDirty = useCallback(() => {
    // Compare only primitive/serializable fields to avoid false positives
    const keys = Object.keys(initialLocationForm) as (keyof WareHouse)[];
    return keys.some((key) => formData[key] !== initialLocationForm[key]);
  }, [formData]);

  // ── Column filter ─────────────────────────────────────────────────────────

  const handleFilterClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget),
    []
  );

  const handleCloseFilter = useCallback(() => setAnchorEl(null), []);

  const toggleColumn = useCallback((key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── Add / Edit ────────────────────────────────────────────────────────────

  const handleAddNew = useCallback(() => {
    setEditData(null);
    setFormData({ ...initialLocationForm });
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback(
    (item: WareHouse) => {
      if (!item) {
        showSnackbar("Invalid warehouse data");
        return;
      }
      setEditData(item);
      setFormData({
        ...item,
        type: item.type || "",
        parentLocationId: item.parentLocationId || "",
        country: item.country || "",
        state: item.state || "",
        city: item.city || "",
        postalCode: Number(item.postalCode) || 0,
        latitude: Number(item.latitude) || 0,
        longitude: Number(item.longitude) || 0,
      });
      setDialogOpen(true);
    },
    [showSnackbar]
  );

  const handleDialogClose = useCallback(() => {
    if (isFormDirty()) {
      // Show inline discard confirmation via the existing ConfirmationDialog
      setConfirmationMessage("You have unsaved changes. Discard them?");
      setConfirmWarehouseName("");
      setConfirmationAction(() => () => {
        setFormData({ ...initialLocationForm });
        setDialogOpen(false);
        setEditData(null);
        setConfirmDialogOpen(false);
        return Promise.resolve();
      });
      setConfirmDialogOpen(false);
    } else {
      setDialogOpen(false);
      setFormData({ ...initialLocationForm });
      setEditData(null);
    }
  }, [isFormDirty]);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmitRequest = useCallback(
    (values: WareHouse) => {
      const isEdit = !!editData?.id;
      setConfirmWarehouseName(values.warehouseName || "");
      setConfirmationMessage(
        `Are you sure want to ${isEdit ? "update" : "create"} this warehouse`
      );
      setConfirmationAction(() => () => handleConfirmSubmit(values));
      setConfirmDialogOpen(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editData]
  );

  const handleConfirmSubmit = async (values: WareHouse) => {
    try {
      if (editData?.id) {
        await dispatch(updateLocation({ id: editData.id, updates: values })).unwrap();
        showSnackbar("WareHouse updated successfully");
      } else {
        await dispatch(createLocation(values)).unwrap();
        showSnackbar("WareHouse created successfully");
      }
      dispatch(fetchLocation());
      setDialogOpen(false);
      setEditData(null);
      setFormData({ ...initialLocationForm });
      setConfirmDialogOpen(false);
    } catch (error) {
      const err = error as AxiosError;
      showSnackbar(err?.message || "Operation failed");
    }
  };

  // ── Status change ─────────────────────────────────────────────────────────

  const handleStatusChange = async (item: WareHouse, activate: boolean) => {
    if (!item.id) {
      showSnackbar("Invalid Location ID");
      return;
    }
    try {
      if (activate) {
        await dispatch(activateLocation(item.id)).unwrap();
        showSnackbar("Warehouse activated successfully");
      } else {
        await dispatch(deactivateLocation(item.id)).unwrap();
        showSnackbar("Warehouse deactivated successfully");
      }
      dispatch(fetchLocation());
    } catch (error) {
      const err = error as AxiosError;
      const message =
        err.response?.data && typeof err.response.data === "string"
          ? err.response.data
          : err.message || "Status change failed";
      showSnackbar(message);
    } finally {
      setConfirmDialogOpen(false);
    }
  };

  const confirmStatusChange = useCallback(
    (item: WareHouse, activate: boolean) => {
      setConfirmWarehouseName(item.warehouseName || "");
      setConfirmationMessage(
        `Are you sure you want to ${activate ? "activate" : "deactivate"} this warehouse`
      );
      setConfirmationAction(() => () => handleStatusChange(item, activate));
      setConfirmDialogOpen(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExportCSV = useCallback(async () => {
    try {
      await dispatch(Exportwarehouse()).unwrap();
    } catch {
      showSnackbar("Failed to export warehouse data");
    }
  }, [dispatch, showSnackbar]);

  // ── Import ────────────────────────────────────────────────────────────────

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
        if (!VALID_FILE_EXTENSIONS.includes(ext as (typeof VALID_FILE_EXTENSIONS)[number])) {
          showSnackbar("Please upload a valid CSV or Excel file");
          return;
        }
        setSelectedFile(file);
        setImportMode("import");
        setImportDialogOpen(true);
      }
      if (event.target) event.target.value = "";
    },
    [showSnackbar]
  );

  const handleImportDialogClose = useCallback(() => {
    setImportDialogOpen(false);
    setSelectedFile(null);
  }, []);

  const handleImportSubmit = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportDialogOpen(false);

    try {
      const result = await dispatch(
        Importwarehouse({ file: selectedFile, mode: importMode })
      ).unwrap();

      dispatch(fetchLocation());
      setValidationErrors([]);
      setImportResult(result as unknown as ImportResultData);
      setImportResultDialogOpen(true);
    } catch (error: unknown) {
      if (error && typeof error === "object") {
        const err = error as { errors?: string[]; message?: string };
        if (Array.isArray(err.errors) && err.errors.length > 0) {
          setValidationErrors(err.errors);
          setErrorDialogOpen(true);
        } else if (typeof err.message === "string") {
          showSnackbar(err.message);
        }
      } else if (typeof error === "string") {
        showSnackbar(error);
      } else {
        showSnackbar("Failed to import warehouse data");
      }
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
    }
  };

  // ── Rollback ──────────────────────────────────────────────────────────────

  const handleRollback = useCallback(() => {
    setConfirmationMessage(
      "Are you sure you want to rollback to the previous data? This will undo the last replace operation."
    );
    setConfirmWarehouseName("");
    setConfirmationAction(() => async () => {
      try {
        await dispatch(rollbackWarehouses()).unwrap();
        dispatch(fetchLocation());
      } catch {
        // error handled by Redux slice / snackbar
      } finally {
        setConfirmDialogOpen(false);
      }
    });
    setConfirmDialogOpen(true);
  }, [dispatch]);

  // ── Sample CSV ────────────────────────────────────────────────────────────

  const handleDownloadSampleCSV = useCallback(async () => {
    setIsImporting(true);
    try {
      await dispatch(Exportheader()).unwrap();
      showSnackbar("Sample CSV downloaded successfully");
    } catch {
      showSnackbar("Failed to download sample CSV");
    } finally {
      setIsImporting(false);
    }
  }, [dispatch, showSnackbar]);

  // ── Derived values ────────────────────────────────────────────────────────

  const filterOpen = Boolean(anchorEl);
  const filterId = filterOpen ? "column-filter-popover" : undefined;
  const toggleLabel = showDeactivated ? "Show Activated" : "Show Deactivated";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box marginLeft={1}>
      <MasterAdminMenu />

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
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
          {showDeactivated ? "Deactivated WareHouse" : "Active WareHouse"}
        </Typography>

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
              {(
                [
                  { label: "Add", icon: <AddIcon className="icon-action-svg" />, onClick: handleAddNew, color: "primary" },
                  {
                    label: isImporting ? "Importing..." : "Import",
                    icon: isImporting
                      ? <CircularProgress size={20} className="icon-action-svg" />
                      : <GetAppIcon className="icon-action-svg" />,
                    onClick: handleImportClick,
                    color: "primary",
                  },
                  { label: "Export", icon: <UploadIcon className="icon-action-svg" />, onClick: handleExportCSV, color: "primary" },
                  { label: "Sample", icon: <DescriptionIcon className="icon-action-svg" />, onClick: handleDownloadSampleCSV, color: "primary" },
                  { label: "Rollback", icon: <UndoIcon className="icon-action-svg" />, onClick: handleRollback, color: "secondary" },
                ] as const
              ).map(({ label, icon, onClick, color }) => (
                <div key={label} className="icon-action-wrapper">
                  <IconButton
                    color={color}
                    onClick={onClick}
                    className="icon-action-button"
                    size="small"
                    disabled={isImporting}
                  >
                    {icon}
                  </IconButton>
                  <Typography className="icon-action-label">{label}</Typography>
                </div>
              ))}
            </>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={showDeactivated}
                onChange={() => setShowDeactivated((prev) => !prev)}
                color="primary"
                size="small"
                disabled={isImporting}
              />
            }
            label={toggleLabel}
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

      {/* ── Import Mode Dialog ────────────────────────────────────────────── */}
      <Dialog
        open={importDialogOpen}
        onClose={handleImportDialogClose}
        PaperProps={{ className: "dialog-paper-medium" }}
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
              sx={{ mb: 1, fontFamily: "'Poppins', sans-serif", fontSize: "0.7rem" }}
            >
              Selected file: <strong>{selectedFile?.name}</strong>
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography
              sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, mb: 2, fontSize: "0.8rem" }}
            >
              Choose import mode:
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, alignItems: "center" }}>
              {IMPORT_MODES.map((mode) => {
                const cfg = IMPORT_MODE_CONFIG[mode];
                const isSelected = importMode === mode;
                return (
                  <Box
                    key={mode}
                    onClick={() => setImportMode(mode)}
                    sx={{
                      width: 180,
                      py: 1,
                      px: 2,
                      borderRadius: "8px",
                      border: "2px solid",
                      borderColor: isSelected ? cfg.border : "#e2e8f0",
                      backgroundColor: isSelected ? cfg.bg : "white",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s",
                      "&:hover": { borderColor: cfg.border, backgroundColor: cfg.hover },
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        color: cfg.text,
                      }}
                    >
                      {cfg.label}
                    </Typography>
                  </Box>
                );
              })}
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

      {/* ── Validation Error Dialog ───────────────────────────────────────── */}
      <Dialog
        open={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
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

        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography
              variant="body1"
              sx={{ mb: 2, fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
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
              {validationErrors.map((err, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 1.5,
                    p: 1.5,
                    backgroundColor: "white",
                    borderLeft: "3px solid",
                    borderColor: "error.main",
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: "'Courier New', monospace", fontSize: "0.85rem" }}
                  >
                    {err}
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

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setErrorDialogOpen(false)}
            variant="contained"
            color="primary"
            sx={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Import Result Dialog ──────────────────────────────────────────── */}
      <ImportResultDialog
        open={importResultDialogOpen}
        onClose={() => {
          setImportResultDialogOpen(false);
          setImportResult(null);
        }}
        result={importResult}
        moduleName="Warehouse"
      />

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <WareHouseTableComponent
        filteredTypes={wareHouse}
        showDeactivatedTable={showDeactivated}
        onOpenEdit={handleEdit}
        onAddNew={handleAddNew}
        onActivate={(item: WareHouse) => confirmStatusChange(item, true)}
        onDeactivate={(item: WareHouse) => confirmStatusChange(item, false)}
        visibleColumns={visibleColumns}
        columnLabels={columnLabels}
        resultDialogOpen={false}
        onCloseResultDialog={() => {}}
      />

      {/* ── Column filter popover ─────────────────────────────────────────── */}
      <Popover
        id={filterId}
        open={filterOpen}
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
            sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.85rem" }}
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

      {/* ── Warehouse form dialog ─────────────────────────────────────────── */}
      <WareHouseDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        handleSubmit={handleSubmitRequest}
        formData={formData}
        editMode={!!editData}
        handleDiscardChanges={() => {
          setFormData({ ...initialLocationForm });
          setDialogOpen(false);
          setEditData(null);
        }}
      />

      {/* ── Confirmation dialog ───────────────────────────────────────────── */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        title="Confirm Action"
        message={confirmationMessage}
        locationName={confirmWarehouseName}
        onCancel={() => setConfirmDialogOpen(false)}
        onConfirm={confirmationAction}
        confirmText="Yes"
        cancelText="No"
      />

      {/* ── Snackbar ──────────────────────────────────────────────────────── */}
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

export default WareHouseMaster;