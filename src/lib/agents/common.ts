import { getSeed } from "@/lib/data";
import { withReturns } from "@/lib/data/customers";
import type { AgentContext, AgentResponse, Lang } from "./types";

export const t = (lang: Lang, s: { kn: string; hi: string; en: string }) => s[lang];

export function respond(partial: Omit<AgentResponse, "id" | "source" | "intentSource" | "followUps" | "cards" | "facts"> & Partial<Pick<AgentResponse, "followUps" | "cards" | "facts">>): AgentResponse {
  return {
    id: `r-${Math.random().toString(36).slice(2, 10)}`,
    source: "rules",
    intentSource: "rules",
    followUps: [],
    cards: [],
    facts: {},
    ...partial,
  };
}

export const currentCustomers = (ctx: AgentContext) => withReturns(getSeed().customers, ctx.returnedCustomerIds);

export const pid = () => `ap-${Math.random().toString(36).slice(2, 10)}`;
