// utils/filterChecks.ts

import { ReportConfig } from '../types';

/**
 * Checks if the Fiscal Year filter specifically has a value selected.
 * This is separate from the general 'isAnyFilterSelected' logic.
 */
export const checkIsFiscalYearSelected = <T,>(
  filters: Record<string, string[]>,
  config: ReportConfig<T>
): boolean => {
  // 1. Find the filter definition that has type 'year'
  const yearFilterConfig = config.filters.find((f) => f.type === 'year');

  // 2. If there is no 'year' filter defined in the config, 
  // we assume it doesn't need to be checked, so return true.
  if (!yearFilterConfig) {
    return true;
  }

  // 3. Check if that specific filter has any values selected in the state
  const yearValues = filters[yearFilterConfig.apiParam];

  return Array.isArray(yearValues) && yearValues.length > 0;
};