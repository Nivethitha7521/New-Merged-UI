import { generatedSearchIndex } from './searchIndex.generated';
import { manualSearchIndex } from './searchIndex.manual';
import type { SearchIndexItem } from './searchIndex.types';

export type { SearchIndexItem, SearchIndexItemType } from './searchIndex.types';

/** A resolved entry ready for the search UI: one row per real destination. */
export interface ResolvedSearchItem {
  id: string;
  label: string;
  path: string;
  module: string;
  type: 'module' | 'submodule' | 'field';
  focusField?: string;
  /** Every word we should match against, lowercased, built once. */
  haystack: string;
}

const isAllCaps = (s: string) => s === s.toUpperCase() && /[A-Z]/.test(s);

function pickBestLabel(labels: string[]): string {
  const properCase = labels.find((l) => !isAllCaps(l));
  return properCase || labels[0];
}

/**
 * Groups module/submodule entries that point at the same path (the same
 * page is often declared with slightly different labels in different
 * files — nav sidebar vs. tab bar vs. old code). Field entries are kept
 * one-per-row since several fields legitimately share a page path.
 */
function buildIndex(): ResolvedSearchItem[] {
  const raw: SearchIndexItem[] = [...generatedSearchIndex, ...manualSearchIndex];

  const fieldItems = raw.filter((r) => r.type === 'field');
  const navItems = raw.filter((r) => r.type !== 'field');

  const groups = new Map<string, SearchIndexItem[]>();
  for (const item of navItems) {
    const list = groups.get(item.path) || [];
    list.push(item);
    groups.set(item.path, list);
  }

  const resolvedNav: ResolvedSearchItem[] = [];
  for (const [itemPath, items] of groups) {
    const labels = items.map((i) => i.label);
    const bestLabel = pickBestLabel(labels);
    const isModule = items.some((i) => i.type === 'module');
    const moduleName = items[0].module;
    const keywordSet = new Set<string>();
    items.forEach((i) => {
      keywordSet.add(i.label.toLowerCase());
      (i.keywords || []).forEach((k) => keywordSet.add(k.toLowerCase()));
    });
    keywordSet.add(moduleName.toLowerCase());

    resolvedNav.push({
      id: `entry:${itemPath}`,
      label: bestLabel,
      path: itemPath,
      module: moduleName,
      type: isModule ? 'module' : 'submodule',
      haystack: Array.from(keywordSet).join(' '),
    });
  }

  const resolvedFields: ResolvedSearchItem[] = fieldItems.map((f) => {
    const keywordSet = new Set<string>([f.label.toLowerCase(), f.module.toLowerCase()]);
    (f.keywords || []).forEach((k) => keywordSet.add(k.toLowerCase()));
    return {
      id: f.id,
      label: f.label,
      path: f.path,
      module: f.module,
      type: 'field',
      focusField: f.focusField,
      haystack: Array.from(keywordSet).join(' '),
    };
  });

  // Modules first, then submodules, then fields — a sane default order
  // before relevance scoring is applied.
  const rank = { module: 0, submodule: 1, field: 2 } as const;
  return [...resolvedNav, ...resolvedFields].sort((a, b) => rank[a.type] - rank[b.type]);
}

/**
 * Built once when this module is first imported (not on every render or
 * every keystroke) — this is what keeps search instant with zero risk of
 * "API down" style failures: there is no request, just an in-memory array.
 */
export const searchIndex: ResolvedSearchItem[] = buildIndex();
