import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email?.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid email required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const normalizedEmail = email.toLowerCase().trim();

    // Check Supabase Auth (covers Google OAuth users)
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const authUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === normalizedEmail);

    if (!authUser) {
      return NextResponse.json({ success: true, message: 'If this email is registered, a link has been sent.' });
    }

    // Check if user exists in custom users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', normalizedEmail)
      .single();

    let userId: number;
    let userName: string;

    if (!existingUser) {
      // Google OAuth user - create Caseline account with placeholder
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: normalizedEmail,
          password_hash: 'GOOGLE_OAUTH_SET_VIA_RESET',
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || normalizedEmail.split('@')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, name')
        .single();

      if (createError) {
        console.error('Failed to create Caseline user:', createError);
        return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
      }
      userId = newUser.id;
      userName = newUser.name;
    } else {
      userId = existingUser.id;
      userName = existingUser.name || normalizedEmail.split('@')[0];
    }

    // Generate token (1 hour expiry)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await supabase.from('password_reset_tokens').delete().eq('user_id', userId);
    const { error: tokenError } = await supabase.from('password_reset_tokens').insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    });

    if (tokenError) {
      console.error('Token error:', tokenError);
      return NextResponse.json({ success: false, error: 'Failed to generate link' }, { status: 500 });
    }

    const resetUrl = 'https://www.advoverse.com/reset-password?token=' + token + '&email=' + encodeURIComponent(normalizedEmail);
    const isFirstTime = !existingUser;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Advoverse <support@advoverse.in>',
      to: normalizedEmail,
      subject: isFirstTime ? 'Set Your Caseline Password' : 'Reset Your Caseline Password',
      html: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">'
        + '<div style="background:#1E3A5F;color:white;padding:20px;border-radius:8px 8px 0 0;text-align:center;">'
        + '<h1 style="margin:0;font-size:22px;">Caseline by Advoverse</h1></div>'
        + '<div style="background:#f9f9f9;padding:28px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;">'
        + '<h2 style="color:#1E3A5F;">Hi ' + userName + ',</h2>'
        + (isFirstTime
          ? '<p style="color:#555;">You registered on Advoverse with Google. To login to Caseline desktop app, you need to set a separate Caseline password.</p>'
          : '<p style="color:#555;">Click below to reset your Caseline password. Link expires in 1 hour.</p>')
        + '<div style="text-align:center;margin:24px 0;">'
        + '<a href="' + resetUrl + '" style="display:inline-block;padding:14px 32px;background:#1E3A5F;color:white;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;">'
        + (isFirstTime ? 'Set My Caseline Password' : 'Reset My Password')
        + '</a></div>'
        + '<div style="background:#e8f5e9;border-left:4px solid #28a745;padding:10px 14px;border-radius:4px;font-size:13px;color:#1b5e20;">'
        + 'After setting: login to Caseline with <strong>' + normalizedEmail + '</strong> and your new password.'
        + '</div>'
        + '<p style="color:#888;font-size:12px;margin-top:16px;">Link expires in 1 hour. Copy: <span style="color:#1E3A5F;word-break:break-all;">' + resetUrl + '</span></p>'
        + '<hr style="border:none;border-top:1px solid #eee;margin:20px 0;">'
        + '<p style="color:#999;font-size:11px;text-align:center;">Advoverse | advoverse.com</p>'
        + '</div></div>'
    });

    if (emailError) {
      console.error('Email error:', emailError);
      return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'A link has been sent to set your Caseline password.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}
