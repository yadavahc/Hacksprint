// Browser-side Paytm JS Checkout (staging). API verified in a real browser: after the merchant loader
// script fires onLoad, window.Paytm.CheckoutJS exposes init(config) → Promise, invoke() and close().

interface PaytmCheckoutJS {
  onLoad: (callback: () => void) => void;
  init?: (config: Record<string, unknown>) => Promise<void>;
  invoke?: () => void;
  close?: () => void;
}

declare global {
  interface Window {
    Paytm?: { CheckoutJS?: PaytmCheckoutJS };
  }
}

let loading: Promise<PaytmCheckoutJS> | null = null;
let loadedFrom: string | null = null;

function loadPaytmCheckout(scriptUrl: string): Promise<PaytmCheckoutJS> {
  if (loading && loadedFrom === scriptUrl) return loading;
  loadedFrom = scriptUrl;
  loading = new Promise<PaytmCheckoutJS>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onerror = () => {
      loading = null;
      reject(new Error("Couldn't load Paytm checkout. Check your connection."));
    };
    script.onload = () => {
      const api = window.Paytm?.CheckoutJS;
      if (!api) {
        loading = null;
        reject(new Error("Paytm checkout didn't initialise."));
        return;
      }
      const timer = setTimeout(() => {
        loading = null;
        reject(new Error("Paytm checkout took too long to load."));
      }, 20000);
      api.onLoad(() => {
        clearTimeout(timer);
        resolve(window.Paytm!.CheckoutJS!);
      });
    };
    document.body.appendChild(script);
  });
  return loading;
}

export interface CheckoutOptions {
  scriptUrl: string;
  orderId: string;
  txnToken: string;
  amount: string;
  onTransactionStatus: (data: Record<string, unknown>) => void;
  onNotify?: (eventName: string, data: unknown) => void;
}

export async function openPaytmCheckout(opts: CheckoutOptions) {
  const api = await loadPaytmCheckout(opts.scriptUrl);
  if (!api.init || !api.invoke) throw new Error("Paytm checkout is unavailable.");
  await api.init({
    root: "",
    flow: "DEFAULT",
    data: { orderId: opts.orderId, token: opts.txnToken, tokenType: "TXN_TOKEN", amount: opts.amount },
    // redirect:false keeps the merchant page open and hands the result to transactionStatus.
    merchant: { redirect: false },
    handler: {
      notifyMerchant: (eventName: string, data: unknown) => opts.onNotify?.(eventName, data),
      transactionStatus: (data: Record<string, unknown>) => opts.onTransactionStatus(data),
    },
  });
  api.invoke();
}

export function closePaytmCheckout() {
  try {
    window.Paytm?.CheckoutJS?.close?.();
  } catch {
    // already closed
  }
}
