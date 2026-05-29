import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { jsPDF } from 'jspdf';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.slice(7));
    if (authErr || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const invoiceId = parseInt(params.id);
    if (isNaN(invoiceId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const { data: inv } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    // Security: allow owner OR admin
    if (inv.user_id !== user.id && inv.user_email !== user.email) {
      // Check if user is admin
      const { data: adminUser } = await supabase.from('admin_users').select('id').eq('email', user.email).single();
      if (!adminUser) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Generate PDF
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const w = 210;
    const margin = 20;
    const cw = w - margin * 2; // content width
    let y = 20;

    const navy: [number,number,number] = [26, 58, 92];
    const gray: [number,number,number] = [102, 102, 102];
    const black: [number,number,number] = [51, 51, 51];
    const green: [number,number,number] = [22, 163, 74];

    // Helper
    const drawBox = (x: number, yy: number, bw: number, bh: number) => {
      doc.setDrawColor(232, 238, 243);
      doc.setFillColor(248, 250, 251);
      doc.roundedRect(x, yy, bw, bh, 2, 2, 'FD');
    };

    // ── HEADER ──
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('ADVOVERSE', margin, y + 7);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('Empowering Advocates', margin, y + 12);

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('INVOICE', w - margin, y + 7, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('Payment Receipt', w - margin, y + 12, { align: 'right' });

    y += 18;
    doc.setDrawColor(...navy);
    doc.setLineWidth(0.5);
    doc.line(margin, y, w - margin, y);
    y += 10;

    // ── INVOICE DETAILS + BILLED TO ──
    const boxH = 38;
    const halfW = (cw - 6) / 2;

    // Left box: Invoice Details
    drawBox(margin, y, halfW, boxH);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('INVOICE DETAILS', margin + 5, y + 7);
    doc.setDrawColor(224, 232, 239);
    doc.line(margin + 5, y + 9, margin + halfW - 5, y + 9);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    const payDate = new Date(inv.payment_date || inv.created_at);
    const details = [
      ['Invoice No.', inv.invoice_number],
      ['Date', payDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
      ['Time', payDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' IST'],
      ['Payment ID', inv.payment_id || 'N/A'],
    ];
    details.forEach((d, i) => {
      doc.setTextColor(...gray);
      doc.text(d[0], margin + 5, y + 15 + i * 6);
      doc.setTextColor(...black);
      doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
      doc.text(d[1], margin + 32, y + 15 + i * 6);
      doc.setFont('helvetica', 'normal');
    });

    // Right box: Billed To
    const rx = margin + halfW + 6;
    drawBox(rx, y, halfW, boxH);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('BILLED TO', rx + 5, y + 7);
    doc.setDrawColor(224, 232, 239);
    doc.line(rx + 5, y + 9, rx + halfW - 5, y + 9);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('Name', rx + 5, y + 15);
    doc.setTextColor(...black);
    doc.setFont('helvetica', 'bold');
    doc.text(inv.user_name || 'Customer', rx + 22, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('Email', rx + 5, y + 21);
    doc.setTextColor(...black);
    doc.text(inv.user_email, rx + 22, y + 21);

    y += boxH + 8;

    // ── SUPPLIER ──
    drawBox(margin, y, cw, 30);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('SUPPLIER', margin + 5, y + 7);
    doc.setDrawColor(224, 232, 239);
    doc.line(margin + 5, y + 9, margin + cw - 5, y + 9);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text('Advoverse', margin + 5, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('Dehradun', margin + 5, y + 20);
    doc.text('support@advoverse.com  |  www.advoverse.com', margin + 5, y + 25);

    y += 34;

    // ── GST NOTE ──
    doc.setFillColor(255, 248, 230);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(margin, y, cw, 8, 1, 1, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14);
    doc.text('GST not charged - Supplier not registered under GST.', w / 2, y + 5, { align: 'center' });
    y += 14;

    // ── SERVICE DETAILS ──
    drawBox(margin, y, cw, 22);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('SERVICE DETAILS', margin + 5, y + 7);
    doc.setDrawColor(224, 232, 239);
    doc.line(margin + 5, y + 9, margin + cw - 5, y + 9);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text(inv.plan_name, margin + 5, y + 15);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    const durLabel = inv.duration === 'yearly' ? '365 days' : inv.duration === 'quarterly' ? '90 days' : '30 days';
    doc.text(`${inv.duration.charAt(0).toUpperCase() + inv.duration.slice(1)} Subscription (${durLabel})`, margin + 5, y + 19);

    // Service period on right
    if (inv.service_start && inv.service_end) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...black);
      doc.text('Service Period', w - margin - 5, y + 13, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gray);
      const sStart = new Date(inv.service_start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const sEnd = new Date(inv.service_end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      doc.text(`${sStart}  to  ${sEnd}`, w - margin - 5, y + 19, { align: 'right' });
    }

    y += 28;

    // ── AMOUNT TABLE ──
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('DESCRIPTION', margin, y + 4);
    doc.text('AMOUNT (Rs.)', w - margin, y + 4, { align: 'right' });
    y += 6;
    doc.setDrawColor(...navy);
    doc.setLineWidth(0.4);
    doc.line(margin, y, w - margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...black);

    // Base price
    doc.text(`Base Price (${inv.duration.charAt(0).toUpperCase() + inv.duration.slice(1)} Subscription)`, margin, y + 4);
    doc.text(`Rs.${inv.base_amount}`, w - margin, y + 4, { align: 'right' });
    y += 8;
    doc.setDrawColor(238, 238, 238);
    doc.setLineWidth(0.2);
    doc.line(margin, y, w - margin, y);
    y += 6;

    // Discount (only if applied)
    if (inv.discount_amount > 0) {
      doc.setTextColor(...green);
      const discLabel = inv.referral_code ? `Promotional Discount (Code: ${inv.referral_code})` : 'Promotional Discount';
      doc.text(discLabel, margin, y + 4);
      doc.text(`-Rs.${inv.discount_amount}`, w - margin, y + 4, { align: 'right' });
      y += 8;
      doc.setDrawColor(238, 238, 238);
      doc.line(margin, y, w - margin, y);
      y += 6;
      doc.setTextColor(...black);
    }

    // Gateway fee
    if (inv.gateway_fee > 0) {
      doc.text('Payment Processing Fee (2.5%)', margin, y + 4);
      doc.text(`Rs.${inv.gateway_fee}`, w - margin, y + 4, { align: 'right' });
      y += 8;
      doc.setDrawColor(238, 238, 238);
      doc.line(margin, y, w - margin, y);
      y += 6;
    }

    // Total
    doc.setDrawColor(...navy);
    doc.setLineWidth(0.4);
    doc.line(margin, y, w - margin, y);
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...navy);
    doc.text('TOTAL PAID', margin, y + 4);
    doc.text(`Rs.${inv.total_amount}`, w - margin, y + 4, { align: 'right' });
    y += 16;

    // ── TERMS ──
    doc.setDrawColor(224, 232, 239);
    doc.setLineWidth(0.2);
    doc.line(margin, y, w - margin, y);
    y += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('TERMS & NOTES', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.setFontSize(8);
    const terms = [
      'This is a digital service subscription. No physical product will be shipped.',
      'Refunds are subject to our Terms of Service and Refund Policy.',
      'For any support, contact us at support@advoverse.com',
      'By using our services, you agree to our Terms of Service.',
    ];
    terms.forEach(t => { doc.text('- ' + t, margin, y); y += 5; });

    y += 8;
    // Thank you box
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, y, cw, 16, 2, 2, 'FD');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text('Thank you for choosing Advoverse!', w / 2, y + 7, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('We appreciate your trust in us.', w / 2, y + 12, { align: 'center' });

    // Output
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${inv.invoice_number}.pdf"`,
      },
    });
  } catch (err) {
    console.error('Invoice PDF error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}