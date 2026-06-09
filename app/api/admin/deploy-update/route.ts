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

// GET — list all updates
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('app_updates')
      .select('*')
      .order('published_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ updates: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — publish a new update
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { version, title, changelog, download_url, is_mandatory, platform, file_size, min_version } = await req.json();

    if (!version || !title || !download_url) {
      return NextResponse.json({ error: 'Version, title, and download URL are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check if version already exists
    const { data: existing } = await supabase
      .from('app_updates')
      .select('id')
      .eq('version', version)
      .eq('platform', platform || 'windows')
      .single();

    if (existing) {
      return NextResponse.json({ error: `Version ${version} already exists for ${platform || 'windows'}` }, { status: 400 });
    }

    const { data, error } = await supabase.from('app_updates').insert({
      version,
      title,
      changelog: changelog || '',
      download_url,
      is_mandatory: is_mandatory || false,
      is_active: true,
      platform: platform || 'windows',
      file_size: file_size || null,
      min_version: min_version || null,
      published_by: user.email,
      published_at: new Date().toISOString(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, update: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — toggle active status or edit an update
export async function PATCH(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, is_active, is_mandatory, download_url, changelog, title } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const supabase = createAdminClient();
    const updates: any = {};
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (typeof is_mandatory === 'boolean') updates.is_mandatory = is_mandatory;
    if (download_url) updates.download_url = download_url;
    if (changelog !== undefined) updates.changelog = changelog;
    if (title) updates.title = title;

    const { error } = await supabase.from('app_updates').update(updates).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — remove an update entry
export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase.from('app_updates').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
