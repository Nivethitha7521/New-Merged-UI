

"use client";
import React from "react";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshIcon from "@mui/icons-material/RestoreRounded";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Pagination,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Location } from "../Models/locationModels";
import { useAppSelector, useAppDispatch } from "@/redux/store";
import { fetchLocation, selectLocations } from "../Features/locationSlice";

interface ImportResult {
  message: string;
  inserted_count: number;
  updated_count: number;
  errorCount: number;
  successful: Array<{
    row: number;
    data: Location;
    assignedId?: string;
  }>;
  updated: Array<{
    row: number;
    data: Location;
    message: string;
  }>;
  failed: Array<{
    row: number;
    data: Location;
    error: string;
    missingFields: string[];
  }>;
}

interface LocationTableProps {
  filteredTypes: Location[];
  showDeactivatedTable: boolean;
  onOpenEdit: (type: Location) => void;
  onAddNew: () => void;
  onDeactivate: (type: Location) => void;
  onActivate: (type: Location) => void;
  visibleColumns: Record<string, boolean>;
  importResult: ImportResult | null;
  resultDialogOpen: boolean;
  onCloseResultDialog: () => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
}

const columnLabels: Record<string, string> = {
  sNo: "S.No",
  locationId: "Location ID",
  branchName: "Branch Name",
  aliasName: "Alias Name",
  status: "Status",
  address: "Address",
  country: "Country",
  state: "State",
  city: "City",
  postalCode: "Postal Code",
  phoneNumber: "Phone Number",
  email: "Email",
  salesTypes: "Sales Types",
  latitude: "Latitude",
  longitude: "Longitude",
  description: "Description",
  managerName: "Manager Name",
  managerContact: "Manager Contact",
  createdDate: "Created Date",
  lastUpdatedDate: "Last Updated Date",
  createdBy: "Created By",
};
const LOCATION_COLUMN_KEYS: (keyof Location | "sNo")[] = [
  "sNo",
  "locationId",
  "branchName",
  "aliasName",
  "type",
  "status",
  "address",
  "country",
  "state",
  "city",
  "postalCode",
  "phoneNumber",
  "email",
  "salesTypes",
  "latitude",
  "longitude",
  "description",
  "openingHours",
  "closingHours",
  "managerName",
  "managerContact",
  "createdDate",
  "lastUpdatedDate",
  "createdBy",
];
const LocationTableComponent: React.FC<LocationTableProps> = ({
  filteredTypes,
  showDeactivatedTable,
  onOpenEdit,
  onDeactivate,
  onActivate,
  visibleColumns,
  importResult,
  resultDialogOpen,
  onCloseResultDialog,
  searchValue,
  setSearchValue
}) => {

  const dispatch = useAppDispatch();
  const { page, totalPages } = useAppSelector(selectLocations);

  const displayedData = filteredTypes.filter((type) =>
    showDeactivatedTable ? type.status === "inactive" : type.status === "active"
  );

const visibleColumnKeys = LOCATION_COLUMN_KEYS.filter(
  (key) => visibleColumns[key]
);
const renderLocationValue = (
  location: Location,
  key: keyof Location
): React.ReactNode => {
  const value = location[key];

  if (key === "status") {
    return (
      <span
        className={`purchase-master-status-pill ${
          location.status === "active"
            ? "is-active"
            : "is-inactive"
        }`}
      >
        {location.status === "active"
          ? "Active"
          : "Inactive"}
      </span>
    );
  }

  if (
    key === "country" ||
    key === "state" ||
    key === "city" ||
    key === "salesTypes"
  ) {
    if (Array.isArray(value)) {
      return value.join(", ") || "-";
    }
  }

  return value !== null &&
    value !== undefined &&
    value !== ""
    ? String(value)
    : "-";
};
  return (
    <>
<Box className="purchase-master-table-shell">
  <div className="purchase-native-table-wrapper">
    <table className="purchase-native-table location-native-table">
      <thead>
        <tr>
          {visibleColumnKeys.map((key) => (
            <th
              key={String(key)}
              className={`location-column-${String(key)}`}
            >
              {columnLabels[String(key)] ||
                String(key)
                  .replace(/([A-Z])/g, " $1")
                  .trim()
                  .toUpperCase()}
            </th>
          ))}

          <th className="location-column-actions">
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        {displayedData.length > 0 ? (
          displayedData.map((location, index) => (
            <tr key={location.branchId}>
              {visibleColumnKeys.map((key) => {
                if (key === "sNo") {
                  return (
                    <td
                      key={key}
                      className="location-column-sNo"
                    >
                      {(page - 1) * 15 + index + 1}
                    </td>
                  );
                }

                if (key === "locationId") {
                  return (
                    <td
                      key={key}
                      className="location-column-locationId"
                    >
                      <span className="purchase-master-id-pill">
                        {location.locationId || "-"}
                      </span>
                    </td>
                  );
                }

                if (key === "branchName") {
                  return (
                    <td
                      key={key}
                      className="location-column-branchName"
                    >
                      <Box className="purchase-master-name-cell">
                        <span className="purchase-master-avatar">
                          {(location.branchName || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        <span>
                          {location.branchName || "-"}
                        </span>
                      </Box>
                    </td>
                  );
                }

                return (
                  <td
                    key={String(key)}
                    className={`location-column-${String(key)}`}
                  >
                    {renderLocationValue(
                      location,
                      key as keyof Location
                    )}
                  </td>
                );
              })}

              <td className="location-column-actions">
                <Box className="purchase-master-actions">
                  {!showDeactivatedTable &&
                    location.status === "active" && (
                      <>
                        <Tooltip title="Edit location" arrow>
                          <IconButton
                            type="button"
                            onClick={() =>
                              onOpenEdit(location)
                            }
                            className="purchase-master-action-button is-edit"
                            aria-label="Edit location"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip
                          title="Deactivate location"
                          arrow
                        >
                          <IconButton
                            type="button"
                            onClick={() =>
                              onDeactivate(location)
                            }
                            className="purchase-master-action-button is-delete"
                            aria-label="Deactivate location"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                  {showDeactivatedTable &&
                    location.status === "inactive" && (
                      <Tooltip
                        title="Activate location"
                        arrow
                      >
                        <IconButton
                          type="button"
                          onClick={() =>
                            onActivate(location)
                          }
                          className="purchase-master-action-button is-activate"
                          aria-label="Activate location"
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                </Box>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={visibleColumnKeys.length + 1}
              className="empty-state"
            >
              No{" "}
              {showDeactivatedTable
                ? "Deactivated"
                : "Active"}{" "}
              Locations Found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</Box>

      {totalPages > 1 && (
       <Box className="master-admin-pagination">
          <Pagination
            count={totalPages}
            page={page}
            color="primary"
            onChange={(event, value) => {
              dispatch(fetchLocation({ search: searchValue, page: value }));
            }}
          />
        </Box>
      )}

      <Dialog
        open={resultDialogOpen}
        onClose={onCloseResultDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Import Results</DialogTitle>
        <DialogContent>
          {importResult && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Typography>
                Inserted: {importResult.inserted_count} | Updated:{" "}
                {importResult.updated_count} | Errors: {importResult.errorCount}
              </Typography>

              {importResult.failed.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>
                    Failed Rows ({importResult.failed.length})
                  </Typography>
                  <List dense sx={{ maxHeight: 300, overflow: "auto" }}>
                    {importResult.failed.map((fail, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`Row ${fail.row}: ${fail.error}`}
                          secondary={
                            fail.missingFields.length > 0
                              ? `Missing fields: ${fail.missingFields.join(", ")}`
                              : `Data: ${JSON.stringify(fail.data)}`
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {importResult.successful.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>
                    Successful Imports ({importResult.successful.length})
                  </Typography>
                  <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
                    {importResult.successful.slice(0, 10).map((success, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`Row ${success.row}: ${success.data.branchName}`}
                          secondary={`Assigned ID: ${success.assignedId}`}
                        />
                      </ListItem>
                    ))}
                    {importResult.successful.length > 10 && (
                      <ListItem>
                        <ListItemText
                          primary={`... and ${importResult.successful.length - 10
                            } more`}
                        />
                      </ListItem>
                    )}
                  </List>
                </>
              )}

              {importResult.updated.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>
                    Updated Records ({importResult.updated.length})
                  </Typography>
                  <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
                    {importResult.updated.map((update, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`Row ${update.row}: ${update.data.branchName}`}
                          secondary={update.message}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseResultDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LocationTableComponent;