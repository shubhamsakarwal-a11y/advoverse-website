import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createAdminClient } from '@/lib/supabase/server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Plan IDs for Razorpay subscriptions (you'll need to create these in Razorpay Dashboard)
const SUBSCRIPTION_PLAN_IDS: Record<string, Record<string, string>> = {
  'Junior Advocate': {
    monthly: 'plan_junior_monthly',
    quarterly: 'plan_junior_quarterly',
    yearly: 'plan_junior_yearly',
  },
  'Solo Advocate': {
    monthly: 'plan_solo_monthly',
    quarterly: 'plan_solo_quarterly',
    yearly: 'plan_solo_yearly',
  },
  'Advocate + Clerk': {
    monthly: 'plan_clerk_monthly',
    quarterly: 'plan_clerk_quarterly',
    yearly: 'plan_clerk_yearly',
  },
  'Chamber Lite': {
    monthly: 'plan_lite_monthly',
    quarterly: 'plan_lite_quarterly',
    yearly: 'plan_lite_yearly',
  },
  'Chamber': {
    monthly: 'plan_chamber_monthly',
    quarterly: 'plan_chamber_quarterly',
    yearly: 'plan_chamber_yearly',
  },
  'Chamber Pro': {
    monthly: 'plan_pro_monthly',
    quarterly: 'plan_pro_quarterly',
    yearly: 'plan_pro_yearly',
  },
  'Exclusive': {
    monthly: 'plan_exclusive_monthly',
    quarterly: 'plan_exclusive_quarterly',
    yearly: 'plan_exclusive_yearly',
  },
};

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

    const { licenseId, planName, duration } = await req.json();

    // Get license details
    const { data: license } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', licenseId)
      .eq('user_id', user.id)
      .single();

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    if (license.auto_renewal_enabled) {
      return NextResponse.json({ error: 'Auto-renewal already enabled' }, { status: 400 });
    }

    // Extract base plan name (remove duration suffix)
    const basePlanName = planName.replace(/\s*\((monthly|quarterly|yearly)\)/i, '');
    const planId = SUBSCRIPTION_PLAN_IDS[basePlanName]?.[duration];

    if (!planId) {
      return NextResponse.json({ error: 'Invalid plan or duration' }, { status: 400 });
    }

    // Calculate start date (when current license expires)
    const startAt = license.expires_at 
      ? Math.floor(new Date(license.expires_at).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      quantity: 1,
      total_count: 12, // 12 billing cycles, then user can renew
      start_at: startAt,
      notes: {
        license_id: String(licenseId),
        user_id: user.id,
        plan_name: planName,
        duration,
      },
    });

    // Update license with subscription info
    await supabase
      .from('licenses')
      .update({
        auto_renewal_enabled: true,
        razorpay_subscription_id: subscription.id,
        payment_method_saved: true,
      })
      .eq('id', licenseId);

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      nextBillingDate: new Date(startAt * 1000).toISOString(),
    });
  } catch (err) {
    console.error('Create subscription error:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Failed to create subscription' 
    }, { status: 500 });
  }
}
