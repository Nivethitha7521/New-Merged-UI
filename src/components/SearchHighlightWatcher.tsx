'use client';
import { useEffect, useRef } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

/**
 * Mount this ONCE, app-wide (in ClientLayout.tsx). It never renders
 * anything — it just watches the URL for two query params that
 * GlobalSearch sets when it navigates:
 *
 *   ?highlight=<visible text>   -> a data record from Global Search's
 *                                  record search (e.g. a UOM named "brx2")
 *   ?focus=<field name>         -> a specific form field from Global
 *                                  Search's field search
 *
 * and finds + highlights the matching element by scanning the DOM that's
 * already on screen — NOT by requiring every table/page component to add
 * a data-attribute or call a hook. With 50+ tables in the app, needing a
 * per-component change for each one isn't realistic; this watcher works
 * identically everywhere without touching a single table file.
 *
 * How the row match works: it looks for a table cell (or any leaf element,
 * as a fallback for non-table layouts) whose visible text is an exact,
 * case-insensitive match for the `highlight` value — which is always the
 * record's own label, so it's guaranteed to be sitting in a cell somewhere
 * once that record's data has loaded. It polls for up to ~5 seconds because
 * a table's data often finishes loading (Redux fetch) slightly after the
 * page itself has mounted.
 */

const MAX_ATTEMPTS = 25; // ~5s total at 200ms apart
const POLL_INTERVAL_MS = 200;
const INITIAL_DELAY_MS = 300;
const HIGHLIGHT_DURATION_MS = 2900;

function findRowByVisibleText(value: string): HTMLElement | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  // Primary case: standard <table> markup (MUI Table, plain <table>, etc.)
  const cells = document.querySelectorAll<HTMLElement>('td, th');
  for (const cell of Array.from(cells)) {
    const text = (cell.textContent || '').trim().toLowerCase();
    if (text === normalized) {
      return (cell.closest('tr') as HTMLElement) || cell;
    }
  }

  // Fallback: card/list layouts with no <table> — match a leaf element
  // (no element children) whose own text equals the value.
  const candidates = document.querySelectorAll<HTMLElement>('span, div, p, li, a, button');
  for (const el of Array.from(candidates)) {
    if (el.children.length > 0) continue;
    const text = (el.textContent || '').trim().toLowerCase();
    if (text === normalized) {
      return el;
    }
  }

  return null;
}

function findFieldByName(name: string): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>(`[name="${name}"]`) ||
    document.querySelector<HTMLElement>(`[data-field="${name}"]`)
  );
}

export default function SearchHighlightWatcher() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
const highlight = searchParams?.get('highlight') ?? null;
const focus = searchParams?.get('focus') ?? null;
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!highlight && !focus) return;

    let cancelled = false;
    attemptsRef.current = 0;

    const applyHighlight = (el: HTMLElement, className: string) => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add(className);
      setTimeout(() => el.classList.remove(className), HIGHLIGHT_DURATION_MS);
    };

    const tryFind = () => {
      if (cancelled) return;

      const rowTarget = highlight ? findRowByVisibleText(highlight) : null;
      const fieldTarget = focus ? findFieldByName(focus) : null;

      if (rowTarget) applyHighlight(rowTarget, 'search-row-highlight');
      if (fieldTarget) applyHighlight(fieldTarget, 'search-focus-highlight');

      const stillLooking = (highlight && !rowTarget) || (focus && !fieldTarget);
      if (stillLooking) {
        attemptsRef.current += 1;
        if (attemptsRef.current < MAX_ATTEMPTS) {
          setTimeout(tryFind, POLL_INTERVAL_MS);
        }
      }
    };

    const initialTimer = setTimeout(tryFind, INITIAL_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
    };
    // Re-run whenever the destination changes (new search, new page) —
    // pathname is included so navigating to the SAME query params on a
    // different page (rare, but possible) still re-triggers the scan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight, focus, pathname]);

  return null;
}
