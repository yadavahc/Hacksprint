import type { ObligationKind, RiskLevel } from "@/lib/data/types";
import type { RiskAssessment } from "@/lib/risk/riskEngine";
import type { CashPosition, MandatePrediction } from "@/lib/cashflow/cashflow";
import type { Readiness } from "@/lib/credit/readiness";
import type { StorewideSimulation, WinbackSimulation } from "@/lib/simulation/whatIf";

/** kn = Kannada / Kanglish, hi = Hindi / Hinglish, en = English. Replies are romanised for kn/hi. */
export type Lang = "kn" | "hi" | "en";

export type Intent =
  | "briefing"
  | "sales_decline"
  | "customers_at_risk"
  | "simulate_offer"
  | "create_campaign"
  | "campaign_status"
  | "stock_runout"
  | "invoice_update"
  | "cash_available"
  | "add_obligation"
  | "mandate_risk"
  | "qr_safety"
  | "beneficiary_check"
  | "credit_readiness"
  | "catalog_add"
  | "help";

export const INTENTS: Intent[] = [
  "briefing", "sales_decline", "customers_at_risk", "simulate_offer", "create_campaign", "campaign_status",
  "stock_runout", "invoice_update", "cash_available", "add_obligation", "mandate_risk", "qr_safety",
  "beneficiary_check", "credit_readiness", "catalog_add", "help",
];

export type AgentName = "Growth" | "Inventory" | "Cashflow" | "Safety" | "Credit Readiness" | "Digitalization" | "Orchestrator";

export type AgentStage =
  | "IDLE"
  | "LISTENING"
  | "UNDERSTANDING"
  | "ANALYZING"
  | "PREDICTING"
  | "PLANNING"
  | "WAITING_FOR_APPROVAL"
  | "EXECUTING"
  | "LEARNING";

export interface Entities {
  amount?: number;
  offerType?: "winback" | "storewide";
  dueInDays?: number;
  dayLabel?: string;
  recurring?: boolean;
  obligationKind?: ObligationKind;
  payee?: string;
  productName?: string;
  quantity?: number;
  qrId?: string;
  beneficiaryId?: string;
}

export interface IntentResult {
  intent: Intent;
  confidence: number;
  entities: Entities;
  language: Lang;
  source: "rules" | "llm";
}

export interface Evidence {
  label: string;
  value: string;
  tone?: "down" | "up" | "neutral" | "warn";
}

export type Card =
  | { type: "briefing"; items: { id: string; title: string; detail: string; tone: "bad" | "warn" | "info"; prompt: string }[] }
  | { type: "insight"; title: string; metric: { label: string; value: string; tone: "down" | "up" | "neutral" }; evidence: Evidence[]; why: string[] }
  | { type: "customers"; count: number; highValue: number; monthlyValue: number; drivers: { label: string; count: number }[]; sample: { id: string; name: string; lastPurchaseDaysAgo: number; reason: string }[] }
  | { type: "simulation"; sim: WinbackSimulation | StorewideSimulation }
  | { type: "campaign"; campaignId: string }
  | { type: "cashflow"; position: CashPosition }
  | { type: "mandate"; prediction: MandatePrediction }
  | { type: "stock"; items: { productId: string; name: string; stock: number; daysLeft: number | null; status: "out" | "risk"; note: string }[] }
  | { type: "risk"; subjectKind: "qr" | "beneficiary"; subjectId: string; title: string; subtitle: string; assessment: RiskAssessment }
  | { type: "credit"; readiness: Readiness }
  | { type: "invoice"; documentId: string }
  | { type: "catalog"; item: { name: string; price: number; stock: number; unit: string; category: string } }
  | { type: "obligation"; title: string; amount: number; dueLabel: string; recurring: boolean; note?: string }
  | { type: "capabilities" }
  | { type: "cta"; buttons: { label: string; prompt?: string; route?: string }[] };

export type ActionPayload =
  | { kind: "create_campaign"; offerAmount: number; audienceSize: number; minBill: number; channel: string; message: string; returnLow: number; returnHigh: number; salesLow: number; salesHigh: number; roi: number }
  | { kind: "update_inventory"; documentId: string; lines: { productId: string; name: string; quantity: number }[] }
  | { kind: "create_reminder"; title: string; dueInDays: number; note: string }
  | { kind: "record_obligation"; title: string; obligationKind: ObligationKind; amount: number; dueInDays: number; recurring: boolean; patternId?: string }
  | { kind: "prepare_supplier_order"; supplierId: string; supplierName: string; lines: { productId: string; name: string; quantity: number; unitCost: number }[]; total: number }
  | { kind: "create_catalog_item"; name: string; price: number; stock: number; unit: string; category: string }
  | { kind: "save_insight"; title: string; detail: string };

export type ActionKind = ActionPayload["kind"];

export interface ActionProposal {
  id: string;
  agent: AgentName;
  title: string;
  summary: string;
  why: string;
  expected: string;
  payload: ActionPayload;
  editable: boolean;
}

export interface StageStep {
  stage: AgentStage;
  detail: string;
}

export interface AgentResponse {
  id: string;
  intent: Intent;
  agent: AgentName;
  language: Lang;
  message: string;
  cards: Card[];
  proposal?: ActionProposal;
  confidence: number;
  confidenceLabel: "Likely" | "Estimated" | "Based on current data" | "Not enough data to be certain" | "Confirmed";
  uncertainty?: string;
  followUps: string[];
  stages: StageStep[];
  facts: Record<string, string | number>;
  source: "rules" | "llm";
  intentSource: "rules" | "llm";
  /** Provider and model that phrased the answer, e.g. "Groq · openai/gpt-oss-120b". */
  model?: string;
  riskLevel?: RiskLevel;
}

/** Compact, serialisable view of mutable merchant state that agents reason over. */
export interface AgentContext {
  products: import("@/lib/data/types").Product[];
  obligations: import("@/lib/data/types").Obligation[];
  patterns: import("@/lib/data/types").DetectedPattern[];
  documentIds: string[];
  appliedInvoiceIds: string[];
  campaigns: { id: string; status: "running" | "completed"; offerAmount: number; audienceSize: number; progress: number; returned: number; sales: number }[];
  returnedCustomerIds: string[];
  reminders: { title: string }[];
  catalogNames: string[];
  lastOffer?: { amount: number; type: "winback" | "storewide" };
  calibration: number;
  preferredLanguage: Lang;
}
