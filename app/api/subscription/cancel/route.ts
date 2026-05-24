import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createAdminClient } from '@/lib/supabase/server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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

    const { licenseId } = await req.json();

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

    if (!license.auto_renewal_enabled || !license.razorpay_subscription_id) {
      return NextResponse.json({ error: 'Auto-renewal not enabled' }, { status: 400 });
    }

    // Cancel Razorpay subscription
    await razorpay.subscriptions.cancel(license.razorpay_subscription_id, false);

    // Update license
    await supabase
      .from('licenses')
      .update({
        auto_renewal_enabled: false,
        razorpay_subscription_id: null,
      })
      .eq('id', licenseId);

    return NextResponse.json({
      success: true,
      message: 'Auto-renewal disabled successfully',
    });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Failed to cancel subscription' 
    }, { status: 500 });
  }
}
