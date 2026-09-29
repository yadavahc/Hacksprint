import { cn } from "@/components/ui/primitives";

/** The GALLA wordmark — a ₹ coin (the cash drawer, "galla") next to the name. Pure text + CSS, no image asset. */
export function BrandWordmark({ height = 18, onDark = false, className }: { height?: number; onDark?: boolean; className?: string }) {
  const size = Math.round(height * 1.05);
  return (
    <span className={cn("inline-flex items-center gap-1 font-extrabold tracking-tight", onDark ? "text-white" : "text-navy", className)} style={{ fontSize: size }}>
      <span className="grid place-items-center rounded-full bg-[#e8a33d] font-extrabold text-white" style={{ width: size * 1.05, height: size * 1.05, fontSize: size * 0.7 }} aria-hidden>
        ₹
      </span>
      GALLA
    </span>
  );
}
