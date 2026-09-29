"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, Square } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { GallaMark } from "@/components/ui/ai-bits";
import { cn } from "@/components/ui/primitives";
import type { Intent } from "@/lib/agents/types";
import { formatINR } from "@/lib/data/format";
import { useGalla } from "@/lib/store/provider";
import { pendingProposal, snapshotOf } from "@/lib/store/selectors";
import type { AppState } from "@/lib/store/types";

// The guided demo drives the REAL application: it speaks prompts through the voice overlay,
// waits for real agent responses, presses the real APPROVE button and watches the real campaign.

interface DemoApi {
  start: () => void;
  supporting: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  stop: () => void;
}

interface Step {
  caption: string;
  run: (gen: number) => Promise<void>;
}

class Cancelled extends Error {}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DemoCtx = createContext<DemoApi | null>(null);

export function DemoDirectorProvider({ autoplay = false, children }: { autoplay?: boolean; children: ReactNode }) {
  const store = useGalla();
  const ref = useRef(store);
  ref.current = store;
  const gen = useRef(0);
  const paused = useRef(false);
  const fast = useRef(false);

  const api = useMemo<DemoApi>(() => {
    const guard = (g: number) => {
      if (g !== gen.current) throw new Cancelled();
    };
    const wait = async (g: number, ms: number) => {
      let t = 0;
      while (t < ms) {
        guard(g);
        if (fast.current) return;
        await sleep(100);
        if (!paused.current) t += 100;
      }
    };
    const waitFor = async (g: number, pred: (s: AppState) => boolean, timeout = 45000) => {
      let t = 0;
      while (!pred(ref.current.state)) {
        guard(g);
        await sleep(120);
        if (!paused.current) t += 120;
        if (t > timeout) return false;
      }
      guard(g);
      return true;
    };
    const demo = (d: Partial<AppState["demo"]>) => ref.current.dispatch({ type: "DEMO", demo: d });
    const voice = async (g: number, text: string) => {
      const before = ref.current.state.chat.length;
      ref.current.setVoiceScript(text);
      ref.current.setVoiceOpen(true);
      await waitFor(g, (s) => s.chat.slice(before).some((m) => m.role === "merchant"), 12000);
    };
    const answered = (intent: Intent) => (s: AppState) => !s.thinking && [...s.chat].reverse().find((m) => m.response)?.response?.intent === intent;

    const STORY: Step[] = [
      { caption: "Galla opens with what needs attention today", run: async (g) => { ref.current.navigate("galla"); await wait(g, 3500); } },
      { caption: "The merchant asks by voice — in Kanglish", run: async (g) => { await voice(g, "Nanna sales ee vaara yaake kadime aagide?"); await waitFor(g, answered("sales_decline")); await wait(g, 1200); } },
      { caption: "Root cause: 47 regular customers stopped buying", run: async (g) => { await wait(g, 5500); } },
      { caption: "“What if I give ₹50?” — Galla simulates it", run: async (g) => { await voice(g, "₹50 offer kotre enagutte?"); await waitFor(g, answered("simulate_offer")); await wait(g, 5000); } },
      {
        caption: "The merchant approves — nothing happens without permission",
        run: async (g) => {
          demo({ highlight: "approve" });
          await wait(g, 2600);
          demo({ highlight: undefined });
          const p = pendingProposal(ref.current.state);
          if (p) await ref.current.approve(p.proposal.id);
          await waitFor(g, (s) => s.campaigns.some((c) => !c.seeded), 8000);
          await wait(g, 2600);
        },
      },
      { caption: "Campaign live — tracking returns, sales and ROI", run: async (g) => { demo({ campaignSpeed: 4 }); await waitFor(g, (s) => s.chat.some((m) => m.kind === "learning"), 90000); demo({ campaignSpeed: 1 }); } },
      { caption: "LEARNING COMPLETE — better than expected", run: async (g) => { await wait(g, 4500); demo({ finale: true }); } },
    ];

    const supportStep = (caption: string, prompt: string, intent: Intent): Step => ({
      caption,
      run: async (g) => {
        ref.current.navigate("galla");
        await voice(g, prompt);
        await waitFor(g, answered(intent));
        await wait(g, 5500);
      },
    });
    const SUPPORT: Step[] = [
      supportStep("Cashflow: how much money is truly available?", "Nijavaagi eshtu hana available ide?", "cash_available"),
      supportStep("Inventory: when will stock run out?", "Stock yaavaga mugiyutte?", "stock_runout"),
      supportStep("Safety: is this QR safe?", "Ee QR safe aa?", "qr_safety"),
      supportStep("Credit readiness: am I ready for a loan?", "Loan-ge ready iddina?", "credit_readiness"),
    ];

    const run = async (steps: Step[], g: number) => {
      try {
        for (let i = 0; i < steps.length; i++) {
          fast.current = false;
          demo({ status: paused.current ? "paused" : "playing", step: i, total: steps.length, caption: steps[i].caption });
          await steps[i].run(g);
        }
        demo({ status: "finished", caption: undefined, highlight: undefined, campaignSpeed: 1 });
      } catch (e) {
        if (!(e instanceof Cancelled)) {
          console.error("[galla] demo failed", e);
          demo({ status: "idle", caption: undefined, highlight: undefined, campaignSpeed: 1 });
        }
      }
    };

    const resetUi = () => {
      ref.current.setVoiceOpen(false);
      ref.current.setVoiceScript(null);
      ref.current.setSheet(null);
    };

    return {
      start: () => {
        const g = ++gen.current;
        paused.current = false;
        fast.current = false;
        resetUi();
        ref.current.dispatch({ type: "RESET", keepSettings: true });
        ref.current.navigate("galla");
        setTimeout(() => run(STORY, g), 700);
      },
      supporting: () => {
        const g = ++gen.current;
        paused.current = false;
        demo({ finale: false });
        run(SUPPORT, g);
      },
      pause: () => {
        paused.current = true;
        demo({ status: "paused" });
      },
      resume: () => {
        paused.current = false;
        demo({ status: "playing" });
      },
      skip: () => {
        fast.current = true;
      },
      stop: () => {
        gen.current++;
        paused.current = false;
        resetUi();
        demo({ status: "idle", caption: undefined, highlight: undefined, campaignSpeed: 1, finale: false });
      },
    };
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    const t = setTimeout(() => api.start(), 900);
    return () => clearTimeout(t);
  }, [autoplay, api]);

  return <DemoCtx.Provider value={api}>{children}</DemoCtx.Provider>;
}

export function useDemo() {
  const v = useContext(DemoCtx);
  if (!v) throw new Error("useDemo must be used inside DemoDirectorProvider");
  return v;
}

export function DemoFinale() {
  const { state, dispatch } = useGalla();
  const demo = useDemo();
  const c = state.campaigns.find((x) => !x.seeded && x.status === "completed");
  const s = c ? snapshotOf(c) : null;
  return (
    <AnimatePresence>
      {state.demo.finale && (
        <motion.div role="dialog" aria-modal="true" aria-label="Demo complete" className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-gradient-to-b from-navy-900 via-navy to-[#003f94] px-7 text-center text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <GallaMark size={56} animated />
          <motion.h2 initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="mt-6 text-[34px] font-extrabold leading-[1.05] tracking-tight">
            YOU SAY IT.
            <br />
            <span className="text-sky">AI GETS IT DONE.</span>
          </motion.h2>
          {s && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-6 grid w-full grid-cols-3 gap-2">
              {[
                [`+${s.returned}`, "customers back"],
                [formatINR(s.sales), "incremental sales"],
                [`${s.roi}×`, "ROI"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl bg-white/10 px-2 py-3">
                  <p className="text-[18px] font-extrabold">{v}</p>
                  <p className="text-[10.5px] text-white/70">{l}</p>
                </div>
              ))}
            </motion.div>
          )}
          <p className="mt-4 text-[12.5px] leading-snug text-white/70">Sales decline → root cause → simulation → approval → campaign → outcome → learning</p>
          <div className="mt-7 flex w-full flex-col gap-2">
            <button type="button" onClick={demo.supporting} className="h-12 rounded-2xl bg-sky text-[15px] font-bold text-navy-900 hover:bg-white">
              See supporting intelligence
            </button>
            <button type="button" onClick={() => dispatch({ type: "DEMO", demo: { finale: false, status: "idle", caption: undefined } })} className="h-12 rounded-2xl text-[15px] font-semibold text-white ring-1 ring-white/30 hover:bg-white/10">
              Explore Galla freely
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MobileDemoCaption() {
  const { state } = useGalla();
  const demo = useDemo();
  const d = state.demo;
  const active = !!d.caption && (d.status === "playing" || d.status === "paused");
  return (
    <AnimatePresence>
      {active && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-x-3 top-[60px] z-30 flex items-center gap-2 rounded-2xl bg-ink/95 px-3 py-2 text-white shadow-float">
          <span className="shrink-0 text-[10px] font-extrabold text-sky">
            {d.step + 1}/{d.total ?? 7}
          </span>
          <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">{d.caption}</span>
          <button type="button" onClick={d.status === "paused" ? demo.resume : demo.pause} aria-label={d.status === "paused" ? "Resume demo" : "Pause demo"} className="grid size-8 place-items-center rounded-full hover:bg-white/10">
            {d.status === "paused" ? <Play className="size-4" /> : <Pause className="size-4" />}
          </button>
          <button type="button" onClick={demo.stop} aria-label="Stop demo" className="grid size-8 place-items-center rounded-full hover:bg-white/10">
            <Square className="size-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DemoCaptionBar() {
  const { state } = useGalla();
  const d = state.demo;
  return (
    <div className="flex h-11 shrink-0 items-center justify-center px-5">
      <AnimatePresence mode="wait">
        {d.caption ? (
          <motion.div key={d.caption} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="flex max-w-full items-center gap-3 rounded-full bg-navy px-4 py-2 text-white shadow-float" aria-live="polite">
            <span className="flex shrink-0 gap-1" aria-hidden>
              {Array.from({ length: d.total ?? 7 }, (_, i) => (
                <span key={i} className={cn("h-1.5 w-4 rounded-full", i < d.step ? "bg-sky" : i === d.step ? "bg-white" : "bg-white/25")} />
              ))}
            </span>
            <span className="truncate text-[13px] font-semibold">{d.caption}</span>
            {d.status === "paused" && <span className="shrink-0 text-[11px] font-bold uppercase text-sky">Paused</span>}
          </motion.div>
        ) : (
          <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="truncate text-[12.5px] text-muted">
            This is the real, working app — tap anything, speak to Galla, or press <b className="text-navy">Play 90-sec demo</b>.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
