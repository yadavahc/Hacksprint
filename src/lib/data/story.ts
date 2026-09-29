// The calibrated merchant story. Every screen derives from these numbers (directly or via the
// seeded generators), so the demo tells one consistent story:
// sales decline → repeat-customer decline → 47 inactive regulars → win-back → outcome → learning.

export const MERCHANT = {
  name: "Shree Lakshmi Stores",
  owner: "Manjunath",
  ownerFull: "Manjunath R.",
  locality: "Jayanagar 4th Block, Bengaluru",
  category: "Kirana & General Store",
  since: 2020,
  monthsOnPaytm: 26,
  merchantId: "PTM••••4821",
  upiId: "shreelakshmi@paytm",
} as const;

export const STORY = {
  // Revenue (30-day windows ending yesterday)
  last30Revenue: 184200,
  prev30Revenue: 170240, // → +8.2%
  last30Txns: 1248,
  prev30Txns: 1189, // AOV +3.1%

  // This week vs. the previous four-week average
  last7Revenue: 38400,
  fourWeekWeeklyAvg: 43150, // → −11%
  eveningTxnsPerDayNow: 16.0,
  eveningTxnsPerDayBefore: 19.5, // → −18%
  outOfStockProductId: "p-atta",
  outOfStockDays: 3,

  // Customers
  totalCustomers: 684,
  regulars: 212,
  atRiskRegulars: 47,
  inactiveThresholdDays: 14,
  repeatCustomersNow: 205,
  repeatCustomersBefore: 219, // → −6.4%

  // Today (till now)
  todaySales: 6480,
  todayTxns: 44,
  todayUpi: 4860,
  todayCash: 1620,

  // Economics used by deterministic simulations
  grossMarginPct: 24,
  atRiskAvgBasket: 525,
  storewideAvgBasket: 400,
  nextWeekForecast: 38400,

  // Outcome of the ₹50 win-back campaign (revealed only after the merchant approves it)
  winbackOutcome: { sent: 47, delivered: 46, opened: 38, returned: 14, redeemed: 10, sales: 5800 },
} as const;

export const pctChange = (now: number, before: number) => ((now - before) / before) * 100;
