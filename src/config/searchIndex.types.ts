export type SearchIndexItemType = 'module' | 'submodule' | 'field';

export interface SearchIndexItem {
  /** Stable unique id, e.g. "submodule:/master-admin/Items:Item Master" */
  id: string;
  /** Display label shown in the results dropdown */
  label: string;
  /** Next.js route to navigate to on select */
  path: string;
  /** Parent module group, shown as a secondary line (e.g. "YEN Purchase") */
  module: string;
  /** module = top nav item, submodule = a page/tab under it, field = a specific form field */
  type: SearchIndexItemType;
  /** Optional extra words that should also match this entry (aliases, abbreviations) */
  keywords?: string[];
  /**
   * Optional: for 'field' entries, the id/name of the field to focus/scroll to
   * once the destination page has mounted (the target page should read this
   * from the query string, e.g. ?focus=hsnCode, and scroll+highlight it).
   */
  focusField?: string;
}
