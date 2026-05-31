/**
 * Admin Reports API Route
 * GET  — Fetch all reports with reply counts
 * PATCH — Update status/priority/admin_notes
 * POST — Admin sends a reply to a report
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// ── Auth helper ──────────────────────────────────────────────────────────────
async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const supabase = createAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.slice(7));
  if (error || !user) return null;

  const { data: adminUser } = await supabase.from('admin_users').select('id, email').eq('email', user.email).single();
  if (!adminUser) return null;

  return { ...adminUser, supabase };
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/reports — Fetch all reports with reply counts
// ══════════════════════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { supabase } = admin;


    // Check if requesting replies for a specific report
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('reportId');

    if (reportId) {
      const { data: replies, error: repliesErr } = await supabase
        .from('caseline_report_replies')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (repliesErr) {
        return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
      }

      // Mark user replies as read (admin is viewing)
      const unread = (replies || []).filter((r: any) => r.sender_type === 'user' && !r.read_at).map((r: any) => r.id);
      if (unread.length > 0) {
        await supabase.from('caseline_report_replies').update({ read_at: new Date().toISOString() }).in('id', unread);
      }

      return NextResponse.json({ success: true, data: replies || [] });
    }

    // Fetch all reports
    const { data: reports, error: reportsErr } = await supabase
      .from('caseline_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (reportsErr) {
      console.error('Fetch reports error:', reportsErr);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    // Fetch reply counts per report
    const reportIds = (reports || []).map(r => r.id);
    let replyCounts: Record<string, number> = {};
    let unreadCounts: Record<string, number> = {};

    if (reportIds.length > 0) {
      const { data: replies } = await supabase
        .from('caseline_report_replies')
        .select('report_id, sender_type, read_at')
        .in('report_id', reportIds);

      if (replies) {
        replies.forEach(r => {
          replyCounts[r.report_id] = (replyCounts[r.report_id] || 0) + 1;
          if (r.sender_type === 'user' && !r.read_at) {
            unreadCounts[r.report_id] = (unreadCounts[r.report_id] || 0) + 1;
          }
        });
      }
    }

    // Enrich reports with counts
    const enrichedReports = (reports || []).map(r => ({
      ...r,
      reply_count: replyCounts[r.id] || 0,
      unread_count: unreadCounts[r.id] || 0,
    }));

    return NextResponse.json({ success: true, data: enrichedReports });
  } catch (error) {
    console.error('GET /api/admin/reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/admin/reports — Update report status/priority/notes
// ══════════════════════════════════════════════════════════════════════════════
export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { supabase } = admin;
    const body = await req.json();
    const { reportId, status, priority, admin_notes } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    if (status === 'Closed' || status === 'Dismissed') updateData.closed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('caseline_reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      console.error('Update report error:', error);
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('PATCH /api/admin/reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/admin/reports — Admin sends a reply
// ══════════════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { supabase } = admin;
    const body = await req.json();
    const { reportId, message, newStatus } = body;

    if (!reportId || !message?.trim()) {
      return NextResponse.json({ error: 'reportId and message are required' }, { status: 400 });
    }

    // Insert reply
    const { data: reply, error: replyErr } = await supabase
      .from('caseline_report_replies')
      .insert({
        report_id: reportId,
        sender_type: 'admin',
        sender_email: admin.email,
        sender_name: 'Admin',
        body: message.trim().substring(0, 5000),
      })
      .select()
      .single();

    if (replyErr) {
      console.error('Insert reply error:', replyErr);
      return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
    }

    // Update report status (default to "Query" when admin replies)
    const statusToSet = newStatus || 'Query';
    await supabase
      .from('caseline_reports')
      .update({ status: statusToSet, updated_at: new Date().toISOString() })
      .eq('id', reportId);

    return NextResponse.json({ success: true, data: reply });
  } catch (error) {
    console.error('POST /api/admin/reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/admin/reports — Delete a report and its replies
// ══════════════════════════════════════════════════════════════════════════════
export async function DELETE(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { supabase } = admin;
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
    }

    // Delete replies first (cascade should handle this, but be explicit)
    await supabase.from('caseline_report_replies').delete().eq('report_id', reportId);
    
    // Delete the report
    const { error } = await supabase.from('caseline_reports').delete().eq('id', reportId);

    if (error) {
      console.error('Delete report error:', error);
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { message: 'Report deleted' } });
  } catch (error) {
    console.error('DELETE /api/admin/reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
