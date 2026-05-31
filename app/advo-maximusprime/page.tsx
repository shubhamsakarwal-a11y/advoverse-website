'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type AdminTab = 'overview' | 'users' | 'flagged' | 'removals' | 'transactions' | 'activate' | 'referrals' | 'invoices' | 'support' | 'backup' | 'managePlans' | 'auditLog' | 'broadcast' | 'reports';

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
  const [pinVerified, setPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [advUsers, setAdvUsers] = useState<AdvUser[]>([]);
  const [caselineUsers, setCaselineUsers] = useState<CaselineUser[]>([]);
  const [flaggedUsers, setFlaggedUsers] = useState<FlaggedUser[]>([]);
  const [deletedAccounts, setDeletedAccounts] = useState<DeletedAccount[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [adminInvoices, setAdminInvoices] = useState<any[]>([]);
  const [adminPlans, setAdminPlans] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [bcMsg, setBcMsg] = useState('');
  const [bcStyle, setBcStyle] = useState('info');
  const [bcTarget, setBcTarget] = useState('all');
  const [bcTargetList, setBcTargetList] = useState('');
  const [bcExpiry, setBcExpiry] = useState(7);
  const [supportEmails, setSupportEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
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

  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportReplies, setReportReplies] = useState<any[]>([]);
  const [reportReplyText, setReportReplyText] = useState('');
  const [reportReplyLoading, setReportReplyLoading] = useState(false);
  const [reportFilter, setReportFilter] = useState<string>('all');
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
    setFlaggedUsers(d.flaggedUsers || []); setDeletedAccounts(d.deletedAccounts || []); setTransactions(d.transactions || []); setAdminInvoices(d.invoices || []); setAuditLogs(d.auditLogs || []);
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

  // PIN Gate
  if (!pinVerified) {
    const handlePinSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setPinLoading(true);
      setPinError('');
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setPinError('Please login first'); setPinLoading(false); return; }
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
        body: JSON.stringify({ pin: pinInput }),
      });
      if (res.ok) {
        setPinVerified(true);
        sessionStorage.setItem('admin_pin_verified', '1');
      } else {
        const d = await res.json();
        setPinError(d.error || 'Invalid PIN');
      }
      setPinLoading(false);
    };
  
  return (
      <div style={{ minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '48px', maxWidth: '380px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>\ud83d\udd12</div>
          <h2 style={{ fontSize: '22px', color: '#1a1a2e', marginBottom: '8px' }}>Admin Access</h2>
          <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>Enter security PIN to continue</p>
          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN"
              autoFocus
              style={{ width: '100%', padding: '14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '18px', textAlign: 'center', letterSpacing: '4px', marginBottom: '16px', boxSizing: 'border-box' }}
            />
            {pinError && <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{pinError}</div>}
            <button
              type="submit"
              disabled={pinLoading || !pinInput}
              style={{ width: '100%', padding: '14px', background: pinLoading ? '#888' : '#1a1a2e', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 600, cursor: pinLoading ? 'not-allowed' : 'pointer' }}
            >{pinLoading ? 'Verifying...' : 'Unlock'}</button>
          </form>
        </div>
      </div>
    );
  }

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
      { id: 'invoices', label: 'Invoices', icon: '📄' },
      { id: 'support', label: 'Support', icon: '📧' },
      { id: 'backup', label: 'Backup', icon: '💾' },
      { id: 'managePlans', label: 'Manage Plans', icon: '📋' },
      { id: 'auditLog', label: 'Audit Log', icon: '📜' },
      { id: 'broadcast', label: 'Broadcast', icon: '📢' },
    { id: 'reports', label: 'Reports', icon: '🐛' },
  ];

  // ── Report Tab Functions ──
  const loadReports = async () => {
    setReportsLoading(true);
    const token = await getToken();
    const res = await fetch('/api/admin/reports', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setReports(d.data || []); }
    setReportsLoading(false);
  };

  const loadReportReplies = async (reportId: string) => {
    const token = await getToken();
    const res = await fetch(`/api/admin/reports/replies?reportId=${reportId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setReportReplies(d.data || []); }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    const token = await getToken();
    await fetch('/api/admin/reports', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ reportId, status }) });
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
    if (selectedReport?.id === reportId) setSelectedReport((prev: any) => ({ ...prev, status }));
  };

  const updateReportPriority = async (reportId: string, priority: string) => {
    const token = await getToken();
    await fetch('/api/admin/reports', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ reportId, priority }) });
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, priority } : r));
    if (selectedReport?.id === reportId) setSelectedReport((prev: any) => ({ ...prev, priority }));
  };

  const sendReportReply = async (reportId: string) => {
    if (!reportReplyText.trim()) return;
    setReportReplyLoading(true);
    const token = await getToken();
    const res = await fetch('/api/admin/reports', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ reportId, message: reportReplyText }) });
    if (res.ok) { setReportReplyText(''); await loadReportReplies(reportId); setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'Query', reply_count: (r.reply_count || 0) + 1 } : r)); if (selectedReport?.id === reportId) setSelectedReport((prev: any) => ({ ...prev, status: 'Query' })); }
    setReportReplyLoading(false);
  };


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
                      body: JSON.stringify({ code: newCode, discountType: newDiscountType, discountValue: parseInt(newDiscountValue), maxUses: parseInt(newMaxUses), validUntil: newValidUntil ? newValidUntil + 'T23:59:59' : null, notes: newCodeNotes }),
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

        {/* INVOICES TAB */}
        {tab === 'invoices' && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#3b2a22', marginBottom: '20px' }}>All Invoices</h2>
            {adminInvoices.length === 0 ? (
              <p style={{ color: '#888' }}>No invoices yet.</p>
            ) : (
              <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ background: '#f8f5f0' }}>
                    <tr>
                      {['Invoice No.', 'User', 'Plan', 'Duration', 'Amount', 'Referral', 'Date', 'Status', 'PDF'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', color: '#6b4b3e', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adminInvoices.map((inv: any) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #f0ebe4' }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '12px' }}>{inv.invoice_number}</td>
                        <td style={{ padding: '10px 14px' }}>{inv.user_email}</td>
                        <td style={{ padding: '10px 14px' }}>{inv.plan_name}</td>
                        <td style={{ padding: '10px 14px' }}>{inv.duration}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>\u20b9{inv.total_amount}</td>
                        <td style={{ padding: '10px 14px', color: inv.referral_code ? '#16a34a' : '#ccc' }}>{inv.referral_code || '\u2014'}</td>
                        <td style={{ padding: '10px 14px', color: '#888' }}>{new Date(inv.payment_date).toLocaleDateString('en-IN')}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{inv.status}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <button
                            onClick={async () => {
                              const supabase = (await import('@/lib/supabase/client')).createClient();
                              const { data: { session: s } } = await supabase.auth.getSession();
                              if (!s) return;
                              const res = await fetch('/api/invoice/' + inv.id + '/pdf', {
                                headers: { Authorization: 'Bearer ' + s.access_token },
                              });
                              if (res.ok) {
                                const blob = await res.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url; a.download = inv.invoice_number + '.pdf'; a.click();
                                URL.revokeObjectURL(url);
                              } else { alert('PDF download failed'); }
                            }}
                            style={{ padding: '4px 12px', background: '#6b4b3e', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                          >
                            \u2b07
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SUPPORT TAB */}
        {tab === 'support' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#3b2a22' }}>Support Requests</h2>
              <button
                onClick={async () => {
                  setSupportLoading(true);
                  const supabase = (await import('@/lib/supabase/client')).createClient();
                  const { data: { session: s } } = await supabase.auth.getSession();
                  if (!s) return;
                  const res = await fetch('/api/admin/support-emails', { headers: { Authorization: 'Bearer ' + s.access_token } });
                  if (res.ok) { const d = await res.json(); setSupportEmails(d.emails || []); }
                  setSupportLoading(false);
                }}
                style={{ padding: '8px 20px', background: '#6b4b3e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
              >
                {supportLoading ? 'Loading...' : 'Refresh Inbox'}
              </button>
            </div>

            {selectedEmail ? (
              <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <button onClick={() => { setSelectedEmail(null); setReplyText(''); }} style={{ marginBottom: '16px', padding: '6px 16px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Back to list</button>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#888' }}>From: <strong>{selectedEmail.from}</strong></div>
                  <div style={{ fontSize: '12px', color: '#888' }}>Date: {new Date(selectedEmail.date).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#3b2a22', marginTop: '8px' }}>{selectedEmail.subject}</div>
                </div>
                <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '10px', fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.6', marginBottom: '20px', maxHeight: '400px', overflow: 'auto' }}>
                  {selectedEmail.body || 'Loading...'}
                </div>
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#3b2a22', marginBottom: '8px' }}>Reply:</div>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    style={{ width: '100%', minHeight: '120px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  <button
                    disabled={replySending || !replyText.trim()}
                    onClick={async () => {
                      setReplySending(true);
                      const supabase = (await import('@/lib/supabase/client')).createClient();
                      const { data: { session: s } } = await supabase.auth.getSession();
                      if (!s) return;
                      const res = await fetch('/api/admin/support-emails', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.access_token },
                        body: JSON.stringify({ to: selectedEmail.from, subject: selectedEmail.subject, body: replyText }),
                      });
                      if (res.ok) { alert('Reply sent!'); setReplyText(''); }
                      else { const d = await res.json(); alert('Failed: ' + (d.error || 'Unknown error')); }
                      setReplySending(false);
                    }}
                    style={{ marginTop: '10px', padding: '10px 24px', background: replySending ? '#a8927e' : '#6b4b3e', color: 'white', border: 'none', borderRadius: '8px', cursor: replySending ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600 }}
                  >
                    {replySending ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {supportEmails.length === 0 ? (
                  <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <p style={{ color: '#888' }}>Click "Refresh Inbox" to load emails from support@advoverse.com</p>
                  </div>
                ) : (
                  <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    {supportEmails.map((email: any) => (
                      <div
                        key={email.uid}
                        onClick={async () => {
                          setSelectedEmail({ ...email, body: 'Loading...' });
                          const supabase = (await import('@/lib/supabase/client')).createClient();
                          const { data: { session: s } } = await supabase.auth.getSession();
                          if (!s) return;
                          const res = await fetch('/api/admin/support-emails?uid=' + email.uid, { headers: { Authorization: 'Bearer ' + s.access_token } });
                          if (res.ok) { const d = await res.json(); setSelectedEmail(d); }
                        }}
                        style={{ padding: '14px 20px', borderBottom: '1px solid #f0ebe4', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: email.seen ? 'white' : '#fefce8' }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: email.seen ? 400 : 700, color: '#3b2a22' }}>{email.fromName || email.from}</div>
                          <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>{email.subject}</div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#999', whiteSpace: 'nowrap' }}>{new Date(email.date).toLocaleDateString('en-IN')}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* BACKUP TAB */}
        {tab === 'backup' && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#3b2a22', marginBottom: '20px' }}>Data Backup</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              {/* PDF Download */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
                <h3 style={{ fontSize: '18px', color: '#3b2a22', marginBottom: '8px' }}>Download PDF</h3>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Human-readable report with all tables formatted for review.</p>
                <button
                  onClick={async () => {
                    const supabase = (await import('@/lib/supabase/client')).createClient();
                    const { data: { session: s } } = await supabase.auth.getSession();
                    if (!s) return;
                    const res = await fetch('/api/admin/backup?format=pdf', { headers: { Authorization: 'Bearer ' + s.access_token } });
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = 'advoverse_backup.pdf'; a.click();
                      URL.revokeObjectURL(url);
                    } else { alert('PDF backup failed'); }
                  }}
                  style={{ padding: '10px 28px', background: '#6b4b3e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
                >Download PDF</button>
              </div>
              {/* JSON Download */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
                <h3 style={{ fontSize: '18px', color: '#3b2a22', marginBottom: '8px' }}>Download JSON</h3>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Full data export for backup and restoration purposes.</p>
                <button
                  onClick={async () => {
                    const supabase = (await import('@/lib/supabase/client')).createClient();
                    const { data: { session: s } } = await supabase.auth.getSession();
                    if (!s) return;
                    const res = await fetch('/api/admin/backup?format=json', { headers: { Authorization: 'Bearer ' + s.access_token } });
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = 'advoverse_backup.json'; a.click();
                      URL.revokeObjectURL(url);
                    } else { alert('JSON backup failed'); }
                  }}
                  style={{ padding: '10px 28px', background: '#6b4b3e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
                >Download JSON</button>
              </div>
              {/* Restore */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>⬆️</div>
                <h3 style={{ fontSize: '18px', color: '#3b2a22', marginBottom: '8px' }}>Restore from JSON</h3>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Upload a backup JSON file to merge missing records.</p>
                <input
                  type="file"
                  accept=".json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!confirm('This will merge backup data into the database. Existing records will not be deleted. Continue?')) return;
                    const text = await file.text();
                    let json;
                    try { json = JSON.parse(text); } catch { alert('Invalid JSON file'); return; }
                    const supabase = (await import('@/lib/supabase/client')).createClient();
                    const { data: { session: s } } = await supabase.auth.getSession();
                    if (!s) return;
                    const res = await fetch('/api/admin/backup', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.access_token },
                      body: JSON.stringify(json),
                    });
                    const d = await res.json();
                    if (res.ok) { alert('Restore complete: ' + JSON.stringify(d.restored)); }
                    else { alert('Restore failed: ' + (d.error || 'Unknown error')); }
                  }}
                  style={{ marginTop: '8px' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* MANAGE PLANS TAB */}
        {tab === 'managePlans' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#3b2a22' }}>Manage Plans</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={async () => {
                    const supabase = (await import('@/lib/supabase/client')).createClient();
                    const { data: { session: s } } = await supabase.auth.getSession();
                    if (!s) return;
                    const res = await fetch('/api/admin/plans', { headers: { Authorization: 'Bearer ' + s.access_token } });
                    if (res.ok) { const d = await res.json(); setAdminPlans(d.plans || []); }
                  }}
                  style={{ padding: '8px 18px', background: '#6b4b3e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                >Load Plans</button>
                <button
                  onClick={() => setEditingPlan({ name: '', description: '', monthly_price: 0, quarterly_price: 0, yearly_price: 0, max_cases: 20, max_users: 1, features: [], is_popular: false, is_active: true, display_order: 0 })}
                  style={{ padding: '8px 18px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                >+ Add New Plan</button>
              </div>
            </div>

            {/* Plans Table */}
            {adminPlans.length > 0 && (
              <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ background: '#f8f5f0' }}>
                    <tr>
                      {['Name', 'Monthly', 'Quarterly', 'Yearly', 'Cases', 'Users', 'Features', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', color: '#6b4b3e', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adminPlans.map((plan: any) => (
                      <tr key={plan.id} style={{ borderBottom: '1px solid #f0ebe4', opacity: plan.is_active ? 1 : 0.5 }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{plan.name}</td>
                        <td style={{ padding: '10px 14px' }}>Rs.{plan.monthly_price}</td>
                        <td style={{ padding: '10px 14px' }}>Rs.{plan.quarterly_price}</td>
                        <td style={{ padding: '10px 14px' }}>Rs.{plan.yearly_price}</td>
                        <td style={{ padding: '10px 14px' }}>{plan.max_cases >= 999999 ? 'Unlim' : plan.max_cases}</td>
                        <td style={{ padding: '10px 14px' }}>{plan.max_users >= 999999 ? 'Unlim' : plan.max_users}</td>
                        <td style={{ padding: '10px 14px', fontSize: '11px' }}>{(plan.features || []).length} enabled</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: plan.is_active ? '#dcfce7' : '#fee2e2', color: plan.is_active ? '#166534' : '#991b1b' }}>
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <button onClick={() => setEditingPlan({...plan})} style={{ padding: '4px 10px', background: '#6b4b3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', marginRight: '6px' }}>Edit</button>
                          <button onClick={async () => {
                            if (!confirm('Deactivate ' + plan.name + '?')) return;
                            const supabase = (await import('@/lib/supabase/client')).createClient();
                            const { data: { session: s } } = await supabase.auth.getSession();
                            if (!s) return;
                            await fetch('/api/admin/plans', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.access_token }, body: JSON.stringify({ id: plan.id }) });
                            setAdminPlans(adminPlans.map((p: any) => p.id === plan.id ? {...p, is_active: false} : p));
                          }} style={{ padding: '4px 10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Del</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Edit/Add Modal */}
            {editingPlan && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: '18px', color: '#3b2a22', marginBottom: '20px' }}>{editingPlan.id ? 'Edit Plan' : 'Add New Plan'}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#3b2a22' }}>Plan Name</label>
                    <input value={editingPlan.name || ''} onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', marginTop: '4px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#3b2a22' }}>Description</label>
                    <input value={editingPlan.description || ''} onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', marginTop: '4px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#3b2a22' }}>Monthly Price (Rs.)</label>
                    <input type="number" value={editingPlan.monthly_price || 0} onChange={(e) => setEditingPlan({...editingPlan, monthly_price: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', marginTop: '4px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#3b2a22' }}>Quarterly Price (Rs.)</label>
                    <input type="number" value={editingPlan.quarterly_price || 0} onChange={(e) => setEditingPlan({...editingPlan, quarterly_price: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', marginTop: '4px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#3b2a22' }}>Yearly Price (Rs.)</label>
                    <input type="number" value={editingPlan.yearly_price || 0} onChange={(e) => setEditingPlan({...editingPlan, yearly_price: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', marginTop: '4px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#3b2a22' }}>Max Cases (0 = Unlimited)</label>
                    <input type="number" value={editingPlan.max_cases || 0} onChange={(e) => setEditingPlan({...editingPlan, max_cases: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', marginTop: '4px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#3b2a22' }}>Max Users (0 = Unlimited)</label>
                    <input type="number" value={editingPlan.max_users || 0} onChange={(e) => setEditingPlan({...editingPlan, max_users: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', marginTop: '4px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#3b2a22' }}>Display Order</label>
                    <input type="number" value={editingPlan.display_order || 0} onChange={(e) => setEditingPlan({...editingPlan, display_order: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', marginTop: '4px' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <input type="checkbox" checked={editingPlan.is_popular || false} onChange={(e) => setEditingPlan({...editingPlan, is_popular: e.target.checked})} /> Show "Popular" badge
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '8px' }}>
                    <input type="checkbox" checked={editingPlan.is_active !== false} onChange={(e) => setEditingPlan({...editingPlan, is_active: e.target.checked})} /> Active (show on pricing page)
                  </label>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', color: '#3b2a22', marginBottom: '12px' }}>Feature Permissions</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={editingPlan?.features?.includes('forms_drafting')} onChange={(e) => {
                            const f = editingPlan?.features || [];
                            setEditingPlan({...editingPlan, features: e.target.checked ? [...f, 'forms_drafting'] : f.filter((x: string) => x !== 'forms_drafting')});
                          }} />
                          Forms & Drafting
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={editingPlan?.features?.includes('compendium')} onChange={(e) => {
                            const f = editingPlan?.features || [];
                            setEditingPlan({...editingPlan, features: e.target.checked ? [...f, 'compendium'] : f.filter((x: string) => x !== 'compendium')});
                          }} />
                          Case Compendium
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={editingPlan?.features?.includes('study_material')} onChange={(e) => {
                            const f = editingPlan?.features || [];
                            setEditingPlan({...editingPlan, features: e.target.checked ? [...f, 'study_material'] : f.filter((x: string) => x !== 'study_material')});
                          }} />
                          Study Material
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={editingPlan?.features?.includes('appointments')} onChange={(e) => {
                            const f = editingPlan?.features || [];
                            setEditingPlan({...editingPlan, features: e.target.checked ? [...f, 'appointments'] : f.filter((x: string) => x !== 'appointments')});
                          }} />
                          Appointments Diary
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={editingPlan?.features?.includes('todo_lists')} onChange={(e) => {
                            const f = editingPlan?.features || [];
                            setEditingPlan({...editingPlan, features: e.target.checked ? [...f, 'todo_lists'] : f.filter((x: string) => x !== 'todo_lists')});
                          }} />
                          Todo Lists
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={editingPlan?.features?.includes('import_export')} onChange={(e) => {
                            const f = editingPlan?.features || [];
                            setEditingPlan({...editingPlan, features: e.target.checked ? [...f, 'import_export'] : f.filter((x: string) => x !== 'import_export')});
                          }} />
                          Import/Export
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={editingPlan?.features?.includes('multi_user')} onChange={(e) => {
                            const f = editingPlan?.features || [];
                            setEditingPlan({...editingPlan, features: e.target.checked ? [...f, 'multi_user'] : f.filter((x: string) => x !== 'multi_user')});
                          }} />
                          Multi-user Access
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={editingPlan?.features?.includes('detach_widgets')} onChange={(e) => {
                            const f = editingPlan?.features || [];
                            setEditingPlan({...editingPlan, features: e.target.checked ? [...f, 'detach_widgets'] : f.filter((x: string) => x !== 'detach_widgets')});
                          }} />
                          Detach & Widgets
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={editingPlan?.features?.includes('chatroom')} onChange={(e) => {
                            const f = editingPlan?.features || [];
                            setEditingPlan({...editingPlan, features: e.target.checked ? [...f, 'chatroom'] : f.filter((x: string) => x !== 'chatroom')});
                          }} />
                          Internal Chatroom
                        </label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setEditingPlan(null)} style={{ padding: '10px 24px', background: '#f3f4f6', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                  <button
                    onClick={async () => {
                      const supabase = (await import('@/lib/supabase/client')).createClient();
                      const { data: { session: s } } = await supabase.auth.getSession();
                      if (!s) return;
                      const method = editingPlan.id ? 'PATCH' : 'POST';
                      const res = await fetch('/api/admin/plans', {
                        method,
                        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.access_token },
                        body: JSON.stringify(editingPlan),
                      });
                      if (res.ok) {
                        alert(editingPlan.id ? 'Plan updated!' : 'Plan created!');
                        setEditingPlan(null);
                        // Reload plans
                        const r2 = await fetch('/api/admin/plans', { headers: { Authorization: 'Bearer ' + s.access_token } });
                        if (r2.ok) { const d = await r2.json(); setAdminPlans(d.plans || []); }
                      } else {
                        const d = await res.json();
                        alert('Failed: ' + (d.error || 'Unknown error'));
                      }
                    }}
                    style={{ padding: '10px 24px', background: '#6b4b3e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
                  >{editingPlan.id ? 'Save Changes' : 'Create Plan'}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AUDIT LOG TAB */}
        {tab === 'auditLog' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#3b2a22' }}>Audit Log</h2>
              <button
                onClick={async () => {
                  const supabase = (await import('@/lib/supabase/client')).createClient();
                  const { data: { session: s } } = await supabase.auth.getSession();
                  if (!s) return;
                  const res = await fetch('/api/admin/data', { headers: { Authorization: 'Bearer ' + s.access_token } });
                  if (res.ok) { const d = await res.json(); setAuditLogs(d.auditLogs || []); }
                }}
                style={{ padding: '8px 18px', background: '#6b4b3e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
              >Load Logs</button>
            </div>
            {auditLogs.length === 0 ? (
              <p style={{ color: '#888' }}>Click "Load Logs" to view admin activity.</p>
            ) : (
              <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ background: '#f8f5f0' }}>
                    <tr>
                      {['Action', 'Admin', 'IP', 'Details', 'Time'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', color: '#6b4b3e', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f0ebe4' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: log.action.includes('FAILED') ? '#dc2626' : '#166534' }}>{log.action}</td>
                        <td style={{ padding: '10px 14px' }}>{log.admin_email}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '11px' }}>{log.ip_address}</td>
                        <td style={{ padding: '10px 14px', color: '#666' }}>{log.details}</td>
                        <td style={{ padding: '10px 14px', color: '#888', fontSize: '12px' }}>{new Date(log.created_at).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* BROADCAST TAB */}
        {tab === 'broadcast' && (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#3b2a22', marginBottom: '20px' }}>Broadcast Message</h2>
            
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', color: '#3b2a22', marginBottom: '16px' }}>Send New Message</h3>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#3b2a22' }}>Message (max 200 chars)</label>
                <input value={bcMsg} onChange={(e) => setBcMsg(e.target.value.slice(0, 200))} placeholder="Type your broadcast message..." style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', marginTop: '4px', fontSize: '14px', boxSizing: 'border-box' }} />
                <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{bcMsg.length}/200</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Style</label>
                  <select value={bcStyle} onChange={(e) => setBcStyle(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', marginTop: '4px' }}>
                    <option value="info">Info (Blue)</option>
                    <option value="sale">Sale (Green)</option>
                    <option value="alert">Alert (Red)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Target</label>
                  <select value={bcTarget} onChange={(e) => setBcTarget(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', marginTop: '4px' }}>
                    <option value="all">All Users</option>
                    <option value="specific">Specific Users</option>
                    <option value="plan">By Plan</option>
                    <option value="status">By Status</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Expires in</label>
                  <select value={bcExpiry} onChange={(e) => setBcExpiry(parseInt(e.target.value))} style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', marginTop: '4px' }}>
                    <option value={1}>1 day</option>
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Target List</label>
                  <input value={bcTargetList} onChange={(e) => setBcTargetList(e.target.value)} placeholder={bcTarget === 'specific' ? 'email1, email2' : bcTarget === 'plan' ? 'Plan Name' : bcTarget === 'status' ? 'active/trial/expired' : 'N/A for All'} disabled={bcTarget === 'all'} style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <button
                disabled={!bcMsg.trim()}
                onClick={async () => {
                  const supabase = (await import('@/lib/supabase/client')).createClient();
                  const { data: { session: s } } = await supabase.auth.getSession();
                  if (!s) return;
                  const targetList = bcTarget === 'all' ? [] : bcTargetList.split(',').map(s => s.trim()).filter(Boolean);
                  const res = await fetch('/api/admin/broadcast', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.access_token },
                    body: JSON.stringify({ message: bcMsg, style: bcStyle, target_type: bcTarget, target_list: targetList, expires_in_days: bcExpiry }),
                  });
                  if (res.ok) { alert('Broadcast sent!'); setBcMsg(''); }
                  else { const d = await res.json(); alert('Failed: ' + d.error); }
                }}
                style={{ padding: '10px 28px', background: '#6b4b3e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
              >Send Broadcast</button>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', color: '#3b2a22' }}>Message History</h3>
                <button onClick={async () => {
                  const supabase = (await import('@/lib/supabase/client')).createClient();
                  const { data: { session: s } } = await supabase.auth.getSession();
                  if (!s) return;
                  const res = await fetch('/api/admin/broadcast', { headers: { Authorization: 'Bearer ' + s.access_token } });
                  if (res.ok) { const d = await res.json(); setBroadcasts(d.messages || []); }
                }} style={{ padding: '6px 14px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Refresh</button>
              </div>
              {broadcasts.map((b: any) => (
                <div key={b.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f0ebe4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#333' }}>{b.message}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                      {b.target_type} | {b.style} | {new Date(b.created_at).toLocaleDateString('en-IN')} | {b.is_active ? 'Active' : 'Expired'}
                    </div>
                  </div>
                  {b.is_active && (
                    <button onClick={async () => {
                      const supabase = (await import('@/lib/supabase/client')).createClient();
                      const { data: { session: s } } = await supabase.auth.getSession();
                      if (!s) return;
                      await fetch('/api/admin/broadcast', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.access_token }, body: JSON.stringify({ id: b.id }) });
                      setBroadcasts(broadcasts.map((x: any) => x.id === b.id ? {...x, is_active: false} : x));
                    }} style={{ padding: '4px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Deactivate</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── REPORTS TAB ── */}
        {tab === 'reports' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#3b2a22', margin: 0 }}>🐛 User Reports</h2>
              <button onClick={loadReports} disabled={reportsLoading}
                style={{ padding: '8px 18px', background: '#6b4b3e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                {reportsLoading ? 'Loading...' : '🔄 Refresh'}
              </button>
            </div>
            <p style={{ color: '#888', marginBottom: '20px', fontSize: '15px' }}>View and respond to bug reports and suggestions from Caseline users.</p>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {[
                { label: 'Total', count: reports.length, bg: '#f3f4f6', color: '#374151' },
                { label: '🔴 New', count: reports.filter(r => r.status === 'New').length, bg: '#fee2e2', color: '#991b1b' },
                { label: '🟡 Working', count: reports.filter(r => r.status === 'Working').length, bg: '#fef9c3', color: '#854d0e' },
                { label: '🟠 Query', count: reports.filter(r => r.status === 'Query').length, bg: '#ffedd5', color: '#9a3412' },
                { label: '🟢 Resolved', count: reports.filter(r => r.status === 'Resolved').length, bg: '#dcfce7', color: '#166534' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, padding: '12px 20px', borderRadius: '10px', textAlign: 'center', minWidth: '90px' }}>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: '12px', color: s.color, marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
              {['all', 'New', 'Working', 'Query', 'Resolved', 'Closed'].map(f => (
                <button key={f} onClick={() => setReportFilter(f)}
                  style={{ padding: '6px 14px', borderRadius: '6px', border: reportFilter === f ? '2px solid #6b4b3e' : '1px solid #e5e7eb', background: reportFilter === f ? '#6b4b3e' : 'white', color: reportFilter === f ? 'white' : '#555', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>

            {/* Detail Panel */}
            {selectedReport && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '24px', border: '2px solid #6b4b3e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', color: '#3b2a22', margin: '0 0 6px 0' }}>
                      {selectedReport.type === 'Bug Report' ? '🐛' : '💡'} {selectedReport.subject}
                    </h3>
                    <div style={{ fontSize: '13px', color: '#888', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span>From: <strong>{selectedReport.user_email}</strong> ({selectedReport.user_name})</span>
                      <span>{new Date(selectedReport.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {selectedReport.app_version && <span>v{selectedReport.app_version}</span>}
                      {selectedReport.machine_id && <span>Machine: {selectedReport.machine_id.substring(0, 12)}...</span>}
                    </div>
                  </div>
                  <button onClick={() => { setSelectedReport(null); setReportReplies([]); }}
                    style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>✖</button>
                </div>

                {/* Status & Priority Controls */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#888', display: 'block', marginBottom: '4px' }}>STATUS</label>
                    <select value={selectedReport.status} onChange={e => updateReportStatus(selectedReport.id, e.target.value)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '2px solid #e5e7eb', fontSize: '13px', fontWeight: 600 }}>
                      <option value="New">🔴 New</option>
                      <option value="Working">🟡 Working</option>
                      <option value="Query">🟠 Query</option>
                      <option value="Resolved">🟢 Resolved</option>
                      <option value="Closed">⚫ Closed</option>
                      <option value="Dismissed">⚪ Dismissed</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#888', display: 'block', marginBottom: '4px' }}>PRIORITY</label>
                    <select value={selectedReport.priority || 'normal'} onChange={e => updateReportPriority(selectedReport.id, e.target.value)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '2px solid #e5e7eb', fontSize: '13px', fontWeight: 600 }}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">🔺 High</option>
                      <option value="critical">🔴 Critical</option>
                    </select>
                  </div>
                </div>

                {/* Original Report */}
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '14px', marginBottom: '16px', borderLeft: '3px solid #6b4b3e' }}>
                  <div style={{ fontSize: '11px', color: '#888', fontWeight: 600, marginBottom: '6px' }}>ORIGINAL REPORT:</div>
                  <div style={{ fontSize: '14px', color: '#333', whiteSpace: 'pre-wrap' }}>{selectedReport.details}</div>
                </div>

                {/* Conversation Thread */}
                {reportReplies.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#888', fontWeight: 600, marginBottom: '10px' }}>CONVERSATION ({reportReplies.length}):</div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {reportReplies.map((r: any) => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: r.sender_type === 'admin' ? 'flex-start' : 'flex-end' }}>
                          <div style={{
                            maxWidth: '80%', padding: '10px 14px',
                            borderRadius: r.sender_type === 'admin' ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                            background: r.sender_type === 'admin' ? '#6b4b3e' : '#e8eef8',
                            color: r.sender_type === 'admin' ? 'white' : '#1a1a2e',
                          }}>
                            <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap' }}>{r.body}</div>
                            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
                              {r.sender_type === 'admin' ? '🔵 You' : '👤 User'} · {new Date(r.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              {r.read_at && r.sender_type === 'admin' ? ' ✓ Read' : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reply Box */}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '14px' }}>
                  <textarea value={reportReplyText} onChange={e => setReportReplyText(e.target.value)}
                    placeholder="Type your reply to the user..."
                    rows={3}
                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                  {/* Quick Replies */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {[
                      { label: '📸 Ask screenshot', text: 'Can you please share a screenshot of the issue?' },
                      { label: '✅ Fixed in update', text: 'This has been fixed. Please update to the latest version.' },
                      { label: '❓ More info', text: 'Can you provide more details about when this happens?' },
                      { label: '🔄 Try restart', text: 'Please try restarting the application and let me know if the issue persists.' },
                    ].map(q => (
                      <button key={q.label} onClick={() => setReportReplyText(q.text)}
                        style={{ padding: '4px 10px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: '#555' }}>
                        {q.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button onClick={() => { updateReportStatus(selectedReport.id, 'Resolved'); }}
                      style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                      🟢 Mark Resolved
                    </button>
                    <button onClick={() => sendReportReply(selectedReport.id)} disabled={reportReplyLoading || !reportReplyText.trim()}
                      style={{ padding: '8px 16px', background: reportReplyLoading || !reportReplyText.trim() ? '#a8927e' : '#6b4b3e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                      {reportReplyLoading ? 'Sending...' : 'Send Reply ▶'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bug Reports Table */}
            {(() => {
              const bugReports = reports.filter(r => r.type === 'Bug Report' && (reportFilter === 'all' || r.status === reportFilter));
              return (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '16px', color: '#3b2a22', marginBottom: '12px', fontWeight: 600 }}>🐛 Bug Reports ({bugReports.length})</h3>
                  {bugReports.length === 0 ? (
                    <div style={{ background: 'white', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#888' }}>
                      {reportsLoading ? '⏳ Loading...' : reports.length === 0 ? 'Click Refresh to load reports' : 'No bug reports match this filter'}
                    </div>
                  ) : (
                    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Date</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#555' }}>User</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Subject</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#555' }}>Status</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#555' }}>Priority</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#555' }}>Replies</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#555' }}>Open</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bugReports.map((r: any) => {
                            const statusColors: Record<string, string> = { New: '#fee2e2', Working: '#fef9c3', Query: '#ffedd5', Resolved: '#dcfce7', Closed: '#f3f4f6', Dismissed: '#f3f4f6' };
                            const statusIcons: Record<string, string> = { New: '🔴', Working: '🟡', Query: '🟠', Resolved: '🟢', Closed: '⚫', Dismissed: '⚪' };
                            const prioIcons: Record<string, string> = { low: '⬇️', normal: '➖', high: '🔺', critical: '🔴' };
                            return (
                              <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                                onClick={() => { setSelectedReport(r); loadReportReplies(r.id); }}
                                onMouseOver={e => ((e.currentTarget as HTMLElement).style.background = '#faf8f6')}
                                onMouseOut={e => ((e.currentTarget as HTMLElement).style.background = 'white')}>
                                <td style={{ padding: '10px 14px', color: '#888' }}>{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                                <td style={{ padding: '10px 14px' }}>{r.user_email}</td>
                                <td style={{ padding: '10px 14px', fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subject}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  <span style={{ background: statusColors[r.status] || '#f3f4f6', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                                    {statusIcons[r.status] || ''} {r.status}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px' }}>{prioIcons[r.priority] || '➖'}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  {r.reply_count || 0}
                                  {r.unread_count > 0 && <span style={{ background: '#dc3545', color: 'white', borderRadius: '50%', padding: '1px 5px', fontSize: '10px', marginLeft: '4px' }}>{r.unread_count}</span>}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>→</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Suggestions & Other Table */}
            {(() => {
              const suggestions = reports.filter(r => (r.type === 'Suggestion' || r.type === 'Other') && (reportFilter === 'all' || r.status === reportFilter));
              return (
                <div>
                  <h3 style={{ fontSize: '16px', color: '#3b2a22', marginBottom: '12px', fontWeight: 600 }}>💡 Suggestions & Other ({suggestions.length})</h3>
                  {suggestions.length === 0 ? (
                    <div style={{ background: 'white', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#888' }}>
                      {reports.length === 0 ? 'Click Refresh to load reports' : 'No suggestions match this filter'}
                    </div>
                  ) : (
                    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Date</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#555' }}>User</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Subject</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#555' }}>Status</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#555' }}>Type</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#555' }}>Replies</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#555' }}>Open</th>
                          </tr>
                        </thead>
                        <tbody>
                          {suggestions.map((r: any) => {
                            const statusColors: Record<string, string> = { New: '#fee2e2', Working: '#fef9c3', Query: '#ffedd5', Resolved: '#dcfce7', Closed: '#f3f4f6', Dismissed: '#f3f4f6' };
                            const statusIcons: Record<string, string> = { New: '🔴', Working: '🟡', Query: '🟠', Resolved: '🟢', Closed: '⚫', Dismissed: '⚪' };
                            return (
                              <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                                onClick={() => { setSelectedReport(r); loadReportReplies(r.id); }}
                                onMouseOver={e => ((e.currentTarget as HTMLElement).style.background = '#faf8f6')}
                                onMouseOut={e => ((e.currentTarget as HTMLElement).style.background = 'white')}>
                                <td style={{ padding: '10px 14px', color: '#888' }}>{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                                <td style={{ padding: '10px 14px' }}>{r.user_email}</td>
                                <td style={{ padding: '10px 14px', fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subject}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  <span style={{ background: statusColors[r.status] || '#f3f4f6', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                                    {statusIcons[r.status] || ''} {r.status}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px' }}>{r.type}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  {r.reply_count || 0}
                                  {r.unread_count > 0 && <span style={{ background: '#dc3545', color: 'white', borderRadius: '50%', padding: '1px 5px', fontSize: '10px', marginLeft: '4px' }}>{r.unread_count}</span>}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>→</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}


      </main>
    </div>
  );
}
