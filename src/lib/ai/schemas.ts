import { z } from "zod";
import { INTENTS } from "@/lib/agents/types";

// Zod schemas validate every LLM response. The matching JSON Schemas below are sent to the
// providers (Groq json_schema / Gemini responseJsonSchema) to constrain generation.

export const IntentSchema = z.object({
  intent: z.enum(INTENTS as [string, ...string[]]),
  language: z.enum(["kn", "hi", "en"]),
  confidence: z.number(),
  entities: z
    .object({
      amount: z.number().optional(),
      offerType: z.enum(["winback", "storewide"]).optional(),
      dueInDays: z.number().optional(),
      dayLabel: z.string().optional(),
      recurring: z.boolean().optional(),
      obligationKind: z.enum(["rent", "supplier", "salary", "bill", "mandate", "manual"]).optional(),
      productName: z.string().optional(),
      quantity: z.number().optional(),
    })
    .optional(),
});

export const NarrationSchema = z.object({
  message: z.string(),
  confidenceLabel: z.enum(["Likely", "Estimated", "Based on current data", "Not enough data to be certain", "Confirmed"]).optional(),
});

export const DocumentExtractionSchema = z.object({
  kind: z.enum(["invoice", "gst", "bank", "udyam", "other"]),
  title: z.string(),
  fields: z.array(z.object({ label: z.string(), value: z.string(), confidence: z.number() })),
  lineItems: z.array(z.object({ name: z.string(), quantity: z.number(), unitPrice: z.number(), confidence: z.number() })).default([]),
  inconsistencies: z.array(z.string()).default([]),
});

export const INTENT_JSON_SCHEMA = {
  type: "object",
  required: ["intent", "language", "confidence"],
  properties: {
    intent: { type: "string", enum: INTENTS },
    language: { type: "string", enum: ["kn", "hi", "en"] },
    confidence: { type: "number" },
    entities: {
      type: "object",
      properties: {
        amount: { type: "number" },
        offerType: { type: "string", enum: ["winback", "storewide"] },
        dueInDays: { type: "integer" },
        dayLabel: { type: "string" },
        recurring: { type: "boolean" },
        obligationKind: { type: "string", enum: ["rent", "supplier", "salary", "bill", "mandate", "manual"] },
        productName: { type: "string" },
        quantity: { type: "number" },
      },
    },
  },
};

export const NARRATION_JSON_SCHEMA = {
  type: "object",
  required: ["message"],
  properties: {
    message: { type: "string" },
    confidenceLabel: { type: "string", enum: ["Likely", "Estimated", "Based on current data", "Not enough data to be certain", "Confirmed"] },
  },
};

export const DOCUMENT_JSON_SCHEMA = {
  type: "object",
  required: ["kind", "title", "fields", "lineItems", "inconsistencies"],
  properties: {
    kind: { type: "string", enum: ["invoice", "gst", "bank", "udyam", "other"] },
    title: { type: "string" },
    fields: {
      type: "array",
      items: { type: "object", required: ["label", "value", "confidence"], properties: { label: { type: "string" }, value: { type: "string" }, confidence: { type: "number" } } },
    },
    lineItems: {
      type: "array",
      items: { type: "object", required: ["name", "quantity", "unitPrice", "confidence"], properties: { name: { type: "string" }, quantity: { type: "number" }, unitPrice: { type: "number" }, confidence: { type: "number" } } },
    },
    inconsistencies: { type: "array", items: { type: "string" } },
  },
};

/** Request body the client sends to /api/galla (validated server-side). */
export const GallaRequestSchema = z.object({
  text: z.string().min(1).max(500),
  preferredLanguage: z.enum(["kn", "hi", "en"]).default("kn"),
  forceDemo: z.boolean().default(false),
  context: z.any(),
});
