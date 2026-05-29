import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { jsPDF } from 'jspdf';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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

async function fetchAllData(supabase: any) {
  const tables = [
    'caseline_users', 'caseline_subscriptions', 'caseline_machines',
    'orders', 'licenses', 'invoices', 'referral_codes',
    'referral_code_uses', 'flagged_users', 'deleted_accounts',
    'admin_users', 'support_replies'
  ];

  const data: Record<string, any[]> = {};
  for (const table of tables) {
    try {
      const { data: rows } = await supabase.from(table).select('*').order('id', { ascending: true }).limit(1000);
      // Strip password_hash from caseline_users
      if (table === 'caseline_users' && rows) {
        data[table] = rows.map((r: any) => { const { password_hash, ...rest } = r; return rest; });
      } else {
        data[table] = rows || [];
      }
    } catch { data[table] = []; }
  }
  return data;
}

// GET: Download backup (JSON or PDF)
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';
    const supabase = createAdminClient();
    const data = await fetchAllData(supabase);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    if (format === 'json') {
      const json = JSON.stringify({ exported_at: now.toISOString(), ...data }, null, 2);
      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="advoverse_backup_${dateStr}.json"`,
        },
      });
    }

    // PDF format
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    const w = 297;
    const h = 210;
    const margin = 15;
    let y = 20;

    const navy: [number,number,number] = [26, 58, 92];
    const gray: [number,number,number] = [102, 102, 102];
    const black: [number,number,number] = [33, 33, 33];

    // Page 1: Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('Advoverse Data Backup', margin, y);
    y += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(`Exported: ${now.toLocaleString('en-IN')}`, margin, y);
    y += 12;

    doc.setFontSize(12);
    doc.setTextColor(...black);
    const stats = [
      `Users: ${data.caseline_users?.length || 0}`,
      `Subscriptions: ${data.caseline_subscriptions?.length || 0}`,
      `Orders: ${data.orders?.length || 0}`,
      `Invoices: ${data.invoices?.length || 0}`,
      `Licenses: ${data.licenses?.length || 0}`,
      `Machines: ${data.caseline_machines?.length || 0}`,
      `Referral Codes: ${data.referral_codes?.length || 0}`,
    ];
    stats.forEach(s => { doc.text(s, margin, y); y += 6; });

    // Helper: draw table
    function drawTable(title: string, rows: any[], columns: { key: string; label: string; width: number }[]) {
      doc.addPage();
      let ty = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...navy);
      doc.text(title, margin, ty);
      ty += 8;

      // Header row
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...navy);
      let tx = margin;
      columns.forEach(col => { doc.text(col.label, tx, ty); tx += col.width; });
      ty += 2;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, ty, w - margin, ty);
      ty += 4;

      // Data rows
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...black);
      doc.setFontSize(7);
      const maxRows = Math.min(rows.length, 200);
      for (let i = 0; i < maxRows; i++) {
        if (ty > h - 15) { doc.addPage(); ty = 20; }
        tx = margin;
        columns.forEach(col => {
          const val = String(rows[i][col.key] ?? '-').substring(0, 40);
          doc.text(val, tx, ty);
          tx += col.width;
        });
        ty += 4;
      }
      if (rows.length > 200) {
        ty += 4;
        doc.setTextColor(...gray);
        doc.text(`... and ${rows.length - 200} more rows (see JSON for full data)`, margin, ty);
      }
    }

    // Tables
    drawTable('Caseline Users', data.caseline_users || [], [
      { key: 'id', label: 'ID', width: 10 },
      { key: 'email', label: 'Email', width: 60 },
      { key: 'name', label: 'Name', width: 50 },
      { key: 'status', label: 'Status', width: 20 },
      { key: 'created_at', label: 'Created', width: 45 },
    ]);

    drawTable('Subscriptions', data.caseline_subscriptions || [], [
      { key: 'id', label: 'ID', width: 10 },
      { key: 'user_id', label: 'User ID', width: 15 },
      { key: 'package_label', label: 'Plan', width: 40 },
      { key: 'status', label: 'Status', width: 20 },
      { key: 'expires_at', label: 'Expires', width: 45 },
      { key: 'created_at', label: 'Created', width: 45 },
    ]);

    drawTable('Orders', data.orders || [], [
      { key: 'id', label: 'ID', width: 10 },
      { key: 'plan_name', label: 'Plan', width: 40 },
      { key: 'amount', label: 'Amount', width: 20 },
      { key: 'status', label: 'Status', width: 20 },
      { key: 'created_at', label: 'Date', width: 45 },
    ]);

    drawTable('Invoices', data.invoices || [], [
      { key: 'invoice_number', label: 'Invoice No.', width: 45 },
      { key: 'user_email', label: 'Email', width: 55 },
      { key: 'plan_name', label: 'Plan', width: 35 },
      { key: 'total_amount', label: 'Amount', width: 20 },
      { key: 'payment_date', label: 'Date', width: 40 },
    ]);

    drawTable('Licenses', data.licenses || [], [
      { key: 'license_key', label: 'Key', width: 50 },
      { key: 'plan_name', label: 'Plan', width: 40 },
      { key: 'is_active', label: 'Active', width: 15 },
      { key: 'expires_at', label: 'Expires', width: 45 },
    ]);

    drawTable('Machines', data.caseline_machines || [], [
      { key: 'user_id', label: 'User ID', width: 15 },
      { key: 'machine_id', label: 'Machine ID', width: 60 },
      { key: 'machine_name', label: 'Name', width: 40 },
      { key: 'last_active_at', label: 'Last Active', width: 45 },
    ]);

    drawTable('Referral Codes', data.referral_codes || [], [
      { key: 'code', label: 'Code', width: 40 },
      { key: 'discount_type', label: 'Type', width: 20 },
      { key: 'discount_value', label: 'Value', width: 15 },
      { key: 'used_count', label: 'Used', width: 15 },
      { key: 'expires_at', label: 'Expires', width: 40 },
    ]);

    drawTable('Flagged Users', data.flagged_users || [], [
      { key: 'current_email', label: 'Email', width: 55 },
      { key: 'machine_id', label: 'Machine ID', width: 50 },
      { key: 'flagged_at', label: 'Date', width: 40 },
      { key: 'status', label: 'Status', width: 20 },
    ]);

    drawTable('Deleted Accounts', data.deleted_accounts || [], [
      { key: 'email', label: 'Email', width: 55 },
      { key: 'name', label: 'Name', width: 40 },
      { key: 'deleted_at', label: 'Date', width: 40 },
      { key: 'reason', label: 'Reason', width: 40 },
    ]);

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="advoverse_backup_${dateStr}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('Backup error:', err);
    return NextResponse.json({ error: err.message || 'Backup failed' }, { status: 500 });
  }
}

// POST: Restore from JSON
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const backup = await req.json();
    if (!backup.exported_at) return NextResponse.json({ error: 'Invalid backup file' }, { status: 400 });

    const supabase = createAdminClient();
    const results: Record<string, number> = {};

    const tables = [
      'caseline_users', 'caseline_subscriptions', 'caseline_machines',
      'orders', 'licenses', 'invoices', 'referral_codes',
      'referral_code_uses', 'flagged_users', 'deleted_accounts',
      'admin_users', 'support_replies'
    ];

    for (const table of tables) {
      const rows = backup[table];
      if (!rows || !Array.isArray(rows) || rows.length === 0) continue;

      let inserted = 0;
      for (const row of rows) {
        // Try to insert, skip if already exists (conflict on id)
        const { error } = await supabase.from(table).upsert(row, { onConflict: 'id', ignoreDuplicates: true });
        if (!error) inserted++;
      }
      results[table] = inserted;
    }

    return NextResponse.json({ success: true, restored: results });
  } catch (err: any) {
    console.error('Restore error:', err);
    return NextResponse.json({ error: err.message || 'Restore failed' }, { status: 500 });
  }
}