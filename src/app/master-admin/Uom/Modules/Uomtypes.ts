


// ─── Shared UOM types ─────────────────────────────────────────────────────────
// Single source of truth — import from here in all UOM components & slice.

export interface UomState {
  id: string | null;
  measurementType: string | null;
  uom: string | null;
  precision: number | null;
  displayFormat: string | null;
  status: string;
  uomId: string | null;
  editStatus: boolean;
}

export interface ValidationErrors {
  measurementType: string;
  uom: string;
  precision: string;
}

export type DialogMode = 'add' | 'edit' | 'none';
export type ActionType = 'activate' | 'deactivate' | null;

// ─── Pure helpers (no React dependency) ───────────────────────────────────────

/** Returns "0" for precision 0, "0.000…" for precision N, "N/A" for null. */
export const getDisplayFormat = (precision: number | null): string => {
  if (precision === null) return 'N/A';
  const p = Number(precision);
  if (isNaN(p) || p < 0) return 'Invalid';
  return p === 0 ? '0' : `0.${'0'.repeat(p)}`;
};

/** Returns the computed displayFormat string from a precision value. */
export const buildDisplayFormat = (precision: number): string =>
  precision === 0 ? '0' : `0.${'0'.repeat(precision)}`;

/** Strips illegal chars and caps at 30 for UOM / Measurement Type text fields. */
export const sanitizeTextField = (value: string): string =>
  value.replace(/[^a-zA-Z\s\-.,]/g, '').slice(0, 30);

/** True when value has no letter (used for error state). */
export const lacksLetter = (value: string): boolean =>
  !!value && !/[a-zA-Z]/.test(value);