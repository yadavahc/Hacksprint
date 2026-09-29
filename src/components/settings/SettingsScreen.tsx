"use client";

import { Cpu, ExternalLink, Info, Mic, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ScreenHeader } from "@/components/app-shell/shell-bits";
import { PresentationModeSwitcher } from "@/components/presentation-mode/PresentationModeSwitcher";
import { usePresentationMode } from "@/components/presentation-mode/PresentationModeContext";
import { Avatar } from "@/components/ui/animated-number";
import { Badge, Button, Card, Segmented, cn } from "@/components/ui/primitives";
import type { Lang } from "@/lib/agents/types";
import { uid } from "@/lib/data/format";
import { MERCHANT } from "@/lib/data/story";
import { useGalla } from "@/lib/store/provider";

export function SettingsScreen() {
  const { state, dispatch, health } = useGalla();
  const { isMobile } = usePresentationMode();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="pb-2">
      <ScreenHeader title="Settings" subtitle="Business, language and AI" parent="home" />
      <div className="space-y-3.5 px-4 pt-2">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Avatar name={MERCHANT.name} size={48} tone="navy" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-ink">{MERCHANT.name}</p>
              <p className="text-[12px] text-muted">
                {MERCHANT.ownerFull} · {MERCHANT.category}
              </p>
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-y-1.5 border-t border-line pt-3 text-[12.5px]">
            <dt className="text-muted">Location</dt>
            <dd className="text-right text-ink">{MERCHANT.locality}</dd>
            <dt className="text-muted">Merchant ID</dt>
            <dd className="text-right text-ink">{MERCHANT.merchantId}</dd>
            <dt className="text-muted">UPI ID</dt>
            <dd className="text-right text-ink">{MERCHANT.upiId}</dd>
            <dt className="text-muted">UPI history</dt>
            <dd className="text-right text-ink">{MERCHANT.monthsOnPaytm} months</dd>
          </dl>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-ink">Galla&apos;s reply language</h3>
          <p className="text-[12px] text-muted">Galla also detects the language you speak or type.</p>
          <div className="mt-2.5">
            <Segmented<Lang>
              label="Reply language"
              value={state.settings.language}
              onChange={(language) => dispatch({ type: "SETTINGS", settings: { language } })}
              options={[
                { value: "kn", label: "Kannada" },
                { value: "hi", label: "Hindi" },
                { value: "en", label: "English" },
              ]}
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Mic className="size-4 text-sky-700" aria-hidden />
              <div>
                <p className="text-sm font-bold text-ink">Spoken replies</p>
                <p className="text-[12px] text-muted">{health.voice ? "Sarvam bulbul voice" : "Needs SARVAM_API_KEY on the server"}</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={state.settings.voiceReplies}
              aria-label="Spoken replies"
              disabled={!health.voice}
              onClick={() => dispatch({ type: "SETTINGS", settings: { voiceReplies: !state.settings.voiceReplies } })}
              className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40", state.settings.voiceReplies ? "bg-good" : "bg-line")}
            >
              <span className={cn("absolute top-1 size-5 rounded-full bg-white shadow transition-[left]", state.settings.voiceReplies ? "left-6" : "left-1")} />
            </button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-sky-700" aria-hidden />
            <h3 className="text-sm font-bold text-ink">AI engine</h3>
          </div>
          <div className="mt-2.5">
            <Segmented
              label="AI engine"
              value={state.settings.aiMode}
              onChange={(aiMode) => dispatch({ type: "SETTINGS", settings: { aiMode } })}
              options={[
                { value: "auto", label: "Live when available" },
                { value: "demo", label: "Demo (deterministic)" },
              ]}
            />
          </div>
          <ul className="mt-3 space-y-1.5 text-[12.5px]">
            <li className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-muted">{health.ai ? `Language · ${health.provider} (${health.model})` : "Language model"}</span>
              <Badge tone={health.ai ? "good" : "neutral"}>{health.ai ? "Connected" : "Not configured"}</Badge>
            </li>
            {health.fallbacks.length > 0 && (
              <li className="flex items-center justify-between">
                <span className="text-muted">Fallback</span>
                <Badge tone="good">{health.fallbacks.join(", ")}</Badge>
              </li>
            )}
            <li className="flex items-center justify-between">
              <span className="text-muted">Document reading</span>
              <Badge tone={health.vision ? "good" : "neutral"}>{health.vision ?? "Demo templates"}</Badge>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted">Sarvam · speech</span>
              <Badge tone={health.voice ? "good" : "neutral"}>{health.voice ? "Connected" : "Simulated"}</Badge>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted">Payments</span>
              <Badge tone={health.payments ? "good" : "neutral"}>{health.payments ?? "Simulated"}</Badge>
            </li>
          </ul>
          <p className="mt-2 text-[11.5px] text-faint">API keys stay on the server. Calculations are always deterministic; the AI never changes your data.</p>
        </Card>

        {!isMobile && (
          <Card className="p-4">
            <h3 className="text-sm font-bold text-ink">Presentation</h3>
            <p className="text-[12px] text-muted">Switch instantly — nothing resets.</p>
            <div className="mt-2.5">
              <PresentationModeSwitcher />
            </div>
          </Card>
        )}

        <Card className="p-4">
          <h3 className="text-sm font-bold text-ink">Demo data</h3>
          <p className="text-[12px] text-muted">Restore Shree Lakshmi Stores to the start of the story.</p>
          {!confirmReset ? (
            <Button variant="outline" size="sm" icon={RotateCcw} className="mt-2.5" onClick={() => setConfirmReset(true)}>
              Reset demo
            </Button>
          ) : (
            <div className="mt-2.5 flex gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  dispatch({ type: "RESET", keepSettings: true });
                  dispatch({ type: "TOAST", toast: { id: uid("t"), text: "Demo reset to the start of the story", tone: "info" } });
                  setConfirmReset(false);
                }}
              >
                Yes, reset everything
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                Keep my progress
              </Button>
            </div>
          )}
        </Card>

        <Card className="flex gap-2.5 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-sky-700" aria-hidden />
          <div className="text-[12.5px] leading-snug text-muted">
            <p>
              <b className="text-ink">GALLA — HackSprint prototype.</b> Built by Team Spy for HackSprint · Track 1 FinTech &amp; Smart Commerce (PS21). All merchants, customers and transactions are simulated. No real payments are ever made.
            </p>
            <Link href="/" className="mt-2 inline-flex min-h-9 items-center gap-1 font-semibold text-sky-700">
              About GALLA <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
