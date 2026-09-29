import type { ActionKind, ActionProposal, AgentName, AgentResponse, AgentStage, Lang, StageStep } from "@/lib/agents/types";
import type { DetectedPattern, ExtractedField, InvoiceLine, Obligation, Product } from "@/lib/data/types";
import type { CampaignSnapshot } from "@/lib/simulation/campaign";

export type ScreenName =
  | "home"
  | "galla"
  | "business"
  | "sales"
  | "customers"
  | "customer"
  | "inventory"
  | "cashflow"
  | "campaigns"
  | "campaign"
  | "whatif"
  | "insights"
  | "qr"
  | "beneficiary"
  | "credit"
  | "udhaar"
  | "documents"
  | "catalog"
  | "history"
  | "settings";

export const SCREEN_NAMES: ScreenName[] = ["home", "galla", "business", "sales", "customers", "customer", "inventory", "cashflow", "campaigns", "campaign", "whatif", "insights", "qr", "beneficiary", "credit", "udhaar", "documents", "catalog", "history", "settings"];

export interface Route {
  name: ScreenName;
  params?: Record<string, string>;
}

export interface ChatMessage {
  id: string;
  role: "merchant" | "galla";
  text: string;
  at: number;
  via?: "voice" | "text" | "system";
  response?: AgentResponse;
  kind?: "answer" | "result" | "learning" | "error";
  proposalId?: string;
  campaignId?: string;
  learningId?: string;
}

export type ProposalStatus = "pending" | "approved" | "cancelled" | "failed";

export interface ProposalRecord {
  proposal: ActionProposal;
  status: ProposalStatus;
  messageId: string;
  note?: string;
}

export interface Campaign {
  id: string;
  name: string;
  offerAmount: number;
  audienceSize: number;
  minBill: number;
  message: string;
  channel: string;
  status: "running" | "completed";
  createdAt: number;
  progress: number;
  expected: { returnLow: number; returnHigh: number; salesLow: number; salesHigh: number; roi: number };
  customerOrder: string[];
  auditId?: string;
  learningId?: string;
  seeded?: boolean;
  final?: CampaignSnapshot;
}

export interface PaymentRecord {
  /** Paytm orderId (or a simulated id). */
  id: string;
  amount: number;
  note: string;
  status: "TXN_SUCCESS" | "TXN_FAILURE" | "PENDING";
  source: "paytm-staging" | "simulated";
  txnId?: string;
  paymentMode?: string;
  at: number;
}

export interface AuditEntry {
  id: string;
  at: number;
  kind: ActionKind | "transfer_blocked" | "transfer_override" | "pattern_confirmed" | "payment_received";
  agent: AgentName;
  what: string;
  why: string;
  expected: string;
  approvedBy: "Merchant";
  status: "Running" | "Completed" | "Done" | "Scheduled" | "Ready to send" | "Blocked" | "Proceeded with warning";
  result?: string;
  route?: Route;
}

export interface Learning {
  id: string;
  at: number;
  title: string;
  expected: string;
  actual: string;
  difference: string;
  learning: string;
  applied: string;
  outcome: "better" | "worse" | "as expected";
}

export interface Reminder {
  id: string;
  title: string;
  note: string;
  dueInDays: number;
  done: boolean;
  at: number;
}

export interface SupplierOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  lines: { productId: string; name: string; quantity: number; unitCost: number }[];
  total: number;
  status: "Ready to send" | "Shared with supplier";
  at: number;
}

export interface CatalogItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  category: string;
  published: boolean;
  source: "inventory" | "voice";
  productId?: string;
}

export interface DocumentRecord {
  id: string;
  sampleId?: string;
  at: number;
  source: "sample" | "upload";
  fileName?: string;
  /** engine: "demo" for sample templates, otherwise the provider and model that read the file. */
  extracted?: { kind: string; title: string; fields: ExtractedField[]; lineItems: InvoiceLine[]; inconsistencies: string[]; engine: string };
  appliedToStock: boolean;
}

export interface Toast {
  id: string;
  text: string;
  tone: "good" | "info" | "bad";
}

export interface DemoState {
  status: "idle" | "playing" | "paused" | "finished";
  step: number;
  caption?: string;
  highlight?: string;
  campaignSpeed: number;
  finale: boolean;
  total?: number;
}

export interface AppState {
  v: number;
  route: Route;
  stack: Route[];
  chat: ChatMessage[];
  stage: AgentStage;
  thinking: { stages: StageStep[]; index: number; text: string } | null;
  proposals: Record<string, ProposalRecord>;
  campaigns: Campaign[];
  products: Product[];
  obligations: Obligation[];
  patterns: DetectedPattern[];
  reminders: Reminder[];
  supplierOrders: SupplierOrder[];
  catalog: CatalogItem[];
  documents: DocumentRecord[];
  savedInsights: { id: string; title: string; detail: string; at: number }[];
  payments: PaymentRecord[];
  audit: AuditEntry[];
  learnings: Learning[];
  calibration: number;
  lastOffer?: { amount: number; type: "winback" | "storewide" };
  selectedCustomerId?: string;
  blockedTransfers: Record<string, "blocked" | "override">;
  settings: { language: Lang; voiceReplies: boolean; aiMode: "auto" | "demo" };
  notificationsSeen: boolean;
  demo: DemoState;
  toasts: Toast[];
}
