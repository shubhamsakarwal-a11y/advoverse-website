import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

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

    const email = user.email?.toLowerCase();

    // Look up caseline_users by email
    const caselineDB = createAdminClient();
    const { data: cu } = await caselineDB
      .from('caseline_users')
      .select('id')
      .eq('email', email!)
      .single();

    if (!cu) {
      return NextResponse.json({ subscription: null });
    }

    // Get active subscription
    const { data: sub } = await caselineDB
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
