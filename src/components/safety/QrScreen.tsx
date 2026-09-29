"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Network, ScanLine, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { ScreenHeader } from "@/components/app-shell/shell-bits";
import { RiskView } from "@/components/chat/cards";
import { ReceivePaymentCard } from "@/components/payments/ReceivePaymentCard";
import { Button, Card, cn } from "@/components/ui/primitives";
import { formatINR } from "@/lib/data/format";
import { mulberry32 } from "@/lib/data/prng";
import { QR_SAMPLES } from "@/lib/data/safety";
import { MERCHANT, STORY } from "@/lib/data/story";
import { assessRisk } from "@/lib/risk/riskEngine";
import { useGalla } from "@/lib/store/provider";

export function DemoQr({ seed = 7, size = 150, className }: { seed?: number; size?: number; className?: string }) {
  const cells = useMemo(() => {
    const n = 25;
    const rng = mulberry32(seed);
    const finder = (r: number, c: number) => {
      const m = Math.max(Math.abs(r - 3), Math.abs(c - 3));
      return m === 3 || m <= 1;
    };
    const out: [number, number][] = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        const tl = r < 8 && c < 8;
        const tr = r < 8 && c >= n - 8;
        const bl = r >= n - 8 && c < 8;
        let on: boolean;
        if (tl) on = r < 7 && c < 7 && finder(r, c);
        else if (tr) on = r < 7 && c >= n - 7 && finder(r, c - (n - 7));
        else if (bl) on = r >= n - 7 && c < 7 && finder(r - (n - 7), c);
        else on = rng() > 0.52;
        if (on) out.push([r, c]);
      }
    return out;
  }, [seed]);
  return (
    <svg viewBox="-1 -1 27 27" width={size} height={size} className={className} role="img" aria-label="Demo QR code (not payable)">
      <rect x="-1" y="-1" width="27" height="27" fill="#fff" />
      {cells.map(([r, c]) => (
        <rect key={`${r}-${c}`} x={c} y={r} width="1.02" height="1.02" fill="#0b1a33" />
      ))}
    </svg>
  );
}

export function QrScreen() {
  const { navigate, sendMessage, busy } = useGalla();
  const [picked, setPicked] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const sample = QR_SAMPLES.find((q) => q.id === picked);

  const scan = (id: string) => {
    setPicked(id);
    setScanning(true);
    setShowPicker(false);
    setTimeout(() => setScanning(false), 1400);
  };

  return (
    <div className="pb-2">
      <ScreenHeader title="QR" subtitle="Receive payments · check any QR" back={false} />
      <div className="space-y-3.5 px-4 pt-2">
        <div className="rounded-3xl bg-gradient-to-br from-navy to-navy-900 p-5 text-center text-white shadow-float">
          <p className="text-[13px] font-semibold text-white/80">{MERCHANT.name}</p>
          <div className="mx-auto mt-3 w-fit rounded-2xl bg-white p-3">
            <DemoQr seed={4821} size={164} />
          </div>
          <p className="mt-3 text-[14px] font-bold">{MERCHANT.upiId}</p>
          <p className="mt-0.5 text-[10.5px] font-bold uppercase tracking-wider text-sky">Demo QR · not payable</p>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/15 pt-3 text-left">
            <div>
              <p className="text-[11px] text-white/70">Received today via UPI</p>
              <p className="text-[17px] font-extrabold">{formatINR(STORY.todayUpi)}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/70">Payments today</p>
              <p className="text-[17px] font-extrabold">{Math.round(STORY.todayTxns * 0.75)}</p>
            </div>
          </div>
        </div>

        <ReceivePaymentCard />

        <Card className="p-4">
          <h2 className="text-[15px] font-bold text-ink">Scan & check a QR</h2>
          <p className="text-[12.5px] text-muted">Before paying a supplier or when a QR looks odd — Galla scores 9 risk signals.</p>
          <Button className="mt-3 w-full" icon={ScanLine} onClick={() => setShowPicker((v) => !v)} aria-expanded={showPicker}>
            Scan a QR
          </Button>
          <AnimatePresence initial={false}>
            {showPicker && (
              <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 overflow-hidden">
                <li className="px-1 pb-1 text-[11px] font-semibold text-muted">Simulated camera · choose a QR to scan</li>
                {QR_SAMPLES.map((q) => (
                  <li key={q.id}>
                    <button type="button" onClick={() => scan(q.id)} className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-canvas">
                      <DemoQr seed={q.id.length * 97} size={36} className="shrink-0 rounded" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-ink">{q.title}</span>
                        <span className="block truncate text-[11.5px] text-muted">{q.source}</span>
                      </span>
                      <ChevronRight className="size-4 text-faint" aria-hidden />
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </Card>

        {sample && scanning && (
          <Card className="flex flex-col items-center p-5">
            <div className="relative overflow-hidden rounded-xl">
              <DemoQr seed={sample.id.length * 97} size={140} />
              <motion.span className="absolute inset-x-0 h-0.5 bg-sky shadow-[0_0_12px_#2cc5c9]" initial={{ top: 0 }} animate={{ top: "100%" }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} aria-hidden />
            </div>
            <p className="mt-3 text-[13px] font-semibold text-navy" aria-live="polite">
              Checking 9 signals against your history…
            </p>
          </Card>
        )}

        {sample && !scanning && <RiskView assessment={assessRisk(sample.signals)} title={sample.title} subtitle={`${sample.payeeVpa} · ${sample.purpose}`} subjectKind="qr" subjectId={sample.id} />}

        <Button variant="outline" className="w-full" icon={Sparkles} disabled={busy} onClick={() => sendMessage("Ee QR safe aa?")}>
          Ask Galla: “Ee QR safe aa?”
        </Button>

        <button type="button" onClick={() => navigate("beneficiary")} className={cn("flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-card hover:ring-2 hover:ring-sky/40")}>
          <span className="grid size-10 place-items-center rounded-xl bg-bad-50 text-bad">
            <Network className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold text-ink">Beneficiary check & scam graph</span>
            <span className="block text-[12px] text-muted">1 suspicious transfer request waiting</span>
          </span>
          <ChevronRight className="size-4 text-faint" aria-hidden />
        </button>
      </div>
    </div>
  );
}
