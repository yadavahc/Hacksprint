import type { RiskLevel, RiskSignalInput, RiskSignalKey } from "@/lib/data/types";

// Nine-signal, fully explainable risk engine. Deterministic weights — no black box, and no claims
// about external fraud databases: every signal comes from the merchant's own (demo) history.

export const SIGNAL_META: Record<RiskSignalKey, { label: string; weight: number }> = {
  recipientHistory: { label: "Recipient history", weight: 0.14 },
  accountAge: { label: "Account age", weight: 0.08 },
  velocity: { label: "Transaction velocity", weight: 0.1 },
  amountAnomaly: { label: "Amount anomaly", weight: 0.14 },
  merchantHistory: { label: "Merchant history", weight: 0.12 },
  timing: { label: "Timing anomaly", weight: 0.06 },
  novelty: { label: "Beneficiary novelty", weight: 0.1 },
  behaviour: { label: "Behavioural mismatch", weight: 0.16 },
  network: { label: "Network / contextual risk", weight: 0.1 },
};

export const SIGNAL_ORDER = Object.keys(SIGNAL_META) as RiskSignalKey[];

export interface ScoredSignal extends RiskSignalInput {
  label: string;
  weight: number;
  contribution: number;
  level: RiskLevel;
}

export interface RiskAssessment {
  score: number; // 0–100
  level: RiskLevel;
  signals: ScoredSignal[];
  topReasons: ScoredSignal[];
  recommendation: string;
}

const levelFor = (score01: number): RiskLevel => (score01 >= 0.55 ? "HIGH" : score01 >= 0.25 ? "MEDIUM" : "LOW");

export function assessRisk(inputs: RiskSignalInput[]): RiskAssessment {
  const signals: ScoredSignal[] = SIGNAL_ORDER.map((key) => {
    const input = inputs.find((s) => s.key === key) ?? { key, score: 0, detail: "No signal" };
    const meta = SIGNAL_META[key];
    const score = Math.max(0, Math.min(1, input.score));
    return {
      ...input,
      score,
      label: meta.label,
      weight: meta.weight,
      contribution: meta.weight * score,
      level: score >= 0.7 ? "HIGH" : score >= 0.3 ? "MEDIUM" : "LOW",
    };
  });
  const total = signals.reduce((s, x) => s + x.contribution, 0);
  const level = levelFor(total);
  const topReasons = [...signals].filter((s) => s.contribution > 0.01).sort((a, b) => b.contribution - a.contribution).slice(0, 3);
  return {
    score: Math.round(total * 100),
    level,
    signals,
    topReasons,
    recommendation:
      level === "HIGH"
        ? "Do not pay. Verify directly with the person using a number you already trust."
        : level === "MEDIUM"
          ? "Probably fine, but confirm the name and amount before paying."
          : "Looks consistent with your history.",
  };
}
