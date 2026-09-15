
"use Client";
import React from "react"
import { RootState } from "../../../../../redux/store";
import { useSelector } from "react-redux";
import PermissionIconButton from '@/components/Permissions/PermissionIconButton';
import {
  Box,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';


interface OnlinePartner {
  onlinePartnersId: string;
  partnerName: string;
  createdDate: Date | null;
  updatedDate: Date | null;
  status: string;
}





interface OnlinePartnerTableProbs {
  handleOpen: () => void;
  handleEdit: (partner: OnlinePartner) => void;
  handleActivate: (partner: OnlinePartner) => void;
  handleDeactivate: (partner: OnlinePartner) => void;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
}


const OnlinePartnerTable: React.FC<OnlinePartnerTableProbs> = ({
  handleOpen,
  handleEdit,
  handleActivate,
  handleDeactivate,
  showDeactivated,
  setShowDeactivated


}) => {



  const {
    items: partners,
    deactivatedItems,
    loading,
  } = useSelector((state: RootState) => state.maOnlinePartners);

  const displayedPartners = showDeactivated ? deactivatedItems : partners;
  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';


  return (

    <>


      <Box
      className="online-partner-master-toolbar"
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={0}
        my={1}
        ml={1}
        px={{ xs: 2, sm: 3 }}
        sx={{ width: "99%", boxSizing: "border-box", mt: -2 }}
      >
        <Typography className='icon-action-label online-partner-master-title'
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
          {showDeactivated ? "Deactivated Partners" : "Active Partners"}
        </Typography>

        <div className="flex items-center gap-4 online-partner-master-actions">
          {!showDeactivated && (
            <>
              <div className="icon-action-wrapper">
               <PermissionIconButton
                  app="masteradmin"
                  module="onlinepartnermaster"
                  action="add"
                  tooltip="Add"
                  onClick={handleOpen}
                  icon={<AddIcon className="icon-action-svg" />}
                  className="icon-action-button"
                   ariaLabel="Add"
                />
                <Typography className="icon-action-label">Add</Typography>
              </div>


            </>
          )}
          <FormControlLabel
          className="online-partner-master-toggle"
            control={
              <Switch
                checked={showDeactivated}
                onChange={() => setShowDeactivated(!showDeactivated)}
                color="primary"
                size="small"
              />
            }
            label={label}
            sx={{
              marginLeft: 1,
              marginRight: 1,
              "& .MuiFormControlLabel-label": {
                fontSize: "0.75rem",
                fontFamily: "'Poppins', sans-serif",
              },
            }}
          />
        </div>
      </Box>


     <div className="table-container my-1 online-partner-master-table-container" style={{ maxHeight: 'calc(90.5vh - 170px)' }}>
        <table className="custom-table online-partner-master-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'center' }}>S.NO</th>
              <th style={{ textAlign: 'center' }}>Partner Name</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center' }}>
                  <h3 style={{ fontWeight: 'bold' }}>Loading...</h3>
                </td>
              </tr>
            ) : (
              <>
                {displayedPartners.map((partner, index) => (
                  <tr key={partner.onlinePartnersId || index}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ textAlign: 'center' }}>{partner.partnerName}</td>
                    <td style={{ textAlign: 'center' }}>
                      {showDeactivated ? (
                        <PermissionIconButton
                          app="masteradmin"
                          module="onlinepartnermaster"
                          action="edit"
                          rollback
                          tooltip="Activate"
                           onClick={() => handleActivate(partner)}
                          icon={<RefreshIcon />}
                        
                          className="activate-btn"
                         ariaLabel="Activate"
                        />
                      ) : (
                        <>
                          <PermissionIconButton
                            app="masteradmin"
                            module="onlinepartnermaster"
                            action="edit"
                            tooltip="Edit"
                            onClick={() => handleEdit(partner)}
                            icon={<EditIcon />}
                            className="edit-btn"
                            ariaLabel="Edit"
                          />
                          <PermissionIconButton
                            app="masteradmin"
                            module="onlinepartnermaster"
                            action="delete"
                            tooltip="Deactivate"
                            onClick={() => handleDeactivate(partner)}
                            icon={<DeleteIcon />}
                            className="deactivate-btn"
                           ariaLabel="Deactivate"
                          />
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {displayedPartners.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center' }}>
                      <h2 >
                        {showDeactivated
                          ? 'No deactivated partners found'
                          : 'No active partners found'}
                      </h2>
                    </td>
                  </tr>
                )}
              </>
            )} 
          </tbody>

        </table>
      </div>
    </>

  );
};



export default OnlinePartnerTable;
