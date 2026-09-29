"use client";

import { CircleAlert, CircleCheck, FlaskConical, IndianRupee, LoaderCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, cn } from "@/components/ui/primitives";
import { formatINR, uid } from "@/lib/data/format";
import { closePaytmCheckout, openPaytmCheckout } from "@/lib/payments/checkout";
import { useGalla } from "@/lib/store/provider";

type Phase = "idle" | "starting" | "checkout" | "verifying";

const QUICK_AMOUNTS = [1, 10, 50, 150];

/**
 * Collect a real Paytm STAGING payment (test money only). The server creates the transaction and
 * verifies the final status with Paytm — the browser's checkout result alone is never trusted.
 */
export function ReceivePaymentCard() {
  const { state, dispatch, health } = useGalla();
  const [amount, setAmount] = useState("1");
  const [phase, setPhase] = useState<Phase>("idle");
  const [problem, setProblem] = useState<{ message: string; hint?: string } | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const live = Boolean(health.payments);
  const value = Number(amount);
  const valid = Number.isFinite(value) && value >= 1 && value <= 100000;
  const busy = phase !== "idle";
  const recent = state.payments.slice(0, 3);

  const recordSimulated = () => {
    dispatch({ type: "RECORD_PAYMENT", payment: { id: uid("SIM"), amount: Math.round(value * 100) / 100, note: "Simulated payment (Paytm staging unavailable)", status: "TXN_SUCCESS", source: "simulated", paymentMode: "UPI", at: Date.now() } });
    setProblem(null);
    setInfo(null);
  };

  const verify = async (orderId: string, amountValue: number) => {
    setPhase("verifying");
    try {
      const res = await fetch("/api/payments/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) });
      const json = (await res.json()) as { status?: string; message?: string; txnId?: string; paymentMode?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Couldn't verify the payment with Paytm.");
      if (json.status === "NO_RECORD_FOUND" || json.status === "UNKNOWN") {
        setInfo("Checkout closed before paying — nothing was recorded.");
      } else {
        const status = json.status === "TXN_SUCCESS" || json.status === "TXN_FAILURE" ? json.status : "PENDING";
        dispatch({ type: "RECORD_PAYMENT", payment: { id: orderId, amount: amountValue, note: `Paytm staging order ${orderId}`, status, source: "paytm-staging", txnId: json.txnId, paymentMode: json.paymentMode, at: Date.now() } });
        if (status !== "TXN_SUCCESS") setProblem({ message: `Paytm reports ${status.replace("TXN_", "").toLowerCase()}: ${json.message ?? ""}`.trim() });
      }
    } catch (error) {
      setProblem({ message: (error as Error).message });
    } finally {
      setPhase("idle");
    }
  };

  const collect = async () => {
    if (!valid || busy) return;
    setProblem(null);
    setInfo(null);
    setPhase("starting");
    try {
      const res = await fetch("/api/payments/initiate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: value, note: "Counter payment" }) });
      const json = (await res.json()) as { orderId?: string; txnToken?: string; amount?: string; scriptUrl?: string; error?: string; hint?: string };
      if (!res.ok || !json.txnToken || !json.orderId || !json.scriptUrl || !json.amount) {
        setProblem({ message: json.error ?? "Couldn't start the payment.", hint: json.hint });
        setPhase("idle");
        return;
      }
      const orderId = json.orderId;
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        closePaytmCheckout();
        verify(orderId, value);
      };
      setPhase("checkout");
      await openPaytmCheckout({
        scriptUrl: json.scriptUrl,
        orderId,
        txnToken: json.txnToken,
        amount: json.amount,
        onTransactionStatus: finish,
        onNotify: (eventName) => {
          if (/CLOSED|SESSION_EXPIRED/i.test(eventName)) finish();
        },
      });
    } catch (error) {
      setProblem({ message: (error as Error).message });
      setPhase("idle");
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-bold text-ink">Receive a payment</h2>
          <p className="text-[12.5px] text-muted">{live ? "Real Paytm checkout on staging — test money only." : "Paytm keys not configured — payments are simulated."}</p>
        </div>
        <Badge tone={live ? "good" : "neutral"} icon={live ? ShieldCheck : FlaskConical}>
          {live ? "Paytm staging" : "Simulated"}
        </Badge>
      </div>

      <label className="mt-3 flex h-12 items-center gap-2 rounded-xl bg-canvas px-3 focus-within:ring-2 focus-within:ring-sky">
        <IndianRupee className="size-4 text-muted" aria-hidden />
        <span className="sr-only">Amount in rupees</span>
        <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" disabled={busy} className="min-w-0 flex-1 bg-transparent text-[18px] font-bold text-ink outline-none" />
      </label>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Quick amounts">
        {QUICK_AMOUNTS.map((q) => (
          <button key={q} type="button" disabled={busy} aria-pressed={value === q} onClick={() => setAmount(String(q))} className={cn("h-9 rounded-lg px-3 text-[13px] font-semibold", value === q ? "bg-navy text-white" : "bg-canvas text-ink hover:bg-sky-50")}>
            ₹{q}
          </button>
        ))}
      </div>

      <Button className="mt-3 w-full" size="lg" disabled={!valid || busy} onClick={live ? collect : recordSimulated} icon={phase === "idle" ? IndianRupee : LoaderCircle}>
        {phase === "starting" ? "Starting Paytm checkout…" : phase === "checkout" ? "Waiting for payment…" : phase === "verifying" ? "Verifying with Paytm…" : live ? `Collect ${valid ? formatINR(value) : ""} with Paytm` : `Record simulated ${valid ? formatINR(value) : ""}`}
      </Button>

      {info && <p className="mt-2 text-[12.5px] text-muted" aria-live="polite">{info}</p>}

      {problem && (
        <div className="mt-3 rounded-xl bg-bad-50 p-3" role="alert">
          <p className="flex gap-1.5 text-[12.5px] font-semibold text-bad">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {problem.message}
          </p>
          {problem.hint && <p className="mt-1 text-[12px] leading-snug text-ink">{problem.hint}</p>}
          {live && (
            <Button variant="outline" size="sm" className="mt-2" icon={FlaskConical} disabled={!valid} onClick={recordSimulated}>
              Record as simulated instead
            </Button>
          )}
        </div>
      )}

      {recent.length > 0 && (
        <ul className="mt-3 divide-y divide-line border-t border-line">
          {recent.map((p) => (
            <li key={p.id} className="flex items-center gap-2 py-2 text-[12.5px]">
              {p.status === "TXN_SUCCESS" ? <CircleCheck className="size-4 text-good" aria-hidden /> : <CircleAlert className="size-4 text-bad" aria-hidden />}
              <span className="min-w-0 flex-1 truncate text-ink">
                {formatINR(p.amount)} · {p.source === "paytm-staging" ? `Paytm ${p.paymentMode ?? ""}`.trim() : "simulated"}
              </span>
              <span className="shrink-0 text-muted">{p.status === "TXN_SUCCESS" ? "received" : p.status.replace("TXN_", "").toLowerCase()}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
