import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { issueLicense } from '@/lib/issue-license';

function normalizeEmail(email: string): string {
  const lower = email.toLowerCase().trim();
  const [local, domain] = lower.split('@');
  if (!domain) return lower;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return local.replace(/\./g, '') + '@' + domain;
  }
  return lower;
}

function getPlanMapping(planName: string, duration?: string): { code: string; label: string; clients: number; users: number; days: number } {
  const name = planName.toLowerCase();
  const dur = (duration || '').toLowerCase();
  const days = dur.includes('yearly') || name.includes('yearly') ? 365
             : dur.includes('quarterly') || name.includes('quarterly') ? 90
             : 30;

  if (name.includes('exclusive'))    return { code: 'EXCLUSIVE',      label: 'Exclusive',        clients: 999999, users: 999999, days };
  if (name.includes('chamber pro'))  return { code: 'CHAMBER_PRO',    label: 'Chamber Pro',      clients: 999999, users: 9,      days };
  if (name.includes('chamber lite')) return { code: 'CHAMBER_LITE',   label: 'Chamber Lite',     clients: 200,    users: 3,      days };
  if (name.includes('chamber'))      return { code: 'CHAMBER',        label: 'Chamber',          clients: 500,    users: 6,      days };
  if (name.includes('advocate + clerk') || name.includes('advocate+clerk'))
                                     return { code: 'ADVOCATE_CLERK', label: 'Advocate + Clerk', clients: 120,    users: 2,      days };
  if (name.includes('solo'))         return { code: 'SOLO_ADVOCATE',  label: 'Solo Advocate',    clients: 60,     users: 1,      days };
  return                                    { code: 'JUNIOR_ADVOCATE', label: 'Junior Advocate',  clients: 20,     users: 1,      days };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Get session user if available
    let sessionUserId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
        if (user) sessionUserId = user.id;
      } catch {}
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId, caselinePassword, referralCode } = await req.json();

    // Verify Razorpay signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 });
    }

    let planName = '';
    let planDuration = '';
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

    // 2. Fetch Razorpay order notes — most reliable source of email + plan
    try {
      const Razorpay = require('razorpay');
      const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
      const rzpOrder = await rzp.orders.fetch(razorpay_order_id);
      const notes = rzpOrder.notes || {};
      if (notes.planName) planName = notes.planName;
      if (notes.duration) planDuration = notes.duration;
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

    if (!userEmail) return NextResponse.json({ error: 'Could not determine user email' }, { status: 400 });
    if (!planName)  return NextResponse.json({ error: 'Could not determine plan' }, { status: 400 });

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

    if (!finalUserId) finalUserId = userEmail;

    // 5. Get name from profile if missing
    if (!userName && finalUserId && finalUserId !== userEmail) {
      try {
        const { data: profile } = await supabase.from('profiles').select('name').eq('id', finalUserId).single();
        if (profile?.name) userName = profile.name;
      } catch {}
    }

    console.log('Processing payment:', { userEmail, finalUserId, planName, planDuration, resolvedOrderId });

    // 6. Issue license
    const licenseKey = await issueLicense({
      userId: finalUserId,
      userEmail,
      userName: userName || userEmail,
      orderId: resolvedOrderId || Date.now(),
      planName,
      amount: orderAmount,
      paymentId: razorpay_payment_id,
      gateway: 'razorpay',
    });

    // 7. Sync Caseline subscription — search BOTH email variants
    try {
      const emailNormalized = normalizeEmail(userEmail);
      const emailRaw = userEmail.toLowerCase().trim();
      const pkg = getPlanMapping(planName, planDuration);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + pkg.days);

      // Find existing caseline_users row by either email variant
      const { data: cu } = await supabase
        .from('caseline_users')
        .select('id, email')
        .or(`email.eq.${emailRaw},email.eq.${emailNormalized}`)
        .limit(1)
        .single();

      let caselineUserId: number | null = null;

      if (cu) {
        caselineUserId = cu.id;
        // Update password if provided
        if (caselinePassword?.length >= 8) {
          const pwHash = await bcrypt.hash(caselinePassword, 10);
          await supabase
            .from('caseline_users')
            .update({ password_hash: pwHash, updated_at: new Date().toISOString() })
            .eq('id', cu.id);
        }
      } else {
        // Create new caseline_users row using normalized email
        const pwHash = caselinePassword?.length >= 8
          ? await bcrypt.hash(caselinePassword, 10)
          : 'NOT_SET_USE_DASHBOARD';
        const { data: nu } = await supabase
          .from('caseline_users')
          .insert({
            email: emailNormalized,
            password_hash: pwHash,
            name: userName || emailNormalized,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (nu) caselineUserId = nu.id;
      }

      if (caselineUserId) {
        // Expire any existing active subscriptions
        await supabase
          .from('caseline_subscriptions')
          .update({ status: 'expired' })
          .eq('user_id', caselineUserId)
          .eq('status', 'active');

        // Insert new active subscription
        await supabase.from('caseline_subscriptions').insert({
          user_id: caselineUserId,
          package_code: pkg.code,
          package_label: pkg.label,
          clients_allowed: pkg.clients,
          users_allowed: pkg.users,
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'active',
        });
        console.log('Caseline subscription synced:', emailNormalized, pkg.code, pkg.days + ' days');
      }
    } catch (subErr) {
      console.error('Caseline subscription sync (non-fatal):', subErr);
    }

    // 8. Log referral code usage
    if (referralCode && userEmail && orderAmount) {
      try {
        const { data: rc } = await supabase
          .from('referral_codes')
          .select('id, used_count, discount_type, discount_value')
          .eq('code', referralCode.toUpperCase())
          .single();
        if (rc) {
          let discountApplied = 0;
          if (rc.discount_type === 'percent') discountApplied = Math.floor((orderAmount / 100) * rc.discount_value);
          else discountApplied = Math.min(rc.discount_value * 100, orderAmount - 100);
          await supabase.from('referral_code_uses').insert({
            code: referralCode.toUpperCase(),
            user_email: userEmail,
            order_id: resolvedOrderId || null,
            original_amount: orderAmount,
            discounted_amount: orderAmount - discountApplied,
            discount_applied: discountApplied,
            used_at: new Date().toISOString(),
          });
          await supabase.from('referral_codes').update({ used_count: rc.used_count + 1 }).eq('id', rc.id);
        }
      } catch (refErr) {
        console.error('Referral log error (non-fatal):', refErr);
      }
    }

    // 9. Create invoice record
    try {
      const invDate = new Date();
      const invoiceNumber = 'ADV-' + invDate.getFullYear() + '-' + String(resolvedOrderId || Date.now()).padStart(6, '0');
      const pkg = getPlanMapping(planName, planDuration);
      const serviceStart = invDate.toISOString().split('T')[0];
      const serviceEndDate = new Date(invDate);
      serviceEndDate.setDate(serviceEndDate.getDate() + pkg.days);
      const serviceEnd = serviceEndDate.toISOString().split('T')[0];

      // Calculate amounts (orderAmount is in paise from Razorpay)
      const totalPaise = orderAmount; // what was actually charged
      const gatewayFeePaise = Math.max(100, Math.ceil((totalPaise / 1.025) * 0.025)); // reverse-calc fee
      const subtotalPaise = totalPaise - gatewayFeePaise;
      // If referral discount was applied, base = subtotal + discount
      let discountPaise = 0;
      let basePaise = subtotalPaise;
      if (referralCode) {
        try {
          const { data: rc } = await supabase.from('referral_codes').select('discount_type, discount_value').eq('code', referralCode.toUpperCase()).single();
          if (rc) {
            if (rc.discount_type === 'percent') discountPaise = Math.floor(basePaise * rc.discount_value / 100);
            else discountPaise = rc.discount_value * 100;
            basePaise = subtotalPaise + discountPaise;
          }
        } catch {}
      }

      await supabase.from('invoices').insert({
        order_id: resolvedOrderId || null,
        invoice_number: invoiceNumber,
        user_id: finalUserId,
        user_email: userEmail,
        user_name: userName || userEmail,
        plan_name: planName,
        duration: planDuration || 'monthly',
        base_amount: Math.round(basePaise / 100),
        discount_amount: Math.round(discountPaise / 100),
        referral_code: referralCode || null,
        subtotal: Math.round(subtotalPaise / 100),
        gateway_fee: Math.round(gatewayFeePaise / 100),
        total_amount: Math.round(totalPaise / 100),
        payment_id: razorpay_payment_id,
        payment_date: invDate.toISOString(),
        service_start: serviceStart,
        service_end: serviceEnd,
        status: 'paid',
      });
      console.log('Invoice created:', invoiceNumber);
    } catch (invErr) {
      console.error('Invoice creation (non-fatal):', invErr);
    }

    return NextResponse.json({ success: true, licenseKey });

  } catch (err) {
    console.error('Razorpay verify error:', err);
    return NextResponse.json({
      error: 'Verification failed: ' + (err instanceof Error ? err.message : String(err))
    }, { status: 500 });
  }
}