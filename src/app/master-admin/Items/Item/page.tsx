

'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Pagination, debounce } from '@mui/material';
import { RootState, AppDispatch } from '../../../../redux/store';
import MasterAdminMenu from '../page';
import { fetchItems, setCurrentPage, fetchItemById, fetchDeactivatedItems } from '../../../master-admin/Items/Item/Features/itemSlice';
import ItemActions from '../itemComponets/itemaction';
import ItemsTable from '../itemComponets/itemteble';
import { Item } from '../../../master-admin/Items/Item/Models/itemsModels';
import { useRouter } from 'next/navigation';

const headerMapping: Record<string, string> = {
  itemImage: 'Image',
  itemName: 'Item Name',
  item_Uom: 'UOM',
  itemType: 'Item Type',
  category: 'Category',
  subCategory: 'Sub Category',
//  itemGroup: 'Item Group',
  tax: 'Tax',
  hsnCode: 'HSN Code',
  description: 'Description',
};

const allHeaderKeys = Object.keys(headerMapping);

function Items() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error, totalPages, currentPage } = useSelector(
    (state: RootState) => state.maItems
  );


  const deactivatedItems = useSelector((state: RootState) => state.maItems.deactivatedItems);

  const showDeactivated = useSelector((state: RootState) => state.maItems.showDeactivated);
  const deactivatedTotalPages = useSelector((state: RootState) => state.maItems.deactivatedTotalPages);
  const [deactivatedPage, setDeactivatedPage] = useState(1);


  const [search, setSearch] = useState('');
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const router = useRouter();

  // ── Lifted filter state ───────────────────────────────────────────────────
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    allHeaderKeys.forEach((h) => { map[h] = true; });
    return map;
  });

  const handleToggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filtered headers passed to ItemsTable
  const filteredHeaders = useMemo(
    () => allHeaderKeys.filter((h) => visibleColumns[h] !== false),
    [visibleColumns]
  );

  // ── Fetch logic ───────────────────────────────────────────────────────────
  // const fetchItemsCallback = useCallback(
  //   (searchTerm: string, page: number) => {
  //     dispatch(fetchItems({ page, limit: 15, itemName: searchTerm }));
  //   },
  //   [dispatch]
  // );

  const fetchItemsCallback = useCallback(
    (searchTerm: string, page: number) => {
      if (showDeactivated) {
        dispatch(fetchDeactivatedItems({ page: deactivatedPage, limit: 15, itemName: searchTerm }));
      } else {
        dispatch(fetchItems({ page, limit: 15, itemName: searchTerm }));
      }
    },
    [dispatch, showDeactivated, deactivatedPage]
  );

  const debouncedFetchItems = useMemo(
    () => debounce(fetchItemsCallback, 300),
    [fetchItemsCallback]
  );

  useEffect(() => {
    debouncedFetchItems(search, currentPage);
    return () => {
      debouncedFetchItems;
    };
  }, [search, currentPage, debouncedFetchItems]);


  useEffect(() => {
    if (showDeactivated) {
      setDeactivatedPage(1);
      dispatch(setCurrentPage(1));
    }
  }, [showDeactivated, dispatch]);

  // ── Page change ───────────────────────────────────────────────────────────
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    dispatch(setCurrentPage(page));
  };

  // ── Edit item ─────────────────────────────────────────────────────────────
  const handleEditItem = async (item: Item | null, varianceIndex?: number) => {
    if (!item || !item.branchwiseItemId) {
      console.error('No item or branchwiseItemId found');
      return;
    }

    try {
      setIsLoadingItem(true);
      const result = await dispatch(fetchItemById(item.branchwiseItemId));

      if (fetchItemById.fulfilled.match(result)) {
        router.push(
          `/master-admin/Items/edit/?id=${item.branchwiseItemId}` +
          (varianceIndex !== undefined ? `&varianceIndex=${varianceIndex}` : '')
        );
      } else {
        console.error('Failed to fetch item details:', result.payload);
        router.push(
          `/master-admin/Items/edit/?id=${item.branchwiseItemId}` +
          (varianceIndex !== undefined ? `&varianceIndex=${varianceIndex}` : '')
        );
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      router.push(
        `/master-admin/Items/edit/?id=${item.branchwiseItemId}` +
        (varianceIndex !== undefined ? `&varianceIndex=${varianceIndex}` : '')
      );
    } finally {
      setIsLoadingItem(false);
    }
  };



  //   // ── Edit item ─────────────────────────────────────────────────────────────
  // const handleEditItem = async (item: Item | null, varianceIndex?: number) => {
  //   if (!item || !item.itemId) {
  //     console.error('No item or branchwiseItemId found');
  //     return;
  //   }

  //   try {
  //     setIsLoadingItem(true);
  //     const result = await dispatch(fetchItemById(item.itemId));

  //     if (fetchItemById.fulfilled.match(result)) {
  //       router.push(
  //         `/master-admin/Items/edit/?id=${item.itemId}` +
  //         (varianceIndex !== undefined ? `&varianceIndex=${varianceIndex}` : '')
  //       );
  //     } else {
  //       console.error('Failed to fetch item details:', result.payload);
  //       router.push(
  //         `/master-admin/Items/edit/?id=${item.itemId}` +
  //         (varianceIndex !== undefined ? `&varianceIndex=${varianceIndex}` : '')
  //       );
  //     }
  //   } catch (error) {
  //     console.error('Error fetching item:', error);
  //     router.push(
  //       `/master-admin/Items/edit/?id=${item.itemId}` +
  //       (varianceIndex !== undefined ? `&varianceIndex=${varianceIndex}` : '')
  //     );
  //   } finally {
  //     setIsLoadingItem(false);
  //   }
  // };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box>
      <MasterAdminMenu />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, ml: 2 }}>
        <ItemActions
          search={search}
          setSearch={setSearch}
          dispatch={dispatch}
          selectedHeaders={allHeaderKeys}
          headerMapping={headerMapping}
          visibleColumns={visibleColumns}
          onToggleColumn={handleToggleColumn}
        />
      </Box>

      <ItemsTable
        //    allItems={items}
        allItems={showDeactivated ? deactivatedItems : items}
        selectedHeaders={filteredHeaders}
        headerMapping={headerMapping}
        setOpenEdit={handleEditItem}
        setOpenEditVariance={() => { }}
        setIsPriceOverrideDialogOpen={() => { }}
        search={search}
        currentPage={currentPage}
      />

      {/* <Pagination
        count={totalPages}
        page={currentPage}
        onChange={handlePageChange}
        color="primary"
        sx={{ mt: 0, display: 'flex', justifyContent: 'center' }}
      /> */}


      {/* Replace existing <Pagination> with this */}
      {showDeactivated ? (
        <Pagination
          count={deactivatedTotalPages}       // passed up from ItemsTable
          page={deactivatedPage}
          onChange={(_, page) => setDeactivatedPage(page)}
          color="primary"
          sx={{ mt: 0, display: 'flex', justifyContent: 'center' }}
        />
      ) : (
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
          sx={{ mt: 0, display: 'flex', justifyContent: 'center' }}
        />
      )}

    </Box>
  );
}

export default Items;