import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const VALID_PLANS: Record<string, number> = {
  'Solo Advocate': 999,
  'Chamber Pro': 2999,
  'Lifetime License': 24999,
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://advoverse.com';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { planName } = await req.json();
    const amount = VALID_PLANS[planName];
    if (!amount) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Save pending order first
    const { data: order, error: dbError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        plan_name: planName,
        amount: amount * 100,
        currency: 'INR',
        payment_gateway: 'stripe',
        status: 'pending',
      })
      .select('id')
      .single();

    if (dbError) throw dbError;

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: { name: `Advoverse – ${planName}` },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: user.email,
      metadata: {
        orderId: String(order.id),
        userId: user.id,
        planName,
      },
      success_url: `${APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/#pricing`,
    });

    // Save stripe session id to order
    await supabase
      .from('orders')
      .update({ gateway_order_id: session.id })
      .eq('id', order.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe create-session error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
