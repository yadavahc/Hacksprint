import { NextResponse } from "next/server";
import { llmStatus } from "@/lib/ai/llm";
import { paytmConfig } from "@/lib/payments/paytm";
import { sarvamAvailable } from "@/lib/voice/sarvam";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reports which capabilities are configured — never the keys themselves.
export function GET() {
  const paytm = paytmConfig();
  return NextResponse.json({ ...llmStatus(), voice: sarvamAvailable(), payments: paytm.configured ? "Paytm staging" : null });
}
