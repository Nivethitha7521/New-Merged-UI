"use client";
import React from 'react';
import { Button, Box} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveSection, selectActiveSection } from '../../../features/yen-purchase/purchaseMasterSlice';
import PurchaseCategoryPage from './PurchaseCategory/page';
import PurchaseSubCategoryPage from './PurchaseSubcategory/page';
import PurchaseUOMPage from './PurchaseUom/page';
import GroupMasterPage from './GroupItem/page';
import PurchaseTaxPage from './PurchaseTax/page';
import StorageLocationPage from './StorageLocation/page';
import ItemTypePage from './ItemType/page';
import FreightPage from './Freight/page';
import ServicePage from './Service/page';
import BrandPage from './Brands/page';  // ✅ ADD BRAND IMPORT
import { usePermissions } from "../../../hooks/usePermissions";

const PurchaseMasterItemPage: React.FC = () => {
  const dispatch = useDispatch();
  const { isModuleVisible } = usePermissions();
  
  const canShow = (module: string) => {
    return isModuleVisible("yenerp", module);
  };

  const activeSection = useSelector(selectActiveSection);
  
  // ✅ ADD BRAND TO VISIBLE SECTIONS
  React.useEffect(() => {
    const visibleSections = [
      { key: "purchase-category", module: "purchasecategory" },
      { key: "purchase-subcategory", module: "purchasesubcategory" },
      { key: "uom", module: "purchaseuom" },
      { key: "group-master", module: "itemgroup" },
      { key: "purchase-tax", module: "purchasetax" },
      { key: "storage-location", module: "storagelocation" },
      { key: "item-type", module: "itemtype" },
      { key: "freight", module: "freight" },
      { key: "service", module: "service" },
      { key: "brand", module: "brand" },  // ✅ ADD BRAND
    ];

    const currentIsValid = visibleSections.find(
      (s) => s.key === activeSection && canShow(s.module)
    );

    if (!currentIsValid) {
      const firstVisible = visibleSections.find(({ module }) => canShow(module));
      if (firstVisible) {
        dispatch(setActiveSection(firstVisible.key));
      }
    }
  }, []); // runs once on mount

  const handleSectionClick = (section: string) => {
    dispatch(setActiveSection(section));
  };

  // Function to render content based on active section
  const renderContent = () => {
    if (!activeSection) return null;

    const map: any = {
      "purchase-category": { module: "purchasecategory", comp: <PurchaseCategoryPage /> },
      "purchase-subcategory": { module: "purchasesubcategory", comp: <PurchaseSubCategoryPage /> },
      "uom": { module: "purchaseuom", comp: <PurchaseUOMPage /> },
      "group-master": { module: "itemgroup", comp: <GroupMasterPage /> },
      "purchase-tax": { module: "purchasetax", comp: <PurchaseTaxPage /> },
      "storage-location": { module: "storagelocation", comp: <StorageLocationPage /> },
      "item-type": { module: "itemtype", comp: <ItemTypePage /> },
      "freight": { module: "freight", comp: <FreightPage /> },
      "service": { module: "service", comp: <ServicePage /> },
      "brand": { module: "brand", comp: <BrandPage /> },  // ✅ ADD BRAND
    };

    const current = map[activeSection];
    if (!current) return null;

    return current.comp;
  };

return (
  <Box className="purchase-page-shell">
    <Box className="purchase-submodule-tabs">
          {canShow("purchasecategory") && (
          <Button
  onClick={() =>
    handleSectionClick('purchase-category')
  }
  className={`purchase-submodule-tab ${
    activeSection === 'purchase-category'
      ? 'is-active'
      : ''
  }`}
>
  Purchase Category
</Button>
          )}
          
          {canShow("purchasesubcategory") && (
            <Button
  onClick={() =>
    handleSectionClick('purchase-subcategory')
  }
  className={`purchase-submodule-tab ${
    activeSection === 'purchase-subcategory'
      ? 'is-active'
      : ''
  }`}
>
  Purchase SubCategory
</Button>
          )}
          
          {canShow("purchaseuom") && (
          <Button
  onClick={() => handleSectionClick('uom')}
  className={`purchase-submodule-tab ${
    activeSection === 'uom'
      ? 'is-active'
      : ''
  }`}
>
  Purchase UOM
</Button>
          )}
          
          {canShow("itemgroup") && (
           <Button
  onClick={() =>
    handleSectionClick('group-master')
  }
  className={`purchase-submodule-tab ${
    activeSection === 'group-master'
      ? 'is-active'
      : ''
  }`}
>
  Group Item
</Button>
          )}
          
          {canShow("purchasetax") && (
          <Button
  onClick={() =>
    handleSectionClick('purchase-tax')
  }
  className={`purchase-submodule-tab ${
    activeSection === 'purchase-tax'
      ? 'is-active'
      : ''
  }`}
>
  Purchase Tax
</Button>
          )}
          
          {canShow("storagelocation") && (
          <Button
  onClick={() =>
    handleSectionClick('storage-location')
  }
  className={`purchase-submodule-tab ${
    activeSection === 'storage-location'
      ? 'is-active'
      : ''
  }`}
>
  Storage Location
</Button>
          )}
          
          {canShow("itemtype") && (
          <Button
  onClick={() =>
    handleSectionClick('item-type')
  }
  className={`purchase-submodule-tab ${
    activeSection === 'item-type'
      ? 'is-active'
      : ''
  }`}
>
  Item Type
</Button>
          )}
          
          {canShow("freight") && (
         <Button
  onClick={() =>
    handleSectionClick('freight')
  }
  className={`purchase-submodule-tab ${
    activeSection === 'freight'
      ? 'is-active'
      : ''
  }`}
>
  Freight
</Button>
          )}
          
          {canShow("service") && (
           <Button
  onClick={() =>
    handleSectionClick('service')
  }
  className={`purchase-submodule-tab ${
    activeSection === 'service'
      ? 'is-active'
      : ''
  }`}
>
  Service
</Button>
          )}
          
          {/* ✅ ADD BRAND BUTTON */}
          {canShow("brand") && (
           <Button
  onClick={() =>
    handleSectionClick('brand')
  }
  className={`purchase-submodule-tab ${
    activeSection === 'brand'
      ? 'is-active'
      : ''
  }`}
>
  Brand
</Button>
          )}
        </Box>
        
<Box className="purchase-module-content">
  {renderContent()}
</Box>
      </Box>
   
  );
};

export default PurchaseMasterItemPage;