const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function formatINR(value: number): string {
  const sign = value < 0 ? "−" : "";
  return `${sign}₹${inr.format(Math.abs(Math.round(value)))}`;
}

/** ₹1.84L / ₹42.8K style for tight spaces. */
export function formatINRCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 100000) return `${sign}₹${trim(abs / 100000, 2)}L`;
  if (abs >= 1000) return `${sign}₹${trim(abs / 1000, 1)}K`;
  return `${sign}₹${Math.round(abs)}`;
}

function trim(n: number, digits: number) {
  return n.toFixed(digits).replace(/\.?0+$/, "");
}

export const formatNumber = (value: number) => inr.format(Math.round(value));

export function formatPct(value: number, digits = 1, withSign = true): string {
  const sign = withSign ? (value > 0 ? "+" : value < 0 ? "−" : "") : "";
  return `${sign}${Math.abs(value).toFixed(digits)}%`;
}

export function daysAgoLabel(days: number): string {
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function inDaysLabel(days: number): string {
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export function dateFromOffset(offsetDays: number, base = startOfToday()): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  return d;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const shortDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
export const weekday = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short" });
export const timeLabel = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export const uid = (prefix = "id") => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
