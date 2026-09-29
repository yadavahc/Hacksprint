"use client";

import { ArrowLeft, Pause, Play, RotateCcw, SkipForward, Square } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { DemoCaptionBar, DemoDirectorProvider, useDemo } from "@/components/demo/DemoDirector";
import { AgentStateIndicator } from "@/components/galla/AgentStateIndicator";
import { PresentationModeProvider, usePresentationMode } from "@/components/presentation-mode/PresentationModeContext";
import { PresentationModeSwitcher } from "@/components/presentation-mode/PresentationModeSwitcher";
import { PresentationWrapper } from "@/components/presentation-mode/PresentationWrapper";
import { BrandWordmark } from "@/components/brand-header/BrandWordmark";
import { GallaMark } from "@/components/ui/ai-bits";
import { cn } from "@/components/ui/primitives";
import { GallaStoreProvider, useGalla } from "@/lib/store/provider";
import { pendingProposal } from "@/lib/store/selectors";
import type { AgentStage } from "@/lib/agents/types";
import { GallaApplication } from "./GallaApplication";

export function LiveApp({ autoplay = false }: { autoplay?: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="grid h-dvh place-items-center bg-canvas" aria-busy="true">
        <div className="flex flex-col items-center gap-3">
          <GallaMark size={52} animated />
          <p className="text-sm font-semibold text-navy">Opening Galla…</p>
        </div>
      </div>
    );
  }
  return (
    <PresentationModeProvider>
      <GallaStoreProvider>
        <DemoDirectorProvider autoplay={autoplay}>
          <Stage />
        </DemoDirectorProvider>
      </GallaStoreProvider>
    </PresentationModeProvider>
  );
}

function Stage() {
  const { isMobile } = usePresentationMode();
  return (
    <div className={cn("flex h-dvh flex-col overflow-hidden", isMobile ? "bg-canvas" : "bg-[radial-gradient(120%_80%_at_50%_0%,#e3f2ff_0%,#eef3f9_45%,#dbe4ef_100%)]")}>
      {!isMobile && <StageTopBar />}
      {!isMobile && <DemoCaptionBar />}
      <div className="flex min-h-0 flex-1">
        {!isMobile && (
          <aside className="no-scrollbar hidden w-[292px] shrink-0 overflow-y-auto px-4 pb-6 xl:block" aria-label="Demo guide">
            <DemoGuidePanel />
          </aside>
        )}
        <main className="relative min-w-0 flex-1" aria-label="GALLA live application">
          <PresentationWrapper>
            <GallaApplication />
          </PresentationWrapper>
        </main>
        {!isMobile && (
          <aside className="no-scrollbar hidden w-[320px] shrink-0 overflow-y-auto px-4 pb-6 xl:block" aria-label="How Galla works under the hood">
            <UnderTheHoodPanel />
          </aside>
        )}
      </div>
    </div>
  );
}

function StageTopBar() {
  const { health, state } = useGalla();
  const live = health.ai && state.settings.aiMode === "auto";
  const aiLabel = `AI live · ${health.provider}`;
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 px-5">
      <Link href="/" className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/60" aria-label="Back to GALLA landing page">
        <ArrowLeft className="size-4 text-navy" aria-hidden />
        <GallaMark size={28} />
        <BrandWordmark height={16} />
      </Link>
      <span className="hidden rounded-full bg-white/70 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-muted ring-1 ring-line lg:inline">HackSprint prototype</span>
      <div className="flex flex-1 justify-center">
        <PresentationModeSwitcher />
      </div>
      <div className="hidden items-center gap-2 xl:flex">
        <StatusChip on={live} onText={aiLabel} offText="AI demo mode" />
        <StatusChip on={health.voice} onText="Sarvam voice" offText="Simulated voice" />
      </div>
      <DemoControls />
    </header>
  );
}

function StatusChip({ on, onText, offText }: { on: boolean; onText: string; offText: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[11.5px] font-semibold text-ink ring-1 ring-line">
      <span className={cn("size-2 rounded-full", on ? "bg-good" : "bg-faint")} aria-hidden />
      {on ? onText : offText}
    </span>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="grid size-9 place-items-center rounded-full text-navy hover:bg-sky-50">
      {children}
    </button>
  );
}

function DemoControls() {
  const { state } = useGalla();
  const demo = useDemo();
  const st = state.demo.status;
  if (st === "idle" || st === "finished") {
    return (
      <button type="button" onClick={demo.start} className="inline-flex h-10 items-center gap-2 rounded-full bg-navy px-4 text-[13px] font-bold text-white shadow-float hover:bg-navy-700">
        <Play className="size-4" fill="currentColor" aria-hidden />
        {st === "finished" ? "Replay demo" : "Play 90-sec demo"}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-white p-1 ring-1 ring-line" role="group" aria-label="Demo controls">
      {st === "playing" ? (
        <IconBtn label="Pause demo" onClick={demo.pause}>
          <Pause className="size-4" />
        </IconBtn>
      ) : (
        <IconBtn label="Resume demo" onClick={demo.resume}>
          <Play className="size-4" />
        </IconBtn>
      )}
      <IconBtn label="Skip ahead" onClick={demo.skip}>
        <SkipForward className="size-4" />
      </IconBtn>
      <IconBtn label="Restart demo" onClick={demo.start}>
        <RotateCcw className="size-4" />
      </IconBtn>
      <IconBtn label="Stop demo" onClick={demo.stop}>
        <Square className="size-3.5" />
      </IconBtn>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white/75 p-4 shadow-card backdrop-blur">
      <h2 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">{title}</h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function DemoGuidePanel() {
  const { state, sendMessage, busy, navigate, approve } = useGalla();
  const pending = pendingProposal(state);
  const campaign = state.campaigns.find((c) => !c.seeded);
  const story = [
    { title: "Ask why sales dropped", sub: "“Nanna sales ee vaara yaake kadime aagide?”", onClick: () => sendMessage("Nanna sales ee vaara yaake kadime aagide?"), disabled: busy },
    { title: "Simulate a ₹50 offer", sub: "“₹50 offer kotre enagutte?”", onClick: () => sendMessage("₹50 offer kotre enagutte?"), disabled: busy },
    { title: "Approve the campaign", sub: pending ? pending.proposal.title : "Available after step 2", onClick: () => pending && approve(pending.proposal.id), disabled: !pending || pending.proposal.payload.kind !== "create_campaign" },
    { title: "Track the outcome", sub: campaign ? (campaign.status === "running" ? "Live now" : "Completed") : "Available after approval", onClick: () => campaign && navigate("campaign", { id: campaign.id }), disabled: !campaign },
    { title: "See what Galla learned", sub: "Action history & learning loop", onClick: () => navigate("history"), disabled: false },
  ];
  const support = [
    ["Cashflow", "Nijavaagi eshtu hana available ide?"],
    ["Obligation", "Naanu prati tingalu ₹10,000 rent kodtini."],
    ["Mandate", "Nanna EMI mandate fail aagutta?"],
    ["Inventory", "Stock yaavaga mugiyutte?"],
    ["Invoice", "Invoice inda stock update maadu."],
    ["QR safety", "Ee QR safe aa?"],
    ["Credit", "Loan-ge ready iddina?"],
    ["Catalog", "Ee biscuit packet ₹10, 25 pieces ide."],
  ];
  return (
    <div className="space-y-3">
      <Panel title="The 90-second story">
        <ol className="space-y-1">
          {story.map((s, i) => (
            <li key={s.title}>
              <button type="button" onClick={s.onClick} disabled={s.disabled} className="flex w-full items-start gap-2.5 rounded-xl p-2 text-left hover:bg-sky-50 disabled:opacity-45 disabled:hover:bg-transparent">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-navy text-[11px] font-bold text-white">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-ink">{s.title}</span>
                  <span className="block truncate text-[11.5px] text-muted">{s.sub}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </Panel>
      <Panel title="Supporting intelligence">
        <div className="flex flex-col gap-1.5">
          {support.map(([label, prompt]) => (
            <button key={prompt} type="button" disabled={busy} onClick={() => sendMessage(prompt)} className="rounded-xl bg-canvas px-2.5 py-2 text-left hover:bg-sky-50 disabled:opacity-50">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-sky-700">{label}</span>
              <span className="block text-[12px] text-ink">{prompt}</span>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Other languages">
        <div className="flex flex-col gap-1.5">
          {["Mere sales is hafte kyun kam hue?", "How much money is actually available?", "मेरा स्टॉक कब खत्म होगा?"].map((p) => (
            <button key={p} type="button" disabled={busy} onClick={() => sendMessage(p)} className="rounded-xl bg-canvas px-2.5 py-2 text-left text-[12px] text-ink hover:bg-sky-50 disabled:opacity-50">
              {p}
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

const PIPELINE_STAGE: Record<string, AgentStage[]> = {
  input: ["LISTENING"],
  intent: ["UNDERSTANDING"],
  retrieval: ["ANALYZING"],
  calc: ["PREDICTING"],
  recommend: ["PLANNING"],
  confirm: ["WAITING_FOR_APPROVAL"],
  action: ["EXECUTING"],
  learn: ["LEARNING"],
};

function UnderTheHoodPanel() {
  const { state, health, voiceOpen } = useGalla();
  const idx = [...state.chat].map((m) => !!m.response && m.id !== "m-briefing").lastIndexOf(true);
  const answer = idx >= 0 ? state.chat[idx] : undefined;
  const question = idx > 0 ? [...state.chat.slice(0, idx)].reverse().find((m) => m.role === "merchant") : undefined;
  const r = answer?.response;
  const rec = r?.proposal ? state.proposals[r.proposal.id] : undefined;
  const stage = voiceOpen ? "LISTENING" : state.stage;

  const rows = [
    { key: "input", label: "User input", value: question ? `“${question.text}” · ${question.via === "voice" ? "voice" : "text"}` : "Waiting for the merchant" },
    { key: "intent", label: "Intent detection", value: r ? `${r.intent.replace(/_/g, " ")} · ${r.intentSource === "llm" ? "LLM classifier" : "multilingual rules"} · ${r.language === "kn" ? "Kanglish" : r.language === "hi" ? "Hinglish" : "English"}` : "—" },
    { key: "orchestrator", label: "Galla orchestrator", value: r ? `Routed to ${r.agent === "Orchestrator" ? "Galla core" : `${r.agent} Agent`}` : "—" },
    { key: "retrieval", label: "Data retrieval", value: r ? r.stages.filter((s) => s.stage === "ANALYZING").map((s) => s.detail).join(" · ") || "Merchant context" : "—" },
    { key: "calc", label: "Deterministic calculations", value: r && Object.keys(r.facts).length ? Object.entries(r.facts).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(" · ") : "—" },
    { key: "reasoning", label: "AI reasoning", value: r ? (r.source === "llm" ? `${r.model ?? "LLM"} phrased it — numbers verified against facts` : health.ai && state.settings.aiMode === "auto" ? "Grounded template (LLM reply rejected or unavailable)" : "Grounded template (demo mode)") : "—" },
    { key: "recommend", label: "Recommendation", value: r ? r.proposal?.title ?? "Insight only — no action needed" : "—" },
    { key: "confirm", label: "Merchant confirmation", value: rec ? rec.status.toUpperCase() : "—" },
    { key: "action", label: "Action engine", value: answer && state.audit[0] && state.audit[0].at >= answer.at ? state.audit[0].what : "—" },
    { key: "audit", label: "Audit log", value: `${state.audit.length} entries` },
    { key: "learn", label: "Learning", value: state.calibration !== 1 ? `Win-back model recalibrated ×${state.calibration}` : `${state.learnings.length} learning${state.learnings.length === 1 ? "" : "s"} on file` },
  ];

  return (
    <div className="space-y-3">
      <Panel title="Under the hood">
        <AgentStateIndicator />
        <div className="mt-3 flex flex-wrap gap-1.5">
          <StatusChip on={health.ai && state.settings.aiMode === "auto"} onText={`AI live · ${health.provider}`} offText="AI demo mode" />
          <StatusChip on={health.voice} onText="Sarvam voice" offText="Simulated voice" />
        </div>
      </Panel>
      <Panel title="Last request, step by step">
        <ol className="relative space-y-2.5 border-l-2 border-line pl-4">
          {rows.map((row) => {
            const active = PIPELINE_STAGE[row.key]?.includes(stage);
            return (
              <li key={row.key} className="relative">
                <span className={cn("absolute -left-[22px] top-1 size-3 rounded-full ring-2 ring-white transition-colors", active ? "animate-pulse bg-sky" : row.value !== "—" ? "bg-navy" : "bg-line")} aria-hidden />
                <p className={cn("text-[10.5px] font-extrabold uppercase tracking-wider", active ? "text-sky-700" : "text-muted")}>{row.label}</p>
                <p className="text-[12px] leading-snug text-ink">{row.value}</p>
              </li>
            );
          })}
        </ol>
      </Panel>
      <p className="px-2 text-[11px] leading-snug text-muted">The LLM never changes merchant data. Numbers come from deterministic code, and every state change needs the merchant&apos;s approval.</p>
    </div>
  );
}
