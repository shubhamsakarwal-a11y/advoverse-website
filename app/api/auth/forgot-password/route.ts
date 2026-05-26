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

    // Step 1: Check if user exists in Supabase Auth using getUserByEmail
    const { data: authData, error: authError } = await supabase.auth.admin.getUserByEmail(normalizedEmail);

    // Log for debugging
    console.log('Auth lookup for:', normalizedEmail);
    console.log('Auth result:', authData ? 'found' : 'not found', authError?.message || '');

    if (authError || !authData?.user) {
      // User not in auth - silently succeed (security)
      return NextResponse.json({ success: true, message: 'If this email is registered, a link has been sent.' });
    }

    const authUser = authData.user;

    // Step 2: Find or create in custom users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', normalizedEmail)
      .single();

    let userId: number;
    let userName: string;
    const isFirstTime = !existingUser;

    if (!existingUser) {
      // Create Caseline account for Google OAuth user
      const displayName = authUser.user_metadata?.full_name
        || authUser.user_metadata?.name
        || normalizedEmail.split('@')[0];

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: normalizedEmail,
          password_hash: 'GOOGLE_OAUTH_SET_VIA_RESET',
          name: displayName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, name')
        .single();

      if (createError) {
        console.error('Create user error:', createError.message);
        return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
      }
      userId = newUser.id;
      userName = newUser.name;
      console.log('Created Caseline user, id:', userId);
    } else {
      userId = existingUser.id;
      userName = existingUser.name || normalizedEmail.split('@')[0];
      console.log('Found existing user, id:', userId);
    }

    // Step 3: Generate token
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
      console.error('Token insert error:', tokenError.message);
      return NextResponse.json({ success: false, error: 'Failed to generate reset link' }, { status: 500 });
    }

    // Step 4: Send email
    const resetUrl = 'https://www.advoverse.com/reset-password?token=' + token + '&email=' + encodeURIComponent(normalizedEmail);
    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log('Sending email to:', normalizedEmail, 'isFirstTime:', isFirstTime);

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Advoverse <support@advoverse.in>',
      to: normalizedEmail,
      subject: isFirstTime ? 'Set Your Caseline Password' : 'Reset Your Caseline Password',
      html: '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;">'
        + '<div style="background:#1E3A5F;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">'
        + '<h1 style="margin:0;font-size:20px;">Caseline by Advoverse</h1></div>'
        + '<div style="padding:28px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;">'
        + '<h2 style="color:#1E3A5F;">Hi ' + userName + ',</h2>'
        + (isFirstTime
          ? '<p>You signed up with Google. To login to Caseline desktop app, you need a password. Click below to set one:</p>'
          : '<p>Click below to reset your Caseline password (expires in 1 hour):</p>')
        + '<div style="text-align:center;margin:28px 0;">'
        + '<a href="' + resetUrl + '" style="background:#1E3A5F;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">'
        + (isFirstTime ? 'Set My Caseline Password' : 'Reset Password')
        + '</a></div>'
        + '<p style="color:#888;font-size:12px;">Or paste: ' + resetUrl + '</p>'
        + '</div></div>'
    });

    if (emailError) {
      console.error('Resend error:', JSON.stringify(emailError));
      return NextResponse.json({
        success: false,
        error: 'Email failed: ' + (emailError.message || JSON.stringify(emailError))
      }, { status: 500 });
    }

    console.log('Email sent successfully, id:', emailData?.id);
    return NextResponse.json({ success: true, message: 'Password link sent to your email.' });

  } catch (err: any) {
    console.error('Unexpected error:', err?.message || err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to process request' }, { status: 500 });
  }
}
