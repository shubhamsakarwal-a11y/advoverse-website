import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

function getCaselineSupabase() {
  return createClient(
    process.env.CASELINE_SUPABASE_URL!,
    process.env.CASELINE_SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email?.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid email required' }, { status: 400 });
    }

    const supabase = getCaselineSupabase();
    const normalizedEmail = email.toLowerCase().trim();

    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', normalizedEmail)
      .single();

    if (!user) {
      return NextResponse.json({ success: true, message: 'If this email is registered, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await supabase.from('password_reset_tokens').delete().eq('user_id', user.id);
    await supabase.from('password_reset_tokens').insert({
      user_id: user.id, token,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    });

    const resetUrl = 'https://www.advoverse.com/reset-password?token=' + token + '&email=' + encodeURIComponent(normalizedEmail);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Advoverse <support@advoverse.in>',
      to: normalizedEmail,
      subject: 'Reset Your Caseline Password',
      html: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">'
        + '<div style="background:#1E3A5F;color:white;padding:20px;border-radius:8px 8px 0 0;text-align:center;">'
        + '<h1 style="margin:0;font-size:22px;">Caseline by Advoverse</h1></div>'
        + '<div style="background:#f9f9f9;padding:28px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;">'
        + '<h2 style="color:#1E3A5F;">Hi ' + (user.name || normalizedEmail) + ',</h2>'
        + '<p style="color:#555;">Click below to reset your Caseline password. Link expires in 1 hour.</p>'
        + '<div style="text-align:center;margin:24px 0;">'
        + '<a href="' + resetUrl + '" style="display:inline-block;padding:14px 32px;background:#1E3A5F;color:white;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;">Reset My Password</a>'
        + '</div>'
        + '<p style="color:#888;font-size:12px;margin-top:16px;">Or copy this link: <span style="color:#1E3A5F;word-break:break-all;">' + resetUrl + '</span></p>'
        + '<hr style="border:none;border-top:1px solid #eee;margin:20px 0;">'
        + '<p style="color:#999;font-size:11px;text-align:center;">Advoverse | advoverse.com</p>'
        + '</div></div>'
    });

    if (emailError) {
      console.error('Email error:', emailError);
      return NextResponse.json({ success: false, error: 'Failed to send email: ' + JSON.stringify(emailError) }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'If this email is registered, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}
