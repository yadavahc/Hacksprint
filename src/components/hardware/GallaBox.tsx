"use client";

import { Cpu, Mic, Unplug, Usb, Volume2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Badge, Button, Card, cn } from "@/components/ui/primitives";
import { connectUsb, disconnect, pressPtt, send, startSimulator, useGallaBox, webSerialSupported } from "@/lib/hardware/gallaBox";
import { useGalla } from "@/lib/store/provider";

const LED_CLASS = { off: "bg-white/15", green: "bg-[#35d07f] shadow-[0_0_10px_#35d07f]", amber: "bg-[#f5b83d] shadow-[0_0_10px_#f5b83d]", red: "bg-[#ff5a5a] shadow-[0_0_10px_#ff5a5a]" };

/** Mounted once in the app: announces every verified payment on the Galla Box speaker, from any screen. */
export function GallaBoxBridge() {
  const { state } = useGalla();
  const box = useGallaBox();
  const connected = box.status === "usb" || box.status === "sim";
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    const ids = new Set(state.payments.map((p) => p.id));
    if (!seen.current || !connected) {
      seen.current = ids;
      return;
    }
    for (const p of state.payments) {
      if (seen.current.has(p.id) || p.status !== "TXN_SUCCESS") continue;
      const from = p.note.split(" · ")[1];
      void send({ cmd: "announce", amount: p.amount, from });
      // Flash green, then restore the khata status colour.
      const restore = box.led;
      void send({ cmd: "led", color: "green" });
      setTimeout(() => void send({ cmd: "led", color: restore }), 4000);
    }
    seen.current = ids;
  }, [state.payments, connected]);

  return null;
}

export function GallaBoxCard() {
  const box = useGallaBox();
  const connected = box.status === "usb" || box.status === "sim";

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <Cpu className="size-4 text-sky-700" aria-hidden />
        <p className="text-[13px] font-bold text-ink">Galla Box</p>
        <Badge tone="info">Hardware</Badge>
        <span className={cn("ml-auto text-[11px] font-bold uppercase tracking-wide", connected ? "text-good" : "text-faint")}>{box.status === "usb" ? "USB connected" : box.status === "sim" ? "Simulator" : box.status === "connecting" ? "Connecting…" : "Offline"}</span>
      </div>
      <p className="mt-0.5 text-[12px] text-muted">Counter soundbox: announces UPI repayments, shows dues on its screen, and has a push-to-talk button for Voice Khata.</p>

      <div className="mt-3 rounded-2xl bg-[#1b2328] p-3 ring-1 ring-black/40" aria-label="Galla Box device panel">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 rounded-md bg-black px-2.5 py-2 font-mono text-[12px] leading-snug text-[#7ff3ff] ring-1 ring-white/10" aria-live="polite">
            <p className="truncate">{box.display[0]}</p>
            <p className="truncate">{box.display[1]}</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className={cn("size-3 rounded-full", LED_CLASS[box.led])} aria-label={`LED ${box.led}`} />
            <Volume2 className="size-5 text-white/40" aria-hidden />
          </div>
          <button type="button" onClick={pressPtt} disabled={!connected} aria-label="Push-to-talk button" className="grid size-12 place-items-center rounded-full bg-[#e8a33d] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] active:translate-y-px disabled:opacity-40">
            <Mic className="size-5" aria-hidden />
          </button>
        </div>
        {box.lastAnnouncement && <p className="mt-2 text-[11.5px] text-white/60">🔊 “{box.lastAnnouncement}”</p>}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {connected ? (
          <Button size="sm" variant="outline" icon={Unplug} onClick={() => void disconnect()}>
            Disconnect
          </Button>
        ) : (
          <>
            {webSerialSupported() && (
              <Button size="sm" icon={Usb} onClick={() => void connectUsb()} disabled={box.status === "connecting"}>
                Connect via USB
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={startSimulator}>
              Use simulator
            </Button>
          </>
        )}
        {box.device && <span className="text-[11px] text-faint">{box.device}</span>}
      </div>
      {box.error && <p className="mt-1.5 text-[11.5px] font-semibold text-bad">{box.error}</p>}
    </Card>
  );
}
