import { NextResponse } from "next/server";
import { sanitizeContext } from "@/lib/agents/context";
import { runAgent } from "@/lib/agents/orchestrator";
import { detectIntent } from "@/lib/ai/intent";
import { classifyIntent, llmStatus, narrate } from "@/lib/ai/llm";
import { GallaRequestSchema } from "@/lib/ai/schemas";

export const runtime = "nodejs";

// User input → intent detection → orchestrator → agent (deterministic data + maths)
// → optional LLM phrasing (Groq/Gemini, grounded and validated) → structured response. No state is mutated here.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = GallaRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please send a message between 1 and 500 characters." }, { status: 400 });

  const { text, preferredLanguage, forceDemo } = parsed.data;
  const context = sanitizeContext(parsed.data.context);
  const live = llmStatus().ai && !forceDemo;

  try {
    let intent = detectIntent(text, preferredLanguage);
    if (live && intent.confidence < 0.75) {
      const llmIntent = await classifyIntent(text);
      if (llmIntent && llmIntent.confidence > intent.confidence) intent = { ...llmIntent, entities: { ...intent.entities, ...llmIntent.entities } };
    }
    let response = runAgent(intent, context);
    if (live) response = await narrate(text, response);
    return NextResponse.json({ response, mode: live ? "live" : "demo" });
  } catch (error) {
    console.error("[galla] orchestrator failure", error);
    return NextResponse.json({ error: "Galla couldn't process that. Please try again." }, { status: 500 });
  }
}
