import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createAdminClient } from '@/lib/supabase/server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const DURATION_DAYS: Record<string, number> = {
  monthly: 30, quarterly: 90, yearly: 365,
};

export async function POST(req: NextRequest) {
  try {
    const { planName, duration, price, email: bodyEmail, name: bodyName, referralCode } = await req.json();

    // Basic validation
    if (!planName) return NextResponse.json({ error: 'Plan name required' }, { status: 400 });
    if (!['monthly', 'quarterly', 'yearly'].includes(duration)) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
    }
    if (!price || price < 1) return NextResponse.json({ error: 'Invalid price' }, { status: 400 });

    // Price comes from invoice preview — already includes discount + gateway fee
    // No server-side price validation needed — invoice is the source of truth
    const finalPrice = price;

    // Get user email
    let userEmail = bodyEmail;
    let userName = bodyName || bodyEmail;
    let userId = null;

    if (!userEmail) {
      try {
        const authHeader = req.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.slice(7);
          const supabase = createAdminClient();
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
            userEmail = user.email!;
            userName = user.user_metadata?.name || user.email!;
            userId = user.id;
          }
        }
      } catch {}
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const validityDays = DURATION_DAYS[duration];

    // Save order to Supabase if we have a userId
    let dbOrderId = null;
    if (userId) {
      try {
        const supabase = createAdminClient();
        const { data: dbOrder } = await supabase
          .from('orders')
          .insert({
            user_id: userId,
            plan_name: planName + ' (' + duration + ')',
            amount: finalPrice * 100, // store in paise
            currency: 'INR',
            payment_gateway: 'razorpay',
            status: 'pending',
          })
          .select('id')
          .single();
        if (dbOrder) dbOrderId = dbOrder.id;
      } catch (e) {
        console.log('Order save failed (non-fatal):', e);
      }
    }

    // Create Razorpay order with the exact amount from invoice
    const order = await razorpay.orders.create({
      amount: finalPrice * 100, // Razorpay expects paise
      currency: 'INR',
      receipt: 'adv_' + Date.now(),
      notes: {
        planName,
        duration,
        validityDays: validityDays.toString(),
        userId: userId || '',
        email: userEmail,
        customerName: userName,
        referralCode: referralCode || '',
        invoiceAmount: finalPrice.toString(),
      },
    });

    return NextResponse.json({
      orderId: order.id,
      dbOrderId: dbOrderId || 0,
      amount: order.amount,
      currency: order.currency,
    });

  } catch (err) {
    console.error('Razorpay create-order error:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
