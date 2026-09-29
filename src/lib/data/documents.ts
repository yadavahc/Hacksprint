import type { CreditFactor, SampleDocument } from "./types";

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: "doc-invoice-0912",
    kind: "invoice",
    title: "Sri Manjunatha Agencies · INV-0912",
    subtitle: "Supplier invoice · photo",
    fields: [
      { label: "Supplier", value: "Sri Manjunatha Agencies", confidence: 0.98 },
      { label: "Invoice no.", value: "INV-0912", confidence: 0.97 },
      { label: "Date", value: "12 Sep 2026", confidence: 0.95 },
      { label: "GSTIN", value: "29ABCPM••••1Z5", confidence: 0.91 },
      { label: "Total", value: "₹8,500", confidence: 0.96 },
    ],
    lineItems: [
      { productId: "p-parleg", name: "Parle-G 250 g", quantity: 96, unitPrice: 21.5, confidence: 0.97 },
      { productId: "p-maggi", name: "Maggi 70 g", quantity: 96, unitPrice: 12.8, confidence: 0.95 },
      { productId: "p-kurkure", name: "Kurkure Masala Munch 90 g", quantity: 60, unitPrice: 16.8, confidence: 0.93 },
      { productId: "p-goodday", name: "Good Day Cashew 100 g", quantity: 48, unitPrice: 25.5, confidence: 0.81 },
      { productId: "p-bisleri", name: "Bisleri 1 L", quantity: 12, unitPrice: 15.5, confidence: 0.94 },
    ],
    inconsistencies: ["Good Day quantity is handwritten — 81% confidence. Please verify “48”."],
  },
  {
    id: "doc-invoice-annapoorna",
    kind: "invoice",
    title: "Annapoorna Wholesale · AWT-3381",
    subtitle: "Supplier invoice · PDF",
    fields: [
      { label: "Supplier", value: "Annapoorna Wholesale Traders", confidence: 0.99 },
      { label: "Invoice no.", value: "AWT-3381", confidence: 0.98 },
      { label: "Date", value: "14 Sep 2026", confidence: 0.98 },
      { label: "Total", value: "₹12,370", confidence: 0.97 },
    ],
    lineItems: [
      { productId: "p-atta", name: "Aashirvaad Atta 5 kg", quantity: 30, unitPrice: 248, confidence: 0.98 },
      { productId: "p-oil", name: "Fortune Sunflower Oil 1 L", quantity: 24, unitPrice: 138, confidence: 0.97 },
      { productId: "p-toor", name: "Toor Dal 1 kg", quantity: 12, unitPrice: 146, confidence: 0.96 },
    ],
    inconsistencies: [],
  },
  {
    id: "doc-gst",
    kind: "gst",
    title: "GSTR-3B · Jul & Aug 2026",
    subtitle: "GST return · PDF",
    fields: [
      { label: "GSTIN", value: "29AKLPM••••1ZQ", confidence: 0.98 },
      { label: "Legal name", value: "Shree Lakshmi Stores", confidence: 0.97 },
      { label: "Period", value: "Jul – Aug 2026", confidence: 0.96 },
      { label: "Taxable turnover", value: "₹3,39,100", confidence: 0.93 },
      { label: "Filing status", value: "Filed on time", confidence: 0.95 },
    ],
    inconsistencies: [],
  },
  {
    id: "doc-bank",
    kind: "bank",
    title: "HDFC statement · Aug 2026",
    subtitle: "Bank statement · PDF",
    fields: [
      { label: "Account", value: "HDFC Current ••4421", confidence: 0.99 },
      { label: "Period", value: "1 – 31 Aug 2026", confidence: 0.98 },
      { label: "Total credits", value: "₹1,71,480", confidence: 0.95 },
      { label: "Average balance", value: "₹38,200", confidence: 0.92 },
      { label: "Bounced debits", value: "0", confidence: 0.97 },
    ],
    inconsistencies: ["Credits (₹1,71,480) are ₹1,240 higher than UPI settlements — likely cash deposits."],
  },
  {
    id: "doc-udyam",
    kind: "udyam",
    title: "Udyam registration",
    subtitle: "MSME certificate · image",
    fields: [
      { label: "Udyam no.", value: "UDYAM-KR-03-••••412", confidence: 0.97 },
      { label: "Enterprise name", value: "Shri Lakshmi Store", confidence: 0.9 },
      { label: "Category", value: "Micro · Retail trade", confidence: 0.96 },
      { label: "Registered", value: "Mar 2020", confidence: 0.94 },
    ],
    inconsistencies: ["Name “Shri Lakshmi Store” differs slightly from “Shree Lakshmi Stores” on GST — lenders may ask."],
  },
];

/** Documents already on file when the demo starts. */
export const SEED_DOCUMENT_IDS = ["doc-bank", "doc-udyam"];

export function creditFactors(opts: { hasGst: boolean; salesTrendRecovered: boolean }): CreditFactor[] {
  return [
    { key: "revenue", label: "Revenue consistency", score: 90, weight: 0.2, detail: "11 of the last 12 months above ₹1.5L in sales" },
    { key: "history", label: "Transaction history", score: 95, weight: 0.15, detail: "26 months of UPI history · 1,248 payments in the last 30 days" },
    { key: "cashflow", label: "Cashflow", score: 75, weight: 0.15, detail: "Average balance ₹38K · no bounced debits" },
    { key: "obligations", label: "Obligations", score: 85, weight: 0.1, detail: "₹18.5K committed vs ₹1.84L monthly sales (10%)" },
    opts.hasGst
      ? { key: "documents", label: "Documents", score: 90, weight: 0.2, detail: "GST returns, bank statement and Udyam on file" }
      : { key: "documents", label: "Documents", score: 40, weight: 0.2, detail: "GST returns for Jul–Aug 2026 are missing", improve: "Upload GSTR-3B for Jul–Aug" },
    { key: "stability", label: "Business stability", score: 90, weight: 0.1, detail: "Same address since 2020" },
    opts.salesTrendRecovered
      ? { key: "trend", label: "Recent trend", score: 72, weight: 0.1, detail: "Win-back campaign brought 14 regulars back" }
      : { key: "trend", label: "Recent trend", score: 60, weight: 0.1, detail: "Sales down 11% this week", improve: "Win back inactive regulars" },
  ];
}
