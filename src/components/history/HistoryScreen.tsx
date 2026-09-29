"use client";

import { ArrowUpRight, ClipboardList } from "lucide-react";
import { useState } from "react";
import { ScreenHeader } from "@/components/app-shell/shell-bits";
import { LearningView } from "@/components/chat/MessageItem";
import { AGENT_ICON } from "@/components/ui/ai-bits";
import { Badge, Button, Card, Segmented } from "@/components/ui/primitives";
import { shortDate } from "@/lib/data/format";
import { useGalla } from "@/lib/store/provider";
import type { AuditEntry } from "@/lib/store/types";

function timeAgo(ts: number) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return shortDate(new Date(ts));
}

const STATUS_TONE: Record<AuditEntry["status"], "good" | "info" | "warn" | "bad" | "neutral"> = {
  Running: "info",
  Completed: "good",
  Done: "good",
  Scheduled: "info",
  "Ready to send": "warn",
  Blocked: "good",
  "Proceeded with warning": "warn",
};

export function HistoryScreen() {
  const { state, navigate } = useGalla();
  const [tab, setTab] = useState<"actions" | "learning">("actions");

  return (
    <div className="pb-2">
      <ScreenHeader title="Action history" subtitle="Every action — with your approval" parent="insights" />
      <div className="space-y-3.5 px-4 pt-2">
        <Segmented
          label="History view"
          value={tab}
          onChange={setTab}
          options={[
            { value: "actions", label: `Audit log (${state.audit.length})` },
            { value: "learning", label: `Learning (${state.learnings.length})` },
          ]}
        />

        {tab === "actions" &&
          (state.audit.length === 0 ? (
            <Card className="p-6 text-center">
              <ClipboardList className="mx-auto size-8 text-faint" aria-hidden />
              <p className="mt-2 text-sm text-muted">No actions yet. Approve a plan from Galla and it appears here.</p>
            </Card>
          ) : (
            state.audit.map((a) => {
              const Icon = AGENT_ICON[a.agent];
              return (
                <Card key={a.id} as="article" className="p-4">
                  <div className="flex items-start gap-2.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-bold leading-snug text-ink">{a.what}</p>
                      <p className="text-[11px] text-muted">
                        {a.agent === "Orchestrator" ? "Galla" : `${a.agent} Agent`} · {timeAgo(a.at)}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge>
                  </div>
                  <dl className="mt-3 space-y-1.5 text-[12.5px]">
                    {[
                      ["WHAT", a.what],
                      ["WHY", a.why],
                      ["EXPECTED RESULT", a.expected],
                      ["APPROVED BY", a.approvedBy],
                      ["STATUS", a.result ? `${a.status} · ${a.result}` : a.status],
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="w-[108px] shrink-0 text-[10px] font-extrabold tracking-wider text-muted">{k}</dt>
                        <dd className="text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {a.route && (
                    <Button size="sm" variant="ghost" icon={ArrowUpRight} className="mt-2" onClick={() => navigate(a.route!.name, a.route!.params)}>
                      Open
                    </Button>
                  )}
                </Card>
              );
            })
          ))}

        {tab === "learning" && state.learnings.map((l) => <LearningView key={l.id} learning={l} />)}
      </div>
    </div>
  );
}
