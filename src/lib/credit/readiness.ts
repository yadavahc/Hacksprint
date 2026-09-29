import { creditFactors } from "@/lib/data/documents";
import type { CreditFactor } from "@/lib/data/types";

// Credit readiness is guidance only. Galla never approves or rejects loans — lenders decide.

export interface Readiness {
  score: number;
  level: "READY" | "ALMOST READY" | "NEEDS IMPROVEMENT";
  factors: CreditFactor[];
  improvements: string[];
}

export function computeReadiness(opts: { documentIds: string[]; campaignCompleted: boolean }): Readiness {
  const factors = creditFactors({ hasGst: opts.documentIds.includes("doc-gst"), salesTrendRecovered: opts.campaignCompleted });
  const score = Math.round(factors.reduce((s, f) => s + f.score * f.weight, 0));
  return {
    score,
    level: score >= 80 ? "READY" : score >= 60 ? "ALMOST READY" : "NEEDS IMPROVEMENT",
    factors,
    improvements: factors.filter((f) => f.improve).map((f) => f.improve!),
  };
}
