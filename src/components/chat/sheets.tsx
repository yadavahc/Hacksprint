"use client";

import { Check, Lock, Megaphone, Package, ShieldAlert, Users, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SimulatedBadge } from "@/components/ui/ai-bits";
import { Button, ListRow, cn } from "@/components/ui/primitives";
import { BottomSheet } from "@/components/ui/sheet";
import type { ActionProposal } from "@/lib/agents/types";
import { predictMandate } from "@/lib/cashflow/cashflow";
import { customerStats } from "@/lib/data/customers";
import { formatINR, uid } from "@/lib/data/format";
import { MERCHANT } from "@/lib/data/story";
import { daysRemaining, inventoryHealth } from "@/lib/inventory/inventory";
import { simulateWinback } from "@/lib/simulation/whatIf";
import { useGalla, type SheetState } from "@/lib/store/provider";
import { currentCustomers, snapshotOf } from "@/lib/store/selectors";

export function SheetHost() {
  const { sheet, setSheet } = useGalla();
  const last = useRef<SheetState>(sheet);
  if (sheet) last.current = sheet;
  const shown = last.current;
  const close = useCallback(() => setSheet(null), [setSheet]);
  return (
    <>
      <BottomSheet open={sheet?.type === "edit-proposal"} onClose={close} title="Edit plan">
        {shown?.type === "edit-proposal" && <EditProposal proposalId={shown.proposalId} onDone={close} />}
      </BottomSheet>
      <BottomSheet open={sheet?.type === "confirm"} onClose={close} title="Approve action">
        {shown?.type === "confirm" && <ConfirmAction proposal={shown.proposal} confirmLabel={shown.confirmLabel} onDone={close} />}
      </BottomSheet>
      <BottomSheet open={sheet?.type === "notifications"} onClose={close} title="Notifications">
        <Notifications onDone={close} />
      </BottomSheet>
    </>
  );
}

function Chips({ label, options, value, onChange, format }: { label: string; options: number[]; value: number; onChange: (v: number) => void; format: (v: number) => string }) {
  return (
    <fieldset>
      <legend className="text-[12px] font-bold uppercase tracking-wider text-muted">{label}</legend>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)} className={cn("h-10 rounded-xl px-3.5 text-[13px] font-bold transition-colors", value === o ? "bg-navy text-white" : "bg-canvas text-ink hover:bg-sky-50")}>
            {format(o)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function EditProposal({ proposalId, onDone }: { proposalId: string; onDone: () => void }) {
  const { state, dispatch } = useGalla();
  const rec = state.proposals[proposalId];
  const payload = rec?.proposal.payload;
  const isCampaign = payload?.kind === "create_campaign";
  const [amount, setAmount] = useState(isCampaign ? payload.offerAmount : 50);
  const [minBill, setMinBill] = useState(isCampaign ? payload.minBill : 300);
  const [custom, setCustom] = useState<string | null>(null);

  if (!rec || !isCampaign || rec.status !== "pending") return <p className="pb-4 text-sm text-muted">This plan can no longer be edited.</p>;

  const sim = simulateWinback(amount, payload.audienceSize, state.calibration, minBill);
  const message = custom ?? `Namaskara! ${MERCHANT.name} misses you. Get ₹${amount} off on your next bill above ₹${minBill} — valid for 7 days.`;

  const save = () => {
    const p = rec.proposal;
    dispatch({
      type: "EDIT_PROPOSAL",
      proposalId,
      proposal: {
        ...p,
        title: `₹${amount} win-back campaign · ${payload.audienceSize} customers`,
        summary: `Galla wants to create a ₹${amount} win-back campaign for ${payload.audienceSize} customers.`,
        expected: `${sim.returnLow}–${sim.returnHigh} returning customers · ${formatINR(sim.salesLow)}–${formatINR(sim.salesHigh)} sales`,
        payload: { ...payload, offerAmount: amount, minBill, message, returnLow: sim.returnLow, returnHigh: sim.returnHigh, salesLow: sim.salesLow, salesHigh: sim.salesHigh, roi: sim.roi },
      },
    });
    dispatch({ type: "TOAST", toast: { id: uid("t"), text: "Plan updated and re-simulated", tone: "good" } });
    onDone();
  };

  return (
    <div className="space-y-4 pb-2">
      <Chips label="Offer amount" options={[30, 50, 75, 100, 150]} value={amount} onChange={setAmount} format={(v) => `₹${v}`} />
      <Chips label="Minimum bill" options={[200, 300, 500]} value={minBill} onChange={setMinBill} format={(v) => `₹${v}+`} />
      <div>
        <label htmlFor="campaign-message" className="text-[12px] font-bold uppercase tracking-wider text-muted">
          Message to customers
        </label>
        <textarea id="campaign-message" value={message} onChange={(e) => setCustom(e.target.value)} rows={3} maxLength={300} className="mt-1.5 w-full rounded-xl bg-canvas p-3 text-[13.5px] text-ink outline-none focus:ring-2 focus:ring-sky" />
      </div>
      <div className="rounded-2xl bg-sky-50 p-3">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold text-navy">Live re-simulation</p>
          <SimulatedBadge />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10.5px] text-muted">Returning</p>
            <p className="text-[16px] font-extrabold text-ink">
              {sim.returnLow}–{sim.returnHigh}
            </p>
          </div>
          <div>
            <p className="text-[10.5px] text-muted">Sales</p>
            <p className="text-[14px] font-extrabold text-ink">
              ₹{(sim.salesLow / 1000).toFixed(1)}–{(sim.salesHigh / 1000).toFixed(1)}K
            </p>
          </div>
          <div>
            <p className="text-[10.5px] text-muted">ROI</p>
            <p className="text-[16px] font-extrabold text-good">~{sim.roi}×</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" className="flex-1" icon={Check} onClick={save}>
          Save plan
        </Button>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ConfirmAction({ proposal: p, confirmLabel = "APPROVE", onDone }: { proposal: ActionProposal; confirmLabel?: string; onDone: () => void }) {
  const { executeDirect } = useGalla();
  const pl = p.payload;
  return (
    <div className="space-y-3 pb-2">
      <p className="text-[15px] font-semibold leading-snug text-ink">{p.summary}</p>
      <dl className="space-y-1.5 rounded-2xl bg-canvas p-3 text-[13px]">
        {[
          ["WHAT", p.title],
          ["WHY", p.why],
          ["EXPECTED", p.expected],
          ["APPROVED BY", "You (Merchant)"],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="w-[92px] shrink-0 text-[10px] font-extrabold tracking-wider text-muted">{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      {(pl.kind === "prepare_supplier_order" || pl.kind === "update_inventory") && (
        <ul className="space-y-1 rounded-2xl ring-1 ring-line p-3 text-[13px]">
          {pl.lines.map((l) => (
            <li key={l.productId} className="flex justify-between gap-2">
              <span>{l.name}</span>
              <span className="tabular font-semibold">
                {pl.kind === "update_inventory" ? "+" : ""}
                {l.quantity}
              </span>
            </li>
          ))}
          {pl.kind === "prepare_supplier_order" && (
            <li className="flex justify-between border-t border-line pt-1 font-bold">
              <span>Estimated cost</span>
              <span className="tabular">{formatINR(pl.total)}</span>
            </li>
          )}
        </ul>
      )}
      {pl.kind === "create_reminder" && <p className="rounded-2xl bg-canvas p-3 text-[13px] text-muted">{pl.note}</p>}
      <div className="flex gap-2">
        <Button
          variant="success"
          className="flex-1"
          icon={Check}
          onClick={() => {
            executeDirect(p);
            onDone();
          }}
        >
          {confirmLabel}
        </Button>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
      <p className="flex items-center gap-1 text-[11px] text-faint">
        <Lock className="size-3" aria-hidden />
        Simulated · no real money moves · recorded in Action History
      </p>
    </div>
  );
}

function Notifications({ onDone }: { onDone: () => void }) {
  const { state, dispatch, sendMessage, navigate } = useGalla();
  useEffect(() => {
    dispatch({ type: "NOTIFICATIONS_SEEN" });
  }, [dispatch]);
  const customers = currentCustomers(state);
  const stats = useMemo(() => customerStats(customers), [customers]);
  const inv = inventoryHealth(state.products);
  const risk = [...inv.risk].sort((a, b) => daysRemaining(a) - daysRemaining(b))[0];
  const mandate = predictMandate(state.obligations, state.reminders);
  const running = state.campaigns.find((c) => !c.seeded && c.status === "running");

  const go = (fn: () => void) => () => {
    onDone();
    fn();
  };

  return (
    <ul className="-mx-5 divide-y divide-line pb-2">
      {running && (
        <li>
          <ListRow icon={Megaphone} tone="info" title="Win-back campaign is live" subtitle={`${snapshotOf(running).returned} customers back so far`} onClick={go(() => navigate("campaign", { id: running.id }))} />
        </li>
      )}
      {stats.atRisk > 0 && (
        <li>
          <ListRow icon={Users} tone="bad" title={`${stats.atRisk} regular customers haven't purchased in 14 days`} subtitle="Galla found why — tap to see" onClick={go(() => sendMessage("Nanna sales ee vaara yaake kadime aagide?"))} />
        </li>
      )}
      {risk && (
        <li>
          <ListRow icon={Package} tone="warn" title={`${risk.name} may run out in ${Math.round(daysRemaining(risk))} days`} subtitle={`${risk.stock} left`} onClick={go(() => navigate("inventory"))} />
        </li>
      )}
      {mandate && mandate.shortfall > 0 && (
        <li>
          <ListRow icon={Wallet} tone="warn" title={`${formatINR(mandate.amount)} EMI may fail in ${mandate.dueInDays} days`} subtitle={`${mandate.account} short by ${formatINR(mandate.shortfall)}`} onClick={go(() => navigate("cashflow"))} />
        </li>
      )}
      {!state.blockedTransfers["b-karthik"] && (
        <li>
          <ListRow icon={ShieldAlert} tone="bad" title="This beneficiary looks unusual" subtitle="Karthik Enterprises · ₹35,700 request" onClick={go(() => navigate("beneficiary"))} />
        </li>
      )}
    </ul>
  );
}
