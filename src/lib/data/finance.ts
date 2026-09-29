import type { BankAccount, DetectedPattern, Obligation } from "./types";

// Balance ₹61,300 − committed ₹18,500 = ₹42,800 genuinely available.
export const BANK_ACCOUNTS: BankAccount[] = [
  { id: "HDFC ••4421", bank: "HDFC Bank", type: "Current account", balance: 53100, role: "UPI settlements land here" },
  { id: "Canara ••0917", bank: "Canara Bank", type: "Savings account", balance: 8200, role: "Linked to AutoPay mandates" },
];

export const SEED_OBLIGATIONS: Obligation[] = [
  {
    id: "ob-bescom",
    title: "BESCOM electricity bill",
    kind: "bill",
    amount: 2500,
    dueInDays: 2,
    recurring: "monthly",
    account: "Canara ••0917",
    source: "mandate",
    status: "upcoming",
    createdBy: "Galla",
  },
  {
    id: "ob-emi",
    title: "Equipment EMI · UPI AutoPay",
    kind: "mandate",
    amount: 7500,
    dueInDays: 3,
    recurring: "monthly",
    account: "Canara ••0917",
    source: "mandate",
    status: "upcoming",
    createdBy: "Galla",
  },
  {
    id: "ob-manjunatha",
    title: "Sri Manjunatha Agencies · supplier bill",
    kind: "supplier",
    amount: 8500,
    dueInDays: 4,
    recurring: "once",
    account: "HDFC ••4421",
    source: "invoice",
    status: "upcoming",
    createdBy: "Galla",
  },
];

// Recurring outflows Galla noticed in payment history but has not counted yet (to avoid double-counting,
// they are only included once the merchant confirms them).
export const SEED_PATTERNS: DetectedPattern[] = [
  {
    id: "pat-rent",
    title: "Shop rent",
    kind: "rent",
    amount: 10000,
    dayOfMonth: 5,
    payee: "Ramesh Rao",
    confidence: 0.82,
    evidence: "₹10,000 paid to Ramesh Rao around the 5th in 11 of the last 12 months",
    confirmed: false,
  },
  {
    id: "pat-salary",
    title: "Helper salary",
    kind: "salary",
    amount: 6000,
    dayOfMonth: 1,
    payee: "Shivakumar",
    confidence: 0.74,
    evidence: "₹6,000 paid to Shivakumar on the 1st–2nd in 9 of the last 10 months",
    confirmed: false,
  },
];

export const EXPECTED_INFLOWS_7D = 36900;
