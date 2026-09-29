import { SAMPLE_DOCUMENTS } from "@/lib/data/documents";
import { formatINR } from "@/lib/data/format";
import { SUPPLIERS } from "@/lib/data/products";
import { STORY } from "@/lib/data/story";
import { cashPosition, daysUntilDayOfMonth, findDuplicate, matchPattern, predictMandate } from "@/lib/cashflow/cashflow";
import { inventoryHealth, reorderSuggestion, daysRemaining } from "@/lib/inventory/inventory";
import { pid, respond, t } from "./common";
import type { AgentContext, AgentResponse, Entities, Lang } from "./types";

// INVENTORY AGENT ------------------------------------------------------------------------------

export function stockRunout(ctx: AgentContext, lang: Lang, entities: Entities): AgentResponse {
  const inv = inventoryHealth(ctx.products);
  const risk = [...inv.risk].sort((a, b) => daysRemaining(a) - daysRemaining(b));
  const focus = entities.productName ? ctx.products.find((p) => p.name.toLowerCase().includes(entities.productName!.toLowerCase())) : risk[0];
  const atta = inv.out.find((p) => p.id === STORY.outOfStockProductId);

  if (!focus && !inv.out.length) {
    return respond({
      intent: "stock_runout",
      agent: "Inventory",
      language: lang,
      message: t(lang, { kn: `Ella stock chennagide — ${inv.pct}% products 5 dina mele saaku.`, hi: `Sab stock theek hai — ${inv.pct}% products 5 din se zyada chalenge.`, en: `Stock looks healthy — ${inv.pct}% of products will last more than 5 days.` }),
      confidence: 0.9,
      confidenceLabel: "Based on current data",
      stages: [{ stage: "ANALYZING", detail: `Checking ${ctx.products.length} products` }],
    });
  }

  const target = focus ?? inv.out[0];
  const s = reorderSuggestion(target);
  const sameSupplier = risk.filter((p) => p.supplierId === target.supplierId);
  const lines = (sameSupplier.length ? sameSupplier : [target]).map((p) => {
    const r = reorderSuggestion(p);
    return { productId: p.id, name: p.name, quantity: r.quantity, unitCost: p.cost };
  });
  const total = Math.round(lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0));
  const supplier = SUPPLIERS.find((x) => x.id === target.supplierId)!;
  const days = Math.max(0, Math.round(s.daysLeft));

  const message =
    (target.stock > 0
      ? t(lang, {
          kn: `${target.name} stock ~${days} dinagalalli mugiyutte (${target.stock} ide, dinakke ~${target.dailyVelocity} sell aagutte).`,
          hi: `${target.name} ka stock ~${days} din mein khatam hoga (${target.stock} bache hain, roz ~${target.dailyVelocity} bikte hain).`,
          en: `${target.name} will likely run out in ~${days} days (${target.stock} left, selling ~${target.dailyVelocity} a day).`,
        })
      : t(lang, { kn: `${target.name} stock illa.`, hi: `${target.name} out of stock hai.`, en: `${target.name} is out of stock.` })) +
    (atta
      ? " " +
        t(lang, {
          kn: `Aashirvaad Atta already ${STORY.outOfStockDays} dina inda stock illa — 14 regular customers adanne kharidisuttiddaru.`,
          hi: `Aashirvaad Atta ${STORY.outOfStockDays} din se out of stock hai — 14 regular customers yahi khareedte the.`,
          en: `Aashirvaad Atta has been out of stock for ${STORY.outOfStockDays} days — 14 regulars buy it.`,
        })
      : "") +
    " " +
    t(lang, { kn: `${supplier.name}-ge order ready maadthini.`, hi: `${supplier.name} ke liye order ready karta hoon.`, en: `I can prepare an order for ${supplier.name}.` });

  return respond({
    intent: "stock_runout",
    agent: "Inventory",
    language: lang,
    message,
    cards: [
      {
        type: "stock",
        items: [...risk, ...inv.out].map((p) => ({
          productId: p.id,
          name: `${p.name} ${p.unit}`,
          stock: p.stock,
          daysLeft: p.stock > 0 ? Math.round(daysRemaining(p) * 10) / 10 : null,
          status: p.stock > 0 ? ("risk" as const) : ("out" as const),
          note: p.stock > 0 ? `Reorder ${reorderSuggestion(p).quantity} · ${reorderSuggestion(p).supplierName}` : `Out for ${p.outOfStockDays ?? 1} days · ${SUPPLIERS.find((x) => x.id === p.supplierId)?.name}`,
        })),
      },
    ],
    proposal: {
      id: pid(),
      agent: "Inventory",
      title: `Supplier order · ${supplier.name}`,
      summary: `Galla wants to prepare a ${formatINR(total)} order for ${supplier.name}.`,
      why: `${lines.map((l) => l.name).join(" and ")} ${lines.length > 1 ? "run" : "runs"} out within ${RISK_LABEL} days`,
      expected: `Stock for ~10 days · delivery in ${supplier.leadTimeDays} day${supplier.leadTimeDays > 1 ? "s" : ""}`,
      payload: { kind: "prepare_supplier_order", supplierId: supplier.id, supplierName: supplier.name, lines, total },
      editable: false,
    },
    confidence: 0.82,
    confidenceLabel: "Likely",
    uncertainty: "Based on the last 14 days of sales velocity — a festival or bulk order would change this.",
    followUps: ["Invoice inda stock update maadu.", "Nanna sales ee vaara yaake kadime aagide?"],
    stages: [
      { stage: "ANALYZING", detail: `Sales velocity for ${ctx.products.length} products` },
      { stage: "PREDICTING", detail: "Estimating stock-out dates" },
      { stage: "PLANNING", detail: "Sizing a 10-day reorder by case" },
    ],
    facts: { product: target.name, daysLeft: days, stock: target.stock, perDay: target.dailyVelocity, supplier: supplier.name, orderTotal: formatINR(total) },
  });
}

const RISK_LABEL = 5;

export function invoiceUpdate(ctx: AgentContext, lang: Lang): AgentResponse {
  const invoices = SAMPLE_DOCUMENTS.filter((d) => d.kind === "invoice" && !ctx.appliedInvoiceIds.includes(d.id));
  const doc = invoices.find((d) => ctx.documentIds.includes(d.id)) ?? invoices.find((d) => d.id === "doc-invoice-annapoorna") ?? invoices[0];
  if (!doc) {
    return respond({
      intent: "invoice_update",
      agent: "Inventory",
      language: lang,
      message: t(lang, { kn: "Ella invoices already stock-ge update aagide.", hi: "Saare invoices already stock mein update ho chuke hain.", en: "All invoices are already reflected in your stock." }),
      cards: [{ type: "cta", buttons: [{ label: "Upload another invoice", route: "documents" }] }],
      confidence: 0.95,
      confidenceLabel: "Confirmed",
      stages: [{ stage: "ANALYZING", detail: "Checking invoices" }],
    });
  }
  const lines = (doc.lineItems ?? []).filter((l) => l.productId).map((l) => ({ productId: l.productId!, name: l.name, quantity: l.quantity }));
  const avg = Math.round(((doc.lineItems ?? []).reduce((s, l) => s + l.confidence, 0) / Math.max(1, doc.lineItems?.length ?? 1)) * 100);
  const low = (doc.lineItems ?? []).filter((l) => l.confidence < 0.85);
  const hasAtta = lines.some((l) => l.productId === STORY.outOfStockProductId);
  return respond({
    intent: "invoice_update",
    agent: "Inventory",
    language: lang,
    message:
      t(lang, {
        kn: `Invoice (${doc.title.split(" · ")[0]}) inda ${lines.length} items extract maadide — ${avg}% confidence. Approve maadidre stock update maadthini.`,
        hi: `Invoice (${doc.title.split(" · ")[0]}) se ${lines.length} items nikale — ${avg}% confidence. Approve karein to stock update kar doon.`,
        en: `I read ${lines.length} items from the invoice (${doc.title.split(" · ")[0]}) with ${avg}% confidence. Approve and I'll update your stock.`,
      }) +
      (hasAtta ? " " + t(lang, { kn: "Aashirvaad Atta 30 bags bandide — stock-out problem solve aagutte.", hi: "Aashirvaad Atta ke 30 bags aaye hain — stock-out solve ho jayega.", en: "It includes 30 bags of Aashirvaad Atta, which fixes the stock-out." }) : ""),
    cards: [{ type: "invoice", documentId: doc.id }],
    proposal: {
      id: pid(),
      agent: "Inventory",
      title: `Update stock from ${doc.title.split(" · ")[1] ?? "invoice"}`,
      summary: `Galla wants to add ${lines.reduce((s, l) => s + l.quantity, 0)} units across ${lines.length} products to inventory.`,
      why: `Extracted from ${doc.title}`,
      expected: hasAtta ? "Aashirvaad Atta back in stock · stock-outs cleared" : "Inventory matches the invoice",
      payload: { kind: "update_inventory", documentId: doc.id, lines },
      editable: false,
    },
    confidence: avg / 100,
    confidenceLabel: low.length ? "Likely" : "Based on current data",
    uncertainty: low.length ? `Please check: ${low.map((l) => `${l.name} (${Math.round(l.confidence * 100)}%)`).join(", ")}.` : undefined,
    followUps: ["Stock yaavaga mugiyutte?"],
    stages: [
      { stage: "UNDERSTANDING", detail: "Reading invoice image" },
      { stage: "ANALYZING", detail: "Matching line items to your products" },
      { stage: "PLANNING", detail: "Preparing stock update" },
    ],
    facts: { items: lines.length, confidencePct: avg, supplier: doc.title.split(" · ")[0] },
  });
}

// CASHFLOW AGENT -------------------------------------------------------------------------------

export function cashAvailable(ctx: AgentContext, lang: Lang): AgentResponse {
  const pos = cashPosition(ctx.obligations, ctx.patterns);
  const pending = pos.pending[0];
  return respond({
    intent: "cash_available",
    agent: "Cashflow",
    language: lang,
    message:
      t(lang, {
        kn: `Account-alli ${formatINR(pos.balance)} ide, aadre ${formatINR(pos.committed)} already commit aagide. Nijavaagi available: ${formatINR(pos.available)}.`,
        hi: `Account mein ${formatINR(pos.balance)} hai, lekin ${formatINR(pos.committed)} already commit ho chuka hai. Asli available: ${formatINR(pos.available)}.`,
        en: `You have ${formatINR(pos.balance)} in your accounts, but ${formatINR(pos.committed)} is already promised. Truly available: ${formatINR(pos.available)}.`,
      }) +
      (pending
        ? " " +
          t(lang, {
            kn: `${pending.title} (${formatINR(pending.amount)}) kooda kaanistide — confirm maadidre ${formatINR(pos.available - pending.amount)} aagutte.`,
            hi: `${pending.title} (${formatINR(pending.amount)}) bhi dikh raha hai — confirm karne par ${formatINR(pos.available - pending.amount)} bachega.`,
            en: `I also see ${pending.title} (${formatINR(pending.amount)}) — if you confirm it, available becomes ${formatINR(pos.available - pending.amount)}.`,
          })
        : ""),
    cards: [{ type: "cashflow", position: pos }, { type: "cta", buttons: [{ label: "Open Cashflow", route: "cashflow" }, { label: "EMI risk?", prompt: "Nanna EMI mandate fail aagutta?" }] }],
    confidence: 0.9,
    confidenceLabel: "Based on current data",
    uncertainty: pos.pending.length ? "Unconfirmed recurring payments are not counted yet, to avoid double-counting." : undefined,
    followUps: ["Naanu prati tingalu ₹10,000 rent kodtini.", "Supplier-ge ₹12,000 Friday kodbeku."],
    stages: [
      { stage: "ANALYZING", detail: "Reading 2 bank accounts" },
      { stage: "ANALYZING", detail: `Subtracting ${pos.items.length} commitments due in 30 days` },
      { stage: "PREDICTING", detail: "Forecasting settlements for 7 days" },
    ],
    facts: { balance: formatINR(pos.balance), committed: formatINR(pos.committed), available: formatINR(pos.available), expected7d: formatINR(pos.expected) },
  });
}

const KIND_TITLE = { rent: "Shop rent", supplier: "Supplier payment", salary: "Staff salary", bill: "Bill payment", mandate: "Mandate", manual: "Promised payment" } as const;

export function addObligation(ctx: AgentContext, lang: Lang, e: Entities): AgentResponse {
  if (!e.amount) {
    return respond({
      intent: "add_obligation",
      agent: "Cashflow",
      language: lang,
      message: t(lang, { kn: "Eshtu amount mattu yaavaga? Udaharane: “Supplier-ge ₹12,000 Friday kodbeku.”", hi: "Kitna amount aur kab? Jaise: “Supplier ko ₹12,000 Friday dena hai.”", en: "How much, and when? For example: “I have to pay the supplier ₹12,000 on Friday.”" }),
      confidence: 0.4,
      confidenceLabel: "Not enough data to be certain",
      stages: [{ stage: "UNDERSTANDING", detail: "Looking for amount and date" }],
    });
  }
  const kind = e.obligationKind ?? "manual";
  const pattern = matchPattern(ctx.patterns.filter((p) => !p.confirmed), kind, e.amount);
  const dueInDays = e.dueInDays ?? (pattern ? daysUntilDayOfMonth(pattern.dayOfMonth) : e.recurring ? 30 : 7);
  const duplicate = findDuplicate(ctx.obligations, { kind, amount: e.amount, dueInDays });
  const recurring = !!e.recurring || !!pattern;
  const title = pattern ? `${pattern.title} · ${pattern.payee}` : e.payee ? `${KIND_TITLE[kind]} · ${e.payee}` : KIND_TITLE[kind];
  const dueLabel = recurring && pattern ? `Every month on the ${pattern.dayOfMonth}th · next in ${dueInDays} days` : e.dayLabel ? `${e.dayLabel} (in ${dueInDays} days)` : `In ${dueInDays} days`;

  if (duplicate) {
    return respond({
      intent: "add_obligation",
      agent: "Cashflow",
      language: lang,
      message: t(lang, {
        kn: `${duplicate.title} (${formatINR(duplicate.amount)}) already track aagtide — double count maadalla.`,
        hi: `${duplicate.title} (${formatINR(duplicate.amount)}) already track ho raha hai — double count nahi karunga.`,
        en: `${duplicate.title} (${formatINR(duplicate.amount)}) is already tracked, so I won't count it twice.`,
      }),
      cards: [{ type: "obligation", title: duplicate.title, amount: duplicate.amount, dueLabel: `In ${duplicate.dueInDays} days`, recurring: duplicate.recurring === "monthly", note: "Already tracked" }],
      confidence: 0.9,
      confidenceLabel: "Confirmed",
      stages: [{ stage: "ANALYZING", detail: "Checking existing obligations for duplicates" }],
    });
  }

  const position = cashPosition(ctx.obligations, ctx.patterns);
  const message = pattern
    ? t(lang, {
        kn: `${formatINR(pattern.amount)} rent already payment history-alli kaanistide (${pattern.payee}, prati tingalu ${pattern.dayOfMonth}th). Adanne confirm maadi add maadthini — double count aagalla.`,
        hi: `${formatINR(pattern.amount)} rent payment history mein already dikh raha hai (${pattern.payee}, har mahine ${pattern.dayOfMonth} tareekh). Usi ko confirm karke add karunga — double count nahi hoga.`,
        en: `I already see ${formatINR(pattern.amount)} rent in your payment history (${pattern.payee}, around the ${pattern.dayOfMonth}th). I'll confirm that pattern instead of adding a duplicate.`,
      })
    : t(lang, {
        kn: `${formatINR(e.amount)} ${kind === "supplier" ? "supplier" : ""} obligation ${e.dayLabel ?? `${dueInDays} dinagalalli`} ge add maadthini. Available hana ${formatINR(position.available)} inda ${formatINR(position.available - e.amount)} aagutte.`,
        hi: `${formatINR(e.amount)} ${kind === "supplier" ? "supplier" : ""} obligation ${e.dayLabel ?? `${dueInDays} din`} ke liye add karunga. Available paisa ${formatINR(position.available)} se ${formatINR(position.available - e.amount)} ho jayega.`,
        en: `I'll add a ${formatINR(e.amount)} ${kind === "supplier" ? "supplier " : ""}obligation for ${e.dayLabel ?? `${dueInDays} days from now`}. Available cash goes from ${formatINR(position.available)} to ${formatINR(position.available - e.amount)}.`,
      }).replace(/\s+/g, " ");

  return respond({
    intent: "add_obligation",
    agent: "Cashflow",
    language: lang,
    message,
    cards: [{ type: "obligation", title, amount: e.amount, dueLabel, recurring, note: pattern ? pattern.evidence : "Counted in committed money" }],
    proposal: {
      id: pid(),
      agent: "Cashflow",
      title: `Record ${formatINR(e.amount)} · ${title}`,
      summary: `Galla wants to record a ${formatINR(e.amount)} ${recurring ? "monthly " : ""}obligation.`,
      why: pattern ? pattern.evidence : "You told Galla this money is promised",
      expected: `Available cash reflects it · reminder before due date`,
      payload: { kind: "record_obligation", title, obligationKind: kind, amount: e.amount, dueInDays, recurring, patternId: pattern?.id },
      editable: false,
    },
    confidence: pattern ? pattern.confidence : 0.9,
    confidenceLabel: pattern ? "Likely" : "Confirmed",
    followUps: ["Nijavaagi eshtu hana available ide?"],
    stages: [
      { stage: "UNDERSTANDING", detail: `Amount ${formatINR(e.amount)} · ${e.dayLabel ?? (recurring ? "monthly" : `${dueInDays} days`)}` },
      { stage: "ANALYZING", detail: "Checking payment history and duplicates" },
      { stage: "PLANNING", detail: "Preparing obligation record" },
    ],
    facts: { amount: formatINR(e.amount), due: e.dayLabel ?? `${dueInDays} days`, availableAfter: formatINR(position.available - e.amount) },
  });
}

export function mandateRisk(ctx: AgentContext, lang: Lang): AgentResponse {
  const m = predictMandate(ctx.obligations, ctx.reminders);
  if (!m) {
    return respond({
      intent: "mandate_risk",
      agent: "Cashflow",
      language: lang,
      message: t(lang, { kn: "Yaava upcoming mandate illa.", hi: "Koi upcoming mandate nahi hai.", en: "You have no upcoming mandates." }),
      confidence: 0.95,
      confidenceLabel: "Confirmed",
      stages: [{ stage: "ANALYZING", detail: "Checking mandates" }],
    });
  }
  const top = Math.ceil(m.shortfall / 500) * 500 + (m.shortfall > 0 ? 0 : 0);
  const move = Math.max(2000, top);
  const pct = Math.round(m.probability * 100);
  return respond({
    intent: "mandate_risk",
    agent: "Cashflow",
    language: lang,
    message:
      m.shortfall > 0
        ? t(lang, {
            kn: `Nimma ${formatINR(m.amount)} EMI mandate ${m.dueInDays} dinagalalli fail aagabahudu (${pct}% chance). ${m.account}-alli ${formatINR(m.accountBalance)} ide, aadre BESCOM ${formatINR(m.debitsBefore[0]?.amount ?? 0)} modalu debit aagutte — ${formatINR(m.projectedBalance)} maatra uliyutte.`,
            hi: `Aapka ${formatINR(m.amount)} EMI mandate ${m.dueInDays} din mein fail ho sakta hai (${pct}% chance). ${m.account} mein ${formatINR(m.accountBalance)} hai, lekin pehle BESCOM ${formatINR(m.debitsBefore[0]?.amount ?? 0)} katega — sirf ${formatINR(m.projectedBalance)} bachega.`,
            en: `Your ${formatINR(m.amount)} recurring payment may fail in ${m.dueInDays} days (${pct}% chance). ${m.account} has ${formatINR(m.accountBalance)}, but BESCOM ${formatINR(m.debitsBefore[0]?.amount ?? 0)} debits first, leaving only ${formatINR(m.projectedBalance)}.`,
          })
        : t(lang, { kn: "EMI mandate safe aagi kaanistide.", hi: "EMI mandate safe lag raha hai.", en: "Your EMI mandate looks on track." }),
    cards: [{ type: "mandate", prediction: m }],
    proposal:
      m.shortfall > 0 && !m.mitigated
        ? {
            id: pid(),
            agent: "Cashflow",
            title: `Reminder: move ${formatINR(move)} to ${m.account}`,
            summary: `Galla wants to set a reminder to move ${formatINR(move)} to ${m.account} by tomorrow.`,
            why: `${m.account} will be short by ${formatINR(m.shortfall)} before the EMI`,
            expected: "EMI succeeds · no bounce charges",
            payload: { kind: "create_reminder", title: `Move ${formatINR(move)} from HDFC ••4421 to ${m.account}`, dueInDays: 1, note: `EMI of ${formatINR(m.amount)} debits in ${m.dueInDays} days. Galla never moves money — this is a reminder only.` },
            editable: false,
          }
        : undefined,
    confidence: m.probability,
    confidenceLabel: "Likely",
    uncertainty: "Simulated prediction from demo data. An unexpected deposit into that account would change this.",
    followUps: ["Nijavaagi eshtu hana available ide?"],
    stages: [
      { stage: "ANALYZING", detail: `Projecting ${m.account} balance day by day` },
      { stage: "PREDICTING", detail: "Estimating mandate failure probability" },
      { stage: "PLANNING", detail: "Suggesting a safe fix" },
    ],
    facts: { amount: formatINR(m.amount), dueInDays: m.dueInDays, probabilityPct: pct, projected: formatINR(m.projectedBalance), shortfall: formatINR(m.shortfall) },
  });
}
