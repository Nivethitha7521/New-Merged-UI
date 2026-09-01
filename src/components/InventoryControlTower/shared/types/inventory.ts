export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type OutletStatus = "healthy" | "warning" | "critical" | "offline";

export interface OutletSummary {
  id: string;
  name: string;
  code: string;
  stockValue: number;
  pendingReceipts: number;
  varianceQty: number;
  health: number;
  status: OutletStatus;
  lastSync: string;
}

export interface ExceptionItem {
  id: string;
  severity: Severity;
  type: string;
  outlet: string;
  product: string;
  details: string;
  time: string;
  status: string;
}

export interface ProductRow {
  name: string;
  category: string;
  opening: number;
  received: number;
  outward: number;
  wastage: number;
  returns: number;
  expected: number;
  physical: number;
  variance: number;
  status: string;
}
