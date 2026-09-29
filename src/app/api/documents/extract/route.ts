import { NextResponse } from "next/server";
import { extractDocument, llmStatus } from "@/lib/ai/llm";

export const runtime = "nodejs";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  if (!llmStatus().vision) return NextResponse.json({ demo: true, error: "Document AI is in demo mode." }, { status: 503 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob) || file.size === 0) return NextResponse.json({ error: "No file received." }, { status: 400 });
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Please upload a PNG, JPG, WebP or PDF." }, { status: 415 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "File is larger than 5 MB." }, { status: 413 });
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const result = await extractDocument(base64, file.type);
    if (!result) return NextResponse.json({ error: "Couldn't read that document." }, { status: 422 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[galla] document extraction failed", error);
    return NextResponse.json({ error: "Document extraction failed." }, { status: 502 });
  }
}
