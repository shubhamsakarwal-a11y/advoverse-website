import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createAdminClient } from '@/lib/supabase/server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLAN_PRICES: Record<string, { monthly: number; quarterly: number; yearly: number }> = {
  'Junior Advocate':  { monthly: 100,  quarterly: 270,  yearly: 960   },
  'Solo Advocate':    { monthly: 200,  quarterly: 540,  yearly: 1920  },
  'Advocate + Clerk': { monthly: 300,  quarterly: 810,  yearly: 2880  },
  'Chamber Lite':     { monthly: 800,  quarterly: 2160, yearly: 7680  },
  'Chamber':          { monthly: 1500, quarterly: 4050, yearly: 14400 },
  'Chamber Pro':      { monthly: 3000, quarterly: 8100, yearly: 28800 },
  'Exclusive':        { monthly: 5000, quarterly: 13500,yearly: 48000 },
};

const DURATION_DAYS: Record<string, number> = {
  monthly: 30, quarterly: 90, yearly: 365,
};

export async function POST(req: NextRequest) {
  try {
    const { planName, duration, price, email: bodyEmail, name: bodyName, referralCode } = await req.json();

    // Validate plan
    if (!PLAN_PRICES[planName]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    if (!['monthly', 'quarterly', 'yearly'].includes(duration)) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
    }

    const expectedPrice = PLAN_PRICES[planName][duration as 'monthly' | 'quarterly' | 'yearly'];

    // If referral code provided, validate and allow discounted price
    let finalPrice = price;
    if (referralCode) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const rcResp = await fetch(
          `${supabaseUrl}/rest/v1/referral_codes?code=eq.${encodeURIComponent(referralCode.toUpperCase())}&is_active=eq.true&select=*&limit=1`,
          { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
        );
        const rcRows = await rcResp.json() as any[];
        const rc = rcRows?.[0];
        if (rc && rc.used_count < rc.max_uses) {
          let discount = 0;
          if (rc.discount_type === 'percent') discount = Math.floor(expectedPrice * rc.discount_value / 100);
          else discount = Math.min(rc.discount_value, expectedPrice - 1);
          const discountedPrice = expectedPrice - discount;
          // Accept either full price or correctly discounted price
          if (price !== discountedPrice && price !== expectedPrice) {
            return NextResponse.json({ error: 'Invalid price for referral code' }, { status: 400 });
          }
          finalPrice = price;
        } else if (price !== expectedPrice) {
          return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
        }
      } catch (rcErr) {
        console.error('Referral validation error:', rcErr);
        if (price !== expectedPrice) {
          return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
        }
      }
    } else if (price !== expectedPrice) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    // Get user email — from body OR from Supabase session
    let userEmail = bodyEmail;
    let userName = bodyName || bodyEmail;
    let userId = null;

    // Try to get from session if not in body
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

    // Save order to advoverse Supabase if we have a userId
    let dbOrderId = null;
    if (userId) {
      try {
        const supabase = createAdminClient();
        const { data: dbOrder } = await supabase
          .from('orders')
          .insert({
            user_id: userId,
            plan_name: planName + ' (' + duration + ')',
            amount: finalPrice * 100,
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

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: finalPrice * 100,
      currency: 'INR',
      receipt: 'adv_' + Date.now(),
      notes: {
        planName,
        duration,
        validityDays: validityDays.toString(),
        userId: userId || '',
        email: userEmail,
        customerName: userName,
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
