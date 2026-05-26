import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.slice(7));
    if (authErr || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', user.email)
      .single();
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── 1. Advoverse auth users ──
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const advUsers = (authData?.users || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      full_name: u.user_metadata?.full_name || u.user_metadata?.name || null,
      provider: u.app_metadata?.provider || 'email',
    }));

    // ── 2. Caseline users with subscriptions ──
    const { data: cuRaw } = await supabase
      .from('caseline_users')
      .select('id, email, name, created_at, status')
      .order('created_at', { ascending: false });

    const caselineUsers = await Promise.all((cuRaw || []).map(async (cu: any) => {
      const { data: sub } = await supabase
        .from('caseline_subscriptions')
        .select('package_label, status, expires_at')
        .eq('user_id', cu.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return { ...cu, subscription: sub || null };
    }));

    // ── 3. Flagged users ──
    const { data: flaggedUsers } = await supabase
      .from('flagged_users')
      .select('*')
      .order('flagged_at', { ascending: false });

    // ── 4. Deleted accounts ──
    const { data: deletedAccounts } = await supabase
      .from('deleted_accounts')
      .select('*')
      .order('deleted_at', { ascending: false });

    // ── 5. Transactions (orders) with user email ──
    const { data: orders } = await supabase
      .from('orders')
      .select('id, created_at, plan_name, amount, status, payment_gateway, user_id')
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(100);

    const userMap = new Map(advUsers.map((u: any) => [u.id, u.email]));
    const transactions = (orders || []).map((o: any) => ({
      ...o,
      user_email: userMap.get(o.user_id) || 'Unknown',
      gateway: o.payment_gateway || 'razorpay',
    }));

    // ── 6. Stats ──
    const totalRevenue = (orders || []).reduce((s: number, o: any) => s + (o.amount / 100), 0);
    const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
    const thisMonthRevenue = (orders || [])
      .filter((o: any) => new Date(o.created_at) >= thisMonth)
      .reduce((s: number, o: any) => s + (o.amount / 100), 0);

    const { data: licenses } = await supabase.from('licenses').select('id, is_active, expires_at');
    const activeLicenses = (licenses || []).filter((l: any) =>
      l.is_active && (!l.expires_at || new Date(l.expires_at) > new Date())
    ).length;

    const { data: activeSubs } = await supabase.from('caseline_subscriptions').select('id').eq('status', 'active');

    const stats = {
      totalRevenue,
      thisMonthRevenue,
      activeLicenses,
      totalAdvUsers: advUsers.length,
      totalCaselineUsers: caselineUsers.length,
      activeSubscriptions: activeSubs?.length || 0,
      flaggedCount: (flaggedUsers || []).filter((f: any) => f.status === 'pending').length,
    };

    return NextResponse.json({
      stats,
      advUsers,
      caselineUsers,
      flaggedUsers: flaggedUsers || [],
      deletedAccounts: deletedAccounts || [],
      transactions,
    });

  } catch (err) {
    console.error('Admin data error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
