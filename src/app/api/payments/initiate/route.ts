import { NextResponse } from "next/server";
import { z } from "zod";
import { initiateTransaction, paytmConfig } from "@/lib/payments/paytm";

export const runtime = "nodejs";

const Body = z.object({
  amount: z.number().min(1).max(100000),
  note: z.string().max(80).optional(),
});

// Creates a Paytm STAGING transaction and returns a token for JS Checkout. The merchant key stays here.
export async function POST(req: Request) {
  const config = paytmConfig();
  if (!config.configured) return NextResponse.json({ simulated: true, error: config.problem }, { status: 503 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter an amount between ₹1 and ₹1,00,000." }, { status: 400 });

  const orderId = `GALLA${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
  try {
    const result = await initiateTransaction({ orderId, amount: parsed.data.amount, custId: "GALLA_MERCHANT_DEMO" });
    if (!result.ok) {
      console.warn(`[galla] Paytm initiate failed ${result.code}: ${result.message}`);
      return NextResponse.json({ error: `Paytm ${result.code}: ${result.message}`, code: result.code, hint: result.hint, orderId }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("[galla] Paytm initiate error", error);
    return NextResponse.json({ error: "Couldn't reach Paytm staging. Please try again." }, { status: 502 });
  }
}
