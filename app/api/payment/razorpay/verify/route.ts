import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { issueLicense } from '@/lib/issue-license';


// Map advoverse plan name to Caseline package code
function getPlanMapping(planName: string): { code: string; label: string; clients: number; users: number; days: number } {
  const name = planName.toLowerCase();
  if (name.includes('exclusive')) return { code: 'EXCLUSIVE', label: 'Exclusive', clients: 999999, users: 999999, days: 30 };
  if (name.includes('chamber pro')) return { code: 'CHAMBER_PRO', label: 'Chamber Pro', clients: 999999, users: 9, days: 30 };
  if (name.includes('chamber lite')) return { code: 'CHAMBER_LITE', label: 'Chamber Lite', clients: 200, users: 3, days: 30 };
  if (name.includes('chamber')) return { code: 'CHAMBER', label: 'Chamber', clients: 500, users: 6, days: 30 };
  if (name.includes('advocate + clerk') || name.includes('advocate+clerk')) return { code: 'ADVOCATE_CLERK', label: 'Advocate + Clerk', clients: 120, users: 2, days: 30 };
  if (name.includes('solo')) return { code: 'SOLO_ADVOCATE', label: 'Solo Advocate', clients: 60, users: 1, days: 30 };
  // quarterly/yearly multipliers
  const days = name.includes('yearly') ? 365 : name.includes('quarterly') ? 90 : 30;
  return { code: 'JUNIOR_ADVOCATE', label: 'Junior Advocate', clients: 20, users: 1, days };
}

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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId, caselinePassword } =
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

    // Save Caseline password to users table (create or update)
    if (caselinePassword && caselinePassword.length >= 8) {
      try {
        const passwordHash = await bcrypt.hash(caselinePassword, 10);
        const userEmail = user.email!.toLowerCase();
        const userName = profile?.name || user.email!;

        // Check if user already exists in users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .single();

        if (existingUser) {
          // Update password
          await supabase
            .from('users')
            .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
            .eq('email', userEmail);
        } else {
          // Create new Caseline user
          await supabase
            .from('users')
            .insert({
              email: userEmail,
              password_hash: passwordHash,
              name: userName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
        console.log('Caseline user password saved for:', userEmail);
      } catch (pwdErr) {
        // Non-fatal - license still issued
        console.error('Failed to save Caseline password (non-fatal):', pwdErr);
      }
    }

    // ── Write subscription to Caseline-Auth Supabase ──
    try {
      const { createClient } = require('@supabase/supabase-js');
      const caselineDB = createClient(
        process.env.CASELINE_SUPABASE_URL!,
        process.env.CASELINE_SUPABASE_SERVICE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const userEmail = user.email!.toLowerCase();
      const pkg = getPlanMapping(order.plan_name);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + pkg.days);

      // Find user in Caseline by email
      const { data: caselineUser } = await caselineDB
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (caselineUser) {
        // Deactivate old subscriptions
        await caselineDB
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('user_id', caselineUser.id)
          .eq('status', 'active');

        // Insert new subscription
        await caselineDB
          .from('subscriptions')
          .insert({
            user_id: caselineUser.id,
            package_code: pkg.code,
            package_label: pkg.label,
            clients_allowed: pkg.clients,
            users_allowed: pkg.users,
            created_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            status: 'active'
          });

        console.log('Caseline subscription created for:', userEmail, pkg.code);
      } else {
        console.log('Caseline user not found for:', userEmail, '- will be created on first login');
      }
    } catch (subErr) {
      // Non-fatal - license still issued, user can manually refresh
      console.error('Failed to sync Caseline subscription (non-fatal):', subErr);
    }

    return NextResponse.json({ success: true, licenseKey });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
