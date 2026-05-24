'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  profile: {
    name: string | null;
  } | null;
  licenses: {
    id: number;
    plan_name: string;
    is_active: boolean;
    expires_at: string | null;
  }[];
  totalSpent: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || session.user.email !== 'shubham.sakarwal@gmail.com') {
        router.push('/');
        return;
      }

      await fetchUsers();
    };

    checkAuth();
  }, [router]);

  const fetchUsers = async () => {
    const supabase = createClient();

    // Get all users from auth
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();

    if (!authUsers) {
      setLoading(false);
      return;
    }

    // Get profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name');

    // Get licenses for each user
    const { data: licenses } = await supabase
      .from('licenses')
      .select('id, user_id, plan_name, is_active, expires_at');

    // Get orders for total spent
    const { data: orders } = await supabase
      .from('orders')
      .select('user_id, amount')
      .eq('status', 'paid');

    // Combine data
    const usersWithData = authUsers.map(user => {
      const userProfile = profiles?.find(p => p.id === user.id);
      const userLicenses = licenses?.filter(l => l.user_id === user.id) || [];
      const userOrders = orders?.filter(o => o.user_id === user.id) || [];
      const totalSpent = userOrders.reduce((sum, order) => sum + order.amount, 0);

      return {
        id: user.id,
        email: user.email || 'No email',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        profile: userProfile || null,
        licenses: userLicenses,
        totalSpent,
      };
    });

    // Sort by created date (newest first)
    usersWithData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setUsers(usersWithData);
    setLoading(false);
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f4ef' }}>
        <div className="text-2xl" style={{ color: '#3b2a22' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f4ef', fontFamily: 'Inter, sans-serif' }}>
      {/* HEADER */}
      <header style={{ background: '#3b2a22', padding: '24px 0', color: 'white' }}>
        <div className="max-w-[1400px] mx-auto w-[90%]">
          <div className="flex justify-between items-center">
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px' }}>
              ⚖ Admin Dashboard
            </h1>
            <div className="flex gap-4">
              <a href="/admin" className="px-4 py-2 rounded-lg transition-colors" style={{ background: '#6b4b3e', color: 'white', textDecoration: 'none' }}>
                Dashboard
              </a>
              <a href="/admin/licenses" className="px-4 py-2 rounded-lg transition-colors" style={{ background: '#6b4b3e', color: 'white', textDecoration: 'none' }}>
                Licenses
              </a>
              <a href="/admin/machines" className="px-4 py-2 rounded-lg transition-colors" style={{ background: '#6b4b3e', color: 'white', textDecoration: 'none' }}>
                Machines
              </a>
              <a href="/admin/users" className="px-4 py-2 rounded-lg" style={{ background: '#f59e0b', color: '#000', textDecoration: 'none', fontWeight: 600 }}>
                Users
              </a>
              <a href="/admin/sales" className="px-4 py-2 rounded-lg transition-colors" style={{ background: '#6b4b3e', color: 'white', textDecoration: 'none' }}>
                Sales
              </a>
              <a href="/" className="px-4 py-2 rounded-lg transition-colors" style={{ background: '#6b4b3e', color: 'white', textDecoration: 'none' }}>
                Exit Admin
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="py-12">
        <div className="max-w-[1400px] mx-auto w-[90%]">
          <div className="mb-8">
            <h2 className="mb-4" style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', color: '#3b2a22' }}>
              Users Management
            </h2>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Total Users</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b2a22' }}>{users.length}</div>
              </div>
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Users with Licenses</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#16a34a' }}>
                  {users.filter(u => u.licenses.length > 0).length}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>New This Month</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f59e0b' }}>
                  {users.filter(u => {
                    const created = new Date(u.created_at);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                  }).length}
                </div>
              </div>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-3 rounded-xl"
              style={{ border: '2px solid #cbb8a4', fontSize: '16px' }}
            />
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <table className="w-full">
              <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <tr>
                  <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>User</th>
                  <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Licenses</th>
                  <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Total Spent</th>
                  <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Joined</th>
                  <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Last Sign In</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td className="px-6 py-4">
                      <div style={{ fontWeight: 600, color: '#111827' }}>{user.profile?.name || 'N/A'}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {user.licenses.length > 0 ? (
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{user.licenses.length} license{user.licenses.length !== 1 ? 's' : ''}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {user.licenses.filter(l => l.is_active).length} active
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>No licenses</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div style={{ fontWeight: 600, color: '#16a34a', fontSize: '16px' }}>
                        ₹{user.totalSpent.toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ color: '#4b5563', fontSize: '14px' }}>
                      {new Date(user.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4" style={{ color: '#4b5563', fontSize: '14px' }}>
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString('en-IN')
                        : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-12" style={{ color: '#6b7280' }}>
                No users found
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
