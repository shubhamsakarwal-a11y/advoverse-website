import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

function normalizeEmail(email: string): string {
  const lower = email.toLowerCase().trim();
  const [local, domain] = lower.split('@');
  if (!domain) return lower;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return local.replace(/\./g, '') + '@' + domain;
  }
  return lower;
}

// GET: list machines for the logged-in user
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

    const rawEmail = user.email!.toLowerCase().trim();
    const normalizedEmail = normalizeEmail(rawEmail);

    // Find caseline user by either email variant
    const { data: cu } = await supabase
      .from('caseline_users')
      .select('id')
      .or(`email.eq.${rawEmail},email.eq.${normalizedEmail}`)
      .limit(1)
      .single();

    if (!cu) {
      return NextResponse.json({ machines: [] });
    }

    const { data: machines } = await supabase
      .from('caseline_machines')
      .select('id, machine_id, machine_name, registered_at, last_active_at')
      .eq('user_id', cu.id)
      .order('last_active_at', { ascending: false });

    return NextResponse.json({ machines: machines || [] });
  } catch (err) {
    console.error('machines GET error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE: remove a specific machine for the logged-in user
export async function DELETE(req: NextRequest) {
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

    const { machineId } = await req.json();
    if (!machineId) {
      return NextResponse.json({ error: 'machineId required' }, { status: 400 });
    }

    const rawEmail = user.email!.toLowerCase().trim();
    const normalizedEmail = normalizeEmail(rawEmail);

    const { data: cu } = await supabase
      .from('caseline_users')
      .select('id')
      .or(`email.eq.${rawEmail},email.eq.${normalizedEmail}`)
      .limit(1)
      .single();

    if (!cu) {
      return NextResponse.json({ error: 'User not found in Caseline' }, { status: 404 });
    }

    await supabase
      .from('caseline_machines')
      .delete()
      .eq('user_id', cu.id)
      .eq('machine_id', machineId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('machines DELETE error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}