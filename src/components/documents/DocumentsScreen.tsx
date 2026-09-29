"use client";

import { motion } from "framer-motion";
import { ChevronDown, FileCheck2, FilePlus2, FileText, PackageCheck, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { ScreenHeader } from "@/components/app-shell/shell-bits";
import { ExtractionView } from "@/components/chat/cards";
import { Badge, Button, Card, cn } from "@/components/ui/primitives";
import { SAMPLE_DOCUMENTS } from "@/lib/data/documents";
import { shortDate, uid } from "@/lib/data/format";
import type { InvoiceLine } from "@/lib/data/types";
import { matchProductByName, stockFromDocumentProposal } from "@/lib/store/proposals";
import { useGalla } from "@/lib/store/provider";
import type { DocumentRecord } from "@/lib/store/types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const KIND_LABEL: Record<string, string> = { invoice: "Invoice", gst: "GST return", bank: "Bank statement", udyam: "Udyam", other: "Document" };

export function DocumentsScreen() {
  const { state, dispatch, health, setSheet, navigate } = useGalla();
  const fileRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const onFileSampleIds = new Set(state.documents.map((d) => d.sampleId).filter(Boolean));
  const samples = SAMPLE_DOCUMENTS.filter((d) => !onFileSampleIds.has(d.id));

  const addSample = async (sampleId: string, fileName?: string) => {
    const s = SAMPLE_DOCUMENTS.find((d) => d.id === sampleId)!;
    setProcessing(fileName ?? s.title);
    await sleep(1700);
    const record: DocumentRecord = {
      id: uid("doc"),
      sampleId,
      at: Date.now(),
      source: fileName ? "upload" : "sample",
      fileName,
      extracted: { kind: s.kind, title: s.title, fields: s.fields, lineItems: s.lineItems ?? [], inconsistencies: s.inconsistencies, engine: "demo" },
      appliedToStock: false,
    };
    dispatch({ type: "ADD_DOCUMENT", record });
    dispatch({ type: "TOAST", toast: { id: uid("t"), text: sampleId === "doc-gst" ? "GST returns added — credit readiness improved" : `${s.title.split(" · ")[0]} extracted`, tone: "good" } });
    setProcessing(null);
    setOpenId(record.id);
  };

  const guessSample = (name: string) =>
    /gst|gstr/i.test(name) ? "doc-gst" : /bank|statement/i.test(name) ? "doc-bank" : /udyam|msme/i.test(name) ? "doc-udyam" : onFileSampleIds.has("doc-invoice-annapoorna") ? "doc-invoice-0912" : "doc-invoice-annapoorna";

  const upload = async (file: File) => {
    setNote(null);
    if (!health.vision) {
      setNote("Demo mode: extracted using a sample template (add GEMINI_API_KEY to read your real file).");
      await addSample(guessSample(file.name), file.name);
      return;
    }
    setProcessing(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/documents/extract", { method: "POST", body: fd });
      const json = (await res.json()) as { extracted?: { kind: string; title: string; fields: { label: string; value: string; confidence: number }[]; lineItems: InvoiceLine[]; inconsistencies: string[] }; engine?: string; error?: string };
      if (!res.ok || !json.extracted) throw new Error(json.error ?? "Extraction failed");
      const ex = json.extracted;
      const record: DocumentRecord = {
        id: uid("doc"),
        sampleId: ex.kind === "gst" ? "doc-gst" : undefined,
        at: Date.now(),
        source: "upload",
        fileName: file.name,
        extracted: { ...ex, lineItems: ex.lineItems.map((l) => ({ ...l, productId: matchProductByName(state.products, l.name)?.id })), engine: json.engine ?? "AI" },
        appliedToStock: false,
      };
      dispatch({ type: "ADD_DOCUMENT", record });
      setOpenId(record.id);
      setProcessing(null);
    } catch (e) {
      setProcessing(null);
      setNote(`${(e as Error).message}. Used a sample template instead.`);
      await addSample(guessSample(file.name), file.name);
    }
  };

  return (
    <div className="pb-2">
      <ScreenHeader title="Documents" subtitle="Invoices, GST, bank statements" />
      <div className="space-y-3.5 px-4 pt-2">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={!!processing} className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-sky-600/40 bg-white p-6 text-center hover:bg-sky-50 disabled:opacity-60">
          <span className="grid size-12 place-items-center rounded-2xl bg-sky-50 text-navy">
            <Upload className="size-6" aria-hidden />
          </span>
          <span className="text-[15px] font-bold text-ink">Upload a document</span>
          <span className="text-[12px] text-muted">Photo or PDF · {health.vision ? `read by ${health.vision}` : "demo extraction"}</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="sr-only"
          aria-label="Upload document"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        {note && <p className="rounded-xl bg-warn-50 px-3 py-2 text-[12.5px] text-warn">{note}</p>}

        {processing && (
          <Card className="p-4" aria-live="polite">
            <p className="text-[13px] font-bold text-ink">Reading “{processing}”</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
              <motion.div className="h-full rounded-full bg-sky" initial={{ width: "5%" }} animate={{ width: "95%" }} transition={{ duration: 1.6, ease: "easeInOut" }} />
            </div>
            <p className="mt-2 text-[12px] text-muted">Extracting fields · checking confidence · looking for inconsistencies</p>
          </Card>
        )}

        {samples.length > 0 && (
          <Card className="overflow-hidden">
            <h3 className="px-4 pt-4 text-sm font-bold text-ink">Try a sample document</h3>
            <ul className="mt-1 divide-y divide-line">
              {samples.map((s) => (
                <li key={s.id}>
                  <button type="button" disabled={!!processing} onClick={() => addSample(s.id)} className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left hover:bg-canvas/60 disabled:opacity-50">
                    <FilePlus2 className="size-5 shrink-0 text-sky-700" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink">{s.title}</span>
                      <span className="block text-[11.5px] text-muted">{s.subtitle}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <section className="space-y-2">
          <h2 className="px-1 text-[13px] font-bold uppercase tracking-wider text-muted">On file ({state.documents.length})</h2>
          {state.documents.map((d) => {
            const sample = SAMPLE_DOCUMENTS.find((s) => s.id === d.sampleId);
            const ex = d.extracted ?? (sample ? { kind: sample.kind, title: sample.title, fields: sample.fields, lineItems: sample.lineItems ?? [], inconsistencies: sample.inconsistencies, engine: "demo" as const } : null);
            if (!ex) return null;
            const open = openId === d.id;
            const lines = ex.lineItems.filter((l) => l.productId).map((l) => ({ productId: l.productId!, name: l.name, quantity: l.quantity }));
            return (
              <Card key={d.id} className="overflow-hidden">
                <button type="button" aria-expanded={open} onClick={() => setOpenId(open ? null : d.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-canvas text-navy">{ex.kind === "invoice" ? <FileText className="size-5" aria-hidden /> : <FileCheck2 className="size-5" aria-hidden />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-ink">{ex.title}</span>
                    <span className="block truncate text-[11.5px] text-muted">
                      {KIND_LABEL[ex.kind] ?? "Document"} · {d.fileName ?? "sample"} · {shortDate(new Date(d.at))} · {ex.engine === "demo" ? "demo template" : ex.engine}
                    </span>
                  </span>
                  {d.appliedToStock && <Badge tone="good">Stock updated</Badge>}
                  <ChevronDown className={cn("size-4 shrink-0 text-faint transition-transform", open && "rotate-180")} aria-hidden />
                </button>
                {open && (
                  <div className="border-t border-line px-4 pb-4 pt-2">
                    <ExtractionView fields={ex.fields} lineItems={ex.lineItems} inconsistencies={ex.inconsistencies} />
                    {ex.kind === "invoice" && !d.appliedToStock && lines.length > 0 && (
                      <Button className="mt-3 w-full" icon={PackageCheck} onClick={() => setSheet({ type: "confirm", proposal: stockFromDocumentProposal(d.sampleId ?? d.id, ex.title, lines), confirmLabel: "UPDATE STOCK" })}>
                        Update stock from this invoice
                      </Button>
                    )}
                    {ex.kind === "gst" && (
                      <Button variant="outline" className="mt-3 w-full" onClick={() => navigate("credit")}>
                        See credit readiness
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </section>
      </div>
    </div>
  );
}
