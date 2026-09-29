import { briefing, campaignStatus, createCampaign, customersAtRisk, salesDecline, simulateOffer } from "./growth";
import { addObligation, cashAvailable, invoiceUpdate, mandateRisk, stockRunout } from "./operations";
import { beneficiaryCheck, catalogAdd, creditReadiness, help, qrSafety } from "./trust";
import type { AgentContext, AgentName, AgentResponse, Intent, IntentResult } from "./types";

// GALLA ORCHESTRATOR — routes a detected intent to the right agent. Agents are deterministic:
// they retrieve data, run calculations and return structured cards + an optional action proposal.

export const INTENT_AGENT: Record<Intent, AgentName> = {
  briefing: "Orchestrator",
  sales_decline: "Growth",
  customers_at_risk: "Growth",
  simulate_offer: "Growth",
  create_campaign: "Growth",
  campaign_status: "Growth",
  stock_runout: "Inventory",
  invoice_update: "Inventory",
  cash_available: "Cashflow",
  add_obligation: "Cashflow",
  mandate_risk: "Cashflow",
  qr_safety: "Safety",
  beneficiary_check: "Safety",
  credit_readiness: "Credit Readiness",
  catalog_add: "Digitalization",
  help: "Orchestrator",
};

export function runAgent(intent: IntentResult, ctx: AgentContext): AgentResponse {
  const { language: lang, entities: e } = intent;
  let res: AgentResponse;
  switch (intent.intent) {
    case "briefing":
      res = briefing(ctx, lang);
      break;
    case "sales_decline":
      res = salesDecline(ctx, lang);
      break;
    case "customers_at_risk":
      res = customersAtRisk(ctx, lang);
      break;
    case "simulate_offer":
      res = simulateOffer(ctx, lang, e);
      break;
    case "create_campaign":
      res = createCampaign(ctx, lang, e);
      break;
    case "campaign_status":
      res = campaignStatus(ctx, lang);
      break;
    case "stock_runout":
      res = stockRunout(ctx, lang, e);
      break;
    case "invoice_update":
      res = invoiceUpdate(ctx, lang);
      break;
    case "cash_available":
      res = cashAvailable(ctx, lang);
      break;
    case "add_obligation":
      res = addObligation(ctx, lang, e);
      break;
    case "mandate_risk":
      res = mandateRisk(ctx, lang);
      break;
    case "qr_safety":
      res = qrSafety(ctx, lang, e);
      break;
    case "beneficiary_check":
      res = beneficiaryCheck(ctx, lang, e);
      break;
    case "credit_readiness":
      res = creditReadiness(ctx, lang);
      break;
    case "catalog_add":
      res = catalogAdd(ctx, lang, e);
      break;
    default:
      res = help(ctx, lang);
  }
  const understanding = { stage: "UNDERSTANDING" as const, detail: `Intent: ${intent.intent.replace(/_/g, " ")} · ${Math.round(intent.confidence * 100)}% sure` };
  return { ...res, intentSource: intent.source, stages: [understanding, ...res.stages.filter((s) => s.stage !== "UNDERSTANDING")] };
}
