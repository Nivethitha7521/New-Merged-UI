import type { SearchIndexItem } from './searchIndex.types';

/**
 * Hand-curated entries. Two jobs live here:
 *
 * 1. FIELD-level search (type: 'field') — these can't be auto-scanned
 *    reliably because form fields live inside deeply nested page logic,
 *    not a clean array literal. Add one entry per field you want searchable.
 *    `focusField` is passed to the destination page as ?focus=<value> so the
 *    page can scrollIntoView + highlight that input once it mounts.
 *
 * 2. keyword ALIASES on existing module/submodule entries — short forms,
 *    Tanglish spellings, or old names people still search for
 *    (e.g. "hsn", "grn", "po", "vendor ledger").
 *
 * This file is never overwritten by the generator script, so it's safe to
 * grow it by hand as you notice searches that should have found something.
 */
export const manualSearchIndex: SearchIndexItem[] = [
  // ---- Item Master fields --------------------------------------------
  {
    id: 'field:/master-admin/Items/add:itemName',
    label: 'Item Name',
    path: '/master-admin/Items/add',
    module: 'Master Admin',
    type: 'field',
    focusField: 'itemName',
    keywords: ['item name', 'product name'],
  },
  {
    id: 'field:/master-admin/Items/add:hsnCode',
    label: 'HSN Code',
    path: '/master-admin/Items/add',
    module: 'Master Admin',
    type: 'field',
    focusField: 'hsnCode',
    keywords: ['hsn', 'hsn code'],
  },
  {
    id: 'field:/master-admin/Items/add:price',
    label: 'Item Price',
    path: '/master-admin/Items/add',
    module: 'Master Admin',
    type: 'field',
    focusField: 'price',
    keywords: ['price', 'rate', 'mrp'],
  },
  {
    id: 'field:/master-admin/Items/add:reorderLevel',
    label: 'Reorder Level',
    path: '/master-admin/Items/add',
    module: 'Master Admin',
    type: 'field',
    focusField: 'reorderLevel',
    keywords: ['reorder level', 'reorder point', 'minimum stock'],
  },

  // ---- Keyword aliases on existing routes -----------------------------
  {
    id: 'alias:/yen-purchase/GrnPage:grn',
    label: 'GRN Note',
    path: '/yen-purchase/GrnPage',
    module: 'YEN Purchase',
    type: 'submodule',
    keywords: ['grn', 'goods received note', 'goods receipt'],
  },
  {
    id: 'alias:/yen-purchase/PurchaseOrder:po',
    label: 'Purchase Order',
    path: '/yen-purchase/PurchaseOrder',
    module: 'YEN Purchase',
    type: 'submodule',
    keywords: ['po', 'purchase order'],
  },
  {
    id: 'alias:/yen-purchase/ApInvoicePage:ap',
    label: 'AP Invoice',
    path: '/yen-purchase/ApInvoicePage',
    module: 'YEN Purchase',
    type: 'submodule',
    keywords: ['ap invoice', 'accounts payable', 'vendor invoice'],
  },
  {
    id: 'alias:/yen-purchase/VendorPage/Vendor:vendor-ledger',
    label: 'Vendor',
    path: '/yen-purchase/VendorPage/Vendor',
    module: 'YEN Purchase',
    type: 'submodule',
    keywords: ['vendor ledger', 'supplier'],
  },
  {
    id: 'alias:/master-admin/Items:item-master',
    label: 'Item Master',
    path: '/master-admin/Items',
    module: 'Master Admin',
    type: 'submodule',
    keywords: ['items', 'item master', 'products'],
  },
  {
    id: 'alias:/master-admin/Items/itemGroup:item-group',
    label: 'Item Group',
    path: '/master-admin/Items/itemGroup',
    module: 'Master Admin',
    type: 'submodule',
    keywords: ['item group'],
  },
  {
    id: 'alias:/yen-inventory/WarehouseInventoryManagement/stockModification:physical-stock',
    label: 'Warehouse Physical Stock Modification',
    path: '/yen-inventory/WarehouseInventoryManagement/stockModification',
    module: 'YEN Inventory',
    type: 'submodule',
    keywords: ['physical stock', 'stock modification', 'stock adjustment'],
  },

  // ---- Purchase Master tabs -------------------------------------------
  // These are NOT separate routes — PurchaseMaster/page.tsx renders every
  // tab on the same URL and switches between them via Redux
  // (setActiveSection), so the generator script (which only scans `path:`
  // values) can never find them. We deep-link with ?section=<key>, which
  // PurchaseMaster/page.tsx now reads on mount (see the patch that adds a
  // useSearchParams effect there) and dispatches setActiveSection with.
  {
    id: 'section:/yen-purchase/PurchaseMaster:purchase-category',
    label: 'Purchase Category',
    path: '/yen-purchase/PurchaseMaster/?section=purchase-category',
    module: 'YEN Purchase',
    type: 'submodule',
    keywords: ['purchase category'],
  },
  {
    id: 'section:/yen-purchase/PurchaseMaster:purchase-subcategory',
    label: 'Purchase SubCategory',
    path: '/yen-purchase/PurchaseMaster/?section=purchase-subcategory',
    module: 'YEN Purchase',
    type: 'submodule',
    keywords: ['purchase subcategory', 'purchase sub category'],
  },
  {
    id: 'section:/yen-purchase/PurchaseMaster:uom',
    label: 'Purchase UOM',
    path: '/yen-purchase/PurchaseMaster/?section=uom',
    module: 'YEN Purchase',
    type: 'submodule',
    keywords: ['purchase uom', 'unit of measurement'],
  },
  {
    id: 'section:/yen-purchase/PurchaseMaster:group-master',
    label: 'Group Item',
    path: '/yen-purchase/PurchaseMaster/?section=group-master',
    module: 'YEN Purchase',
    type: 'submodule',
    keywords: ['group item', 'group master'],
  },
  {
    id: 'section:/yen-purchase/PurchaseMaster:purchase-tax',
    label: 'Purchase Tax',
    path: '/yen-purchase/PurchaseMaster/?section=purchase-tax',
    module: 'YEN Purchase',
    type: 'submodule',
    keywords: ['purchase tax', 'gst'],
  },
  {
    id: 'section:/yen-purchase/PurchaseMaster:storage-location',
    label: 'Storage Location',
    path: '/yen-purchase/PurchaseMaster/?section=storage-location',
    module: 'YEN Purchase',
    type: 'submodule',
    keywords: ['storage location'],
  },
  {
    id: 'section:/yen-purchase/PurchaseMaster:item-type',
    label: 'Item Type',
    path: '/yen-purchase/PurchaseMaster/?section=item-type',
    module: 'YEN Purchase',
    type: 'submodule',
    keywords: ['item type'],
  },
  {
    id: 'section:/yen-purchase/PurchaseMaster:freight',
    label: 'Freight',
    path: '/yen-purchase/PurchaseMaster/?section=freight',
    module: 'YEN Purchase',
    type: 'submodule',
    keywords: ['freight'],
  },
  {
    id: 'section:/yen-purchase/PurchaseMaster:service',
    label: 'Service',
    path: '/yen-purchase/PurchaseMaster/?section=service',
    module: 'YEN Purchase',
    type: 'submodule',
    keywords: ['service'],
  },
  {
    id: 'section:/yen-purchase/PurchaseMaster:brand',
    label: 'Brand',
    path: '/yen-purchase/PurchaseMaster/?section=brand',
    module: 'YEN Purchase',
    type: 'submodule',
    keywords: ['brand', 'brands'],
  },
];
