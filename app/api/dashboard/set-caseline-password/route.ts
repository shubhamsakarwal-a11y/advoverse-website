import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

function normalizeEmail(email: string): string {
  const lower = email.toLowerCase().trim();
  const [local, domain] = lower.split('@');
  if (!domain) return lower;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return local.replace(/\./g, '') + '@' + domain;
  }
  return lower;
}

function emailVariants(email: string): string[] {
  const lower = email.toLowerCase().trim();
  const normalized = normalizeEmail(lower);
  return Array.from(new Set([lower, normalized]));
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

    const { password } = await req.json();
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const email = normalizeEmail(user.email!);
    const passwordHash = await bcrypt.hash(password, 10);
    const variants = emailVariants(user.email!);
    const orFilter = variants.map(v => `email.eq.${v}`).join(',');

    const { data: existing } = await supabase
      .from('caseline_users')
      .select('id, status, email')
      .or(orFilter)
      .limit(1)
      .single();

    if (existing) {
      // Always restore status to active when setting password (handles re-registration)
      const wasDeleted = existing.status === 'deleted' || existing.status === 'blocked';
      await supabase
        .from('caseline_users')
        .update({
          password_hash: passwordHash,
          email,           // normalize email
          status: 'active', // always restore
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (wasDeleted) {
        console.log(`[SET-PASSWORD] Restored ${existing.email} (${existing.status}) → active`);
      }
    } else {
      const name = user.user_metadata?.full_name || user.user_metadata?.name || email;
      await supabase
        .from('caseline_users')
        .insert({
          email,
          password_hash: passwordHash,
          name,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('set-caseline-password error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
