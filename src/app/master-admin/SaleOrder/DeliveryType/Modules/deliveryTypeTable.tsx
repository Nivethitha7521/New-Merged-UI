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
import PermissionIconButton from '@/components/Permissions/PermissionIconButton';
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
                          <PermissionIconButton
                            app="masteradmin"
                            module="deliverytype"
                            action="edit"
                            tooltip="Edit"
                            onClick={() => onOpenEdit(type)}
                            icon={<EditOutlinedIcon />}
                            className="purchase-master-action-button is-edit"
                            ariaLabel="Edit"
                          />
 <PermissionIconButton
                            app="masteradmin"
                            module="deliverytype"
                            action="delete"
                            tooltip="Deactivate"
                        
                            onClick={() => onDeactivate(type)}
                            icon={<DeleteOutlineRoundedIcon />}
                            className="purchase-master-action-button is-delete"
                            ariaLabel="Deactivate"
                          />
                        </>
                      )}
                      {showDeactivatedTable && type.status === "deactivate" && (
                        <PermissionIconButton
                          app="masteradmin"
                          module="deliverytype"
                          action="edit"
                          rollback
                          tooltip="Activate"
                          onClick={() => onActivate(type)}
                           icon={<RestoreRoundedIcon />}
                          className="purchase-master-action-button is-activate"
                         ariaLabel="Activate"
                        />
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