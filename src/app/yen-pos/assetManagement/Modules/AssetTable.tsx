
// export default AssetTable;
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { Asset } from '../Models/assetModels';

interface AssetTableProps {
  showDeactivated: boolean;
  displayedAssets: Asset[];
  handleEdit: (asset: Asset) => void;
  handleDeactivate: (asset: Asset) => void;
  handleActivate: (asset: Asset) => void;
}

const AssetTable: React.FC<AssetTableProps> = ({
  showDeactivated,
  displayedAssets,
  handleEdit,
  handleDeactivate,
  handleActivate,
}) => {
  // Sorting function to display latest items first
  const sortByLatest = (list: Asset[]):Asset[] => {
    return [...list].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt || '').getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || '').getTime();
      return bTime - aTime || (b.assetId || '').localeCompare(a.assetId || '');
    });
  };

  // Apply sorting to the displayed assets
  const sortedAssets = sortByLatest(displayedAssets);

  return (
    <Box sx={{ width: '95%', margin: 'auto' }}>

              <Box>
                <h2 style={{ fontWeight: "bold", padding: "10px", marginRight: 750 , marginTop: -53 }}>
                  {showDeactivated ? "Deactivated Assets" : "Active Assets"}
                </h2>
              </Box>
              
      <TableContainer component={Paper} sx={{ maxHeight: 440, overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {['S.NO', 'Asset Name', 'Serial No', 'Actions'].map((heading) => (
                <TableCell
                  key={heading}
                  align="center"
                  sx={{ fontWeight: 'bold', color: 'black' }}
                >
                  {heading}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAssets?.length > 0 ? (
              sortedAssets.map((asset, index) => (
                <TableRow key={asset.assetId || index}>
                  <TableCell align="center">{index + 1}</TableCell>
                  <TableCell align="center">{asset.assetName}</TableCell>
                  <TableCell align="center">{asset.serialNo}</TableCell>
                  <TableCell align="center">
                    {showDeactivated ? (
                      <Button
                        onClick={() => handleActivate(asset)}
                        startIcon={<RefreshIcon />}
                      />
                    ) : (
                      <>
                        <IconButton 
                        onClick={() => handleEdit(asset)} 
                        color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <Button
                          onClick={() => handleDeactivate(asset)}
                          startIcon={<DeleteIcon />}
                        />
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="subtitle1" fontWeight="bold">
                    {showDeactivated
                      ? 'No deactivated assets found'
                      : 'No active assets found'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AssetTable;