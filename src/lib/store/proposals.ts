import type { ActionProposal, AgentName } from "@/lib/agents/types";
import { daysUntilDayOfMonth } from "@/lib/cashflow/cashflow";
import { formatINR } from "@/lib/data/format";
import type { DetectedPattern, Product } from "@/lib/data/types";
import { reorderSuggestion } from "@/lib/inventory/inventory";

// Builders for actions started from screens (not chat). They go through the same Action Engine,
// approval step and audit log as proposals from Galla.

const id = () => `ap-${Math.random().toString(36).slice(2, 10)}`;

export function reorderProposal(p: Product): ActionProposal {
  const s = reorderSuggestion(p);
  return {
    id: id(),
    agent: "Inventory",
    title: `Supplier order · ${s.supplierName}`,
    summary: `Galla wants to prepare an order of ${s.quantity} × ${p.name} (${formatINR(s.cost)}).`,
    why: p.stock > 0 ? `${p.name} will likely run out in ~${Math.max(1, Math.round(s.daysLeft))} days` : `${p.name} is out of stock`,
    expected: `~10 days of stock · delivery in ${p.leadTimeDays} day${p.leadTimeDays > 1 ? "s" : ""}`,
    payload: { kind: "prepare_supplier_order", supplierId: s.supplierId, supplierName: s.supplierName, lines: [{ productId: p.id, name: p.name, quantity: s.quantity, unitCost: p.cost }], total: s.cost },
    editable: false,
  };
}

export function confirmPatternProposal(pat: DetectedPattern): ActionProposal {
  return {
    id: id(),
    agent: "Cashflow",
    title: `Confirm ${pat.title} · ${formatINR(pat.amount)} monthly`,
    summary: `Galla wants to count ${pat.title.toLowerCase()} (${formatINR(pat.amount)} to ${pat.payee}) as a monthly obligation.`,
    why: pat.evidence,
    expected: "Counted once in committed money — no double-counting",
    payload: { kind: "record_obligation", title: `${pat.title} · ${pat.payee}`, obligationKind: pat.kind, amount: pat.amount, dueInDays: daysUntilDayOfMonth(pat.dayOfMonth), recurring: true, patternId: pat.id },
    editable: false,
  };
}

export function reminderProposal(opts: { agent: AgentName; title: string; note: string; dueInDays: number; why: string; expected: string }): ActionProposal {
  return {
    id: id(),
    agent: opts.agent,
    title: `Reminder · ${opts.title}`,
    summary: `Galla wants to set a reminder: ${opts.title}.`,
    why: opts.why,
    expected: opts.expected,
    payload: { kind: "create_reminder", title: opts.title, dueInDays: opts.dueInDays, note: opts.note },
    editable: false,
  };
}

export function stockFromDocumentProposal(documentId: string, title: string, lines: { productId: string; name: string; quantity: number }[]): ActionProposal {
  return {
    id: id(),
    agent: "Inventory",
    title: `Update stock from ${title}`,
    summary: `Galla wants to add ${lines.reduce((s, l) => s + l.quantity, 0)} units across ${lines.length} products.`,
    why: `Extracted from ${title}`,
    expected: "Inventory matches the invoice",
    payload: { kind: "update_inventory", documentId, lines },
    editable: false,
  };
}

export function catalogProposal(item: { name: string; price: number; stock: number; unit: string; category: string }): ActionProposal {
  return {
    id: id(),
    agent: "Digitalization",
    title: `Add “${item.name}” to digital catalog`,
    summary: `Galla wants to create a catalog item: ${item.name}, ₹${item.price}, stock ${item.stock}.`,
    why: "You added a product from the Catalog screen",
    expected: "Visible on your digital storefront",
    payload: { kind: "create_catalog_item", ...item },
    editable: false,
  };
}

export function matchProductByName(products: Product[], name: string): Product | undefined {
  const n = name.toLowerCase();
  return products.find((p) => n.includes(p.name.toLowerCase().split(" ")[0]) && n.includes(p.name.toLowerCase().split(" ").slice(-1)[0])) ?? products.find((p) => n.includes(p.name.toLowerCase().split(" ")[0]));
}
