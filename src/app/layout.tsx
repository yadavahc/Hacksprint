import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "GALLA — Aapka udhaar, wapas aapke galla mein",
  description: "GALLA is an agentic AI back-office that turns a kirana merchant's udhaar book into recovered cash and lender-ready credit history. HackSprint prototype with simulated demo data.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d4f5c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} scroll-smooth`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
