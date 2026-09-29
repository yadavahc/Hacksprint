import { isAtRisk } from "@/lib/data/customers";
import { STORY } from "@/lib/data/story";
import type { Customer } from "@/lib/data/types";

// Deterministic outcome model for the demo win-back campaign. Progress 0 → 1 represents 7 days.

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

export interface CampaignSnapshot {
  day: number;
  sent: number;
  delivered: number;
  opened: number;
  returned: number;
  redeemed: number;
  sales: number;
  cost: number;
  roi: number;
}

export function campaignSnapshot(progress: number, offerAmount: number, audienceSize: number): CampaignSnapshot {
  const p = clamp01(progress);
  const scale = audienceSize / STORY.atRiskRegulars;
  const o = STORY.winbackOutcome;
  // Outcomes for non-default offers scale with the same response curve used in simulation.
  const offerFactor = offerAmount === 50 ? 1 : (1 - Math.exp(-offerAmount / (50 / Math.log(10)))) / 0.9;
  const sent = p > 0 ? Math.round(o.sent * scale) : 0;
  const delivered = p > 0.02 ? Math.round(o.delivered * scale) : 0;
  const opened = Math.round(o.opened * scale * easeInOut(clamp01(p / 0.35)));
  const returned = Math.round(o.returned * scale * offerFactor * easeInOut(p));
  const redeemed = Math.round(o.redeemed * scale * offerFactor * easeInOut(clamp01((p - 0.05) / 0.95)));
  const sales = Math.round((o.sales * scale * offerFactor * easeInOut(p)) / 10) * 10;
  const cost = redeemed * offerAmount;
  const roi = cost > 0 ? Math.round(((sales * STORY.grossMarginPct) / 100 / cost) * 10) / 10 : 0;
  return { day: Math.min(7, Math.ceil(p * 7)), sent, delivered, opened, returned, redeemed, sales, cost, roi };
}

/** The regulars most likely to respond come back first (lowest churn probability). */
export function returningCustomerOrder(customers: Customer[]): string[] {
  return customers
    .filter(isAtRisk)
    .sort((a, b) => a.churnProbability - b.churnProbability || a.id.localeCompare(b.id))
    .map((c) => c.id);
}
