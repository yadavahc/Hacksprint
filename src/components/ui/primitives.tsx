"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

export function Card({ children, className, as: As = "div", ...rest }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" } & React.HTMLAttributes<HTMLElement>) {
  return (
    <As className={cn("rounded-2xl bg-white shadow-card", className)} {...rest}>
      {children}
    </As>
  );
}

type Variant = "primary" | "sky" | "outline" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-navy text-white hover:bg-navy-700 disabled:bg-navy/40",
  sky: "bg-sky text-navy-900 hover:bg-sky-600 hover:text-white disabled:opacity-50",
  outline: "bg-white text-navy ring-1 ring-inset ring-line hover:ring-navy/40 disabled:opacity-50",
  ghost: "bg-transparent text-navy hover:bg-sky-50 disabled:opacity-50",
  danger: "bg-bad text-white hover:bg-bad/90 disabled:opacity-50",
  success: "bg-good text-white hover:bg-good/90 disabled:opacity-50",
};
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px] gap-1.5 rounded-xl",
  md: "h-11 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-2xl",
};

export function Button({ variant = "primary", size = "md", icon: Icon, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; icon?: LucideIcon }) {
  return (
    <button type="button" className={cn("inline-flex select-none items-center justify-center font-semibold transition-colors disabled:cursor-not-allowed", VARIANTS[variant], SIZES[size], className)} {...rest}>
      {Icon && <Icon className={size === "sm" ? "size-4" : "size-[18px]"} aria-hidden />}
      {children}
    </button>
  );
}

type Tone = "neutral" | "good" | "warn" | "bad" | "info" | "navy";
const TONES: Record<Tone, string> = {
  neutral: "bg-canvas text-muted",
  good: "bg-good-50 text-good",
  warn: "bg-warn-50 text-warn",
  bad: "bg-bad-50 text-bad",
  info: "bg-sky-50 text-sky-700",
  navy: "bg-navy text-white",
};

export function Badge({ tone = "neutral", children, className, icon: Icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: LucideIcon }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide", TONES[tone], className)}>
      {Icon && <Icon className="size-3" aria-hidden />}
      {children}
    </span>
  );
}

export function SectionTitle({ title, action, onAction, className }: { title: string; action?: string; onAction?: () => void; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between px-1", className)}>
      <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted">{title}</h2>
      {action && onAction && (
        <button type="button" onClick={onAction} className="inline-flex min-h-9 items-center gap-0.5 text-[13px] font-semibold text-sky-700 hover:text-navy">
          {action}
          <ChevronRight className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

export function Stat({ label, value, delta, tone = "neutral", sub }: { label: string; value: string; delta?: string; tone?: "up" | "down" | "neutral"; sub?: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-extrabold leading-tight text-ink">{value}</p>
      {(delta || sub) && (
        <p className="mt-0.5 flex items-center gap-1 text-xs">
          {delta && <span className={cn("font-bold", tone === "up" ? "text-good" : tone === "down" ? "text-bad" : "text-muted")}>{delta}</span>}
          {sub && <span className="truncate text-faint">{sub}</span>}
        </p>
      )}
    </div>
  );
}

export function ListRow({ icon: Icon, title, subtitle, right, onClick, tone = "info", className }: { icon?: LucideIcon; title: ReactNode; subtitle?: ReactNode; right?: ReactNode; onClick?: () => void; tone?: Tone; className?: string }) {
  const content = (
    <>
      {Icon && (
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", TONES[tone])}>
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold text-ink">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-xs text-muted">{subtitle}</span>}
      </span>
      {right}
      {onClick && !right && <ChevronRight className="size-4 shrink-0 text-faint" aria-hidden />}
    </>
  );
  const cls = cn("flex w-full min-h-14 items-center gap-3 px-4 py-2.5", className);
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(cls, "transition-colors hover:bg-canvas/70")}>
      {content}
    </button>
  ) : (
    <div className={cls}>{content}</div>
  );
}

export function ProgressBar({ value, tone = "sky", label }: { value: number; tone?: "sky" | "good" | "warn" | "bad" | "navy"; label?: string }) {
  const color = { sky: "bg-sky", good: "bg-good", warn: "bg-warn", bad: "bg-bad", navy: "bg-navy" }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-canvas" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl bg-canvas p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("min-h-9 flex-1 rounded-lg px-2 text-[13px] font-semibold transition-colors", value === o.value ? "bg-white text-navy shadow-card" : "text-muted hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
