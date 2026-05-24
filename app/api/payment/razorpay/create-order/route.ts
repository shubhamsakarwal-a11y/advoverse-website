import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createAdminClient } from '@/lib/supabase/server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Plan prices by duration
const PLAN_PRICES: Record<string, { monthly: number; quarterly: number; yearly: number }> = {
  'Junior Advocate': { monthly: 100, quarterly: 270, yearly: 960 },
  'Solo Advocate': { monthly: 200, quarterly: 540, yearly: 1920 },
  'Advocate + Clerk': { monthly: 300, quarterly: 810, yearly: 2880 },
  'Chamber Lite': { monthly: 800, quarterly: 2160, yearly: 7680 },
  'Chamber': { monthly: 1500, quarterly: 4050, yearly: 14400 },
  'Chamber Pro': { monthly: 3000, quarterly: 8100, yearly: 28800 },
  'Exclusive': { monthly: 5000, quarterly: 13500, yearly: 48000 },
};

// Duration to days mapping
const DURATION_DAYS: Record<string, number> = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
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

    const { planName, duration, price } = await req.json();
    
    // Validate plan exists
    if (!PLAN_PRICES[planName]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Validate duration
    if (!['monthly', 'quarterly', 'yearly'].includes(duration)) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
    }

    // Validate price matches expected price for plan and duration
    const expectedPrice = PLAN_PRICES[planName][duration as 'monthly' | 'quarterly' | 'yearly'];
    if (price !== expectedPrice) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    const amount = price;
    const validityDays = DURATION_DAYS[duration];

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `adv_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { 
        planName, 
        duration,
        validityDays: validityDays.toString(),
        userId: user.id, 
        email: user.email! 
      },
    });

    // Save pending order in Supabase
    const { data: dbOrder, error: dbError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        plan_name: `${planName} (${duration})`,
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
