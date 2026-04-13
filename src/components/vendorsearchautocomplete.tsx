import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/redux/store';
import { searchVendorsByExactName } from '@/features/yen-purchase/PurchaseMaster/vendorSlice';
import { VendorSearch } from '@/Models/vendor';

interface VendorSearchAutocompleteProps {
  value: VendorSearch | null;
  onChange: (item: VendorSearch | null) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  required?: boolean;
  limit?: number;
  initialRandomId?: string;
}

const VendorSearchAutocomplete: React.FC<VendorSearchAutocompleteProps> = ({
  value,
  onChange,
  label = "All Vendors",
  error = undefined,
  helperText = "",
  fullWidth = true,
  required = false,
  limit = 50,
  initialRandomId
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [vendors, setVendors] = useState<VendorSearch[]>([]);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [noResultsFound, setNoResultsFound] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const hasCheckedNoResultsRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load vendor by randomId if provided
  useEffect(() => {
    if (initialRandomId && !value && isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      setLoading(true);
      
      dispatch(searchVendorsByExactName({ 
        vendor_name: '', 
        random_id: initialRandomId,
        skip: 0, 
        limit: 1,
        forceRefresh: true
      }))
        .unwrap()
        .then((vendorsList) => {
          if (vendorsList && vendorsList.length > 0) {
            const foundVendor = vendorsList[0];
            onChange(foundVendor);
            setInputValue(foundVendor.vendorName);
          } else {
            console.warn(`No vendor found with randomId: ${initialRandomId}`);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching vendor by randomId:', error);
          setLoading(false);
        });
    }
  }, [initialRandomId, dispatch, onChange, value]);

  // Fetch vendors function
  const fetchVendors = useCallback((searchText: string, skipValue: number, forceRefresh = false) => {
    if (loading || (!forceRefresh && skipValue > 0 && !hasMore)) return;
    
    if (skipValue === 0) {
      hasCheckedNoResultsRef.current = false;
      setNoResultsFound(false);
    }
    
    setLoading(true);
    dispatch(searchVendorsByExactName({ 
      vendor_name: searchText, 
      skip: skipValue, 
      limit, 
      forceRefresh 
    }))
      .unwrap()
      .then((newVendors) => {
        if (skipValue === 0) {
          setVendors(newVendors);
          // Only set no results if we have a search term and no vendors
          if (newVendors.length === 0 && searchText && searchText.trim().length > 0) {
            setNoResultsFound(true);
            hasCheckedNoResultsRef.current = true;
          } else {
            setNoResultsFound(false);
          }
        } else {
          setVendors(prevVendors => {
            const existingVendorsMap = new Map(prevVendors.map(vendor => [vendor.vendorId, vendor]));
            newVendors.forEach(vendor => {
              if (!existingVendorsMap.has(vendor.vendorId)) {
                existingVendorsMap.set(vendor.vendorId, vendor);
              }
            });
            return Array.from(existingVendorsMap.values());
          });
        }
        
        if (newVendors.length > 0) {
          setSkip(skipValue + limit);
          setHasMore(newVendors.length === limit);
        } else {
          setHasMore(false);
          if (skipValue === 0 && searchText && searchText.trim().length > 0 && !hasCheckedNoResultsRef.current) {
            setNoResultsFound(true);
            hasCheckedNoResultsRef.current = true;
          }
        }
        
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching vendors:', error);
        setLoading(false);
        setHasMore(false);
        if (skipValue === 0 && searchText && searchText.trim().length > 0 && !hasCheckedNoResultsRef.current) {
          setNoResultsFound(true);
          hasCheckedNoResultsRef.current = true;
        }
      });
  }, [dispatch, loading, limit, hasMore]);

  // Debounced search
  const debouncedSearch = useCallback((searchText: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (!searchText || searchText.trim().length === 0) {
      setVendors([]);
      setHasMore(true);
      setSkip(0);
      setNoResultsFound(false);
      setLoading(false);
      return;
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setSkip(0);
      setHasMore(true);
      setVendors([]);
      setNoResultsFound(false); // Reset before search
      fetchVendors(searchText, 0, true);
    }, 300);
  }, [fetchVendors]);

  // Handle input change - FIXED to always allow typing
  const handleInputChange = useCallback((_: React.SyntheticEvent, newInputValue: string) => {
    // Always allow typing
    setInputValue(newInputValue);
    setSearchTerm(newInputValue);
    
    // Clear selection when input changes
    if (value && value.vendorName !== newInputValue) {
      onChange(null);
    }
    
    // Reset no results flag when typing new input
    if (newInputValue !== searchTerm) {
      setNoResultsFound(false);
      hasCheckedNoResultsRef.current = false;
    }
    
    // Trigger debounced search for non-empty input
    if (newInputValue && newInputValue.trim().length > 0) {
      debouncedSearch(newInputValue);
    } else {
      // Clear results if input is empty
      setVendors([]);
      setHasMore(true);
      setSkip(0);
      setNoResultsFound(false);
      setLoading(false);
    }
  }, [debouncedSearch, onChange, value, searchTerm]);

  // Handle scroll to load more
  const handleScroll = useCallback((event: React.UIEvent<HTMLUListElement>) => {
    const target = event.currentTarget;
    
    if (noResultsFound || !hasMore || loading) return;
    
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 50) {
      if (searchTerm) {
        fetchVendors(searchTerm, skip);
      }
    }
  }, [noResultsFound, hasMore, loading, fetchVendors, searchTerm, skip]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <Autocomplete
      fullWidth={fullWidth}
      options={vendors}
      getOptionLabel={(option: VendorSearch) => option?.vendorName || ''}
      isOptionEqualToValue={(option: VendorSearch, val: VendorSearch | null) => 
        option?.vendorId === val?.vendorId || option?.randomId === val?.randomId
      }
      value={value}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={(_, newValue) => {
        onChange(newValue);
        if (newValue) {
          setInputValue(newValue.vendorName);
          setSearchTerm(newValue.vendorName);
          setNoResultsFound(false);
        }
      }}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      filterOptions={(options) => options} // Disable local filtering
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          size="small"
          error={error}
          helperText={helperText}
          required={required}
          placeholder="Type to search vendors..."
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.vendorId}>
          {option.vendorName}
        </li>
      )}
      ListboxProps={{
        onScroll: handleScroll,
        style: {
          maxHeight: 200,
        }
      }}
      loading={loading}
      loadingText="Loading vendors..."
      noOptionsText={noResultsFound ? "No vendors found" : "Type to search vendors"}
      // IMPORTANT: Removed the disabled prop that was blocking input
      // The component now always allows typing
    />
  );
};

export default VendorSearchAutocomplete;