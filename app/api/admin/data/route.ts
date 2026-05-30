import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.slice(7));
    if (authErr || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { data: adminUser } = await supabase.from('admin_users').select('id').eq('email', user.email).single();
    if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // ── 1. Advoverse auth users ──
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const advUsers = (authData?.users || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      full_name: u.user_metadata?.full_name || u.user_metadata?.name || null,
      provider: u.app_metadata?.provider || 'email',
      confirmed: !!u.email_confirmed_at,
    }));

    // ── 2. Caseline users with full details ──
    const { data: cuRaw } = await supabase
      .from('caseline_users')
      .select('id, email, name, created_at, status, password_hash')
      .order('created_at', { ascending: false });

    const caselineUsers = await Promise.all((cuRaw || []).map(async (cu: any) => {
      // Active subscription
      const { data: sub } = await supabase
        .from('caseline_subscriptions')
        .select('package_label, package_code, status, expires_at, created_at')
        .eq('user_id', cu.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Machines
      const { data: machines } = await supabase
        .from('caseline_machines')
        .select('machine_id, machine_name, registered_at, last_active_at')
        .eq('user_id', cu.id)
        .order('registered_at', { ascending: false });

      // User stats (client count)
      const { data: stats } = await supabase
        .from('caseline_user_stats')
        .select('client_count, case_count, last_sync')
        .eq('user_id', cu.id)
        .single();

      // Last seen = most recent machine last_seen
      const lastSeen = machines?.reduce((latest: string | null, m: any) => {
        if (!m.last_active_at) return latest;
        if (!latest) return m.last_active_at;
        return m.last_active_at > latest ? m.last_active_at : latest;
      }, null);

      return {
        ...cu,
        hasPassword: cu.password_hash && cu.password_hash !== 'NOT_SET_USE_DASHBOARD',
        subscription: sub || null,
        machines: machines || [],
        primaryMachineId: machines?.[0]?.machine_id || null,
        lastSeen,
        clientCount: stats?.client_count ?? null,
        caseCount: stats?.case_count ?? null,
        lastSync: stats?.last_sync || null,
      };
    }));

    // ── 3. Flagged users ──
    const { data: flaggedUsers } = await supabase.from('flagged_users').select('*').order('flagged_at', { ascending: false });

    // ── 4. Deleted accounts ──
    const { data: deletedAccounts } = await supabase.from('deleted_accounts').select('*').order('deleted_at', { ascending: false });

    // ── 5. Transactions ──
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
    const thisMonthRevenue = (orders || []).filter((o: any) => new Date(o.created_at) >= thisMonth).reduce((s: number, o: any) => s + (o.amount / 100), 0);
    const { data: licenses } = await supabase.from('licenses').select('id, is_active, expires_at');
    const activeLicenses = (licenses || []).filter((l: any) => l.is_active && (!l.expires_at || new Date(l.expires_at) > new Date())).length;
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

    // Invoices (all, latest first)
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, user_email, user_name, plan_name, duration, total_amount, payment_date, referral_code, status')
      .order('payment_date', { ascending: false })
      .limit(200);

        // Audit logs (latest 100)
    const { data: auditLogs } = await supabase
      .from('admin_audit_log')
      .select('id, action, admin_email, ip_address, details, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    return NextResponse.json({ stats, advUsers, caselineUsers, flaggedUsers: flaggedUsers || [], deletedAccounts: deletedAccounts || [], transactions, invoices: allInvoices || [], auditLogs: auditLogs || [] });
  } catch (err) {
    console.error('Admin data error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
