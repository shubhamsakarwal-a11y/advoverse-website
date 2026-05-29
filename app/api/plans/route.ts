import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Public: returns active plans for pricing page
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: plans } = await supabase
      .from('plans')
      .select('id, name, description, monthly_price, quarterly_price, yearly_price, max_cases, max_users, features, is_popular')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    return NextResponse.json({ plans: plans || [] });
  } catch (err) {
    console.error('Plans fetch error:', err);
    return NextResponse.json({ plans: [] });
  }
}