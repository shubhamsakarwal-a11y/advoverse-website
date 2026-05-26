import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
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

    const { reason } = await req.json().catch(() => ({ reason: 'user_requested' }));
    const email = user.email?.toLowerCase()!;
    const name = user.user_metadata?.full_name || email;

    // Gather caseline user data
    let machineIds: string[] = [];
    let licenseKeys: string[] = [];
    let caselineUserId: number | null = null;

    const { data: cu } = await supabase
      .from('caseline_users')
      .select('id')
      .eq('email', email)
      .single();

    if (cu) {
      caselineUserId = cu.id;

      // Collect machine IDs
      const { data: machines } = await supabase
        .from('caseline_machines')
        .select('machine_id')
        .eq('user_id', cu.id);
      machineIds = (machines || []).map((m: any) => m.machine_id);

      // Collect trial machine IDs too
      const { data: trialMachines } = await supabase
        .from('caseline_trial_machines')
        .select('machine_id')
        .eq('email', email);
      const trialIds = (trialMachines || []).map((m: any) => m.machine_id);
      machineIds = [...new Set([...machineIds, ...trialIds])];
    }

    // Collect advoverse license keys
    const { data: lics } = await supabase
      .from('licenses')
      .select('license_key')
      .eq('user_id', user.id);
    licenseKeys = (lics || []).map((l: any) => l.license_key);

    // Log to deleted_accounts
    await supabase.from('deleted_accounts').insert({
      email,
      name,
      machine_ids: machineIds,
      license_keys: licenseKeys,
      deleted_at: new Date().toISOString(),
      reason: reason || 'user_requested',
    });

    // Deactivate caseline subscription
    if (caselineUserId) {
      await supabase
        .from('caseline_subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', caselineUserId)
        .eq('status', 'active');

      // Soft-delete caseline_users (mark inactive rather than delete)
      await supabase
        .from('caseline_users')
        .update({ status: 'deleted', updated_at: new Date().toISOString() })
        .eq('id', caselineUserId);
    }

    // Deactivate advoverse licenses
    await supabase
      .from('licenses')
      .update({ is_active: false })
      .eq('user_id', user.id);

    // Delete the Supabase auth user (removes login ability)
    await supabase.auth.admin.deleteUser(user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('remove-account error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
