import { SEED_OBLIGATIONS, SEED_PATTERNS } from "@/lib/data/finance";
import { SEED_PRODUCTS } from "@/lib/data/products";
import type { AgentContext } from "./types";

export function defaultContext(): AgentContext {
  return {
    products: SEED_PRODUCTS,
    obligations: SEED_OBLIGATIONS,
    patterns: SEED_PATTERNS,
    documentIds: ["doc-bank", "doc-udyam"],
    appliedInvoiceIds: [],
    campaigns: [],
    returnedCustomerIds: [],
    reminders: [],
    catalogNames: SEED_PRODUCTS.map((p) => p.name),
    calibration: 1,
    preferredLanguage: "kn",
  };
}

const arr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback);

/** Accept a client-supplied context defensively; anything malformed falls back to seed data. */
export function sanitizeContext(raw: unknown): AgentContext {
  const d = defaultContext();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Partial<AgentContext>;
  const products = arr(r.products, d.products).filter((p) => p && typeof p.id === "string" && typeof p.stock === "number" && typeof p.dailyVelocity === "number");
  return {
    products: products.length ? products : d.products,
    obligations: arr(r.obligations, d.obligations).filter((o) => o && typeof o.amount === "number"),
    patterns: arr(r.patterns, d.patterns),
    documentIds: arr<string>(r.documentIds, d.documentIds).filter((x) => typeof x === "string"),
    appliedInvoiceIds: arr<string>(r.appliedInvoiceIds, []).filter((x) => typeof x === "string"),
    campaigns: arr(r.campaigns, []),
    returnedCustomerIds: arr<string>(r.returnedCustomerIds, []).filter((x) => typeof x === "string"),
    reminders: arr(r.reminders, []),
    catalogNames: arr<string>(r.catalogNames, d.catalogNames),
    lastOffer: r.lastOffer,
    calibration: typeof r.calibration === "number" && r.calibration > 0 && r.calibration < 3 ? r.calibration : 1,
    preferredLanguage: r.preferredLanguage === "hi" || r.preferredLanguage === "en" ? r.preferredLanguage : "kn",
  };
}
