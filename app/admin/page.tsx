'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalRevenue: number;
  activeLicenses: number;
  totalUsers: number;
  thisMonthRevenue: number;
  expiringSoon: number;
}

interface RecentTransaction {
  id: number;
  created_at: string;
  user_email: string;
  plan_name: string;
  amount: number;
  status: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/');
      return;
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (!adminUser) {
      alert('Access Denied: Admin privileges required');
      router.push('/');
      return;
    }

    setIsAdmin(true);
    await loadDashboardData();
  };

  const loadDashboardData = async () => {
    const supabase = createClient();

    // Get all orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'paid');

    // Get all licenses
    const { data: licenses } = await supabase
      .from('licenses')
      .select('*');

    // Get all users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*');

    // Calculate stats
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.amount / 100), 0) || 0;
    const activeLicenses = licenses?.filter(l => l.is_active && (!l.expires_at || new Date(l.expires_at) > new Date())).length || 0;
    const totalUsers = profiles?.length || 0;

    // This month revenue
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthRevenue = orders?.filter(o => new Date(o.created_at) >= thisMonth)
      .reduce((sum, order) => sum + (order.amount / 100), 0) || 0;

    // Expiring soon (within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const expiringSoon = licenses?.filter(l => 
      l.is_active && 
      l.expires_at && 
      new Date(l.expires_at) <= sevenDaysFromNow &&
      new Date(l.expires_at) > new Date()
    ).length || 0;

    setStats({
      totalRevenue,
      activeLicenses,
      totalUsers,
      thisMonthRevenue,
      expiringSoon,
    });

    // Get recent transactions with user emails
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        plan_name,
        amount,
        status,
        profiles!orders_user_id_fkey (
          id
        )
      `)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get user emails from auth.users
    if (recentOrders) {
      const userIds = recentOrders.map(o => o.profiles?.id).filter(Boolean);
      const { data: users } = await supabase.auth.admin.listUsers();
      
      const transactions = recentOrders.map(order => ({
        id: order.id,
        created_at: order.created_at,
        user_email: users?.users.find(u => u.id === order.profiles?.id)?.email || 'Unknown',
        plan_name: order.plan_name,
        amount: order.amount,
        status: order.status,
      }));

      setRecentTransactions(transactions);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f4ef' }}>
        <div className="text-center">
          <div className="text-2xl mb-4" style={{ color: '#3b2a22' }}>Loading Admin Dashboard...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#6b4b3e' }}></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f4ef', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#3b2a22', padding: '20px 0', borderBottom: '2px solid #6b4b3e' }}>
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', color: '#f59e0b', marginBottom: '4px' }}>
                ⚖ Advoverse Admin
              </h1>
              <p style={{ color: '#d1d5db', fontSize: '14px' }}>License Management Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="px-4 py-2 rounded-lg transition-colors" style={{ background: '#6b4b3e', color: 'white', textDecoration: 'none' }}>
                View Website
              </a>
              <button onClick={handleSignOut} className="px-4 py-2 rounded-lg transition-colors" style={{ background: '#dc2626', color: 'white' }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex gap-8 py-4">
            <a href="/admin" className="font-semibold" style={{ color: '#f59e0b', borderBottom: '2px solid #f59e0b', paddingBottom: '4px' }}>
              Dashboard
            </a>
            <a href="/admin/licenses" className="transition-colors" style={{ color: '#6b7280' }} onMouseEnter={(e) => e.currentTarget.style.color = '#3b2a22'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
              Licenses
            </a>
            <a href="/admin/users" className="transition-colors" style={{ color: '#6b7280' }} onMouseEnter={(e) => e.currentTarget.style.color = '#3b2a22'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
              Users
            </a>
            <a href="/admin/sales" className="transition-colors" style={{ color: '#6b7280' }} onMouseEnter={(e) => e.currentTarget.style.color = '#3b2a22'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
              Sales
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Revenue</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#3b2a22' }}>₹{stats?.totalRevenue.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>All time</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Active Licenses</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#3b2a22' }}>{stats?.activeLicenses}</div>
            <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>Currently active</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Users</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#3b2a22' }}>{stats?.totalUsers}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Registered</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>This Month</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#3b2a22' }}>₹{stats?.thisMonthRevenue.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>Revenue</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Expiring Soon</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#dc2626' }}>{stats?.expiringSoon}</div>
            <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>Within 7 days</div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
          <div className="p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#3b2a22' }}>Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th className="text-left p-4" style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Date</th>
                  <th className="text-left p-4" style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>User</th>
                  <th className="text-left p-4" style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Plan</th>
                  <th className="text-left p-4" style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Amount</th>
                  <th className="text-left p-4" style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td className="p-4" style={{ fontSize: '14px', color: '#3b2a22' }}>
                      {new Date(transaction.created_at).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="p-4" style={{ fontSize: '14px', color: '#3b2a22' }}>{transaction.user_email}</td>
                    <td className="p-4" style={{ fontSize: '14px', color: '#3b2a22' }}>{transaction.plan_name}</td>
                    <td className="p-4" style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a' }}>
                      ₹{(transaction.amount / 100).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#dcfce7', color: '#166534' }}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
