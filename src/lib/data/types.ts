export type ProductCategory =
  | "Biscuits & Snacks"
  | "Staples"
  | "Dairy & Bakery"
  | "Beverages"
  | "Home & Personal Care"
  | "Ready to Cook";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  unit: string;
  price: number;
  cost: number;
  stock: number;
  dailyVelocity: number;
  supplierId: string;
  caseSize: number;
  leadTimeDays: number;
  dailyReplenished?: boolean;
  outOfStockDays?: number;
  trendPct: number; // 4-week unit sales trend
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  upi: string;
  leadTimeDays: number;
  usualPayment: number;
  categories: string[];
}

export type CustomerSegment = "regular" | "occasional" | "new" | "lapsed";

export interface Customer {
  id: string;
  name: string;
  vpa: string;
  phone: string;
  segment: CustomerSegment;
  highValue: boolean;
  firstSeenDaysAgo: number;
  lastPurchaseDaysAgo: number;
  purchaseEveryDays: number;
  visitsLast90: number;
  totalSpend: number;
  avgBasket: number;
  churnProbability: number;
  preferredTime: "morning" | "afternoon" | "evening";
  favoriteProductIds: string[];
  riskReason?: string;
  riskDriver?: "stockout" | "evening" | "gap";
}

export type PaymentMode = "UPI" | "Cash" | "Card";

export interface Transaction {
  id: string;
  dayOffset: number; // 0 = today, -1 = yesterday
  minuteOfDay: number;
  amount: number;
  mode: PaymentMode;
  customerId?: string;
  label: string;
}

export interface DailySales {
  dayOffset: number;
  revenue: number;
  txns: number;
  upiShare: number;
}

export type ObligationKind = "rent" | "supplier" | "salary" | "bill" | "mandate" | "manual";

export interface Obligation {
  id: string;
  title: string;
  kind: ObligationKind;
  amount: number;
  dueInDays: number;
  recurring: "monthly" | "once";
  account: "HDFC ••4421" | "Canara ••0917";
  source: "detected" | "mandate" | "merchant" | "invoice";
  status: "upcoming" | "paid";
  createdBy: "Galla" | "Merchant";
}

export interface DetectedPattern {
  id: string;
  title: string;
  kind: ObligationKind;
  amount: number;
  dayOfMonth: number;
  payee: string;
  confidence: number;
  evidence: string;
  confirmed: boolean;
}

export interface BankAccount {
  id: "HDFC ••4421" | "Canara ••0917";
  bank: string;
  type: string;
  balance: number;
  role: string;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RiskSignalInput {
  key: RiskSignalKey;
  score: number; // 0 (safe) – 1 (risky)
  detail: string;
}

export type RiskSignalKey =
  | "recipientHistory"
  | "accountAge"
  | "velocity"
  | "amountAnomaly"
  | "merchantHistory"
  | "timing"
  | "novelty"
  | "behaviour"
  | "network";

export interface Beneficiary {
  id: string;
  displayName: string;
  vpa: string;
  bankName: string;
  relationship: string;
  pastPayments: number;
  usualAmount: number;
  requestedAmount: number;
  context: string;
  signals: RiskSignalInput[];
}

export interface QrSample {
  id: string;
  title: string;
  shownName: string;
  payeeVpa: string;
  payeeName: string;
  source: string;
  purpose: string;
  signals: RiskSignalInput[];
}

export interface CreditFactor {
  key: string;
  label: string;
  score: number;
  weight: number;
  detail: string;
  improve?: string;
}

export interface SampleDocument {
  id: string;
  kind: "invoice" | "gst" | "bank" | "udyam";
  title: string;
  subtitle: string;
  fields: ExtractedField[];
  lineItems?: InvoiceLine[];
  inconsistencies: string[];
}

export interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
}

export interface InvoiceLine {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  confidence: number;
}
