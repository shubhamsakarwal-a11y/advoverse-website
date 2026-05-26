// Deploy to: app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { token, email, newPassword } = await req.json();

    if (!token || !email || !newPassword) {
      return NextResponse.json({ success: false, error: 'Token, email and new password are required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find and validate the token
    const { data: resetToken } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at, users(id, email)')
      .eq('token', token)
      .single();

    if (!resetToken) {
      return NextResponse.json({ success: false, error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 });
    }

    // Check expiry
    if (new Date(resetToken.expires_at) < new Date()) {
      await supabase.from('password_reset_tokens').delete().eq('token', token);
      return NextResponse.json({ success: false, error: 'This reset link has expired. Please request a new one.' }, { status: 400 });
    }

    // Verify email matches
    const tokenUser = resetToken.users as any;
    if (tokenUser.email.toLowerCase() !== email.toLowerCase().trim()) {
      return NextResponse.json({ success: false, error: 'Invalid reset link.' }, { status: 400 });
    }

    // Hash new password and update
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', resetToken.user_id);

    if (updateError) {
      return NextResponse.json({ success: false, error: 'Failed to update password' }, { status: 500 });
    }

    // Delete used token
    await supabase.from('password_reset_tokens').delete().eq('token', token);

    return NextResponse.json({ success: true, message: 'Password updated successfully! You can now login to Caseline.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ success: false, error: 'Failed to reset password' }, { status: 500 });
  }
}
