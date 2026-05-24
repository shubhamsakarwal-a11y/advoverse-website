export interface PricingPlan {
  name: string;
  price: number;              // Monthly price
  displayPrice: string;
  quarterlyPrice?: number;    // 3 months (10% discount)
  yearlyPrice?: number;       // 12 months (20% discount)
  desc: string;
  popular?: boolean;
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Extend Window to include Razorpay SDK
declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string };
  theme: { color: string };
  handler: (response: RazorpayPaymentResponse) => void;
  modal?: { ondismiss?: () => void };
}
