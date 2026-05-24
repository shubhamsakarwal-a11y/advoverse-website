import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createAdminClient } from '@/lib/supabase/server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const VALID_PLANS: Record<string, number> = {
  'Junior Advocate': 100,
  'Solo Advocate': 200,
  'Advocate + Clerk': 300,
  'Chamber Lite': 800,
  'Chamber': 1500,
  'Chamber Pro': 3000,
  'Exclusive': 5000,
};

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    // Verify user with Supabase
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

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `adv_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { planName, userId: user.id, email: user.email! },
    });

    // Save pending order in Supabase
    const { data: dbOrder, error: dbError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        plan_name: planName,
        amount: amount * 100,
        currency: 'INR',
        payment_gateway: 'razorpay',
        gateway_order_id: order.id,
        status: 'pending',
      })
      .select('id')
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({
      orderId: order.id,
      dbOrderId: dbOrder.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
