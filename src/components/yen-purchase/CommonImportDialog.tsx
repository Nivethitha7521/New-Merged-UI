'use client';
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';

// Define proper types for import results
interface SuccessfulImport {
  row: number | string;
  data: Record<string, any>;
  assignedId?: string;
  message?: string;
}

interface UpdatedImport {
  row: number | string;
  data: Record<string, any>;
  message?: string;
  error?: string;
  Reason?: string;
}

interface FailedImport {
  row: number | string;
  data: Record<string, any>;
  error: string;
  missingFields?: string[];
  Reason?: string;
}

interface ImportResult {
  message?: string;
  inserted_count?: number;
  updated_count?: number;
  successful?: SuccessfulImport[];
  updated?: UpdatedImport[];
  failed?: FailedImport[];
  errorCount?: number;
  detail?: { 
    message: string; 
    missing?: string[]; 
    required?: string[] 
  };
}

const moduleConfig: Record<
  string,
  {
    entityName: string;
    idField: string;
    nameField: string;
    nameLabel: string;
    additionalFields?: Array<{ key: string; label: string }>;
  }
> = {
  category: {
    entityName: 'Category',
    idField: 'Category ID',
    nameField: 'Category Name',
    nameLabel: 'Category Name',
    additionalFields: [{ key: 'Subcategories', label: 'Subcategories' }],
  },
  subcategory: {
    entityName: 'Subcategory',
    idField: 'Subcategory ID',
    nameField: 'purchasesubcategoryName',
    nameLabel: 'Subcategory Name',
  },
  itemType: {
    entityName: 'Item Type',
    idField: 'randomId',
    nameField: 'itemtypeName',
    nameLabel: 'Item Type Name',
  },
  itemGroup: {
    entityName: 'Item Group',
    idField: 'randomId',
    nameField: 'itemgroupName',
    nameLabel: 'Item Group Name',
  },
  storagelocation: {
    entityName: 'Storage Location',
    idField: 'Storage Location ID',
    nameField: 'locationName',
    nameLabel: 'Storage Location Name',
  },
  purchaseItem: {
    entityName: 'Purchase Item',
    idField: 'Item ID',
    nameField: 'itemName',
    nameLabel: 'Item Name',
    additionalFields: [
      { key: 'purchasecategoryName', label: 'Category' },
      { key: 'purchasesubcategoryName', label: 'Subcategory' },
    ],
  },
  vendor: {
    entityName: 'Vendor',
    idField: 'Vendor ID',
    nameField: 'vendorName',
    nameLabel: 'Vendor Name',
    additionalFields: [
      { key: 'contactpersonPhone', label: 'Contact Phone' },
      { key: 'existingId', label: 'Existing Vendor ID' },
    ],
  },
  freight: {
    entityName: 'Freight',
    idField: 'randomId',
    nameField: 'freightName',
    nameLabel: 'Freight Name',
  },
  brand: {
    entityName: 'Brand',
    idField: 'Brand ID',
    nameField: 'brandName',
    nameLabel: 'Brand Name',
    // Remove brandId from additionalFields since it's already the idField
    additionalFields: [
      { key: 'status', label: 'Status' }
    ],
  },
};

interface CommonImportResultDialogProps {
  open: boolean;
  onClose: () => void;
  importResult: ImportResult | null;
  module: string;
}

const CommonImportResultDialog: React.FC<CommonImportResultDialogProps> = ({
  open,
  onClose,
  importResult,
  module,
}) => {
  const config = moduleConfig[module] || {
    entityName: module.charAt(0).toUpperCase() + module.slice(1),
    idField: 'ID',
    nameField: 'name',
    nameLabel: 'Name',
  };
  const { entityName, idField, nameField, nameLabel, additionalFields = [] } = config;

  if (!importResult) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>{entityName} CSV Import Results</DialogTitle>
        <DialogContent>
          <DialogContentText>No import results available.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary" variant="contained" autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const {
    message = 'No message provided',
    inserted_count = 0,
    updated_count = 0,
    successful = [],
    updated = [],
    failed = [],
    errorCount = 0,
    detail,
  } = importResult;

  const isError = !!detail && !!detail.message && !inserted_count && !updated_count;

  // Helper function to get value from data object (handles both camelCase and Title Case)
  const getValue = (data: any, key: string) => {
    if (!data) return 'N/A';
    
    // Direct match first
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      return data[key];
    }
    
    // Try different case variations
    const possibleKeys = [
      key, 
      key.toLowerCase(), 
      key.toUpperCase(), 
      key.charAt(0).toUpperCase() + key.slice(1),
      key.charAt(0).toLowerCase() + key.slice(1),
      key.replace(/([A-Z])/g, ' $1').trim(),
      key.split(/(?=[A-Z])/).join(' ')
    ];
    
    for (const possibleKey of possibleKeys) {
      if (data[possibleKey] !== undefined && data[possibleKey] !== null && data[possibleKey] !== '') {
        return data[possibleKey];
      }
    }
    
    // Special handling for brand-specific fields
    if (key === 'brandId') {
      if (data['Brand ID']) return data['Brand ID'];
      if (data['brandId']) return data['brandId'];
    }
    if (key === 'brandName') {
      if (data['Brand Name']) return data['Brand Name'];
      if (data['brandName']) return data['brandName'];
    }
    if (key === 'status') {
      if (data['Status']) return data['Status'];
      if (data['status']) return data['status'];
    }
    
    return 'N/A';
  };

  // Helper to extract brand ID from message or data
  const extractBrandIdFromMessage = (message: string): string | null => {
    if (!message) return null;
    // Extract BRxxx from message like "Brand updated for brandId: 'BR001'"
    const match = message.match(/BR\d{3}/);
    return match ? match[0] : null;
  };

  // Helper to get brand ID for updated/failed records
  const getBrandIdForRecord = (item: any, data: any): string => {
    // Try to get from message first (for updated records)
    if (item.message) {
      const extractedId = extractBrandIdFromMessage(item.message);
      if (extractedId) return extractedId;
    }
    
    // Try from error message (for failed records)
    if (item.error) {
      const extractedId = extractBrandIdFromMessage(item.error);
      if (extractedId) return extractedId;
    }
    
    // Try from data object
    const idFromData = getValue(data, 'brandId') || getValue(data, 'Brand ID');
    if (idFromData !== 'N/A') return idFromData;
    
    return 'N/A';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{entityName} CSV Import Results</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {isError ? (
            <Typography color="error">
              Import failed: {detail?.message}
              {detail?.missing && (
                <ul>
                  {detail.missing.map((header, index) => (
                    <li key={index}>Missing header: {header}</li>
                  ))}
                </ul>
              )}
            </Typography>
          ) : (
            <>
              <Typography variant="body1" gutterBottom>
                {message}
              </Typography>
              <Typography variant="body2">New {entityName}s Added: {inserted_count}</Typography>
              <Typography variant="body2">Existing {entityName}s Updated: {updated_count}</Typography>
              {errorCount && errorCount > 0 && (
                <Typography variant="body2" color="error">
                  Errors Encountered: {errorCount}
                </Typography>
              )}
            </>
          )}
        </DialogContentText>
        
        {/* Successfully Imported Section */}
        {!isError && successful && successful.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={{ mt: 2, color: '#2e7d32' }} gutterBottom>
              Successfully Imported {entityName}s
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  <TableCell>{idField}</TableCell>
                  <TableCell>{nameLabel}</TableCell>
                  {additionalFields.map((field) => (
                    <TableCell key={field.key}>{field.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {successful.map((success, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{success.row}</TableCell>
                    <TableCell>
                      {(success as any).assignedId || getValue(success.data, idField) || getValue(success.data, 'brandId') || 'N/A'}
                    </TableCell>
                    <TableCell>{getValue(success.data, nameField)}</TableCell>
                    {additionalFields.map((field) => (
                      <TableCell key={field.key}>
                        {getValue(success.data, field.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
        
        {/* Updated Section */}
        {!isError && updated && updated.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={{ mt: 2, color: '#d4a017' }} gutterBottom>
              Updated {entityName}s
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  <TableCell>{idField}</TableCell>
                  <TableCell>{nameLabel}</TableCell>
                  {additionalFields.map((field) => (
                    <TableCell key={field.key}>{field.label}</TableCell>
                  ))}
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {updated.map((item, idx) => {
                  const brandId = getBrandIdForRecord(item, item.data);
                  const status = getValue(item.data, 'status') || getValue(item.data, 'Status');
                  
                  return (
                    <TableRow key={idx} sx={{ backgroundColor: '#fff9e6' }}>
                      <TableCell>{item.row}</TableCell>
                      <TableCell>{brandId}</TableCell>
                      <TableCell>{getValue(item.data, nameField)}</TableCell>
                      <TableCell>{status !== 'N/A' ? status : 'active'}</TableCell>
                      <TableCell>{(item as any).message || (item as any).Reason || `${entityName} updated successfully`}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </>
        )}
        
        {/* Failed Section */}
        {!isError && failed && failed.length > 0 && (
          <>
            <Typography variant="subtitle1" color="error" gutterBottom sx={{ mt: 2 }}>
              Failed Imports
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  <TableCell>{nameLabel}</TableCell>
                  <TableCell>{idField}</TableCell>
                  {additionalFields.map((field) => (
                    <TableCell key={field.key}>{field.label}</TableCell>
                  ))}
                  <TableCell>Error</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {failed.map((error, idx) => {
                  const brandId = getBrandIdForRecord(error, error.data);
                  const status = getValue(error.data, 'status') || getValue(error.data, 'Status');
                  
                  return (
                    <TableRow key={idx} sx={{ backgroundColor: '#ffe6e6' }}>
                      <TableCell>{error.row}</TableCell>
                      <TableCell>{getValue(error.data, nameField)}</TableCell>
                      <TableCell>{brandId}</TableCell>
                      <TableCell>{status !== 'N/A' ? status : 'N/A'}</TableCell>
                      <TableCell>
                        {error.error}
                        {error.missingFields && error.missingFields.length > 0 && ` (Missing: ${error.missingFields.join(', ')})`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </>
        )}
        
        {isError && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            No results to display due to import failure.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained" autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommonImportResultDialog;