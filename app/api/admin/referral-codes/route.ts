import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const supabase = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
  if (!user) return null;
  const { data: adminUser } = await supabase.from('admin_users').select('id').eq('email', user.email).single();
  return adminUser ? user : null;
}

// GET: list all referral codes with usage stats
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const supabase = createAdminClient();
    const { data: codes } = await supabase
      .from('referral_codes')
      .select('*')
      .order('created_at', { ascending: false });

    // For each code, get recent uses
    const codesWithUses = await Promise.all((codes || []).map(async (c: any) => {
      const { data: uses } = await supabase
        .from('referral_code_uses')
        .select('user_email, original_amount, discounted_amount, discount_applied, used_at')
        .eq('code', c.code)
        .order('used_at', { ascending: false })
        .limit(50);
      return { ...c, uses: uses || [] };
    }));

    return NextResponse.json({ codes: codesWithUses });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST: create a new referral code
export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { code, discountType, discountValue, maxUses, validUntil, notes } = await req.json();
    if (!code || !discountType || discountValue === undefined || !maxUses) {
      return NextResponse.json({ error: 'code, discountType, discountValue, maxUses required' }, { status: 400 });
    }
    if (!['percent', 'flat'].includes(discountType)) {
      return NextResponse.json({ error: 'discountType must be percent or flat' }, { status: 400 });
    }
    if (discountType === 'percent' && (discountValue < 1 || discountValue > 100)) {
      return NextResponse.json({ error: 'Percent discount must be 1-100' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.from('referral_codes').insert({
      code: code.toUpperCase().trim(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      max_uses: Number(maxUses),
      used_count: 0,
      valid_from: new Date().toISOString(),
      valid_until: validUntil || null,
      is_active: true,
      created_by: admin.email,
      notes: notes || null,
      created_at: new Date().toISOString(),
    }).select().single();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Code already exists' }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, code: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// PATCH: toggle active/inactive or update a code
export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, is_active } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const supabase = createAdminClient();
    await supabase.from('referral_codes').update({ is_active }).eq('id', id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
