import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { ImapFlow } from 'imapflow';

export const dynamic = 'force-dynamic';

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

// GET: Fetch emails from support inbox
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const msgId = searchParams.get('uid');

    const client = new ImapFlow({
      host: process.env.SUPPORT_EMAIL_HOST || 'imap.secureserver.net',
      port: parseInt(process.env.SUPPORT_EMAIL_PORT || '993'),
      secure: true,
      auth: {
        user: process.env.SUPPORT_EMAIL_USER || '',
        pass: process.env.SUPPORT_EMAIL_PASS || '',
      },
      logger: false,
    });

    await client.connect();

    const lock = await client.getMailboxLock('INBOX');
    try {
      if (msgId) {
        // Fetch single email full body
        const msg = await client.fetchOne(msgId, { source: true, envelope: true, uid: true }, { uid: true });
        const { simpleParser } = await import('mailparser');
        const parsed = await simpleParser(msg.source);
        await client.logout();
        return NextResponse.json({
          uid: msg.uid,
          from: parsed.from?.text || '',
          subject: parsed.subject || '(no subject)',
          date: parsed.date?.toISOString() || '',
          body: parsed.text || parsed.html || '',
          html: parsed.html || '',
        });
      }

      // Fetch last 50 emails (headers only)
      const messages: any[] = [];
      const status = await client.status('INBOX', { messages: true });
      const total = status.messages || 0;
      const startSeq = Math.max(1, total - 49);

      for await (const msg of client.fetch(`${startSeq}:*`, { envelope: true, uid: true, flags: true })) {
        messages.push({
          uid: msg.uid,
          from: msg.envelope.from?.[0]?.address || '',
          fromName: msg.envelope.from?.[0]?.name || '',
          subject: msg.envelope.subject || '(no subject)',
          date: msg.envelope.date?.toISOString() || '',
          seen: msg.flags.has('\\Seen'),
        });
      }

      // Reverse so newest first
      messages.reverse();
      await client.logout();
      return NextResponse.json({ emails: messages });
    } finally {
      lock.release();
    }
  } catch (err: any) {
    console.error('Support emails error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch emails' }, { status: 500 });
  }
}

// POST: Send reply
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { to, subject, body, inReplyTo } = await req.json();
    if (!to || !body) return NextResponse.json({ error: 'to and body required' }, { status: 400 });

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

    const signature = '\n\n--\nAdvoverse Support\nsupport@advoverse.com\nwww.advoverse.com';
    const fullBody = body + signature;

    const mailOptions: any = {
      from: '"Advoverse Support" <support@advoverse.com>',
      to,
      subject: subject.startsWith('Re:') ? subject : 'Re: ' + subject,
      text: fullBody,
    };
    if (inReplyTo) {
      mailOptions.inReplyTo = inReplyTo;
      mailOptions.references = inReplyTo;
    }

    await transporter.sendMail(mailOptions);

    // Store reply in Supabase for audit
    const supabase = createAdminClient();
    await supabase.from('support_replies').insert({
      to_email: to,
      subject: mailOptions.subject,
      body: fullBody,
      sent_by: user.email,
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Support reply error:', err);
    return NextResponse.json({ error: err.message || 'Failed to send reply' }, { status: 500 });
  }
}