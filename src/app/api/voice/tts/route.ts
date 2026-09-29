import { NextResponse } from "next/server";
import { z } from "zod";
import { sarvamAvailable, synthesize } from "@/lib/voice/sarvam";

export const runtime = "nodejs";

const Body = z.object({ text: z.string().min(1).max(2000), language: z.enum(["kn", "hi", "en"]).default("kn") });

export async function POST(req: Request) {
  if (!sarvamAvailable()) return NextResponse.json({ demo: true, error: "Voice replies are in demo mode." }, { status: 503 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid text." }, { status: 400 });
  try {
    const audio = await synthesize(parsed.data.text, parsed.data.language);
    return NextResponse.json({ audio, mime: "audio/wav" });
  } catch (error) {
    console.error("[galla] TTS failed", error);
    return NextResponse.json({ error: "Voice reply unavailable." }, { status: 502 });
  }
}
