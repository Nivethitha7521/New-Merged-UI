

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { updateLayoutPositions } from '../Features/tableSlice';
import { AppDispatch } from '../../../../../redux/store';
import { TablePosition } from "../Models/tableModels";

interface TableLayoutEditorPageProps {
  area: any;
  branchId: string;
  branchLocation: string;
  initialTables: TablePosition[];
  onClose: () => void;
  onSaveSuccess: () => void;
}

const TableLayoutEditorPage: React.FC<TableLayoutEditorPageProps> = ({
  area,
  branchId,
  branchLocation,
  initialTables,
  onClose,
  onSaveSuccess,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [layoutTables, setLayoutTables] = useState<TablePosition[]>(initialTables);
  const [draggedTable, setDraggedTable] = useState<TablePosition | null>(null);
  // store pointer offset within the dragged element
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: 1920, height: 1080 });

  // Detect screen size on mount and resize
  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    updateScreenSize();

    // Add event listener for resize
    window.addEventListener('resize', updateScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // Calculate dynamic table positioning based on screen size
  const getDefaultTablePosition = (index: number) => {
    const tablesPerRow = Math.max(10, Math.floor((screenSize.width - 20) / 130)); // Dynamic columns
    const tableSpacingX = 100;
    const tableSpacingY = 220;
    
    const startX = 100;
    const startY = 100;
    
    const row = Math.floor(index / tablesPerRow);
    const col = index % tablesPerRow;
    
    return {
      x: startX + (col * tableSpacingX),
      y: startY + (row * tableSpacingY)
    };
  };

  const handleTableDragStart = (e: React.DragEvent, table: TablePosition) => {
    e.dataTransfer.effectAllowed = 'move';
    // set a dataTransfer item so drag works consistently
    e.dataTransfer.setData('text/plain', String(table.tableNumber));

    // measure pointer offset inside the element so we can place the element exactly
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDragOffset({ x: offsetX, y: offsetY });
    setDraggedTable(table);
  };


  const handleCanvasDrop = (e: React.DragEvent) => {
  e.preventDefault();
  if (!draggedTable) return;

  const container = e.currentTarget as HTMLElement;
  const rect = container.getBoundingClientRect();

  // canvas boundaries (no scrolling)
  const minX = 0;
  const minY = 0;
  const maxX = rect.width - 140; // table width approx
  const maxY = rect.height - 160; // table height approx

  // compute new position
  let x = e.clientX - rect.left - dragOffset.x;
  let y = e.clientY - rect.top - dragOffset.y;

  // clamp so table NEVER crosses boundary
  x = Math.max(minX, Math.min(x, maxX));
  y = Math.max(minY, Math.min(y, maxY));

  // apply update
  const updatedTables = layoutTables.map((t) =>
    t.tableNumber === draggedTable.tableNumber
      ? { ...t, position: { x, y } }
      : t
  );

  setLayoutTables(updatedTables);

  setDraggedTable(null);
  setDragOffset({ x: 0, y: 0 });
};





  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleUpdateLayout = async () => {
    try {
      setIsSubmitting(true);
      await dispatch(
        updateLayoutPositions({
          branchId,
          areaName: area.areaName,
          tables: layoutTables.map((table) => ({
            tableNumber: table.tableNumber,
            seats: table.seats,
            position: table.position || null,
          })),
        })
      ).unwrap();

      onSaveSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to save layout');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset all tables to default positions based on current screen size
  const handleResetPositions = () => {
    const resetTables = layoutTables.map((table, index) => ({
      ...table,
      position: getDefaultTablePosition(index)
    }));
    setLayoutTables(resetTables);
  };

  return (
    <Box
    className="kot-layout-editor"
      sx={{
        position: 'fixed',
        top: -1,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#f8fafc',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
      className="kot-layout-editor-header"
        sx={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          p: 0.8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
         <IconButton onClick={onClose} size="large" className="kot-layout-editor-back">

            <ArrowBackIcon />
          </IconButton>
          <Box>
            <label className="kot-layout-editor-title" style={{ fontWeight:"bold" }} >
              Layout Editor — {area.areaName}
            </label>
            <Typography variant="subtitle1" color="text.secondary" className="kot-layout-editor-subtitle">
              {branchLocation} • {screenSize.width}px × {screenSize.height}px • Drag tables to position them freely
            </Typography>
          </Box>
        </Box>
        
        <button 
          className='btn-primary kot-layout-editor-action' 
          color="secondary" 
          onClick={handleResetPositions}
          disabled={isSubmitting}
        >
          Reset Positions
        </button>
      </Box>

      {/* Canvas Area */}
      <Box
      className="kot-layout-editor-canvas"
        onDrop={handleCanvasDrop}
        onDragOver={handleDragOver}
        sx={{
          flex: 1,
          backgroundColor: '#f8fafc',
          backgroundImage: `linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          position: 'relative',
          overflow: 'auto',   
          minHeight: 'calc(100vh - 120px)',
        }}
      >
        {layoutTables.map((table, index) => {
          const seatsCount = table.seats || 4;
          const topSeats = Math.ceil(seatsCount / 2);
          const bottomSeats = seatsCount - topSeats;
          
          // Use existing position or calculate default based on screen size
          const defaultPos = getDefaultTablePosition(index);
          const x = table.position?.x ?? defaultPos.x;
          const y = table.position?.y ?? defaultPos.y;

          return (
            <Box
              key={table.tableNumber}
              draggable
              onDragStart={(e) => handleTableDragStart(e, table)}
              sx={{
                position: 'absolute',
                left: `${x}px`,   // top-left anchored
                top: `${y}px`,
                cursor: 'move',
                userSelect: 'none',
                opacity: draggedTable?.tableNumber === table.tableNumber ? 0.6 : 1,
                transition: draggedTable?.tableNumber === table.tableNumber ? 'none' : 'all 0.2s ease',
                zIndex: draggedTable?.tableNumber === table.tableNumber ? 100 : 10,
                '&:hover': { 
                  zIndex: 50,
                  transform: draggedTable?.tableNumber === table.tableNumber
                    ? 'none'
                    : 'scale(1.05)',
                },
              }}
            >
              {/* Top Seats */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1 }}>
                {Array.from({ length: topSeats }).map((_, i) => (
                  <Box
                    key={`top-${i}`}
                    sx={{
                      width: 30,
                      height: 32,
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
                      {i + 1}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Table Body */}
              <Box
                sx={{
                  backgroundColor: '#ffffff',
                  border: '4px solid #3b82f6',
                  borderRadius: 3,
                  padding: '10px 4px',
                  textAlign: 'center',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  minWidth: '10px',
                  minHeight: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 12px 35px rgba(0,0,0,0.2)',
                  },
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold" color="#1e40af" sx={{ fontSize: '0.9rem' }}>
                  {table.tableNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {seatsCount} Seats
                </Typography>
              </Box>

              {/* Bottom Seats */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
                {Array.from({ length: bottomSeats }).map((_, i) => (
                  <Box
                    key={`bottom-${i}`}
                    sx={{
                      width: 30,
                      height: 32,
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
                      {topSeats + i + 1}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Footer Actions */}
      <Box
        sx={{
          backgroundColor: 'white',
          borderTop: '1px solid #e2e8f0',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Total Tables: {layoutTables.length} • Screen: {screenSize.width}px
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
        <button onClick={onClose} disabled={isSubmitting} className='btn-secondary kot-layout-editor-action'>
            Cancel
          </button>
          <button
          className='btn-primary kot-layout-editor-action'
            onClick={handleUpdateLayout}
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Save Layout'}
          </button>
        </Box>
      </Box>
    </Box>
  );
};

export default TableLayoutEditorPage;
