'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type AdminTab = 'overview' | 'users' | 'flagged' | 'removals' | 'transactions';

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
      </main>
    </div>
  );
}
