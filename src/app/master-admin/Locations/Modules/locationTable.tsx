

"use client";
import React from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
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

  const visibleColumnKeys = Object.keys(visibleColumns).filter(
    (key) => visibleColumns[key]
  );

  return (
    <>
      <div className="table-container" style={{ maxHeight: 'calc(90vh - 170px)', }}>
        <table className="custom-table">
          <thead>
            <tr>
              {visibleColumnKeys.map((key) => (
                <th key={key}>
                  {columnLabels[key] ||
                    key.replace(/([A-Z])/g, " $1").trim().toUpperCase()}
                </th>
              ))}
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {displayedData.length > 0 ? (
              displayedData.map((type, index) => (
                <tr key={type.branchId}>
                  {/* {visibleColumns.sNo && <td>{index + 1}</td>} */}
                  {visibleColumns.sNo && <td style={{ textAlign: "center" }}>{(page - 1) * 15 + index + 1}</td>}
                  
                  {visibleColumns.locationId && <td style={{ textAlign: "center" }}>{type.locationId}</td>}
                  {visibleColumns.branchName && <td style={{ textAlign: "center" }}>{type.branchName}</td>}
                  {visibleColumns.aliasName && <td style={{ textAlign: "center" }}>{type.aliasName || "-"}</td>}
                  {visibleColumns.type && <td style={{ textAlign: "center" }}>{type.type || "-"}</td>}

                  {visibleColumns.status && (
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={
                          type.status === "active" ? "status-active" : "status-inactive"
                        }
                      >
                        {type.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                  )}

                  {visibleColumns.address && <td style={{ textAlign: "center" }}>{type.address || "-"}</td>}
                  {visibleColumns.country && (
                    <td style={{ textAlign: "center" }}>
                      {Array.isArray(type.country)
                        ? type.country.join(", ")
                        : type.country || "-"}
                    </td>
                  )}
                  {visibleColumns.state && (
                    <td style={{ textAlign: "center" }}>
                      {Array.isArray(type.state)
                        ? type.state.join(", ")
                        : type.state || "-"}
                    </td>
                  )}
                  {visibleColumns.city && (
                    <td style={{ textAlign: "center" }}>
                      {Array.isArray(type.city)
                        ? type.city.join(", ")
                        : type.city || "-"}
                    </td>
                  )}
                  {visibleColumns.postalCode && <td style={{ textAlign: "center" }}>{type.postalCode || "-"}</td>}
                  {visibleColumns.phoneNumber && <td style={{ textAlign: "center" }}>{type.phoneNumber || "-"}</td>}
                  {visibleColumns.email && <td style={{ textAlign: "center" }}>{type.email || "-"}</td>}
                  {visibleColumns.salesTypes && (
                    <td style={{ textAlign: "center" }}>
                      {type.salesTypes && type.salesTypes.length > 0
                        ? type.salesTypes.join(", ")
                        : "-"}
                    </td>
                  )}
                  {visibleColumns.latitude && <td style={{ textAlign: "center" }}>{type.latitude || "-"}</td>}
                  {visibleColumns.longitude && <td style={{ textAlign: "center" }}>{type.longitude || "-"}</td>}
                  {visibleColumns.description && <td style={{ textAlign: "center" }}>{type.description || "-"}</td>}
                  {visibleColumns.openingHours && <td style={{ textAlign: "center" }}>{type.openingHours || "-"}</td>}
                  {visibleColumns.closingHours && <td style={{ textAlign: "center" }}>{type.closingHours || "-"}</td>}
                  {visibleColumns.managerName && <td style={{ textAlign: "center" }}>{type.managerName || "-"}</td>}
                  {visibleColumns.managerContact && <td style={{ textAlign: "center" }}>{type.managerContact || "-"}</td>}
                  {visibleColumns.createdDate && <td style={{ textAlign: "center" }}>{type.createdDate || "-"}</td>}
                  {visibleColumns.lastUpdatedDate && <td style={{ textAlign: "center" }}>{type.lastUpdatedDate || "-"}</td>}
                  {visibleColumns.createdBy && <td style={{ textAlign: "center" }}>{type.createdBy || "-"}</td>}

                  <td>
                    <div className="flex justify-center gap-4">
                      {!showDeactivatedTable && type.status === "active" && (
                        <>
                          <button
                            onClick={() => onOpenEdit(type)}
                            className="edit-btn"
                            title="Edit"
                          >
                            <EditIcon fontSize="small" />
                          </button>
                          <button
                            onClick={() => onDeactivate(type)}
                            className="deactivate-btn"
                            title="Deactivate"
                          >
                            <DeleteIcon fontSize="small" />
                          </button>
                        </>
                      )}

                      {showDeactivatedTable && type.status === "inactive" && (
                        <button
                          onClick={() => onActivate(type)}
                          className="activate-btn"
                          title="Activate"
                        >
                          <RefreshIcon fontSize="small" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={visibleColumnKeys.length + 1} className="empty-state">
                  No {showDeactivatedTable ? "Deactivated" : "Active"} Locations Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={0.5}>
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