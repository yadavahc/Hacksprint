import { STORY } from "@/lib/data/story";

// Merchant Twin: deterministic what-if maths. The LLM never computes these numbers.
//
// Win-back response follows a diminishing-returns curve calibrated so that a ₹50 offer brings back
// ~10 of 47 inactive regulars (≈21%) and ₹100 brings back ~11 — i.e. doubling the offer barely helps.

const K = 50 / Math.log(10); // curve steepness
const MAX_RESPONSE_47 = 10 / 0.9; // saturation for an audience of 47

export function expectedReturns(offer: number, audienceSize: number, calibration = 1) {
  if (offer <= 0 || audienceSize <= 0) return 0;
  return MAX_RESPONSE_47 * (1 - Math.exp(-offer / K)) * (audienceSize / STORY.atRiskRegulars) * calibration;
}

export interface WinbackSimulation {
  type: "winback";
  offerAmount: number;
  audienceSize: number;
  minBill: number;
  expected: number;
  returnLow: number;
  returnHigh: number;
  avgBasket: number;
  salesLow: number;
  salesHigh: number;
  costLow: number;
  costHigh: number;
  roi: number;
  naturalReturns: number;
  assumptions: string[];
  calibrated: boolean;
}

export function simulateWinback(offerAmount: number, audienceSize: number = STORY.atRiskRegulars, calibration = 1, minBill = 300): WinbackSimulation {
  const expected = expectedReturns(offerAmount, audienceSize, calibration);
  const returnLow = Math.round(expected * 0.8);
  const returnHigh = Math.round(expected * 1.2);
  const avgBasket = STORY.atRiskAvgBasket;
  const margin = STORY.grossMarginPct / 100;
  const roi = offerAmount > 0 ? Math.round(((avgBasket * margin) / offerAmount) * 10) / 10 : 0;
  return {
    type: "winback",
    offerAmount,
    audienceSize,
    minBill,
    expected,
    returnLow,
    returnHigh,
    avgBasket,
    salesLow: returnLow * avgBasket,
    salesHigh: returnHigh * avgBasket,
    costLow: returnLow * offerAmount,
    costHigh: returnHigh * offerAmount,
    roi,
    naturalReturns: Math.max(1, Math.round(audienceSize * 0.04)),
    calibrated: calibration !== 1,
    assumptions: [
      `Average basket of these regulars: ₹${avgBasket}`,
      `Gross margin on incremental sales: ${STORY.grossMarginPct}%`,
      `Offer valid 7 days on bills above ₹${minBill}; one use per customer`,
      calibration !== 1
        ? `Response rate updated from your last win-back campaign (×${calibration.toFixed(1)})`
        : "Response curve: win-back benchmark for regulars inactive 14–24 days (demo model)",
      `~${Math.max(1, Math.round(audienceSize * 0.04))} customers would likely return without any offer — not counted`,
    ],
  };
}

export interface StorewideSimulation {
  type: "storewide";
  discount: number;
  minBill: number;
  baselineSales: number;
  withSales: number;
  incrementalSales: number;
  marginImpact: number;
  returning: number;
  discountedExistingBills: number;
  assumptions: string[];
}

export function simulateStorewide(discount: number, minBill = 999): StorewideSimulation {
  const returning = Math.round(expectedReturns(discount, STORY.atRiskRegulars));
  const incrementalSales = returning * STORY.storewideAvgBasket;
  const discountedExistingBills = discount > 0 ? 12 : 0;
  const rawMargin = incrementalSales * (STORY.grossMarginPct / 100) - (returning + discountedExistingBills) * discount;
  return {
    type: "storewide",
    discount,
    minBill,
    baselineSales: STORY.nextWeekForecast,
    withSales: STORY.nextWeekForecast + incrementalSales,
    incrementalSales,
    marginImpact: Math.round(rawMargin / 100) * 100,
    returning,
    discountedExistingBills,
    assumptions: [
      `Next 7 days forecast without a discount: ₹${STORY.nextWeekForecast.toLocaleString("en-IN")} (current trend)`,
      `₹${discount} off on bills above ₹${minBill}, open to every customer`,
      `~${discountedExistingBills} bills a week already cross ₹${minBill} — they get the discount anyway`,
      `Average basket of returning customers: ₹${STORY.storewideAvgBasket}; gross margin ${STORY.grossMarginPct}%`,
    ],
  };
}
