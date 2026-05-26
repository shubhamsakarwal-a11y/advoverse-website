import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

// Caseline-Auth Supabase (has custom users + password_reset_tokens tables)
function getCaselineSupabase() {
  return createClient(
    process.env.CASELINE_SUPABASE_URL!,
    process.env.CASELINE_SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const normalizedEmail = '';
  try {
    const body = await req.json();
    const email = body?.email || '';

    if (!email?.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid email required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Step 1: Verify user exists in advoverse Supabase Auth ──
    // This confirms they registered on advoverse.com
    const advoverseSupabase = createAdminClient();
    let authUserFound = false;
    let authUserName = normalizedEmail.split('@')[0];

    try {
      const { data: authData } = await advoverseSupabase.auth.admin.getUserByEmail(normalizedEmail);
      if (authData?.user) {
        authUserFound = true;
        authUserName = authData.user.user_metadata?.full_name
          || authData.user.user_metadata?.name
          || authUserName;
      }
    } catch (authErr: any) {
      console.log('Auth lookup error (non-fatal):', authErr?.message);
      // Continue anyway - user might be in Caseline Supabase already
    }

    // ── Step 2: Find or create in Caseline users table ──
    const caselineDB = getCaselineSupabase();

    const { data: existingUser } = await caselineDB
      .from('users')
      .select('id, name, email')
      .eq('email', normalizedEmail)
      .single();

    // If not in advoverse auth AND not in Caseline → user not registered
    if (!authUserFound && !existingUser) {
      console.log('User not found anywhere:', normalizedEmail);
      // Return success silently (security - don't reveal if email exists)
      return NextResponse.json({ success: true, message: 'If this email is registered, a link has been sent.' });
    }

    let userId: number;
    let userName: string;
    const isFirstTime = !existingUser;

    if (!existingUser) {
      // Create Caseline account for this Google OAuth user
      const { data: newUser, error: createError } = await caselineDB
        .from('users')
        .insert({
          email: normalizedEmail,
          password_hash: 'GOOGLE_OAUTH_SET_VIA_RESET',
          name: authUserName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, name')
        .single();

      if (createError) {
        console.error('Create user error:', createError.message);
        return NextResponse.json({ success: false, error: 'DB error: ' + createError.message }, { status: 500 });
      }
      userId = newUser.id;
      userName = newUser.name;
    } else {
      userId = existingUser.id;
      userName = existingUser.name || authUserName;
    }

    // ── Step 3: Generate reset token ──
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await caselineDB.from('password_reset_tokens').delete().eq('user_id', userId);
    const { error: tokenError } = await caselineDB.from('password_reset_tokens').insert({
      user_id: userId, token,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    });

    if (tokenError) {
      console.error('Token error:', tokenError.message);
      return NextResponse.json({ success: false, error: 'Token error: ' + tokenError.message }, { status: 500 });
    }

    // ── Step 4: Send email ──
    const resetUrl = 'https://www.advoverse.com/reset-password?token=' + token + '&email=' + encodeURIComponent(normalizedEmail);
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Advoverse <support@advoverse.in>',
      to: normalizedEmail,
      subject: isFirstTime ? 'Set Your Caseline Password' : 'Reset Your Caseline Password',
      html: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">'
        + '<div style="background:#1E3A5F;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">'
        + '<h1 style="margin:0;font-size:20px;">Caseline by Advoverse</h1></div>'
        + '<div style="padding:28px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;">'
        + '<h2 style="color:#1E3A5F;">Hi ' + userName + ',</h2>'
        + (isFirstTime
          ? '<p style="color:#555;">You signed up on Advoverse with Google. To use Caseline desktop app, set a password below:</p>'
          : '<p style="color:#555;">Click below to reset your Caseline password (expires in 1 hour):</p>')
        + '<div style="text-align:center;margin:28px 0;">'
        + '<a href="' + resetUrl + '" style="background:#1E3A5F;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;">'
        + (isFirstTime ? 'Set My Caseline Password' : 'Reset My Password')
        + '</a></div>'
        + '<div style="background:#e8f5e9;padding:12px;border-radius:6px;font-size:13px;color:#1b5e20;">'
        + 'After setting your password, login to Caseline with: <strong>' + normalizedEmail + '</strong>'
        + '</div>'
        + '<p style="color:#aaa;font-size:11px;margin-top:16px;">Or copy this link: ' + resetUrl + '</p>'
        + '</div></div>'
    });

    if (emailError) {
      console.error('Resend error:', JSON.stringify(emailError));
      return NextResponse.json({ success: false, error: 'Email error: ' + (emailError.message || JSON.stringify(emailError)) }, { status: 500 });
    }

    console.log('Email sent to:', normalizedEmail, 'id:', emailData?.id);
    return NextResponse.json({ success: true, message: 'Password link sent to your email.' });

  } catch (err: any) {
    console.error('Unexpected error:', err?.message, err?.stack?.substring(0, 200));
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}
