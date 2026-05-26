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
    // Session is optional - payment can complete without active session
    let sessionUserId: string | null = null;
    let sessionUserEmail: string | null = null;
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const supabase = createAdminClient();
        const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
        if (user) {
          sessionUserId = user.id;
          sessionUserEmail = user.email || null;
        }
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

    const supabase = createAdminClient();

    // Try to get order from DB (works if session active)
    let planName = '';
    let orderAmount = 0;
    let userEmail = sessionUserEmail || '';
    let userName = userEmail;

    if (dbOrderId && dbOrderId > 0) {
      try {
        // Try with user_id filter first
        const query = sessionUserId
          ? supabase.from('orders').select('id, plan_name, amount').eq('id', dbOrderId).eq('user_id', sessionUserId).single()
          : supabase.from('orders').select('id, plan_name, amount').eq('id', dbOrderId).single();
        
        const { data: order } = await query;
        if (order) {
          planName = order.plan_name;
          orderAmount = order.amount;
        }
      } catch {}
    }

    // If we couldn't get from DB, get from Razorpay order notes
    if (!planName || !userEmail) {
      try {
        const Razorpay = require('razorpay');
        const rzp = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID!,
          key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });
        const rzpOrder = await rzp.orders.fetch(razorpay_order_id);
        const notes = rzpOrder.notes || {};
        
        if (!planName && notes.planName) planName = notes.planName + (notes.duration ? ' (' + notes.duration + ')' : '');
        if (!userEmail && notes.email) userEmail = notes.email;
        if (!userName && notes.customerName) userName = notes.customerName;
        if (!orderAmount) orderAmount = rzpOrder.amount;
      } catch (e) {
        console.error('Could not fetch Razorpay order notes:', e);
      }
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'Could not determine user email from payment' }, { status: 400 });
    }
    if (!planName) {
      return NextResponse.json({ error: 'Could not determine plan from payment' }, { status: 400 });
    }

    // Get or create profile
    if (sessionUserId) {
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', sessionUserId).single();
      if (profile?.name) userName = profile.name;
    }

    // Issue license
    const licenseKey = await issueLicense({
      userId: sessionUserId || userEmail,
      userEmail,
      userName: userName || userEmail,
      orderId: dbOrderId || Date.now(),
      planName,
      amount: orderAmount,
      paymentId: razorpay_payment_id,
      gateway: 'razorpay',
    });

    // Save Caseline user + subscription
    try {
      const caselineSupabase = require('@supabase/supabase-js').createClient(
        process.env.CASELINE_SUPABASE_URL!,
        process.env.CASELINE_SUPABASE_SERVICE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const emailLower = userEmail.toLowerCase();
      const pkg = getPlanMapping(planName);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + pkg.days);

      // Find or create caseline user
      let { data: cu } = await caselineSupabase.from('caseline_users').select('id').eq('email', emailLower).single();
      
      if (!cu) {
        const passwordHash = caselinePassword && caselinePassword.length >= 8
          ? await bcrypt.hash(caselinePassword, 10)
          : 'SET_VIA_FORGOT_PASSWORD';
        
        const { data: newUser } = await caselineSupabase
          .from('caseline_users')
          .insert({ email: emailLower, password_hash: passwordHash, name: userName, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .select('id').single();
        cu = newUser;
      } else if (caselinePassword && caselinePassword.length >= 8) {
        const passwordHash = await bcrypt.hash(caselinePassword, 10);
        await caselineSupabase.from('caseline_users').update({ password_hash: passwordHash, updated_at: new Date().toISOString() }).eq('id', cu.id);
      }

      if (cu) {
        // Deactivate old subscriptions
        await caselineSupabase.from('caseline_subscriptions').update({ status: 'expired' }).eq('user_id', cu.id).eq('status', 'active');
        
        // Create new subscription
        await caselineSupabase.from('caseline_subscriptions').insert({
          user_id: cu.id,
          package_code: pkg.code,
          package_label: pkg.label,
          clients_allowed: pkg.clients,
          users_allowed: pkg.users,
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'active'
        });
        
        console.log('Caseline subscription created for:', emailLower, pkg.code);
      }
    } catch (subErr) {
      console.error('Caseline subscription sync failed (non-fatal):', subErr);
    }

    return NextResponse.json({ success: true, licenseKey });

  } catch (err) {
    console.error('Razorpay verify error:', err);
    return NextResponse.json({ error: 'Verification failed: ' + (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
