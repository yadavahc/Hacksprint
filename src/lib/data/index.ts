import { generateCustomers } from "./customers";
import { generateDailySales, generateTransactions } from "./sales";
import type { Customer, DailySales, Transaction } from "./types";

export * from "./story";
export * from "./types";

interface Seed {
  customers: Customer[];
  daily: DailySales[];
  transactions: Transaction[];
}

let cache: Seed | null = null;

/** Immutable seeded history (customers, 12 months of sales, recent transactions). Memoised. */
export function getSeed(): Seed {
  if (cache) return cache;
  const now = new Date();
  const customers = generateCustomers();
  const daily = generateDailySales();
  const transactions = generateTransactions(daily, customers, now.getHours() * 60 + now.getMinutes());
  cache = { customers, daily, transactions };
  return cache;
}
