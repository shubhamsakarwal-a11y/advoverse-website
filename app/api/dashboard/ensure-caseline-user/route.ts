import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/dashboard/ensure-caseline-user
 * Called when user visits dashboard.
 * Creates caseline_users row if it doesn't exist (allows trial login to Caseline).
 * Does NOT set a password — user must do that via the Caseline Password tab.
 */
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

    const email = user.email?.toLowerCase()!;
    const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];

    // Check if caseline_users row already exists
    const { data: existing } = await supabase
      .from('caseline_users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existing) {
      // Already exists — nothing to do
      return NextResponse.json({ success: true, created: false, userId: existing.id });
    }

    // Create row WITHOUT a password — user must set it via dashboard
    const { data: newUser, error: insertErr } = await supabase
      .from('caseline_users')
      .insert({
        email,
        password_hash: 'NOT_SET_USE_DASHBOARD',
        name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertErr) {
      // Duplicate key = already exists (race condition) — not an error
      if (insertErr.code === '23505') {
        return NextResponse.json({ success: true, created: false });
      }
      console.error('ensure-caseline-user error:', insertErr.message);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, created: true, userId: newUser.id });

  } catch (err) {
    console.error('ensure-caseline-user error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
