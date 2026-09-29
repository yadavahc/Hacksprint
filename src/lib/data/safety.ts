import type { Beneficiary, QrSample } from "./types";

// All safety examples are demo data derived from this merchant's own (simulated) payment history.
// Galla never claims access to external fraud databases.

export const BENEFICIARIES: Beneficiary[] = [
  {
    id: "b-karthik",
    displayName: "Karthik Enterprises",
    vpa: "karthik.ent2291@ybl",
    bankName: "R SURESH",
    relationship: "New beneficiary",
    pastPayments: 0,
    usualAmount: 8500,
    requestedAmount: 35700,
    context: "WhatsApp message: “Sri Manjunatha Agencies new bank account, pay pending bill here”",
    signals: [
      { key: "recipientHistory", score: 1, detail: "You have never paid this UPI ID before" },
      { key: "accountAge", score: 0.8, detail: "UPI handle appears to be recently created (demo signal)" },
      { key: "velocity", score: 0.6, detail: "Added 38 minutes ago and paid immediately" },
      { key: "amountAnomaly", score: 1, detail: "₹35,700 is 4.2× your usual ₹8,500 supplier payment" },
      { key: "merchantHistory", score: 0.9, detail: "Claims to be Sri Manjunatha Agencies, whose verified UPI ID is different" },
      { key: "timing", score: 0.5, detail: "Requested at 9:52 PM — you pay suppliers between 10 AM and 1 PM" },
      { key: "novelty", score: 1, detail: "First-time beneficiary for a large amount" },
      { key: "behaviour", score: 0.9, detail: "Bank-registered name “R SURESH” does not match “Karthik Enterprises”" },
      { key: "network", score: 0.8, detail: "Same WhatsApp number sent you a ‘KYC refund’ QR yesterday" },
    ],
  },
  {
    id: "b-sai",
    displayName: "Sri Sai Traders",
    vpa: "saitraders.blr@okaxis",
    bankName: "SRI SAI TRADERS",
    relationship: "New supplier",
    pastPayments: 0,
    usualAmount: 8500,
    requestedAmount: 4800,
    context: "Invoice handed over in person for 2 cases of Coca-Cola",
    signals: [
      { key: "recipientHistory", score: 0.7, detail: "No past payments to this UPI ID" },
      { key: "accountAge", score: 0.2, detail: "Handle appears established (demo signal)" },
      { key: "velocity", score: 0.1, detail: "Normal pace — beneficiary added yesterday" },
      { key: "amountAnomaly", score: 0.1, detail: "₹4,800 is within your normal supplier range" },
      { key: "merchantHistory", score: 0.3, detail: "Not yet one of your 5 regular suppliers" },
      { key: "timing", score: 0.1, detail: "Business hours" },
      { key: "novelty", score: 0.7, detail: "First payment to a new supplier" },
      { key: "behaviour", score: 0.1, detail: "Bank name matches the invoice name" },
      { key: "network", score: 0.1, detail: "No links to suspicious entities in your network" },
    ],
  },
  {
    id: "b-manjunatha",
    displayName: "Sri Manjunatha Agencies",
    vpa: "manjunathaagencies@okhdfcbank",
    bankName: "SRI MANJUNATHA AGENCIES",
    relationship: "Regular supplier · 26 payments",
    pastPayments: 26,
    usualAmount: 8500,
    requestedAmount: 8500,
    context: "Pending invoice INV-0912 · due in 4 days",
    signals: [
      { key: "recipientHistory", score: 0, detail: "26 successful payments over 22 months" },
      { key: "accountAge", score: 0, detail: "Long-standing UPI ID" },
      { key: "velocity", score: 0, detail: "Normal payment rhythm (every ~2 weeks)" },
      { key: "amountAnomaly", score: 0, detail: "Matches the invoice amount exactly" },
      { key: "merchantHistory", score: 0, detail: "One of your top suppliers" },
      { key: "timing", score: 0.1, detail: "Within usual payment hours" },
      { key: "novelty", score: 0, detail: "Known beneficiary" },
      { key: "behaviour", score: 0, detail: "Bank name matches" },
      { key: "network", score: 0, detail: "No suspicious links" },
    ],
  },
];

export const QR_SAMPLES: QrSample[] = [
  {
    id: "qr-sticker",
    title: "Sticker on your counter",
    shownName: "Shree Lakshmi Stores",
    payeeVpa: "quickrewards.cash@axl",
    payeeName: "REWARD CASHBACK SERVICES",
    source: "Found pasted over your payment QR standee",
    purpose: "Customers pay by scanning this",
    signals: [
      { key: "recipientHistory", score: 1, detail: "This UPI ID has never received money from your shop" },
      { key: "accountAge", score: 0.7, detail: "Handle appears recently created (demo signal)" },
      { key: "velocity", score: 0.8, detail: "Received 9 small payments from different people in 2 hours" },
      { key: "amountAnomaly", score: 0.4, detail: "Amounts match your typical bill sizes — likely diverted customers" },
      { key: "merchantHistory", score: 1, detail: "Your registered UPI ID is shreelakshmi@paytm" },
      { key: "timing", score: 0.5, detail: "Appeared overnight — first payment at 7:04 AM" },
      { key: "novelty", score: 1, detail: "Unknown payee on a QR showing your shop name" },
      { key: "behaviour", score: 1, detail: "Shown name “Shree Lakshmi Stores” ≠ payee “REWARD CASHBACK SERVICES”" },
      { key: "network", score: 0.8, detail: "Same payee appears on the WhatsApp ‘KYC refund’ QR you received" },
    ],
  },
  {
    id: "qr-refund",
    title: "‘Paytm KYC refund’ QR on WhatsApp",
    shownName: "Scan to receive ₹2,000 refund",
    payeeVpa: "quickrewards.cash@axl",
    payeeName: "REWARD CASHBACK SERVICES",
    source: "WhatsApp from +91 7•••• ••019",
    purpose: "Claims you will receive money by scanning",
    signals: [
      { key: "recipientHistory", score: 1, detail: "Unknown recipient" },
      { key: "accountAge", score: 0.7, detail: "Handle appears recently created (demo signal)" },
      { key: "velocity", score: 0.6, detail: "Message arrived with a 10-minute deadline" },
      { key: "amountAnomaly", score: 0.5, detail: "Scanning would SEND ₹2,000 — you never receive money by scanning" },
      { key: "merchantHistory", score: 0.6, detail: "No pending refunds on your UPI account" },
      { key: "timing", score: 0.4, detail: "Sent at 10:41 PM" },
      { key: "novelty", score: 1, detail: "First contact from this number" },
      { key: "behaviour", score: 1, detail: "‘Scan to receive’ is a known scam pattern" },
      { key: "network", score: 0.8, detail: "Linked to the fake counter sticker payee" },
    ],
  },
  {
    id: "qr-sai",
    title: "Sri Sai Traders delivery QR",
    shownName: "Sri Sai Traders",
    payeeVpa: "saitraders.blr@okaxis",
    payeeName: "SRI SAI TRADERS",
    source: "Shown by delivery person",
    purpose: "Pay ₹4,800 for 2 cases of Coca-Cola",
    signals: [
      { key: "recipientHistory", score: 0.7, detail: "First payment to this supplier" },
      { key: "accountAge", score: 0.2, detail: "Handle appears established (demo signal)" },
      { key: "velocity", score: 0.1, detail: "Normal" },
      { key: "amountAnomaly", score: 0.1, detail: "Matches the invoice" },
      { key: "merchantHistory", score: 0.3, detail: "Not one of your regular suppliers yet" },
      { key: "timing", score: 0.1, detail: "Business hours" },
      { key: "novelty", score: 0.7, detail: "New payee" },
      { key: "behaviour", score: 0.1, detail: "Name matches invoice" },
      { key: "network", score: 0.1, detail: "No suspicious links" },
    ],
  },
  {
    id: "qr-manjunatha",
    title: "Sri Manjunatha Agencies QR",
    shownName: "Sri Manjunatha Agencies",
    payeeVpa: "manjunathaagencies@okhdfcbank",
    payeeName: "SRI MANJUNATHA AGENCIES",
    source: "Printed on supplier invoice",
    purpose: "Pay pending bill ₹8,500",
    signals: [
      { key: "recipientHistory", score: 0, detail: "26 past payments" },
      { key: "accountAge", score: 0, detail: "Long-standing" },
      { key: "velocity", score: 0, detail: "Normal" },
      { key: "amountAnomaly", score: 0, detail: "Matches invoice" },
      { key: "merchantHistory", score: 0, detail: "Top supplier" },
      { key: "timing", score: 0, detail: "Business hours" },
      { key: "novelty", score: 0, detail: "Known payee" },
      { key: "behaviour", score: 0, detail: "Name matches" },
      { key: "network", score: 0, detail: "No suspicious links" },
    ],
  },
];

export type GraphNodeType = "merchant" | "customer" | "supplier" | "beneficiary" | "qr" | "suspicious" | "contact";

export interface GraphNode {
  id: string;
  label: string;
  sub: string;
  type: GraphNodeType;
  x: number;
  y: number;
  parent?: string; // hidden until parent is expanded
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  suspicious?: boolean;
}

// Coordinates on a 360 × 360 canvas.
export const SCAM_GRAPH_NODES: GraphNode[] = [
  { id: "m", label: "Shree Lakshmi", sub: "You", type: "merchant", x: 180, y: 180 },
  { id: "sup1", label: "Manjunatha Agencies", sub: "Supplier · 26 payments", type: "supplier", x: 70, y: 70 },
  { id: "sup2", label: "Annapoorna Traders", sub: "Supplier · 18 payments", type: "supplier", x: 180, y: 38 },
  { id: "sup3", label: "Nandini Route 14", sub: "Supplier · daily", type: "supplier", x: 292, y: 70 },
  { id: "ben1", label: "Ramesh Rao", sub: "Rent · 14 payments", type: "beneficiary", x: 36, y: 182 },
  { id: "cust", label: "684 customers", sub: "UPI payers", type: "customer", x: 90, y: 300 },
  { id: "qr1", label: "Your QR", sub: "shreelakshmi@paytm", type: "qr", x: 180, y: 322 },
  { id: "s1", label: "Karthik Enterprises", sub: "₹35,700 request", type: "suspicious", x: 320, y: 190 },
  { id: "s2", label: "Counter sticker QR", sub: "quickrewards.cash@axl", type: "suspicious", x: 282, y: 300 },
  { id: "x1", label: "R SURESH", sub: "Bank-registered name", type: "contact", x: 340, y: 110, parent: "s1" },
  { id: "x2", label: "+91 7•••• ••019", sub: "WhatsApp sender", type: "contact", x: 350, y: 250, parent: "s1" },
  { id: "x3", label: "‘KYC refund’ QR", sub: "Scan-to-receive scam", type: "suspicious", x: 350, y: 336, parent: "s2" },
  { id: "x4", label: "9 diverted payments", sub: "Customers paid the sticker", type: "contact", x: 226, y: 350, parent: "s2" },
];

export const SCAM_GRAPH_EDGES: GraphEdge[] = [
  { from: "m", to: "sup1" },
  { from: "m", to: "sup2" },
  { from: "m", to: "sup3" },
  { from: "m", to: "ben1" },
  { from: "cust", to: "qr1" },
  { from: "qr1", to: "m" },
  { from: "s1", to: "m", label: "payment request", suspicious: true },
  { from: "s1", to: "sup1", label: "impersonates", suspicious: true },
  { from: "s2", to: "m", label: "pasted on counter", suspicious: true },
  { from: "s1", to: "x1", suspicious: true },
  { from: "s1", to: "x2", suspicious: true },
  { from: "x2", to: "x3", label: "sent", suspicious: true },
  { from: "s2", to: "x3", label: "same payee", suspicious: true },
  { from: "s2", to: "x4", suspicious: true },
];
