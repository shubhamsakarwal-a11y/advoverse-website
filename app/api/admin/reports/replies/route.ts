/**
 * Admin Reports Replies API Route
 * GET /api/admin/reports/replies?reportId=xxx — Fetch conversation thread for a report
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.slice(7));
    if (authErr || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { data: adminUser } = await supabase.from('admin_users').select('id').eq('email', user.email).single();
    if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Get reportId from query params
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json({ error: 'reportId query param is required' }, { status: 400 });
    }

    // Fetch replies for this report
    const { data: replies, error: repliesErr } = await supabase
      .from('caseline_report_replies')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (repliesErr) {
      console.error('Fetch replies error:', repliesErr);
      return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
    }

    // Mark user replies as read (admin is viewing them)
    const unreadUserReplies = (replies || [])
      .filter(r => r.sender_type === 'user' && !r.read_at)
      .map(r => r.id);

    if (unreadUserReplies.length > 0) {
      await supabase
        .from('caseline_report_replies')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadUserReplies);
    }

    return NextResponse.json({ success: true, data: replies || [] });
  } catch (error) {
    console.error('GET /api/admin/reports/replies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
