import { runAgent } from "@/lib/agents/orchestrator";
import type { ActionPayload, ActionProposal, AgentResponse, AgentStage, StageStep } from "@/lib/agents/types";
import { SAMPLE_DOCUMENTS, SEED_DOCUMENT_IDS } from "@/lib/data/documents";
import { SEED_OBLIGATIONS, SEED_PATTERNS } from "@/lib/data/finance";
import { formatINR, uid } from "@/lib/data/format";
import { SEED_PRODUCTS } from "@/lib/data/products";
import { applyStockLines } from "@/lib/inventory/inventory";
import { returningCustomerOrder } from "@/lib/simulation/campaign";
import { agentContext, currentCustomers, snapshotOf } from "./selectors";
import type { AppState, AuditEntry, Campaign, CatalogItem, ChatMessage, DemoState, DocumentRecord, Learning, PaymentRecord, Route, Toast } from "./types";

export const STATE_VERSION = 5;
const DAY = 86400000;

function seedCatalog(): CatalogItem[] {
  return SEED_PRODUCTS.map((p, i) => ({
    id: `cat-${p.id}`,
    name: p.name,
    price: p.price,
    stock: p.stock,
    unit: p.unit,
    category: p.category,
    published: i < 20 && p.stock > 0,
    source: "inventory" as const,
    productId: p.id,
  }));
}

function seedHistory(now: number): { campaigns: Campaign[]; audit: AuditEntry[]; learnings: Learning[] } {
  const learning: Learning = {
    id: "lrn-ugadi",
    at: now - 170 * DAY,
    title: "Ugadi festive offer · ₹75 off store-wide",
    expected: "20 extra customers · ₹9,000 sales",
    actual: "16 extra customers · ₹7,400 sales",
    difference: "−4 customers (−20%) · most discounts went to customers who would have come anyway",
    learning: "Store-wide festive discounts leak margin to regular buyers. Targeted offers work better for this store.",
    applied: "Galla now prefers targeted win-back offers over store-wide discounts.",
    outcome: "worse",
  };
  return {
    campaigns: [
      {
        id: "cmp-ugadi",
        name: "Ugadi festive offer",
        offerAmount: 75,
        audienceSize: 120,
        minBill: 750,
        message: "Ugadi habbada shubhashayagalu! ₹75 off on bills above ₹750.",
        channel: "WhatsApp",
        status: "completed",
        createdAt: now - 177 * DAY,
        progress: 1,
        expected: { returnLow: 18, returnHigh: 22, salesLow: 8100, salesHigh: 9900, roi: 1.4 },
        customerOrder: [],
        seeded: true,
        learningId: learning.id,
        final: { day: 7, sent: 120, delivered: 117, opened: 71, returned: 16, redeemed: 41, sales: 7400, cost: 3075, roi: 0.6 },
      },
    ],
    audit: [
      {
        id: "aud-ugadi",
        at: now - 177 * DAY,
        kind: "create_campaign",
        agent: "Growth",
        what: "Campaign created · Ugadi festive offer",
        why: "Festival week",
        expected: "18–22 extra customers",
        approvedBy: "Merchant",
        status: "Completed",
        result: "16 customers · ₹7,400 · ROI 0.6×",
        route: { name: "campaign", params: { id: "cmp-ugadi" } },
      },
      {
        id: "aud-nandini",
        at: now - 2 * DAY,
        kind: "prepare_supplier_order",
        agent: "Inventory",
        what: "Supplier order prepared · Nandini Dairy Booth Supply",
        why: "Curd ran short on the weekend",
        expected: "No weekend stock-outs",
        approvedBy: "Merchant",
        status: "Done",
        result: "Delivered next morning",
      },
    ],
    learnings: [learning],
  };
}

export function createInitialState(): AppState {
  const now = Date.now();
  const history = seedHistory(now);
  const state: AppState = {
    v: STATE_VERSION,
    route: { name: "home" },
    stack: [],
    chat: [],
    stage: "IDLE",
    thinking: null,
    proposals: {},
    campaigns: history.campaigns,
    products: SEED_PRODUCTS.map((p) => ({ ...p })),
    obligations: SEED_OBLIGATIONS.map((o) => ({ ...o })),
    patterns: SEED_PATTERNS.map((p) => ({ ...p })),
    reminders: [],
    supplierOrders: [],
    catalog: seedCatalog(),
    documents: SEED_DOCUMENT_IDS.map((id, i) => ({ id, sampleId: id, at: now - (20 + i * 30) * DAY, source: "sample" as const, appliedToStock: false })),
    savedInsights: [],
    payments: [],
    audit: history.audit,
    learnings: history.learnings,
    calibration: 1,
    blockedTransfers: {},
    settings: { language: "kn", voiceReplies: false, aiMode: "auto" },
    notificationsSeen: false,
    demo: { status: "idle", step: 0, campaignSpeed: 1, finale: false },
    toasts: [],
  };
  const brief = runAgent({ intent: "briefing", confidence: 1, entities: {}, language: "kn", source: "rules" }, agentContext(state));
  state.chat = [{ id: "m-briefing", role: "galla", text: brief.message, at: now, via: "system", response: brief, kind: "answer" }];
  return state;
}

export type Action =
  | { type: "HYDRATE"; state: AppState }
  | { type: "NAVIGATE"; route: Route; replace?: boolean }
  | { type: "BACK" }
  | { type: "MERCHANT_MESSAGE"; message: ChatMessage }
  | { type: "THINKING"; text: string; stages: StageStep[]; index: number }
  | { type: "SET_STAGE"; stage: AgentStage }
  | { type: "GALLA_RESPONSE"; response: AgentResponse }
  | { type: "GALLA_ERROR"; text: string }
  | { type: "EXECUTE_PROPOSAL"; proposalId: string }
  | { type: "EXECUTE_DIRECT"; proposal: ActionProposal }
  | { type: "CANCEL_PROPOSAL"; proposalId: string }
  | { type: "EDIT_PROPOSAL"; proposalId: string; proposal: ActionProposal }
  | { type: "TICK_CAMPAIGNS"; delta: number }
  | { type: "FAST_FORWARD"; campaignId: string }
  | { type: "CONFIRM_PATTERN"; patternId: string }
  | { type: "TOGGLE_REMINDER"; id: string }
  | { type: "SHARE_ORDER"; id: string }
  | { type: "TOGGLE_PUBLISH"; id: string }
  | { type: "ADD_DOCUMENT"; record: DocumentRecord }
  | { type: "TRANSFER_DECISION"; beneficiaryId: string; decision: "blocked" | "override"; title: string }
  | { type: "RECORD_PAYMENT"; payment: PaymentRecord }
  | { type: "SELECT_CUSTOMER"; id: string }
  | { type: "SETTINGS"; settings: Partial<AppState["settings"]> }
  | { type: "NOTIFICATIONS_SEEN" }
  | { type: "DEMO"; demo: Partial<DemoState> }
  | { type: "TOAST"; toast: Toast }
  | { type: "DISMISS_TOAST"; id: string }
  | { type: "RESET"; keepSettings?: boolean };

const sameRoute = (a: Route, b: Route) => a.name === b.name && JSON.stringify(a.params ?? {}) === JSON.stringify(b.params ?? {});

function gallaMessage(text: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  return { id: uid("m"), role: "galla", text, at: Date.now(), kind: "result", ...extra };
}

function audit(entry: Omit<AuditEntry, "id" | "at" | "approvedBy">): AuditEntry {
  return { id: uid("aud"), at: Date.now(), approvedBy: "Merchant", ...entry };
}

/** The Action Engine: validates and executes an approved proposal. Pure — returns new state. */
function execute(state: AppState, proposal: ActionProposal): { state: AppState; result: string; ok: boolean; extra?: Partial<ChatMessage> } {
  const p: ActionPayload = proposal.payload;
  const base = { agent: proposal.agent, why: proposal.why, expected: proposal.expected };
  switch (p.kind) {
    case "create_campaign": {
      if (state.campaigns.some((c) => c.status === "running" && !c.seeded)) return { state, ok: false, result: "A campaign is already running for these customers — I didn't create a duplicate." };
      if (!(p.offerAmount >= 10 && p.offerAmount <= 500) || p.audienceSize <= 0) return { state, ok: false, result: "That campaign looks invalid (offer must be ₹10–₹500). Nothing was created." };
      const id = uid("cmp");
      const entry = audit({ ...base, kind: p.kind, what: `Campaign created · ₹${p.offerAmount} win-back for ${p.audienceSize} customers`, status: "Running", route: { name: "campaign", params: { id } } });
      const campaign: Campaign = {
        id,
        name: `₹${p.offerAmount} win-back · inactive regulars`,
        offerAmount: p.offerAmount,
        audienceSize: p.audienceSize,
        minBill: p.minBill,
        message: p.message,
        channel: p.channel,
        status: "running",
        createdAt: Date.now(),
        progress: 0.001,
        expected: { returnLow: p.returnLow, returnHigh: p.returnHigh, salesLow: p.salesLow, salesHigh: p.salesHigh, roi: p.roi },
        customerOrder: returningCustomerOrder(currentCustomers(state)),
        auditId: entry.id,
      };
      return {
        state: { ...state, campaigns: [campaign, ...state.campaigns], audit: [entry, ...state.audit] },
        ok: true,
        result: `Campaign created for ${p.audienceSize} customers. Sending now via ${p.channel}.`,
        extra: { campaignId: id },
      };
    }
    case "update_inventory": {
      const lines = p.lines.filter((l) => l.quantity > 0 && l.quantity < 10000 && state.products.some((x) => x.id === l.productId));
      if (!lines.length) return { state, ok: false, result: "No matching products were found on that invoice, so stock wasn't changed." };
      const docs: DocumentRecord[] = state.documents.some((d) => (d.sampleId ?? d.id) === p.documentId)
        ? state.documents.map((d) => ((d.sampleId ?? d.id) === p.documentId ? { ...d, appliedToStock: true } : d))
        : [{ id: p.documentId, sampleId: SAMPLE_DOCUMENTS.some((s) => s.id === p.documentId) ? p.documentId : undefined, at: Date.now(), source: "sample", appliedToStock: true }, ...state.documents];
      const products = applyStockLines(state.products, lines);
      const catalog = state.catalog.map((c) => {
        const prod = products.find((x) => x.id === c.productId);
        return prod ? { ...c, stock: prod.stock } : c;
      });
      const summary = lines.map((l) => `+${l.quantity} ${l.name}`).join(", ");
      return {
        state: { ...state, products, catalog, documents: docs, audit: [audit({ ...base, kind: p.kind, what: `Stock updated from invoice · ${lines.length} products`, status: "Done", result: summary, route: { name: "inventory" } }), ...state.audit] },
        ok: true,
        result: `Stock updated: ${summary}.`,
      };
    }
    case "create_reminder": {
      const reminder = { id: uid("rem"), title: p.title, note: p.note, dueInDays: p.dueInDays, done: false, at: Date.now() };
      return {
        state: { ...state, reminders: [reminder, ...state.reminders], audit: [audit({ ...base, kind: p.kind, what: `Reminder set · ${p.title}`, status: "Scheduled" }), ...state.audit] },
        ok: true,
        result: `Reminder set for ${p.dueInDays === 0 ? "today" : p.dueInDays === 1 ? "tomorrow" : `${p.dueInDays} days from now`}: ${p.title}. No money was moved.`,
      };
    }
    case "record_obligation": {
      if (!(p.amount > 0 && p.amount < 10000000)) return { state, ok: false, result: "That amount looks invalid, so nothing was recorded." };
      const patterns = p.patternId ? state.patterns.map((x) => (x.id === p.patternId ? { ...x, confirmed: true } : x)) : state.patterns;
      const ob = {
        id: uid("ob"),
        title: p.title,
        kind: p.obligationKind,
        amount: p.amount,
        dueInDays: p.dueInDays,
        recurring: p.recurring ? ("monthly" as const) : ("once" as const),
        account: "HDFC ••4421" as const,
        source: p.patternId ? ("detected" as const) : ("merchant" as const),
        status: "upcoming" as const,
        createdBy: "Merchant" as const,
      };
      const kindLabel = p.obligationKind === "manual" ? "" : `${p.obligationKind} `;
      return {
        state: { ...state, patterns, obligations: [...state.obligations, ob], audit: [audit({ ...base, kind: p.kind, what: `Obligation recorded · ${p.title} ${formatINR(p.amount)}`, status: "Done", route: { name: "cashflow" } }), ...state.audit] },
        ok: true,
        result: p.patternId ? `Confirmed ${p.title} — ${formatINR(p.amount)} every month. Counted once in your committed money.` : `Added ${formatINR(p.amount)} ${kindLabel}obligation for ${p.dueInDays === 1 ? "tomorrow" : `${p.dueInDays} days from now`}.`,
      };
    }
    case "prepare_supplier_order": {
      const order = { id: uid("po"), supplierId: p.supplierId, supplierName: p.supplierName, lines: p.lines, total: p.total, status: "Ready to send" as const, at: Date.now() };
      return {
        state: { ...state, supplierOrders: [order, ...state.supplierOrders], audit: [audit({ ...base, kind: p.kind, what: `Supplier order prepared · ${p.supplierName}`, status: "Ready to send", result: formatINR(p.total), route: { name: "inventory" } }), ...state.audit] },
        ok: true,
        result: `Order ready for ${p.supplierName}: ${p.lines.map((l) => `${l.quantity} × ${l.name}`).join(", ")} — ${formatINR(p.total)}. Not sent yet; share it from Inventory when you're ready.`,
      };
    }
    case "create_catalog_item": {
      if (!p.name.trim() || p.price <= 0 || p.stock < 0) return { state, ok: false, result: "The item needs a name, a price and stock. Nothing was created." };
      const item: CatalogItem = { id: uid("cat"), name: p.name, price: p.price, stock: p.stock, unit: p.unit, category: p.category, published: true, source: "voice" };
      return {
        state: { ...state, catalog: [item, ...state.catalog], audit: [audit({ ...base, kind: p.kind, what: `Catalog item created · ${p.name}`, status: "Done", result: `₹${p.price} · stock ${p.stock}`, route: { name: "catalog" } }), ...state.audit] },
        ok: true,
        result: `Created catalog item: ${p.name} · ₹${p.price} · Stock ${p.stock}. It's live on your storefront.`,
      };
    }
    case "save_insight": {
      const insight = { id: uid("ins"), title: p.title, detail: p.detail, at: Date.now() };
      return {
        state: { ...state, savedInsights: [insight, ...state.savedInsights], audit: [audit({ ...base, kind: p.kind, what: `Insight saved · ${p.title}`, status: "Done" }), ...state.audit] },
        ok: true,
        result: `Saved insight: ${p.title}.`,
      };
    }
  }
}

function completeCampaign(state: AppState, c: Campaign): AppState {
  const s = snapshotOf({ ...c, progress: 1 });
  const e = c.expected;
  const outcome: Learning["outcome"] = s.returned > e.returnHigh ? "better" : s.returned < e.returnLow ? "worse" : "as expected";
  const learning: Learning = {
    id: uid("lrn"),
    at: Date.now(),
    title: c.name,
    expected: `${e.returnLow}–${e.returnHigh} customers · ${formatINR(e.salesLow)}–${formatINR(e.salesHigh)} · ROI ~${e.roi}×`,
    actual: `${s.returned} customers · ${formatINR(s.sales)} · ROI ${s.roi}×`,
    difference:
      outcome === "better"
        ? `+${s.returned - e.returnHigh} customers above the top of the estimate · ROI +${Math.round((s.roi - e.roi) * 10) / 10}×`
        : outcome === "worse"
          ? `${s.returned - e.returnLow} customers below the estimate`
          : "Within the estimated range",
    learning: "Regulars who stopped after the atta stock-out came back fastest, and 10 AM messages got 82% opens. Baskets were a little smaller (₹414 vs ₹525).",
    applied: outcome === "better" ? "Future win-back estimates for regulars now assume a higher response rate (×1.3)." : "Estimates unchanged.",
    outcome,
  };
  const campaigns = state.campaigns.map((x) => (x.id === c.id ? { ...x, progress: 1, status: "completed" as const, learningId: learning.id } : x));
  const auditList = state.audit.map((a) => (a.id === c.auditId ? { ...a, status: "Completed" as const, result: `${s.returned} customers · ${formatINR(s.sales)} · ROI ${s.roi}×` } : a));
  const msg = gallaMessage(outcome === "better" ? "LEARNING COMPLETE — This campaign performed better than expected." : "LEARNING COMPLETE — Campaign finished.", { kind: "learning", learningId: learning.id, campaignId: c.id });
  return {
    ...state,
    campaigns,
    audit: auditList,
    learnings: [learning, ...state.learnings],
    calibration: outcome === "better" ? 1.3 : state.calibration,
    chat: [...state.chat, msg],
    stage: "LEARNING",
    toasts: [...state.toasts, { id: uid("t"), text: "Campaign complete — Galla learned from the result", tone: "good" }],
  };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "NAVIGATE": {
      if (sameRoute(state.route, action.route)) return state;
      return { ...state, route: action.route, stack: action.replace ? state.stack : [...state.stack.slice(-20), state.route] };
    }
    case "BACK": {
      const prev = state.stack[state.stack.length - 1];
      return { ...state, route: prev ?? { name: "home" }, stack: state.stack.slice(0, -1) };
    }
    case "MERCHANT_MESSAGE":
      return { ...state, chat: [...state.chat, action.message], stage: "UNDERSTANDING" };
    case "THINKING":
      return { ...state, thinking: { text: action.text, stages: action.stages, index: action.index }, stage: action.stages[action.index]?.stage ?? "ANALYZING" };
    case "SET_STAGE":
      return { ...state, stage: action.stage };
    case "GALLA_RESPONSE": {
      const r = action.response;
      const msg: ChatMessage = { id: uid("m"), role: "galla", text: r.message, at: Date.now(), response: r, kind: "answer", proposalId: r.proposal?.id };
      const proposals = r.proposal ? { ...state.proposals, [r.proposal.id]: { proposal: r.proposal, status: "pending" as const, messageId: msg.id } } : state.proposals;
      // Only one pending proposal at a time: older pending ones are superseded.
      if (r.proposal) for (const [id, rec] of Object.entries(proposals)) if (id !== r.proposal.id && rec.status === "pending") proposals[id] = { ...rec, status: "cancelled", note: "Superseded by a newer plan" };
      const lastOffer = r.intent === "simulate_offer" || r.intent === "create_campaign" ? (r.cards.find((c) => c.type === "simulation") as Extract<typeof r.cards[number], { type: "simulation" }> | undefined) : undefined;
      return {
        ...state,
        chat: [...state.chat, msg],
        proposals,
        thinking: null,
        stage: r.proposal ? "WAITING_FOR_APPROVAL" : "IDLE",
        lastOffer: lastOffer ? (lastOffer.sim.type === "winback" ? { amount: lastOffer.sim.offerAmount, type: "winback" } : { amount: lastOffer.sim.discount, type: "storewide" }) : state.lastOffer,
      };
    }
    case "GALLA_ERROR":
      return { ...state, thinking: null, stage: "IDLE", chat: [...state.chat, gallaMessage(action.text, { kind: "error" })] };
    case "EXECUTE_PROPOSAL": {
      const rec = state.proposals[action.proposalId];
      if (!rec || rec.status !== "pending") return { ...state, stage: "IDLE" };
      const out = execute(state, rec.proposal);
      return {
        ...out.state,
        proposals: { ...out.state.proposals, [action.proposalId]: { ...rec, status: out.ok ? "approved" : "failed", note: out.result } },
        chat: [...out.state.chat, gallaMessage(out.result, { kind: out.ok ? "result" : "error", proposalId: action.proposalId, ...out.extra })],
        stage: "IDLE",
      };
    }
    case "EXECUTE_DIRECT": {
      const out = execute(state, action.proposal);
      return { ...out.state, stage: "IDLE", toasts: [...out.state.toasts, { id: uid("t"), text: out.result, tone: out.ok ? "good" : "bad" }] };
    }
    case "CANCEL_PROPOSAL": {
      const rec = state.proposals[action.proposalId];
      if (!rec) return state;
      return {
        ...state,
        proposals: { ...state.proposals, [action.proposalId]: { ...rec, status: "cancelled", note: "Cancelled by you" } },
        chat: [...state.chat, gallaMessage("Okay, cancelled. Nothing was changed.", { kind: "result", proposalId: action.proposalId })],
        stage: "IDLE",
      };
    }
    case "EDIT_PROPOSAL": {
      const rec = state.proposals[action.proposalId];
      if (!rec || rec.status !== "pending") return state;
      return { ...state, proposals: { ...state.proposals, [action.proposalId]: { ...rec, proposal: action.proposal } } };
    }
    case "TICK_CAMPAIGNS": {
      let next = state;
      for (const c of state.campaigns) {
        if (c.status !== "running") continue;
        const progress = Math.min(1, c.progress + action.delta * state.demo.campaignSpeed);
        next = progress >= 1 ? completeCampaign(next, c) : { ...next, campaigns: next.campaigns.map((x) => (x.id === c.id ? { ...x, progress } : x)) };
      }
      return next;
    }
    case "FAST_FORWARD": {
      const c = state.campaigns.find((x) => x.id === action.campaignId && x.status === "running");
      return c ? completeCampaign(state, c) : state;
    }
    case "CONFIRM_PATTERN": {
      const pat = state.patterns.find((p) => p.id === action.patternId);
      if (!pat || pat.confirmed) return state;
      const today = new Date();
      const target = new Date(today.getFullYear(), today.getMonth() + (today.getDate() >= pat.dayOfMonth ? 1 : 0), pat.dayOfMonth);
      const dueInDays = Math.max(1, Math.round((target.getTime() - new Date(today.toDateString()).getTime()) / DAY));
      return {
        ...state,
        patterns: state.patterns.map((p) => (p.id === pat.id ? { ...p, confirmed: true } : p)),
        obligations: [...state.obligations, { id: uid("ob"), title: `${pat.title} · ${pat.payee}`, kind: pat.kind, amount: pat.amount, dueInDays, recurring: "monthly", account: "HDFC ••4421", source: "detected", status: "upcoming", createdBy: "Merchant" }],
        audit: [audit({ kind: "pattern_confirmed", agent: "Cashflow", what: `Recurring payment confirmed · ${pat.title} ${formatINR(pat.amount)}`, why: pat.evidence, expected: "Counted once in committed money", status: "Done", route: { name: "cashflow" } }), ...state.audit],
        toasts: [...state.toasts, { id: uid("t"), text: `${pat.title} confirmed — counted once`, tone: "good" }],
      };
    }
    case "TOGGLE_REMINDER":
      return { ...state, reminders: state.reminders.map((r) => (r.id === action.id ? { ...r, done: !r.done } : r)) };
    case "SHARE_ORDER":
      return {
        ...state,
        supplierOrders: state.supplierOrders.map((o) => (o.id === action.id ? { ...o, status: "Shared with supplier" } : o)),
        toasts: [...state.toasts, { id: uid("t"), text: "Order shared with supplier (simulated)", tone: "good" }],
      };
    case "TOGGLE_PUBLISH":
      return { ...state, catalog: state.catalog.map((c) => (c.id === action.id ? { ...c, published: !c.published } : c)) };
    case "ADD_DOCUMENT":
      return { ...state, documents: [action.record, ...state.documents.filter((d) => d.id !== action.record.id)] };
    case "TRANSFER_DECISION":
      return {
        ...state,
        blockedTransfers: { ...state.blockedTransfers, [action.beneficiaryId]: action.decision },
        audit: [
          audit({
            kind: action.decision === "blocked" ? "transfer_blocked" : "transfer_override",
            agent: "Safety",
            what: action.decision === "blocked" ? `Transfer cancelled · ${action.title}` : `Continued despite warning · ${action.title}`,
            why: "Wrong-person transfer gate",
            expected: action.decision === "blocked" ? "Money protected" : "Merchant verified the recipient",
            status: action.decision === "blocked" ? "Blocked" : "Proceeded with warning",
            result: "Simulated — no real payment was made",
          }),
          ...state.audit,
        ],
        toasts: [...state.toasts, { id: uid("t"), text: action.decision === "blocked" ? "Transfer cancelled. Your money is safe." : "Noted. This is a demo — no payment was made.", tone: action.decision === "blocked" ? "good" : "info" }],
      };
    case "RECORD_PAYMENT": {
      const p = action.payment;
      if (state.payments.some((x) => x.id === p.id && x.status === p.status)) return state;
      const received = p.status === "TXN_SUCCESS";
      const label = p.source === "paytm-staging" ? "Paytm staging" : "Simulated";
      return {
        ...state,
        payments: [p, ...state.payments.filter((x) => x.id !== p.id)],
        audit: [
          audit({
            kind: "payment_received",
            agent: "Orchestrator",
            what: received ? `Payment received · ${formatINR(p.amount)} (${label})` : `Payment ${p.status === "PENDING" ? "pending" : "failed"} · ${formatINR(p.amount)} (${label})`,
            why: p.note || "Collected from the QR screen",
            expected: "Verified with Paytm before it counts",
            status: received ? "Done" : "Blocked",
            result: [p.txnId && `Txn ${p.txnId}`, p.paymentMode, p.source === "paytm-staging" ? "test money only" : "no money moved"].filter(Boolean).join(" · "),
            route: { name: "qr" },
          }),
          ...state.audit,
        ],
        toasts: [...state.toasts, { id: uid("t"), text: received ? `${formatINR(p.amount)} received · ${label}` : `Payment ${p.status === "PENDING" ? "is still pending" : "failed"} — not counted`, tone: received ? "good" : "bad" }],
      };
    }
    case "SELECT_CUSTOMER":
      return { ...state, selectedCustomerId: action.id };
    case "SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case "NOTIFICATIONS_SEEN":
      return { ...state, notificationsSeen: true };
    case "DEMO":
      return { ...state, demo: { ...state.demo, ...action.demo } };
    case "TOAST":
      return { ...state, toasts: [...state.toasts.slice(-2), action.toast] };
    case "DISMISS_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case "RESET": {
      const fresh = createInitialState();
      return { ...fresh, route: state.route.name === "galla" ? state.route : fresh.route, settings: action.keepSettings ? state.settings : fresh.settings, demo: { ...fresh.demo } };
    }
  }
}
