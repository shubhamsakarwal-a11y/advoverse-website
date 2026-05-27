import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/referral/validate?code=LAUNCH50&amount=100
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code')?.toUpperCase().trim();
    const amount = parseInt(searchParams.get('amount') || '0'); // in rupees

    if (!code) return NextResponse.json({ valid: false, error: 'Code required' });
    if (!amount) return NextResponse.json({ valid: false, error: 'Amount required' });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      console.error('referral validate: missing env vars');
      return NextResponse.json({ valid: false, error: 'Server configuration error' });
    }

    // Direct REST fetch — no client library needed
    const resp = await fetch(
      `${supabaseUrl}/rest/v1/referral_codes?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=*&limit=1`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('referral validate supabase error:', errText);
      return NextResponse.json({ valid: false, error: 'Internal error' });
    }

    const rows = await resp.json() as any[];
    const rc = rows?.[0];

    if (!rc) return NextResponse.json({ valid: false, error: 'Invalid or expired referral code' });

    // Check usage limit
    if (rc.used_count >= rc.max_uses) {
      return NextResponse.json({ valid: false, error: 'This referral code has reached its usage limit' });
    }

    // Check validity dates
    const now = new Date();
    if (rc.valid_from && new Date(rc.valid_from) > now) {
      return NextResponse.json({ valid: false, error: 'This code is not yet active' });
    }
    if (rc.valid_until && new Date(rc.valid_until) < now) {
      return NextResponse.json({ valid: false, error: 'This referral code has expired' });
    }

    // Calculate discount
    let discountAmount = 0;
    if (rc.discount_type === 'percent') {
      discountAmount = Math.floor(amount * rc.discount_value / 100);
    } else {
      // flat discount in rupees
      discountAmount = Math.min(rc.discount_value, amount - 1);
    }

    const discountedAmount = amount - discountAmount;

    return NextResponse.json({
      valid: true,
      code: rc.code,
      discountType: rc.discount_type,
      discountValue: rc.discount_value,
      discountAmount,
      originalAmount: amount,
      discountedAmount,
      discountText: rc.discount_type === 'percent'
        ? `${rc.discount_value}% off`
        : `\u20B9${rc.discount_value} off`,
      usesRemaining: rc.max_uses - rc.used_count,
    });

  } catch (err) {
    console.error('referral validate error:', err instanceof Error ? err.message : String(err), err instanceof Error ? err.stack : '');
    return NextResponse.json({ valid: false, error: 'Internal error' });
  }
}
