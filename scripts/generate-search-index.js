/**
 * generate-search-index.js
 * ------------------------------------------------------------------
 * Scans src/app + src/components for every { text/label: '...', path: '/...' }
 * pair already declared in the codebase (SideMenu files, ModuleNavigationTabs,
 * layout.tsx tab bars, page.tsx tab arrays, reports Sidebar, etc.) and writes
 * a single static file: src/config/searchIndex.generated.ts
 *
 * Why this approach instead of hitting an API at runtime:
 *  - Zero network calls -> search can never be "slow" or "go down".
 *  - The index is just a plain array shipped in the JS bundle, so lookups
 *    are pure in-memory string comparisons (sub-millisecond even at 1000+ items).
 *  - Because it's generated FROM the actual route/label declarations, it can
 *    never drift out of sync the way a hand-maintained list would.
 *
 * Run it:  node scripts/generate-search-index.js
 * Re-run it any time you add/rename a module, submodule, or tab. Review the
 * diff, then commit searchIndex.generated.ts like any other source file.
 *
 * NOTE: This is intentionally a "best effort" extractor, not a compiler.
 * It uses a bounded-window regex so it can tolerate an <Icon /> or other
 * prop sitting between `text`/`label` and `path` inside the same object
 * literal. It will occasionally need a manual nudge (see MANUAL_EXTRA below)
 * for entries that live inside dynamic logic (query-param tabs, etc.)
 * rather than a plain array literal.
 * ------------------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');

const SRC_ROOT = path.join(__dirname, '..', 'src');
const SCAN_DIRS = ['app', 'components'].map((d) => path.join(SRC_ROOT, d));
const OUT_FILE = path.join(SRC_ROOT, 'config', 'searchIndex.generated.ts');

// Directories we never want to walk into.
const SKIP_DIR_NAMES = new Set(['node_modules', '.next', 'Models', 'Hooks', 'Features', 'Utils', 'Utilities']);

/** Entries that exist in the UI but aren't a simple array literal in source
 *  (e.g. built from permissions logic, or a tab whose label is computed).
 *  Add to this list by hand when the auto-scan misses something real. */
const MANUAL_EXTRA = [
  { label: 'Master Admin', path: '/master-admin', module: 'Master Admin', type: 'module' },
  { label: 'YEN POS', path: '/yen-pos', module: 'YEN POS', type: 'module' },
  { label: 'WhatsApp', path: '/WhatsApp', module: 'WhatsApp', type: 'module' },
  { label: 'YEN Purchase', path: '/yen-purchase', module: 'YEN Purchase', type: 'module' },
  { label: 'YEN Inventory', path: '/yen-inventory', module: 'YEN Inventory', type: 'module' },
  { label: 'YEN Recipe', path: '/yen-recipie/RecipeManagement', module: 'YEN Recipe', type: 'module' },
  { label: 'YEN Book', path: '/yen-book', module: 'YEN Book', type: 'module' },
  { label: 'YEN Reports', path: '/QlikReport', module: 'YEN Reports', type: 'module' },
  { label: 'Account Settings', path: '/account-settings', module: 'Account Settings', type: 'module' },
  { label: 'Settings', path: '/yen-settings', module: 'Settings', type: 'module' },
];

/** Human module-group name derived from the first path segment. */
function moduleFromPath(p) {
  const seg = p.split('/').filter(Boolean)[0] || '';
  const MAP = {
    'yen-purchase': 'YEN Purchase',
    'yen-book': 'YEN Book',
    'yen-inventory': 'YEN Inventory',
    'yen-recipie': 'YEN Recipe',
    'yen-pos': 'YEN POS',
    'master-admin': 'Master Admin',
    'account-settings': 'Account Settings',
    QlikReport: 'YEN Reports',
    WhatsApp: 'WhatsApp',
    'yen-settings': 'Settings',
  };
  return MAP[seg] || seg;
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry.name)) continue;
      walk(path.join(dir, entry.name), files);
    } else if (/\.(tsx|jsx)$/.test(entry.name)) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

/**
 * Finds every balanced `{ ... }` span in the file, then keeps only the
 * "leaf" spans (no further `{` nested inside them). For the object-literal
 * arrays this codebase uses for menus/tabs, a leaf span is exactly one
 * `{ text: '...', path: '...' }` entry — so scanning inside a leaf span
 * for text/label + path can never accidentally pick up a sibling object's
 * path (the bug a flat bounded-window regex was prone to).
 */
function findLeafBraceBlocks(content) {
  const spans = [];
  const stack = [];
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '{') {
      stack.push(i);
    } else if (ch === '}') {
      const start = stack.pop();
      if (start !== undefined) spans.push([start, i]);
    }
  }
  return spans
    .filter(([start, end]) => content.slice(start + 1, end).indexOf('{') === -1)
    .map(([start, end]) => content.slice(start, end + 1));
}

function extractFromFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.warn(`Skipping unreadable file: ${filePath} (${err.code})`);
    return [];
  }
  const found = [];
  const leafBlocks = findLeafBraceBlocks(content);
  const labelRe = /\b(?:text|label)\s*:\s*['"]([^'"]+)['"]/;
  const pathRe = /\bpath\s*:\s*['"](\/[^'"]+)['"]/;

  for (const block of leafBlocks) {
    const labelMatch = block.match(labelRe);
    const pathMatch = block.match(pathRe);
    if (labelMatch && pathMatch) {
      found.push({ label: labelMatch[1].trim(), path: pathMatch[1].trim(), file: filePath });
    }
  }

  return found;
}

function main() {
  let all = [];
  for (const dir of SCAN_DIRS) all = all.concat(walk(dir));

  let extracted = [];
  for (const file of all) {
    extracted = extracted.concat(extractFromFile(file));
  }

  // dedupe by label+path, prefer the first occurrence
  const seen = new Set();
  const deduped = [];
  for (const item of extracted) {
    const key = `${item.label}::${item.path}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  const combined = [
    ...MANUAL_EXTRA.map((e) => ({ ...e })),
    ...deduped.map((e) => ({
      label: e.label,
      path: e.path,
      module: moduleFromPath(e.path),
      type: 'submodule',
    })),
  ];

  // final dedupe across MANUAL_EXTRA + scanned, path wins as unique key when
  // label is identical; keep both if labels differ (e.g. two tabs pointing
  // at slightly different labels for legacy reasons is rare but possible).
  const finalSeen = new Set();
  const finalItems = [];
  for (const item of combined) {
    const key = `${item.label}::${item.path}`;
    if (finalSeen.has(key)) continue;
    finalSeen.add(key);
    finalItems.push(item);
  }

  finalItems.sort((a, b) => a.path.localeCompare(b.path));

  const header = `/**
 * AUTO-GENERATED by scripts/generate-search-index.js
 * Do not hand-edit the array below — re-run the script instead.
 * Generated: ${new Date().toISOString()}
 *
 * To add field-level search entries (specific form fields inside a page),
 * add them to src/config/searchIndex.manual.ts instead, with type: 'field'.
 */
import type { SearchIndexItem } from './searchIndex.types';

export const generatedSearchIndex: SearchIndexItem[] = ${JSON.stringify(
    finalItems.map((i) => ({ ...i, id: `${i.type}:${i.path}:${i.label}` })),
    null,
    2
  )};
`;

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, header, 'utf8');
  console.log(`Wrote ${finalItems.length} entries to ${path.relative(process.cwd(), OUT_FILE)}`);
}

main();
