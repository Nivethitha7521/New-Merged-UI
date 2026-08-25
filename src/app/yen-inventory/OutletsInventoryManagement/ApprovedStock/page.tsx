"use client";

import React, { useCallback } from "react";
import { Box, Typography, Paper, Tooltip, IconButton } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSelectedLocation,
  selectIsFullScreen,
  setIsFullScreen,
  selectBranches,
} from "../../../../features/yen_inventory/OutletPhysicalVarianceSlice";

import OutletsInventoryManagementPage from "../page";
import { StockAdjustmentTable } from "../../../../components/Inventory/physcialstockvarience/ui/stockAdjustmentTable";
import { AppDispatch } from "@/redux/store";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";

const UI = {
  pageBg: "#f6f9fd",
  surface: "#ffffff",
  surfaceSoft: "#fbfdff",
  border: "#e8eef6",
  accent: "#1976d2",
  accentDark: "#1258a8",
  accentBg: "#eef6ff",
  success: "#16a34a",
  successBg: "#ecfdf5",
  successBorder: "#bbf7d0",
  textPrimary: "#0f172a",
  textSecondary: "#334155",
  textMuted: "#64748b",
};

const OutletApprovedStock: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const isFullScreen = useSelector(selectIsFullScreen);
  const selectedLocation = useSelector(selectSelectedLocation);
  const branches = useSelector(selectBranches);

  const selectedBranchLabel = React.useMemo(() => {
    const branch = branches.find(
      (b) =>
        b.locationId === selectedLocation ||
        b.locationName === selectedLocation ||
        b.aliasName === selectedLocation
    );

    return branch?.aliasName || branch?.locationName || selectedLocation || "";
  }, [branches, selectedLocation]);

  const toggleFullScreen = useCallback(() => {
    dispatch(setIsFullScreen(!isFullScreen));
  }, [dispatch, isFullScreen]);

  return (
    <Box
      sx={{
        height: "calc(100dvh - var(--app-topbar-height, 64px))",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: UI.pageBg,
        pt: "env(safe-area-inset-top)",
        pb: "env(safe-area-inset-bottom)",
        ...(isFullScreen
          ? {
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100dvh",
            zIndex: 9999,
            backgroundColor: UI.pageBg,
          }
          : {}),
      }}
    >
      {!isFullScreen && <OutletsInventoryManagementPage />}

      <Paper
        elevation={0}
        sx={{
          flexShrink: 0,
          borderRadius: 0,
          borderBottom: `1px solid ${UI.border}`,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(248,251,255,0.86) 100%)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          position: "relative",
          zIndex: 100,
        }}
      >
        {/* <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.55,
            px: { xs: 0.75, md: 1 },
            py: 0.55,
            minHeight: 46,
            minWidth: 0,
          }}
        > */}
        {/* replace the part 12 8 3 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            px: { xs: 1, sm: 1.25, md: 1.5 },
            py: 0.6,
            minHeight: 48,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              gap: 0.75,
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: "9px",
                bgcolor: UI.successBg,
                color: UI.success,
                border: `1px solid ${UI.successBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FactCheckOutlinedIcon sx={{ fontSize: 16 }} />
            </Box>

            {/* <Box sx={{ minWidth: 0 }}> */}
            {/* replace the line 12 8 2 */}
            <Box sx={{ minWidth: 0, overflow: "hidden" }}>
              {/* <Typography
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 950,
                  color: UI.textPrimary,
                  lineHeight: 1.1,
                }}
              >
                Approved Stock Variance
              </Typography> */}
              {/* replace the part 12 8 2 */}
              <Typography
                noWrap
                sx={{
                  fontSize: { xs: "0.72rem", sm: "0.78rem" },
                  fontWeight: 950,
                  color: UI.textPrimary,
                  lineHeight: 1.15,
                }}
              >
                Approved Stock Variance
              </Typography>

              {/* <Typography
                sx={{
                  mt: 0.1,
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: UI.textMuted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedBranchLabel
                  ? `Outlet: ${selectedBranchLabel}`
                  : "No outlet selected to load approved data"}
              </Typography> */}
              {/* replace the part 12 8 2 */}
              <Typography
                noWrap
                sx={{
                  mt: 0.15,
                  fontSize: { xs: "0.56rem", sm: "0.62rem" },
                  fontWeight: 700,
                  color: UI.textMuted,
                }}
              >
                {selectedBranchLabel
                  ? `Outlet: ${selectedBranchLabel}`
                  : "No outlet selected"}
              </Typography>
            </Box>
          </Box>

          <Tooltip title={isFullScreen ? "Exit Full Screen" : "Full Screen"} arrow>
            <span>
              {/* <IconButton
                onClick={toggleFullScreen}
                size="small"
                aria-label={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "9px",
                  border: `1px solid ${UI.border}`,
                  bgcolor: UI.surface,
                  color: UI.textSecondary,
                  "&:hover": {
                    bgcolor: UI.surfaceSoft,
                    color: UI.accent,
                  },
                }}
              > */}
              {/* replace the part 12 8 2 */}
              <IconButton
                onClick={toggleFullScreen}
                size="small"
                aria-label={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "9px",
                  border: `1px solid ${UI.border}`,
                  bgcolor: UI.surface,
                  color: UI.textSecondary,
                  flexShrink: 0,
                  "&:hover": {
                    bgcolor: UI.surfaceSoft,
                    color: UI.accent,
                  },
                }}
              >
                {isFullScreen ? (
                  <FullscreenExitIcon fontSize="small" />
                ) : (
                  <FullscreenIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Paper>

      {/* <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          p: { xs: 0.75, md: 1 },
        }}
      > */}
      {/*replace the part 12 8 2*/}
            <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          p: { xs: 0.75, md: 1 },
          overflow: "hidden",
        }}
      >
        <StockAdjustmentTable isFullScreen={isFullScreen} />
      </Box>
    </Box>
  );
};

export default OutletApprovedStock;
