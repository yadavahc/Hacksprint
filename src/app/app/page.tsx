import type { Metadata } from "next";
import { LiveApp } from "@/components/app-shell/LiveApp";

export const metadata: Metadata = {
  title: "Live application — GALLA",
  description: "The working GALLA merchant app (HackSprint prototype, demo data).",
};

export default function AppPage() {
  return <LiveApp />;
}
