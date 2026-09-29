import { between, intBetween, mulberry32, pick, shuffle } from "./prng";
import { STORY } from "./story";
import type { Customer, CustomerSegment } from "./types";

const FIRST = [
  "Ananya", "Arjun", "Bhavya", "Chandan", "Deepa", "Divya", "Ganesh", "Girish", "Harish", "Kavya",
  "Kiran", "Lakshmi", "Manjula", "Mahesh", "Nagaraj", "Nandini", "Pavan", "Pooja", "Prakash", "Pramod",
  "Rakesh", "Ramya", "Ravi", "Rekha", "Sahana", "Santosh", "Shilpa", "Shreya", "Sunil", "Suresh",
  "Swathi", "Tejas", "Uma", "Varun", "Vidya", "Vinay", "Yashas", "Akshata", "Anil", "Chaitra",
  "Gowri", "Hemanth", "Jyothi", "Keerthi", "Madhu", "Naveen", "Prathima", "Raghu", "Sandeep", "Sowmya",
  "Srinivas", "Sudha", "Vasanth", "Aisha", "Imran", "Farah", "Joseph", "Mary", "Rahul", "Priya",
  "Amit", "Neha", "Rohit", "Sneha",
];
const LAST = [
  "Rao", "Gowda", "Shetty", "Hegde", "Kulkarni", "Bhat", "Naik", "Reddy", "Iyer", "Murthy",
  "Prasad", "Kumar", "Joshi", "Patil", "Nair", "Menon", "Khan", "D'Souza", "Sharma", "Jain",
];
const HANDLES = ["okaxis", "okhdfcbank", "oksbi", "ybl", "paytm", "okicici"];
const STAPLE_IDS = ["p-milk", "p-bread", "p-sugar", "p-toor", "p-oil", "p-tea", "p-parleg", "p-maggi", "p-curd", "p-ragi"];
const EVENING_IDS = ["p-kurkure", "p-coke", "p-maggi", "p-bhujia", "p-milk", "p-bread"];

export function generateCustomers(): Customer[] {
  const rng = mulberry32(684);
  const combos = shuffle(rng, FIRST.flatMap((f) => LAST.map((l) => [f, l] as const)));
  let n = 0;

  const base = (segment: CustomerSegment): Omit<Customer, "purchaseEveryDays" | "lastPurchaseDaysAgo" | "avgBasket" | "churnProbability" | "visitsLast90" | "totalSpend" | "firstSeenDaysAgo" | "preferredTime" | "favoriteProductIds"> => {
    const [first, last] = combos[n];
    n += 1;
    const id = `c-${String(n).padStart(3, "0")}`;
    return {
      id,
      name: `${first} ${last}`,
      vpa: `${first.toLowerCase().slice(0, 5)}••@${pick(rng, HANDLES)}`,
      phone: `9${intBetween(rng, 0, 9)}••• ••${intBetween(rng, 100, 999)}`,
      segment,
      highValue: false,
    };
  };

  const finish = (
    partial: ReturnType<typeof base>,
    o: { interval: number; last: number; basket: number; churn: number; firstSeen: number; time: Customer["preferredTime"]; favs: string[] },
  ): Customer => {
    const visitsLast90 = Math.max(1, Math.round(Math.max(0, Math.min(90, o.firstSeen) - o.last) / o.interval));
    const lifetimeVisits = Math.max(visitsLast90, Math.round(((o.firstSeen - o.last) / o.interval) * 0.85));
    return {
      ...partial,
      purchaseEveryDays: o.interval,
      lastPurchaseDaysAgo: o.last,
      avgBasket: o.basket,
      churnProbability: Math.round(o.churn * 100) / 100,
      firstSeenDaysAgo: o.firstSeen,
      visitsLast90,
      totalSpend: Math.round((lifetimeVisits * o.basket) / 10) * 10,
      preferredTime: o.time,
      favoriteProductIds: o.favs,
    };
  };

  const customers: Customer[] = [];

  // 47 regulars who have gone quiet for 14+ days — the heart of the story.
  const atRisk: Customer[] = [];
  const baskets = Array.from({ length: STORY.atRiskRegulars }, () => between(rng, 380, 670));
  const scale = (STORY.atRiskAvgBasket * baskets.length) / baskets.reduce((a, b) => a + b, 0);
  const rounded = baskets.map((b) => Math.round((b * scale) / 5) * 5);
  rounded[rounded.length - 1] += STORY.atRiskAvgBasket * rounded.length - rounded.reduce((a, b) => a + b, 0);

  for (let i = 0; i < STORY.atRiskRegulars; i++) {
    const driver: Customer["riskDriver"] = i < 14 ? "stockout" : i < 33 ? "evening" : "gap";
    const interval = intBetween(rng, 3, 7);
    const last = intBetween(rng, 14, 24);
    const churn = Math.min(0.9, 0.55 + Math.max(0, (last / interval - 2) * 0.04) + rng() * 0.05);
    const favs = driver === "stockout" ? ["p-atta", ...shuffle(rng, STAPLE_IDS).slice(0, 2)] : driver === "evening" ? shuffle(rng, EVENING_IDS).slice(0, 3) : shuffle(rng, STAPLE_IDS).slice(0, 3);
    const riskReason =
      driver === "stockout"
        ? `Buys Aashirvaad Atta 5 kg every ~${interval} days — it has been out of stock for ${STORY.outOfStockDays} days. No purchase for ${last} days.`
        : driver === "evening"
          ? `Evening shopper (6–8 PM) who visits every ~${interval} days. No visit for ${last} days while evening footfall is down 18%.`
          : `Visits every ~${interval} days on average — the current gap of ${last} days is ${(last / interval).toFixed(1)}× their normal.`;
    const c = finish(base("regular"), {
      interval,
      last,
      basket: rounded[i],
      churn,
      firstSeen: intBetween(rng, 240, 760),
      time: driver === "evening" ? "evening" : pick(rng, ["morning", "afternoon", "evening"] as const),
      favs,
    });
    atRisk.push({ ...c, riskReason, riskDriver: driver });
  }
  customers.push(...atRisk);

  for (let i = 0; i < STORY.regulars - STORY.atRiskRegulars; i++) {
    customers.push(
      finish(base("regular"), {
        interval: intBetween(rng, 3, 7),
        last: intBetween(rng, 0, 6),
        basket: Math.round(between(rng, 260, 620) / 5) * 5,
        churn: between(rng, 0.04, 0.18),
        firstSeen: intBetween(rng, 120, 780),
        time: pick(rng, ["morning", "morning", "afternoon", "evening"] as const),
        favs: shuffle(rng, STAPLE_IDS).slice(0, 3),
      }),
    );
  }
  for (let i = 0; i < 318; i++) {
    customers.push(
      finish(base("occasional"), {
        interval: intBetween(rng, 10, 30),
        last: intBetween(rng, 0, 45),
        basket: Math.round(between(rng, 120, 380) / 5) * 5,
        churn: between(rng, 0.2, 0.45),
        firstSeen: intBetween(rng, 90, 700),
        time: pick(rng, ["morning", "afternoon", "evening"] as const),
        favs: shuffle(rng, [...STAPLE_IDS, ...EVENING_IDS]).slice(0, 2),
      }),
    );
  }
  for (let i = 0; i < 86; i++) {
    const firstSeen = intBetween(rng, 3, 30);
    customers.push(
      finish(base("new"), {
        interval: intBetween(rng, 7, 20),
        last: intBetween(rng, 0, Math.min(firstSeen, 20)),
        basket: Math.round(between(rng, 100, 300) / 5) * 5,
        churn: between(rng, 0.3, 0.5),
        firstSeen,
        time: pick(rng, ["morning", "afternoon", "evening"] as const),
        favs: shuffle(rng, STAPLE_IDS).slice(0, 2),
      }),
    );
  }
  for (let i = 0; i < 68; i++) {
    customers.push(
      finish(base("lapsed"), {
        interval: intBetween(rng, 15, 45),
        last: intBetween(rng, 61, 180),
        basket: Math.round(between(rng, 100, 300) / 5) * 5,
        churn: between(rng, 0.8, 0.95),
        firstSeen: intBetween(rng, 200, 700),
        time: pick(rng, ["morning", "afternoon", "evening"] as const),
        favs: shuffle(rng, STAPLE_IDS).slice(0, 2),
      }),
    );
  }

  const topSpend = [...customers].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 58);
  const highValueIds = new Set(topSpend.map((c) => c.id));
  return customers.map((c) => ({ ...c, highValue: highValueIds.has(c.id) }));
}

export const isAtRisk = (c: Customer) => c.segment === "regular" && c.lastPurchaseDaysAgo >= STORY.inactiveThresholdDays;

/** Customers won back by a completed campaign are treated as having purchased recently. */
export function withReturns(customers: Customer[], returnedIds: readonly string[]): Customer[] {
  if (!returnedIds.length) return customers;
  const set = new Set(returnedIds);
  return customers.map((c, i) =>
    set.has(c.id) ? { ...c, lastPurchaseDaysAgo: i % 5, churnProbability: 0.18, riskReason: undefined, riskDriver: undefined } : c,
  );
}

export function customerStats(customers: Customer[]) {
  const active = customers.filter((c) => c.lastPurchaseDaysAgo <= 30).length;
  const atRisk = customers.filter(isAtRisk);
  const monthlyValueAtRisk = atRisk.reduce((sum, c) => sum + (30 / c.purchaseEveryDays) * c.avgBasket, 0);
  return {
    total: customers.length,
    active,
    inactive: customers.length - active,
    regulars: customers.filter((c) => c.segment === "regular").length,
    highValue: customers.filter((c) => c.highValue).length,
    atRisk: atRisk.length,
    atRiskHighValue: atRisk.filter((c) => c.highValue).length,
    newThisMonth: customers.filter((c) => c.segment === "new").length,
    monthlyValueAtRisk: Math.round(monthlyValueAtRisk / 100) * 100,
    drivers: {
      stockout: atRisk.filter((c) => c.riskDriver === "stockout").length,
      evening: atRisk.filter((c) => c.riskDriver === "evening").length,
      gap: atRisk.filter((c) => c.riskDriver === "gap").length,
    },
  };
}
