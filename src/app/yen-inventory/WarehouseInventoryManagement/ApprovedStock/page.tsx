"use client";

// import React, { useCallback } from "react";
//replace the line 29 7 1
import React, { useCallback, useRef } from "react";
import { Box, Typography, Paper, Tooltip, IconButton } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  setIsFullScreen,
} from "../../../../features/yen_inventory/wharehoueStoreSlice";

import WarehouseInventoryManagementPage from "../page";
import ApprovedStockTable from "../../../../components/Inventory/storestockvarience/ui/approvedStocktable";
import { AppDispatch, RootState } from "@/redux/store";
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

const WarehouseApprovedStock: React.FC = () => {
  // newly add this line 29 7 1
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  const { isFullScreen, warehouses, searchParams } = useSelector(
    (state: RootState) => state.purchaseItems
  );

  const selectedWarehouseLabel = React.useMemo(() => {
    const w = warehouses.find(
      (w) =>
        w.locationId === searchParams.locationName ||
        w.locationName === searchParams.locationName
    );

    return w?.locationName || searchParams.locationName || "";
  }, [warehouses, searchParams.locationName]);

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
      {!isFullScreen && <WarehouseInventoryManagementPage />}

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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.55,
            px: { xs: 0.75, md: 1 },
            py: 0.55,
            minHeight: 46,
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

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 950,
                  color: UI.textPrimary,
                  lineHeight: 1.1,
                }}
              >
                Approved Stock Variance
              </Typography>

              <Typography
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
                {selectedWarehouseLabel
                  ? `Warehouse: ${selectedWarehouseLabel}`
                  : "No warehouse selected to load approved data"}
              </Typography>
            </Box>
          </Box>

          <Tooltip title={isFullScreen ? "Exit Full Screen" : "Full Screen"} arrow>
            <span>
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

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          p: { xs: 0.75, md: 1 },
        }}
      >
        {/* <ApprovedStockTable isFullScreen={isFullScreen} /> */}
        {/* replace the line 29 7 1 */}
        <ApprovedStockTable
          isFullScreen={isFullScreen}
          scrollContainerRef={scrollContainerRef}
        />
      </Box>
    </Box>
  );
};

export default WarehouseApprovedStock;
