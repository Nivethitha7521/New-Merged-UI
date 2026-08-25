"use client";

import { useEffect, useCallback, useState } from "react"; // ✅ added useState
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { RootState, AppDispatch } from "@/redux/store";
import { IconButton, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

import styles from "../../skm.module.css";
import VersionList from "./modules/Versionlist ";
import VersionDetailsPanel from "./modules/Versiondetailspanel ·";

// import Navbar from "../../../Components/NavBar";
// import SideMenu from "../../../Components/SideMenu";

import {
  getVersions,
  getVersionDetail,
  setRecipeId,
} from "./features/viewrecipehistory";
import { VersionSummary, VersionDetail, RecipeItem } from "./models/versionhistortmodel";
import {
//  selectEditRecipe,
  toggleRecipeVersionStatus,
  fetchRecipeById,
} from "../editing/features/editRecipeSlice";
import { setNewRecipeDraft, clearNewRecipeDraft } from "./features/newrecipeslice";
import { fetchLatestVersion, fetchRecipeFullDetails } from "./features/recipeApi"; 
import RecipeDetailsModal from "../../reciepviewicon"; 

export default function VersionHistoryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();

  const searchParams = useSearchParams();
  const recipeIdFromUrl = (searchParams?.get("recipeId") ?? "") as string;

  const { recipeId, versions, selectedVersion } = useSelector(
    (state: RootState) => state.recipehistory
  ) as {
    recipeId: string;
    versions: VersionSummary[];
    selectedVersion: VersionDetail | null;
  };

  // ✅ added — state for the "view full details" popup
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewRecipe, setViewRecipe] = useState<VersionDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  const handleLogout = () => {
    router.push('/');
  };

  const handleMenuClick = useCallback((menuItem: { path: string }) => {
    router.push(menuItem.path);
  }, [router]);

  useEffect(() => {
    if (!selectedVersion || versions.length === 0) return;
    const updated = versions.find((v) => v.version === selectedVersion.version);
    if (updated && updated.status !== selectedVersion.status) {
      dispatch(getVersionDetail({ recipeId, version: selectedVersion.version }));
    }
  }, [versions, selectedVersion, recipeId, dispatch]);

  useEffect(() => {
    if (recipeIdFromUrl) dispatch(setRecipeId(recipeIdFromUrl));
  }, [dispatch, recipeIdFromUrl]);

  useEffect(() => {
    if (recipeId) dispatch(getVersions(recipeId));
  }, [dispatch, recipeId]);

  useEffect(() => {
    if (versions.length > 0 && !selectedVersion) {
      const active = versions.find((v) => v.status) ?? versions[versions.length - 1];
      dispatch(getVersionDetail({ recipeId, version: active.version }));
    //  dispatch(fetchRecipeById({ recipeId, version: active.version }));
    }
  }, [versions, dispatch, recipeId, selectedVersion]);

  const handleBackToVersionHistory = () => router.push("/yen-recipie/StoreKitchenMaster");

  const handleSelectVersion = (version: number) => {
    dispatch(getVersionDetail({ recipeId, version }));
 //   dispatch(fetchRecipeById({ recipeId, version }));
  };

  const handleToggleStatus = (version: number, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleRecipeVersionStatus({ recipeId: recipeId!, version }))
      .unwrap()
      .then(() => dispatch(getVersions(recipeId!)))
      .catch(() => { });
  };

  const handleAddNewVersion = async () => {
    if (!recipeId) return;

    try {
      const res = await fetchLatestVersion(recipeId);
      const latest = res.data;

      dispatch(clearNewRecipeDraft());

      const normalizedItems = latest.items
        .filter((item: RecipeItem) => item.type === "RM" || item.type === "SFG")
        .map((item: RecipeItem) => ({
          id: item.id,
          name: item.name,
          code: item.randomId || item.code,
          uom: item.uom,
          type: item.type,
          category: item.category ?? undefined,
          randomId: item.randomId ?? undefined,
          quantity:
            item.isGramBased && item.quantityInGrams != null
              ? item.quantityInGrams
              : item.quantity ?? 0,
          unitPrice: item.unitPrice ?? undefined,
          totalPrice: item.totalPrice ?? undefined,
          takeAway: item.takeAway ?? undefined,
          dineIn: item.dineIn ?? undefined,
          isGramBased: item.isGramBased ?? undefined,
          quantityInGrams: item.quantityInGrams ?? undefined,
          totalKgForPrice: item.totalKgForPrice ?? undefined,
        }));

      dispatch(
        setNewRecipeDraft({
          recipeId,
          recipeName: latest.recipeName,
          items: normalizedItems,
          fromVersion: latest.version,
          totalItemsCost: latest.totalItemsCost,
          item_Defaultprice: latest.recipeMeta?.item_Defaultprice,
          cost: latest.cost,
        })
      );

      router.push(
       `/yen-recipie/StoreKitchenMaster/newRecipe?recipeId=${recipeId}&version=${latest.version}`
      );
    } catch (error) {
      console.error("Failed to fetch latest version:", error);
    }
  };

  // ✅ added — fetch full details for a version and open the popup
  const handleViewVersion = async (version: number) => {
    if (!recipeId) return;
    setViewModalOpen(true);
    setViewLoading(true);
    setViewError(null);
    setViewRecipe(null);
    try {
      const res = await fetchRecipeFullDetails(recipeId, version);
      setViewRecipe(res.data);
    } catch (error) {
      console.error("Failed to fetch recipe full details:", error);
      setViewError("Failed to load recipe details.");
    } finally {
      setViewLoading(false);
    }
  };

  // ✅ added — close the popup
  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setViewRecipe(null);
    setViewError(null);
  };

  const makingCost = selectedVersion?.totalItemsCost ?? 0;
  const salesCost = selectedVersion?.cost ?? 0;
  const profit = salesCost - makingCost;

  return (
  <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* <Navbar moduleName="VERSION HISTORY" onLogout={handleLogout} /> */}

      <div className="flex flex-1 overflow-hidden">
        {/* <SideMenu onMenuClick={handleMenuClick} activePath={pathname || '/'} /> */}

        <div
          className={styles.pageRoot}
          style={{ flex: 1, overflow: "hidden", height: "100%", padding: "0.5rem 1rem" }}
        >
          <div className={styles.container} style={{ gap: "0.35rem" }}>

            {/* Top bar: Back (left) + Add New Version (right, icon style) */}
            {/* Top bar: Back + Add New Version, both grouped on the right */}
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "1rem",
                paddingBottom: "0.15rem",
                marginTop: "-0.25rem",
              }}
            >
              <button onClick={handleBackToVersionHistory} className={styles.backBtn}>
                ← Back
              </button>

              <div className="icon-action-wrapper">
                <IconButton
                  color="primary"
                  onClick={handleAddNewVersion}
                  disabled={!selectedVersion}
                  className="icon-action-button"
                  title="Add New Version"
                  size="small"
                >
                  <AddIcon className="icon-action-svg" />
                </IconButton>
                <Typography className="icon-action-label">New Version</Typography>
              </div>
            </div>

            {/* Body */}
            <div className={styles.bodyGrid}>
              {/* Version Timeline */}
              <div className={styles.timelinePanel}>
                <h2 className={styles.panelTitle}>Version Timeline</h2>
                <div className={styles.timelineScroll}>
                  <VersionList
                    versions={versions}
                    selectedVersion={selectedVersion}
                    onSelectVersion={handleSelectVersion}
                    onToggleStatus={handleToggleStatus}
                    onViewVersion={handleViewVersion} // ✅ added
                  />
                </div>
              </div>

              {/* Version Details */}
              <div className={styles.detailsPanel}>
                <h3 className={styles.panelTitle}>Version Details</h3>
                <div className={styles.detailsInner}>
                  <VersionDetailsPanel
                    selectedVersion={selectedVersion}
                    makingCost={makingCost}
                    salesCost={salesCost}
                    profit={profit}
                  //visibleRows={6}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ✅ added — Recipe full details popup */}
      <RecipeDetailsModal
        open={viewModalOpen}
        recipe={viewRecipe}
        loading={viewLoading}
        error={viewError}
        onClose={handleCloseViewModal}
      />
    </div>
  );
}