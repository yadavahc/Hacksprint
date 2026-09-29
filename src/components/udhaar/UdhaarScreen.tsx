"use client";

import { BarChart3, CircleCheck, Gift, Headset, IndianRupee, Mic, Play, ShieldAlert, ShieldCheck, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScreenHeader } from "@/components/app-shell/shell-bits";
import { Badge, Button, Card, ProgressBar, Segmented, Stat } from "@/components/ui/primitives";
import { BottomSheet } from "@/components/ui/sheet";
import { computeReadiness } from "@/lib/credit/readiness";
import { formatINR, uid } from "@/lib/data/format";
import { MERCHANT } from "@/lib/data/story";
import { useGalla } from "@/lib/store/provider";
import { agentContext } from "@/lib/store/selectors";
import {
  AVG_DAYS_TO_RECOVER,
  callBlockReason,
  type CallLang,
  nextAction,
  parseKhataNote,
  PEER_RECOVERY_7D,
  promisedNow,
  recoveryCallScript,
  SEED_KHATA,
  SEED_RECOVERED_WEEK,
  trustScore,
  type UdhaarEntry,
  withinCallingHours,
} from "@/lib/udhaar/khata";

const KEY = "galla:khata";
const REPAY_NOTE = "Udhaar repayment · ";
const TAG_TONE = { GREEN: "good", AMBER: "warn", RED: "bad" } as const;
const SAMPLES = ["Ramesh 450 udhaar, Friday tak", "Deepa 300 udhaar kal tak", "Lakshmi ne 500 diya"];

function loadKhata(): UdhaarEntry[] {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as UdhaarEntry[];
  } catch {
    // Storage is optional.
  }
  return SEED_KHATA;
}

export function UdhaarScreen() {
  const { state, dispatch, navigate, health } = useGalla();
  const [khata, setKhata] = useState<UdhaarEntry[]>(SEED_KHATA);
  const [note, setNote] = useState("");
  const [calling, setCalling] = useState<string | null>(null);
  const [demoClock, setDemoClock] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    setKhata(loadKhata());
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(khata));
    } catch {
      // Storage is optional.
    }
  }, [khata]);

  const toast = (text: string, tone: "good" | "info" | "bad" = "good") => dispatch({ type: "TOAST", toast: { id: uid("t"), text, tone } });
  const update = (id: string, patch: Partial<UdhaarEntry>) => setKhata((k) => k.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const repaidThisSession = state.payments.filter((p) => p.status === "TXN_SUCCESS" && p.note.startsWith(REPAY_NOTE)).reduce((s, p) => s + p.amount, 0);
  const recovered = SEED_RECOVERED_WEEK + repaidThisSession;
  const outstanding = khata.reduce((s, e) => s + e.due, 0);
  const recoveryPct = Math.round((recovered / Math.max(1, recovered + outstanding)) * 100);
  const ctx = agentContext(state);
  const readiness = computeReadiness({ documentIds: ctx.documentIds, campaignCompleted: ctx.campaigns.some((c) => c.status === "completed") });
  const clock = demoClock ? new Date(new Date().setHours(18, 10, 0, 0)) : new Date();

  const recordRepayment = (e: UdhaarEntry, amount: number) => {
    const paid = Math.min(amount, e.due);
    if (paid <= 0) return;
    dispatch({ type: "RECORD_PAYMENT", payment: { id: uid("SIM"), amount: paid, note: `${REPAY_NOTE}${e.name}`, status: "TXN_SUCCESS", source: "simulated", paymentMode: "UPI", at: Date.now() } });
    const due = e.due - paid;
    update(e.id, { due, promise: due > 0 ? e.promise : undefined, onTime: e.onTime + (e.dueInDays >= 0 ? 1 : 0), late: e.late + (e.dueInDays < 0 ? 1 : 0) });
  };

  const logNote = (text: string) => {
    const parsed = parseKhataNote(text);
    if (!parsed) return toast("Couldn't find a name and amount — try “Ramesh 450 udhaar, Friday tak”.", "bad");
    const existing = khata.find((e) => e.name.split(" ")[0].toLowerCase() === parsed.name.split(" ")[0].toLowerCase());
    if (parsed.kind === "repayment") {
      if (!existing || existing.due <= 0) return toast(`No open udhaar for ${parsed.name}.`, "bad");
      recordRepayment(existing, parsed.amount);
    } else if (existing) {
      update(existing.id, { due: existing.due + parsed.amount, dueInDays: parsed.dueInDays });
      toast(`Logged: ${existing.name} +${formatINR(parsed.amount)}. Receipt sent on WhatsApp.`);
    } else {
      setKhata((k) => [{ id: uid("u"), name: parsed.name, phone: "9•••• •••••", due: parsed.amount, dueInDays: parsed.dueInDays, consent: false, optedOut: false, remindersThisWeek: 0, onTime: 0, late: 0 }, ...k]);
      toast(`Logged: ${parsed.name} — ${formatINR(parsed.amount)}, due in ${parsed.dueInDays}d. Receipt sent on WhatsApp.`);
    }
    setNote("");
  };

  const active = khata.find((e) => e.id === calling);

  return (
    <div className="pb-4">
      <ScreenHeader title="Udhaar Khata" subtitle={`Capture · Recover · Grow · ${MERCHANT.name}`} />
      <div className="space-y-3.5 px-4 pt-2">
        <div className="grid grid-cols-2 gap-2.5">
          <Card className="p-3.5">
            <Stat label="Recovered · this week" value={formatINR(recovered)} tone="up" delta={repaidThisSession ? `+${formatINR(repaidThisSession)} today` : undefined} />
          </Card>
          <Card className="p-3.5">
            <Stat label="Outstanding" value={formatINR(outstanding)} sub={`${khata.filter((e) => e.due > 0).length} customers`} />
          </Card>
          <Card className="p-3.5">
            <Stat label="Avg to recover" value={`${AVG_DAYS_TO_RECOVER} days`} sub="last 30 days" />
          </Card>
          <button type="button" onClick={() => navigate("credit")} className="rounded-2xl bg-white p-3.5 text-left shadow-card">
            <Stat label="Credit Passport" value={`${readiness.score} / 100`} sub={readiness.level} />
          </button>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-sky-700" aria-hidden />
            <p className="text-[13px] font-bold text-ink">Bazaar Pulse</p>
            <Badge tone="warn">Beta</Badge>
          </div>
          <p className="mt-1.5 text-[12.5px] text-muted">Shops like yours recover {PEER_RECOVERY_7D}% of udhaar in 7 days. You: {recoveryPct}%.</p>
          <div className="mt-2">
            <ProgressBar value={recoveryPct / 100} tone={recoveryPct >= PEER_RECOVERY_7D ? "good" : "warn"} label="Your recovery rate" />
          </div>
        </Card>

        <VoiceKhataCard note={note} setNote={setNote} onLog={logNote} canRecord={health.voice} onError={(m) => toast(m, "bad")} />

        <Card as="section" aria-label="Udhaar customers" className="divide-y divide-line overflow-hidden">
          {khata.map((e) => {
            const t = trustScore(e);
            const block = callBlockReason(e, clock);
            return (
              <div key={e.id} className="p-3.5">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-[14.5px] font-bold text-ink">{e.name}</p>
                  <Badge tone={TAG_TONE[t.tag]}>● {t.tag}</Badge>
                  <p className="w-20 text-right text-[15px] font-extrabold text-ink">{formatINR(e.due)}</p>
                </div>
                <p className="mt-0.5 text-[12px] text-muted">
                  {e.due > 0 ? (e.dueInDays < 0 ? `${-e.dueInDays}d overdue` : e.dueInDays === 0 ? "Due today" : `Due in ${e.dueInDays}d`) : "All clear"} · Safe limit {formatINR(t.safeLimit)} · <b className="text-ink">{nextAction(e)}</b>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e.due > 0 && (
                    <Button size="sm" icon={Headset} onClick={() => setCalling(e.id)} disabled={!!block} title={block ?? undefined}>
                      AI call
                    </Button>
                  )}
                  {e.due > 0 && (
                    <Button size="sm" variant="outline" icon={IndianRupee} onClick={() => recordRepayment(e, e.due)}>
                      Mark paid
                    </Button>
                  )}
                  {e.due > 0 && !e.consent && (
                    <Button size="sm" variant="ghost" onClick={() => (update(e.id, { consent: true }), toast(`${e.name.split(" ")[0]} opted in to reminder calls.`, "info"))}>
                      Send opt-in
                    </Button>
                  )}
                  {e.due <= 0 && (
                    <Button size="sm" variant="success" icon={Gift} onClick={() => (update(e.id, { promise: "Win-back offer sent" }), toast(`₹20 win-back offer sent to ${e.name} on WhatsApp.`))} disabled={e.promise === "Win-back offer sent"}>
                      {e.promise === "Win-back offer sent" ? "Offer sent" : "₹20 win-back"}
                    </Button>
                  )}
                </div>
                {block && e.due > 0 && e.consent && !e.optedOut && <p className="mt-1.5 text-[11px] text-faint">Guardrail: {block}</p>}
              </div>
            );
          })}
        </Card>
        {withinCallingHours() ? null : (
          <label className="flex items-center gap-2 text-[12px] text-muted">
            <input type="checkbox" checked={demoClock} onChange={(ev) => setDemoClock(ev.target.checked)} /> Demo: pretend it&apos;s 6:10 pm (inside calling hours)
          </label>
        )}

        <FakePaymentShield khata={khata} payments={state.payments} />
        <DailyReport khata={khata} recovered={recovered} outstanding={outstanding} passport={`${readiness.score}/100, ${readiness.level}`} />

        <p className="text-center text-[11px] text-faint">Calls only 9 am – 8 pm · max 2 reminders/week · opt-out honoured · every call logged. GALLA never lends or holds money — UPI goes direct.</p>
      </div>

      <BottomSheet open={!!active} onClose={() => setCalling(null)} title="Live AI recovery call">
        {active && (
          <RecoveryCall
            entry={active}
            onDone={(promise) => {
              update(active.id, { promise, remindersThisWeek: active.remindersThisWeek + 1 });
              toast(`UPI pay-link sent to ${active.name} on WhatsApp.`, "info");
            }}
            onPaid={(amount) => {
              recordRepayment(active, amount);
              setCalling(null);
            }}
          />
        )}
      </BottomSheet>
    </div>
  );
}

function VoiceKhataCard({ note, setNote, onLog, canRecord, onError }: { note: string; setNote: (v: string) => void; onLog: (t: string) => void; canRecord: boolean; onError: (m: string) => void }) {
  const [recording, setRecording] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);

  const toggle = async () => {
    if (recording) return rec.current?.stop();
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(media);
      const chunks: Blob[] = [];
      r.ondataavailable = (ev) => chunks.push(ev.data);
      r.onstop = async () => {
        media.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const fd = new FormData();
        fd.append("file", new Blob(chunks, { type: (r.mimeType || "audio/webm").split(";")[0] }), "speech.webm");
        const res = await fetch("/api/voice/stt", { method: "POST", body: fd });
        const json = (await res.json()) as { transcript?: string; error?: string };
        if (json.transcript) setNote(json.transcript);
        else onError(json.error ?? "Voice unavailable — type the note instead.");
      };
      rec.current = r;
      r.start();
      setRecording(true);
    } catch {
      onError("Microphone unavailable — type the note instead.");
    }
  };

  return (
    <Card className="p-4">
      <p className="text-[13px] font-bold text-ink">Voice Khata</p>
      <p className="mt-0.5 text-[12px] text-muted">Say it like a WhatsApp voice note — any language. The customer gets a digital receipt.</p>
      <form
        className="mt-2.5 flex gap-2"
        onSubmit={(ev) => {
          ev.preventDefault();
          onLog(note);
        }}
      >
        <input value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Ramesh 450 udhaar, Friday tak" aria-label="Udhaar note" className="min-w-0 flex-1 rounded-xl bg-canvas px-3 text-[14px] text-ink outline-none ring-sky focus:ring-2" />
        {canRecord && <Button variant="outline" icon={recording ? Square : Mic} onClick={toggle} aria-label={recording ? "Stop recording" : "Record voice note"} />}
        <Button type="submit" disabled={!note.trim()}>
          Log
        </Button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SAMPLES.map((s) => (
          <button key={s} type="button" onClick={() => setNote(s)} className="rounded-full bg-sky-50 px-2.5 py-1 text-[11.5px] font-semibold text-sky-700 ring-1 ring-sky-100">
            {s}
          </button>
        ))}
      </div>
    </Card>
  );
}

function RecoveryCall({ entry, onDone, onPaid }: { entry: UdhaarEntry; onDone: (promise: string) => void; onPaid: (amount: number) => void }) {
  const [lang, setLang] = useState<CallLang>("kn");
  const [shown, setShown] = useState(0);
  const [reminderNo] = useState(entry.remindersThisWeek + 1);
  const script = useMemo(() => recoveryCallScript(entry, MERCHANT.name, lang), [entry, lang]);
  const now = promisedNow(entry);
  const rest = entry.due - now;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (shown === 0) return;
    if (shown >= script.length) {
      doneRef.current(rest > 0 ? `${formatINR(now)} now · ${formatINR(rest)} Sun` : `${formatINR(now)} today`);
      return;
    }
    const t = setTimeout(() => setShown((s) => s + 1), 1400);
    return () => clearTimeout(t);
  }, [shown, script.length, now, rest]);

  return (
    <div className="space-y-3">
      <Segmented label="Call language" value={lang} onChange={(v) => shown === 0 && setLang(v)} options={[{ value: "kn", label: "Kannada" }, { value: "hi", label: "Hindi" }, { value: "en", label: "English" }]} />
      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-good">
        <ShieldCheck className="size-4" aria-hidden /> {entry.name} opted in · reminder {reminderNo} of 2 this week
      </p>
      <div className="min-h-32 space-y-2 rounded-2xl bg-canvas p-3 text-[13.5px] leading-snug">
        {shown === 0 && <p className="text-muted">Polite, consent-based call. The agent never threatens and ends the call if asked.</p>}
        {script.slice(0, shown).map((l, i) => (
          <p key={i}>
            <b className={l.agent ? "text-sky-700" : "text-navy"}>{l.agent ? "Agent" : entry.name.split(" ")[0]}:</b> {l.text}
          </p>
        ))}
      </div>
      {shown === 0 ? (
        <Button className="w-full" icon={Headset} onClick={() => setShown(1)}>
          Start call
        </Button>
      ) : shown >= script.length ? (
        <>
          <p className="rounded-xl bg-good-50 p-2.5 text-center text-[13px] font-bold text-good">Outcome: {rest > 0 ? `${formatINR(now)} now · ${formatINR(rest)} Sun` : `${formatINR(now)} today`} · UPI link sent</p>
          <Button className="w-full" variant="success" icon={CircleCheck} onClick={() => onPaid(now)}>
            {formatINR(now)} received via UPI
          </Button>
        </>
      ) : (
        <p className="text-center text-[12px] font-semibold text-muted">Call in progress…</p>
      )}
    </div>
  );
}

function FakePaymentShield({ khata, payments }: { khata: UdhaarEntry[]; payments: { amount: number; note: string; status: string }[] }) {
  const [who, setWho] = useState(khata[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const check = () => {
    const e = khata.find((k) => k.id === who);
    const value = Number(amount);
    if (!e || !(value > 0)) return;
    const match = payments.find((p) => p.status === "TXN_SUCCESS" && p.amount === value && p.note.includes(e.name));
    setResult(
      match
        ? { ok: true, text: `Verified — a real UPI credit of ${formatINR(value)} from ${e.name} is on record.` }
        : { ok: false, text: `No matching UPI credit of ${formatINR(value)} from ${e.name}. Don't mark it paid until the money shows up.` },
    );
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 text-bad" aria-hidden />
        <p className="text-[13px] font-bold text-ink">Fake Payment Shield</p>
        <Badge tone="warn">Beta</Badge>
      </div>
      <p className="mt-0.5 text-[12px] text-muted">Customer forwarded a “paid” screenshot? Check it against real UPI credits.</p>
      <div className="mt-2.5 flex gap-2">
        <select value={who} onChange={(ev) => (setWho(ev.target.value), setResult(null))} aria-label="Customer" className="min-w-0 flex-1 rounded-xl bg-canvas px-2 text-[13.5px] text-ink">
          {khata.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>
        <input value={amount} onChange={(ev) => (setAmount(ev.target.value.replace(/\D/g, "")), setResult(null))} inputMode="numeric" placeholder="₹ amount" aria-label="Amount on screenshot" className="w-24 rounded-xl bg-canvas px-3 text-[14px] text-ink" />
        <Button variant="outline" onClick={check} disabled={!amount}>
          Check
        </Button>
      </div>
      {result && <p className={`mt-2 rounded-xl p-2.5 text-[12.5px] font-semibold ${result.ok ? "bg-good-50 text-good" : "bg-bad-50 text-bad"}`}>{result.text}</p>}
    </Card>
  );
}

function DailyReport({ khata, recovered, outstanding, passport }: { khata: UdhaarEntry[]; recovered: number; outstanding: number; passport: string }) {
  const [playing, setPlaying] = useState(false);
  const followUp = khata
    .filter((e) => e.due > 0)
    .sort((a, b) => a.dueInDays - b.dueInDays)
    .slice(0, 2)
    .map((e) => e.name.split(" ")[0]);
  const text = `Namaskara! Today's Galla report for ${MERCHANT.name}. Recovered this week: ${formatINR(recovered)}. Still outstanding: ${formatINR(outstanding)}. Credit passport: ${passport}. Follow up tomorrow with ${followUp.join(" and ") || "nobody — all clear"}.`;

  const play = async () => {
    setPlaying(true);
    try {
      const res = await fetch("/api/voice/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, language: "en" }) });
      if (!res.ok) throw new Error("tts");
      const { audio, mime } = (await res.json()) as { audio: string; mime: string };
      const a = new Audio(`data:${mime};base64,${audio}`);
      a.onended = () => setPlaying(false);
      await a.play();
    } catch {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-IN";
        u.onend = () => setPlaying(false);
        window.speechSynthesis.speak(u);
      } else setPlaying(false);
    }
  };

  return (
    <Card className="border-l-4 border-sky p-4">
      <p className="text-[13px] font-bold text-ink">Daily Galla Report</p>
      <p className="mt-1 text-[12.5px] leading-snug text-muted">{text}</p>
      <Button className="mt-2.5" size="sm" variant="sky" icon={Play} onClick={play} disabled={playing}>
        {playing ? "Playing…" : "Play 30-second voice note"}
      </Button>
    </Card>
  );
}
