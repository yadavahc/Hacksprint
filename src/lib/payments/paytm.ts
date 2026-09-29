import PaytmChecksum from "paytmchecksum";

// Server-only Paytm Payment Gateway client — STAGING ONLY. The merchant key never reaches the browser.
// Verified against Paytm staging: signatures are accepted on securestage.paytmpayments.com
// (an invalid signature returns 2005 "Checksum provided is invalid").

const STAGING_HOST = "https://securestage.paytmpayments.com";

export interface PaytmConfig {
  configured: boolean;
  env: "staging";
  host: string;
  mid: string | null;
  problem: string | null;
}

export function paytmConfig(): PaytmConfig {
  const mid = process.env.PAYTM_MID?.trim() || null;
  const key = process.env.PAYTM_MERCHANT_KEY?.trim() || null;
  const env = (process.env.PAYTM_ENV || "staging").trim().toLowerCase();
  let problem: string | null = null;
  if (!mid || !key) problem = "PAYTM_MID and PAYTM_MERCHANT_KEY are not set";
  else if (env !== "staging") problem = "This prototype only supports Paytm staging (PAYTM_ENV=staging) — no real money";
  else if (key.length !== 16) problem = "PAYTM_MERCHANT_KEY must be the 16-character test key";
  return { configured: problem === null, env: "staging", host: STAGING_HOST, mid, problem };
}

const sign = (bodyString: string) => PaytmChecksum.generateSignature(bodyString, process.env.PAYTM_MERCHANT_KEY!.trim());

async function post<T>(path: string, body: Record<string, unknown>, head: Record<string, string> = {}): Promise<T> {
  const bodyString = JSON.stringify(body);
  const signature = await sign(bodyString);
  // Paytm verifies the signature against the exact body string, so embed it verbatim.
  const payload = `{"body":${bodyString},"head":${JSON.stringify({ ...head, signature })}}`;
  const res = await fetch(`${STAGING_HOST}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Paytm HTTP ${res.status}`);
  return (await res.json()) as T;
}

interface ResultInfo {
  resultStatus?: string;
  resultCode?: string;
  resultMsg?: string;
}

const KNOWN_CODES: Record<string, string> = {
  "239": "Paytm staging refused to start the payment. Payments aren't enabled for this test MID yet — check Test mode in the Paytm dashboard (Developer Settings → API Keys) or contact Paytm support.",
  "2005": "Paytm rejected the request signature. Check PAYTM_MERCHANT_KEY matches this MID.",
  "334": "Paytm has no record of this order.",
};

export type InitiateResult =
  | { ok: true; orderId: string; txnToken: string; amount: string; mid: string; scriptUrl: string }
  | { ok: false; code: string; message: string; hint?: string };

export async function initiateTransaction(input: { orderId: string; amount: number; custId: string }): Promise<InitiateResult> {
  const { mid } = paytmConfig();
  const amount = input.amount.toFixed(2);
  const json = await post<{ body?: { resultInfo?: ResultInfo; txnToken?: string } }>(
    `/theia/api/v1/initiateTransaction?mid=${encodeURIComponent(mid!)}&orderId=${encodeURIComponent(input.orderId)}`,
    { requestType: "Payment", mid, websiteName: "WEBSTAGING", orderId: input.orderId, txnAmount: { value: amount, currency: "INR" }, userInfo: { custId: input.custId } },
    { channelId: "WEB" },
  );
  const info = json.body?.resultInfo;
  if (json.body?.txnToken && info?.resultStatus === "S") {
    return { ok: true, orderId: input.orderId, txnToken: json.body.txnToken, amount, mid: mid!, scriptUrl: `${STAGING_HOST}/merchantpgpui/checkoutjs/merchants/${mid}.js` };
  }
  const code = info?.resultCode ?? "unknown";
  return { ok: false, code, message: info?.resultMsg ?? "Paytm did not return a transaction token", hint: KNOWN_CODES[code] };
}

export interface StatusResult {
  status: "TXN_SUCCESS" | "TXN_FAILURE" | "PENDING" | "NO_RECORD_FOUND" | "UNKNOWN";
  code: string;
  message: string;
  txnId?: string;
  txnAmount?: string;
  paymentMode?: string;
  txnDate?: string;
}

export async function transactionStatus(orderId: string): Promise<StatusResult> {
  const { mid } = paytmConfig();
  const json = await post<{ body?: { resultInfo?: ResultInfo; txnId?: string; txnAmount?: string; paymentMode?: string; txnDate?: string } }>("/v3/order/status", { mid, orderId });
  const b = json.body ?? {};
  const raw = b.resultInfo?.resultStatus ?? "UNKNOWN";
  const status = (["TXN_SUCCESS", "TXN_FAILURE", "PENDING", "NO_RECORD_FOUND"].includes(raw) ? raw : "UNKNOWN") as StatusResult["status"];
  return { status, code: b.resultInfo?.resultCode ?? "", message: b.resultInfo?.resultMsg ?? "", txnId: b.txnId, txnAmount: b.txnAmount, paymentMode: b.paymentMode, txnDate: b.txnDate };
}
