import { ExceptionItem, OutletSummary, ProductRow } from "@/components/InventoryControlTower/shared/types/inventory";

export const outlets: OutletSummary[] = [
  { id: "1", name: "SB Outlet", code: "SB", stockValue: 482300, pendingReceipts: 2, varianceQty: -2, health: 96, status: "healthy", lastSync: "2 mins ago" },
  { id: "2", name: "BN1 Outlet", code: "BN1", stockValue: 368450, pendingReceipts: 1, varianceQty: -24, health: 78, status: "warning", lastSync: "4 mins ago" },
  { id: "3", name: "RS Outlet", code: "RS", stockValue: 294600, pendingReceipts: 2, varianceQty: -31, health: 42, status: "critical", lastSync: "35 mins ago" },
  { id: "4", name: "KK Outlet", code: "KK", stockValue: 511900, pendingReceipts: 0, varianceQty: 3, health: 98, status: "healthy", lastSync: "1 min ago" },
  { id: "5", name: "PMK Outlet", code: "PMK", stockValue: 341250, pendingReceipts: 2, varianceQty: -9, health: 70, status: "warning", lastSync: "6 mins ago" },
];

export const exceptions: ExceptionItem[] = [
  { id: "EX-101", severity: "critical", type: "Negative Stock", outlet: "BN1 Outlet", product: "Milk Bread", details: "Available -7 pcs; minimum 20 pcs", time: "10:25 AM", status: "Unresolved" },
  { id: "EX-102", severity: "critical", type: "Receipt Mismatch", outlet: "RS Outlet", product: "Veg Puff", details: "Dispatched 100 pcs; receipt confirmed 85 pcs", time: "10:20 AM", status: "Unresolved" },
  { id: "EX-103", severity: "high", type: "High Wastage", outlet: "SB Outlet", product: "Brown Bun", details: "25 pcs recorded; above outlet threshold", time: "10:15 AM", status: "Pending Review" },
  { id: "EX-104", severity: "high", type: "Pending Receipt", outlet: "PMK Outlet", product: "Transfer #TRF-125", details: "Receipt not confirmed after 45 minutes", time: "10:10 AM", status: "Pending Action" },
  { id: "EX-105", severity: "medium", type: "Low Stock", outlet: "KK Outlet", product: "Paneer Puff", details: "Current 10 pcs; minimum 20 pcs", time: "10:05 AM", status: "Pending Review" },
];

export const products: ProductRow[] = [
  { name: "Milk Bread", category: "Bakery", opening: 50, received: 100, outward: 120, wastage: 5, returns: 0, expected: 25, physical: 23, variance: -2, status: "Variance" },
  { name: "Brown Bun", category: "Bakery", opening: 40, received: 80, outward: 85, wastage: 3, returns: 2, expected: 30, physical: 30, variance: 0, status: "Normal" },
  { name: "Veg Puff", category: "Snacks", opening: 60, received: 120, outward: 140, wastage: 8, returns: 2, expected: 30, physical: 26, variance: -4, status: "Variance" },
  { name: "Black Forest Cake", category: "Cakes", opening: 10, received: 10, outward: 12, wastage: 1, returns: 0, expected: 7, physical: 7, variance: 0, status: "Normal" },
  { name: "Veg Sandwich", category: "Snacks", opening: 25, received: 50, outward: 60, wastage: 5, returns: 0, expected: 10, physical: 9, variance: -1, status: "Variance" },
  { name: "Orange Juice", category: "Beverages", opening: 30, received: 40, outward: 25, wastage: 0, returns: 0, expected: 45, physical: 46, variance: 1, status: "Excess" },
];

export const inventoryAccuracyTrend = [
  { d: "20 Jul", accuracy: 92.8 },
  { d: "21 Jul", accuracy: 93.6 },
  { d: "22 Jul", accuracy: 94.2 },
  { d: "23 Jul", accuracy: 93.9 },
  { d: "24 Jul", accuracy: 95.1 },
  { d: "25 Jul", accuracy: 95.6 },
  { d: "26 Jul", accuracy: 96.4 },
];
