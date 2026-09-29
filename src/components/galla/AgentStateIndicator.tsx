"use client";

import type { AgentStage } from "@/lib/agents/types";
import { useGalla } from "@/lib/store/provider";
import { cn } from "@/components/ui/primitives";

export const AGENT_STAGES: AgentStage[] = ["LISTENING", "UNDERSTANDING", "ANALYZING", "PREDICTING", "PLANNING", "WAITING_FOR_APPROVAL", "EXECUTING", "LEARNING"];

const DEFAULT_DETAIL: Record<AgentStage, string> = {
  IDLE: "Ready — say or type what you need",
  LISTENING: "Listening to you",
  UNDERSTANDING: "Working out what you need",
  ANALYZING: "Checking your business data",
  PREDICTING: "Estimating what happens next",
  PLANNING: "Choosing the best action",
  WAITING_FOR_APPROVAL: "Nothing happens until you approve",
  EXECUTING: "Carrying out your approved action",
  LEARNING: "Comparing expected vs actual results",
};

const toneText = (s: AgentStage) => (s === "WAITING_FOR_APPROVAL" ? "text-warn" : s === "LEARNING" ? "text-good" : s === "IDLE" ? "text-muted" : "text-sky-700");
const toneBar = (s: AgentStage) => (s === "WAITING_FOR_APPROVAL" ? "bg-warn" : s === "LEARNING" ? "bg-good" : s === "EXECUTING" ? "bg-navy" : "bg-sky");

export function AgentStateIndicator({ className }: { className?: string }) {
  const { state, voiceOpen } = useGalla();
  const stage: AgentStage = voiceOpen ? "LISTENING" : state.stage;
  const idx = AGENT_STAGES.indexOf(stage);
  const detail = state.thinking && stage !== "LISTENING" ? state.thinking.stages[state.thinking.index]?.detail ?? DEFAULT_DETAIL[stage] : DEFAULT_DETAIL[stage];
  return (
    <div className={className}>
      <div className="flex gap-1" aria-hidden>
        {AGENT_STAGES.map((s, i) => (
          <span key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", i < idx ? "bg-sky/60" : i === idx ? cn(toneBar(stage), "animate-pulse") : "bg-line")} />
        ))}
      </div>
      <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px]" aria-live="polite">
        <span className={cn("shrink-0 font-extrabold tracking-wider", toneText(stage))}>{stage === "IDLE" ? "READY" : stage.replace(/_/g, " ")}</span>
        <span className="truncate text-muted">· {detail}</span>
      </p>
    </div>
  );
}
