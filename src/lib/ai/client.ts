import { runAgent } from "@/lib/agents/orchestrator";
import type { AgentContext, AgentResponse, Lang } from "@/lib/agents/types";
import { detectIntent } from "./intent";

export interface HealthStatus {
  ai: boolean;
  provider: string | null;
  model: string | null;
  fallbacks: string[];
  vision: string | null;
  voice: boolean;
  /** "Paytm staging" when real sandbox payments are configured. */
  payments: string | null;
}

/**
 * Ask Galla. Goes through the server orchestrator (which may use Groq or Gemini). If the server is
 * unreachable, the same deterministic orchestrator runs locally so the demo never breaks.
 */
export async function askGalla(text: string, context: AgentContext, opts: { preferredLanguage: Lang; forceDemo: boolean }): Promise<{ response: AgentResponse; mode: "live" | "demo" | "offline" }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch("/api/galla", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, preferredLanguage: opts.preferredLanguage, forceDemo: opts.forceDemo, context }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { response: AgentResponse; mode: "live" | "demo" };
    if (!json.response?.message) throw new Error("Malformed response");
    return json;
  } catch {
    return { response: runAgent(detectIntent(text, opts.preferredLanguage), context), mode: "offline" };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch("/api/health", { cache: "no-store" });
    if (!res.ok) throw new Error();
    return (await res.json()) as HealthStatus;
  } catch {
    return { ai: false, provider: null, model: null, fallbacks: [], vision: null, voice: false, payments: null };
  }
}
