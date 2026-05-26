import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// Same Caseline Supabase as forgot-password
function getCaselineSupabase() {
  return createClient(
    process.env.CASELINE_SUPABASE_URL!,
    process.env.CASELINE_SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { token, email, newPassword } = await req.json();

    if (!token || !email || !newPassword) {
      return NextResponse.json({ success: false, error: 'Token, email and new password are required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const db = getCaselineSupabase();
    const normalizedEmail = email.toLowerCase().trim();

    // Step 1: Find the token (no join - separate queries)
    const { data: resetToken, error: tokenLookupError } = await db
      .from('password_reset_tokens')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();

    if (tokenLookupError || !resetToken) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired reset link. Please request a new one.'
      }, { status: 400 });
    }

    // Step 2: Check expiry
    if (new Date(resetToken.expires_at) < new Date()) {
      await db.from('password_reset_tokens').delete().eq('token', token);
      return NextResponse.json({
        success: false,
        error: 'This reset link has expired. Please request a new one.'
      }, { status: 400 });
    }

    // Step 3: Verify the user exists and email matches
    const { data: user, error: userError } = await db
      .from('users')
      .select('id, email')
      .eq('id', resetToken.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 400 });
    }

    if (user.email.toLowerCase() !== normalizedEmail) {
      return NextResponse.json({ success: false, error: 'Invalid reset link.' }, { status: 400 });
    }

    // Step 4: Hash and save new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await db
      .from('users')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', resetToken.user_id);

    if (updateError) {
      return NextResponse.json({ success: false, error: 'Failed to update password: ' + updateError.message }, { status: 500 });
    }

    // Step 5: Delete used token
    await db.from('password_reset_tokens').delete().eq('token', token);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully! You can now login to Caseline.'
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
