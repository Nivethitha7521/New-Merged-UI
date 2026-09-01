
'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  Autocomplete,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import { BranchwiseItems, Recipe } from "../Models/recipeModels";
import { Add as AddIcon, Visibility as VisibilityIcon, Fullscreen as FullscreenIcon } from '@mui/icons-material';
import { RootState } from '@/redux/store';
import { useSelector } from 'react-redux';

interface RecipeHeaderFormProps {
  itemType: string;
  itemName: string;
  kitPrepare: number;
  uom: string;
  totalServings: number;
  category: string;
  subCategory: string;
  gramsOrPcs: number;
  product: BranchwiseItems[];
  isFetchingItems: boolean;
  validationErrors: {
    itemType: string;
    itemName: string;
    totalServings: string;
    consumables: string;
  };
  recipes: Recipe[];

  setItemType: (value: string) => void;
  setItemName: (value: string) => void;
  setKitPrepare: (value: number) => void;
  setUom: (value: string) => void;
  setTotalServings: (value: number) => void;
  setCategory: (value: string) => void;
  setSubCategory: (value: string) => void;
  setgramsOrPcs: (value: number) => void;
  handleOpenDialog: () => void;
  handleAddIngredient: () => void;
  setValidationErrors: React.Dispatch<
    React.SetStateAction<{
      itemType: string;
      itemName: string;
      totalServings: string;
      consumables: string;
    }>
  >;
  handleSearchItems: (query: string) => void;
  handleClearSearch: (type: 'items') => void;
  handleLoadMoreItems: (type: 'items') => void;
  hasMoreItems: boolean;
  toggleFullScreen: () => void;
  handleAddSubKit: () => void;
  isEditMode?: boolean;
  isVersionPreviewActive?: boolean;
}

const RecipeHeaderForm: React.FC<RecipeHeaderFormProps> = ({
  itemType,
  itemName,
  kitPrepare,
  uom,
  totalServings,
  category,
  subCategory,
  gramsOrPcs,
  product,
  isFetchingItems,
  validationErrors,

  setItemType,
  setItemName,
  setKitPrepare,
  setUom,
  setTotalServings,
  setCategory,
  setSubCategory,
  setgramsOrPcs,
  setValidationErrors,
  handleSearchItems,
  handleClearSearch,
  handleLoadMoreItems,
  handleOpenDialog,
  handleAddIngredient,
  hasMoreItems,
  toggleFullScreen,
  handleAddSubKit,
  isEditMode = false,
  isVersionPreviewActive = false,
}) => {

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));       // < 600px
  // const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600–900px

  const allRecipeItemNames = useSelector((state: RootState) => state.recipe.allRecipeItemNames);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [totalServingsInput, setTotalServingsInput] = useState<string>('');
  const [gramsInput, setGramsInput] = useState<string>('');

  useEffect(() => {
    setTotalServingsInput(totalServings === 0 ? '' : String(totalServings));
  }, [totalServings]);

  useEffect(() => {
    setGramsInput(gramsOrPcs === 0 ? '' : String(gramsOrPcs));
  }, [gramsOrPcs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const num = Number(totalServingsInput) || 0;
      if (num !== totalServings) setTotalServings(num);
    }, 300);
    return () => clearTimeout(timer);
  }, [totalServingsInput, totalServings, setTotalServings]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const num = Number(gramsInput) || 0;
      if (num !== gramsOrPcs) setgramsOrPcs(num);
    }, 300);
    return () => clearTimeout(timer);
  }, [gramsInput, gramsOrPcs, setgramsOrPcs]);

  // ── Shared styles ──
  const commonFieldHeight = isMobile ? '40px' : '42px';
  const commonSelectSx = {
    '& .MuiInputBase-root': { height: commonFieldHeight },
    '& .MuiInputBase-input': {
     fontSize: '13px',
      fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
    },
    '& .MuiSelect-select': {
    fontSize: '13px',
      fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
    },
  };

  const commonTextFieldSx = {
    '& .MuiInputBase-root': { height: commonFieldHeight },
    '& .MuiFormHelperText-root': {
      position: 'absolute' as const,
      bottom: -18,
      fontSize: '0.7rem',
    },
  };

  const commonMenuItemSx = {
  fontSize: '13px',
    fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
  };

 // ── Responsive field sizing ──────────────────────────────────────────────
 // The integrated Yenerp shell reduces the available content width. Keep the
// original single-row proportions on wide desktops and wrap cleanly before
// controls become compressed.
  const fieldBoxSx = {
    width: '100%',
    minWidth: 0,

 };

  const getDesktopWidth = (_width: string) => ({
    width: '100%',
   minWidth: 0,
  });
 

 return (
    <Box
      className="recipe-header-form"
      sx={{
        width: '100%',
        minWidth: 0,
        mt: 0,
        px: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* === HEADER FIELDS === */}
      <Box
        className="recipe-header-fields"
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
           lg: 'repeat(4, minmax(0, 1fr))',
          },
          alignItems: 'start',
          width: '100%',
          minWidth: 0,
        columnGap: { xs: 1.25, sm: 1.5, md: 2 },
         rowGap: { xs: 1.25, sm: 1.5, md: 1.75 },
          overflowX: 'visible',
          pb: 0,
          mb: 0,
          boxSizing: 'border-box',
          '& > *': {
            width: '100%',
            minWidth: 0,
            maxWidth: 'none',
            boxSizing: 'border-box',
          },
        }}
      >

        {/* Item Type */}
        <Box sx={{ ...fieldBoxSx, ...getDesktopWidth('110px') }}>
          <FormControl
            fullWidth
            size="small"
            margin="dense"
            error={!!validationErrors.itemType}
           sx={{ '& .MuiInputBase-root': { height: commonFieldHeight }, mt: 0, mb: 0 }}
          >
            <InputLabel className="custom-label">Item Type</InputLabel>
            <Select
              value={itemType}
              label="Item Type"
              onChange={(e) => {
                const value = e.target.value;
                setItemType(value);
                setValidationErrors(prev => ({ ...prev, itemType: value ? '' : 'Required' }));
              }}
              className="custom-textfield"
              sx={commonSelectSx}
            >
              <MenuItem value="KIT" sx={commonMenuItemSx}>KIT</MenuItem>
              <MenuItem value="SUBKIT" sx={commonMenuItemSx}>SUBKIT</MenuItem>
            </Select>
            {validationErrors.itemType && (
              <p style={{
                fontSize: '0.7rem',
                color: '#d32f2f',
                margin: '2px 0 0',
                position: 'absolute',
                bottom: -18,
                whiteSpace: 'nowrap'
              }}>
                {validationErrors.itemType}
              </p>
            )}
          </FormControl>
        </Box>

        {/* Item Name */}
      <Box sx={fieldBoxSx}>
          <Tooltip
            title={itemName || ""}
            arrow
            placement="top"
          >
            {itemType === 'SUBKIT' || isEditMode ? (
              <TextField
                label="Item Name"
                value={itemName}
                onChange={(e) => {
                  if (!isEditMode || itemType === 'SUBKIT') {
                    setItemName(e.target.value);
                    setValidationErrors(prev => ({ ...prev, itemName: e.target.value ? '' : 'Required' }));
                  }
                }}
                fullWidth
                size="small"
                margin="dense"
                error={!!validationErrors.itemName}
                helperText={validationErrors.itemName}
                className="custom-textfield"
                InputLabelProps={{ className: 'custom-label' }}
                InputProps={{
                  readOnly: isEditMode && itemType !== 'SUBKIT',
                  style: (isEditMode && itemType !== 'SUBKIT') ? { backgroundColor: 'var(--erp-bg, #f3f6fa)' } : undefined,
                  className: 'custom-input'
                }}
                sx={{
                  ...commonTextFieldSx,
                  ...((isEditMode && itemType !== 'SUBKIT') && {
                    '& .MuiInputBase-root': { pointerEvents: 'none', height: commonFieldHeight }
                  })
                }}
              />
            ) : (
              <Autocomplete
                options={product.filter(item => item.varianceName)}
                getOptionLabel={(option) => option.varianceName || ''}
                value={product.find(item => item.varianceName === itemName) || null}
                onChange={(_e, newValue) => {
                  const isAlreadySelected = allRecipeItemNames.includes(newValue?.varianceName || '');
                  if (isAlreadySelected) return;
                  setItemName(newValue ? newValue.varianceName : '');
                  setValidationErrors(prev => ({ ...prev, itemName: '' }));
                  if (newValue) {
                    setCategory(newValue.category || '');
                    setSubCategory(newValue.subCategory || '');
                    setUom(newValue.variance_Uom || '');
                  } else {
                    setCategory('');
                    setSubCategory('');
                    setUom('');
                  }
                }}
                onInputChange={(_e, value, reason) => {
                  if (reason === 'input') handleSearchItems(value);
                  else if (reason === 'clear') handleClearSearch('items');
                }}
                getOptionDisabled={(option) => allRecipeItemNames.includes(option.varianceName)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Item"
                    placeholder="Search items..."
                    size="small"
                    margin="dense"
                    error={!!validationErrors.itemName}
                    helperText={validationErrors.itemName}
                    className="custom-textfield"
                    InputLabelProps={{ className: 'custom-label' }}
                    InputProps={{
                      ...params.InputProps,
                      className: 'custom-input',
                      endAdornment: (
                        <>
                          {isFetchingItems && <CircularProgress size={16} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={commonTextFieldSx}
                  />
                )}
                renderOption={(props, option) => {
                  const isSelected = allRecipeItemNames.includes(option.varianceName);
                  return (
                    <li {...props} style={{ opacity: isSelected ? 0.5 : 1, cursor: isSelected ? 'not-allowed' : 'pointer' }}>
                      <ListItemText
                        primary={option.varianceName}
                        secondary={isSelected ? 'Already selected' : undefined}
                       primaryTypographyProps={{ fontSize: '0.75rem', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}
                        secondaryTypographyProps={{ fontSize: '0.7rem', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}
                      />
                    </li>
                  );
                }}
                ListboxProps={{
                  onScroll: (e) => {
                    const list = e.currentTarget;
                    if (list.scrollTop + list.clientHeight >= list.scrollHeight - 50 && hasMoreItems && !isFetchingItems) {
                      if (!timeoutRef.current) {
                        timeoutRef.current = setTimeout(() => {
                          handleLoadMoreItems('items');
                          timeoutRef.current = null;
                        }, 300);
                      }
                    }
                  },
                  sx: { maxHeight: 160 },
                }}
                filterOptions={x => x}
                noOptionsText="No items found"
                loading={isFetchingItems}
                isOptionEqualToValue={(o, v) => o.varianceName === v?.varianceName}
              />
            )}
          </Tooltip>
        </Box>

        {/* Batch Count */}
        <Box sx={{ ...fieldBoxSx, ...getDesktopWidth('125px') }}>
          <FormControl
            size="small"
            margin="dense"
            fullWidth
           sx={{ '& .MuiInputBase-root': { height: commonFieldHeight }, mt: 0, mb: 0 }}
          >
            <InputLabel className="custom-label">Batch Count</InputLabel>
            <Select
              value={kitPrepare}
              label="Batch Count"
              onChange={(e) => setKitPrepare(Number(e.target.value))}
              className="custom-textfield"
              MenuProps={{
                PaperProps: {
                  style: { maxHeight: 150 },
                  className: 'custom-popover'
                },
              }}
              sx={commonSelectSx}
            >
              {Array.from({ length: 100 }, (_, i) => (
                <MenuItem key={i + 1} value={i + 1} sx={commonMenuItemSx}>
                  {i + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* UOM */}
        <Box sx={{ ...fieldBoxSx, ...getDesktopWidth('100px') }}>
          <TextField
            label="UOM"
            value={uom}
            fullWidth
            size="small"
            margin="dense"
            className="custom-textfield"
            InputLabelProps={{ className: 'custom-label' }}
            InputProps={{
              readOnly: true,
              style: { backgroundColor: 'var(--erp-bg, #f3f6fa)' },
              className: 'custom-input'
            }}
            sx={{
              ...commonTextFieldSx,
              '& .MuiInputBase-root': { pointerEvents: 'none', height: commonFieldHeight }
            }}
          />
        </Box>

        {/* Total Kit Output Qty */}
        <Box sx={{ ...fieldBoxSx, ...getDesktopWidth('155px') }}>
          <TextField
            label="Total Kit Output Qty"
            autoComplete='off'
            value={totalServingsInput}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*$/.test(val)) {
                if (val.length > 6) {
                  setValidationErrors(prev => ({ ...prev, totalServings: 'Max 6 digits' }));
                } else {
                  setTotalServingsInput(val);
                  if (val && Number(val) > 0) {
                    setValidationErrors(prev => ({ ...prev, totalServings: '' }));
                  }
                }
              }
            }}
            fullWidth
            size="small"
            margin="dense"
            error={!!validationErrors.totalServings}
            helperText={validationErrors.totalServings || ' '}
            className="custom-textfield"
            InputLabelProps={{ className: 'custom-label' }}
            InputProps={{ className: 'custom-input' }}
            sx={commonTextFieldSx}
          />
        </Box>

        {/* Grams – hidden when PCS */}
        <Box
          sx={{
            ...fieldBoxSx,
            ...getDesktopWidth('100px'),
            display: uom.toLowerCase() === 'pcs' ? 'none' : 'block',
          }}
        >
          <TextField
            label="Grams"
            autoComplete='off'
            value={gramsInput}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*$/.test(val)) setGramsInput(val);
            }}
            fullWidth
            size="small"
            margin="dense"
            className="custom-textfield"
            InputLabelProps={{ className: 'custom-label' }}
            InputProps={{ className: 'custom-input' }}
            sx={commonTextFieldSx}
          />
        </Box>

        {/* Category */}
        <Box sx={{ ...fieldBoxSx, ...getDesktopWidth('135px') }}>
          <Tooltip title={category || ''} arrow placement="top">
            <TextField
              label="Category"
              value={category}
              fullWidth
              size="small"
              margin="dense"
              className="custom-textfield"
              InputLabelProps={{ className: 'custom-label' }}
              InputProps={{
                readOnly: true,
                style: { backgroundColor: 'var(--erp-bg, #f3f6fa)' },
                className: 'custom-input'
              }}
              sx={{
                ...commonTextFieldSx,
                '& .MuiInputBase-root': { pointerEvents: 'none', height: commonFieldHeight }
              }}
            />
          </Tooltip>
        </Box>

        {/* Sub Category */}
        <Box sx={{ ...fieldBoxSx, ...getDesktopWidth('135px') }}>
          <Tooltip title={subCategory || ''} arrow placement="top">
            <TextField
              label="Sub Category"
              value={subCategory}
              fullWidth
              size="small"
              margin="dense"
              className="custom-textfield"
              InputLabelProps={{ className: 'custom-label' }}
              InputProps={{
                readOnly: true,
               style: { backgroundColor: 'var(--erp-bg, #f3f6fa)' },
                className: 'custom-input'
              }}
              sx={{
                ...commonTextFieldSx,
                '& .MuiInputBase-root': { pointerEvents: 'none', height: commonFieldHeight }
              }}
            />
          </Tooltip>
        </Box>

      </Box>

 {/* === ACTION BUTTONS === */}
      <Box
        className="recipe-header-actions"
        sx={{
         display: 'flex',
          justifyContent: { xs: 'stretch', sm: 'flex-end' },
          alignItems: 'center',
          flexWrap: 'wrap',
         width: '100%',
          gap: 1,
          mt: 0.25,
          mb: 1.5,
          '& .btn-primary': isMobile
           ? {
                flex: '1 1 auto',
                justifyContent: 'center',
              }
            : {},
        }}
      >
        <IconButton
          onClick={handleOpenDialog}
          className="icon-action-button"
          sx={{
            '& svg': { fontSize: '1.05rem' },
           '&:hover': { backgroundColor: 'var(--erp-accent-soft, #e8efff)' },
            order: isMobile ? 3 : 0,   // push icon buttons to end on mobile
          }}
        >
          <VisibilityIcon className="icon-action-svg" />
        </IconButton>

        <button
          onClick={handleAddIngredient}
          disabled={itemType === 'SUBKIT' ? false : isVersionPreviewActive}
          className="btn-primary"
          style={{
            ...(isMobile ? { display: 'flex', alignItems: 'center', flex: '1 1 auto' } : {}),
            ...(isVersionPreviewActive ? {
              opacity: 0.45,
              cursor: 'not-allowed',
              pointerEvents: 'none',
            } : {}),
          }}
        >
          <AddIcon style={{ marginRight: 6 }} />
          Add Ingredient
        </button>

        <button
          onClick={handleAddSubKit}
          disabled={isVersionPreviewActive}
          className="btn-primary"
          style={{
            ...(isMobile ? { display: 'flex', alignItems: 'center', flex: '1 1 auto' } : {}),
            ...((isVersionPreviewActive) ? {
              opacity: 0.45,
              cursor: 'not-allowed',
              pointerEvents: 'none',
            
              boxShadow: 'none',
              transform: 'none',
            } : {}),
          }}
        >
          <AddIcon style={{ marginRight: 6 }} />
          Add SubKit
        </button>

        <IconButton
          onClick={toggleFullScreen}
          className="icon-action-button"
          sx={{
            '& svg': { fontSize: '1.05rem' },
           '&:hover': { backgroundColor: 'var(--erp-accent-soft, #e8efff)' },
            order: isMobile ? 3 : 0,
          }}
        >
          <FullscreenIcon className="icon-action-svg" />
        </IconButton>
      </Box>

    </Box>
  );
};

export default RecipeHeaderForm;