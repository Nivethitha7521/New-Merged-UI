

/* --- SAME IMPORTS, DO NOT CHANGE --- */
"use client";
import { useEffect, useState } from "react";
import {
  Button,
  Box,
  Typography,
  Popover,
  Stack,
  CircularProgress,
} from "@mui/material";
import MasterAdminMenu from "../page";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import axios from "axios";
import { fetchDynamicData } from "../../master-admin/OnlinePartners/OnlinePartnerConfig/OnlinePartnerTemplate/Features/OnlineParnerTemplateSlice";
import OnlinePartnerTemplateComponent from "../OnlinePartners/OnlinePartnerConfig/OnlinePartnerTemplate/Modules/OnlinePartnerTemplateComponent";
import OnlinePartnerMasterComponent from "../OnlinePartners/OnlinePartnerMaster/page";
import { API_BASE_URL } from "../../../../API_URL";

/* --- SAME INTERFACE & CONSTANTS --- */

interface OnlinePartner {
  onlinePartnersId: string;
  partnerName: string;
  status: string;
}

const API_URL = `${API_BASE_URL}/OnlinePartner`;

const MenuPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dynamicItems, setDynamicItems] = useState<OnlinePartner[]>([]);
  const [activeView, setActiveView] = useState<"master" | "config" | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<OnlinePartner | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataRefreshTrigger] = useState(0);
  const [templateSelected, setTemplateSelected] = useState(false);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await axios.get(API_URL);
        const activePartners = response.data.filter(
          (partner: OnlinePartner) => partner.status === "active"
        );
        setDynamicItems(activePartners);
      } catch (error) {
        console.error("Failed to fetch partners:", error);
      }
    };
    fetchPartners();
  }, [dataRefreshTrigger]);

  /* --- SAME EVENT HANDLERS, NO CHANGES --- */

  const handleMasterClick = () => {
    setSelectedPartner(null);
    setTemplateSelected(false);
    setActiveView("master");
    setAnchorEl(null);
  };

  const handleConfigButtonMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleConfigButtonMouseLeave = () => {
    setTimeout(() => {
      if (!document.querySelector(".MuiPopover-root:hover")) {
        setAnchorEl(null);
      }
    }, 100);
  };

  const handlePartnerClick = async (partner: OnlinePartner) => {
    setLoading(true);
    try {
      await dispatch(
        fetchDynamicData({
          partnerName: partner.partnerName,
          search: "",
        })
      ).unwrap();

      setSelectedPartner(partner);
      setTemplateSelected(false);
      setActiveView("config");
    } catch (error) {
      console.error("Error fetching dynamic data:", error);
      setSelectedPartner(null);
      setActiveView(null);
    } finally {
      setLoading(false);
      setAnchorEl(null);
    }
  };

  const handleTemplateClick = () => {
    setSelectedPartner(null);
    setTemplateSelected(true);
    setActiveView("config");
    setAnchorEl(null);
  };

  const handlePopoverMouseLeave = () => {
    setAnchorEl(null);
  };

  const isMasterActive = activeView === "master";
  const isConfigActive = activeView === "config";

  const getConfigButtonText = () => {
    if (selectedPartner) {
      return (
        <Box component="span">
          OnlinePartner Config -{" "}
          <Box component="span" sx={{ fontWeight: "bold", display: "inline" }}>
            {selectedPartner.partnerName}
          </Box>
        </Box>
      );
    }
    if (templateSelected) {
      return (
        <Box component="span">
          OnlinePartner Config -{" "}
          <Box component="span" sx={{ fontWeight: "bold", display: "inline" }}>
            Template
          </Box>
        </Box>
      );
    }
    return "OnlinePartner Config";
  };

  return (
    <>
      {/* <MasterAdminMenu /> */}

     <Box className="online-partners-layout" sx={{ px: 3, pt: 2 }}>
        {/* Top Buttons */}
        <Box
          component="nav"
          className="online-partners-submodule-tabs"
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            mb: 4,
            mt: 0,
            ml: 2,
          }}
        >
          {/* Master Button (UPDATED STYLE) */}
          <Button
            variant="contained"
            onClick={handleMasterClick}
            className={`online-partners-submodule-tab ${isMasterActive ? "is-active" : ""}`}
            sx={{
              textTransform: "none",
              fontSize: "11px",
              fontWeight: isMasterActive ? "bold" : "normal",
              borderRadius: "5px",
              width: "100px",
              height: "40px",
              backgroundColor: isMasterActive ? "white" : "primary.main",
              color: isMasterActive ? "black" : "white",
              boxShadow: isMasterActive ? "0px 0px 10px rgba(0,0,0,0.15)" : "none",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: isMasterActive
                  ? "rgba(255,255,255,0.9)"
                  : "primary.dark",
              },
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            OnlinePartner Master
          </Button>

          {/* Config Button (UPDATED STYLE) */}
          <Button
            variant="contained"
            onMouseEnter={handleConfigButtonMouseEnter}
            className={`online-partners-submodule-tab online-partners-config-tab ${isConfigActive ? "is-active" : ""}`}
            onMouseLeave={handleConfigButtonMouseLeave}
            sx={{
              textTransform: "none",
              fontSize: "11px",
              fontWeight: isConfigActive ? "bold" : "normal",
              borderRadius: "5px",
              width: "150px",
              height: "40px",
              backgroundColor: isConfigActive ? "white" : "primary.main",
              color: isConfigActive ? "black" : "white",
              boxShadow: isConfigActive ? "0px 0px 10px rgba(0,0,0,0.15)" : "none",
              cursor: "pointer !important",
              "&:hover": {
                backgroundColor: isConfigActive
                  ? "rgba(255,255,255,0.9)"
                  : "primary.dark",
              },
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {getConfigButtonText()}
          </Button>

          {/* Popover */}
          <Popover
            open={Boolean(anchorEl)}
            className="online-partners-config-popover"
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            disableRestoreFocus
            PaperProps={{
              onMouseLeave: handlePopoverMouseLeave,
              className: "online-partners-config-menu",
              sx: { pointerEvents: "auto" },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Stack direction="column" spacing={1}>
                {/* Template Button */}
                <Button
                  variant="contained"
                  onClick={handleTemplateClick}
                   className={`online-partners-config-option ${templateSelected ? "is-active" : ""}`}
                  sx={{
                    textTransform: "none",
                    fontSize: "10.5px",
                    borderRadius: "5px",
                    width: "180px",
                    height: "38px",
                    fontWeight: templateSelected ? "bold" : "normal",
                    backgroundColor: templateSelected ? "white" : "primary.main",
                    color: templateSelected ? "black" : "white",
                    boxShadow: templateSelected
                      ? "0px 0px 8px rgba(0,0,0,0.15)"
                      : "none",
                    "&:hover": {
                      backgroundColor: templateSelected
                        ? "rgba(255,255,255,0.9)"
                        : "primary.dark",
                    },
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  OnlinePartner Template
                </Button>

                {/* Dynamic Partner Buttons */}
                {dynamicItems.map((partner) => {
                  const isSelected =
                    selectedPartner?.onlinePartnersId === partner.onlinePartnersId;

                  return (
                    <Button
                      key={partner.onlinePartnersId}
                      variant="contained"
                      onClick={() => handlePartnerClick(partner)}
                      className={`online-partners-config-option ${isSelected ? "is-active" : ""}`}
                      sx={{
                        textTransform: "none",
                        fontSize: "10.5px",
                        borderRadius: "5px",
                        width: "180px",
                        height: "38px",
                        fontWeight: isSelected ? "bold" : "normal",
                        backgroundColor: isSelected ? "white" : "primary.main",
                        color: isSelected ? "black" : "white",
                        boxShadow: isSelected
                          ? "0px 0px 8px rgba(0,0,0,0.15)"
                          : "none",
                        "&:hover": {
                          backgroundColor: isSelected
                            ? "rgba(255,255,255,0.9)"
                            : "primary.dark",
                        },
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      {partner.partnerName}
                    </Button>
                  );
                })}
              </Stack>
            </Box>
          </Popover>
        </Box>

        {/* Page Content */}
        <Box className="online-partners-content" sx={{ mt: 0 }}>
          {isMasterActive ? (
            <OnlinePartnerMasterComponent />
          ) : isConfigActive ? (
            <OnlinePartnerTemplateComponent
              selectedType={selectedPartner ? "dynamic" : "template"}
              partnerId={selectedPartner?.onlinePartnersId}
              partnerName={selectedPartner?.partnerName || "OnlinePartner Template"}
            />
          ) : (
            <Typography variant="body2" color="text.secondary"></Typography>
          )}
        </Box>

      </Box>
    </>
  );
};

export default MenuPage;





























// "use client";

// import { useEffect, useState } from "react";
// import { Box, Typography, Popover, Stack, CircularProgress } from "@mui/material";
// import MasterAdminMenu from "../page";
// import { useDispatch } from "react-redux";
// import { AppDispatch } from "../../../redux/store";
// import axios from "axios";
// import { fetchDynamicData } from "../../master-admin/OnlinePartners/OnlinePartnerConfig/OnlinePartnerTemplate/Features/OnlineParnerTemplateSlice";
// import OnlinePartnerTemplateComponent from "../OnlinePartners/OnlinePartnerConfig/OnlinePartnerTemplate/Modules/OnlinePartnerTemplateComponent";
// import OnlinePartnerMasterComponent from "../OnlinePartners/OnlinePartnerMaster/page";
// import { API_BASE_URL } from "../../../../API_URL";

// interface OnlinePartner {
//   onlinePartnersId: string;
//   partnerName: string;
//   status: string;
// }

// const API_URL = `${API_BASE_URL}/OnlinePartner`;

// const MenuPage: React.FC = () => {
//   const dispatch = useDispatch<AppDispatch>();
//   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
//   const [dynamicItems, setDynamicItems] = useState<OnlinePartner[]>([]);
//   const [activeView, setActiveView] = useState<"master" | "config" | null>(null);
//   const [selectedPartner, setSelectedPartner] = useState<OnlinePartner | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [dataRefreshTrigger] = useState(0);
//   const [templateSelected, setTemplateSelected] = useState(false);

//   useEffect(() => {
//     const fetchPartners = async () => {
//       try {
//         const response = await axios.get(API_URL);
//         const activePartners = response.data.filter(
//           (partner: OnlinePartner) => partner.status === "active"
//         );
//         setDynamicItems(activePartners);
//       } catch (error) {
//         console.error("Failed to fetch partners:", error);
//       }
//     };
//     fetchPartners();
//   }, [dataRefreshTrigger]);

//   const handleMasterClick = () => {
//     setSelectedPartner(null);
//     setTemplateSelected(false);
//     setActiveView("master");
//     setAnchorEl(null);
//   };

//   const handleConfigButtonMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleConfigButtonMouseLeave = () => {
//     setTimeout(() => {
//       if (!document.querySelector(".MuiPopover-root:hover")) {
//         setAnchorEl(null);
//       }
//     }, 100);
//   };

//   const handlePartnerClick = async (partner: OnlinePartner) => {
//     setLoading(true);
//     try {
//       await dispatch(fetchDynamicData({ partnerName: partner.partnerName, search: "" })).unwrap();
//       setSelectedPartner(partner);
//       setTemplateSelected(false);
//       setActiveView("config");
//     } catch (error) {
//       console.error("Error fetching dynamic data:", error);
//       setSelectedPartner(null);
//       setActiveView(null);
//     } finally {
//       setLoading(false);
//       setAnchorEl(null);
//     }
//   };

//   const handleTemplateClick = () => {
//     setSelectedPartner(null);
//     setTemplateSelected(true);
//     setActiveView("config");
//     setAnchorEl(null);
//   };

//   const handlePopoverMouseLeave = () => setAnchorEl(null);

//   const isMasterActive = activeView === "master";
//   const isConfigActive = activeView === "config";

//   const getConfigLabel = () => {
//     if (selectedPartner) return `Config — ${selectedPartner.partnerName}`;
//     if (templateSelected) return `Config — Template`;
//     return "OnlinePartner Config";
//   };

//   return (
//     <>
//       <MasterAdminMenu />

//       <p className="subnav-section-label"></p>
//       <div className="subnav-btn-strip-wrapper">
//         <div className="nav-btn-strip" style={{ alignItems: 'center' }}>

//           {/* Master button */}
//           <span
//             className={`nav-btn-pill ${isMasterActive ? 'active' : ''}`}
//             onClick={handleMasterClick}
//             style={{ cursor: 'pointer' }}
//           >
//             <i className="ti ti-users" aria-hidden="true" />
//             OnlinePartner Master
//           </span>

//           {/* Config button — hover opens popover */}
//           <span
//             className={`nav-btn-pill ${isConfigActive ? 'active' : ''}`}
//             onMouseEnter={handleConfigButtonMouseEnter}
//             onMouseLeave={handleConfigButtonMouseLeave}
//             style={{ cursor: 'pointer' }}
//           >
//             <i className="ti ti-settings" aria-hidden="true" />
//             {getConfigLabel()}
//             <i className="ti ti-chevron-down" aria-hidden="true" style={{ marginLeft: 2 }} />
//             {loading && (
//               <CircularProgress size={10} sx={{ ml: 0.5, color: isConfigActive ? '#fff' : '#1d4ed8' }} />
//             )}
//           </span>

//           {/* Popover dropdown */}
//           <Popover
//             open={Boolean(anchorEl)}
//             anchorEl={anchorEl}
//             onClose={() => setAnchorEl(null)}
//             anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
//             disableRestoreFocus
//             PaperProps={{
//               onMouseLeave: handlePopoverMouseLeave,
//               sx: {
//                 pointerEvents: "auto",
//                 borderRadius: '8px',
//                 boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
//                 border: '0.5px solid #e5e7eb',
//                 mt: 0.5,
//               },
//             }}
//           >
//             <Box sx={{ p: 1 }}>
//               <Stack direction="column" spacing={0.5}>
//                 <span
//                   className={`nav-btn-pill ${templateSelected ? 'active' : ''}`}
//                   onClick={handleTemplateClick}
//                   style={{ cursor: 'pointer', width: '100%', justifyContent: 'flex-start' }}
//                 >
//                   <i className="ti ti-file-description" aria-hidden="true" />
//                   OnlinePartner Template
//                 </span>

//                 {dynamicItems.map((partner) => {
//                   const isSelected = selectedPartner?.onlinePartnersId === partner.onlinePartnersId;
//                   return (
//                     <span
//                       key={partner.onlinePartnersId}
//                       className={`nav-btn-pill ${isSelected ? 'active' : ''}`}
//                       onClick={() => handlePartnerClick(partner)}
//                       style={{ cursor: 'pointer', width: '100%', justifyContent: 'flex-start' }}
//                     >
//                       <i className="ti ti-world" aria-hidden="true" />
//                       {partner.partnerName}
//                     </span>
//                   );
//                 })}
//               </Stack>
//             </Box>
//           </Popover>
//         </div>
//       </div>

//       <Box sx={{ px: 3, pt: 2 }}>
//         {isMasterActive ? (
//           <OnlinePartnerMasterComponent />
//         ) : isConfigActive ? (
//           <OnlinePartnerTemplateComponent
//             selectedType={selectedPartner ? "dynamic" : "template"}
//             partnerId={selectedPartner?.onlinePartnersId}
//             partnerName={selectedPartner?.partnerName || "OnlinePartner Template"}
//           />
//         ) : (
//           <Typography variant="body2" color="text.secondary" />
//         )}
//       </Box>
//     </>
//   );
// };

// export default MenuPage;