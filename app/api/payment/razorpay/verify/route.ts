import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { issueLicense } from '@/lib/issue-license';

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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } =
      await req.json();

    // Verify Razorpay signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 });
    }

    // Get the order to find planName and amount
    const { data: order } = await supabase
      .from('orders')
      .select('id, plan_name, amount')
      .eq('id', dbOrderId)
      .eq('user_id', user.id)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const licenseKey = await issueLicense({
      userId: user.id,
      userEmail: user.email!,
      userName: profile?.name || user.email!,
      orderId: order.id,
      planName: order.plan_name,
      amount: order.amount,
      paymentId: razorpay_payment_id,
      gateway: 'razorpay',
    });

    return NextResponse.json({ success: true, licenseKey });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
