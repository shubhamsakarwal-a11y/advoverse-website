'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Tab = 'plan' | 'invoices' | 'password' | 'account';

interface Subscription {
  package_code: string;
  package_label: string;
  status: string;
  expires_at: string;
  created_at: string;
  clients_allowed: number;
  users_allowed: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  plan_name: string;
  duration: string;
  total_amount: number;
  payment_date: string;
  status: string;
}



export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('plan');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tab data
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);


  // Password tab
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Account tab
  const [removeConfirm, setRemoveConfirm] = useState('');
  const [removeMsg, setRemoveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    init();
    // Auto-open tab based on URL hash (e.g. /dashboard#password from Caseline forgot password)
    const hash = window.location.hash.replace('#', '');
    if (hash === 'password' || hash === 'caseline-password') {
      setTab('password');
    }
  }, []);

  const init = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/'); return; }
    setUser(session.user);

    // Fetch subscription
    const subRes = await fetch('/api/dashboard/subscription', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (subRes.ok) {
      const d = await subRes.json();
      setSubscription(d.subscription || null);
    }

    // Fetch invoices
    const invRes = await fetch('/api/invoice/list', {
      headers: { Authorization: \`Bearer \${session.access_token}\` },
    });
    if (invRes.ok) {
      const d = await invRes.json();
      setInvoices(d.invoices || []);
    }



    setLoading(false);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'err', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: 'err', text: 'Password must be at least 8 characters.' });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/dashboard/set-caseline-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ password: newPassword }),
    });
    const d = await res.json();
    setPwLoading(false);
    if (res.ok) {
      setPwMsg({ type: 'ok', text: 'Caseline password updated! You can now login with this password.' });
      setNewPassword(''); setConfirmPassword('');
    } else {
      setPwMsg({ type: 'err', text: d.error || 'Failed to update password.' });
    }
  };



  const handleRemoveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (removeConfirm !== 'REMOVE MY ACCOUNT') {
      setRemoveMsg({ type: 'err', text: 'Please type exactly: REMOVE MY ACCOUNT' });
      return;
    }
    setRemoveLoading(true);
    setRemoveMsg(null);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/dashboard/remove-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ reason: 'user_requested' }),
    });
    const d = await res.json();
    setRemoveLoading(false);
    if (res.ok) {
      await supabase.auth.signOut();
      alert('Your account has been removed. You will now be redirected.');
      router.push('/');
    } else {
      setRemoveMsg({ type: 'err', text: d.error || 'Failed to remove account.' });
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    alert('License key copied!');
  };

  const daysLeft = (iso: string) => {
    const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
    return d;
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f7f4ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#3b2a22', fontSize: '22px' }}>Loading your dashboard...</div>
    </div>
  );

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'plan',     label: 'My Plan',          icon: '📋' },
    { id: 'licenses', label: 'License Keys',      icon: '🔑' },
    { id: 'password', label: 'Caseline Password', icon: '🔒' },
    { id: 'account',  label: 'Account',           icon: '👤' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f7f4ef', fontFamily: 'Inter, sans-serif', color: '#2d2d2d' }}>

      {/* HEADER */}
      <header style={{ background: '#f5eee4', padding: '20px 0', borderBottom: '1px solid #cbb8a4' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '90%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ fontFamily: 'Playfair Display, serif', fontSize: '40px', fontStyle: 'italic', fontWeight: 500, color: '#2f1d16', textDecoration: 'none' }}>
            Advoverse ⚖
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#6b4b3e', fontSize: '14px' }}>{user?.email}</span>
            <a href="/" style={{ padding: '8px 20px', background: '#6b4b3e', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}>
              Home
            </a>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '90%', padding: '40px 0' }}>

        {/* Page Title */}
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '40px', color: '#3b2a22', marginBottom: '8px' }}>
          My Dashboard
        </h1>
        <p style={{ color: '#888', marginBottom: '32px', fontSize: '16px' }}>
          Welcome back, <strong>{user?.user_metadata?.full_name || user?.email}</strong>
        </p>

        {/* Tab Nav */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', background: '#e8ddd6', borderRadius: '12px', padding: '6px' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '10px 8px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                background: tab === t.id ? 'white' : 'transparent',
                color: tab === t.id ? '#3b2a22' : '#7a6b62',
                fontWeight: tab === t.id ? 600 : 400,
                boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s', fontSize: '13px',
              }}
            >
              <span style={{ marginRight: '6px' }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: PLAN ── */}
        {tab === 'plan' && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: '#3b2a22', marginBottom: '20px' }}>
              Active Plan
            </h2>
            {subscription && subscription.status === 'active' ? (
              <div style={{ background: 'white', borderRadius: '16px', padding: '36px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '2px solid #22c55e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Plan</div>
                    <div style={{ fontSize: '36px', fontFamily: 'Playfair Display, serif', color: '#3b2a22', fontWeight: 700 }}>
                      {subscription.package_label}
                    </div>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '24px', color: '#555', fontSize: '14px', flexWrap: 'wrap' }}>
                      <span>👥 Up to {subscription.users_allowed} user{subscription.users_allowed > 1 ? 's' : ''}</span>
                      <span>📁 Up to {subscription.clients_allowed >= 999999 ? 'Unlimited' : subscription.clients_allowed} clients</span>
                      <span>📅 Activated: {new Date(subscription.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ background: '#dcfce7', color: '#166534', padding: '6px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
                      ✅ Active
                    </span>
                    <div style={{ marginTop: '12px', fontSize: '14px', color: '#555' }}>
                      Expires: <strong>{new Date(subscription.expires_at).toLocaleDateString('en-IN')}</strong>
                    </div>
                    <div style={{
                      fontSize: '20px', fontWeight: 700, marginTop: '4px',
                      color: daysLeft(subscription.expires_at) <= 7 ? '#dc2626' : daysLeft(subscription.expires_at) <= 30 ? '#d97706' : '#16a34a'
                    }}>
                      {daysLeft(subscription.expires_at)} days left
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '10px', fontSize: '13px', color: '#666' }}>
                  💡 This is a one-time purchase. To renew, visit the pricing page before your plan expires.
                </div>
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>📋</div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#3b2a22', marginBottom: '10px' }}>No Active Plan</h3>
                <p style={{ color: '#888', marginBottom: '24px' }}>Purchase a plan to unlock all Caseline features.</p>
                <a href="/#pricing" style={{ display: 'inline-block', padding: '12px 32px', background: '#6b4b3e', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 600 }}>
                  View Plans
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: LICENSES ── */}
        {tab === 'invoices' && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: '#3b2a22', marginBottom: '20px' }}>
              Invoices
            </h2>
            {invoices.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>🧾</div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', color: '#3b2a22', marginBottom: '10px' }}>No Invoices Yet</h3>
                <p style={{ color: '#888', marginBottom: '24px' }}>Purchase a plan to receive your invoice.</p>
                <a href="/#pricing" style={{ display: 'inline-block', padding: '12px 32px', background: '#6b4b3e', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 600 }}>
                  View Plans
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {invoices.map(inv => (
                  <div key={inv.id} style={{ background: 'white', borderRadius: '14px', padding: '24px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#3b2a22', fontSize: '17px', marginBottom: '4px' }}>
                        {inv.plan_name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#888' }}>
                        {inv.invoice_number} &nbsp;·&nbsp; {new Date(inv.payment_date).toLocaleDateString('en-IN')} &nbsp;·&nbsp; {inv.duration}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b2a22' }}>
                        ₹{inv.total_amount}
                      </div>
                      <button
                        onClick={async () => {
                          const supabase = (await import('@/lib/supabase/client')).createClient();
                          const { data: { session } } = await supabase.auth.getSession();
                          const res = await fetch(`/api/invoice/${inv.id}/pdf`, {
                            headers: { Authorization: `Bearer ${session?.access_token}` },
                          });
                          if (res.ok) {
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.download = inv.invoice_number + '.pdf'; a.click();
                            URL.revokeObjectURL(url);
                          } else {
                            alert('Failed to download invoice');
                          }
                        }}
                        style={{ padding: '10px 22px', background: '#6b4b3e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
                      >
                        ⬇ Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'password' && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: '#3b2a22', marginBottom: '8px' }}>
              Caseline Password
            </h2>
            <p style={{ color: '#777', marginBottom: '28px', fontSize: '15px' }}>
              Set a password to login to the Caseline desktop app using your email <strong>{user?.email}</strong>.
            </p>
            <div style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '480px' }}>
              <form onSubmit={handleSetPassword}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#3b2a22', fontSize: '14px' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required minLength={8}
                      style={{ width: '100%', padding: '12px 48px 12px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#6b7280', padding: '4px' }}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#3b2a22', fontSize: '14px' }}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      required minLength={8}
                      style={{ width: '100%', padding: '12px 48px 12px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#6b7280', padding: '4px' }}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                {pwMsg && (
                  <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px',
                    background: pwMsg.type === 'ok' ? '#dcfce7' : '#fee2e2',
                    color: pwMsg.type === 'ok' ? '#166534' : '#991b1b',
                  }}>
                    {pwMsg.type === 'ok' ? '✅ ' : '❌ '}{pwMsg.text}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={pwLoading}
                  style={{ width: '100%', padding: '14px', background: pwLoading ? '#a8927e' : '#6b4b3e', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '16px', cursor: pwLoading ? 'not-allowed' : 'pointer' }}
                >
                  {pwLoading ? 'Saving...' : 'Set Caseline Password'}
                </button>
              </form>
              <div style={{ marginTop: '20px', padding: '14px', background: '#fef9f0', border: '1px solid #fde68a', borderRadius: '10px', fontSize: '13px', color: '#92400e' }}>
                ⚠️ This password is for the <strong>Caseline desktop app only</strong>. It is separate from your Advoverse.com Google login.
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: MACHINES ── */}
                {tab === 'account' && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: '#3b2a22', marginBottom: '28px' }}>
              Account Settings
            </h2>

            {/* Account Info */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '18px', color: '#3b2a22', fontWeight: 600, marginBottom: '16px' }}>Account Information</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '16px', fontSize: '15px' }}>
                  <span style={{ color: '#888', minWidth: '80px' }}>Email:</span>
                  <strong>{user?.email}</strong>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '15px' }}>
                  <span style={{ color: '#888', minWidth: '80px' }}>Name:</span>
                  <strong>{user?.user_metadata?.full_name || '—'}</strong>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '15px' }}>
                  <span style={{ color: '#888', minWidth: '80px' }}>Joined:</span>
                  <strong>{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '—'}</strong>
                </div>
              </div>
            </div>

            {/* Remove Account */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '2px solid #fca5a5' }}>
              <h3 style={{ fontSize: '18px', color: '#dc2626', fontWeight: 600, marginBottom: '12px' }}>⚠️ Remove Account</h3>
              <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', color: '#991b1b' }}>
                <strong>This action is permanent.</strong> Your account will be deregistered, all active plans will be cancelled, and your machine IDs will be recorded.
                You will <strong>not</strong> be able to register again with the same machine or start a new trial.
              </div>
              <form onSubmit={handleRemoveAccount}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#3b2a22', fontSize: '14px' }}>
                  Type <code style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>REMOVE MY ACCOUNT</code> to confirm:
                </label>
                <input
                  type="text"
                  value={removeConfirm}
                  onChange={e => setRemoveConfirm(e.target.value)}
                  placeholder="REMOVE MY ACCOUNT"
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #fca5a5', borderRadius: '10px', fontSize: '15px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' }}
                />
                {removeMsg && (
                  <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px',
                    background: removeMsg.type === 'ok' ? '#dcfce7' : '#fee2e2',
                    color: removeMsg.type === 'ok' ? '#166534' : '#991b1b',
                  }}>
                    {removeMsg.text}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={removeLoading || removeConfirm !== 'REMOVE MY ACCOUNT'}
                  style={{
                    padding: '12px 28px', background: removeConfirm === 'REMOVE MY ACCOUNT' ? '#dc2626' : '#d1d5db',
                    color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '15px',
                    cursor: removeConfirm === 'REMOVE MY ACCOUNT' ? 'pointer' : 'not-allowed'
                  }}
                >
                  {removeLoading ? 'Removing...' : 'Remove My Account'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER */}
      <footer style={{ background: '#3b2a22', padding: '40px 0', textAlign: 'center', color: 'white', marginTop: '60px' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '8px' }}>⚖ Advoverse | Caseline ⚖</h2>
        <p style={{ color: '#c9c1b8', fontSize: '14px' }}>Professional litigation management infrastructure.</p>
      </footer>
    </div>
  );
}
