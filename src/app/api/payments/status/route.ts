import { NextResponse } from "next/server";
import { z } from "zod";
import { paytmConfig, transactionStatus } from "@/lib/payments/paytm";

export const runtime = "nodejs";

const Body = z.object({ orderId: z.string().regex(/^GALLA\d{10,24}$/) });

// Server-side verification: a payment only counts when Paytm's Transaction Status API says TXN_SUCCESS.
export async function POST(req: Request) {
  const config = paytmConfig();
  if (!config.configured) return NextResponse.json({ simulated: true, error: config.problem }, { status: 503 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order id." }, { status: 400 });

  try {
    return NextResponse.json(await transactionStatus(parsed.data.orderId));
  } catch (error) {
    console.error("[galla] Paytm status error", error);
    return NextResponse.json({ error: "Couldn't verify the payment with Paytm." }, { status: 502 });
  }
}
