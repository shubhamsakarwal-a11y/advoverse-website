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

// GET: all plans (including inactive)
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const supabase = createAdminClient();
    const { data: plans } = await supabase.from('plans').select('*').order('display_order', { ascending: true });
    return NextResponse.json({ plans: plans || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: create new plan
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('plans').insert({
      name: body.name,
      description: body.description || '',
      monthly_price: body.monthly_price || 0,
      quarterly_price: body.quarterly_price || 0,
      yearly_price: body.yearly_price || 0,
      max_cases: body.max_cases || 20,
      max_users: body.max_users || 1,
      features: body.features || [],
      is_popular: body.is_popular || false,
      is_active: body.is_active !== false,
      display_order: body.display_order || 0,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, plan: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: update plan
export async function PATCH(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const supabase = createAdminClient();
    const updates: any = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.monthly_price !== undefined) updates.monthly_price = body.monthly_price;
    if (body.quarterly_price !== undefined) updates.quarterly_price = body.quarterly_price;
    if (body.yearly_price !== undefined) updates.yearly_price = body.yearly_price;
    if (body.max_cases !== undefined) updates.max_cases = body.max_cases;
    if (body.max_users !== undefined) updates.max_users = body.max_users;
    if (body.features !== undefined) updates.features = body.features;
    if (body.is_popular !== undefined) updates.is_popular = body.is_popular;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.display_order !== undefined) updates.display_order = body.display_order;
    const { error } = await supabase.from('plans').update(updates).eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: delete plan (soft - set inactive)
export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const supabase = createAdminClient();
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}