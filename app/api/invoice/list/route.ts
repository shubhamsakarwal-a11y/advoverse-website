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
      console.error('Invoice list auth error:', authErr?.message || 'no user');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('Invoice list: user=', user.email, 'id=', user.id);

    const rawEmail = user.email!.toLowerCase().trim();
    const normalizedEmail = normalizeEmail(rawEmail);

    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, plan_name, duration, total_amount, payment_date, status')
      .or(`user_email.eq.${rawEmail},user_email.eq.${normalizedEmail},user_id.eq.${user.id}`)
      .order('payment_date', { ascending: false });

    console.log('Invoice list: found', (invoices || []).length, 'invoices for', rawEmail);
    return NextResponse.json({ invoices: invoices || [] });
  } catch (err) {
    console.error('Invoice list error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}