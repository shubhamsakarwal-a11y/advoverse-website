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

    // Search both dot and normalized email variants
    const { data: cu } = await supabase
      .from('caseline_users')
      .select('id')
      .or(`email.eq.${rawEmail},email.eq.${normalizedEmail}`)
      .limit(1)
      .single();

    if (!cu) {
      return NextResponse.json({ subscription: null });
    }

    // Get active subscription
    const { data: sub } = await supabase
      .from('caseline_subscriptions')
      .select('*')
      .eq('user_id', cu.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({ subscription: sub || null });
  } catch (err) {
    console.error('Dashboard subscription error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}