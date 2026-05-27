import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Normalize email — strips dots from Gmail local part.
 * Gmail treats mamta.sakarwal@gmail.com and mamtasakarwal@gmail.com as identical.
 * We normalize to prevent duplicate accounts.
 */
function normalizeEmail(email: string): string {
  const lower = email.toLowerCase().trim();
  const [local, domain] = lower.split('@');
  if (!domain) return lower;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return local.replace(/\./g, '') + '@' + domain;
  }
  return lower;
}

/**
 * POST /api/dashboard/ensure-caseline-user
 * Called when user visits dashboard.
 * Creates caseline_users row if it doesn't exist (allows trial login to Caseline).
 * Normalizes Gmail dots to prevent duplicate accounts.
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

    const rawEmail = user.email!;
    const normalizedEmail = normalizeEmail(rawEmail);
    const name = user.user_metadata?.full_name || user.user_metadata?.name || normalizedEmail.split('@')[0];

    // Check if caseline_users row already exists (check both raw and normalized)
    const { data: existing } = await supabase
      .from('caseline_users')
      .select('id, email')
      .or(`email.eq.${normalizedEmail},email.eq.${rawEmail.toLowerCase()}`)
      .limit(1)
      .single();

    if (existing) {
      // If email is not normalized, fix it
      if (existing.email !== normalizedEmail) {
        await supabase
          .from('caseline_users')
          .update({ email: normalizedEmail, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        console.log(`Normalized email: ${existing.email} → ${normalizedEmail}`);
      }
      return NextResponse.json({ success: true, created: false, userId: existing.id });
    }

    // Create row WITHOUT a password — user must set it via dashboard
    const { data: newUser, error: insertErr } = await supabase
      .from('caseline_users')
      .insert({
        email: normalizedEmail,  // always store normalized
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
