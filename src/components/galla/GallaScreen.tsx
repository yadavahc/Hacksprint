"use client";

import { motion } from "framer-motion";
import { CircleCheck, LoaderCircle, Mic, SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageItem } from "@/components/chat/MessageItem";
import { GallaMark } from "@/components/ui/ai-bits";
import { Badge } from "@/components/ui/primitives";
import { useGalla } from "@/lib/store/provider";
import { AgentStateIndicator } from "./AgentStateIndicator";

export const QUICK_PROMPTS = [
  "Nanna sales ee vaara yaake kadime aagide?",
  "Stock yaavaga mugiyutte?",
  "Nijavaagi eshtu hana available ide?",
  "Ee QR safe aa?",
  "Loan-ge ready iddina?",
  "₹100 discount kotre enagutte?",
  "Invoice inda stock update maadu.",
];

export function GallaScreen() {
  const { state, sendMessage, busy, setVoiceOpen, health } = useGalla();
  const listRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [state.chat.length, state.thinking?.index]);

  const last = [...state.chat].reverse().find((m) => m.response)?.response;
  const prompts = Array.from(new Set([...(last?.followUps ?? []), ...QUICK_PROMPTS])).slice(0, 9);
  const live = health.ai && state.settings.aiMode === "auto";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    sendMessage(text);
    setText("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-line bg-white px-4 pb-3 pt-3">
        <div className="flex items-center gap-2.5">
          <GallaMark size={34} animated={state.stage !== "IDLE" && state.stage !== "WAITING_FOR_APPROVAL"} />
          <div className="min-w-0 flex-1">
            <h1 className="text-[15px] font-extrabold tracking-wide text-navy">ASK GALLA</h1>
            <p className="text-[11px] text-muted">Your AI business teammate</p>
          </div>
          <Badge tone={live ? "good" : "info"}>{live ? `AI live · ${health.provider}` : "Demo mode"}</Badge>
        </div>
        <AgentStateIndicator className="mt-3" />
      </div>

      <div ref={listRef} role="log" aria-live="polite" aria-label="Conversation with Galla" className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {state.chat.map((m) => (
          <MessageItem key={m.id} message={m} />
        ))}
        {state.thinking && <ThinkingBubble />}
      </div>

      <div className="shrink-0 border-t border-line bg-white">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pt-2.5" role="list" aria-label="Suggested questions">
          {prompts.map((p) => (
            <button key={p} role="listitem" type="button" onClick={() => sendMessage(p)} disabled={busy} className="h-9 shrink-0 whitespace-nowrap rounded-full bg-sky-50 px-3 text-[12.5px] font-semibold text-navy ring-1 ring-sky-100 transition-colors hover:bg-sky-100 disabled:opacity-50">
              {p}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="flex items-center gap-2 px-3 py-2.5">
          <label htmlFor="galla-input" className="sr-only">
            Tell Galla what you need
          </label>
          <input id="galla-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Tell Galla what you need" autoComplete="off" maxLength={500} className="h-11 min-w-0 flex-1 rounded-full bg-canvas px-4 text-[14px] text-ink outline-none placeholder:text-faint focus:ring-2 focus:ring-sky" />
          <button type="button" onClick={() => setVoiceOpen(true)} aria-label="Speak to Galla" className="grid size-11 shrink-0 place-items-center rounded-full bg-sky-50 text-navy ring-1 ring-sky-100 hover:bg-sky-100">
            <Mic className="size-5" />
          </button>
          <button type="submit" disabled={!text.trim() || busy} aria-label="Send" className="grid size-11 shrink-0 place-items-center rounded-full bg-navy text-white transition-opacity disabled:opacity-40">
            {busy ? <LoaderCircle className="size-5 animate-spin" /> : <SendHorizontal className="size-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}

function ThinkingBubble() {
  const { state } = useGalla();
  const t = state.thinking!;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2" aria-label="Galla is thinking">
      <GallaMark size={28} animated className="mt-0.5" />
      <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-white px-3.5 py-3 shadow-card">
        <ul className="space-y-2">
          {t.stages.slice(0, t.index + 1).map((s, i) => (
            <motion.li key={`${s.stage}-${i}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2 text-[12.5px]">
              {i < t.index ? <CircleCheck className="mt-px size-4 shrink-0 text-good" aria-hidden /> : <LoaderCircle className="mt-px size-4 shrink-0 animate-spin text-sky-600" aria-hidden />}
              <span className="min-w-0">
                <span className="mr-1.5 text-[10px] font-extrabold uppercase tracking-wider text-navy">{s.stage.replace(/_/g, " ")}</span>
                <span className={i === t.index ? "shimmer-text" : "text-muted"}>{s.detail}</span>
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
