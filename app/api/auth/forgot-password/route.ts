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

    const normalizedEmail = email.toLowerCase().trim();
    const db = getCaselineSupabase();

    // Look up user in Caseline users table
    const { data: existingUser, error: lookupError } = await db
      .from('caseline_users')
      .select('id, name, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ success: false, error: 'DB error: ' + lookupError.message }, { status: 500 });
    }

    let userId: number;
    let userName: string;
    const isFirstTime = !existingUser;

    if (!existingUser) {
      // Create a Caseline account for this user
      const displayName = normalizedEmail.split('@')[0];
      const { data: newUser, error: createError } = await db
        .from('caseline_users')
        .insert({
          email: normalizedEmail,
          password_hash: 'NOT_SET_USE_RESET_LINK',
          name: displayName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, name')
        .single();

      if (createError) {
        return NextResponse.json({ success: false, error: 'Create error: ' + createError.message }, { status: 500 });
      }
      userId = newUser.id;
      userName = newUser.name;
    } else {
      userId = existingUser.id;
      userName = existingUser.name || normalizedEmail.split('@')[0];
    }

    // Generate reset token (1 hour)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.from('caseline_password_reset_tokens').delete().eq('user_id', userId);
    const { error: tokenError } = await db.from('caseline_password_reset_tokens').insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    });

    if (tokenError) {
      return NextResponse.json({ success: false, error: 'Token error: ' + tokenError.message }, { status: 500 });
    }

    // Send email via Resend
    const resetUrl = 'https://www.advoverse.com/reset-password?token=' + token + '&email=' + encodeURIComponent(normalizedEmail);
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error: emailError } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: normalizedEmail,
      subject: isFirstTime ? 'Set Your Caseline Password' : 'Reset Your Caseline Password',
      html: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">'
        + '<div style="background:#1E3A5F;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">'
        + '<h1 style="margin:0;">Caseline by Advoverse</h1></div>'
        + '<div style="padding:28px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;">'
        + '<h2 style="color:#1E3A5F;">Hi ' + userName + ',</h2>'
        + (isFirstTime
          ? '<p style="color:#555;">Click below to set your Caseline desktop app password:</p>'
          : '<p style="color:#555;">Click below to reset your Caseline password (expires in 1 hour):</p>')
        + '<div style="text-align:center;margin:28px 0;">'
        + '<a href="' + resetUrl + '" style="background:#1E3A5F;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;">'
        + (isFirstTime ? 'Set My Caseline Password' : 'Reset My Password')
        + '</a></div>'
        + '<p style="color:#555;font-size:13px;">After setting your password, login to Caseline with:<br><strong>' + normalizedEmail + '</strong></p>'
        + '<p style="color:#aaa;font-size:11px;margin-top:16px;word-break:break-all;">' + resetUrl + '</p>'
        + '</div></div>'
    });

    if (emailError) {
      return NextResponse.json({ success: false, error: 'Email error: ' + JSON.stringify(emailError) }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password link sent to your email.' });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
