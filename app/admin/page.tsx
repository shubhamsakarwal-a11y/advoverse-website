'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type AdminTab = 'overview' | 'users' | 'flagged' | 'removals' | 'transactions' | 'activate' | 'referrals';

interface CaselineUser {
  id: number; email: string; name: string; created_at: string; status?: string;
  hasPassword: boolean; primaryMachineId: string | null; lastSeen: string | null;
  clientCount: number | null; caseCount: number | null; lastSync: string | null;
  machines: { machine_id: string; machine_name: string; registered_at: string; last_seen: string | null }[];
  subscription?: { package_label: string; status: string; expires_at: string; created_at: string } | null;
}

interface AdvUser { id: string; email: string; created_at: string; provider: string; full_name?: string; confirmed: boolean; }
interface FlaggedUser { id: number; current_email: string; previous_email: string; machine_id: string; flagged_at: string; status: string; }
interface DeletedAccount { id: number; email: string; name: string; machine_ids: string[]; license_keys: string[]; deleted_at: string; reason: string; }
interface Stats { totalRevenue: number; activeLicenses: number; totalAdvUsers: number; totalCaselineUsers: number; activeSubscriptions: number; flaggedCount: number; thisMonthRevenue: number; }

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [advUsers, setAdvUsers] = useState<AdvUser[]>([]);
  const [caselineUsers, setCaselineUsers] = useState<CaselineUser[]>([]);
  const [flaggedUsers, setFlaggedUsers] = useState<FlaggedUser[]>([]);
  const [deletedAccounts, setDeletedAccounts] = useState<DeletedAccount[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  // Activate Plan state
  const [activateEmail, setActivateEmail] = useState('');
  const [activatePlan, setActivatePlan] = useState('JUNIOR_ADVOCATE');
  const [activateDays, setActivateDays] = useState('30');
  const [activateNotes, setActivateNotes] = useState('');
  const [activateLoading, setActivateLoading] = useState(false);
  const [activateMsg, setActivateMsg] = useState<{type:'ok'|'err';text:string}|null>(null);
  // Referral Codes state
  const [referralCodes, setReferralCodes] = useState<any[]>([]);
  const [refLoading, setRefLoading] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDiscountType, setNewDiscountType] = useState('percent');
  const [newDiscountValue, setNewDiscountValue] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('100');
  const [newValidUntil, setNewValidUntil] = useState('');
  const [newCodeNotes, setNewCodeNotes] = useState('');
  const [refMsg, setRefMsg] = useState<{type:'ok'|'err';text:string}|null>(null);
  const [selectedCode, setSelectedCode] = useState<any|null>(null);
  const router = useRouter();

  useEffect(() => { checkAndLoad(); }, []);

  const checkAndLoad = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/'); return; }
    const { data: adminUser } = await supabase.from('admin_users').select('*').eq('email', session.user.email).single();
    if (!adminUser) { alert('Access Denied'); router.push('/'); return; }
    setIsAdmin(true);
    await loadAll(session.access_token);
    setLoading(false);
  };

  const loadAll = async (token: string) => {
    const res = await fetch('/api/admin/data', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const d = await res.json();
    setStats(d.stats); setAdvUsers(d.advUsers || []); setCaselineUsers(d.caselineUsers || []);
    setFlaggedUsers(d.flaggedUsers || []); setDeletedAccounts(d.deletedAccounts || []); setTransactions(d.transactions || []);
    // Auto-load referral codes so they persist across logins
    const refRes = await fetch('/api/admin/referral-codes', { headers: { Authorization: `Bearer ${token}` } });
    if (refRes.ok) { const rd = await refRes.json(); setReferralCodes(rd.codes || []); }
  };

  const getToken = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  const handleRemoveUser = async (cu: CaselineUser) => {
    if (!confirm(`Remove ${cu.email} from Caseline?\n\nThis will:\n• Cancel their subscription\n• Log their machine IDs\n• Prevent re-trial\n\nThis cannot be undone.`)) return;
    setActionLoading(cu.id);
    const token = await getToken();
    const res = await fetch('/api/admin/remove-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ caselineUserId: cu.id, reason: 'admin_removed' }),
    });
    setActionLoading(null);
    if (res.ok) {
      setCaselineUsers(u => u.map(x => x.id === cu.id ? { ...x, status: 'deleted' } : x));
      alert(`✅ ${cu.email} removed from Caseline`);
    } else {
      alert('Failed to remove user');
    }
  };

  const handleBlockUser = async (cu: CaselineUser) => {
    const isBlocked = cu.status === 'blocked';
    const action = isBlocked ? 'unblock' : 'block';
    if (!confirm(`${action === 'block' ? 'Block' : 'Unblock'} ${cu.email}?`)) return;
    setActionLoading(cu.id);
    const token = await getToken();
    const res = await fetch('/api/admin/block-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ caselineUserId: cu.id, action }),
    });
    setActionLoading(null);
    if (res.ok) {
      const newStatus = action === 'block' ? 'blocked' : 'active';
      setCaselineUsers(u => u.map(x => x.id === cu.id ? { ...x, status: newStatus } : x));
    }
  };

  const handleSignOut = async () => { const s = createClient(); await s.auth.signOut(); router.push('/'); };
  const resolveFlagged = async (id: number) => {
    const token = await getToken();
    await fetch('/api/admin/flagged', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id, status: 'resolved' }) });
    setFlaggedUsers(f => f.map(x => x.id === id ? { ...x, status: 'resolved' } : x));
  };

  if (loading) return <div style={{ minHeight: '100vh', background: '#f7f4ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#3b2a22', fontSize: '22px' }}>Loading Admin Dashboard...</div></div>;
  if (!isAdmin) return null;

  const TABS: { id: AdminTab; label: string; icon: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'All Users', icon: '👥', badge: (advUsers.length + caselineUsers.length) || undefined },
    { id: 'flagged', label: 'Flagged', icon: '🚩', badge: flaggedUsers.filter(f => f.status === 'pending').length || undefined },
    { id: 'removals', label: 'Account Removals', icon: '🗑️', badge: deletedAccounts.length || undefined },
    { id: 'transactions', label: 'Transactions', icon: '💳' },
    { id: 'activate', label: 'Activate Plan', icon: '⚡' },
    { id: 'referrals', label: 'Referral Codes', icon: '🎟️' },
  ];

  const filteredCaseline = caselineUsers.filter(u => !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase()) || (u.name || '').toLowerCase().includes(userSearch.toLowerCase()));
  const filteredAdv = advUsers.filter(u => !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase()) || (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()));

  const statusColor = (s?: string) => {
    if (!s || s === 'active') return { bg: '#dcfce7', color: '#166534' };
    if (s === 'blocked') return { bg: '#fee2e2', color: '#991b1b' };
    if (s === 'deleted') return { bg: '#f3f4f6', color: '#6b7280' };
    return { bg: '#fef3c7', color: '#92400e' };
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f4ef', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: '#3b2a22', padding: '18px 0', borderBottom: '2px solid #6b4b3e' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: '#f59e0b', margin: 0 }}>⚖ Advoverse Admin</h1><p style={{ color: '#d1d5db', fontSize: '13px', margin: '2px 0 0' }}>Full System Dashboard</p></div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href="/" style={{ padding: '8px 18px', background: '#6b4b3e', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}>Website</a>
            <button onClick={handleSignOut} style={{ padding: '8px 18px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Sign Out</button>
          </div>
        </div>
      </header>
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '4px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '14px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: tab === t.id ? '#f59e0b' : '#6b7280', borderBottom: tab === t.id ? '3px solid #f59e0b' : '3px solid transparent', fontWeight: tab === t.id ? 600 : 400, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {t.icon} {t.label}
              {t.badge ? <span style={{ background: t.id === 'flagged' ? '#dc2626' : '#6b4b3e', color: 'white', fontSize: '11px', padding: '2px 7px', borderRadius: '10px', fontWeight: 700 }}>{t.badge}</span> : null}
            </button>
          ))}
        </div>
      </nav>
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>

        {/* OVERVIEW */}
        {tab === 'overview' && stats && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#3b2a22', marginBottom: '24px' }}>System Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, sub: 'All time', color: '#3b2a22' },
                { label: 'This Month', value: `₹${stats.thisMonthRevenue.toLocaleString('en-IN')}`, sub: 'Revenue', color: '#3b2a22' },
                { label: 'Advoverse Users', value: stats.totalAdvUsers, sub: 'Google / Email', color: '#1d4ed8' },
                { label: 'Caseline Users', value: stats.totalCaselineUsers, sub: 'Desktop app', color: '#7c3aed' },
                { label: 'Active Licenses', value: stats.activeLicenses, sub: 'Currently active', color: '#16a34a' },
                { label: 'Active Subscriptions', value: stats.activeSubscriptions, sub: 'Caseline plans', color: '#0891b2' },
                { label: 'Flagged Users', value: stats.flaggedCount, sub: 'Re-registered', color: '#dc2626' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>{s.label}</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#3b2a22', fontSize: '17px' }}>Recent Transactions</h3>
                <button onClick={() => setTab('transactions')} style={{ background: 'none', border: 'none', color: '#6b4b3e', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>View All →</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}><tr>{['Date','User','Plan','Amount','Status'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>{transactions.slice(0,5).map((t: any) => (<tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}><td style={{ padding: '12px 16px', fontSize: '13px' }}>{new Date(t.created_at).toLocaleDateString('en-IN')}</td><td style={{ padding: '12px 16px', fontSize: '13px' }}>{t.user_email}</td><td style={{ padding: '12px 16px', fontSize: '13px' }}>{t.plan_name}</td><td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#16a34a' }}>₹{(t.amount/100).toLocaleString('en-IN')}</td><td style={{ padding: '12px 16px' }}><span style={{ background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{t.status}</span></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* ALL USERS */}
        {tab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#3b2a22', margin: 0 }}>All Users</h2>
              <input type="text" placeholder="Search by email or name..." value={userSearch} onChange={e => setUserSearch(e.target.value)} style={{ padding: '10px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', width: '280px', outline: 'none' }} />
            </div>

            {/* Advoverse Users */}
            <h3 style={{ color: '#1d4ed8', fontSize: '16px', marginBottom: '12px', fontWeight: 600 }}>🌐 Advoverse.com Users ({filteredAdv.length})</h3>
            <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '28px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#eff6ff' }}><tr>{['Email','Name','Auth Provider','Confirmed','Joined'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#1d4ed8', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredAdv.map(u => (<tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#3b2a22' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#555' }}>{u.full_name || '—'}</td>
                    <td style={{ padding: '12px 16px' }}><span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>{u.provider}</span></td>
                    <td style={{ padding: '12px 16px' }}><span style={{ background: u.confirmed ? '#dcfce7' : '#fee2e2', color: u.confirmed ? '#166534' : '#991b1b', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>{u.confirmed ? 'Yes' : 'No'}</span></td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#888' }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>))}
                  {filteredAdv.length === 0 && <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#888' }}>No users found</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Caseline Users — expanded table */}
            <h3 style={{ color: '#7c3aed', fontSize: '16px', marginBottom: '12px', fontWeight: 600 }}>🖥️ Caseline Desktop Users ({filteredCaseline.length})</h3>
            <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
                <thead style={{ background: '#f5f3ff' }}>
                  <tr>{['Email','Name','Plan','Expiry','Machine ID','Last Active','Clients','Status','Actions'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#7c3aed', textTransform: 'uppercase', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredCaseline.map(u => {
                    const sc = statusColor(u.status);
                    const isDeleted = u.status === 'deleted';
                    const isBlocked = u.status === 'blocked';
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6', background: isDeleted ? '#f9fafb' : isBlocked ? '#fff7f7' : 'white', opacity: isDeleted ? 0.6 : 1 }}>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#3b2a22' }}>{u.email}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#555' }}>{u.name || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                          {u.subscription ? (
                            <span style={{ background: u.subscription.status === 'active' ? '#dcfce7' : '#fee2e2', color: u.subscription.status === 'active' ? '#166534' : '#991b1b', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                              {u.subscription.package_label}
                            </span>
                          ) : <span style={{ color: '#9ca3af', fontSize: '12px' }}>No plan</span>}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#555', whiteSpace: 'nowrap' }}>
                          {u.subscription?.expires_at ? (
                            <span style={{ color: new Date(u.subscription.expires_at) < new Date() ? '#dc2626' : '#16a34a' }}>
                              {new Date(u.subscription.expires_at).toLocaleDateString('en-IN')}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>
                          {u.primaryMachineId ? u.primaryMachineId.substring(0, 16) + '...' : '—'}
                          {u.machines.length > 1 && <span style={{ marginLeft: '4px', background: '#e0e7ff', color: '#3730a3', padding: '1px 6px', borderRadius: '8px', fontSize: '10px' }}>+{u.machines.length - 1}</span>}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>
                          {u.lastSeen ? new Date(u.lastSeen).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#3b2a22', textAlign: 'center' }}>
                          {u.clientCount !== null ? <span style={{ fontWeight: 600, color: '#0891b2' }}>{u.clientCount}</span> : <span style={{ color: '#9ca3af', fontSize: '11px' }}>N/A</span>}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                            {u.status || 'active'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {!isDeleted && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleBlockUser(u)}
                                disabled={actionLoading === u.id}
                                style={{ padding: '5px 12px', background: isBlocked ? '#16a34a' : '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}
                              >
                                {actionLoading === u.id ? '...' : isBlocked ? 'Unblock' : 'Block'}
                              </button>
                              <button
                                onClick={() => handleRemoveUser(u)}
                                disabled={actionLoading === u.id}
                                style={{ padding: '5px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}
                              >
                                {actionLoading === u.id ? '...' : 'Remove'}
                              </button>
                            </div>
                          )}
                          {isDeleted && <span style={{ color: '#9ca3af', fontSize: '11px' }}>Removed</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCaseline.length === 0 && <tr><td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: '#888' }}>No users found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FLAGGED */}
        {tab === 'flagged' && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#3b2a22', marginBottom: '8px' }}>Flagged Users</h2>
            <p style={{ color: '#888', marginBottom: '24px', fontSize: '15px' }}>Users who removed their account and re-registered on the same machine.</p>
            {flaggedUsers.length === 0 ? <div style={{ background: 'white', borderRadius: '14px', padding: '60px', textAlign: 'center' }}><div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div><p style={{ color: '#888' }}>No flagged users</p></div> : (
              <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#fef2f2' }}><tr>{['Current Email','Previous Email','Machine ID','Flagged On','Status','Action'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#dc2626', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>)}</tr></thead>
                  <tbody>{flaggedUsers.map(f => (<tr key={f.id} style={{ borderBottom: '1px solid #f3f4f6', background: f.status === 'resolved' ? '#f9fafb' : 'white' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{f.current_email}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>{f.previous_email || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>{f.machine_id}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#888' }}>{new Date(f.flagged_at).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '12px 16px' }}><span style={{ background: f.status === 'pending' ? '#fef3c7' : '#dcfce7', color: f.status === 'pending' ? '#92400e' : '#166534', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>{f.status}</span></td>
                    <td style={{ padding: '12px 16px' }}>{f.status === 'pending' && <button onClick={() => resolveFlagged(f.id)} style={{ padding: '6px 14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Resolve</button>}</td>
                  </tr>))}</tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* REMOVALS */}
        {tab === 'removals' && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#3b2a22', marginBottom: '8px' }}>Account Removal Log</h2>
            <p style={{ color: '#888', marginBottom: '24px', fontSize: '15px' }}>All removed accounts. Machine IDs retained to block re-trial.</p>
            {deletedAccounts.length === 0 ? <div style={{ background: 'white', borderRadius: '14px', padding: '60px', textAlign: 'center' }}><div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div><p style={{ color: '#888' }}>No account removals yet</p></div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {deletedAccounts.map(d => (<div key={d.id} style={{ background: 'white', borderRadius: '14px', padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                    <div><div style={{ fontWeight: 600, color: '#3b2a22', fontSize: '16px' }}>{d.email}</div><div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{d.name}</div></div>
                    <div style={{ textAlign: 'right', fontSize: '13px', color: '#888' }}><div>Removed: {new Date(d.deleted_at).toLocaleDateString('en-IN')}</div><div>Reason: {d.reason}</div></div>
                  </div>
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px' }}>
                    <div><span style={{ color: '#888' }}>Machine IDs: </span>{d.machine_ids?.length > 0 ? d.machine_ids.map((m, i) => <code key={i} style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', marginRight: '6px', fontFamily: 'monospace', fontSize: '12px' }}>{m}</code>) : <span style={{ color: '#ccc' }}>none</span>}</div>
                    <div><span style={{ color: '#888' }}>License Keys: </span>{d.license_keys?.length > 0 ? d.license_keys.map((k, i) => <code key={i} style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', marginRight: '6px', fontFamily: 'monospace', fontSize: '12px' }}>{k}</code>) : <span style={{ color: '#ccc' }}>none</span>}</div>
                  </div>
                </div>))}
              </div>
            )}
          </div>
        )}

        {/* TRANSACTIONS */}
        {tab === 'transactions' && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#3b2a22', marginBottom: '24px' }}>All Transactions</h2>
            <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}><tr>{['Date','User Email','Plan','Amount','Gateway','Status'].map(h => <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {transactions.map((t: any) => (<tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{new Date(t.created_at).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{t.user_email}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{t.plan_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#16a34a' }}>₹{(t.amount/100).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#888' }}>{t.gateway || 'razorpay'}</td>
                    <td style={{ padding: '12px 16px' }}><span style={{ background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{t.status}</span></td>
                  </tr>))}
                  {transactions.length === 0 && <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>No transactions found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ACTIVATE PLAN ── */}
        {tab === 'activate' && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#3b2a22', marginBottom: '8px' }}>⚡ Direct Plan Activation</h2>
            <p style={{ color: '#888', marginBottom: '28px', fontSize: '15px' }}>Activate a plan for any user without payment. All activations are logged.</p>
            <div style={{ background: 'white', borderRadius: '16px', padding: '36px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '560px' }}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#3b2a22', fontSize: '14px', marginBottom: '6px' }}>User Email *</label>
                <input type="email" value={activateEmail} onChange={e => setActivateEmail(e.target.value)} placeholder="user@example.com"
                  style={{ width: '100%', padding: '11px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#3b2a22', fontSize: '14px', marginBottom: '6px' }}>Plan *</label>
                <select value={activatePlan} onChange={e => setActivatePlan(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'white' }}>
                  <option value="JUNIOR_ADVOCATE">Junior Advocate — 20 clients, 1 user</option>
                  <option value="SOLO_ADVOCATE">Solo Advocate — 60 clients, 1 user</option>
                  <option value="ADVOCATE_CLERK">Advocate + Clerk — 120 clients, 2 users</option>
                  <option value="CHAMBER_LITE">Chamber Lite — 200 clients, 3 users</option>
                  <option value="CHAMBER">Chamber — 500 clients, 6 users</option>
                  <option value="CHAMBER_PRO">Chamber Pro — Unlimited clients, 9 users</option>
                  <option value="EXCLUSIVE">Exclusive — Unlimited everything</option>
                </select>
              </div>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#3b2a22', fontSize: '14px', marginBottom: '6px' }}>Duration *</label>
                <select value={activateDays} onChange={e => setActivateDays(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'white' }}>
                  <option value="30">30 days (1 month)</option>
                  <option value="90">90 days (3 months)</option>
                  <option value="180">180 days (6 months)</option>
                  <option value="365">365 days (1 year)</option>
                  <option value="730">730 days (2 years)</option>
                </select>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#3b2a22', fontSize: '14px', marginBottom: '6px' }}>Notes (optional)</label>
                <input type="text" value={activateNotes} onChange={e => setActivateNotes(e.target.value)} placeholder="e.g. Demo activation, Refund replacement..."
                  style={{ width: '100%', padding: '11px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              {activateMsg && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', background: activateMsg.type === 'ok' ? '#dcfce7' : '#fee2e2', color: activateMsg.type === 'ok' ? '#166534' : '#991b1b' }}>
                  {activateMsg.type === 'ok' ? '✅ ' : '❌ '}{activateMsg.text}
                </div>
              )}
              <button
                disabled={activateLoading || !activateEmail}
                onClick={async () => {
                  setActivateLoading(true); setActivateMsg(null);
                  const token = await getToken();
                  const res = await fetch('/api/admin/activate-plan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ userEmail: activateEmail, planCode: activatePlan, durationDays: parseInt(activateDays), notes: activateNotes }),
                  });
                  const d = await res.json();
                  setActivateLoading(false);
                  if (res.ok) {
                    setActivateMsg({ type: 'ok', text: d.message });
                    setActivateEmail(''); setActivateNotes('');
                  } else {
                    setActivateMsg({ type: 'err', text: d.error || 'Activation failed' });
                  }
                }}
                style={{ width: '100%', padding: '14px', background: activateLoading || !activateEmail ? '#a8927e' : '#6b4b3e', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '16px', cursor: activateLoading || !activateEmail ? 'not-allowed' : 'pointer' }}
              >
                {activateLoading ? 'Activating...' : '⚡ Activate Plan'}
              </button>
              <div style={{ marginTop: '16px', padding: '12px', background: '#fef9f0', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '12px', color: '#92400e' }}>
                ⚠️ This activates the plan immediately without payment. The activation is logged with your admin email for audit purposes.
              </div>
            </div>
          </div>
        )}

        {/* ── REFERRAL CODES ── */}
        {tab === 'referrals' && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#3b2a22', marginBottom: '8px' }}>🎟️ Referral Codes</h2>
            <p style={{ color: '#888', marginBottom: '28px', fontSize: '15px' }}>Create discount codes for users. Track usage per code.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

              {/* Create Code Form */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: '17px', color: '#3b2a22', fontWeight: 600, marginBottom: '20px' }}>Create New Code</h3>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3b2a22', fontSize: '13px', marginBottom: '5px' }}>Code Name *</label>
                  <input type="text" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="LAUNCH50"
                    style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', letterSpacing: '2px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#3b2a22', fontSize: '13px', marginBottom: '5px' }}>Discount Type *</label>
                    <select value={newDiscountType} onChange={e => setNewDiscountType(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white' }}>
                      <option value="percent">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#3b2a22', fontSize: '13px', marginBottom: '5px' }}>Value *</label>
                    <input type="number" value={newDiscountValue} onChange={e => setNewDiscountValue(e.target.value)} placeholder={newDiscountType === 'percent' ? '10' : '50'}
                      style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#3b2a22', fontSize: '13px', marginBottom: '5px' }}>Max Uses *</label>
                    <input type="number" value={newMaxUses} onChange={e => setNewMaxUses(e.target.value)} placeholder="100"
                      style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: '#3b2a22', fontSize: '13px', marginBottom: '5px' }}>Valid Until</label>
                    <input type="date" value={newValidUntil} onChange={e => setNewValidUntil(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#3b2a22', fontSize: '13px', marginBottom: '5px' }}>Notes</label>
                  <input type="text" value={newCodeNotes} onChange={e => setNewCodeNotes(e.target.value)} placeholder="e.g. Launch offer for advocates"
                    style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                {refMsg && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', background: refMsg.type === 'ok' ? '#dcfce7' : '#fee2e2', color: refMsg.type === 'ok' ? '#166534' : '#991b1b' }}>
                    {refMsg.type === 'ok' ? '✅ ' : '❌ '}{refMsg.text}
                  </div>
                )}
                <button
                  disabled={refLoading || !newCode || !newDiscountValue || !newMaxUses}
                  onClick={async () => {
                    setRefLoading(true); setRefMsg(null);
                    const token = await getToken();
                    const res = await fetch('/api/admin/referral-codes', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ code: newCode, discountType: newDiscountType, discountValue: parseInt(newDiscountValue), maxUses: parseInt(newMaxUses), validUntil: newValidUntil || null, notes: newCodeNotes }),
                    });
                    const d = await res.json();
                    setRefLoading(false);
                    if (res.ok) {
                      setRefMsg({ type: 'ok', text: `Code ${d.code?.code} created!` });
                      setReferralCodes(prev => [d.code, ...prev]);
                      setNewCode(''); setNewDiscountValue(''); setNewMaxUses('100'); setNewValidUntil(''); setNewCodeNotes('');
                    } else {
                      setRefMsg({ type: 'err', text: d.error || 'Failed to create code' });
                    }
                  }}
                  style={{ width: '100%', padding: '12px', background: refLoading || !newCode || !newDiscountValue ? '#a8927e' : '#6b4b3e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
                >
                  {refLoading ? 'Creating...' : '+ Create Code'}
                </button>
              </div>

              {/* Codes List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '17px', color: '#3b2a22', fontWeight: 600, margin: 0 }}>All Codes ({referralCodes.length})</h3>
                  <button onClick={async () => {
                    const token = await getToken();
                    const res = await fetch('/api/admin/referral-codes', { headers: { Authorization: `Bearer ${token}` } });
                    if (res.ok) { const d = await res.json(); setReferralCodes(d.codes || []); }
                  }} style={{ padding: '6px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#6b7280' }}>
                    🔄 Refresh
                  </button>
                </div>
                {referralCodes.length === 0 ? (
                  <div style={{ background: 'white', borderRadius: '14px', padding: '40px', textAlign: 'center', color: '#888' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎟️</div>
                    <p>No codes yet. Create one on the left.</p>
                    <button onClick={async () => {
                      const token = await getToken();
                      const res = await fetch('/api/admin/referral-codes', { headers: { Authorization: `Bearer ${token}` } });
                      if (res.ok) { const d = await res.json(); setReferralCodes(d.codes || []); }
                    }} style={{ marginTop: '10px', padding: '8px 18px', background: '#6b4b3e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Load Codes</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {referralCodes.map((c: any) => (
                      <div key={c.id} style={{ background: 'white', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: `2px solid ${c.is_active ? '#e5e7eb' : '#fee2e2'}`, opacity: c.is_active ? 1 : 0.7 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <code style={{ fontSize: '18px', fontWeight: 700, color: '#3b2a22', letterSpacing: '2px' }}>{c.code}</code>
                            <span style={{ marginLeft: '10px', background: c.discount_type === 'percent' ? '#dbeafe' : '#dcfce7', color: c.discount_type === 'percent' ? '#1d4ed8' : '#166534', padding: '2px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
                              {c.discount_type === 'percent' ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                            </span>
                          </div>
                          <button
                            onClick={async () => {
                              const token = await getToken();
                              await fetch('/api/admin/referral-codes', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: c.id, is_active: !c.is_active }) });
                              setReferralCodes(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !c.is_active } : x));
                            }}
                            style={{ padding: '4px 12px', background: c.is_active ? '#fee2e2' : '#dcfce7', color: c.is_active ? '#991b1b' : '#166534', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                          >
                            {c.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                          <span>Uses: <strong style={{ color: c.used_count >= c.max_uses ? '#dc2626' : '#3b2a22' }}>{c.used_count}/{c.max_uses}</strong></span>
                          {c.valid_until && <span>Expires: {new Date(c.valid_until).toLocaleDateString('en-IN')}</span>}
                          {c.notes && <span>Note: {c.notes}</span>}
                        </div>
                        {/* Usage bar */}
                        <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                          <div style={{ background: c.used_count >= c.max_uses ? '#dc2626' : '#6b4b3e', height: '100%', width: `${Math.min(100, (c.used_count / c.max_uses) * 100)}%`, transition: 'width 0.3s' }} />
                        </div>
                        {/* Usage log toggle */}
                        {c.uses?.length > 0 && (
                          <div style={{ marginTop: '10px' }}>
                            <button onClick={() => setSelectedCode(selectedCode?.id === c.id ? null : c)} style={{ background: 'none', border: 'none', color: '#6b4b3e', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: 0 }}>
                              {selectedCode?.id === c.id ? '▲ Hide' : `▼ Show ${c.uses.length} use(s)`}
                            </button>
                            {selectedCode?.id === c.id && (
                              <div style={{ marginTop: '8px', background: '#f9fafb', borderRadius: '8px', padding: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                                {c.uses.map((u: any, i: number) => (
                                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#555', padding: '3px 0', borderBottom: '1px solid #e5e7eb' }}>
                                    <span>{u.user_email}</span>
                                    <span>₹{u.original_amount/100} → ₹{u.discounted_amount/100}</span>
                                    <span>{new Date(u.used_at).toLocaleDateString('en-IN')}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
