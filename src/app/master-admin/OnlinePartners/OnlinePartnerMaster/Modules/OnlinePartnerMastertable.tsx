
"use Client";
import React from "react"
import { RootState } from "../../../../../redux/store";
import { useSelector } from "react-redux";

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
  } = useSelector((state: RootState) => state.onlinePartners);

  const displayedPartners = showDeactivated ? deactivatedItems : partners;
  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';


  return (

    <>


      <Box
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
        <Typography className='icon-action-label'
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

        <div className="flex items-center gap-4">
          {!showDeactivated && (
            <>
              <div className="icon-action-wrapper">
                <IconButton
                  color="primary"
                  onClick={handleOpen}
                  className="icon-action-button"
                  title="Add"
                >
                  <AddIcon className="icon-action-svg" />
                </IconButton>
                <Typography className="icon-action-label">Add</Typography>
              </div>


            </>
          )}
          <FormControlLabel
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


      <div className="table-container my-1" style={{ maxHeight: 'calc(90.5vh - 170px)' }}>
        <table className="custom-table">
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
                        <button
                          color="primary"
                          onClick={() => handleActivate(partner)}
                          className="activate-btn"
                          title="Activate"
                        >
                          <RefreshIcon />
                        </button>
                      ) : (
                        <>
                          <button
                            color="primary"
                            onClick={() => handleEdit(partner)}
                            className="edit-btn"
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            color="primary"
                            onClick={() => handleDeactivate(partner)}
                            className="deactivate-btn"
                            title="Deactivate"
                          >
                            <DeleteIcon />
                          </button>
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
