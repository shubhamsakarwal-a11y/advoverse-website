import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const supabase = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
  if (!user) return null;
  const { data: admin } = await supabase.from('admin_users').select('id').eq('email', user.email).single();
  if (!admin) return null;
  return user;
}

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const supabase = createAdminClient();
    const { data } = await supabase.from('broadcast_messages').select('*').order('created_at', { ascending: false }).limit(50);
    return NextResponse.json({ messages: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { message, style, target_type, target_list, expires_in_days } = await req.json();
    if (!message || message.length > 200) return NextResponse.json({ error: 'Message required (max 200 chars)' }, { status: 400 });
    const supabase = createAdminClient();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expires_in_days || 7));
    const { data, error } = await supabase.from('broadcast_messages').insert({
      message,
      style: style || 'info',
      target_type: target_type || 'all',
      target_list: target_list || [],
      expires_at: expiresAt.toISOString(),
      is_active: true,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, broadcast: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const supabase = createAdminClient();
    await supabase.from('broadcast_messages').update({ is_active: false }).eq('id', id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}