


import React, { JSX } from 'react';
import {
  Checkbox,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { OnlinePartnerTemplate, dynamicData } from '../Models/templateModels';
import { SelectedItem } from '../Modules/OnlinePartnerTemplateComponent';
import PermissionIconButton from '@/components/Permissions/PermissionIconButton';

interface TemplateTableProps {
  selectedType: 'template' | 'dynamic';
  filteredItems: Array<SelectedItem | OnlinePartnerTemplate | dynamicData>;
  selectedRows: string[];
  setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;
  showDeactivated: boolean;
  currentPage: number;
  handleEditPercentage: (item: SelectedItem) => void;
  handleDelete: (item: SelectedItem | OnlinePartnerTemplate | dynamicData) => void;
  renderAssignedPartners: (partners: string[] | undefined) => JSX.Element | string;
}

const TemplateTable: React.FC<TemplateTableProps> = ({
  selectedType,
  filteredItems,
  selectedRows,
  setSelectedRows,
  showDeactivated,
  currentPage,
  handleEditPercentage,
  handleDelete,
  renderAssignedPartners,
}) => {
  return (
   <div className="table-container online-partner-template-table-container" style={{ 
      maxHeight: 'calc(75.5vh - 170px)', 
      overflowX: 'auto',
      overflowY: 'auto'
    }}>
     <table className="custom-table online-partner-template-table" style={{
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '800px'
      }}>
        <thead style={{
          position: 'sticky',
          top: 0,
          backgroundColor: '#f5f5f5',
          zIndex: 10
        }}>
          <tr>
            <th style={{
              padding: '2px 2px',
              textAlign: 'center',
              verticalAlign: 'middle',
              borderBottom: '2px solid #ddd',
              fontWeight: 600,
              fontSize: '5px'
            }}>
              <Checkbox
                checked={selectedRows.length === filteredItems.length && filteredItems.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRows(
                      filteredItems.map((item) =>
                        'onlinePartnerTemplateId' in item
                          ? item.onlinePartnerTemplateId
                          : 'dynamicDataId' in item
                            ? item.dynamicDataId
                            : item.itemName
                      )
                    );
                  } else {
                    setSelectedRows([]);
                  }
                }}
                sx={{ 
                  '& .MuiSvgIcon-root': { fontSize: 24 }, 
                  padding: '0px'
                }}
              />
            </th>
            <th style={{
              padding: '12px 8px',
              textAlign: 'center',
              verticalAlign: 'middle',
              borderBottom: '2px solid #ddd',
              fontWeight: 600,
              fontSize: '12px',
              minWidth: '60px'
            }}>
              S.No
            </th>
            <th style={{
              padding: '12px 8px',
              textAlign: 'center',
              verticalAlign: 'middle',
              borderBottom: '2px solid #ddd',
              fontWeight: 600,
              fontSize: '12px',
              minWidth: '150px'
            }}>
              Item Name
            </th>
            {selectedType === 'template' && (
              <th style={{
                padding: '12px 8px',
                textAlign: 'center',
                verticalAlign: 'middle',
                borderBottom: '2px solid #ddd',
                fontWeight: 600,
                fontSize: '12px',
                minWidth: '180px'
              }}>
                Assigned Partners
              </th>
            )}
            <th style={{
              padding: '12px 8px',
              textAlign: 'center',
              verticalAlign: 'middle',
              borderBottom: '2px solid #ddd',
              fontWeight: 600,
              fontSize: '12px',
              minWidth: '120px'
            }}>
              Current Price
            </th>
            <th style={{
              padding: '12px 8px',
              textAlign: 'center',
              verticalAlign: 'middle',
              borderBottom: '2px solid #ddd',
              fontWeight: 600,
              fontSize: '12px',
              minWidth: '100px'
            }}>
              Percentage
            </th>
            <th style={{
              padding: '12px 8px',
              textAlign: 'center',
              verticalAlign: 'middle',
              borderBottom: '2px solid #ddd',
              fontWeight: 600,
              fontSize: '12px',
              minWidth: '120px'
            }}>
              Partner Price
            </th>
            <th style={{
              padding: '10px 8px',
              textAlign: 'center',
              verticalAlign: 'middle',
              borderBottom: '2px solid #ddd',
              fontWeight: 600,
              fontSize: '12px',
              minWidth: '120px'
            }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.length === 0 ? (
            <tr>
              <td 
                colSpan={selectedType === 'template' ? 8 : 7} 
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#666'
                }}
                className="empty-state"
              >
                <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 500 }}>
                  {showDeactivated
                    ? `No deactivated ${selectedType === 'template' ? 'Templates' : 'Items'} found`
                    : `No active ${selectedType === 'template' ? 'Templates' : 'Items'} found`}
                </h2>
              </td>
            </tr>
          ) : (
            filteredItems.map((item, index) => {
              const itemId =
                'onlinePartnerTemplateId' in item
                  ? item.onlinePartnerTemplateId
                  : 'dynamicDataId' in item
                    ? item.dynamicDataId
                    : item.itemName;

              return (
                <React.Fragment key={itemId}>
                  <tr style={{
                    borderBottom: '1px solid #e0e0e0',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{
                      padding: '5px 8px',
                      textAlign: 'center',
                      verticalAlign: 'middle'
                    }}>
                      <Checkbox
                        checked={selectedRows.includes(itemId)}
                        onChange={() =>
                          setSelectedRows((prev) =>
                            prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
                          )
                        }
                        sx={{ 
                          '& .MuiSvgIcon-root': { fontSize: 24 }, 
                          padding: '0px'
                        }}
                      />
                    </td>
                    <td style={{
                      padding: '12px 8px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      fontSize: '12px'
                    }}>
                      {(currentPage - 1) * 50 + index + 1}
                    </td>
                    <td style={{
                      padding: '12px 8px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      fontSize: '12px'
                    }}>
                      {item.itemName}
                    </td>
                    {selectedType === 'template' && (
                      <td style={{
                        padding: '12px 8px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        fontSize: '12px'
                      }}>
                        {renderAssignedPartners('assignedPartners' in item ? item.assignedPartners : undefined)}
                      </td>
                    )}
                    <td style={{
                      padding: '12px 8px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      fontSize: '12px'
                    }}>
                      {'currentPrice' in item ? item.currentPrice : item.Defaultprice}
                    </td>
                    <td style={{
                      padding: '12px 8px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      fontSize: '12px'
                    }}>
                      {item.percentage}%
                    </td>
                    <td style={{
                      padding: '3px 8px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      fontSize: '12px'
                    }}>
                      {item.partnerPrice}
                    </td>
                    <td style={{
                      padding: '3px 8px',
                      textAlign: 'center',
                      verticalAlign: 'middle'
                    }}>
                      {showDeactivated ? (
                       <PermissionIconButton
                          app="masteradmin"
                          module="onlinepartnertemplate"
                          action="edit"
                          rollback
                          tooltip="Activate"
                          onClick={() => {}}
                          icon={<RefreshIcon fontSize="small" />}
                          className="activate-btn"
                          ariaLabel="Activate"
                        />
                      ) : (
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                         <PermissionIconButton
                            app="masteradmin"
                            module="onlinepartnertemplate"
                            action="edit"
                            tooltip="Edit"
                            onClick={() =>
                              handleEditPercentage({
                                itemName: item.itemName,
                                currentPrice: 'currentPrice' in item ? item.currentPrice : item.Defaultprice,
                                percentage: item.percentage,
                                partnerPrice: item.partnerPrice,
                                assignedPartners: 'assignedPartners' in item ? item.assignedPartners || [] : [],
                                deactivateAssignedPartners:
                                  'deactivateAssignedPartners' in item ? item.deactivateAssignedPartners || [] : [],
                                isTemporary: 'isTemporary' in item ? item.isTemporary : false,
                              })
                            }
                            icon={<EditIcon fontSize="small" />}
                            className="edit-btn"
                            ariaLabel="Edit"
                          />
                          <PermissionIconButton
                            app="masteradmin"
                            module="onlinepartnertemplate"
                            action="delete"
                            tooltip="Delete"
                            onClick={() => handleDelete(item)}
                            icon={<DeleteIcon fontSize="small" />}
                            className="deactivate-btn"
                                                      ariaLabel="Delete"
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TemplateTable;