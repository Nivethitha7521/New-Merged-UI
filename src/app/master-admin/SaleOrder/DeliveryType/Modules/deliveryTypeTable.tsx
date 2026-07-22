"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { DeliveryType } from "../Models/deliverytypeModels"

import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';

interface DeliveryTypeTableProps {
  filteredTypes: DeliveryType[];
  showDeactivatedTable: boolean;
  onOpenEdit: (type: DeliveryType) => void;
  onDeactivate: (type: DeliveryType) => void;
  onActivate: (type: DeliveryType) => void;
  visibleColumns: {
    sNo: boolean;
    type: boolean;
    remarks: boolean;
    // status: boolean;
    actions: boolean;
  };
}

const DeliveryTypeTableComponent: React.FC<DeliveryTypeTableProps> = ({
  filteredTypes,
  showDeactivatedTable,
  onOpenEdit,
  onDeactivate,
  onActivate,
  visibleColumns,
}) => {
  return (

    <div className="table-container" style={{ maxHeight: 'calc(90.5vh - 170px)' }}>
      <table className="custom-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Delivery Type</th>
            <th>Remarks</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTypes.length > 0 ? (
            filteredTypes.map((type, index) => (
              <tr key={type.deliveryTypeId}>
                  <td style={{ textAlign: "center" }}>{index + 1}</td>
                  <td style={{ textAlign: "center" }}>{type.deliveryType}</td>
                  <td style={{ textAlign: "center" }}>{type.remarks || "-"}</td>
                  <td style={{ textAlign: "center" }}>
                    {!showDeactivatedTable && type.status === "active" && (
                      <>
                        <button
                          color="primary"
                          onClick={() => onOpenEdit(type)}
                          className="edit-btn"
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => onDeactivate(type)}
                          color="primary"
                          className="deactivate-btn"
                          title="Deactivate"
                        >
                          <DeleteIcon />
                        </button>
                      </>
                    )}
                    {showDeactivatedTable && type.status === "deactivate" && (
                      <button
                        onClick={() => onActivate(type)}
                        color="primary"
                        className="activate-btn"
                        title="Activate"
                      >
                        <RefreshIcon />
                      </button>
                    )}
                  </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="empty-state">
                <h2> No {showDeactivatedTable ? "Deactivated" : "Active"} Delivery Types</h2>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DeliveryTypeTableComponent;