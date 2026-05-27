import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminUser } = await supabase.from('admin_users').select('id').eq('email', user.email).single();
    if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { caselineUserId, reason } = await req.json();
    if (!caselineUserId) return NextResponse.json({ error: 'caselineUserId required' }, { status: 400 });

    // Get user details
    const { data: cu } = await supabase.from('caseline_users').select('id, email, name').eq('id', caselineUserId).single();
    if (!cu) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Get machine IDs
    const { data: machines } = await supabase.from('caseline_machines').select('machine_id').eq('user_id', caselineUserId);
    const machineIds = (machines || []).map((m: any) => m.machine_id);

    // Get trial machine IDs
    const { data: trialMachines } = await supabase.from('caseline_trial_machines').select('machine_id').eq('email', cu.email);
    const trialIds = (trialMachines || []).map((m: any) => m.machine_id);
    const allMachineIds = [...new Set([...machineIds, ...trialIds])];

    // Get license keys from advoverse auth user
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const authUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === cu.email.toLowerCase());
    let licenseKeys: string[] = [];
    if (authUser) {
      const { data: lics } = await supabase.from('licenses').select('license_key').eq('user_id', authUser.id);
      licenseKeys = (lics || []).map((l: any) => l.license_key);
      // Deactivate licenses
      await supabase.from('licenses').update({ is_active: false }).eq('user_id', authUser.id);
    }

    // Log to deleted_accounts
    await supabase.from('deleted_accounts').insert({
      email: cu.email,
      name: cu.name,
      machine_ids: allMachineIds,
      license_keys: licenseKeys,
      deleted_at: new Date().toISOString(),
      reason: reason || 'admin_removed',
    });

    // Cancel subscriptions
    await supabase.from('caseline_subscriptions').update({ status: 'cancelled' }).eq('user_id', caselineUserId).eq('status', 'active');

    // Soft delete caseline_users
    await supabase.from('caseline_users').update({ status: 'deleted', updated_at: new Date().toISOString() }).eq('id', caselineUserId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('admin remove-user error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
