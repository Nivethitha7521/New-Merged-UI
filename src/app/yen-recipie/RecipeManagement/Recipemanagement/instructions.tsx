

'use client';
import React from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

interface StepByStepInstructionsProps {
  steps: { content: string; isEditing: boolean }[];
  tempStepValues: { [index: number]: string };
  setSteps: React.Dispatch<React.SetStateAction<{ content: string; isEditing: boolean }[]>>;
  setTempStepValues: React.Dispatch<React.SetStateAction<{ [index: number]: string }>>;
  handleAddStep: () => void;
  handleStepChange: (index: number, value: string) => void;
  handleEditStep: (index: number) => void;
  handleConfirmEdit: (index: number) => void;
  handleRemoveStep: (index: number) => void;
}

const StepByStepInstructions: React.FC<StepByStepInstructionsProps> = ({
  steps,
  tempStepValues,
  handleAddStep,
  handleStepChange,
  handleEditStep,
  handleConfirmEdit,
  handleRemoveStep,
}) => {
  return (
  <Box className="recipe-instructions-section" sx={{ mt: 2, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
      <div
        className="form-section recipe-instructions-card"
        style={{
           width: '100%',
           maxWidth: 'none',
          height: 'auto',
          minHeight: 220,
          maxHeight: 480,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <div className="form-section-title" style={{ margin: 0, padding: 0, borderBottom: 'none' }}>
            Step by Step Instructions
          </div>
          <IconButton
            onClick={handleAddStep}
            size="small"
             className="icon-action-button icon-button-outline"
            sx={{
              padding: '3px',
            border: '1px solid var(--erp-border-strong, #c5ced8)',
              borderRadius: '10px',
              background: 'var(--erp-surface, #ffffff)',
              color: 'var(--erp-accent, #155eef)',
              width: 26,
              height: 26,
            '&:hover': { background: 'var(--erp-accent-soft, #e8efff)' },
            }}
          >
            <AddIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </div>

        {/* Divider */}
        <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '8px' }} />

        {/* Steps list */}
        <Box
          sx={{
            overflowY: 'auto',
            flex: 1,
            pr: '2px',
            '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { background: 'var(--erp-bg, #f4f7fb)' },
            '&::-webkit-scrollbar-thumb': { background: 'var(--erp-border-strong, #c8d2df)', borderRadius: '4px' },
          }}
        >
          {steps.length === 0 ? (
            <div
            className="recipe-instructions-empty"
              style={{
                textAlign: 'center',
                color: 'var(--erp-muted, #667085)',
                fontSize: '11px',
                fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
                padding: '24px 0',
              }}
            >
              No steps added yet. Click + to add a step.
            </div>
          ) : (
            steps.map((step, index) => (
              <div
                key={index}
                className="recipe-instruction-row"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginBottom: '6px',
                  padding: '5px 6px',
                  borderRadius: '5px',
                 background: index % 2 === 0 ? 'var(--erp-surface, #ffffff)' : 'var(--erp-surface-2, #f8fafc)',
                  border: '1px solid var(--erp-border, #dfe5ec)',
                  transition: 'background 0.15s',
                }}
              >
                {/* Step number badge */}
                <div
                className="recipe-step-badge"
                  style={{
                    minWidth: 52,
                    fontSize: '10px',
                    fontWeight: 700,
                   fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
                    color: 'var(--erp-accent, #155eef)',
                    background: 'var(--erp-accent-soft, #e8efff)',
                    border: '1px solid var(--erp-accent-border, #9bb7f7)',
                    borderRadius: '4px',
                    padding: '2px 5px',
                    textAlign: 'center',
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Step {index + 1}
                </div>

                {/* Content / edit field */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {step.isEditing ? (
                    <TextField
                      value={tempStepValues[index] || ''}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirmEdit(index);
                          handleAddStep();
                        }
                      }}
                      autoFocus
                      fullWidth
                      multiline
                      variant="standard"
                      InputProps={{
                        sx: {
                          fontSize: '11px',
                          fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
                          whiteSpace: 'pre-wrap',
                          color: 'var(--erp-text, #101828)',
                        },
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        fontSize: '11px',
                       fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
                        color: step.content ? 'var(--erp-text, #101828)' : 'var(--erp-muted, #667085)',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.5,
                        paddingTop: '2px',
                      }}
                    >
                      {step.content || 'No instruction provided'}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', flexShrink: 0, gap: '2px' }}>
                  <IconButton
                    onClick={() => step.isEditing ? handleConfirmEdit(index) : handleEditStep(index)}
                    size="small"
                    sx={{
                      padding: '3px',
                    color: step.isEditing ? 'var(--erp-success, #0b7a42)' : 'var(--erp-accent, #155eef)',
                      '&:hover': { background: step.isEditing ? 'var(--erp-success-soft, #dcfce7)' : 'var(--erp-accent-soft, #e8efff)' },
                    }}
                  >
                    {step.isEditing
                      ? <CheckIcon sx={{ fontSize: 15 }} />
                      : <EditIcon sx={{ fontSize: 15 }} />
                    }
                  </IconButton>
                  <IconButton
                    onClick={() => handleRemoveStep(index)}
                    size="small"
                    sx={{
                      padding: '3px',
                      color: '#ec6666ff',
                      '&:hover': { background: '#fee2e2' },
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </div>
              </div>
            ))
          )}
        </Box>
      </div>
    </Box>
  );
};

export default StepByStepInstructions;