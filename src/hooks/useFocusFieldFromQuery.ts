import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Call this once in a page that has field-level search entries
 * (src/config/searchIndex.manual.ts) pointing at it. When the person
 * arrives via ?focus=<name>, this scrolls the matching element into
 * view and adds a brief highlight class so they can see exactly which
 * field the search brought them to.
 *
 * Works with either:
 *   <input name="hsnCode" />                -> add name="hsnCode" to the field
 *   <div data-field="hsnCode"> ... </div>    -> or wrap with data-field
 *
 * Usage in a page component:
 *   useFocusFieldFromQuery();
 */
export function useFocusFieldFromQuery() {
  const searchParams = useSearchParams();
    const focus = searchParams?.get('focus') ?? null;

  useEffect(() => {
    if (!focus) return;

    // Give the page a tick to finish mounting/rendering its fields.
    const timer = setTimeout(() => {
      const el =
        document.querySelector<HTMLElement>(`[name="${focus}"]`) ||
        document.querySelector<HTMLElement>(`[data-field="${focus}"]`);
      if (!el) return;

      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('search-focus-highlight');
      setTimeout(() => el.classList.remove('search-focus-highlight'), 2200);
    }, 250);

    return () => clearTimeout(timer);
  }, [focus]);
}
