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

    const { caselineUserId, action } = await req.json(); // action: 'block' | 'unblock'
    if (!caselineUserId || !action) return NextResponse.json({ error: 'caselineUserId and action required' }, { status: 400 });

    const newStatus = action === 'block' ? 'blocked' : 'active';
    await supabase.from('caseline_users').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', caselineUserId);

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    console.error('admin block-user error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
