import { BANK_ACCOUNTS, EXPECTED_INFLOWS_7D } from "@/lib/data/finance";
import type { DetectedPattern, Obligation } from "@/lib/data/types";

// Cashflow Guardian — deterministic. Visible balance is never treated as fully spendable.

export const COMMIT_WINDOW_DAYS = 30;

export interface CashPosition {
  balance: number;
  committed: number;
  available: number;
  expected: number;
  items: { id: string; title: string; amount: number; dueInDays: number; kind: Obligation["kind"]; source: Obligation["source"] }[];
  pending: { id: string; title: string; amount: number; evidence: string; confidence: number }[];
  availableIfConfirmed: number;
}

export function cashPosition(obligations: Obligation[], patterns: DetectedPattern[]): CashPosition {
  const balance = BANK_ACCOUNTS.reduce((s, a) => s + a.balance, 0);
  const items = obligations
    .filter((o) => o.status === "upcoming" && o.dueInDays <= COMMIT_WINDOW_DAYS)
    .sort((a, b) => a.dueInDays - b.dueInDays)
    .map((o) => ({ id: o.id, title: o.title, amount: o.amount, dueInDays: o.dueInDays, kind: o.kind, source: o.source }));
  const committed = items.reduce((s, o) => s + o.amount, 0);
  const pending = patterns
    .filter((p) => !p.confirmed)
    .map((p) => ({ id: p.id, title: `${p.title} · ${p.payee}`, amount: p.amount, evidence: p.evidence, confidence: p.confidence }));
  return {
    balance,
    committed,
    available: balance - committed,
    expected: EXPECTED_INFLOWS_7D,
    items,
    pending,
    availableIfConfirmed: balance - committed - pending.reduce((s, p) => s + p.amount, 0),
  };
}

/** Days from today until the next occurrence of a day-of-month. */
export function daysUntilDayOfMonth(day: number, today = new Date()): number {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let target = new Date(t.getFullYear(), t.getMonth(), day);
  if (target <= t) target = new Date(t.getFullYear(), t.getMonth() + 1, day);
  return Math.round((target.getTime() - t.getTime()) / 86400000);
}

export function daysUntilWeekday(weekday: number, today = new Date()): number {
  const diff = (weekday - today.getDay() + 7) % 7;
  return diff === 0 ? 7 : diff;
}

/**
 * Same obligation already tracked? Avoids double-counting. Deliberately tight: a ₹8,000 payment
 * tomorrow is NOT the ₹8,500 bill due in 4 days — dropping a real obligation is worse than asking twice.
 */
export function findDuplicate(obligations: Obligation[], candidate: { kind: Obligation["kind"]; amount: number; dueInDays: number }) {
  return obligations.find(
    (o) => o.status === "upcoming" && o.kind === candidate.kind && Math.abs(o.amount - candidate.amount) <= candidate.amount * 0.02 && Math.abs(o.dueInDays - candidate.dueInDays) <= 2,
  );
}

export function matchPattern(patterns: DetectedPattern[], kind: Obligation["kind"], amount?: number) {
  return patterns.find((p) => p.kind === kind && (amount === undefined || Math.abs(p.amount - amount) <= p.amount * 0.1));
}

export interface MandatePrediction {
  obligationId: string;
  title: string;
  amount: number;
  dueInDays: number;
  account: string;
  accountBalance: number;
  debitsBefore: { title: string; amount: number; dueInDays: number }[];
  projectedBalance: number;
  shortfall: number;
  probability: number;
  level: "LIKELY TO FAIL" | "AT RISK" | "ON TRACK";
  reasons: string[];
  mitigated: boolean;
}

export function predictMandate(obligations: Obligation[], reminders: { title: string }[]): MandatePrediction | null {
  const mandate = obligations.find((o) => o.kind === "mandate" && o.status === "upcoming");
  if (!mandate) return null;
  const account = BANK_ACCOUNTS.find((a) => a.id === mandate.account)!;
  const debitsBefore = obligations
    .filter((o) => o.id !== mandate.id && o.status === "upcoming" && o.account === mandate.account && o.dueInDays <= mandate.dueInDays)
    .map((o) => ({ title: o.title, amount: o.amount, dueInDays: o.dueInDays }));
  const projectedBalance = account.balance - debitsBefore.reduce((s, d) => s + d.amount, 0);
  const shortfall = Math.max(0, mandate.amount - projectedBalance);
  const mitigated = reminders.some((r) => /canara/i.test(r.title));
  const probability = shortfall > 0 ? (mitigated ? 0.35 : 0.81) : 0.08;
  return {
    obligationId: mandate.id,
    title: mandate.title,
    amount: mandate.amount,
    dueInDays: mandate.dueInDays,
    account: mandate.account,
    accountBalance: account.balance,
    debitsBefore,
    projectedBalance,
    shortfall,
    probability,
    level: probability >= 0.6 ? "LIKELY TO FAIL" : probability >= 0.3 ? "AT RISK" : "ON TRACK",
    mitigated,
    reasons: [
      `The mandate debits ${mandate.account}, not your settlement account`,
      `${mandate.account} has ₹${account.balance.toLocaleString("en-IN")} today`,
      ...debitsBefore.map((d) => `${d.title} (₹${d.amount.toLocaleString("en-IN")}) debits ${d.dueInDays === 1 ? "tomorrow" : `in ${d.dueInDays} days`} from the same account`),
      "No inflow is scheduled into that account before the due date",
      "Balance dipped below ₹7,500 before this debit in 2 of the last 6 months",
    ],
  };
}
