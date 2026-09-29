import type { AgentContext } from "@/lib/agents/types";
import { getSeed } from "@/lib/data";
import { withReturns } from "@/lib/data/customers";
import { campaignSnapshot, type CampaignSnapshot } from "@/lib/simulation/campaign";
import type { AppState, Campaign } from "./types";

export const snapshotOf = (c: Campaign): CampaignSnapshot => c.final ?? campaignSnapshot(c.progress, c.offerAmount, c.audienceSize);

export function returnedCustomerIds(state: Pick<AppState, "campaigns">): string[] {
  return state.campaigns.filter((c) => !c.seeded).flatMap((c) => c.customerOrder.slice(0, snapshotOf(c).returned));
}

let customersCache: { key: string; value: ReturnType<typeof withReturns> } | null = null;

export function currentCustomers(state: Pick<AppState, "campaigns">) {
  const ids = returnedCustomerIds(state);
  const key = ids.join(",");
  if (customersCache?.key === key) return customersCache.value;
  const value = withReturns(getSeed().customers, ids);
  customersCache = { key, value };
  return value;
}

export function agentContext(state: AppState): AgentContext {
  return {
    products: state.products,
    obligations: state.obligations,
    patterns: state.patterns,
    documentIds: state.documents.map((d) => d.sampleId ?? d.id),
    appliedInvoiceIds: state.documents.filter((d) => d.appliedToStock).map((d) => d.sampleId ?? d.id),
    campaigns: state.campaigns
      .filter((c) => !c.seeded)
      .map((c) => {
        const s = snapshotOf(c);
        return { id: c.id, status: c.status, offerAmount: c.offerAmount, audienceSize: c.audienceSize, progress: c.progress, returned: s.returned, sales: s.sales };
      }),
    returnedCustomerIds: returnedCustomerIds(state),
    reminders: state.reminders.map((r) => ({ title: r.title })),
    catalogNames: state.catalog.map((c) => c.name),
    lastOffer: state.lastOffer,
    calibration: state.calibration,
    preferredLanguage: state.settings.language,
  };
}

export function pendingProposal(state: AppState) {
  return Object.values(state.proposals).find((p) => p.status === "pending");
}
