import { formatINR } from "@/lib/data/format";
import { BENEFICIARIES, QR_SAMPLES } from "@/lib/data/safety";
import { computeReadiness } from "@/lib/credit/readiness";
import { assessRisk } from "@/lib/risk/riskEngine";
import { pid, respond, t } from "./common";
import type { AgentContext, AgentResponse, Entities, Lang } from "./types";

// SAFETY AGENT ---------------------------------------------------------------------------------

export function qrSafety(ctx: AgentContext, lang: Lang, e: Entities): AgentResponse {
  const qr = QR_SAMPLES.find((q) => q.id === e.qrId) ?? QR_SAMPLES[0];
  const a = assessRisk(qr.signals);
  const message =
    a.level === "HIGH"
      ? qr.id === "qr-refund"
        ? t(lang, {
            kn: `Ee QR safe alla — HIGH risk (${a.score}/100). QR scan maadidre hana baralla, hana HOGUTTE. “Scan to receive” ondu scam.`,
            hi: `Ye QR safe nahi hai — HIGH risk (${a.score}/100). QR scan karne se paisa aata nahi, JAATA hai. “Scan to receive” scam hai.`,
            en: `This QR is not safe — HIGH risk (${a.score}/100). Scanning a QR never receives money; it sends it. “Scan to receive” is a scam.`,
          })
        : t(lang, {
            kn: `Ee QR safe alla — HIGH risk (${a.score}/100). QR mele “${qr.shownName}” antha ide, aadre hana “${qr.payeeName}” ge hogutte.`,
            hi: `Ye QR safe nahi hai — HIGH risk (${a.score}/100). QR par “${qr.shownName}” likha hai, lekin paisa “${qr.payeeName}” ko jaata hai.`,
            en: `This QR is not safe — HIGH risk (${a.score}/100). It shows “${qr.shownName}”, but money goes to “${qr.payeeName}”.`,
          })
      : a.level === "MEDIUM"
        ? t(lang, {
            kn: `MEDIUM risk (${a.score}/100). ${qr.payeeName} hosa payee — hesaru mattu amount confirm maadi pay maadi.`,
            hi: `MEDIUM risk (${a.score}/100). ${qr.payeeName} naya payee hai — naam aur amount confirm karke pay karein.`,
            en: `MEDIUM risk (${a.score}/100). ${qr.payeeName} is a new payee — confirm the name and amount before paying.`,
          })
        : t(lang, { kn: `LOW risk (${a.score}/100). ${qr.payeeName} nimma history jote match aagutte.`, hi: `LOW risk (${a.score}/100). ${qr.payeeName} aapki history se match karta hai.`, en: `LOW risk (${a.score}/100). ${qr.payeeName} matches your history.` });

  return respond({
    intent: "qr_safety",
    agent: "Safety",
    language: lang,
    message,
    cards: [
      { type: "risk", subjectKind: "qr", subjectId: qr.id, title: qr.title, subtitle: `${qr.payeeVpa} · ${qr.source}`, assessment: a },
      { type: "cta", buttons: [{ label: "Scan another QR", route: "qr" }, { label: "Scam graph", route: "beneficiary" }] },
    ],
    proposal:
      qr.id === "qr-sticker"
        ? {
            id: pid(),
            agent: "Safety",
            title: "Remove fake QR sticker",
            summary: "Galla wants to set a reminder to remove the sticker and alert your staff.",
            why: "A QR showing your shop name pays a different account",
            expected: "Customers pay your real QR again",
            payload: { kind: "create_reminder", title: "Remove fake QR sticker from counter & tell staff", dueInDays: 0, note: "Also report it via your UPI app's Help. No money is moved by Galla." },
            editable: false,
          }
        : undefined,
    confidence: 0.84,
    confidenceLabel: "Likely",
    uncertainty: "Risk is scored from your own payment history and the QR's details — Galla does not use external fraud databases.",
    followUps: ["Karthik Enterprises-ge ₹35,700 kalisbeka?", "Loan-ge ready iddina?"],
    stages: [
      { stage: "UNDERSTANDING", detail: "Decoding QR payee details" },
      { stage: "ANALYZING", detail: "Scoring 9 risk signals" },
      { stage: "PLANNING", detail: "Deciding what to tell you" },
    ],
    facts: { level: a.level, score: a.score, shownName: qr.shownName, payee: qr.payeeName },
    riskLevel: a.level,
  });
}

export function beneficiaryCheck(ctx: AgentContext, lang: Lang, e: Entities): AgentResponse {
  const b = BENEFICIARIES.find((x) => x.id === e.beneficiaryId) ?? BENEFICIARIES[0];
  const a = assessRisk(b.signals);
  const ratio = Math.round((b.requestedAmount / b.usualAmount) * 10) / 10;
  return respond({
    intent: "beneficiary_check",
    agent: "Safety",
    language: lang,
    message:
      a.level === "HIGH"
        ? t(lang, {
            kn: `Ee payment maadbedi — HIGH risk. Ee recipient hosa, mattu ${formatINR(b.requestedAmount)} nimma usual supplier payment-ginta ${ratio}× jaasti. Bank hesaru “${b.bankName}” match aagalla.`,
            hi: `Ye payment mat kijiye — HIGH risk. Ye recipient naya hai, aur ${formatINR(b.requestedAmount)} aapke usual supplier payment se ${ratio}× zyada hai. Bank naam “${b.bankName}” match nahi karta.`,
            en: `Don't pay yet — HIGH risk. This recipient is new and the amount is ${ratio}× your usual supplier payment. The bank name “${b.bankName}” doesn't match.`,
          })
        : a.level === "MEDIUM"
          ? t(lang, { kn: `MEDIUM risk. ${b.displayName} hosa supplier — amount normal ide. Invoice confirm maadi.`, hi: `MEDIUM risk. ${b.displayName} naya supplier hai — amount normal hai. Invoice confirm karein.`, en: `MEDIUM risk. ${b.displayName} is a new supplier, but the amount is normal. Confirm the invoice.` })
          : t(lang, { kn: `LOW risk. ${b.displayName}-ge ${b.pastPayments} payments aagide.`, hi: `LOW risk. ${b.displayName} ko ${b.pastPayments} payments ho chuke hain.`, en: `LOW risk. You've paid ${b.displayName} ${b.pastPayments} times before.` }),
    cards: [{ type: "risk", subjectKind: "beneficiary", subjectId: b.id, title: `${b.displayName} · ${formatINR(b.requestedAmount)}`, subtitle: `${b.vpa} · ${b.context}`, assessment: a }],
    confidence: 0.86,
    confidenceLabel: "Likely",
    uncertainty: "Galla can't see the other person's bank records — verify by calling the supplier on a number you already have.",
    followUps: ["Ee QR safe aa?"],
    stages: [
      { stage: "ANALYZING", detail: "Checking recipient against 26 months of payments" },
      { stage: "ANALYZING", detail: "Scoring 9 risk signals" },
      { stage: "WAITING_FOR_APPROVAL", detail: "Transfer paused until you decide" },
    ],
    facts: { level: a.level, amount: formatINR(b.requestedAmount), ratio: `${ratio}×`, bankName: b.bankName },
    riskLevel: a.level,
  });
}

// CREDIT READINESS AGENT -----------------------------------------------------------------------

export function creditReadiness(ctx: AgentContext, lang: Lang): AgentResponse {
  const campaignCompleted = ctx.campaigns.some((c) => c.status === "completed");
  const r = computeReadiness({ documentIds: ctx.documentIds, campaignCompleted });
  const hasGst = ctx.documentIds.includes("doc-gst");
  return respond({
    intent: "credit_readiness",
    agent: "Credit Readiness",
    language: lang,
    message:
      t(lang, {
        kn: `Nimma business “${r.level}” (${r.score}/100). Revenue consistency strong — 12 tingalalli 11 tingalu ₹1.5L mele.`,
        hi: `Aapka business “${r.level}” hai (${r.score}/100). Revenue consistency strong hai — 12 mein se 11 mahine ₹1.5L se upar.`,
        en: `Your business is “${r.level}” (${r.score}/100). Revenue is consistent — 11 of the last 12 months above ₹1.5L.`,
      }) +
      " " +
      (hasGst
        ? t(lang, { kn: "Documents ella ready.", hi: "Saare documents ready hain.", en: "Your documents are complete." })
        : t(lang, { kn: "GST returns (Jul–Aug) upload maadidre READY aagabahudu.", hi: "GST returns (Jul–Aug) upload karein to READY ho sakte hain.", en: "Upload GST returns for Jul–Aug and you'll likely be READY." })) +
      " " +
      t(lang, { kn: "Note: Galla loan approve maadalla — lender decide maadtaare.", hi: "Note: Galla loan approve nahi karta — lender decide karte hain.", en: "Note: Galla doesn't approve loans — lenders decide." }),
    cards: [{ type: "credit", readiness: r }, { type: "cta", buttons: hasGst ? [{ label: "Credit details", route: "credit" }] : [{ label: "Upload GST return", route: "documents" }, { label: "Credit details", route: "credit" }] }],
    confidence: 0.8,
    confidenceLabel: "Based on current data",
    uncertainty: "Readiness is guidance only. Each lender uses its own criteria.",
    followUps: ["Nanna sales ee vaara yaake kadime aagide?"],
    stages: [
      { stage: "ANALYZING", detail: "12 months revenue consistency" },
      { stage: "ANALYZING", detail: "Cashflow, obligations and documents" },
      { stage: "PREDICTING", detail: "Scoring readiness (not a loan decision)" },
    ],
    facts: { level: r.level, score: r.score, improvements: r.improvements.join("; ") || "none" },
  });
}

// DIGITALIZATION AGENT -------------------------------------------------------------------------

const guessCategory = (name: string) =>
  /(biscuit|chips|snack|namkeen|kurkure|cookie)/i.test(name)
    ? "Biscuits & Snacks"
    : /(milk|curd|butter|paneer|bread|egg)/i.test(name)
      ? "Dairy & Bakery"
      : /(soap|shampoo|paste|detergent|agarbatti)/i.test(name)
        ? "Home & Personal Care"
        : /(juice|cola|water|tea|coffee)/i.test(name)
          ? "Beverages"
          : "Staples";

export function catalogAdd(ctx: AgentContext, lang: Lang, e: Entities): AgentResponse {
  if (!e.amount || e.quantity === undefined) {
    return respond({
      intent: "catalog_add",
      agent: "Digitalization",
      language: lang,
      message: t(lang, { kn: "Product hesaru, bele mattu stock heli — udaharane “Ee biscuit packet ₹10, 25 pieces ide.”", hi: "Product ka naam, daam aur stock batayein — jaise “Ye biscuit packet ₹10, 25 pieces hai.”", en: "Tell me the product, price and stock — for example “This biscuit packet is ₹10, 25 pieces.”" }),
      cards: [{ type: "cta", buttons: [{ label: "Open catalog", route: "catalog" }] }],
      confidence: 0.4,
      confidenceLabel: "Not enough data to be certain",
      stages: [{ stage: "UNDERSTANDING", detail: "Looking for name, price and stock" }],
    });
  }
  const name = e.productName ?? "New Item";
  const exists = ctx.catalogNames.some((n) => n.toLowerCase() === name.toLowerCase());
  const item = { name, price: e.amount, stock: e.quantity, unit: "piece", category: guessCategory(name) };
  return respond({
    intent: "catalog_add",
    agent: "Digitalization",
    language: lang,
    message: exists
      ? t(lang, { kn: `${name} already catalog-alli ide. Stock update maadalu Catalog open maadi.`, hi: `${name} already catalog mein hai. Stock update ke liye Catalog kholein.`, en: `${name} is already in your catalog. Open Catalog to update its stock.` })
      : t(lang, { kn: `Catalog-ge add maadthini: ${name} — ₹${item.price}, stock ${item.stock}.`, hi: `Catalog mein add karta hoon: ${name} — ₹${item.price}, stock ${item.stock}.`, en: `I'll add this to your catalog: ${name} — ₹${item.price}, stock ${item.stock}.` }),
    cards: [{ type: "catalog", item }],
    proposal: exists
      ? undefined
      : {
          id: pid(),
          agent: "Digitalization",
          title: `Add “${name}” to digital catalog`,
          summary: `Galla wants to create a catalog item: ${name}, ₹${item.price}, stock ${item.stock}.`,
          why: "You described a product that isn't in your catalog yet",
          expected: "Visible on your digital storefront",
          payload: { kind: "create_catalog_item", ...item },
          editable: false,
        },
    confidence: 0.9,
    confidenceLabel: "Confirmed",
    followUps: ["Stock yaavaga mugiyutte?"],
    stages: [
      { stage: "UNDERSTANDING", detail: "Extracting name, price and stock" },
      { stage: "PLANNING", detail: "Preparing catalog item" },
    ],
    facts: { name, price: `₹${item.price}`, stock: item.stock },
  });
}

// HELP -----------------------------------------------------------------------------------------

export function help(ctx: AgentContext, lang: Lang): AgentResponse {
  return respond({
    intent: "help",
    agent: "Orchestrator",
    language: lang,
    message: t(lang, {
      kn: "Naanu nimma business-na artha maadkondu, kelsa maadtini. Sales, customers, stock, hana, QR safety, loan readiness — yenu beku heli.",
      hi: "Main aapke business ko samajhkar kaam karta hoon. Sales, customers, stock, paisa, QR safety, loan readiness — jo chahiye boliye.",
      en: "I understand your business and get things done. Ask about sales, customers, stock, cash, QR safety or loan readiness.",
    }),
    cards: [{ type: "capabilities" }],
    confidence: 0.5,
    confidenceLabel: "Not enough data to be certain",
    uncertainty: "I wasn't sure what you meant — try one of these.",
    followUps: ["Nanna sales ee vaara yaake kadime aagide?", "Stock yaavaga mugiyutte?", "Ee QR safe aa?"],
    stages: [{ stage: "UNDERSTANDING", detail: "Working out what you need" }],
  });
}
