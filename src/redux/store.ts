import { configureStore } from '@reduxjs/toolkit';
import onlinePartnersReducer from '../features/onlinePartnersSlice';
import billReceiptsReducer from '../features/billReceiptsSlice';
import purchaseOrderReducer from '../features/yen-purchase/PurchaseOrder/purchaseOrderSlice';
import grnReducer from '../features/yen-purchase/GRN/grnSlice';
import dataReducer from '../features/yen_inventory/OutletPhysicalVarianceSlice';
import debitNoteReducer from '../features/debitNotesAllSlice';
import apInvoiceReducer from '../features/yen-purchase/AP/apInvoiceSlice';
import outgoingPaymentReducer from '../features/yen-purchase/Outgoing/outgoingPaymentSlice';
import vendorReducer from '../features/yen-purchase/PurchaseMaster/vendorSlice';
import purchaseItemReducer from '../features/yen-purchase/PurchaseMaster/purchaseItemSlice';
import budgetReducer from '../features/budgetSlice';
import barcodeReducer from '../features/barcodeSlice';
import customerReducer from '../features/customerSlice';
import feedbackReducer from '../features/feedbackSlice';
import employeeReducer from '../features/employeeSlice';
import pfesiReducer from '../features/pfesiSlice';
import salaryReducer from '../features/salarySlice';
import shiftReducer from '../features/shiftSlice';
import timingRuleReducer from '../features/timingRuleSlice';
import hrmReducer from '../features/hrmSlice';
import attendanceReducer from '../features/attendanceSlice';
import dailyAttendanceReducer from '../features/dailyAttendanceSlice';
import monthlyAttendanceReducer from '../features/monthlyAttendanceSlice';
import payrollReducer from '../features/payrollSlice';
import leaveManagementReducer from '../features/leaveManagementSlice';
import depositReducer from '../features/depositSlice';
import employeemasterReducer from '../features/employeemasterSlice';
import designationReducer from '../features/designationSlice';
import departmentReducer from '../features/departmentSlice';
import cashReducer from '../features/cashSlice';
import openingCashReducer from '../features/openingCashSlice';
import outletsInventoryReducer from '../features/outletsInventorySlice';
import warehouseInventoryReducer from '../features/wharehouseInventorySlice';
import warehouseStoreStockReducer from '../features/warehouseStoreStockSlice';
import barcodeItemsReducer from '../features/barcodeItemsSlice';
import printUniqueBarcodesReducer from '../features/printUniqueBarcodesSlice';
import paymentReducer from '../features/paymentSlice';
import purchaseMasterItemReducer from '../features/yen-purchase/purchaseMasterSlice';
import PurchaseCategoryReducer  from '../features/yen-purchase/PurchaseMaster/PurchaseCategorySlice';
import purchaseSubcategoryReducer from '../features/yen-purchase/PurchaseMaster/PurchaseSubcategorySlice'; // Adjust import path
import groupMasterReducer from '../features/yen-purchase/PurchaseMaster/GroupMasterSlice';
import brandReducer from '../app/yen-purchase/PurchaseMaster/Brands/Features/BrandSlice';
import VendorTypeReducer from '../features/yen-purchase/PurchaseMaster/VendorTypeSlice';
import PurchaseUomReducer from '../features/yen-purchase/PurchaseMaster/PurchaseUomSlice'
import purchaseTaxReducer from '../features/yen-purchase/PurchaseMaster/purchaseTaxSlice';
import StorageLocationReducer from '../features/yen-purchase/PurchaseMaster/StorageLocationSlice';
import itemTypeReducer from '../features/yen-purchase/PurchaseMaster/itemTypeSlice';
import purchaselistReducer from '../features/yen-purchase/PurchaseOrder/purchaseListSlice';
import businessReducer from '@/features/account-setting/businessSlice';
import personalReducer from '@/features/account-setting/personalSlice';
import freightReducer from '@/features/yen-purchase/PurchaseMaster/FreightMasterSlice';
import serviceReducer from '../app/yen-purchase/PurchaseMaster/Service/Features/ServiceSlice'; 
// import locationReducer from '../features/masterAdminSlice/locationSlice';
// import subcategoryReducer from '../features/masterAdminSlice/subcategorySlice';
// import inventoryTypeReducer from '../features/masterAdminSlice/inventoryTypeSlice';
// import warehouseReducer from '../features/masterAdminSlice/warehouseSlice';
// import freetypeReducer from '@/features/yen-crm/freetypeSlice';

import roleReducer from '@/features/account-setting/roleSlice';
import PurchaseDateSettingsReducer from '@/app/yen-settings/Features/PurchaseDateSettingSlice';
// import categoryReducer from '../features/masterAdminSlice/categorySlice';
import uomReducer from '../features/uomSlice';
import vendorMasterReducer from '../features/yen-purchase/PurchaseMaster/vendorMaster';
import poitemRedcuer from '../features/yen-purchase/PurchaseOrder/poitemSlice';
import csvOperationsReducer from '../features/yen-purchase/PurchaseMaster/csvOperationSlice';
import photoDocumentReducer from '../features/yen-purchase/PurchaseOrder/photoSlice';
// import itemgroupReducer from '../features/masterAdminSlice/itemgroupSlice';
// import addOnReducer from '../features/masterAdminSlice/addOnSlice';
// import variantReducer from '../features/masterAdminSlice/variantsSlice';

// import orderTypeReducer from '../features/masterAdminSlice/orderTypeSlice';
// import vehicleReducer from '../features/masterAdminSlice/vehicleSlice';
// import promotionalOfferReducer from '../features/yen-crm/promotionalOfferSlice';
// import roleReducer from '../features/roleSlice';
import userAccountReducer from '../features/userAccountSlice';
// import taxReducer from '../features/masterAdminSlice/taxSlice';
// import discountReducer from '../features/masterAdminSlice/discountSlice';
// import currencyReducer from '../features/masterAdminSlice/currencySlice';

import locationAreaReducer from '../features/locationAreaSlice';
import advancePaymentReducer from '../features/yen-purchase/Outgoing/advancePaymentSlice'
// import tableReducer from '../features/yen-pos/tableSlice';
// import assetReducer from '../features/yen-pos/assetSlice';

// import mixboxReducer from '../features/masterAdminSlice/mixBoxSlice';

// import posDeviceReducer from '../features/yen-pos/posDeviceSlice';
import authReducer from '../features/authSlice';
// import posDeviceReducer from '../features/yen-pos/posDeviceSlice';
import assetReducer from '../features/assetSlice';
import debitCreditNoteReducer from '../features/yen-purchase/DebitNoteSlice'
import outgoingLedgerReducer from '../features/yen-purchase/Outgoing/ledgerData'
import paymentHistoryReducer from '../features/yen-purchase/Outgoing/paymentHistory'
import serviceOrderReducer from '../app/yen-purchase/ServiceOrder/Features/servicepo'
import serviceListReducer from '../app/yen-purchase/ServiceOrder/Features/servicelist';
import serviceIdSliceReducer from '../app/yen-purchase/ServiceOrder/Features/ServiceIdSlice';
import outletVarianceReducer from '../features/yen_inventory/OutletPhysicalVarianceSlice';
import rawMaterialReducer from "../features/yen_inventory/wharehoueSlice";
import rawMaterialStoreReducer from "../features/yen_inventory/wharehoueStoreSlice";
import stockSummaryReducer from "../features/yen_inventory/ledgerrawSlice";
import stockSummaryOutletReducer from "../features/yen_inventory/ledgeroutletSlice";
import itemsReducer from '../features/yen_inventory/OuletePhysicalStockSlice';

import dateFilterReducer from '../glopals/dateFilterSlice';
import { reportReducers } from '../redux/reportRegistry';
import expenseCategoryReducer from '../features/yen-book/ExpenseCategorySlice';
import expenseSubcategoryReducer from '../features/yen-book/ExpenseSubcategorySlice';
import expenseNameReducer from '../features/yen-book/ExpenseNameSlice';
import GRNSettingReducer from '../../src/app/yen-settings/Features/GRNSettingsSlice';
import newrecipeReducer from "../app/yen-recipie/StoreKitchenMaster/newRecipe/Features/newrecipeSlice";
import recipehistoryReducer from "../app/yen-recipie/StoreKitchenMaster/edit/versionhistory/features/viewrecipehistory";
import recipesReducer from "../app/yen-recipie/StoreKitchenMaster/Slicefiles/recipeassignSlice";
import editRecipeReducer from "../app/yen-recipie/StoreKitchenMaster/edit/editing/features/editRecipeSlice";
import storeKitchenItemReducer from "../app/yen-recipie/StoreKitchenMaster/Slicefiles/storekitchenmaster";
import recipesectionReducer from "../app/yen-recipie/StoreKitchenMaster/edit/slicefiles/selectsectionslice";
import categoryReducer from '../app/master-admin/Items/Category/Features/categorySlice';
import discountReducer from '../app/master-admin/Discount/Features/discountSlice';
import itemGroupReducer from '../app/master-admin/Items/itemGroup/Features/itemgroupSlice';
import subcategoryReducer from '../app/master-admin/Items/Subcategory/Features/subcategorySlice';
import maItemsReducer from '../app/master-admin/Items/Item/Features/itemSlice';
import addonReducer from '../app/master-admin/KOTMaster/addOn/Features/addOnSlice';
import variantReducer from '../app/master-admin/KOTMaster/variants/Features/variantsSlice';
import tableReducer from '../app/master-admin/KOTMaster/TableMaster/Features/tableSlice';
import mixboxReducer from '../app/master-admin/MixBox/Features/mixBoxSlice';
import onlinePartnerTemplateReducer from '../app/master-admin/OnlinePartners/OnlinePartnerConfig/OnlinePartnerTemplate/Features/OnlineParnerTemplateSlice';
import maOnlinePartnerReducer from '../app/master-admin/OnlinePartners/OnlinePartnerMaster/Features/OnlinePartnerSlice';
import AdvanceAmountReducer from '../app/master-admin/SaleOrder/AdvanceAmount/Features/AdvanceAmountSlice';
import DeliveryOrderDateReducer from '../app/master-admin/SaleOrder/DeliveryDate/Features/deliveryorderslice';
import deliveryTypeReducer from '../app/master-admin/SaleOrder/DeliveryType/Features/deliveryTypeslice';
import EventReducer from '../app/master-admin/SaleOrder/Events/Features/EventSlice';
import ChargesReducer from '../app/master-admin/SaleOrder/Charges/Features/chargeSlice';
import maPaymentTypeReducer from '../app/master-admin/SaleOrder/PaymentType/Features/PaymentTypeSlice';
import taxReducer from '../app/master-admin/Tax/Features/taxSlice';
import maUomReducer from '../app/master-admin/Uom/Features/uomSlice';
import vehiclesReducer from '../app/master-admin/Vehicle/Features/vehicleSlice';
import warehouseReducer from '../app/master-admin/WarehouseMaster/Features/warehouseSlice';
import locationReducer from '../app/master-admin/Locations/Features/locationSlice';
import WhatsAppReducer from '../app/WhatsApp/WhatsappAdmin/Features/whatsAppSlice';
import WhatsappMessageReducer from '../app/WhatsApp/WhatsappMaster/Features/whatsAppMessage';

import maAssetReducer from '../app/yen-pos/assetManagement/Feature/assetSlice';
import OpeningCashReducer from '../app/yen-pos/CashManagement/OpeningCash/Feature/openingCashSlice';
import PettyCashReducer from '../app/yen-pos/CashManagement/PettyCash/Feature/PettyCashSlice';
import posDeviceReducer from '../app/yen-pos/POSDevicePage/Feature/posDeviceSlice';
import orderTypeReducer from '../app/master-admin/Items/OrderType/Features/orderTypeSlice';
import measurementTypeReducer from '../app/master-admin/Items/MeasurementType/Features/measurementSlice';
import inventoryTypeReducer from '../app/master-admin/Items/InventoryType/Features/inventoryTypeSlice';
import sectionsReducer from '../app/master-admin/SectionMaster/Features/sectionsSlice';
import sfgReducer from '../app/master-admin/Items/SFG/Features/sfgSlice';
import dineInTaxesReducer from '../app/master-admin/Tax/Features/dineInTaxSlice';
import prefixTypeReducer from '../app/yen-pos/prefixMaster/Features/prefixSlice';
import ReasonsReducer from '../app/yen-pos/reasons/Features/reasonSlice';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import recipeReducer from "../app/yen-recipie/RecipeManagement/Features/recipeSlice";
const store = configureStore({
  reducer: {
    // locations: locationAreaReducer,
   
    onlinePartners: onlinePartnersReducer,
    billReceipts: billReceiptsReducer,
    purchaseOrder: purchaseOrderReducer,
    grn: grnReducer,
    outgoingPayment: outgoingPaymentReducer,
    vendor: vendorReducer,
    purchaseItems: purchaseItemReducer,
    masterPurchase:purchaseMasterItemReducer,
    budget: budgetReducer,
    barcode: barcodeReducer,
    customer: customerReducer,
    feedback: feedbackReducer,
    employee: employeeReducer,
    pfesi: pfesiReducer,
    salary: salaryReducer,
    shift: shiftReducer,
    timingRules: timingRuleReducer,
    hrm: hrmReducer,
    attendance: attendanceReducer,
    dailyAttendance: dailyAttendanceReducer,
    monthlyAttendance: monthlyAttendanceReducer,
    locationAreas: locationAreaReducer,
    payroll: payrollReducer,
    leaveManagement: leaveManagementReducer,
    assets: assetReducer,
    deposit: depositReducer,
    // warehouseData: warehouseReducer,
    employeemaster: employeemasterReducer,
    designation: designationReducer,
    department: departmentReducer,
    // table: tableReducer,
    cash: cashReducer,
    openingCash: openingCashReducer,
    outletsInventory: outletsInventoryReducer,
    warehouseInventory: warehouseInventoryReducer,
    items: itemsReducer,
    warehouseStoreStock: warehouseStoreStockReducer,
    barcodeItems: barcodeItemsReducer,
    printUniqueBarcodes: printUniqueBarcodesReducer,
    payment: paymentReducer,
    // role: roleReducer,
    userAccount: userAccountReducer,
    auth: authReducer,
    role: roleReducer,
    purchaseSubcategory: purchaseSubcategoryReducer,
    purchaseCategory:PurchaseCategoryReducer,
    groupItems: groupMasterReducer,
    brand:brandReducer,
    vendorType:VendorTypeReducer,
    purchaseUom:PurchaseUomReducer,
    purchaseTax:purchaseTaxReducer,
    storageLocations:StorageLocationReducer,
    itemtype:itemTypeReducer,
    purchaseList:purchaselistReducer,
    business:businessReducer,
    personal:personalReducer,
    photos:photoDocumentReducer,
    // subCategory: subcategoryReducer,
    // Category: categoryReducer,
    uoms: uomReducer,
    vendorMaster:vendorMasterReducer,
    purchaseOrderItems:poitemRedcuer,
    csvOperations:csvOperationsReducer,
    debitNotesAll:debitNoteReducer,
    debitCreditNote:debitCreditNoteReducer,
    outgoingLedger:outgoingLedgerReducer,
    advances: advancePaymentReducer, // Make sure this is correctly named
    freightItems:freightReducer,
    serviceItems:serviceReducer,
    payments:paymentHistoryReducer,
    serviceOrder:serviceOrderReducer,
    serviceList:serviceListReducer,
    serviceId:serviceIdSliceReducer,
    purchaseDateSettings:PurchaseDateSettingsReducer,
    outletVariance: outletVarianceReducer,
    data: dataReducer,  
  rawMaterials: rawMaterialReducer,
  rawMaterialStore: rawMaterialStoreReducer,
  stockSummary: stockSummaryReducer,
  stockSummaryOutlet: stockSummaryOutletReducer,


    dateFilter: dateFilterReducer,
    ...reportReducers,
        expenseCategory: expenseCategoryReducer,
    expenseName: expenseNameReducer,
    expenseSubcategory: expenseSubcategoryReducer,
    grnPriceSettings:GRNSettingReducer,
    // addOns: addOnReducer,    
    // variants: variantReducer,

    // orderTypes: orderTypeReducer,
    // vehicles: vehicleReducer,
    // mixBox: mixboxReducer,
    // // assets: assetReducer,
    // warehouses: warehouseReducer,
    // currency: currencyReducer,

    // inventoryType: inventoryTypeReducer,
   
    // itemGroup:itemgroupReducer,
    // taxes: taxReducer,
    // discounts: discountReducer,
    
    // locationAreas: locationAreaReducer,
    
    //  promotionalOffers: promotionalOfferReducer,
    // freetype: freetypeReducer,
    // locations: locationReducer,
    // posDevice: posDeviceReducer,
// ---- MASTER-ADMIN REDUCERS ----

Category: categoryReducer,
Discounts: discountReducer,
itemGroup: itemGroupReducer,
subCategory: subcategoryReducer,
maItems: maItemsReducer,
addOn: addonReducer,
variants: variantReducer,
table: tableReducer,
mixBox: mixboxReducer,
onlinePartnerTemplate: onlinePartnerTemplateReducer,
maOnlinePartners: maOnlinePartnerReducer,
AdvanceAmount: AdvanceAmountReducer,
deliveryOrder: DeliveryOrderDateReducer,
deliveryTypes: deliveryTypeReducer,
Event: EventReducer,
Charges: ChargesReducer,
maPaymentType: maPaymentTypeReducer,
taxes: taxReducer,
maUoms: maUomReducer,
vehicles: vehiclesReducer,
warehouses: warehouseReducer,
locations: locationReducer,
WhatsApp: WhatsAppReducer,
WhatsappMessage: WhatsappMessageReducer,
asset: maAssetReducer,
OpeningCash: OpeningCashReducer,
PettyCash: PettyCashReducer,
posDevice: posDeviceReducer,
orderType: orderTypeReducer,
measurementType: measurementTypeReducer,
inventoryType: inventoryTypeReducer,
sections: sectionsReducer,
sfg: sfgReducer,
dineInTaxes: dineInTaxesReducer,
prefixType: prefixTypeReducer,
Reasons: ReasonsReducer,
recipe: recipeReducer,
newrecipe: newrecipeReducer,
recipehistory: recipehistoryReducer,
recipes: recipesReducer,
editRecipe: editRecipeReducer,
storeKitchenItem: storeKitchenItemReducer,
recipesection: recipesectionReducer,
  },
  
});

// Define the RootState type based on the store's state
export type RootState = ReturnType<typeof store.getState>;

// Define the AppDispatch type based on the store's dispatch
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export default store;


