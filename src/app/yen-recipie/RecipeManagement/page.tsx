
"use client";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  fetchRecipeItem,
  fetchRecipe,
  fetchRecipeById,
  ExportRecipe,
  ImportRecipe,
  setSearchQuery,
  ExportCSV,
  setShowDeactivated,
  deactivateRecipe,
  activateRecipe,
  setSnackbarOpen,
  setSnackbarMessage,
  setRecipePage,
  ExportRecipePDF,
  //  Exportheader,
  //  fetchVarianceNotifications,
  fetchVarianceAllNotifications,
  Exportheader,
  ExportAllRecipesPDF

} from "./Features/recipeSlice";
import * as XLSX from "xlsx";
import {

  Box,
  
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField,
InputAdornment,
Tooltip,
  Switch,
  Snackbar,
  Alert,
  Button,
  //  Popover,
  Badge,
  Chip,
} from "@mui/material";
import { AppDispatch, RootState } from "../../../redux/store";
import {
  Upload as UploadIcon,
  Print as PrintIcon,
  Add as AddIcon,
  Search as SearchIcon,
  GetApp as GetAppIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from "@mui/icons-material";
import EditIcon from "@mui/icons-material/EditOutlined";
import VisibilityIcon from "@mui/icons-material/VisibilityOutlined";
import RefreshIcon from "@mui/icons-material/RestoreRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Pagination } from "@mui/material";
import { PerGramBreakdown, Recipe, RecipeListItem } from "./Models/recipeModels"; // ✅ Import Recipe from models
import ActivateDeactivateConfirmationDialog from "@/app/Components/Dialogs/ActivateDeactivateConfirmationDialog";
import { buildPerGramBreakdown } from "./Pages/page";
import "./recipeViewDialog.css";

// ✅ Remove the duplicate IngredientItem interface - use the one from models
export interface IngredientItem {
  randomId?: string;
  ingredients: string;
  kitQty: number;
  uom: string;
  batchQty: number;
  perGramCost: number;
  totalCost: number;
  haveIt: boolean;
  GST: number;
  isSubkit?: boolean;
  isSubKitSelection?: boolean;
  isSubKitHeader?: boolean;
  totalRequiredSubkitQty?: number;
}



const RecipeManagementPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeListItem | null>(null);

  /////  TAILWIND IMPORTS ////
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingType, setExportingType] = useState<'recipe' | 'costing' | 'full' | null>(null);


  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedPrintRecipe, setSelectedPrintRecipe] = useState<Recipe | null>(null);
  const [exportingPDF,] = useState(false);

  const [exportingRecipeId, setExportingRecipeId] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);
  const [importResultDialogOpen, setImportResultDialogOpen] = useState<boolean>(false);
  const [importResults, setImportResults] = useState<{
    successful: Array<{ row: number; data: Record<string, string> }>;
    updated: Array<{ row: number; data: Record<string, string>; error?: string }>;
    failed: Array<{ row: number; data: Record<string, string>; error: string; missingFields: string[] }>;
  }>({
    successful: [],
    updated: [],
    failed: [],
  });


  const [isExportingAllPDF, setIsExportingAllPDF] = useState(false);
  const [allPDFDialogOpen, setAllPDFDialogOpen] = useState(false);
  const [exportingAllPDFType, setExportingAllPDFType] = useState<'recipe' | 'costing' | 'full' | null>(null);

  // === NOTIFICATION STATE ===
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationSearchQuery, setNotificationSearchQuery] = useState(''); // ✅ ADD THIS LINE

  const [breakdownPopup, setBreakdownPopup] = useState<{
    open: boolean;
    // anchorEl: HTMLElement | null;
    data: PerGramBreakdown | null;
    loading: boolean;
  }>({ open: false, data: null, loading: false });



  const {
    getRecipe,
    deactivatedGetRecipe,
    recipes,
    //  product,
    loading,
    //exportLoading,
    // consumables,
    searchQuery,
    currentRecipePage,
    totalRecipePages,
    totalRecipes,
    recipesPerPage,
    showDeactivated,
    deactivatedRecipes,
    snackbarOpen,
    snackbarMessage,
    variance,
    varianceLoading
  } = useSelector((state: RootState) => state.recipe);

  // === DIALOG STATE ===
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedIngredients, setSelectedIngredients] = useState<IngredientItem[]>([]);
  const [, setSelectedRecipeId] = useState<string>("");

  // ✅ Use Recipe type from models instead of RecipeDetails
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [loadingRecipeDetails, setLoadingRecipeDetails] = useState<boolean>(false);

  // === DEBOUNCED SEARCH ===
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);


  // === FETCH VARIANCE NOTIFICATIONS ON MOUNT ===
  // === FETCH VARIANCE NOTIFICATIONS ON MOUNT (uses Scheduler endpoint) ===
  useEffect(() => {
    dispatch(fetchVarianceAllNotifications({ page: 1, limit: 50 }));  // ✅ NEW THUNK
  }, [dispatch]);


  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    dispatch(fetchRecipeItem({
      search: debouncedSearchQuery,
      page: currentRecipePage,
      limit: 20,
      status: showDeactivated ? 'deactivated' : 'active'
    }));
  }, [dispatch, debouncedSearchQuery, currentRecipePage, showDeactivated]);



  // // === CSV TEMPLATE ===
  const headers = [
    "ITEM TYPE", "ITEM NAME", "TOTAL SERVINGS", "PER PIECE WEIGHT", "S.NO",
    "INGREDIENT", "UOM", "KITQTY", "HAVE IT", "INGREDIENT TYPE",
    "STEP BY STEP INSTRUCTIONS", "CONSUMABLE NAME", "CONSUMABLE PERCENTAGE"
  ];

  const handleDownloadSampleCSV = async () => {
    setIsImporting(true);
    try {
      await dispatch(Exportheader());
      setSnackbarMessage('Sample CSV downloaded successfully');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to download sample CSV');
      setSnackbarOpen(true);
    } finally {
      setIsImporting(false);
    }
  };



  const handleExportAllPDF = async (recipePrint: boolean, costingPrint: boolean, type: 'recipe' | 'costing' | 'full') => {
    setExportingAllPDFType(type);
    setIsExportingAllPDF(true);
    try {
      await dispatch(ExportAllRecipesPDF({ recipePrint, costingPrint }));
    } finally {
      setExportingAllPDFType(null);
      setIsExportingAllPDF(false);
      setAllPDFDialogOpen(false);
    }
  };

  const handlePerGramEyeClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    ing: IngredientItem
  ) => {
    const uom = ing.uom?.toUpperCase();
    if (!["PCS", "PKT", "NOS"].includes(uom)) return;

    const breakdown = buildPerGramBreakdown(ing);

    if (!breakdown) {
      console.warn("Could not build breakdown for:", ing.ingredients);
      return;
    }

    setBreakdownPopup({ open: true, data: breakdown, loading: false });
  };



  // === NOTIFICATION HANDLERS (uses Scheduler endpoint with pagination) ===
  const handleOpenNotifications = async () => {
    setNotificationDialogOpen(true);
    setNotificationsLoading(true);
    try {
      // ✅ NEW: Uses /scheduler/notifications endpoint
      // await dispatch(fetchVarianceAllNotifications({ page: 1, limit: 50 })).unwrap();
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      dispatch(setSnackbarMessage('Failed to load price alerts'));
      dispatch(setSnackbarOpen(true));
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleCloseNotifications = () => {
    setNotificationDialogOpen(false);
  };


  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    dispatch(setRecipePage(value));
    // dispatch(fetchRecipe({
    //   search: debouncedSearchQuery,
    //   page: value,
    //   limit: 20
    // }));
  };

  // === HIERARCHICAL S.NO LOGIC ===
  const getRowNumber = (index: number): string => {
    let regularCount = 0;
    let currentSubKit = 0;
    let subKitCount = 0;
    let inSubKit = false;

    for (let i = 0; i <= index; i++) {
      const item = selectedIngredients[i];
      if (item.isSubKitSelection) continue;
      if (item.isSubKitHeader) {
        regularCount++;
        currentSubKit = regularCount;
        inSubKit = true;
        subKitCount = 0;
        if (i === index) return currentSubKit.toString();
      } else {
        if (inSubKit && !item.isSubKitHeader) {
          subKitCount++;
          if (i === index) return `${currentSubKit}.${subKitCount}`;
        } else {
          regularCount++;
          inSubKit = false;
          if (i === index) return regularCount.toString();
        }
      }
    }
    return (index + 1).toString();
  };

  // ✅ UPDATED: Handle null ingredients properly
  const handleOpenDialog = async (ingredients: IngredientItem[], recipeId: string) => {
    setSelectedRecipeId(recipeId);
    setOpenDialog(true);
    setLoadingRecipeDetails(true);

    try {
      const result = await dispatch(fetchRecipeById(recipeId)).unwrap();
      setCurrentRecipe(result);

      if (result.ingredients && result.ingredients.addedIngrediant) {
        // Process ingredients with sub-kit detection
        const processed = result.ingredients.addedIngrediant.map((ing: IngredientItem) => {
          const isSubKit = ing.isSubKitHeader || ing.isSubkit || false;
          return { ...ing, isSubKitHeader: isSubKit };
        });

        setSelectedIngredients(processed);
      } else {
        setSelectedIngredients([]);
      }
    } catch (error) {
      console.error("Failed to fetch recipe details:", error);
      // Fallback to using the ingredients passed as parameter
      const processed = ingredients.map((ing) => {
        const isSubKit = recipes.some(
          (r) => r.itemType === "SUBKIT" && r.createRecipe?.itemName === ing.ingredients
        );
        return { ...ing, isSubKitHeader: isSubKit };
      });
      setSelectedIngredients(processed);
    } finally {
      setLoadingRecipeDetails(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedIngredients([]);
    setSelectedRecipeId("");
    setCurrentRecipe(null);
  };

  const handleExportOverall = async () => {
    setIsExporting(true);
    try {
      await dispatch(ExportCSV());
    } finally {
      setIsExporting(false);
    }
  };


  const handleExportCSV = async (recipeId: string, itemName: string) => {
    setExportingRecipeId(recipeId);
    try {
      await dispatch(ExportRecipe({ recipeId, itemName }));
    } finally {
      setExportingRecipeId(null);
    }
  };

  const handleEditClick = (recipeId: string) => {
    router.push(`/yen-recipie/RecipeManagement/Pages?recipeId=${recipeId}`);
  };


  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) {
      setImportResults({
        successful: [],
        updated: [],
        failed: [{
          row: 0,
          data: {},
          error: "File must be an Excel (.xlsx) or CSV (.csv) file",
          missingFields: []
        }]
      });
      setImportResultDialogOpen(true);
      return;
    }

    // ── Start loading ──
    setIsImporting(true);

    const onImportDone = (result: { meta: { requestStatus: string }; payload?: unknown }) => {
      if (result.meta.requestStatus === "fulfilled") {
        setImportResults({ successful: [{ row: 0, data: {} }], updated: [], failed: [] });
        dispatch(fetchRecipe({
          search: debouncedSearchQuery,
          page: currentRecipePage,
          limit: 20
        }));
      } else {
        setImportResults({
          successful: [],
          updated: [],
          failed: [{ row: 0, data: {}, error: (result.payload as string) || "Import failed", missingFields: [] }]
        });
      }
      setImportResultDialogOpen(true);
      setIsImporting(false); // ── Stop loading ──
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const fileHeaders = Object.keys(jsonData[0] || {});
      const missingHeaders = headers.filter(h => !fileHeaders.includes(h));

      if (missingHeaders.length > 0) {
        setImportResults({
          successful: [],
          updated: [],
          failed: [{
            row: 0,
            data: {},
            error: `Missing required headers: ${missingHeaders.join(", ")}`,
            missingFields: missingHeaders
          }]
        });
        setImportResultDialogOpen(true);
        setIsImporting(false); // ── Stop loading on validation fail ──
        return;
      }

      dispatch(ImportRecipe(file)).then(onImportDone);
    };

    if (file.name.endsWith(".xlsx")) {
      reader.readAsArrayBuffer(file);
    } else {
      dispatch(ImportRecipe(file)).then(onImportDone);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImportClick = () => setImportDialogOpen(true);
  const handleCloseImportDialog = () => setImportDialogOpen(false);
  const handleCloseImportResultDialog = () => {
    setImportResultDialogOpen(false);
    setImportResults({ successful: [], updated: [], failed: [] });
  };

  // === TOTALS (Based on Have It = true) ===
  const totalEstimateQty = selectedIngredients.reduce(
    (sum, item) =>
      !item.isSubKitHeader && item.haveIt
        ? sum + (item.batchQty || 0)
        : sum,
    0
  );

  const totalCost = selectedIngredients.reduce(
    (sum, item) =>
      !item.isSubKitHeader && item.haveIt
        ? sum + (item.totalCost || 0)
        : sum,
    0
  );


  const handleDeactivate = (recipe: RecipeListItem) => {
    setSelectedRecipe(recipe);
    setActionType("deactivate");
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (recipe: RecipeListItem) => {
    setSelectedRecipe(recipe);
    setActionType("activate");
    setConfirmationDialogOpen(true);
  };


  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
    setSelectedRecipe(null);
    setActionType(null);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (selectedRecipe && actionType) {
      try {
        if (actionType === "deactivate") {
          await dispatch(deactivateRecipe(selectedRecipe.recipeId));
        } else {
          await dispatch(activateRecipe(selectedRecipe.recipeId));
        }
        dispatch(setSnackbarMessage(`Recipe ${actionType === "deactivate" ? "deactivated" : "activated"} Successfully!`));
        //  dispatch(fetchRecipe());
        dispatch(fetchRecipeItem({
          search: debouncedSearchQuery,
          page: currentRecipePage,
          limit: 20,
          status: showDeactivated ? 'deactivated' : 'active'
        }));
      } catch (error: unknown) {
        let errorMessage = 'An error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        dispatch(setSnackbarMessage(errorMessage));
        dispatch(setSnackbarOpen(true));
      }
    }
    handleConfirmationDialogClose();
  };



  const handlePrintClick = (recipe: Recipe) => {
    setSelectedPrintRecipe(recipe);
    setPrintDialogOpen(true);
  };


  const handlePrintExport = async (recipePrint: boolean, costingPrint: boolean, type: 'recipe' | 'costing' | 'full') => {
    if (!selectedPrintRecipe) return;
    setExportingType(type);
    try {
      await dispatch(
        ExportRecipePDF({
          recipeId: selectedPrintRecipe.recipeId,
          itemName: selectedPrintRecipe.createRecipe?.itemName || "Recipe",
          recipePrint,
          costingPrint,
        })
      );
    } finally {
      setExportingType(null);
      setPrintDialogOpen(false);
    }
  };

  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';
  const displayedRecipes = showDeactivated ? deactivatedGetRecipe : getRecipe;
  const displayedOldRecipe = showDeactivated ? deactivatedRecipes : recipes;

return (
  <Box className="master-admin-module-page recipe-master-page">
    

{/* Yenerp toolbar */}
<Box className="location-master-toolbar">
  <Typography className="location-master-toolbar-title">
    {showDeactivated ? "Deactivated Recipes" : "Active Recipes"}
  </Typography>

  <TextField
    type="search"
    value={searchQuery}
    onChange={(event) =>
      dispatch(setSearchQuery(event.target.value))
    }
    placeholder="Search recipes..."
    className="purchase-reference-search location-master-search"
    inputProps={{
      "aria-label": "Search recipes",
    }}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon className="purchase-reference-search-icon" />
        </InputAdornment>
      ),
    }}
  />

  <Box className="purchase-reference-actions location-master-actions">
    {!showDeactivated && (
      <>
        <Button
          type="button"
          variant="outlined"
          startIcon={
            isExportingAllPDF ? (
              <CircularProgress size={16} />
            ) : (
              <PictureAsPdfIcon />
            )
          }
          onClick={() => setAllPDFDialogOpen(true)}
          disabled={
            isImporting ||
            isExporting ||
            isExportingAllPDF
          }
          className="purchase-reference-action-button"
        >
          {isExportingAllPDF
            ? "Exporting..."
            : "Generate Kit Book"}
        </Button>

        <Button
          type="button"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() =>
            router.push(
              "/yen-recipie/RecipeManagement/Pages"
            )
          }
          disabled={isImporting || isExporting}
          className="purchase-reference-action-button"
        >
          Add New
        </Button>

        <Button
          type="button"
          variant="outlined"
          startIcon={
            isExporting ? (
              <CircularProgress size={16} />
            ) : (
              <UploadIcon />
            )
          }
          onClick={handleExportOverall}
          disabled={isImporting || isExporting}
          className="purchase-reference-action-button"
        >
          {isExporting ? "Exporting..." : "Export"}
        </Button>

        <Button
          type="button"
          variant="outlined"
          startIcon={
            <Badge
              badgeContent={variance.unreadCount || 0}
              color="error"
              max={99}
            >
              {varianceLoading ? (
                <CircularProgress size={16} />
              ) : (
                <NotificationsIcon />
              )}
            </Badge>
          }
          onClick={handleOpenNotifications}
          className="purchase-reference-action-button"
        >
          Alerts
        </Button>
      </>
    )}

    <Box className="purchase-reference-active-toggle">
      <Typography component="span">
        {label}
      </Typography>

      <Switch
        checked={showDeactivated}
        onChange={() =>
          dispatch(
            setShowDeactivated(!showDeactivated)
          )
        }
        color="primary"
        size="small"
        disabled={isExporting || isImporting}
        inputProps={{
          "aria-label": label,
        }}
      />
    </Box>
  </Box>
</Box>

{/* Keep the existing Recipe import input */}
<input
  type="file"
  accept=".csv,.xlsx"
  ref={fileInputRef}
  style={{ display: "none" }}
  onChange={handleImportFile}
/>
      {/* === MAIN TABLE === */}
      {/* === MAIN TABLE === */}
<Box className="master-admin-table-area">
  <Box className="purchase-master-table-shell">
    <div className="purchase-native-table-wrapper">
      <table className="purchase-native-table recipe-native-table">
          <thead>
            <tr>
              <th align="right">S.No</th>
              <th align="right">Recipe Id</th>
              <th align="left">Item Type</th>
              <th align="left">Variance Name</th>
              <th align="left">Category</th>
              <th align="left">Sub Category</th>
              <th align="right">Profit (₹)</th>
              <th align="right">Profit (%)</th>
              <th align="right">Version</th>
              <th align="center">Date Created</th>
              <th align="center">Date Modified</th>
              <th align="center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedRecipes.map((recipe, index) => {
              // ✅ Look up the full Recipe object for visibility/print actions
              const fullRecipe = displayedOldRecipe.find(r => r.recipeId === recipe.recipeId) ?? null;

              const isNegativeProfit = recipe.profit !== null &&
                recipe.profit !== undefined &&
                recipe.profit < 0;

              return (
                <tr
  key={recipe.recipeId}
  className={
    isNegativeProfit
      ? "recipe-negative-profit-row"
      : undefined
  }
  style={{
    backgroundColor: isNegativeProfit
      ? "#f8b5bfff"
      : "inherit",
  }}
>
                  <td align="right">
                    {(currentRecipePage - 1) * recipesPerPage + index + 1}
                  </td>
                  <td align="right">{recipe.RECIPEID}</td>
                  <td align="left">{recipe.itemType || "-"}</td>
                  <td align="left">{recipe.varianceName || "-"}</td>
                  <td align="left">{recipe.category || "-"}</td>
                  <td align="left">{recipe.subCategory || "-"}</td>
                  <td align="right">
                    {recipe.profit ? `₹${recipe.profit}` : "-"}
                  </td>
                  <td align="right">
                    {recipe.profitPercentage ? `${recipe.profitPercentage}%` : "-"}
                  </td>
                  <td align="center">
                    {recipe.profit ? `[ ${recipe.version} ]` : "-"}
                  </td>
                  <td align="center">
                    {recipe.createdDate ? new Date(recipe.createdDate).toLocaleString() : "-"}
                  </td>
                  <td align="center">
                    {recipe.updatedDate ? new Date(recipe.updatedDate).toLocaleString() : "-"}
                  </td>
                  <td
                    align="center"
                    style={{ backgroundColor: 'background.paper !important' }}
                  >
<Box className="purchase-master-actions">
  {showDeactivated ? (
    <Tooltip title="Activate recipe" arrow>
      <IconButton
        type="button"
        onClick={() => handleActivate(recipe)}
        className="purchase-master-action-button is-activate"
        aria-label="Activate recipe"
      >
        <RefreshIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  ) : (
    <>
      <Tooltip title="Edit recipe" arrow>
        <span>
          <IconButton
            type="button"
            disabled={isExporting || isImporting}
            onClick={() => handleEditClick(recipe.recipeId)}
            className="purchase-master-action-button is-edit"
            aria-label="Edit recipe"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="View ingredients" arrow>
        <span>
          <IconButton
            type="button"
            disabled={isExporting || isImporting}
            onClick={() =>
              handleOpenDialog(
                fullRecipe?.ingredients?.addedIngrediant ?? [],
                recipe.recipeId
              )
            }
            className="purchase-master-action-button is-view"
            aria-label="View recipe ingredients"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Deactivate recipe" arrow>
        <span>
          <IconButton
            type="button"
            onClick={() => handleDeactivate(recipe)}
            disabled={isExporting || isImporting}
            className="purchase-master-action-button is-delete"
            aria-label="Deactivate recipe"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Export recipe" arrow>
        <span>
          <IconButton
            type="button"
            onClick={() =>
              handleExportCSV(
                recipe.recipeId,
                recipe.varianceName || "Recipe"
              )
            }
            disabled={
              isImporting ||
              isExporting ||
              exportingRecipeId !== null
            }
            className="purchase-master-action-button is-export"
            aria-label="Export recipe"
          >
            {exportingRecipeId === recipe.recipeId ? (
              <CircularProgress size={16} />
            ) : (
              <UploadIcon fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </>
  )}
</Box>
                  </td>
                </tr>
              );
            })}
</tbody>
      </table>
    </div>
  </Box>
</Box>

<Box className="master-admin-pagination" sx={{ gap: 1 }}>
  <Typography component="span" sx={{ fontSize: "10px" }}>
    Showing{" "}
    {totalRecipes === 0
      ? 0
      : (currentRecipePage - 1) * recipesPerPage + 1}{" "}
    to{" "}
    {Math.min(
      currentRecipePage * recipesPerPage,
      totalRecipes
    )}{" "}
    of {totalRecipes} recipes
  </Typography>

  <Pagination
    count={totalRecipePages}
    page={currentRecipePage}
    onChange={handlePageChange}
    color="primary"
    shape="rounded"
    disabled={loading}
    siblingCount={1}
    boundaryCount={1}
    sx={{ fontSize: "10px" }}
  />
</Box>

      {/* === INGREDIENT OVERVIEW DIALOG === */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth={false}
        className="recipe-view-dialog"
        PaperProps={{
          className: "recipe-view-dialog-paper",
        }}
      >
        <DialogTitle className="recipe-view-dialog-header">
          <Box className="recipe-view-dialog-heading">
            <Typography component="h2" className="recipe-view-dialog-title">
              Ingredients Overview
            </Typography>
            <Typography component="p" className="recipe-view-dialog-subtitle">
              Item Name:
              <Box component="span" className="recipe-view-dialog-item-name">
                {currentRecipe?.createRecipe?.itemName || "N/A"}
              </Box>
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent className="recipe-view-dialog-content">
          {loadingRecipeDetails ? (
            <Box className="recipe-view-dialog-loading">
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Box className="recipe-view-dialog-body">
              <section className="recipe-view-table-card" aria-label="Recipe ingredients">
                <div className="recipe-view-table-scroll">
                  <table className="recipe-view-table">
                    <colgroup>
                      <col className="recipe-view-col-serial" />
                      <col className="recipe-view-col-ingredient" />
                      <col className="recipe-view-col-uom" />
                      <col className="recipe-view-col-quantity" />
                      <col className="recipe-view-col-quantity" />
                      <col className="recipe-view-col-cost" />
                      <col className="recipe-view-col-cost" />
                      <col className="recipe-view-col-gst" />
                      <col className="recipe-view-col-status" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="is-center">S.No</th>
                        <th className="is-left">Ingredient</th>
                        <th className="is-center">UOM</th>
                        <th className="is-right">
                          Kit Qty
                          <span>(in grams)</span>
                        </th>
                        <th className="is-right">
                          Batch Qty
                          <span>(in grams)</span>
                        </th>
                        <th className="is-right">Per Gram Cost</th>
                        <th className="is-right">Total Cost</th>
                        <th className="is-right">GST Price</th>
                        <th className="is-center">Have It</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedIngredients.length > 0 ? (
                        selectedIngredients.map((ing, index) => (
                          <tr
                            key={index}
                            className={ing.isSubKitHeader ? "recipe-view-subkit-row" : undefined}
                          >
                            <td className="is-center recipe-view-row-number">
                              {getRowNumber(index)}
                            </td>
                            <td className="is-left recipe-view-ingredient-cell">
                              <Typography
                                component="span"
                                className={ing.isSubKitHeader ? "recipe-view-subkit-name" : undefined}
                              >
                                {ing.ingredients}
                              </Typography>
                              {ing.isSubKitHeader &&
                                ing.totalRequiredSubkitQty !== undefined &&
                                ing.totalRequiredSubkitQty > 0 && (
                                  <Typography component="span" className="recipe-view-subkit-qty">
                                    ({ing.totalRequiredSubkitQty.toFixed(2)}g)
                                  </Typography>
                                )}
                            </td>
                            <td className="is-center">{ing.isSubKitHeader ? "" : ing.uom}</td>
                            <td className="is-right">
                              {ing.isSubKitHeader ? "" : ing.kitQty.toFixed(2)}
                            </td>
                            <td className="is-right">
                              {ing.isSubKitHeader ? "" : ing.batchQty.toFixed(2)}
                            </td>
                            <td className="is-right">
                              {ing.isSubKitHeader ? "" : (
                                <Box className="recipe-view-per-gram-cell">
                                  {["PCS", "PKT", "NOS"].includes(ing.uom?.toUpperCase()) ? (
                                    <IconButton
                                      type="button"
                                      className="recipe-view-calculation-button"
                                      onClick={(event) => handlePerGramEyeClick(event, ing)}
                                      title="View calculation"
                                      aria-label={`View per gram calculation for ${ing.ingredients}`}
                                    >
                                      <VisibilityIcon />
                                    </IconButton>
                                  ) : (
                                    <span aria-hidden="true" />
                                  )}
                                  <span>{(ing.perGramCost as number).toFixed(3)}</span>
                                </Box>
                              )}
                            </td>
                            <td className="is-right">
                              {ing.isSubKitHeader ? "" : ing.totalCost.toFixed(2)}
                            </td>
                            <td className="is-right">
                              {ing.isSubKitHeader ? "" : ing.GST.toFixed(2)}
                            </td>
                            <td className="is-center">
                              {ing.isSubKitHeader ? "" : ing.haveIt ? "Yes" : "No"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="recipe-view-empty-state">
                            No ingredients found
                          </td>
                        </tr>
                      )}
                    </tbody>

                    <tfoot>
                      <tr>
                        <td colSpan={2} className="recipe-view-total-label">
                          Totals
                        </td>
                        <td />
                        <td className="is-right">
                          <span className="recipe-view-total-value recipe-view-total-value--blue">
                            {(currentRecipe?.totals?.totalKitQty || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="is-right">
                          <span className="recipe-view-total-value recipe-view-total-value--blue">
                            {(
                              currentRecipe?.createRecipe?.UOM === "Pcs" ||
                              currentRecipe?.createRecipe?.UOM === "Kgs" ||
                              currentRecipe?.itemType === "SUBKIT"
                                ? currentRecipe?.totals?.totalBatchQty || 0
                                : totalEstimateQty || 0
                            ).toFixed(2)}
                          </span>
                        </td>
                        <td />
                        <td className="is-right">
                          <span className="recipe-view-total-value recipe-view-total-value--green">
                            {(
                              currentRecipe?.createRecipe?.UOM === "Pcs" ||
                              currentRecipe?.createRecipe?.UOM === "Kgs" ||
                              currentRecipe?.itemType === "SUBKIT"
                                ? currentRecipe?.totals?.totalIngCost || 0
                                : totalCost || 0
                            ).toFixed(2)}
                          </span>
                        </td>
                        <td className="is-right">
                          <span className="recipe-view-total-value recipe-view-total-value--amber">
                            {(currentRecipe?.totals?.totalGST || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="is-center">
                          <IconButton
                            type="button"
                            className="recipe-view-print-button"
                            title="Print / Export PDF"
                            aria-label="Print or export recipe as PDF"
                            onClick={() => {
                              handleCloseDialog();
                              if (currentRecipe) handlePrintClick(currentRecipe);
                            }}
                          >
                            <PrintIcon />
                          </IconButton>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              <Box className="recipe-view-summary-grid">
                <section className="recipe-view-summary-card">
                  <Typography component="h3" className="recipe-view-section-title">
                    Product Output
                  </Typography>
                  <Box className="recipe-view-summary-columns">
                    <Box className="recipe-view-metric-group">
                      <Typography className="recipe-view-metric-group-title">Yield In</Typography>
                      <Box className="recipe-view-metric-grid recipe-view-metric-grid--two">
                        <Box className="recipe-view-metric-cell">
                          <span>Grams</span>
                          <strong>{(currentRecipe?.productOutput?.productOutputGrams || 0).toFixed(2)}</strong>
                        </Box>
                        <Box className="recipe-view-metric-cell">
                          <span>Pcs</span>
                          <strong>{(currentRecipe?.productOutput?.productOutputPcs || 0).toFixed(2)}</strong>
                        </Box>
                      </Box>
                    </Box>
                    <Box className="recipe-view-metric-group">
                      <Typography className="recipe-view-metric-group-title">After Baking Output</Typography>
                      <Box className="recipe-view-metric-grid recipe-view-metric-grid--two">
                        <Box className="recipe-view-metric-cell">
                          <span>Grams</span>
                          <strong>{(currentRecipe?.afterBaking?.bakingOutputGrams || 0).toFixed(2)}</strong>
                        </Box>
                        <Box className="recipe-view-metric-cell">
                          <span>Pcs</span>
                          <strong>{(currentRecipe?.afterBaking?.bakingOutputPcs || 0).toFixed(2)}</strong>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </section>

                <section className="recipe-view-summary-card">
                  <Typography component="h3" className="recipe-view-section-title">
                    Raw Material Cost
                  </Typography>
                  <Box className="recipe-view-summary-columns">
                    <Box className="recipe-view-metric-group">
                      <Typography className="recipe-view-metric-group-title">Raw Material Cost Per</Typography>
                      <Box className="recipe-view-metric-grid recipe-view-metric-grid--two">
                        <Box className="recipe-view-metric-cell">
                          <span>₹ Kgs</span>
                          <strong>{(currentRecipe?.perPieceWeight?.perGramWeight || 0).toFixed(2)}</strong>
                        </Box>
                        <Box className="recipe-view-metric-cell">
                          <span>₹ Pcs</span>
                          <strong>{(currentRecipe?.perPieceWeight?.perPieceWeight || 0).toFixed(2)}</strong>
                        </Box>
                      </Box>
                    </Box>
                    <Box className="recipe-view-metric-group">
                      <Typography className="recipe-view-metric-group-title">Per Piece Weight</Typography>
                      <Box className="recipe-view-metric-grid">
                        <Box className="recipe-view-metric-cell">
                          <span>Grams</span>
                          <strong>{(currentRecipe?.perPieceWeight?.PcsWeight || 0).toFixed(2)}</strong>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </section>

                <section className="recipe-view-summary-card">
                  <Typography component="h3" className="recipe-view-section-title">
                    Selling Costs
                  </Typography>
                  <Box className="recipe-view-summary-columns">
                    <Box className="recipe-view-metric-group">
                      <Typography className="recipe-view-metric-group-title">Selling Cost For Item</Typography>
                      <Box className="recipe-view-metric-grid recipe-view-metric-grid--two">
                        <Box className="recipe-view-metric-cell">
                          <span>₹ Kgs</span>
                          <strong>{(currentRecipe?.sellingCost?.sellingCostKg || 0).toFixed(2)}</strong>
                        </Box>
                        <Box className="recipe-view-metric-cell">
                          <span>₹ Pcs</span>
                          <strong>{(currentRecipe?.sellingCost?.sellingCostPcs || 0).toFixed(2)}</strong>
                        </Box>
                      </Box>
                    </Box>
                    <Box className="recipe-view-metric-group">
                      <Typography className="recipe-view-metric-group-title">Total Selling Cost</Typography>
                      <Box className="recipe-view-metric-grid">
                        <Box className="recipe-view-metric-cell">
                          <span>₹ Total</span>
                          <strong>{(currentRecipe?.sellingCost?.totalSellingCost || 0).toFixed(2)}</strong>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </section>
              </Box>

              <section className="recipe-view-profit-card">
                <Typography component="h3" className="recipe-view-section-title recipe-view-section-title--left">
                  Profit Calculation
                </Typography>

                <Box className="recipe-view-profit-metrics">
                  <Box className="recipe-view-profit-metric recipe-view-profit-metric--selling">
                    <span>Selling Cost</span>
                    <strong>{(currentRecipe?.sellingCost?.totalSellingCost || 0).toFixed(2)}</strong>
                  </Box>
                  <Box className="recipe-view-profit-metric recipe-view-profit-metric--rmc">
                    <span>RMC</span>
                    <strong>{(currentRecipe?.totals?.totalIngCost || 0).toFixed(2)}</strong>
                  </Box>
                  <Box className="recipe-view-profit-metric recipe-view-profit-metric--consumables">
                    <span>Consumables</span>
                    <strong>{(currentRecipe?.profit?.consumablePrice || 0).toFixed(2)}</strong>
                  </Box>
                  <Box className="recipe-view-profit-metric recipe-view-profit-metric--gst">
                    <span>GST</span>
                    <strong>{(currentRecipe?.totals?.totalGST || 0).toFixed(2)}</strong>
                  </Box>
                </Box>

                <Typography className="recipe-view-profit-formula">
                  Profit = Selling Cost - RMC - Consumables - Wastage - Others - GST
                </Typography>

                <Box className="recipe-view-profit-results">
                  <Box className="recipe-view-profit-result">
                    <span>Profit Value</span>
                    <strong
                      className={(currentRecipe?.profit?.profit || 0) < 0 ? "is-negative" : "is-positive"}
                    >
                      {(currentRecipe?.profit?.profit || 0).toFixed(2)}
                    </strong>
                  </Box>
                  <Box className="recipe-view-profit-result">
                    <span>Profit %</span>
                    <strong
                      className={
                        (currentRecipe?.profit?.profitPercentage || 0) < 0
                          ? "is-negative"
                          : "is-positive"
                      }
                    >
                      {(currentRecipe?.profit?.profitPercentage || 0).toFixed(2)}%
                    </strong>
                  </Box>
                </Box>
              </section>
            </Box>
          )}
        </DialogContent>
      </Dialog>


      {/* === IMPORT DIALOGS === */}
      <Dialog
        open={importDialogOpen}
        onClose={handleCloseImportDialog}
        PaperProps={{
          className: "dialog-paper"
        }}
      >
        <DialogTitle className="dialog-title">Import Options</DialogTitle>
        <DialogContent className="dialog-content">
          <Typography>Select an option for importing recipes</Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => { handleDownloadSampleCSV(); handleCloseImportDialog(); }}>
              Download Template
            </button>
            <button className="btn-primary" onClick={() => { fileInputRef.current?.click(); handleCloseImportDialog(); }}>
              Upload File
            </button>
          </Box>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <button className="btn-secondary" onClick={handleCloseImportDialog} color="primary">
            Cancel
          </button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={importResultDialogOpen}
        onClose={handleCloseImportResultDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: "dialog-paper"
        }}
      >
        <DialogTitle className="dialog-title">CSV Import Results</DialogTitle>
        <DialogContent className="dialog-content">
          {importResults.successful.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle1" sx={{ color: 'green' }} gutterBottom>Successfully Imported</Typography>
              <Typography variant="body2">Recipe Data Imported Successfully</Typography>
            </Box>
          )}
          {importResults.failed.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle1" color="error" gutterBottom>Missing Required Fields or Errors</Typography>
              <table className="custom-tables">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {importResults.failed.map((error, idx) => (
                    <tr key={idx} style={{ backgroundColor: '#ffe6e6' }}>
                      <td>{error.row}</td>
                      <td>
                        {error.error}
                        {error.missingFields?.length > 0 && ` (Missing: ${error.missingFields.join(', ')})`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
          {importResults.successful.length === 0 && importResults.failed.length === 0 && (
            <Typography>No issues found during import.</Typography>
          )}
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={handleCloseImportResultDialog} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        onClose={handleConfirmationDialogClose}
        onConfirm={handleConfirmationDialogConfirm}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => dispatch(setSnackbarOpen(false))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => dispatch(setSnackbarOpen(false))}
          severity="info"
          sx={{ width: '100%', backgroundColor: '#1976d2', color: 'white' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>


      {/* === PRINT / PDF EXPORT DIALOG === */}
      <Dialog
        open={printDialogOpen}
        onClose={() => !exportingPDF && setPrintDialogOpen(false)}
        fullWidth
        PaperProps={{ className: "dialog-paper-small" }}
      >
        <DialogTitle className="dialog-title" sx={{ textAlign: "center" }}>
          🖨️ Export as PDF
        </DialogTitle>

        <DialogContent className="dialog-content">
          <p style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', marginBottom: '12px' }}>
            {`Item Name : ${selectedPrintRecipe?.createRecipe?.itemName || "Recipe"}`}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

            <button
              className="btn-primary"
              disabled={exportingType !== null}
              onClick={() => handlePrintExport(true, false, 'recipe')}
              style={{ width: '100%' }}
            >
              {exportingType === 'recipe' ? <CircularProgress size={14} color="inherit" /> : <PrintIcon />}
              {exportingType === 'recipe' ? ' Exporting...' : ' Recipe Print'}
            </button>

            <button
              className="btn-primary"
              disabled={exportingType !== null}
              onClick={() => handlePrintExport(false, true, 'costing')}
              style={{ width: '100%', background: 'linear-gradient(to right, #16a34a, #15803d)' }}
            >
              {exportingType === 'costing' ? <CircularProgress size={14} color="inherit" /> : <PrintIcon />}
              {exportingType === 'costing' ? ' Exporting...' : ' Costing Print'}
            </button>

            <button
              className="btn-secondary"
              disabled={exportingType !== null}
              onClick={() => handlePrintExport(true, true, 'full')}
              style={{ width: '100%' }}
            >
              {exportingType === 'full' ? <CircularProgress size={14} color="inherit" /> : <PrintIcon />}
              {exportingType === 'full' ? ' Exporting...' : ' Full Print (Both)'}
            </button>

          </div>
        </DialogContent>

        <DialogActions className="dialog-actions">
          <button className="btn-secondary" onClick={() => setPrintDialogOpen(false)} disabled={exportingPDF}>
            Cancel
          </button>
        </DialogActions>
      </Dialog>


      {/* Per Gram Breakdown Dialog */}
      <Dialog
        open={breakdownPopup.open}
        onClose={() => setBreakdownPopup({ open: false, data: null, loading: false })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ className: "dialog-paper" }}
      >
        <DialogTitle className="dialog-title" sx={{ textAlign: 'center' }}>
          Per Gram Cost Breakdown
        </DialogTitle>

        <DialogContent className="dialog-content">
          {breakdownPopup.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : breakdownPopup.data ? (
            <Box>
              <table className="custom-tables" style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600, fontSize: '0.75rem', paddingRight: '12px', color: '#555' }}>Item Name</td>
                    <td style={{ fontSize: '0.75rem' }}>{breakdownPopup.data.itemName}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, fontSize: '0.75rem', paddingRight: '12px', color: '#555' }}>Value in Name</td>
                    <td style={{ fontSize: '0.75rem' }}>{breakdownPopup.data.valueInName}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, fontSize: '0.75rem', paddingRight: '12px', color: '#555' }}>Total Grams</td>
                    <td style={{ fontSize: '0.75rem' }}>{breakdownPopup.data.gramFormula}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, fontSize: '0.75rem', paddingRight: '12px', color: '#555' }}>Total Cost</td>
                    <td style={{ fontSize: '0.75rem' }}>₹ {breakdownPopup.data.totalCost}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#f0fdf4' }}>
                    <td style={{ fontWeight: 700, fontSize: '0.75rem', paddingRight: '12px', color: '#16a34a' }}>Per Gram Cost</td>
                    <td style={{ fontWeight: 700, fontSize: '0.75rem', color: '#16a34a' }}>₹ {breakdownPopup.data.perGramCost}</td>
                  </tr>
                </tbody>
              </table>

              {/* Formula line */}
              <Box sx={{ mt: 1.5, p: 1, backgroundColor: '#EFF6FF', borderRadius: '4px', textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#1976d2', fontWeight: 600 }}>
                  ₹{breakdownPopup.data.totalCost} ÷ {breakdownPopup.data.totalGrams}g = ₹{breakdownPopup.data.perGramCost}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography sx={{ fontSize: '0.75rem', color: 'red', textAlign: 'center', py: 2 }}>
              Failed to load breakdown. Check if randomId exists for this ingredient.
            </Typography>
          )}
        </DialogContent>

        <DialogActions className="dialog-actions">
          <button
            className="btn-secondary"
            onClick={() => setBreakdownPopup({ open: false, data: null, loading: false })}
          >
            Close
          </button>
        </DialogActions>
      </Dialog>


      {/* === ✅ VARIANCE NOTIFICATION DIALOG === */}
      <Dialog
        open={notificationDialogOpen}
        onClose={handleCloseNotifications}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: "dialog-paper",
        }}
      >
        <DialogTitle className="dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Left: Title + Badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon sx={{ color: 'warning.main', fontSize: '1.5rem' }} />
              <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Price Variance Alerts
              </Typography>
              {variance.unreadCount > 0 && (
                <Badge badgeContent={variance.unreadCount} color="error" sx={{ ml: 1 }} />
              )}
            </Box>

            {/* ✅ Center: Search Box */}
            {/* <Box sx={{ position: "relative", width: "280px" }}>
              <SearchIcon
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "10px",
                  transform: "translateY(-50%)",
                  color: "text.secondary",
                  fontSize: "1rem",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Search all alerts..."
                value={notificationSearchQuery}
                onChange={(e) => setNotificationSearchQuery(e.target.value)}
                style={{
                  padding: '6px 10px 6px 38px',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  fontFamily: 'Poppins, sans-serif',
                  width: '100%',
                }}
              />
            </Box> */}

            {/* ✅ Right: Refresh + Close buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={async () => {
                  setNotificationSearchQuery('');
                  setNotificationsLoading(true);
                  try {
                    // ✅ Load ALL pages to get complete dataset
                    await dispatch(fetchVarianceAllNotifications({ page: 1, limit: 50 })).unwrap();
                  } catch (error) {
                    console.error('Failed to refresh notifications:', error);
                  } finally {
                    setNotificationsLoading(false);
                  }
                }}
                disabled={varianceLoading || notificationsLoading}
                startIcon={<RefreshIcon sx={{ fontSize: '0.9rem' }} />}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  '& .MuiButton-startIcon': { mr: 0.5 },
                  minWidth: '80px',
                }}
              >
                Refresh
              </Button>

              <IconButton
                onClick={handleCloseNotifications}
                size="small"
                sx={{
                  ml: 0.5,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  }
                }}
              >
                ×
              </IconButton>
            </Box>
          </Box>

          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
            Recipes with ingredient price changes (sorted by highest variance)
          </Typography>
        </DialogTitle>

        <DialogContent className="dialog-content" dividers>
          {(notificationsLoading || varianceLoading) && variance.notifications.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress size={30} />
              <Typography sx={{ ml: 2, fontSize: '0.85rem' }}>Loading alerts...</Typography>
            </Box>
          ) : !variance.notifications || variance.notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <NotificationsIcon sx={{ fontSize: '48px', color: 'grey.300', mb: 1 }} />
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 0.5 }}>
                No Price Variance Alerts
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
                All recipe costs match current purchase prices
              </Typography>
            </Box>
          ) : (
            <>
              {/* ✅ Scrollable table with infinite scroll */}
              <div
                className="table-containers"
                style={{
                  maxHeight: '350px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                }}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;

                  // ✅ Only trigger load more if no search query and more pages available
                  if (
                    !notificationSearchQuery &&
                    nearBottom &&
                    variance.hasNextPage &&
                    !varianceLoading &&
                    !notificationsLoading
                  ) {
                    const nextPage = (variance.currentPage || 1) + 1;
                    dispatch(fetchVarianceAllNotifications({ page: nextPage, limit: 50 }));
                  }
                }}
              >
                <table className="custom-tables" style={{ width: '100%' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th align="center" style={{ width: '50px' }}>S.NO</th>
                      <th align="left">Kit Type</th>
                      <th align="left">Recipe / Kit Name</th>
                      <th align="right" style={{ width: '120px' }}>Variance %</th>
                      <th align="center" style={{ width: '80px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // ✅ Filter notifications based on search query (searches ALL loaded data)
                      const filteredNotifications = notificationSearchQuery.trim()
                        ? variance.notifications.filter((notification) => {
                          const query = notificationSearchQuery.toLowerCase();
                          const itemName = (notification.itemName || '').toLowerCase();
                          const itemType = (notification.itemType || '').toLowerCase();
                          const recipeId = (notification.recipeId || '').toLowerCase();

                          return itemName.includes(query) ||
                            itemType.includes(query) ||
                            recipeId.includes(query);
                        })
                        : variance.notifications;

                      if (filteredNotifications.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} align="center" style={{ padding: '20px' }}>
                              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                {notificationSearchQuery
                                  ? `No results found for "${notificationSearchQuery}"`
                                  : 'No notifications available'
                                }
                              </Typography>
                            </td>
                          </tr>
                        );
                      }

                      return filteredNotifications.map((notification, filteredIndex) => {
                        // ✅ Find the ORIGINAL index in the full unfiltered array for proper S.NO
                        const originalIndex = variance.notifications.findIndex(
                          (n) => n.recipeId === notification.recipeId &&
                            n.itemName === notification.itemName
                        );

                        // ✅ Use original index + 1 for continuous numbering (1, 2, 3... 51, 52, 53...)
                        const displayNumber = notificationSearchQuery.trim()
                          ? filteredIndex + 1  // For search results, show 1, 2, 3...
                          : originalIndex + 1;  // For all data, show actual position

                        const varianceValue = notification.variancePercent || 0;
                        const isPositive = varianceValue > 0;
                        const isHighVariance = Math.abs(varianceValue) > 10;

                        return (
                          <tr
                            key={`${notification.recipeId}-${originalIndex}`}
                            style={{
                              backgroundColor: isHighVariance
                                ? (isPositive ? '#ffffffff' : '#ffffffff')
                                : 'inherit',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s ease',
                            }}
                            onClick={() => {
                              handleCloseNotifications();
                              if (notification.recipeId) {
                                router.push(`/yen-recipie/RecipeManagement/Pages?recipeId=${notification.recipeId}`);
                              } else {
                                console.warn(`No recipeId for notification: ${notification.itemName}`);
                                const matchedRecipe = recipes.find(
                                  (r) =>
                                    r.createRecipe?.itemName === notification.itemName ||
                                    r.RECIPEID === notification.itemName
                                );
                                if (matchedRecipe) {
                                  router.push(`/yen-recipie/RecipeManagement/Pages?recipeId=${matchedRecipe.recipeId}`);
                                } else {
                                  dispatch(setSearchQuery(notification.itemName));
                                  dispatch(fetchRecipe({ search: notification.itemName, page: 1, limit: 20 }));
                                  dispatch(setSnackbarMessage(`Searching for "${notification.itemName}"...`));
                                  dispatch(setSnackbarOpen(true));
                                }
                              }
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                                isHighVariance ? (isPositive ? '#ffffffff' : '#f1f1f1ff') : '#ffffffff';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                                isHighVariance ? (isPositive ? '#ffffffff' : '#ffffffff') : 'inherit';
                            }}
                          >
                            {/* ✅ S.NO Column - Shows continuous numbering across pages */}
                            <td align="center" style={{ fontSize: '0.8rem' }}>
                              {displayNumber}
                            </td>

                            {/* ✅ KIT TYPE COLUMN */}
                            <td align="center">
                              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.8 }}>
                                <Chip
                                  label={notification.itemType || 'N/A'}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    fontFamily: "'Poppins', sans-serif",
                                    height: '24px',
                                    backgroundColor:
                                      notification.itemType === 'KIT' ? '#e3f2fd' :
                                        notification.itemType === 'SUBKIT' ? '#f3e5f5' :
                                          notification.itemType === 'RAW_MATERIAL' ? '#e8f5e9' :
                                            '#f5f5f5',
                                    color:
                                      notification.itemType === 'KIT' ? '#1565c0' :
                                        notification.itemType === 'SUBKIT' ? '#6a1b9a' :
                                          notification.itemType === 'RAW_MATERIAL' ? '#2e7d32' :
                                            '#616161',
                                    border: '1px solid',
                                    borderColor:
                                      notification.itemType === 'KIT' ? '#90caf9' :
                                        notification.itemType === 'SUBKIT' ? '#ce93d8' :
                                          notification.itemType === 'RAW_MATERIAL' ? '#a5d6a7' :
                                            '#e0e0e0',
                                    '& .MuiChip-label': {
                                      px: 1,
                                    },
                                  }}
                                />
                              </Box>
                            </td>

                            {/* ✅ RECIPE / KIT NAME COLUMN */}
                            <td align="left">
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography sx={{
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    fontFamily: "'Poppins', sans-serif",
                                    color: 'text.primary'
                                  }}>
                                    {notification.itemName || 'Unknown Recipe'}
                                  </Typography>
                                  <Typography
                                    sx={{ fontSize: '0.65rem', color: '#9e9e9e' }}
                                    title={`RECIPEID: ${notification.recipeId || 'N/A'}`}
                                  >
                                    →
                                  </Typography>
                                </Box>

                                <Typography sx={{
                                  fontSize: '0.65rem',
                                  color: '#bdbdbd',
                                  fontFamily: "'Poppins', sans-serif",
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}>
                                  <span style={{ opacity: 0.6 }}>📋</span>
                                  • Click to open recipe
                                </Typography>
                              </Box>
                            </td>

                            {/* ✅ VARIANCE % COLUMN */}
                            <td align="right">
                              <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: 0.5,
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                color: isPositive
                                  ? (isHighVariance ? 'error.main' : 'warning.main')
                                  : (isHighVariance ? 'success.dark' : 'success.main'),
                                fontFamily: 'monospace',
                              }}>
                                {isPositive
                                  ? <TrendingUpIcon sx={{ fontSize: '1rem' }} />
                                  : <TrendingDownIcon sx={{ fontSize: '1rem' }} />
                                }
                                {Math.abs(varianceValue).toFixed(2)}%
                              </Box>
                            </td>

                            {/* ✅ STATUS COLUMN */}
                            <td align="center">
                              <Box sx={{
                                px: 1.5, py: 0.5,
                                borderRadius: '12px',
                                bgcolor: isHighVariance
                                  ? (isPositive ? '#ffebee' : '#e8f5e9')
                                  : 'action.selectedBackground',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                color: isHighVariance
                                  ? (isPositive ? '#c62828' : '#2e7d32')
                                  : 'text.secondary',
                                letterSpacing: 0.5,
                                border: '1px solid',
                                borderColor: isHighVariance
                                  ? (isPositive ? '#ffcdd2' : '#a5d6a7')
                                  : 'transparent',
                              }}>
                                {isHighVariance ? '⚠️ Critical' : '✓ Minor'}
                              </Box>
                            </td>
                          </tr>
                        );
                      });
                    })()}

                    {/* ✅ Loading spinner row when fetching next page */}
                    {(varianceLoading || notificationsLoading) &&
                      variance.notifications.length > 0 &&
                      !notificationSearchQuery && (
                        <tr>
                          <td colSpan={5} align="center" style={{ padding: '12px' }}>
                            <CircularProgress size={18} />
                            <Typography sx={{ fontSize: '0.75rem', ml: 1, display: 'inline' }}>
                              Loading more...
                            </Typography>
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>

              {/* ✅ Show total count */}
              {!notificationSearchQuery && variance.notifications.length > 0 && (
                <Box sx={{
                  mt: 1,
                  textAlign: 'center',
                  fontSize: '0.7rem',
                  color: 'text.secondary'
                }}>
                  Showing {variance.notifications.length} of {variance.totalCount || variance.notifications.length} alerts
                  {variance.hasNextPage && ' • Scroll down to load more'}
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions className="dialog-actions" sx={{ justifyContent: 'space-between', px: 3 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
            Auto-updates every 45 seconds (test mode)
          </Typography>
          <button className="btn-secondary" onClick={handleCloseNotifications}>
            Close
          </button>
        </DialogActions>
      </Dialog>



      {/* === ALL RECIPES PDF EXPORT DIALOG === */}
      <Dialog
        open={allPDFDialogOpen}
        onClose={() => !isExportingAllPDF && setAllPDFDialogOpen(false)}
        fullWidth
        PaperProps={{ className: "dialog-paper-small" }}
      >
        <DialogTitle className="dialog-title" sx={{ textAlign: "center" }}>
          🖨️ Generate Kit Book
        </DialogTitle>

        <DialogContent className="dialog-content">
          <p style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', marginBottom: '12px' }}>
            Export all recipes as a single PDF (one recipe per page)
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn-primary"
              disabled={exportingAllPDFType !== null}
              onClick={() => handleExportAllPDF(true, false, 'recipe')}
              style={{ width: '100%' }}
            >
              {exportingAllPDFType === 'recipe' ? <CircularProgress size={14} color="inherit" /> : <PrintIcon />}
              {exportingAllPDFType === 'recipe' ? ' Exporting...' : ' Recipe Print'}
            </button>

            {/* <button
              className="btn-primary"
              disabled={exportingAllPDFType !== null}
              onClick={() => handleExportAllPDF(false, true, 'costing')}
              style={{ width: '100%', background: 'linear-gradient(to right, #16a34a, #15803d)' }}
            >
              {exportingAllPDFType === 'costing' ? <CircularProgress size={14} color="inherit" /> : <PrintIcon />}
              {exportingAllPDFType === 'costing' ? ' Exporting...' : ' Costing Print'}
            </button> */}
            {/* 
            <button
              className="btn-secondary"
              disabled={exportingAllPDFType !== null}
              onClick={() => handleExportAllPDF(true, true, 'full')}
              style={{ width: '100%' }}
            >
              {exportingAllPDFType === 'full' ? <CircularProgress size={14} color="inherit" /> : <PrintIcon />}
              {exportingAllPDFType === 'full' ? ' Exporting...' : ' Full Print (Both)'}
            </button> */}
          </div>
        </DialogContent>

        <DialogActions className="dialog-actions">
          <button
            className="btn-secondary"
            onClick={() => setAllPDFDialogOpen(false)}
            disabled={isExportingAllPDF}
          >
            Cancel
          </button>
        </DialogActions>
      </Dialog>





    </Box>
  );
};

export default RecipeManagementPage;