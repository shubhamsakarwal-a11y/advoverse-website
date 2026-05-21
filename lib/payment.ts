import { RazorpayPaymentResponse } from './types/payment';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function initiateRazorpayPayment(
  planName: string,
  token: string,
  userName: string,
  userEmail: string,
  onSuccess: (response: RazorpayPaymentResponse, dbOrderId: number) => void
): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) throw new Error('Failed to load Razorpay. Check your connection.');

  const res = await fetch('/api/payment/razorpay/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ planName }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create order');
  }

  const { orderId, dbOrderId, amount, currency } = await res.json();

  const rzp = new window.Razorpay({
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    amount,
    currency,
    name: 'Advoverse',
    description: `${planName} Subscription`,
    order_id: orderId,
    prefill: { name: userName, email: userEmail },
    theme: { color: '#f59e0b' },
    handler: (response) => onSuccess(response, dbOrderId),
  });

  rzp.open();
}

export async function verifyRazorpayPayment(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  dbOrderId: number,
  token: string
): Promise<{ success: boolean }> {
  const res = await fetch('/api/payment/razorpay/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Verification failed');
  }
  return res.json();
}

export async function createStripeSession(
  planName: string,
  token: string
): Promise<{ url: string }> {
  const res = await fetch('/api/payment/stripe/create-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ planName }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create Stripe session');
  }
  return res.json();
}
