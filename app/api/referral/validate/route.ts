import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/referral/validate?code=LAUNCH50&amount=100
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code')?.toUpperCase().trim();
    const amount = parseInt(searchParams.get('amount') || '0'); // in rupees

    if (!code) return NextResponse.json({ valid: false, error: 'Code required' });
    if (!amount) return NextResponse.json({ valid: false, error: 'Amount required' });

    const supabase = createAdminClient();
    const { data: rc } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

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
      discountAmount = Math.min(rc.discount_value, amount - 1); // never make it free
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
        : `₹${rc.discount_value} off`,
      usesRemaining: rc.max_uses - rc.used_count,
    });
  } catch (err) {
    console.error('referral validate error:', err);
    return NextResponse.json({ valid: false, error: 'Internal error' });
  }
}
