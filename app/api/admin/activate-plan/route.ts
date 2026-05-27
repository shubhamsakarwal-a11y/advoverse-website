import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const PLANS: Record<string, { label: string; clients: number; users: number }> = {
  JUNIOR_ADVOCATE:  { label: 'Junior Advocate',  clients: 20,     users: 1 },
  SOLO_ADVOCATE:    { label: 'Solo Advocate',     clients: 60,     users: 1 },
  ADVOCATE_CLERK:   { label: 'Advocate + Clerk',  clients: 120,    users: 2 },
  CHAMBER_LITE:     { label: 'Chamber Lite',      clients: 200,    users: 3 },
  CHAMBER:          { label: 'Chamber',           clients: 500,    users: 6 },
  CHAMBER_PRO:      { label: 'Chamber Pro',       clients: 999999, users: 9 },
  EXCLUSIVE:        { label: 'Exclusive',         clients: 999999, users: 999999 },
};

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminUser } = await supabase.from('admin_users').select('id').eq('email', user.email).single();
    if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { userEmail, planCode, durationDays, notes } = await req.json();
    if (!userEmail || !planCode || !durationDays) {
      return NextResponse.json({ error: 'userEmail, planCode, durationDays required' }, { status: 400 });
    }

    const plan = PLANS[planCode];
    if (!plan) return NextResponse.json({ error: 'Invalid plan code' }, { status: 400 });

    const normalizedEmail = userEmail.toLowerCase().trim();

    // Find or create caseline_users row
    let { data: cu } = await supabase.from('caseline_users').select('id').eq('email', normalizedEmail).single();
    if (!cu) {
      const { data: newCu, error: insertErr } = await supabase.from('caseline_users').insert({
        email: normalizedEmail,
        password_hash: 'NOT_SET_USE_DASHBOARD',
        name: normalizedEmail.split('@')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
      }).select('id').single();
      if (insertErr) return NextResponse.json({ error: 'Could not create user: ' + insertErr.message }, { status: 500 });
      cu = newCu;
    }

    // Expire existing active subscriptions
    await supabase.from('caseline_subscriptions').update({ status: 'expired' }).eq('user_id', cu.id).eq('status', 'active');

    // Create new subscription
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(durationDays));

    const { error: subErr } = await supabase.from('caseline_subscriptions').insert({
      user_id: cu.id,
      package_code: planCode,
      package_label: plan.label,
      clients_allowed: plan.clients,
      users_allowed: plan.users,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      status: 'active',
    });
    if (subErr) return NextResponse.json({ error: 'Subscription insert failed: ' + subErr.message }, { status: 500 });

    // Log to admin_activations
    await supabase.from('admin_activations').insert({
      activated_by: user.email,
      user_email: normalizedEmail,
      plan_code: planCode,
      plan_label: plan.label,
      duration_days: Number(durationDays),
      notes: notes || null,
      activated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `${plan.label} activated for ${normalizedEmail} (${durationDays} days)`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('activate-plan error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
