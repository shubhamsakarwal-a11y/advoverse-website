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

// Generate all possible email variants to search for
function emailVariants(email: string): string[] {
  const lower = email.toLowerCase().trim();
  const normalized = normalizeEmail(lower);
  const variants = new Set([lower, normalized]);
  return Array.from(variants);
}

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
    const variants = emailVariants(rawEmail);

    // Search for existing row using ALL email variants
    const orFilter = variants.map(v => `email.eq.${v}`).join(',');
    const { data: existing } = await supabase
      .from('caseline_users')
      .select('id, email, status')
      .or(orFilter)
      .limit(1)
      .single();

    if (existing) {
      const updates: any = { updated_at: new Date().toISOString() };

      // Normalize email if needed
      if (existing.email !== normalizedEmail) {
        updates.email = normalizedEmail;
      }

      // KEY FIX: Restore deleted/blocked accounts on re-registration
      if (existing.status === 'deleted' || existing.status === 'blocked') {
        updates.status = 'active';
        updates.name = name;

        // Flag re-registration for admin awareness
        try {
          await supabase.from('flagged_users').insert({
            current_email: normalizedEmail,
            previous_email: existing.email,
            machine_id: 'RE_REGISTRATION',
            flagged_at: new Date().toISOString(),
            status: 'pending',
            notes: `Re-registered after account was ${existing.status}. Auto-restored.`,
          });
        } catch { /* non-fatal */ }

        console.log(`[ENSURE-USER] Restored ${existing.email} (${existing.status}) → active`);
      }

      if (Object.keys(updates).length > 1) {
        await supabase.from('caseline_users').update(updates).eq('id', existing.id);
      }

      return NextResponse.json({
        success: true,
        created: false,
        userId: existing.id,
        restored: existing.status === 'deleted' || existing.status === 'blocked',
      });
    }

    // Create new row
    const { data: newUser, error: insertErr } = await supabase
      .from('caseline_users')
      .insert({
        email: normalizedEmail,
        password_hash: 'NOT_SET_USE_DASHBOARD',
        name,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertErr) {
      if (insertErr.code === '23505') {
        return NextResponse.json({ success: true, created: false });
      }
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, created: true, userId: newUser.id });

  } catch (err) {
    console.error('ensure-caseline-user error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
