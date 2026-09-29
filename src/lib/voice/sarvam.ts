// Server-only Sarvam AI helpers (Indian-language STT and TTS). The API key is read from the
// server environment and never sent to the browser.

const BASE = "https://api.sarvam.ai";

export const sarvamAvailable = () => Boolean(process.env.SARVAM_API_KEY);

const EXTENSION: Record<string, string> = { "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/mpeg": "mp3", "audio/wav": "wav", "audio/x-wav": "wav", "audio/aac": "aac", "audio/flac": "flac" };

export async function transcribe(audio: Blob, fileName: string): Promise<{ transcript: string; languageCode: string | null }> {
  // Browsers label recordings like "audio/webm;codecs=opus". Sarvam rejects the codec suffix,
  // so send the bare media type with a matching file extension.
  const baseType = (audio.type.split(";")[0] || "audio/webm").trim().toLowerCase();
  const ext = EXTENSION[baseType] ?? fileName.split(".").pop() ?? "webm";
  const clean = new Blob([await audio.arrayBuffer()], { type: baseType });
  const form = new FormData();
  form.append("file", clean, `speech.${ext}`);
  form.append("model", "saaras:v3");
  form.append("mode", "translit");
  form.append("language_code", "unknown");
  const res = await fetch(`${BASE}/speech-to-text`, {
    method: "POST",
    headers: { "api-subscription-key": process.env.SARVAM_API_KEY! },
    body: form,
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Sarvam STT ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { transcript?: string; language_code?: string | null };
  return { transcript: json.transcript ?? "", languageCode: json.language_code ?? null };
}

const LANG_CODE = { kn: "kn-IN", hi: "hi-IN", en: "en-IN" } as const;

export async function synthesize(text: string, lang: keyof typeof LANG_CODE): Promise<string> {
  const res = await fetch(`${BASE}/text-to-speech`, {
    method: "POST",
    headers: { "api-subscription-key": process.env.SARVAM_API_KEY!, "Content-Type": "application/json" },
    // bulbul:v2 (and its "anushka" voice) is deprecated by Sarvam; v3 accepts up to 2,500 characters.
    body: JSON.stringify({ text: text.slice(0, 2400), language_code: LANG_CODE[lang], model: "bulbul:v3", speaker: "kavya" }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Sarvam TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { audios?: string[] };
  if (!json.audios?.[0]) throw new Error("Sarvam TTS returned no audio");
  return json.audios[0];
}
