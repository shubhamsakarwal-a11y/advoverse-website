import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { issueLicense } from '@/lib/issue-license';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Must disable body parsing for Stripe signature verification
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Stripe webhook verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true });
    }

    const { orderId, userId, planName } = session.metadata || {};
    if (!orderId || !userId || !planName) {
      console.error('Missing metadata on session:', session.id);
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get the full order
    const { data: order } = await supabase
      .from('orders')
      .select('id, amount')
      .eq('id', Number(orderId))
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get user info
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    await issueLicense({
      userId,
      userEmail: user?.email!,
      userName: profile?.name || user?.email!,
      orderId: order.id,
      planName,
      amount: order.amount,
      paymentId: session.payment_intent as string,
      gateway: 'stripe',
    });
  }

  return NextResponse.json({ received: true });
}
