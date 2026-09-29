"use client";

import { Eye, EyeOff, Mic, Plus, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ScreenHeader } from "@/components/app-shell/shell-bits";
import { CategoryTile } from "@/components/chat/cards";
import { Badge, Button, Card, cn } from "@/components/ui/primitives";
import { catalogProposal } from "@/lib/store/proposals";
import { useGalla } from "@/lib/store/provider";

const CATEGORIES = ["Biscuits & Snacks", "Staples", "Dairy & Bakery", "Beverages", "Home & Personal Care", "Ready to Cook"];

export function CatalogScreen() {
  const { state, dispatch, sendMessage, busy, setSheet, setVoiceOpen } = useGalla();
  const [preview, setPreview] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const published = state.catalog.filter((c) => c.published);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const p = Number(price);
    const s = Number(stock);
    if (!name.trim() || !(p > 0) || !(s >= 0) || !Number.isFinite(s)) {
      setFormError("Please enter a name, a price above ₹0 and a stock quantity.");
      return;
    }
    setFormError(null);
    setSheet({ type: "confirm", proposal: catalogProposal({ name: name.trim(), price: p, stock: Math.round(s), unit: "piece", category }), confirmLabel: "ADD TO CATALOG" });
    setName("");
    setPrice("");
    setStock("");
  };

  return (
    <div className="pb-2">
      <ScreenHeader title="Digital catalog" subtitle="Your products, online" />
      <div className="space-y-3.5 px-4 pt-2">
        <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-900 p-4 text-white shadow-float">
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky">Digital storefront · demo</p>
          <p className="mt-1 text-[16px] font-bold">shreelakshmi.galla.store</p>
          <p className="text-[12.5px] text-white/75">
            {published.length} items live · {new Set(published.map((p) => p.category)).size} categories
          </p>
          <button type="button" onClick={() => setPreview((v) => !v)} aria-expanded={preview} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-3.5 text-[13px] font-semibold ring-1 ring-white/20 hover:bg-white/20">
            {preview ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            {preview ? "Hide preview" : "Preview as customer"}
          </button>
        </div>

        {preview && (
          <div className="grid grid-cols-2 gap-2.5">
            {published.slice(0, 10).map((item) => (
              <Card key={item.id} className="p-3">
                <CategoryTile name={item.name} category={item.category} size={48} />
                <p className="mt-2 line-clamp-2 text-[13px] font-semibold leading-snug text-ink">{item.name}</p>
                <p className="text-[11px] text-muted">{item.unit}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[15px] font-extrabold text-ink">₹{item.price}</span>
                  <span className={cn("text-[10.5px] font-bold", item.stock > 20 ? "text-good" : "text-warn")}>{item.stock > 20 ? "In stock" : `Only ${item.stock} left`}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-sky-700" aria-hidden />
            <h3 className="text-sm font-bold text-ink">Just say it to Galla</h3>
          </div>
          <div className="mt-2.5 flex gap-2">
            <button type="button" disabled={busy} onClick={() => sendMessage("Ee biscuit packet ₹10, 25 pieces ide.")} className="min-h-10 flex-1 rounded-xl bg-sky-50 px-3 text-left text-[13px] font-semibold text-navy ring-1 ring-sky-100 hover:bg-sky-100 disabled:opacity-50">
              “Ee biscuit packet ₹10, 25 pieces ide.”
            </button>
            <button type="button" onClick={() => setVoiceOpen(true)} aria-label="Describe a product by voice" className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy text-white">
              <Mic className="size-5" />
            </button>
          </div>
        </Card>

        <Card as="section" aria-label="Add item manually" className="p-4">
          <h3 className="text-sm font-bold text-ink">Add an item</h3>
          <form onSubmit={submit} className="mt-2.5 space-y-2">
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">Product name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="mt-1 h-11 w-full rounded-xl bg-canvas px-3 text-[14px] outline-none focus:ring-2 focus:ring-sky" placeholder="e.g. Rava 1 kg" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[12px] font-semibold text-muted">Price (₹)</span>
                <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" className="mt-1 h-11 w-full rounded-xl bg-canvas px-3 text-[14px] outline-none focus:ring-2 focus:ring-sky" placeholder="45" />
              </label>
              <label className="block">
                <span className="text-[12px] font-semibold text-muted">Stock</span>
                <input value={stock} onChange={(e) => setStock(e.target.value)} inputMode="numeric" className="mt-1 h-11 w-full rounded-xl bg-canvas px-3 text-[14px] outline-none focus:ring-2 focus:ring-sky" placeholder="20" />
              </label>
            </div>
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 h-11 w-full rounded-xl bg-canvas px-3 text-[14px] outline-none focus:ring-2 focus:ring-sky">
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            {formError && <p className="text-[12.5px] font-semibold text-bad">{formError}</p>}
            <Button type="submit" className="w-full" icon={Plus}>
              Add item
            </Button>
          </form>
        </Card>

        <Card className="divide-y divide-line overflow-hidden">
          {state.catalog.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
              <CategoryTile name={item.name} category={item.category} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-ink">{item.name}</p>
                <p className="text-[11.5px] text-muted">
                  ₹{item.price} · stock {item.stock}
                  {item.source === "voice" && (
                    <Badge tone="info" className="ml-1.5 align-middle">
                      Added by Galla
                    </Badge>
                  )}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={item.published}
                aria-label={`${item.published ? "Unpublish" : "Publish"} ${item.name}`}
                onClick={() => dispatch({ type: "TOGGLE_PUBLISH", id: item.id })}
                className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", item.published ? "bg-good" : "bg-line")}
              >
                <span className={cn("absolute top-1 size-5 rounded-full bg-white shadow transition-[left]", item.published ? "left-6" : "left-1")} />
              </button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
