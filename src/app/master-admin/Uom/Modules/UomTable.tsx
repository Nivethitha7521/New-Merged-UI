"use client";

import React, { memo } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";

import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshIcon from "@mui/icons-material/RestoreRounded";

import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import {
  UomState,
  getDisplayFormat,
} from "../Modules/Uomtypes";

interface UomTableProps {
  displayedUoms: UomState[];
  showDeactivated: boolean;
  isSubmitting: boolean;
  handleEdit: (id: string) => void;
  handleDeactivate: (id: string) => void;
  handleActivate: (id: string) => void;
}

const RowActions = memo(
  ({
    id,
    showDeactivated,
    handleEdit,
    handleDeactivate,
    handleActivate,
    canEdit,
  }: {
    id: string;
    showDeactivated: boolean;
    handleEdit: (id: string) => void;
    handleDeactivate: (id: string) => void;
    handleActivate: (id: string) => void;
    canEdit: boolean;
  }) => {
    if (showDeactivated) {
      return (
        <Tooltip title="Activate UOM" arrow>
          <IconButton
            type="button"
            onClick={() => handleActivate(id)}
            className="purchase-master-action-button is-activate"
            aria-label="Activate UOM"
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }

    if (!canEdit) {
      return null;
    }

    return (
      <>
        <Tooltip title="Edit UOM" arrow>
          <IconButton
            type="button"
            onClick={() => handleEdit(id)}
            className="purchase-master-action-button is-edit"
            aria-label="Edit UOM"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Deactivate UOM" arrow>
          <IconButton
            type="button"
            onClick={() => handleDeactivate(id)}
            className="purchase-master-action-button is-delete"
            aria-label="Deactivate UOM"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </>
    );
  }
);

RowActions.displayName = "RowActions";

const UomTable: React.FC<UomTableProps> = ({
  displayedUoms,
  showDeactivated,
  isSubmitting,
  handleEdit,
  handleDeactivate,
  handleActivate,
}) => {
  /*
   * Keep the selector exactly as used by your working page/store.
   * Do not change this to another reducer key unless your page already
   * uses the Master Admin reducer key.
   */
  const { loading } = useSelector(
    (state: RootState) => state.maUoms
  );

  if (isSubmitting) {
    return (
      <Box className="master-admin-table-loading">
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box className="purchase-master-table-shell">
      <div className="purchase-native-table-wrapper">
        <table className="purchase-native-table uom-native-table">
          <thead>
            <tr>
              <th className="uom-column-sno">S.NO</th>
              <th className="uom-column-id">UOM ID</th>
              <th className="uom-column-measurement">
                Measurement Type
              </th>
              <th className="uom-column-name">UOM</th>
              <th className="uom-column-precision">
                Precision
              </th>
              <th className="uom-column-display">
                Display Format
              </th>
              <th className="uom-column-actions">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="empty-state"
                >
                  Loading...
                </td>
              </tr>
            ) : displayedUoms.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="empty-state"
                >
                  No{" "}
                  {showDeactivated
                    ? "deactivated"
                    : "active"}{" "}
                  UOMs found
                </td>
              </tr>
            ) : (
              displayedUoms.map((uom, index) => (
                <tr key={uom.id ?? index}>
                  <td className="uom-column-sno">
                    {index + 1}
                  </td>

                  <td className="uom-column-id">
                    <span className="purchase-master-id-pill">
                      {uom.uomId ?? "N/A"}
                    </span>
                  </td>

                  <td className="uom-column-measurement">
                    <span className="purchase-master-value-pill">
                      {uom.measurementType ?? "N/A"}
                    </span>
                  </td>

                  <td className="uom-column-name">
                    <Box className="purchase-master-name-cell">
                      <span className="purchase-master-avatar">
                        {(uom.uom || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <span>{uom.uom ?? "N/A"}</span>
                    </Box>
                  </td>

                  <td className="uom-column-precision">
                    {uom.precision ?? "N/A"}
                  </td>

                  <td className="uom-column-display">
                    {getDisplayFormat(uom.precision)}
                  </td>

                  <td className="uom-column-actions">
                    <Box className="purchase-master-actions">
                      <RowActions
                        id={uom.id!}
                        showDeactivated={showDeactivated}
                        handleEdit={handleEdit}
                        handleDeactivate={handleDeactivate}
                        handleActivate={handleActivate}
                        canEdit={uom.editStatus}
                      />
                    </Box>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Box>
  );
};

export default memo(UomTable);