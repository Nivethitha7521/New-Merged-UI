'use client';

import React, { useMemo } from 'react';
import { Box, Tooltip } from '@mui/material';
import { HiOutlineArrowsPointingIn, HiOutlineArrowPath } from 'react-icons/hi2';
import { RiFileExcel2Line, RiFilePdfLine } from 'react-icons/ri';
import GenericDataTable from './GenericDataTable';
import GenericFilterSection from './GenericFilterSection';
import GlobalSnackbar from '@/components/snackbar/GlobalSnackbar';
import { ReportConfig, ReportState } from '../types';
import { checkIsFiscalYearSelected } from '../utils/filterChecks';
import { normalizeReportRows } from '../reportDataNormalizer';

interface GenericFullscreenViewProps<T extends Record<string, unknown> = Record<string, unknown>> {
  config: ReportConfig<T>;
  state: ReportState<T>;
  visibleColumns: string[];
  exporting: boolean;
  isLoading: boolean;
  onFilterChange: (apiParam: string, values: string[]) => void;
  onClear: (apiParam: string) => void;
  onDropdownSearch?: (filterType: string, query: string) => void;
  onLoadMoreDropdown?: (filterType: string) => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onRefresh: () => void;
  onExitFullscreen: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  snackbarOpen: boolean;
  snackbarMessage: string;
  snackbarSeverity: 'success' | 'error' | 'warning' | 'info';
  onSnackbarClose: () => void;
}

export const GenericFullscreenView = <T extends Record<string, unknown>,>({
  config, state, visibleColumns, exporting, isLoading,
  onFilterChange, onClear, onDropdownSearch, onLoadMoreDropdown,
  onExportExcel, onExportPDF, onRefresh, onExitFullscreen,
  containerRef, snackbarOpen, snackbarMessage, snackbarSeverity, onSnackbarClose,
}: GenericFullscreenViewProps<T>) => {

  const isFiscalYearSelected = useMemo(() => checkIsFiscalYearSelected(state.filters, config), [state.filters, config]);
  const isActionsDisabled    = !isFiscalYearSelected || isLoading;
  const safeItems            = useMemo(() => normalizeReportRows(state.items, config), [config, state.items]);
  const totalRecords         = safeItems.length;

  const lastSync = useMemo(() =>
    new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' }),
    [isLoading]
  );

  return (
    <>
      <Box style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', flexDirection: 'column',
        height: '100vh', width: '100vw', overflow: 'hidden',
        background: 'var(--app-bg)',
        fontFamily: "'DM Sans','Geist',system-ui,sans-serif",
        animation: 'fsIn 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <style>{`
          @keyframes fsIn { from{opacity:0;transform:scale(0.99)} to{opacity:1;transform:scale(1)} }
          @keyframes qfadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
          .fs-btn:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.1); }
          .fs-btn { transition: all 0.15s ease; }
        `}</style>

        {/* Header */}
        <div style={{
          background: 'var(--app-header)',
          borderBottom: '1px solid var(--app-border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          flexShrink: 0, flexWrap: 'wrap',
        }}>
          {/* Left: identity */}
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'var(--app-accent)',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>BI</div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                <span style={{ fontSize:9.5, fontWeight:800, color:'#6366f1', letterSpacing:'0.1em', textTransform:'uppercase', background:'#eef2ff', padding:'1px 8px', borderRadius:5 }}>
                  Focus Mode
                </span>
                <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:600, color: isLoading?'#d97706':'#059669' }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background: isLoading?'#f59e0b':'#22c55e', display:'inline-block', animation: isLoading?'pulse 1s infinite':'none' }} />
                  {isLoading ? 'Syncing...' : `Live - ${totalRecords.toLocaleString()} records`}
                </span>
              </div>
              <h1 style={{ margin:0, fontSize:20, fontWeight:800, color:'var(--app-text)', lineHeight:1 }}>
                {config.title}
              </h1>
              <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>
                {!isFiscalYearSelected ? 'Select Fiscal Year to enable actions' : `Last sync: ${lastSync}`}
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            {/* Refresh */}
            <Tooltip title="Refresh">
              <span>
                <button className="fs-btn" onClick={onRefresh} disabled={isActionsDisabled} style={{
                  width:40, height:40, borderRadius:10, border:'1.5px solid var(--app-border)',
                  background:'var(--app-card)', cursor: isActionsDisabled?'not-allowed':'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color: isActionsDisabled?'#cbd5e1':'#475569', opacity: isActionsDisabled?0.5:1,
                }}>
                  <HiOutlineArrowPath size={18} style={{ animation: isLoading?'spin 1s linear infinite':'' }} />
                </button>
              </span>
            </Tooltip>

            {/* Export cluster */}
            <div style={{
              display:'flex', alignItems:'center', gap:1,
              background:'var(--app-card)', border:'1.5px solid var(--app-border)', borderRadius:10, padding:4,
              opacity: !isFiscalYearSelected ? 0.4 : 1,
            }}>
              <Tooltip title="Export Excel">
                <span>
                  <button className="fs-btn" onClick={onExportExcel} disabled={isActionsDisabled||exporting} style={{
                    display:'flex', alignItems:'center', gap:6, padding:'6px 12px',
                    borderRadius:8, border:'none', background:'transparent',
                    cursor: isActionsDisabled?'not-allowed':'pointer', fontSize:12, fontWeight:700, color:'#16a34a',
                    opacity: isActionsDisabled?0.5:1,
                  }}>
                    <RiFileExcel2Line size={18} />
                    <span>XLSX</span>
                  </button>
                </span>
              </Tooltip>
              <div style={{ width:1, height:22, background:'#e2e8f0' }} />
              <Tooltip title="Export PDF">
                <span>
                  <button className="fs-btn" onClick={onExportPDF} disabled={isActionsDisabled} style={{
                    display:'flex', alignItems:'center', gap:6, padding:'6px 12px',
                    borderRadius:8, border:'none', background:'transparent',
                    cursor: isActionsDisabled?'not-allowed':'pointer', fontSize:12, fontWeight:700, color:'#e11d48',
                    opacity: isActionsDisabled?0.5:1,
                  }}>
                    <RiFilePdfLine size={18} />
                    <span>PDF</span>
                  </button>
                </span>
              </Tooltip>
            </div>

            {/* Exit */}
            <button className="fs-btn" onClick={onExitFullscreen} style={{
              display:'flex', alignItems:'center', gap:7,
              padding:'8px 20px', borderRadius:10,
              background:'#0f172a', color:'#fff',
              fontSize:12, fontWeight:700, cursor:'pointer', border:'none',
              letterSpacing:'0.03em',
            }}>
              <HiOutlineArrowsPointingIn size={16} />
              Minimize
            </button>
          </div>
        </div>

        {/* Data canvas */}
        <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-header)] px-4 py-3">
          <GenericFilterSection
            config={config}
            state={state}
            onFilterChange={onFilterChange}
            onClear={onClear}
            onDropdownSearch={onDropdownSearch}
            onLoadMoreDropdown={onLoadMoreDropdown}
            compact
          />
        </div>

        <Box style={{ flex:1, minHeight: 0, overflow:'hidden', padding:16 }}>
          <div style={{
            height:'100%', overflow:'hidden',
            borderRadius:10, background:'var(--app-card)',
            border:'1px solid var(--app-border)',
            boxShadow:'0 4px 20px rgba(0,0,0,0.06)',
            display:'flex', flexDirection:'column',
          }}>
         <GenericDataTable
              ref={containerRef as React.Ref<HTMLDivElement>}
              config={config}
              data={safeItems as Record<string, unknown>[]}
              visibleColumns={visibleColumns}
              isLoading={isLoading}
            />
          </div>
        </Box>
      </Box>

      <GlobalSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={onSnackbarClose}
      />
    </>
  );
};

export default GenericFullscreenView;
