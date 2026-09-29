import { dateFromOffset } from "./format";
import { between, distribute, mulberry32, pick } from "./prng";
import { STORY } from "./story";
import type { Customer, DailySales, PaymentMode, Transaction } from "./types";

const WEEKDAY_FACTOR = [1.12, 0.92, 0.95, 0.96, 0.98, 1.05, 1.18]; // Sun..Sat

interface Block {
  from: number; // most recent offset (negative)
  to: number; // oldest offset (negative)
  revenue: number;
  txns: number;
}

// 12 thirty-day blocks going back from yesterday. Block 0 and 1 are split to lock in the story:
// last 7 days ₹38,400 (−11% vs the previous 4-week average of ₹43,150), last 30 days ₹1,84,200.
const MONTHLY_REVENUE = [168900, 162300, 158700, 149800, 161200, 157600, 152400, 155900, 150300, 151300];
const BLOCKS: Block[] = [
  { from: -1, to: -7, revenue: STORY.last7Revenue, txns: 260 },
  { from: -8, to: -30, revenue: STORY.last30Revenue - STORY.last7Revenue, txns: STORY.last30Txns - 260 },
  { from: -31, to: -35, revenue: STORY.fourWeekWeeklyAvg * 4 - (STORY.last30Revenue - STORY.last7Revenue), txns: 187 },
  { from: -36, to: -60, revenue: STORY.prev30Revenue - (STORY.fourWeekWeeklyAvg * 4 - (STORY.last30Revenue - STORY.last7Revenue)), txns: STORY.prev30Txns - 187 },
  ...MONTHLY_REVENUE.map((revenue, i) => ({ from: -61 - i * 30, to: -90 - i * 30, revenue, txns: Math.round(revenue / 142) })),
];

export function generateDailySales(): DailySales[] {
  const rng = mulberry32(38400);
  const days: DailySales[] = [];
  for (const block of BLOCKS) {
    const offsets: number[] = [];
    for (let d = block.from; d >= block.to; d--) offsets.push(d);
    const weights = offsets.map((o) => {
      const date = dateFromOffset(o);
      const payday = date.getDate() <= 5 ? 1.1 : 1;
      return WEEKDAY_FACTOR[date.getDay()] * payday * between(rng, 0.9, 1.1);
    });
    const revenue = distribute(weights, block.revenue, 10);
    const txns = distribute(weights, block.txns, 1);
    offsets.forEach((o, i) => days.push({ dayOffset: o, revenue: revenue[i], txns: txns[i], upiShare: Math.round(between(rng, 0.71, 0.79) * 100) / 100 }));
  }
  return days.sort((a, b) => a.dayOffset - b.dayOffset);
}

// Average transactions per day by hour (7 AM – 9 PM). Evening (5–9 PM) fell from 19.5 to 16.0 (−18%).
export const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
export const HOURLY_BEFORE = [1.6, 2.8, 3.4, 3.0, 2.4, 2.0, 1.8, 1.6, 1.8, 2.3, 4.1, 4.9, 4.6, 3.9, 2.0];
export const HOURLY_NOW = [1.5, 2.8, 3.4, 3.1, 2.4, 1.9, 1.8, 1.5, 1.6, 1.15, 3.4, 4.0, 3.8, 3.2, 1.6];

export const BASKET_PAIRS = [
  { pair: "Nandini Milk + Britannia Bread", share: 38, when: "morning bills" },
  { pair: "Maggi + Kurkure", share: 22, when: "evening bills" },
  { pair: "Aashirvaad Atta + Toor Dal", share: 17, when: "weekend bills" },
];

export function generateTransactions(daily: DailySales[], customers: Customer[], nowMinutes: number): Transaction[] {
  const rng = mulberry32(1248);
  const out: Transaction[] = [];
  const byLast = new Map<number, Customer[]>();
  customers.forEach((c) => {
    const list = byLast.get(c.lastPurchaseDaysAgo) ?? [];
    list.push(c);
    byLast.set(c.lastPurchaseDaysAgo, list);
  });

  const makeDay = (offset: number, count: number, upiTotal: number, cashTotal: number, profile: number[], maxMinute: number) => {
    const upiCount = Math.round(count * 0.75);
    const cashCount = count - upiCount;
    const upiAmounts = distribute(Array.from({ length: upiCount }, () => between(rng, 0.25, 2.6)), upiTotal, 1);
    const cashAmounts = distribute(Array.from({ length: cashCount }, () => between(rng, 0.2, 1.8)), cashTotal, 1);
    const mustAppear = [...(byLast.get(-offset) ?? [])];
    const pool = customers.filter((c) => c.lastPurchaseDaysAgo < -offset);
    const entries: { amount: number; mode: PaymentMode }[] = [
      ...upiAmounts.map((amount) => ({ amount, mode: (rng() < 0.05 ? "Card" : "UPI") as PaymentMode })),
      ...cashAmounts.map((amount) => ({ amount, mode: "Cash" as PaymentMode })),
    ];
    entries.forEach((e, i) => {
      const hourIdx = weightedIndex(rng, profile);
      const minute = Math.min(maxMinute, HOURS[hourIdx] * 60 + Math.floor(rng() * 60));
      let customer: Customer | undefined;
      if (e.mode !== "Cash") customer = mustAppear.shift() ?? (pool.length ? pick(rng, pool) : undefined);
      out.push({
        id: `t${offset}-${i}`,
        dayOffset: offset,
        minuteOfDay: minute,
        amount: e.amount,
        mode: e.mode,
        customerId: customer?.id,
        label: customer ? customer.name : e.mode === "Cash" ? "Cash sale" : "UPI payment",
      });
    });
  };

  // Today, till now
  const todayMax = Math.max(nowMinutes, 11 * 60 + 40);
  const todayProfile = HOURLY_NOW.map((v, i) => (HOURS[i] * 60 <= todayMax ? v : 0));
  makeDay(0, STORY.todayTxns, STORY.todayUpi, STORY.todayCash, todayProfile, todayMax);

  for (const day of daily.filter((d) => d.dayOffset >= -13)) {
    const upi = Math.round((day.revenue * day.upiShare) / 10) * 10;
    makeDay(day.dayOffset, day.txns, upi, day.revenue - upi, day.dayOffset >= -7 ? HOURLY_NOW : HOURLY_BEFORE, 21 * 60 + 59);
  }
  return out.sort((a, b) => b.dayOffset - a.dayOffset || b.minuteOfDay - a.minuteOfDay);
}

function weightedIndex(rng: () => number, weights: number[]) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

export function weeklySeries(daily: DailySales[], weeks = 12) {
  return Array.from({ length: weeks }, (_, k) => {
    const days = daily.filter((d) => d.dayOffset <= -(7 * k + 1) && d.dayOffset >= -(7 * k + 7));
    const end = dateFromOffset(-(7 * k + 1));
    return {
      week: k,
      label: k === 0 ? "This week" : end.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      revenue: days.reduce((s, d) => s + d.revenue, 0),
      txns: days.reduce((s, d) => s + d.txns, 0),
    };
  }).reverse();
}

export function monthlySeries(daily: DailySales[]) {
  return Array.from({ length: 12 }, (_, k) => {
    const days = daily.filter((d) => d.dayOffset <= -(30 * k + 1) && d.dayOffset >= -(30 * k + 30));
    const end = dateFromOffset(-(30 * k + 1));
    return {
      label: end.toLocaleDateString("en-IN", { month: "short" }),
      revenue: days.reduce((s, d) => s + d.revenue, 0),
    };
  }).reverse();
}
