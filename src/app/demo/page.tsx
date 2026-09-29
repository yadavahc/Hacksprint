import type { Metadata } from "next";
import { LiveApp } from "@/components/app-shell/LiveApp";

export const metadata: Metadata = {
  title: "90-second demo — GALLA",
  description: "Sales decline → root cause → what-if → approval → campaign → outcome → learning, running in the real app.",
};

export default function DemoPage() {
  return <LiveApp autoplay />;
}
