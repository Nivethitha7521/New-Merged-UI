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
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { DeliveryType } from "../Models/deliverytypeModels"

import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';

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

 <div className="item-master-table-container">
      <table className="item-master-table item-master-lookup-table sale-order-lookup-table--4">
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
              <tr key={type.deliveryTypeId} className="item-master-data-row">
                  <td style={{ textAlign: "center" }}>{index + 1}</td>
                  <td style={{ textAlign: "center" }}>{type.deliveryType}</td>
                  <td style={{ textAlign: "center" }}>{type.remarks || "-"}</td>
                <td className="item-master-actions-cell">
                    <div>
                      {!showDeactivatedTable && type.status === "active" && (
                        <>
                          <IconButton
                            onClick={() => onOpenEdit(type)}
                            className="purchase-master-action-button is-edit"
                            title="Edit"
                            size="small"
                          >
                            <EditOutlinedIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => onDeactivate(type)}
                            className="purchase-master-action-button is-delete"
                            title="Deactivate"
                            size="small"
                          >
                            <DeleteOutlineRoundedIcon />
                          </IconButton>
                        </>
                      )}
                      {showDeactivatedTable && type.status === "deactivate" && (
                        <IconButton
                          onClick={() => onActivate(type)}
                          className="purchase-master-action-button is-activate"
                          title="Activate"
                          size="small"
                        >
 <RestoreRoundedIcon />
                        </IconButton>
                      )}
                    </div>
                  </td>
              </tr>
            ))
          ) : (
            <tr>
             <td colSpan={4} className="empty-state">
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