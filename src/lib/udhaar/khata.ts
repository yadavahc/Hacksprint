import { formatINR } from "@/lib/data/format";

/** One customer's udhaar (credit) line in the merchant's khata. Demo data. */
export interface UdhaarEntry {
  id: string;
  name: string;
  phone: string;
  /** Amount still owed. */
  due: number;
  /** Days until due; negative = overdue. */
  dueInDays: number;
  /** Customer agreed to receive AI reminder calls. */
  consent: boolean;
  optedOut: boolean;
  remindersThisWeek: number;
  onTime: number;
  late: number;
  /** Last recovery-call outcome, shown in the list. */
  promise?: string;
}

export type TrustTag = "GREEN" | "AMBER" | "RED";

export const SEED_KHATA: UdhaarEntry[] = [
  { id: "u-ramesh", name: "Ramesh K", phone: "98••• ••412", due: 450, dueInDays: 3, consent: true, optedOut: false, remindersThisWeek: 0, onTime: 9, late: 1 },
  { id: "u-lakshmi", name: "Lakshmi P", phone: "97••• ••108", due: 1120, dueInDays: -4, consent: true, optedOut: false, remindersThisWeek: 1, onTime: 4, late: 4 },
  { id: "u-suresh", name: "Suresh M", phone: "99••• ••763", due: 2480, dueInDays: -19, consent: true, optedOut: false, remindersThisWeek: 2, onTime: 2, late: 6 },
  { id: "u-farah", name: "Farah K", phone: "90••• ••552", due: 1650, dueInDays: -9, consent: false, optedOut: false, remindersThisWeek: 0, onTime: 4, late: 2 },
  { id: "u-kiran", name: "Kiran G", phone: "96••• ••317", due: 780, dueInDays: 0, consent: true, optedOut: false, remindersThisWeek: 0, onTime: 7, late: 0 },
  { id: "u-anitha", name: "Anitha R", phone: "95••• ••240", due: 0, dueInDays: 0, consent: true, optedOut: false, remindersThisWeek: 0, onTime: 12, late: 0 },
];

/** Recovered earlier this week (demo history) — session repayments are added on top. */
export const SEED_RECOVERED_WEEK = 9350;
export const AVG_DAYS_TO_RECOVER = 6.2;
/** Bazaar Pulse: anonymous benchmark for similar kiranas (demo). */
export const PEER_RECOVERY_7D = 70;
export const MAX_REMINDERS_PER_WEEK = 2;

export function trustScore(e: UdhaarEntry): { score: number; tag: TrustTag; safeLimit: number } {
  const overdue = Math.max(0, -e.dueInDays);
  const total = e.onTime + e.late || 1;
  const score = Math.max(0, Math.min(100, Math.round(40 + (e.onTime / total) * 50 - overdue * 1.5 - (e.due > 2000 ? 10 : 0) + Math.min(e.onTime, 10))));
  const tag: TrustTag = score >= 70 ? "GREEN" : score >= 45 ? "AMBER" : "RED";
  const safeLimit = tag === "GREEN" ? 3000 : tag === "AMBER" ? 1000 : 0;
  return { score, tag, safeLimit };
}

/** Calling hours guardrail: 9 am – 8 pm only. */
export const withinCallingHours = (d = new Date()) => d.getHours() >= 9 && d.getHours() < 20;

export function callBlockReason(e: UdhaarEntry, now = new Date()): string | null {
  if (e.due <= 0) return "Nothing due";
  if (e.optedOut) return "Customer opted out";
  if (!e.consent) return "No call consent yet — send a WhatsApp opt-in first";
  if (e.remindersThisWeek >= MAX_REMINDERS_PER_WEEK) return `Max ${MAX_REMINDERS_PER_WEEK} reminders/week reached`;
  if (!withinCallingHours(now)) return "Outside calling hours (9 am – 8 pm)";
  return null;
}

export function nextAction(e: UdhaarEntry): string {
  const { tag } = trustScore(e);
  if (e.due <= 0) return "Send ₹20 win-back offer";
  if (e.promise) return e.promise;
  if (tag === "RED") return "Pause new udhaar";
  if (!e.consent) return "Ask for call opt-in";
  if (e.dueInDays < 0) return "AI call today";
  return e.dueInDays === 0 ? "Pay-link today" : `Pay-link in ${e.dueInDays}d`;
}

const DAYS: [RegExp, number][] = [
  [/\b(sunday|ravivar|itvaar|bhanuvara)\b/i, 0],
  [/\b(monday|somvar|somavara)\b/i, 1],
  [/\b(tuesday|mangalvar|mangalavara)\b/i, 2],
  [/\b(wednesday|budhvar|budhavara)\b/i, 3],
  [/\b(thursday|guruvar|guruvara)\b/i, 4],
  [/\b(friday|shukravar|shukravara)\b/i, 5],
  [/\b(saturday|shanivar|shanivara)\b/i, 6],
];

export type ParsedKhata = { kind: "udhaar" | "repayment"; name: string; amount: number; dueInDays: number };

/**
 * Parses a merchant's voice-note transcript like "Ramesh 450 udhaar, Friday tak" or
 * "Lakshmi ne 500 diya". Deterministic so it works offline in demo mode.
 */
export function parseKhataNote(text: string, now = new Date()): ParsedKhata | null {
  const amountMatch = text.replace(/[₹,]/g, " ").match(/\b(\d{2,6})\b/);
  if (!amountMatch) return null;
  const amount = Number(amountMatch[1]);
  const name = text
    .slice(0, text.indexOf(amountMatch[1]))
    .replace(/₹|rs\.?|rupees?/gi, "")
    .replace(/\b(ne|ko|ge|avaru|ji)\b/gi, "")
    .replace(/[^a-zA-Z\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  if (!name) return null;
  const kind = /\b(paid|diya|diye|jama|kotta|kottaru|returned|wapas|received)\b/i.test(text) ? "repayment" : "udhaar";
  let dueInDays = 7;
  if (/\b(today|aaj|ivattu|indu)\b/i.test(text)) dueInDays = 0;
  else if (/\b(tomorrow|kal|naale)\b/i.test(text)) dueInDays = 1;
  else {
    const days = text.match(/\b(\d{1,2})\s*(din|days?|dina)\b/i);
    if (days) dueInDays = Number(days[1]);
    else {
      const day = DAYS.find(([re]) => re.test(text));
      if (day) dueInDays = ((day[1] - now.getDay() + 7) % 7) || 7;
    }
  }
  return { kind, name, amount, dueInDays };
}

export type CallLang = "kn" | "hi" | "en";

/** A scripted, consent-based recovery call. The customer offers a part-payment; the agent accepts and sends a UPI link. */
export function recoveryCallScript(e: UdhaarEntry, shop: string, lang: CallLang): { agent: boolean; text: string }[] {
  const first = e.name.split(" ")[0];
  const now = promisedNow(e);
  const rest = e.due - now;
  const scripts: Record<CallLang, { agent: boolean; text: string }[]> = {
    kn: [
      { agent: true, text: `Namaskara ${first} avare, ${shop} inda call maadtiddini — ${formatINR(e.due)} baaki ide.` },
      { agent: false, text: rest > 0 ? `Ivattu ${formatINR(now)} kodtini, uLidaddu Sunday.` : `Ivattu full ${formatINR(now)} kodtini.` },
      { agent: true, text: "Sari! UPI link WhatsApp-ge kalistini. Dhanyavaadagalu." },
    ],
    hi: [
      { agent: true, text: `Namaste ${first} ji, ${shop} se bol raha hoon — ${formatINR(e.due)} baaki hai.` },
      { agent: false, text: rest > 0 ? `Aaj ${formatINR(now)} de deta hoon, baaki Sunday ko.` : `Aaj pura ${formatINR(now)} de deta hoon.` },
      { agent: true, text: "Theek hai! UPI link WhatsApp pe bhej raha hoon. Dhanyavaad." },
    ],
    en: [
      { agent: true, text: `Hello ${first}, calling on behalf of ${shop} — ${formatINR(e.due)} is pending.` },
      { agent: false, text: rest > 0 ? `I'll pay ${formatINR(now)} today and the rest on Sunday.` : `I'll pay the full ${formatINR(now)} today.` },
      { agent: true, text: "Great! Sending you a UPI link on WhatsApp. Thank you." },
    ],
  };
  return scripts[lang];
}

export function promisedNow(e: UdhaarEntry): number {
  return Math.min(e.due, Math.max(100, Math.round(e.due / 2 / 50) * 50));
}
