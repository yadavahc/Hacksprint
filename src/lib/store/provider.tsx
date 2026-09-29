"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import type { ActionProposal } from "@/lib/agents/types";
import { askGalla, fetchHealth, type HealthStatus } from "@/lib/ai/client";
import { APPROVE_RE, CANCEL_RE } from "@/lib/ai/intent";
import { uid } from "@/lib/data/format";
import { createInitialState, reducer, STATE_VERSION, type Action } from "./reducer";
import { agentContext, pendingProposal } from "./selectors";
import { SCREEN_NAMES, type AppState, type Route, type ScreenName } from "./types";

const STORAGE_KEY = "galla:state";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type SheetState =
  | { type: "edit-proposal"; proposalId: string }
  | { type: "confirm"; proposal: ActionProposal; confirmLabel?: string }
  | { type: "notifications" }
  | null;

interface StoreValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  health: HealthStatus;
  navigate: (name: ScreenName, params?: Record<string, string>) => void;
  back: () => void;
  sendMessage: (text: string, via?: "text" | "voice") => Promise<void>;
  approve: (proposalId: string) => Promise<void>;
  cancel: (proposalId: string) => void;
  executeDirect: (proposal: ActionProposal) => void;
  busy: boolean;
  voiceOpen: boolean;
  setVoiceOpen: (open: boolean) => void;
  sheet: SheetState;
  setSheet: (sheet: SheetState) => void;
  /** When set, the voice overlay simulates the merchant speaking this phrase (demo voice). */
  voiceScript: string | null;
  setVoiceScript: (text: string | null) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function routeToHash(route: Route) {
  const qs = route.params && Object.keys(route.params).length ? `?${new URLSearchParams(route.params).toString()}` : "";
  return `#/${route.name}${qs}`;
}

function routeFromHash(hash: string): Route | null {
  const m = hash.match(/^#\/([a-z]+)(?:\?(.*))?$/);
  if (!m || !SCREEN_NAMES.includes(m[1] as ScreenName)) return null;
  const params = m[2] ? Object.fromEntries(new URLSearchParams(m[2])) : undefined;
  return { name: m[1] as ScreenName, params };
}

function loadState(): AppState {
  let state = createInitialState();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as AppState;
      if (saved?.v === STATE_VERSION) {
        state = {
          ...saved,
          thinking: null,
          stage: pendingProposal(saved) ? "WAITING_FOR_APPROVAL" : "IDLE",
          toasts: [],
          demo: { status: "idle", step: 0, campaignSpeed: 1, finale: false },
        };
      }
    }
  } catch {
    // Storage blocked or corrupt — start fresh.
  }
  const fromHash = routeFromHash(window.location.hash);
  return fromHash ? { ...state, route: fromHash } : state;
}

export function GallaStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [health, setHealth] = useState<HealthStatus>({ ai: false, provider: null, model: null, fallbacks: [], vision: null, voice: false, payments: null });
  const [busy, setBusy] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [voiceScript, setVoiceScript] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const busyRef = useRef(false);

  useEffect(() => {
    fetchHealth().then(setHealth);
  }, []);

  // Persist for the session (debounced).
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, thinking: null, toasts: [] }));
      } catch {
        // ignore quota / privacy mode
      }
    }, 300);
    return () => clearTimeout(t);
  }, [state]);

  // Route ↔ URL hash (deep links + browser back button).
  useEffect(() => {
    const hash = routeToHash(state.route);
    if (window.location.hash !== hash) window.history.pushState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
  }, [state.route]);
  useEffect(() => {
    const onPop = () => {
      const r = routeFromHash(window.location.hash);
      if (r) dispatch({ type: "NAVIGATE", route: r, replace: true });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Campaign clock: 7 simulated days pass in ~40 seconds (faster during the guided demo).
  const hasRunning = state.campaigns.some((c) => c.status === "running");
  useEffect(() => {
    if (!hasRunning) return;
    const id = setInterval(() => dispatch({ type: "TICK_CAMPAIGNS", delta: 1 / 160 }), 250);
    return () => clearInterval(id);
  }, [hasRunning]);

  useEffect(() => {
    if (state.stage !== "LEARNING") return;
    const t = setTimeout(() => dispatch({ type: "SET_STAGE", stage: "IDLE" }), 3500);
    return () => clearTimeout(t);
  }, [state.stage]);

  useEffect(() => {
    if (!state.toasts.length) return;
    const timers = state.toasts.map((toast) => setTimeout(() => dispatch({ type: "DISMISS_TOAST", id: toast.id }), 4200));
    return () => timers.forEach(clearTimeout);
  }, [state.toasts]);

  const navigate = useCallback((name: ScreenName, params?: Record<string, string>) => dispatch({ type: "NAVIGATE", route: { name, params } }), []);
  const back = useCallback(() => dispatch({ type: "BACK" }), []);

  const speak = useCallback(async (text: string, language: "kn" | "hi" | "en") => {
    try {
      const res = await fetch("/api/voice/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, language }) });
      if (!res.ok) return;
      const { audio, mime } = (await res.json()) as { audio: string; mime: string };
      await new Audio(`data:${mime};base64,${audio}`).play();
    } catch {
      // Voice replies are optional.
    }
  }, []);

  const approve = useCallback(async (proposalId: string) => {
    const rec = stateRef.current.proposals[proposalId];
    if (!rec || rec.status !== "pending") return;
    dispatch({ type: "SET_STAGE", stage: "EXECUTING" });
    await sleep(900);
    dispatch({ type: "EXECUTE_PROPOSAL", proposalId });
  }, []);

  const cancel = useCallback((proposalId: string) => dispatch({ type: "CANCEL_PROPOSAL", proposalId }), []);
  const executeDirect = useCallback((proposal: ActionProposal) => dispatch({ type: "EXECUTE_DIRECT", proposal }), []);

  const sendMessage = useCallback(
    async (raw: string, via: "text" | "voice" = "text") => {
      const text = raw.trim().slice(0, 500);
      if (!text || busyRef.current) return;
      const current = stateRef.current;
      const merchantMsg = { id: uid("m"), role: "merchant" as const, text, at: Date.now(), via };
      if (current.route.name !== "galla") dispatch({ type: "NAVIGATE", route: { name: "galla" } });

      // Voice-first confirmations: "haudu" / "approve" / "beda" act on the pending proposal.
      const pending = pendingProposal(current);
      if (pending && text.split(/\s+/).length <= 3) {
        if (APPROVE_RE.test(text)) {
          dispatch({ type: "MERCHANT_MESSAGE", message: merchantMsg });
          await approve(pending.proposal.id);
          return;
        }
        if (CANCEL_RE.test(text)) {
          dispatch({ type: "MERCHANT_MESSAGE", message: merchantMsg });
          cancel(pending.proposal.id);
          return;
        }
      }

      busyRef.current = true;
      setBusy(true);
      dispatch({ type: "MERCHANT_MESSAGE", message: merchantMsg });
      dispatch({ type: "THINKING", text, index: 0, stages: [{ stage: "UNDERSTANDING", detail: via === "voice" ? "Detecting language from your voice" : "Detecting language and intent" }] });
      try {
        const { response } = await askGalla(text, agentContext(stateRef.current), {
          preferredLanguage: current.settings.language,
          forceDemo: current.settings.aiMode === "demo",
        });
        for (let i = 0; i < response.stages.length; i++) {
          dispatch({ type: "THINKING", text, stages: response.stages, index: i });
          await sleep(i === 0 ? 380 : 560);
        }
        dispatch({ type: "GALLA_RESPONSE", response });
        if (stateRef.current.settings.voiceReplies) speak(response.message, response.language);
      } catch {
        dispatch({ type: "GALLA_ERROR", text: "Sorry — I couldn't process that just now. Please try again." });
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [approve, cancel, speak],
  );

  const value = useMemo<StoreValue>(
    () => ({ state, dispatch, health, navigate, back, sendMessage, approve, cancel, executeDirect, busy, voiceOpen, setVoiceOpen, sheet, setSheet, voiceScript, setVoiceScript }),
    [state, health, navigate, back, sendMessage, approve, cancel, executeDirect, busy, voiceOpen, sheet, voiceScript],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useGalla() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useGalla must be used inside GallaStoreProvider");
  return ctx;
}
