import { SUPPLIERS } from "@/lib/data/products";
import type { Product } from "@/lib/data/types";

export type StockStatus = "out" | "risk" | "healthy" | "daily";

export const RISK_DAYS = 5;

export const daysRemaining = (p: Product) => (p.dailyVelocity > 0 ? p.stock / p.dailyVelocity : Infinity);

export function stockStatus(p: Product): StockStatus {
  if (p.stock <= 0) return "out";
  if (p.dailyReplenished) return "daily";
  return daysRemaining(p) <= RISK_DAYS ? "risk" : "healthy";
}

export function inventoryHealth(products: Product[]) {
  const healthy = products.filter((p) => ["healthy", "daily"].includes(stockStatus(p))).length;
  return {
    pct: Math.floor((healthy / products.length) * 100),
    healthy,
    risk: products.filter((p) => stockStatus(p) === "risk"),
    out: products.filter((p) => stockStatus(p) === "out"),
  };
}

export interface ReorderSuggestion {
  productId: string;
  name: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  cases: number;
  unitCost: number;
  cost: number;
  daysLeft: number;
  reorderPoint: number;
}

/** Order enough for ~10 days of sales, rounded up to whole cases. */
export function reorderSuggestion(p: Product, coverDays = 10): ReorderSuggestion {
  const need = Math.max(0, p.dailyVelocity * coverDays - p.stock);
  const cases = Math.max(1, Math.ceil(need / p.caseSize));
  const quantity = cases * p.caseSize;
  const supplier = SUPPLIERS.find((s) => s.id === p.supplierId)!;
  return {
    productId: p.id,
    name: p.name,
    supplierId: supplier.id,
    supplierName: supplier.name,
    quantity,
    cases,
    unitCost: p.cost,
    cost: Math.round(quantity * p.cost),
    daysLeft: Math.round(daysRemaining(p) * 10) / 10,
    reorderPoint: Math.ceil(p.dailyVelocity * (p.leadTimeDays + 2)),
  };
}

export function applyStockLines(products: Product[], lines: { productId: string; quantity: number }[]): Product[] {
  return products.map((p) => {
    const add = lines.filter((l) => l.productId === p.id).reduce((s, l) => s + l.quantity, 0);
    return add ? { ...p, stock: p.stock + add, outOfStockDays: undefined, trendPct: p.stock === 0 ? 0 : p.trendPct } : p;
  });
}

export function stockoutDate(p: Product): Date | null {
  const d = daysRemaining(p);
  if (!Number.isFinite(d)) return null;
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(d));
  return date;
}
