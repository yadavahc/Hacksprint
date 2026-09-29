import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { renderSystemPrompt } from "@/lib/agents/prompts";
import type { AgentResponse, IntentResult } from "@/lib/agents/types";
import { isGrounded } from "./guard";
import { DOCUMENT_JSON_SCHEMA, DocumentExtractionSchema, INTENT_JSON_SCHEMA, IntentSchema, NARRATION_JSON_SCHEMA, NarrationSchema } from "./schemas";

// Server-only, provider-agnostic LLM layer. Keys never reach the browser.
//   Text (intent + grounded phrasing): Groq → Gemini → Anthropic, whichever keys are configured.
//   Vision (document extraction):      Gemini → Anthropic.
// Every call has a timeout and strict validation; any failure falls back to deterministic demo logic.

export type Provider = "groq" | "gemini" | "anthropic";
type Kind = "text" | "vision";

const TIMEOUT_MS = 12000;

const MODELS = {
  groq: () => process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  geminiText: () => process.env.GEMINI_TEXT_MODEL || "gemini-3.5-flash-lite",
  geminiVision: () => process.env.GEMINI_VISION_MODEL || "gemini-3.5-flash",
  anthropic: () => "claude-opus-5",
};

// Popular Gemini models return 503 under load, so each request walks a short chain of models.
const geminiChain = (kind: Kind) => Array.from(new Set(kind === "vision" ? [MODELS.geminiVision(), "gemini-2.5-flash", "gemini-3.5-flash-lite"] : [MODELS.geminiText(), "gemini-2.5-flash-lite", "gemini-3.5-flash"]));

const HAS: Record<Provider, () => boolean> = {
  groq: () => Boolean(process.env.GROQ_API_KEY),
  gemini: () => Boolean(process.env.GEMINI_API_KEY),
  anthropic: () => Boolean(process.env.ANTHROPIC_API_KEY),
};

const ORDER: Record<Kind, Provider[]> = { text: ["groq", "gemini", "anthropic"], vision: ["gemini", "anthropic"] };
const LABEL: Record<Provider, string> = { groq: "Groq", gemini: "Gemini", anthropic: "Claude" };

const modelFor = (p: Provider, kind: Kind) => (p === "groq" ? MODELS.groq() : p === "gemini" ? (kind === "vision" ? MODELS.geminiVision() : MODELS.geminiText()) : MODELS.anthropic());

export function llmStatus() {
  const text = ORDER.text.filter((p) => HAS[p]());
  const vision = ORDER.vision.filter((p) => HAS[p]());
  return {
    ai: text.length > 0,
    provider: text[0] ? LABEL[text[0]] : null,
    model: text[0] ? modelFor(text[0], "text") : null,
    fallbacks: text.slice(1).map((p) => LABEL[p]),
    vision: vision[0] ? LABEL[vision[0]] : null,
  };
}

interface StructuredRequest<S extends z.ZodTypeAny> {
  name: string;
  system: string;
  text: string;
  file?: { base64: string; mediaType: string };
  jsonSchema: Record<string, unknown>;
  schema: S;
  maxTokens: number;
}

/** Remove nulls so optional zod fields validate, whatever the provider emits for "no value". */
function stripNulls(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stripNulls);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).filter(([, x]) => x !== null).map(([k, x]) => [k, stripNulls(x)]));
  return v;
}

function extractJson(raw: string): string {
  const s = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  return start >= 0 && end > start ? s.slice(start, end + 1) : s;
}

async function callGroq<S extends z.ZodTypeAny>(req: StructuredRequest<S>): Promise<string | null> {
  const model = MODELS.groq();
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.text },
      ],
      temperature: 0.3,
      max_completion_tokens: req.maxTokens,
      response_format: { type: "json_schema", json_schema: { name: req.name, strict: false, schema: req.jsonSchema } },
      ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 160)}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? null;
}

async function callGemini<S extends z.ZodTypeAny>(req: StructuredRequest<S>, kind: Kind): Promise<{ text: string; model: string } | null> {
  const parts = [...(req.file ? [{ inlineData: { mimeType: req.file.mediaType, data: req.file.base64 } }] : []), { text: req.text }];
  let lastError = "no Gemini model responded";
  for (const model of geminiChain(kind)) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": process.env.GEMINI_API_KEY!, "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: req.system }] },
          contents: [{ role: "user", parts }],
          generationConfig: { responseMimeType: "application/json", responseJsonSchema: req.jsonSchema, temperature: 0.3, maxOutputTokens: req.maxTokens },
        }),
        signal: AbortSignal.timeout(kind === "vision" ? TIMEOUT_MS * 2 : TIMEOUT_MS),
      });
      if (!res.ok) {
        lastError = `${model} HTTP ${res.status}`;
        console.warn(`[galla] Gemini ${model} ${req.name}: HTTP ${res.status}, trying next model`);
        continue;
      }
      const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
      if (text) return { text, model };
      lastError = `${model} returned no text`;
    } catch (error) {
      lastError = `${model} ${(error as Error).message}`;
    }
  }
  throw new Error(lastError);
}

let anthropic: Anthropic | null = null;

async function callAnthropic<S extends z.ZodTypeAny>(req: StructuredRequest<S>): Promise<string | null> {
  anthropic ??= new Anthropic({ maxRetries: 1, timeout: TIMEOUT_MS });
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (req.file) {
    content.push(
      req.file.mediaType === "application/pdf"
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: req.file.base64 } }
        : { type: "image", source: { type: "base64", media_type: req.file.mediaType as "image/png", data: req.file.base64 } },
    );
  }
  content.push({ type: "text", text: req.text });
  const response = await anthropic.beta.messages.create({
    model: MODELS.anthropic(),
    max_tokens: Math.max(req.maxTokens, 2000),
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: req.system,
    output_config: { effort: "low", format: zodOutputFormat(req.schema) },
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal") return null;
  return response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")?.text ?? null;
}

async function structured<S extends z.ZodTypeAny>(req: StructuredRequest<S>, kind: Kind): Promise<{ data: z.infer<S>; provider: Provider; model: string } | null> {
  for (const provider of ORDER[kind]) {
    if (!HAS[provider]()) continue;
    try {
      let raw: string | null;
      let model = modelFor(provider, kind);
      if (provider === "gemini") {
        const g = await callGemini(req, kind);
        raw = g?.text ?? null;
        if (g) model = g.model;
      } else {
        raw = provider === "groq" ? await callGroq(req) : await callAnthropic(req);
      }
      if (!raw) continue;
      const parsed = req.schema.safeParse(stripNulls(JSON.parse(extractJson(raw))));
      if (parsed.success) return { data: parsed.data, provider, model };
      console.warn(`[galla] ${LABEL[provider]} returned an invalid ${req.name}; trying next provider`);
    } catch (error) {
      console.warn(`[galla] ${LABEL[provider]} ${req.name} failed: ${(error as Error).message}`);
    }
  }
  return null;
}

export async function classifyIntent(text: string): Promise<IntentResult | null> {
  const result = await structured(
    {
      name: "intent",
      system: renderSystemPrompt("Orchestrator"),
      text: `Classify this merchant message and return JSON only.\n\nMESSAGE: ${text}`,
      jsonSchema: INTENT_JSON_SCHEMA,
      schema: IntentSchema,
      maxTokens: 1500,
    },
    "text",
  );
  if (!result) return null;
  const d = result.data;
  return { intent: d.intent as IntentResult["intent"], language: d.language, confidence: Math.max(0, Math.min(1, d.confidence)), entities: d.entities ?? {}, source: "llm" };
}

/** Re-phrase the deterministic answer in natural merchant language, grounded in facts only. */
export async function narrate(userText: string, res: AgentResponse): Promise<AgentResponse> {
  const grounding = JSON.stringify({ facts: res.facts, message: res.message, cards: res.cards, proposal: res.proposal?.expected });
  const result = await structured(
    {
      name: "narration",
      system: renderSystemPrompt(res.agent),
      text: `LANG=${res.language}\nMERCHANT ASKED: ${userText}\nFACTS=${JSON.stringify(res.facts)}\nDRAFT ANSWER (correct numbers): ${res.message}\n${res.proposal ? `PROPOSED ACTION (awaiting approval): ${res.proposal.summary}\n` : ""}Rewrite the draft as Galla in at most 2 short sentences. Keep every number exactly as written. Return JSON only.`,
      jsonSchema: NARRATION_JSON_SCHEMA,
      schema: NarrationSchema,
      maxTokens: 1500,
    },
    "text",
  );
  if (!result || !result.data.message.trim() || !isGrounded(result.data.message, grounding)) return res;
  return { ...res, message: result.data.message.trim(), source: "llm", model: `${LABEL[result.provider]} · ${result.model}` };
}

export async function extractDocument(base64: string, mediaType: string) {
  const result = await structured(
    {
      name: "document",
      system:
        "You extract structured data from Indian small-business documents (supplier invoices, GST returns, bank statements, Udyam certificates). Only report what is visibly present. Give each field a confidence between 0 and 1. List inconsistencies such as name mismatches or totals that do not add up. If a value is unreadable, omit it rather than guess.",
      text: "Extract this document. Return JSON only.",
      file: { base64, mediaType },
      jsonSchema: DOCUMENT_JSON_SCHEMA,
      schema: DocumentExtractionSchema,
      maxTokens: 8192,
    },
    "vision",
  );
  return result ? { extracted: result.data, engine: `${LABEL[result.provider]} · ${result.model}` } : null;
}
