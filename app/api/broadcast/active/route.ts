import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || '';
    const plan = searchParams.get('plan') || '';
    const status = searchParams.get('status') || '';

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const { data: messages } = await supabase
      .from('broadcast_messages')
      .select('id, message, style, target_type, target_list, created_at')
      .eq('is_active', true)
      .gte('expires_at', now)
      .order('created_at', { ascending: false });

    if (!messages || messages.length === 0) {
      return NextResponse.json({ message: null });
    }

    // Find the latest message that matches this user
    for (const msg of messages) {
      if (msg.target_type === 'all') {
        return NextResponse.json({ message: { id: msg.id, message: msg.message, style: msg.style } });
      }
      if (msg.target_type === 'specific' && email) {
        const targets = msg.target_list || [];
        if (targets.some((t: string) => t.toLowerCase() === email.toLowerCase())) {
          return NextResponse.json({ message: { id: msg.id, message: msg.message, style: msg.style } });
        }
      }
      if (msg.target_type === 'plan' && plan) {
        const targets = msg.target_list || [];
        if (targets.some((t: string) => t.toLowerCase() === plan.toLowerCase())) {
          return NextResponse.json({ message: { id: msg.id, message: msg.message, style: msg.style } });
        }
      }
      if (msg.target_type === 'status' && status) {
        const targets = msg.target_list || [];
        if (targets.some((t: string) => t.toLowerCase() === status.toLowerCase())) {
          return NextResponse.json({ message: { id: msg.id, message: msg.message, style: msg.style } });
        }
      }
    }

    return NextResponse.json({ message: null });
  } catch (err) {
    return NextResponse.json({ message: null });
  }
}