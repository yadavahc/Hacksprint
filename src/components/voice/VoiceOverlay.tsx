"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Languages, Mic, Square, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/components/ui/primitives";
import { useGalla } from "@/lib/store/provider";

export const VOICE_PHRASES = [
  "Nanna sales ee vaara yaake kadime aagide?",
  "₹50 offer kotre enagutte?",
  "Nijavaagi eshtu hana available ide?",
  "Stock yaavaga mugiyutte?",
  "Ee QR safe aa?",
  "Loan-ge ready iddina?",
  "Supplier-ge ₹12,000 Friday kodbeku.",
  "Mere sales is hafte kyun kam hue?",
];

type Phase = "ready" | "listening" | "transcribing" | "understanding" | "error";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const LANG_LABEL = { kn: "Kannada · Kanglish", hi: "Hindi · Hinglish", en: "English" } as const;

export function VoiceOverlay() {
  const { voiceOpen, setVoiceOpen, voiceScript, setVoiceScript, sendMessage, health, state } = useGalla();
  const [phase, setPhase] = useState<Phase>("ready");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const running = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canRecord = health.voice && typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

  const cleanup = useCallback(() => {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  const close = useCallback(() => {
    cleanup();
    running.current = false;
    setVoiceScript(null);
    setVoiceOpen(false);
  }, [cleanup, setVoiceOpen, setVoiceScript]);

  useEffect(() => {
    if (!voiceOpen) {
      setPhase("ready");
      setTranscript("");
      setError(null);
    }
  }, [voiceOpen]);

  const finish = useCallback(
    async (text: string) => {
      setPhase("understanding");
      await sleep(450);
      running.current = false;
      setVoiceScript(null);
      setVoiceOpen(false);
      sendMessage(text, "voice");
    },
    [sendMessage, setVoiceOpen, setVoiceScript],
  );

  /** Simulated speech (demo mode, or a phrase tapped by the merchant). Clearly labelled in the UI. */
  const simulate = useCallback(
    async (text: string) => {
      if (running.current) return;
      running.current = true;
      setError(null);
      setPhase("listening");
      setTranscript("");
      await sleep(1300);
      setPhase("transcribing");
      for (let i = 2; i <= text.length; i += 2) {
        setTranscript(text.slice(0, i));
        await sleep(20);
      }
      setTranscript(text);
      await finish(text);
    },
    [finish],
  );

  useEffect(() => {
    if (voiceOpen && voiceScript) simulate(voiceScript);
  }, [voiceOpen, voiceScript, simulate]);

  const startRecording = async () => {
    setError(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const rec = new MediaRecorder(media);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        media.getTracks().forEach((t) => t.stop());
        setPhase("transcribing");
        try {
          const fd = new FormData();
          fd.append("file", new Blob(chunks, { type: rec.mimeType || "audio/webm" }), "speech.webm");
          const res = await fetch("/api/voice/stt", { method: "POST", body: fd });
          const json = (await res.json().catch(() => ({}))) as { transcript?: string; error?: string };
          if (!res.ok || !json.transcript) throw new Error(json.error ?? "Voice recognition unavailable.");
          setTranscript(json.transcript);
          await finish(json.transcript);
        } catch (e) {
          setError(`${(e as Error).message} Try a phrase below.`);
          setPhase("error");
        }
      };
      recorder.current = rec;
      rec.start();
      setPhase("listening");
      stopTimer.current = setTimeout(() => rec.state === "recording" && rec.stop(), 12000);
    } catch {
      setError("Microphone unavailable or blocked. Tap a phrase below to try voice in demo mode.");
      setPhase("error");
    }
  };

  const onMic = () => {
    if (phase === "listening" && recorder.current?.state === "recording") {
      recorder.current.stop();
      return;
    }
    if (canRecord) startRecording();
    else simulate(VOICE_PHRASES[0]);
  };

  const label = { ready: canRecord ? "Tap to speak" : "Voice demo", listening: "LISTENING", transcribing: "UNDERSTANDING", understanding: "ANALYZING", error: "Voice unavailable" }[phase];

  return (
    <AnimatePresence>
      {voiceOpen && (
        <motion.div role="dialog" aria-modal="true" aria-label="Talk to Galla" className="absolute inset-0 z-50 flex flex-col bg-gradient-to-b from-navy-900 via-navy to-navy-900 text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="flex items-center justify-between px-4 pt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold">
              <Languages className="size-3.5" aria-hidden />
              {LANG_LABEL[state.settings.language]}
            </span>
            <button type="button" onClick={close} aria-label="Close voice" className="grid size-10 place-items-center rounded-full hover:bg-white/10">
              <X className="size-5" />
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="text-[12px] font-extrabold tracking-[0.2em] text-sky" aria-live="polite">
              {label}
            </p>
            <button
              type="button"
              onClick={onMic}
              disabled={phase === "transcribing" || phase === "understanding" || (!canRecord && phase === "listening")}
              aria-label={phase === "listening" ? "Stop recording" : "Start speaking"}
              className={cn("relative mt-6 grid size-24 place-items-center rounded-full bg-sky text-navy-900 transition-transform active:scale-95", phase === "listening" && "animate-ring")}
            >
              {phase === "listening" && canRecord && recorder.current?.state === "recording" ? <Square className="size-8" fill="currentColor" /> : <Mic className="size-10" />}
            </button>
            <div className="mt-6 flex h-10 items-center gap-1" aria-hidden>
              {Array.from({ length: 18 }, (_, i) => (
                <span
                  key={i}
                  className={cn("w-1 rounded-full bg-sky/80", phase === "listening" && "animate-wave")}
                  style={{
                    height: phase === "listening" ? `${14 + ((i * 37) % 26)}px` : "6px",
                    animationDelay: `${(i % 6) * 0.09}s`,
                  }}
                />
              ))}
            </div>
            <p className="mt-4 min-h-[56px] text-[18px] font-semibold leading-snug" aria-live="polite">
              {transcript || (phase === "listening" ? "…" : "")}
            </p>
            {error && <p className="mt-2 rounded-xl bg-white/10 px-3 py-2 text-[13px] text-white/85">{error}</p>}
          </div>

          <div className="px-4 pb-[calc(16px+var(--safe-bottom,0px))]">
            <p className="mb-2 text-center text-[11.5px] text-white/60">{canRecord ? "Or tap a phrase" : "Voice demo mode · tap a phrase to simulate speaking it"}</p>
            <div className="no-scrollbar flex flex-wrap justify-center gap-2">
              {VOICE_PHRASES.slice(0, 6).map((p) => (
                <button key={p} type="button" disabled={phase !== "ready" && phase !== "error"} onClick={() => simulate(p)} className="min-h-9 rounded-full bg-white/10 px-3 text-[12.5px] font-medium ring-1 ring-white/15 hover:bg-white/20 disabled:opacity-40">
                  {p}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-[10.5px] text-white/45">{health.voice ? "Speech by Sarvam AI (saaras STT · bulbul TTS)" : "Simulated voice — add SARVAM_API_KEY for live Indian-language speech"}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
