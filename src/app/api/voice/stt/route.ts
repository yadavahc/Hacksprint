import { NextResponse } from "next/server";
import { sarvamAvailable, transcribe } from "@/lib/voice/sarvam";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  if (!sarvamAvailable()) return NextResponse.json({ demo: true, error: "Voice is in demo mode (no Sarvam key configured)." }, { status: 503 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob) || file.size === 0) return NextResponse.json({ error: "No audio received." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "Recording is too long." }, { status: 413 });
    const result = await transcribe(file, "speech.webm");
    if (!result.transcript.trim()) return NextResponse.json({ error: "I couldn't hear anything. Please try again." }, { status: 422 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[galla] STT failed", error);
    return NextResponse.json({ error: "Voice recognition is unavailable right now." }, { status: 502 });
  }
}
