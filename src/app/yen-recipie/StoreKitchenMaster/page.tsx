


"use client"
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  LibraryBooks as PrintAllIcon,
  Description as DescriptionIcon,
  ReceiptLong as ReceiptLongIcon,
  ChevronLeft,
  ChevronRight,
  GridOn as GridOnIcon,
  Upload as UploadIcon,
  TableChart as TableChartIcon,
} from "@mui/icons-material";
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

// import Navbar from "../Components/NavBar";
// import SideMenu from "../Components/SideMenu";
import { setSelectedItem, SelectedRecipeItem } from "./Slicefiles/storekitchenmaster";
import {
  fetchRecipes,
  resetPagination,
  fetchRecipeFullDetails,
  clearViewDetail,
  downloadRecipePdf,
  downloadAllRecipesPdf,
  downloadRecipeExcel,
  downloadAllRecipesExcel,
  clearPdfExportError,
  clearExcelExportError,
  ExportTarget,
} from "./Slicefiles/recipeassignSlice";
import { setRecipeId } from "./edit/versionhistory/features/viewrecipehistory";
import { clearNewRecipeDraft } from "../StoreKitchenMaster/newRecipe/Features/newrecipeSlice";
import CustomKeyboard from "./newRecipe/components/CustomKeyboard";
import { useCustomKeyboard } from "./newRecipe/hooks/useCustomKeyboard";
import RecipeDetailsModal from "./reciepviewicon"

export default function StoreKitchenMaster() {
  const [searchText, setSearchText] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useDispatch<AppDispatch>()
  const keyboard = useCustomKeyboard()
  const {
    items, loading, error, currentPage, totalPages,
    viewDetail, viewLoading, viewError,
    pdfExportLoading, pdfExportError,       // ✅ NEW: from slice
    excelExportLoading, excelExportError,   // ✅ NEW: from slice
  } = useSelector((state: RootState) => state.recipes)

  const [modalOpen, setModalOpen] = useState(false)

  // print popup — UI-only state now; API call itself lives in the slice
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printTarget, setPrintTarget] = useState<ExportTarget | null>(null)

  // Excel popup — UI-only state now; API call itself lives in the slice
  const [excelModalOpen, setExcelModalOpen] = useState(false)
  const [excelTarget, setExcelTarget] = useState<ExportTarget | null>(null)

  const handleLogout = () => {
    router.push('/');
  };

  const handleMenuClick = useCallback((menuItem: { path: string }) => {
    router.push(menuItem.path);
  }, [router]);

  const handleEdit = (recipe: SelectedRecipeItem, e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(setSelectedItem(recipe))
    dispatch(setRecipeId(recipe.recipeId))
   router.push(`/yen-recipie/StoreKitchenMaster/edit?recipeId=${recipe.recipeId}`)
  }

  const handleView = (recipe: SelectedRecipeItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setModalOpen(true)
    dispatch(fetchRecipeFullDetails({ recipeId: recipe.recipeId, version: recipe.version }))
  }

  const handleCloseView = () => {
    setModalOpen(false)
    dispatch(clearViewDetail())
  }

  // Print icon on a row -> open popup scoped to that recipe+version
  const handlePrint = (recipe: SelectedRecipeItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setPrintTarget({ recipeId: recipe.recipeId, version: recipe.version })
    dispatch(clearPdfExportError())
    setPrintModalOpen(true)
  }

  // "Print All" button -> open popup scoped to ALL recipes
  const handlePrintAll = () => {
    setPrintTarget("ALL")
    dispatch(clearPdfExportError())
    setPrintModalOpen(true)
  }

  const closePrintModal = () => {
    if (pdfExportLoading) return
    setPrintModalOpen(false)
    setPrintTarget(null)
  }


    // ✅ dispatches the slice thunk instead of calling axios directly
  const handleDownloadPdf = (includeCost: boolean) => {
    if (!printTarget) return
    const action = printTarget === "ALL"
      ? downloadAllRecipesPdf({ includeCost })
      : downloadRecipePdf({ recipeId: printTarget.recipeId, version: printTarget.version, includeCost })

    dispatch(action).then((result) => {
      if (result.meta?.requestStatus === "fulfilled") {
        setPrintModalOpen(false)
        setPrintTarget(null)
      }
    })
  }


  // Excel icon on a row -> open Excel popup scoped to that recipe+version
  const handleExcelExport = (recipe: SelectedRecipeItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setExcelTarget({ recipeId: recipe.recipeId, version: recipe.version })
    dispatch(clearExcelExportError())
    setExcelModalOpen(true)
  }

  // "Export All" button -> open Excel popup scoped to ALL recipes
  const handleExportAllExcel = () => {
    setExcelTarget("ALL")
    dispatch(clearExcelExportError())
    setExcelModalOpen(true)
  }

  const closeExcelModal = () => {
    if (excelExportLoading) return
    setExcelModalOpen(false)
    setExcelTarget(null)
  }

  // ✅ dispatches the slice thunk instead of calling axios directly
  const handleDownloadExcel = (includeCost: boolean) => {
    if (!excelTarget) return
    const action = excelTarget === "ALL"
      ? downloadAllRecipesExcel({ includeCost })
      : downloadRecipeExcel({ recipeId: excelTarget.recipeId, version: excelTarget.version, includeCost })

    dispatch(action).then((result) => {
      if (result.meta?.requestStatus === "fulfilled") {
        setExcelModalOpen(false)
        setExcelTarget(null)
      }
    })
  }



  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchText])

  useEffect(() => {
    dispatch(resetPagination())
    dispatch(fetchRecipes({ searchTerm: debouncedSearch, page: 1, pageSize: 20 }))
  }, [dispatch, debouncedSearch])

  const handleNextPage = () => {
    if (currentPage >= totalPages || loading) return
    dispatch(fetchRecipes({ searchTerm: debouncedSearch, page: currentPage + 1, pageSize: 20 }))
  }

  const handlePrevPage = () => {
    if (currentPage <= 1 || loading) return
    dispatch(fetchRecipes({ searchTerm: debouncedSearch, page: currentPage - 1, pageSize: 20 }))
  }

const StatusBadge = ({ status }: { status: boolean }) => (
  <span
    className={`purchase-master-status-pill ${
      status ? "is-active" : "is-inactive"
    }`}
  >
    {status ? "Active" : "Inactive"}
  </span>
);

  const isPrintAll = printTarget === "ALL"
  const isExcelAll = excelTarget === "ALL"

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* <Navbar moduleName="STORE KITCHEN MASTER" onLogout={handleLogout} /> */}

      <div className="flex flex-1 overflow-hidden">
        {/* <SideMenu onMenuClick={handleMenuClick} activePath={pathname || '/'} /> */}

        <div className="flex flex-col flex-1 overflow-hidden">
{/* Store Kitchen Master toolbar - YEN ERP style */}
<Box className="location-master-toolbar">

  {/* LEFT */}
  <Typography className="location-master-toolbar-title">
    Store Kitchen Master
  </Typography>

  {/* CENTER SEARCH */}
  <TextField
    type="search"
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    onFocus={(e) => {
      if (keyboard.isAndroid) {
        e.target.blur();
        keyboard.openKeyboard(
          "mainSearch",
          searchText,
          "text"
        );
      }
    }}
    placeholder="Search by recipe name..."
    className="purchase-reference-search location-master-search"
    inputProps={{
      readOnly: keyboard.isAndroid,
      "aria-label": "Search by recipe name",
    }}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon className="purchase-reference-search-icon" />
        </InputAdornment>
      ),
    }}
  />

  {/* RIGHT ACTIONS */}
  <Box className="purchase-reference-actions location-master-actions">

    <Button
      type="button"
      variant="outlined"
      startIcon={<UploadIcon />}
      onClick={handleExportAllExcel}
      className="purchase-reference-action-button"
    >
      Export All
    </Button>

    <Button
      type="button"
      variant="outlined"
      startIcon={<PictureAsPdfIcon />}
      onClick={handlePrintAll}
      className="purchase-reference-action-button"
    >
      PDF Print
    </Button>

    <Button
      type="button"
      variant="outlined"
      startIcon={<AddIcon />}
      onClick={() => {
        dispatch(clearNewRecipeDraft());
        router.push(
          "/yen-recipie/StoreKitchenMaster/newRecipe"
        );
      }}
      className="purchase-reference-action-button"
    >
      New Recipe
    </Button>

  </Box>
</Box>

<Box className="master-admin-table-area">
  <Box className="purchase-master-table-shell">
    <div className="purchase-native-table-wrapper">

      {loading ? (
        <div className="py-6 text-center text-gray-500 text-sm">
          Loading recipes...
        </div>
      ) : error ? (
        <div className="py-6 text-center text-red-600 text-sm">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="py-6 text-center text-gray-500 text-sm">
          No recipes found
        </div>
      ) : (
        <table className="purchase-native-table recipe-native-table">

          <thead>
            <tr>
              <th align="center">S.No</th>
              <th align="left">Recipe Name</th>
              <th align="center">Version</th>
              <th align="center">UOM</th>
              <th align="right">Cost</th>
              <th align="center">Status</th>
              <th align="center">Action</th>
            </tr>
          </thead>

          <tbody>
            {items.map((recipe, index) => (
              <tr key={`${recipe.recipeId}-${recipe.version}`}>

                <td align="center">
                  {(currentPage - 1) * 20 + index + 1}
                </td>

                <td align="left">
                  {recipe.recipeName}
                </td>

                <td align="center">
                  V{recipe.version}
                </td>

                <td align="center">
                  {recipe.uom || "—"}
                </td>

                <td align="right">
                  ₹{Number(recipe.cost).toFixed(2)}
                </td>

                <td align="center">
                  <StatusBadge status={recipe.status} />
                </td>

                <td align="center">
                  <Box className="purchase-master-actions">

                    <IconButton
                      type="button"
                      title={`Edit v${recipe.version}`}
                      onClick={(e) =>
                        handleEdit(recipe, e)
                      }
                      className="purchase-master-action-button is-edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      type="button"
                      title="View details"
                      onClick={(e) =>
                        handleView(recipe, e)
                      }
                      className="purchase-master-action-button is-view"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      type="button"
                      title="Print / Export PDF"
                      onClick={(e) =>
                        handlePrint(recipe, e)
                      }
                      className="purchase-master-action-button is-print"
                    >
                      <PrintIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      type="button"
                      title="Export Excel"
                      onClick={(e) =>
                        handleExcelExport(recipe, e)
                      }
                      className="purchase-master-action-button is-export"
                    >
                      <UploadIcon fontSize="small" />
                    </IconButton>

                  </Box>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      )}

    </div>
  </Box>
</Box>

          {!loading && !error && items.length > 0 && (
<Box
  className="master-admin-pagination"
  sx={{ gap: 2 }}
>
                <IconButton size="small" onClick={handlePrevPage} disabled={currentPage <= 1 || loading}>
                <ChevronLeft />
              </IconButton>
              <Typography sx={{ fontSize: '0.85rem' }}>
                Page {currentPage} of {totalPages}
              </Typography>
              <IconButton size="small" onClick={handleNextPage} disabled={currentPage >= totalPages || loading}>
                <ChevronRight />
              </IconButton>
            </Box>
          )}

          {keyboard.isAndroid && (
            <CustomKeyboard
              isOpen={keyboard.isKeyboardOpen}
              onClose={keyboard.closeKeyboard}
              onKeyPress={keyboard.handleKeyPress}
              onDelete={keyboard.handleDelete}
              onClear={keyboard.handleClear}
              value={keyboard.inputValue}
              type="text"
            />
          )}
        </div>
      </div>

      <RecipeDetailsModal
        open={modalOpen}
        recipe={viewDetail}
        loading={viewLoading}
        error={viewError}
        onClose={handleCloseView}
      />

      {/* two-option PDF popup — dispatches slice thunks now */}
      <Dialog open={printModalOpen} onClose={closePrintModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
          {isPrintAll ? "Choose Print Option — All Recipes" : "Choose Print Option"}
        </DialogTitle>
        <DialogContent>
          {pdfExportError && (
            <Typography color="error" sx={{ mb: 2, fontSize: "0.8rem" }}>
              {pdfExportError}
            </Typography>
          )}

          <Box display="flex" flexDirection="column" gap={2} py={1}>
            <Button
              variant="outlined"
              startIcon={<DescriptionIcon />}
              onClick={() => handleDownloadPdf(false)}
              disabled={pdfExportLoading}
              sx={{ justifyContent: "flex-start", textTransform: "none", py: 1.5 }}
            >
              <Box textAlign="left">
                <Typography sx={{ fontWeight: 600, fontSize: "0.88rem" }}>
                  {isPrintAll ? "All Recipes & Items Only" : "Recipe & Items Only"}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                  {isPrintAll
                    ? "Every recipe's latest version — no pricing shown"
                    : "Recipe name and used items — no pricing shown"}
                </Typography>
              </Box>
            </Button>

            <Button
              variant="outlined"
              startIcon={<ReceiptLongIcon />}
              onClick={() => handleDownloadPdf(true)}
              disabled={pdfExportLoading}
              sx={{ justifyContent: "flex-start", textTransform: "none", py: 1.5 }}
            >
              <Box textAlign="left">
                <Typography sx={{ fontWeight: 600, fontSize: "0.88rem" }}>
                  {isPrintAll ? "All Recipes — Full Details with Cost" : "Full Details with Cost"}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                  {isPrintAll
                    ? "Every recipe, used items, unit price & total cost"
                    : "Recipe, used items, unit price & total cost"}
                </Typography>
              </Box>
            </Button>
          </Box>

          {pdfExportLoading && (
            <Box display="flex" justifyContent="center" alignItems="center" gap={1} mt={2}>
              <CircularProgress size={20} />
              <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                {isPrintAll ? "Generating PDF for all recipes…" : "Generating PDF…"}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePrintModal} disabled={pdfExportLoading}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* two-option Excel popup — dispatches slice thunks now */}
      <Dialog open={excelModalOpen} onClose={closeExcelModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
          {isExcelAll ? "Choose Excel Export Option — All Recipes" : "Choose Excel Export Option"}
        </DialogTitle>
        <DialogContent>
          {excelExportError && (
            <Typography color="error" sx={{ mb: 2, fontSize: "0.8rem" }}>
              {excelExportError}
            </Typography>
          )}

          <Box display="flex" flexDirection="column" gap={2} py={1}>
            <Button
              variant="outlined"
              startIcon={<DescriptionIcon />}
              onClick={() => handleDownloadExcel(false)}
              disabled={excelExportLoading}
              sx={{ justifyContent: "flex-start", textTransform: "none", py: 1.5 }}
            >
              <Box textAlign="left">
                <Typography sx={{ fontWeight: 600, fontSize: "0.88rem" }}>
                  {isExcelAll ? "All Recipes & Items Only" : "Recipe & Items Only"}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                  {isExcelAll
                    ? "Every recipe's latest version — no pricing shown"
                    : "Recipe name and used items — no pricing shown"}
                </Typography>
              </Box>
            </Button>

            <Button
              variant="outlined"
              startIcon={<ReceiptLongIcon />}
              onClick={() => handleDownloadExcel(true)}
              disabled={excelExportLoading}
              sx={{ justifyContent: "flex-start", textTransform: "none", py: 1.5 }}
            >
              <Box textAlign="left">
                <Typography sx={{ fontWeight: 600, fontSize: "0.88rem" }}>
                  {isExcelAll ? "All Recipes — Full Details with Cost" : "Full Details with Cost"}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                  {isExcelAll
                    ? "Every recipe, used items, unit price & total cost"
                    : "Recipe, used items, unit price & total cost"}
                </Typography>
              </Box>
            </Button>
          </Box>

          {excelExportLoading && (
            <Box display="flex" justifyContent="center" alignItems="center" gap={1} mt={2}>
              <CircularProgress size={20} />
              <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                {isExcelAll ? "Generating Excel for all recipes…" : "Generating Excel…"}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeExcelModal} disabled={excelExportLoading}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}