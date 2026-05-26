import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { issueLicense } from '@/lib/issue-license';

function getPlanMapping(planName: string): { code: string; label: string; clients: number; users: number; days: number } {
  const name = planName.toLowerCase();
  if (name.includes('exclusive')) return { code: 'EXCLUSIVE', label: 'Exclusive', clients: 999999, users: 999999, days: 30 };
  if (name.includes('chamber pro')) return { code: 'CHAMBER_PRO', label: 'Chamber Pro', clients: 999999, users: 9, days: 30 };
  if (name.includes('chamber lite')) return { code: 'CHAMBER_LITE', label: 'Chamber Lite', clients: 200, users: 3, days: 30 };
  if (name.includes('chamber')) return { code: 'CHAMBER', label: 'Chamber', clients: 500, users: 6, days: 30 };
  if (name.includes('advocate + clerk') || name.includes('advocate+clerk')) return { code: 'ADVOCATE_CLERK', label: 'Advocate + Clerk', clients: 120, users: 2, days: 30 };
  if (name.includes('solo')) return { code: 'SOLO_ADVOCATE', label: 'Solo Advocate', clients: 60, users: 1, days: 30 };
  const days = name.includes('yearly') ? 365 : name.includes('quarterly') ? 90 : 30;
  return { code: 'JUNIOR_ADVOCATE', label: 'Junior Advocate', clients: 20, users: 1, days };
}

export async function POST(req: NextRequest) {
  try {
    // Single admin client — uses NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
    const supabase = createAdminClient();

    // Get session if available
    let sessionUserId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
        if (user) sessionUserId = user.id;
      } catch {}
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

    let planName = '';
    let orderAmount = 0;
    let userEmail = '';
    let userName = '';
    let finalUserId: string = sessionUserId || '';
    let resolvedOrderId: number = dbOrderId && dbOrderId > 0 ? dbOrderId : 0;

    // 1. Try to get order from DB
    if (resolvedOrderId > 0) {
      try {
        const { data: order } = await supabase
          .from('orders')
          .select('id, plan_name, amount, user_id')
          .eq('id', resolvedOrderId)
          .single();
        if (order) {
          planName = order.plan_name;
          orderAmount = order.amount;
          if (!finalUserId && order.user_id) finalUserId = order.user_id;
        }
      } catch {}
    }

    // 2. Always fetch Razorpay order notes — most reliable source of email + plan
    try {
      const Razorpay = require('razorpay');
      const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
      const rzpOrder = await rzp.orders.fetch(razorpay_order_id);
      const notes = rzpOrder.notes || {};
      if (!planName && notes.planName) planName = notes.planName + (notes.duration ? ' (' + notes.duration + ')' : '');
      if (notes.email) userEmail = notes.email;
      if (notes.customerName) userName = notes.customerName;
      if (!orderAmount) orderAmount = rzpOrder.amount;

      // If no dbOrderId, look up order by gateway_order_id
      if (!resolvedOrderId) {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id, user_id, plan_name, amount')
          .eq('gateway_order_id', razorpay_order_id)
          .single();
        if (existingOrder) {
          resolvedOrderId = existingOrder.id;
          if (!planName) planName = existingOrder.plan_name;
          if (!orderAmount) orderAmount = existingOrder.amount;
          if (!finalUserId && existingOrder.user_id) finalUserId = existingOrder.user_id;
        }
      }
    } catch (e) {
      console.error('Could not fetch Razorpay order notes:', e);
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'Could not determine user email' }, { status: 400 });
    }
    if (!planName) {
      return NextResponse.json({ error: 'Could not determine plan' }, { status: 400 });
    }

    // 3. Resolve userId from email if still missing
    if (!finalUserId) {
      try {
        const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const authUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === userEmail.toLowerCase());
        if (authUser) {
          finalUserId = authUser.id;
          if (!userName && authUser.user_metadata?.full_name) userName = authUser.user_metadata.full_name;
        }
      } catch {}
    }

    // 4. Create auth user if still not found
    if (!finalUserId) {
      try {
        const { data: newAuthUser } = await supabase.auth.admin.createUser({
          email: userEmail,
          email_confirm: true,
          user_metadata: { name: userName || userEmail },
        });
        if (newAuthUser?.user) finalUserId = newAuthUser.user.id;
      } catch {}
    }

    if (!finalUserId) finalUserId = userEmail; // absolute last resort

    // 5. Get name from profile if missing
    if (!userName && finalUserId && finalUserId !== userEmail) {
      try {
        const { data: profile } = await supabase.from('profiles').select('name').eq('id', finalUserId).single();
        if (profile?.name) userName = profile.name;
      } catch {}
    }

    console.log('Processing payment:', { userEmail, finalUserId, planName, resolvedOrderId });

    // 6. Issue license (idempotent — won't duplicate if already issued)
    const licenseKey = await issueLicense({
      userId: finalUserId,
      userEmail,
      userName: userName || userEmail,
      orderId: resolvedOrderId || Date.now(), // fallback only if truly no order
      planName,
      amount: orderAmount,
      paymentId: razorpay_payment_id,
      gateway: 'razorpay',
    });

    // 7. Sync Caseline subscription — use SAME supabase client (same DB)
    try {
      const emailLower = userEmail.toLowerCase();
      const pkg = getPlanMapping(planName);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + pkg.days);

      // Find or create caseline_users row
      let { data: cu } = await supabase
        .from('caseline_users')
        .select('id')
        .eq('email', emailLower)
        .single();

      if (!cu) {
        const pwHash = caselinePassword?.length >= 8
          ? await bcrypt.hash(caselinePassword, 10)
          : 'SET_VIA_FORGOT_PASSWORD';
        const { data: nu } = await supabase
          .from('caseline_users')
          .insert({
            email: emailLower,
            password_hash: pwHash,
            name: userName || emailLower,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        cu = nu;
      } else if (caselinePassword?.length >= 8) {
        const pwHash = await bcrypt.hash(caselinePassword, 10);
        await supabase
          .from('caseline_users')
          .update({ password_hash: pwHash, updated_at: new Date().toISOString() })
          .eq('id', cu.id);
      }

      if (cu) {
        await supabase
          .from('caseline_subscriptions')
          .update({ status: 'expired' })
          .eq('user_id', cu.id)
          .eq('status', 'active');

        await supabase.from('caseline_subscriptions').insert({
          user_id: cu.id,
          package_code: pkg.code,
          package_label: pkg.label,
          clients_allowed: pkg.clients,
          users_allowed: pkg.users,
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'active',
        });
        console.log('Caseline subscription synced:', emailLower, pkg.code);
      }
    } catch (subErr) {
      console.error('Caseline subscription sync (non-fatal):', subErr);
    }

    return NextResponse.json({ success: true, licenseKey });

  } catch (err) {
    console.error('Razorpay verify error:', err);
    return NextResponse.json({
      error: 'Verification failed: ' + (err instanceof Error ? err.message : String(err))
    }, { status: 500 });
  }
}
