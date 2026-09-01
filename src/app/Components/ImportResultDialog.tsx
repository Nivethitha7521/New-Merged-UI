

"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  Tabs,
  Tab,
  Collapse,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImportRowResult {
  row: number;
  // Location fields
  branchName?: string;
  locationId?: string;
  // Warehouse fields
  warehouseName?: string;
  warehouseId?: string;

  // Section fields
  sectionsName?: string;
  sectionsId?: string;

// Vehicle fields
  vehicleName?: string;
  vehicleId?: string;
  vehicleNo?: string;

  // Category fields
  categoryName?: string;
  categoryId?: string;

  // Subcategory fields
  subCategoryName?: string;
  subCategoryId?: string;

    // Sfg fields
  sfgName?: string;
  sfgCode?: string;

  // Item master fields
  varianceName?: string;
  itemCode?: string;


  // Common
  status_message: string;
  updatedFields?: string[];
  assignedId?: string;
  error?: string;
}

export interface ImportResultData {
  message: string;
  inserted_count: number;
  updated_count: number;
  no_change_count?: number;
  errorCount: number;
  successful: ImportRowResult[];
  updated: ImportRowResult[];
  failed: ImportRowResult[];
  duplicates?: string[];
  duplicate_details?: any[];
  max_id_number?: number;
}

interface ImportResultDialogProps {
  open: boolean;
  onClose: () => void;
  result: ImportResultData | null;
  moduleName?: string;
}

// ─── Tab panel helper ─────────────────────────────────────────────────────────

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    sx={{ pt: 1.5, minHeight: 80 }}
  >
    {value === index && children}
  </Box>
);

// ─── Single expandable row card ───────────────────────────────────────────────

interface RowCardProps {
  item: ImportRowResult;
  variant: "success" | "updated" | "nochange" | "error";
}

const variantConfig = {
  success: {
    border: "#22c55e",
    bg: "#f0fdf4",
    icon: <CheckCircleOutlineIcon sx={{ fontSize: 16, color: "#16a34a" }} />,
    chipColor: "#dcfce7",
    chipText: "#15803d",
    label: "Imported",
  },
  updated: {
    border: "#3b82f6",
    bg: "#eff6ff",
    icon: <SyncAltIcon sx={{ fontSize: 16, color: "#2563eb" }} />,
    chipColor: "#dbeafe",
    chipText: "#1d4ed8",
    label: "Updated",
  },
  nochange: {
    border: "#94a3b8",
    bg: "#f8fafc",
    icon: <InfoOutlinedIcon sx={{ fontSize: 16, color: "#64748b" }} />,
    chipColor: "#f1f5f9",
    chipText: "#475569",
    label: "No Change",
  },
  error: {
    border: "#ef4444",
    bg: "#fef2f2",
    icon: <ErrorOutlineIcon sx={{ fontSize: 16, color: "#dc2626" }} />,
    chipColor: "#fee2e2",
    chipText: "#b91c1c",
    label: "Failed",
  },
};

const RowCard: React.FC<RowCardProps> = ({ item, variant }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = variantConfig[variant];
  const hasFields =
    item.updatedFields && item.updatedFields.length > 0;
  const hasError = !!item.error;
  const canExpand = hasFields || hasError;

  return (
    <Box
      sx={{
        border: `1px solid ${cfg.border}22`,
        borderLeft: `3px solid ${cfg.border}`,
        borderRadius: "6px",
        backgroundColor: cfg.bg,
        mb: 1,
        overflow: "hidden",
        transition: "box-shadow 0.15s",
        "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
      }}
    >
      {/* Row header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 1,
          cursor: canExpand ? "pointer" : "default",
        }}
        onClick={() => canExpand && setExpanded((p) => !p)}
      >
        {cfg.icon}

        {/* Branch name */}
        <Typography
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#1e293b",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.branchName || item.warehouseName || item.sectionsName || item.vehicleName || item.categoryName || item.subCategoryName || item.sfgName || `Row ${item.row}`}
        </Typography>

        {/* ID badge — locationId or warehouseId */}
        {(item.locationId || item.warehouseId || item.sectionsId|| item.vehicleName || item.categoryName || item.subCategoryName || item.sfgName) && (
          <Typography
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.65rem",
              color: "#64748b",
              whiteSpace: "nowrap",
            }}
          >
            {item.locationId || item.warehouseId || item.sectionsId || item.vehicleName || item.categoryName || item.subCategoryName || item.sfgName}
          </Typography>
        )}

        {/* Status chip */}
        <Box
          sx={{
            backgroundColor: cfg.chipColor,
            color: cfg.chipText,
            px: 1,
            py: 0.25,
            borderRadius: "4px",
            fontSize: "0.62rem",
            fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          {cfg.label}
        </Box>

        {/* Row number */}
        <Typography
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "0.62rem",
            color: "#94a3b8",
            whiteSpace: "nowrap",
          }}
        >
          Row {item.row}
        </Typography>

        {/* Expand toggle */}
        {canExpand && (
          <IconButton size="small" sx={{ p: 0.25 }}>
            {expanded ? (
              <ExpandLessIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
            ) : (
              <ExpandMoreIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
            )}
          </IconButton>
        )}
      </Box>

      {/* Expandable detail */}
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ px: 2, py: 1.25 }}>
          {/* Status message */}
          <Typography
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.72rem",
              color: "#334155",
              mb: hasFields ? 1 : 0,
            }}
          >
            {item.status_message || item.error}
          </Typography>

          {/* Updated field chips */}
          {hasFields && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {item.updatedFields!.map((f) => (
                <Box
                  key={f}
                  sx={{
                    backgroundColor: "#dbeafe",
                    color: "#1d4ed8",
                    px: 0.75,
                    py: 0.2,
                    borderRadius: "4px",
                    fontSize: "0.62rem",
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {f}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

// ─── Summary stat card ────────────────────────────────────────────────────────

const StatCard: React.FC<{
  count: number;
  label: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
}> = ({ count, label, color, bg, icon }) => (
  <Box
    sx={{
      flex: 1,
      minWidth: 80,
      backgroundColor: bg,
      borderRadius: "8px",
      p: 1.25,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 0.4,
    }}
  >
    <Box sx={{ color }}>{icon}</Box>
    <Typography
      sx={{
        fontFamily: "'Poppins', sans-serif",
        fontSize: "1.15rem",
        fontWeight: 700,
        color,
        lineHeight: 1,
      }}
    >
      {count}
    </Typography>
    <Typography
      sx={{
        fontFamily: "'Poppins', sans-serif",
        fontSize: "0.62rem",
        color: "#64748b",
        textAlign: "center",
        lineHeight: 1.2,
      }}
    >
      {label}
    </Typography>
  </Box>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      py: 4,
      gap: 1,
      color: "#94a3b8",
    }}
  >
    <InfoOutlinedIcon sx={{ fontSize: 32 }} />
    <Typography
      sx={{
        fontFamily: "'Poppins', sans-serif",
        fontSize: "0.75rem",
        color: "#94a3b8",
      }}
    >
      {message}
    </Typography>
  </Box>
);

// ─── Main Dialog ──────────────────────────────────────────────────────────────

const ImportResultDialog: React.FC<ImportResultDialogProps> = ({
  open,
  onClose,
  result,
  moduleName = "Data",
}) => {
  const [tab, setTab] = useState(0);

  if (!result) return null;

  const noChangeRows = result.updated?.filter(
    (r) => !r.updatedFields || r.updatedFields.length === 0
  ) ?? [];
  const updatedRows = result.updated?.filter(
    (r) => r.updatedFields && r.updatedFields.length > 0
  ) ?? [];

  const totalRows =
    result.inserted_count +
    (result.updated_count ?? 0) +
    (result.no_change_count ?? noChangeRows.length) +
    result.errorCount;

  const successRate =
    totalRows > 0
      ? Math.round(
          ((result.inserted_count + (result.updated_count ?? 0)) / totalRows) *
            100
        )
      : 0;

  // Tab definitions — only show tabs that have data
  const tabs: { label: string; count: number; key: string }[] = [
    {
      label: "Imported",
      count: result.inserted_count,
      key: "inserted",
    },
    {
      label: "Updated",
      count: result.updated_count ?? updatedRows.length,
      key: "updated",
    },
    {
      label: "No Change",
      count: result.no_change_count ?? noChangeRows.length,
      key: "nochange",
    },
    { label: "Failed", count: result.errorCount, key: "failed" },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          fontFamily: "'Poppins', sans-serif",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* ── Title bar ────────────────────────────────────────────────────── */}
      <DialogTitle
        sx={{
          px: 2.5,
          py: 1.75,
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "6px",
              backgroundColor:
                result.errorCount === 0 ? "#dcfce7" : "#fef3c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {result.errorCount === 0 ? (
              <CheckCircleOutlineIcon
                sx={{ fontSize: 16, color: "#16a34a" }}
              />
            ) : (
              <WarningAmberIcon sx={{ fontSize: 16, color: "#d97706" }} />
            )}
          </Box>
          <Box>
            <Typography
              sx={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: "0.875rem",
                color: "#0f172a",
                lineHeight: 1.2,
              }}
            >
              {moduleName} Import Results
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: "0.68rem",
                color: "#64748b",
              }}
            >
              {result.message}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "#94a3b8" }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{ p: 0, overflow: "hidden", display: "flex", flexDirection: "column", flex: 1 }}
      >
        {/* ── Summary stat row ──────────────────────────────────────────── */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            px: 2.5,
            pt: 2,
            pb: 1.5,
            flexShrink: 0,
          }}
        >
          <StatCard
            count={result.inserted_count}
            label="Imported"
            color="#16a34a"
            bg="#f0fdf4"
            icon={<CheckCircleOutlineIcon sx={{ fontSize: 18 }} />}
          />
          <StatCard
            count={result.updated_count ?? updatedRows.length}
            label="Updated"
            color="#2563eb"
            bg="#eff6ff"
            icon={<SyncAltIcon sx={{ fontSize: 18 }} />}
          />
          <StatCard
            count={result.no_change_count ?? noChangeRows.length}
            label="No Change"
            color="#64748b"
            bg="#f8fafc"
            icon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />}
          />
          <StatCard
            count={result.errorCount}
            label="Failed"
            color={result.errorCount > 0 ? "#dc2626" : "#64748b"}
            bg={result.errorCount > 0 ? "#fef2f2" : "#f8fafc"}
            icon={<ErrorOutlineIcon sx={{ fontSize: 18 }} />}
          />
        </Box>

        {/* ── Progress bar ──────────────────────────────────────────────── */}
        {totalRows > 0 && (
          <Box sx={{ px: 2.5, pb: 1.5, flexShrink: 0 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 0.5,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "0.65rem",
                  color: "#64748b",
                }}
              >
                {totalRows} total rows processed
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "0.65rem",
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                {successRate}% success
              </Typography>
            </Box>
            <Box
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: "#f1f5f9",
                overflow: "hidden",
                display: "flex",
              }}
            >
              {/* Inserted */}
              {result.inserted_count > 0 && (
                <Box
                  sx={{
                    width: `${(result.inserted_count / totalRows) * 100}%`,
                    backgroundColor: "#22c55e",
                  }}
                />
              )}
              {/* Updated */}
              {(result.updated_count ?? updatedRows.length) > 0 && (
                <Box
                  sx={{
                    width: `${
                      ((result.updated_count ?? updatedRows.length) /
                        totalRows) *
                      100
                    }%`,
                    backgroundColor: "#3b82f6",
                  }}
                />
              )}
              {/* No change */}
              {(result.no_change_count ?? noChangeRows.length) > 0 && (
                <Box
                  sx={{
                    width: `${
                      ((result.no_change_count ?? noChangeRows.length) /
                        totalRows) *
                      100
                    }%`,
                    backgroundColor: "#cbd5e1",
                  }}
                />
              )}
              {/* Failed */}
              {result.errorCount > 0 && (
                <Box
                  sx={{
                    width: `${(result.errorCount / totalRows) * 100}%`,
                    backgroundColor: "#ef4444",
                  }}
                />
              )}
            </Box>
            {/* Legend */}
            <Box sx={{ display: "flex", gap: 2, mt: 0.75, flexWrap: "wrap" }}>
              {[
                { color: "#22c55e", label: "Imported" },
                { color: "#3b82f6", label: "Updated" },
                { color: "#cbd5e1", label: "No Change" },
                { color: "#ef4444", label: "Failed" },
              ].map(({ color, label }) => (
                <Box
                  key={label}
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: color,
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: "0.6rem",
                      color: "#94a3b8",
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Divider />

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <Box sx={{ flexShrink: 0, borderBottom: "1px solid #f1f5f9" }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{
              minHeight: 38,
              "& .MuiTab-root": {
                fontFamily: "'Poppins', sans-serif",
                fontSize: "0.7rem",
                fontWeight: 500,
                minHeight: 38,
                textTransform: "none",
                color: "#64748b",
                gap: 0.5,
              },
              "& .Mui-selected": {
                color: "#0f172a",
                fontWeight: 600,
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#0f172a",
                height: 2,
              },
            }}
          >
            {tabs.map((t, i) => (
              <Tab
                key={t.key}
                label={
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.6,
                    }}
                  >
                    {t.label}
                    {t.count > 0 && (
                      <Box
                        sx={{
                          backgroundColor:
                            t.key === "failed" && t.count > 0
                              ? "#ef4444"
                              : t.key === "inserted"
                              ? "#22c55e"
                              : t.key === "updated"
                              ? "#3b82f6"
                              : "#94a3b8",
                          color: "white",
                          borderRadius: "10px",
                          px: 0.75,
                          fontSize: "0.58rem",
                          fontWeight: 700,
                          lineHeight: "16px",
                          minWidth: 16,
                          textAlign: "center",
                        }}
                      >
                        {t.count}
                      </Box>
                    )}
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* ── Tab content ───────────────────────────────────────────────── */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 1 }}>
          {/* Imported tab */}
          <TabPanel value={tab} index={0}>
            {result.successful && result.successful.length > 0 ? (
              result.successful.map((item) => (
                <RowCard key={`s-${item.row}`} item={item} variant="success" />
              ))
            ) : (
              <EmptyState message="No new records were imported." />
            )}
          </TabPanel>

          {/* Updated tab */}
          <TabPanel value={tab} index={1}>
            {updatedRows.length > 0 ? (
              updatedRows.map((item) => (
                <RowCard key={`u-${item.row}`} item={item} variant="updated" />
              ))
            ) : (
              <EmptyState message="No records were updated." />
            )}
          </TabPanel>

          {/* No Change tab */}
          <TabPanel value={tab} index={2}>
            {noChangeRows.length > 0 ? (
              noChangeRows.map((item) => (
                <RowCard
                  key={`n-${item.row}`}
                  item={item}
                  variant="nochange"
                />
              ))
            ) : (
              <EmptyState message="All records had changes or were new." />
            )}
          </TabPanel>

          {/* Failed tab */}
          <TabPanel value={tab} index={3}>
            {result.failed && result.failed.length > 0 ? (
              result.failed.map((item) => (
                <RowCard key={`f-${item.row}`} item={item} variant="error" />
              ))
            ) : (
              <EmptyState message="No errors found. All rows processed successfully." />
            )}
          </TabPanel>
        </Box>
      </DialogContent>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <DialogActions
        sx={{
          px: 2.5,
          py: 1.5,
          borderTop: "1px solid #f1f5f9",
          flexShrink: 0,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "0.65rem",
            color: "#94a3b8",
          }}
        >
          {result.errorCount > 0
            ? "Fix the errors in your file and re-import."
            : "Import completed successfully."}
        </Typography>
        <button className="btn-primary" onClick={onClose}>
          Close
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportResultDialog;