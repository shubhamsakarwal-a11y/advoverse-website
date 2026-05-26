import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

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

    const email = user.email?.toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);

    // Upsert caseline_users row
    const { data: existing } = await supabase
      .from('caseline_users')
      .select('id')
      .eq('email', email!)
      .single();

    if (existing) {
      await supabase
        .from('caseline_users')
        .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      // Create caseline_users row if not exists (user may have paid without one)
      const name = user.user_metadata?.full_name || email!;
      await supabase
        .from('caseline_users')
        .insert({
          email: email!,
          password_hash: passwordHash,
          name,
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
