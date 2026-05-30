import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { data: admin } = await supabase.from('admin_users').select('id').eq('email', user.email).single();
    if (!admin) return NextResponse.json({ error: 'Not an admin' }, { status: 403 });

    const { pin } = await req.json();
    const correctPin = process.env.ADMIN_PIN;

    if (!correctPin || pin !== correctPin) {
      // Log failed attempt
      await supabase.from('admin_audit_log').insert({
        action: 'PIN_FAILED',
        admin_email: user.email,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        details: 'Failed PIN attempt',
      });
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 403 });
    }

    // Log successful access
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    await supabase.from('admin_audit_log').insert({
      action: 'ADMIN_LOGIN',
      admin_email: user.email,
      ip_address: ip,
      details: 'Successful PIN verification',
    });

    // Send email alert (non-blocking)
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SUPPORT_SMTP_HOST || 'smtpout.secureserver.net',
        port: parseInt(process.env.SUPPORT_SMTP_PORT || '465'),
        secure: true,
        auth: {
          user: process.env.SUPPORT_EMAIL_USER || '',
          pass: process.env.SUPPORT_EMAIL_PASS || '',
        },
      });
      await transporter.sendMail({
        from: '"Advoverse Security" <support@advoverse.com>',
        to: 'shubham.sakarwal@gmail.com',
        subject: 'Admin Panel Accessed',
        text: `Admin panel accessed.\n\nEmail: ${user.email}\nTime: ${new Date().toLocaleString('en-IN')}\nIP: ${ip}\n\nIf this was not you, change your ADMIN_PIN immediately in Vercel environment variables.`,
      });
    } catch (emailErr) {
      console.error('Admin alert email failed (non-fatal):', emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}