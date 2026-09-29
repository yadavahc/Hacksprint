import { MERCHANT, STORY } from "@/lib/data/story";
import { customerStats, isAtRisk } from "@/lib/data/customers";
import { formatINR, formatINRCompact, greeting } from "@/lib/data/format";
import { SEED_PRODUCTS } from "@/lib/data/products";
import { inventoryHealth, reorderSuggestion } from "@/lib/inventory/inventory";
import { predictMandate } from "@/lib/cashflow/cashflow";
import { campaignSnapshot } from "@/lib/simulation/campaign";
import { simulateStorewide, simulateWinback } from "@/lib/simulation/whatIf";
import { currentCustomers, pid, respond, t } from "./common";
import type { AgentContext, AgentResponse, Card, Entities, Lang } from "./types";

// GROWTH AGENT — the primary capability: sales, customers, campaigns.

export function briefing(ctx: AgentContext, lang: Lang): AgentResponse {
  const stats = customerStats(currentCustomers(ctx));
  const inv = inventoryHealth(ctx.products);
  const nextRisk = [...inv.risk].sort((a, b) => a.stock / a.dailyVelocity - b.stock / b.dailyVelocity)[0];
  const mandate = predictMandate(ctx.obligations, ctx.reminders);
  const items: Extract<Card, { type: "briefing" }>["items"] = [];
  if (stats.atRisk > 0)
    items.push({ id: "b1", title: `${stats.atRisk} regular customers haven't purchased in 14 days`, detail: `~${formatINRCompact(stats.monthlyValueAtRisk)} a month at stake`, tone: "bad", prompt: "Nanna sales ee vaara yaake kadime aagide?" });
  if (nextRisk) {
    const s = reorderSuggestion(nextRisk);
    items.push({ id: "b2", title: `${nextRisk.name} may run out in ${Math.round(s.daysLeft)} days`, detail: `${nextRisk.stock} left · sells ~${nextRisk.dailyVelocity}/day`, tone: "warn", prompt: "Stock yaavaga mugiyutte?" });
  }
  if (mandate && mandate.shortfall > 0)
    items.push({ id: "b3", title: `${formatINR(mandate.amount)} EMI may fail in ${mandate.dueInDays} days`, detail: `${mandate.account} short by ${formatINR(mandate.shortfall)}`, tone: "warn", prompt: "Nanna EMI mandate fail aagutta?" });

  return respond({
    intent: "briefing",
    agent: "Orchestrator",
    language: lang,
    message: `${greeting()}, ${MERCHANT.owner}. I've found ${items.length} thing${items.length === 1 ? "" : "s"} that need${items.length === 1 ? "s" : ""} your attention.`,
    cards: [{ type: "briefing", items }],
    confidence: 0.9,
    confidenceLabel: "Based on current data",
    followUps: ["Nanna sales ee vaara yaake kadime aagide?", "Nijavaagi eshtu hana available ide?"],
    stages: [
      { stage: "ANALYZING", detail: "Scanning sales, customers, stock and cashflow" },
      { stage: "PLANNING", detail: "Ranking what matters most today" },
    ],
    facts: { atRisk: stats.atRisk, itemCount: items.length },
  });
}

function runningCampaign(ctx: AgentContext) {
  return ctx.campaigns.find((c) => c.status === "running") ?? ctx.campaigns.find((c) => c.status === "completed" && c.returned > 0);
}

export function salesDecline(ctx: AgentContext, lang: Lang): AgentResponse {
  const customers = currentCustomers(ctx);
  const stats = customerStats(customers);
  const pct = Math.round((1 - STORY.last7Revenue / STORY.fourWeekWeeklyAvg) * 100);
  const atta = ctx.products.find((p) => p.id === STORY.outOfStockProductId);
  const attaOut = !atta || atta.stock <= 0;
  const campaign = runningCampaign(ctx);
  const n = stats.atRisk;

  const message =
    t(lang, {
      kn: `Sales ee vaara ${pct}% kadime aagide — ${formatINR(STORY.last7Revenue)} vs nimma normal ${formatINR(STORY.fourWeekWeeklyAvg)}. Main reason: nimma ${STORY.atRiskRegulars} regular customers last 14 days alli purchase maadilla.`,
      hi: `Is hafte sales ${pct}% kam hui hai — ${formatINR(STORY.last7Revenue)} vs aapka normal ${formatINR(STORY.fourWeekWeeklyAvg)}. Main reason: aapke ${STORY.atRiskRegulars} regular customers ne 14 din se kuch nahi khareeda.`,
      en: `Sales are down ${pct}% this week — ${formatINR(STORY.last7Revenue)} vs your normal ${formatINR(STORY.fourWeekWeeklyAvg)}. The main reason: ${STORY.atRiskRegulars} regular customers haven't purchased in 14 days.`,
    }) +
    " " +
    (campaign
      ? t(lang, {
          kn: `Win-back campaign already nadeeta ide — ${campaign.returned} customers vaapas bandiddaare.`,
          hi: `Win-back campaign already chal raha hai — ${campaign.returned} customers wapas aaye hain.`,
          en: `Your win-back campaign is already working — ${campaign.returned} customers are back.`,
        })
      : t(lang, {
          kn: `Naanu ${n} customers-ge win-back offer suggest maadthini.`,
          hi: `Main in ${n} customers ke liye win-back offer suggest karta hoon.`,
          en: `I suggest a win-back offer for these ${n} customers.`,
        }));

  const cards: Card[] = [
    {
      type: "insight",
      title: "Why sales dropped",
      metric: { label: "Sales this week vs normal", value: `−${pct}%`, tone: "down" },
      evidence: [
        { label: "Regular customers inactive 14+ days", value: String(STORY.atRiskRegulars), tone: "down" },
        { label: "Evening transactions (5–9 PM)", value: `−${Math.round((1 - STORY.eveningTxnsPerDayNow / STORY.eveningTxnsPerDayBefore) * 100)}%`, tone: "down" },
        attaOut ? { label: "Aashirvaad Atta 5 kg unavailable", value: `${STORY.outOfStockDays} days`, tone: "warn" } : { label: "Aashirvaad Atta", value: "Back in stock", tone: "up" },
        { label: "Morning transactions", value: "Stable", tone: "neutral" },
      ],
      why: [
        `${STORY.atRiskRegulars} regulars used to visit every 3–7 days. Together they spend about ${formatINRCompact(customerStats(currentCustomers({ ...ctx, returnedCustomerIds: [] })).monthlyValueAtRisk)} a month.`,
        `${customerStats(currentCustomers({ ...ctx, returnedCustomerIds: [] })).drivers.stockout} of them regularly buy Aashirvaad Atta 5 kg — ${attaOut ? `out of stock for ${STORY.outOfStockDays} days` : "it was out of stock for 3 days"}.`,
        `${customerStats(currentCustomers({ ...ctx, returnedCustomerIds: [] })).drivers.evening} are evening shoppers. Evening payments fell from ${STORY.eveningTxnsPerDayBefore} to ${STORY.eveningTxnsPerDayNow.toFixed(0)} a day.`,
        "Morning and walk-in sales are steady, so this is not a store-wide problem.",
      ],
    },
    {
      type: "customers",
      count: n,
      highValue: stats.atRiskHighValue,
      monthlyValue: stats.monthlyValueAtRisk,
      drivers: [
        { label: "Stopped after atta stock-out", count: stats.drivers.stockout },
        { label: "Evening shoppers gone quiet", count: stats.drivers.evening },
        { label: "Unusually long gap", count: stats.drivers.gap },
      ],
      sample: customers.filter(isAtRisk).slice(0, 3).map((c) => ({ id: c.id, name: c.name, lastPurchaseDaysAgo: c.lastPurchaseDaysAgo, reason: c.riskReason ?? "" })),
    },
  ];
  if (!campaign) cards.push({ type: "cta", buttons: [{ label: "See plan", prompt: "₹50 offer kotre enagutte?" }, { label: "View customers", route: "customers" }] });

  return respond({
    intent: "sales_decline",
    agent: "Growth",
    language: lang,
    message,
    cards,
    confidence: 0.86,
    confidenceLabel: "Based on current data",
    uncertainty: "Payments show who stopped buying, not why evenings are quieter — a new shop nearby or road work could be factors I can't see.",
    followUps: campaign ? ["Campaign hegide?", "Stock yaavaga mugiyutte?"] : ["₹50 offer kotre enagutte?", "Yaaru aa 47 customers?", "₹100 discount kotre enagutte?"],
    stages: [
      { stage: "UNDERSTANDING", detail: "Sales question · Kannada-English" },
      { stage: "ANALYZING", detail: `Comparing this week with the 4-week average (${STORY.last30Txns.toLocaleString("en-IN")} payments)` },
      { stage: "ANALYZING", detail: `Checking ${customers.length} customers for unusual gaps` },
      { stage: "PREDICTING", detail: "Estimating the impact of inactive regulars" },
      { stage: "PLANNING", detail: "Choosing the best next action" },
    ],
    facts: {
      salesDropPct: pct,
      salesThisWeek: formatINR(STORY.last7Revenue),
      normalWeek: formatINR(STORY.fourWeekWeeklyAvg),
      inactiveRegulars: STORY.atRiskRegulars,
      currentlyAtRisk: n,
      eveningDropPct: 18,
      outOfStockProduct: attaOut ? "Aashirvaad Atta 5 kg (3 days)" : "none",
      campaignReturned: campaign?.returned ?? 0,
    },
  });
}

export function customersAtRisk(ctx: AgentContext, lang: Lang): AgentResponse {
  const customers = currentCustomers(ctx);
  const stats = customerStats(customers);
  const at = customers.filter(isAtRisk).sort((a, b) => b.churnProbability - a.churnProbability);
  return respond({
    intent: "customers_at_risk",
    agent: "Growth",
    language: lang,
    message: t(lang, {
      kn: `${stats.atRisk} regular customers risk-alli iddaare. ${stats.atRiskHighValue} jana high-value — tingalige ~${formatINRCompact(stats.monthlyValueAtRisk)} business.`,
      hi: `${stats.atRisk} regular customers risk mein hain. ${stats.atRiskHighValue} high-value hain — mahine ka ~${formatINRCompact(stats.monthlyValueAtRisk)} business.`,
      en: `${stats.atRisk} regular customers are at risk. ${stats.atRiskHighValue} are high-value — about ${formatINRCompact(stats.monthlyValueAtRisk)} of business a month.`,
    }),
    cards: [
      {
        type: "customers",
        count: stats.atRisk,
        highValue: stats.atRiskHighValue,
        monthlyValue: stats.monthlyValueAtRisk,
        drivers: [
          { label: "Stopped after atta stock-out", count: stats.drivers.stockout },
          { label: "Evening shoppers gone quiet", count: stats.drivers.evening },
          { label: "Unusually long gap", count: stats.drivers.gap },
        ],
        sample: at.slice(0, 4).map((c) => ({ id: c.id, name: c.name, lastPurchaseDaysAgo: c.lastPurchaseDaysAgo, reason: c.riskReason ?? "" })),
      },
      { type: "cta", buttons: [{ label: "₹50 win-back plan", prompt: "₹50 offer kotre enagutte?" }, { label: "All customers", route: "customers" }] },
    ],
    confidence: 0.88,
    confidenceLabel: "Based on current data",
    followUps: ["₹50 offer kotre enagutte?"],
    stages: [
      { stage: "ANALYZING", detail: `Scoring churn risk for ${customers.length} customers` },
      { stage: "PREDICTING", detail: "Estimating monthly value at stake" },
    ],
    facts: { atRisk: stats.atRisk, highValue: stats.atRiskHighValue, monthlyValue: formatINRCompact(stats.monthlyValueAtRisk) },
  });
}

export function simulateOffer(ctx: AgentContext, lang: Lang, entities: Entities): AgentResponse {
  const type = entities.offerType ?? ctx.lastOffer?.type ?? "winback";
  if (type === "storewide") {
    const amount = entities.amount ?? 100;
    const sim = simulateStorewide(amount);
    const better = simulateWinback(50, customerStats(currentCustomers(ctx)).atRisk || STORY.atRiskRegulars, ctx.calibration);
    return respond({
      intent: "simulate_offer",
      agent: "Growth",
      language: lang,
      message: t(lang, {
        kn: `₹${amount} discount kotre next 7 dina sales ${formatINR(sim.baselineSales)} inda ${formatINR(sim.withSales)} aagabahudu (+${formatINR(sim.incrementalSales)}). Aadre margin ~${formatINR(Math.abs(sim.marginImpact))} ${sim.marginImpact < 0 ? "kadime" : "jaasti"} aagutte — already barthiro customers-gu discount sigutte. 47 inactive customers-ge ₹50 win-back better.`,
        hi: `₹${amount} discount dene se agle 7 din ki sales ${formatINR(sim.baselineSales)} se ${formatINR(sim.withSales)} ho sakti hai (+${formatINR(sim.incrementalSales)}). Lekin margin ~${formatINR(Math.abs(sim.marginImpact))} ${sim.marginImpact < 0 ? "kam" : "zyada"} hoga — jo customers waise bhi aate, unhe bhi discount milega. 47 inactive customers ke liye ₹50 win-back better hai.`,
        en: `A ₹${amount} discount could lift next week's sales from ${formatINR(sim.baselineSales)} to ${formatINR(sim.withSales)} (+${formatINR(sim.incrementalSales)}). But margin likely ${sim.marginImpact < 0 ? "drops" : "rises"} by ~${formatINR(Math.abs(sim.marginImpact))}, because customers who'd buy anyway also get the discount. A ₹50 win-back for the 47 inactive regulars is better.`,
      }),
      cards: [{ type: "simulation", sim }, { type: "cta", buttons: [{ label: "Compare ₹50 win-back", prompt: "₹50 offer kotre enagutte?" }, { label: "Open Merchant Twin", route: "whatif" }] }],
      confidence: 0.64,
      confidenceLabel: "Estimated",
      uncertainty: "Simulated estimate. Real results depend on how many existing customers use the discount.",
      followUps: ["₹50 offer kotre enagutte?"],
      stages: [
        { stage: "UNDERSTANDING", detail: `What-if: ₹${amount} store-wide discount` },
        { stage: "PREDICTING", detail: "Running Merchant Twin simulation (7 days)" },
        { stage: "PLANNING", detail: `Comparing with a targeted win-back (ROI ${better.roi}×)` },
      ],
      facts: { discount: amount, baseline: formatINR(sim.baselineSales), withDiscount: formatINR(sim.withSales), incremental: formatINR(sim.incrementalSales), marginImpact: formatINR(sim.marginImpact), returning: sim.returning },
    });
  }
  return winbackPlan(ctx, lang, entities.amount ?? ctx.lastOffer?.amount ?? 50, "simulate_offer");
}

export function createCampaign(ctx: AgentContext, lang: Lang, entities: Entities): AgentResponse {
  return winbackPlan(ctx, lang, entities.amount ?? ctx.lastOffer?.amount ?? 50, "create_campaign");
}

function winbackPlan(ctx: AgentContext, lang: Lang, amount: number, intent: "simulate_offer" | "create_campaign"): AgentResponse {
  const stats = customerStats(currentCustomers(ctx));
  const audience = stats.atRisk;
  const running = ctx.campaigns.find((c) => c.status === "running");
  const sim = simulateWinback(amount, audience, ctx.calibration);
  const double = simulateWinback(amount * 2, audience, ctx.calibration);

  if (audience === 0) {
    return respond({
      intent,
      agent: "Growth",
      language: lang,
      message: t(lang, { kn: "Ivaga yaava regular customer risk-alli illa. Campaign beda.", hi: "Abhi koi regular customer risk mein nahi hai. Campaign ki zarurat nahi.", en: "No regular customers are at risk right now, so there's nothing to win back." }),
      confidence: 0.9,
      confidenceLabel: "Based on current data",
      stages: [{ stage: "ANALYZING", detail: "Checking inactive regulars" }],
    });
  }

  const message =
    t(lang, {
      kn: `Simulation prakara approximately ${sim.returnLow}–${sim.returnHigh} customers return aagabahudu. Estimated incremental sales ${formatINR(sim.salesLow)}–${formatINR(sim.salesHigh)}.`,
      hi: `Simulation ke hisaab se lagbhag ${sim.returnLow}–${sim.returnHigh} customers wapas aa sakte hain. Estimated incremental sales ${formatINR(sim.salesLow)}–${formatINR(sim.salesHigh)}.`,
      en: `The simulation says roughly ${sim.returnLow}–${sim.returnHigh} customers are likely to return. Estimated incremental sales: ${formatINR(sim.salesLow)}–${formatINR(sim.salesHigh)}.`,
    }) +
    " " +
    (running
      ? t(lang, { kn: "Ee customers-ge already ondu campaign nadeeta ide — duplicate maadalla.", hi: "In customers ke liye ek campaign already chal raha hai — duplicate nahi banaunga.", en: "A campaign is already running for these customers, so I won't create a duplicate." })
      : t(lang, { kn: `Ee campaign-na ${audience} customers-ge naanu create maadabahudu.`, hi: `Main ye campaign ${audience} customers ke liye bana sakta hoon.`, en: `I can create this campaign for ${audience} customers.` }));

  const payload = {
    kind: "create_campaign" as const,
    offerAmount: amount,
    audienceSize: audience,
    minBill: sim.minBill,
    channel: "WhatsApp + SMS",
    message: `Namaskara! ${MERCHANT.name} misses you. Get ₹${amount} off on your next bill above ₹${sim.minBill} — valid for 7 days.`,
    returnLow: sim.returnLow,
    returnHigh: sim.returnHigh,
    salesLow: sim.salesLow,
    salesHigh: sim.salesHigh,
    roi: sim.roi,
  };

  return respond({
    intent,
    agent: "Growth",
    language: lang,
    message,
    cards: [{ type: "simulation", sim }],
    proposal: running
      ? undefined
      : {
          id: pid(),
          agent: "Growth",
          title: `₹${amount} win-back campaign · ${audience} customers`,
          summary: `Galla wants to create a ₹${amount} win-back campaign for ${audience} customers.`,
          why: `${audience} regular customers haven't purchased in 14+ days`,
          expected: `${sim.returnLow}–${sim.returnHigh} returning customers · ${formatINR(sim.salesLow)}–${formatINR(sim.salesHigh)} sales`,
          payload,
          editable: true,
        },
    confidence: 0.68,
    confidenceLabel: "Estimated",
    uncertainty: `Simulated estimate. Doubling the offer to ₹${amount * 2} brings only ~${double.returnHigh - sim.returnHigh <= 0 ? "the same number of" : `${Math.round(double.expected - sim.expected)} more`} customers, so ₹${amount} is the better balance.`,
    followUps: running ? ["Campaign hegide?"] : ["₹100 discount kotre enagutte?"],
    stages: [
      { stage: "UNDERSTANDING", detail: `What-if: ₹${amount} win-back offer` },
      { stage: "ANALYZING", detail: `Loading ${audience} inactive regulars (avg basket ₹${sim.avgBasket})` },
      { stage: "PREDICTING", detail: "Running Merchant Twin simulation" },
      { stage: "PLANNING", detail: "Preparing a campaign for your approval" },
    ],
    facts: { offer: `₹${amount}`, audience, returnLow: sim.returnLow, returnHigh: sim.returnHigh, salesLow: formatINR(sim.salesLow), salesHigh: formatINR(sim.salesHigh), roi: `${sim.roi}×` },
  });
}

export function campaignStatus(ctx: AgentContext, lang: Lang): AgentResponse {
  const c = ctx.campaigns.find((x) => x.status === "running") ?? ctx.campaigns.find((x) => x.status === "completed");
  if (!c) {
    return respond({
      intent: "campaign_status",
      agent: "Growth",
      language: lang,
      message: t(lang, { kn: "Innu yaava campaign start aagilla. ₹50 win-back try maadona?", hi: "Abhi koi campaign nahi chal raha. ₹50 win-back try karein?", en: "No campaign is running yet. Want to try a ₹50 win-back?" }),
      cards: [{ type: "cta", buttons: [{ label: "₹50 win-back plan", prompt: "₹50 offer kotre enagutte?" }] }],
      confidence: 0.95,
      confidenceLabel: "Confirmed",
      stages: [{ stage: "ANALYZING", detail: "Checking campaigns" }],
    });
  }
  const snap = campaignSnapshot(c.progress, c.offerAmount, c.audienceSize);
  const done = c.status === "completed";
  return respond({
    intent: "campaign_status",
    agent: "Growth",
    language: lang,
    message: done
      ? t(lang, {
          kn: `Campaign mugiditu: ${snap.returned} customers vaapas bandru, ${formatINR(snap.sales)} sales, ROI ${snap.roi}×. Expectation-ginta chennagi perform maaditu.`,
          hi: `Campaign complete: ${snap.returned} customers wapas aaye, ${formatINR(snap.sales)} sales, ROI ${snap.roi}×. Expectation se better perform kiya.`,
          en: `Campaign complete: ${snap.returned} customers came back, ${formatINR(snap.sales)} in sales, ROI ${snap.roi}×. It performed better than expected.`,
        })
      : t(lang, {
          kn: `Campaign day ${snap.day}/7: ${snap.opened} jana message open maadiddaare, ${snap.returned} customers vaapas bandiddaare, ${formatINR(snap.sales)} sales.`,
          hi: `Campaign day ${snap.day}/7: ${snap.opened} logon ne message khola, ${snap.returned} customers wapas aaye, ${formatINR(snap.sales)} sales.`,
          en: `Campaign day ${snap.day} of 7: ${snap.opened} opened the message, ${snap.returned} customers are back, ${formatINR(snap.sales)} in sales.`,
        }),
    cards: [{ type: "campaign", campaignId: c.id }],
    confidence: 0.95,
    confidenceLabel: "Confirmed",
    followUps: ["Nanna sales ee vaara yaake kadime aagide?", "Loan-ge ready iddina?"],
    stages: [{ stage: "ANALYZING", detail: "Reading campaign results" }],
    facts: { day: snap.day, opened: snap.opened, returned: snap.returned, sales: formatINR(snap.sales), roi: `${snap.roi}×` },
  });
}

export const growthSeedProducts = SEED_PRODUCTS;
