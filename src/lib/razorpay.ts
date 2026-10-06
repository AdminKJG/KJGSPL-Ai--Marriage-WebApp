// Razorpay Checkout.js dynamic loader and invocation utility
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      close: () => void;
      on: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn("Failed to load Razorpay checkout.js script from CDN.");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(
  options: Omit<RazorpayOptions, "key"> & { key?: string }
): Promise<boolean> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error("Razorpay Checkout SDK could not be loaded. Please check your internet connection.");
  }

  const key =
    options.key ||
    (import.meta.env.VITE_RAZORPAY_KEY_ID as string) ||
    "rzp_test_1DP5mmOlF5G5ag";

  const instance = new window.Razorpay({
    ...options,
    key,
  });

  instance.open();
  return true;
}
