'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface License {
  id: number;
  license_key: string;
  plan_name: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  user_id: string;
  user_email: string;
  user_name: string;
  auto_renewal_enabled: boolean;
  machine_id?: string;
  machine_name?: string;
  last_seen_at?: string;
}

export default function AdminLicenses() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  useEffect(() => {
    filterLicenses();
  }, [searchTerm, filterStatus, licenses]);

  const checkAdminAndLoadData = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/');
      return;
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (!adminUser) {
      alert('Access Denied');
      router.push('/');
      return;
    }

    await loadLicenses();
  };

  const loadLicenses = async () => {
    const supabase = createClient();

    // Get all licenses with user info
    const { data: licensesData } = await supabase
      .from('licenses')
      .select(`
        *,
        profiles!licenses_user_id_fkey (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    // Get user emails from auth
    const { data: users } = await supabase.auth.admin.listUsers();

    // Get active machines for each license
    const { data: activations } = await supabase
      .from('license_activations')
      .select('*')
      .eq('is_active', true);

    const licensesWithDetails = licensesData?.map(license => {
      const user = users?.users.find(u => u.id === license.user_id);
      const activation = activations?.find(a => a.license_id === license.id);

      return {
        ...license,
        user_email: user?.email || 'Unknown',
        user_name: license.profiles?.name || 'Unknown',
        machine_id: activation?.machine_id,
        machine_name: activation?.machine_name,
        last_seen_at: activation?.last_seen_at,
      };
    }) || [];

    setLicenses(licensesWithDetails);
    setFilteredLicenses(licensesWithDetails);
    setLoading(false);
  };

  const filterLicenses = () => {
    let filtered = [...licenses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(l =>
        l.license_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.plan_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      const now = new Date();
      filtered = filtered.filter(l => {
        if (filterStatus === 'active') {
          return l.is_active && (!l.expires_at || new Date(l.expires_at) > now);
        } else if (filterStatus === 'expired') {
          return l.expires_at && new Date(l.expires_at) <= now;
        } else if (filterStatus === 'expiring') {
          const sevenDays = new Date();
          sevenDays.setDate(sevenDays.getDate() + 7);
          return l.is_active && l.expires_at && new Date(l.expires_at) <= sevenDays && new Date(l.expires_at) > now;
        }
        return true;
      });
    }

    setFilteredLicenses(filtered);
  };

  const getStatusBadge = (license: License) => {
    if (!license.is_active) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#fee2e2', color: '#991b1b' }}>Revoked</span>;
    }

    if (!license.expires_at) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#dbeafe', color: '#1e40af' }}>Lifetime</span>;
    }

    const now = new Date();
    const expiry = new Date(license.expires_at);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (expiry <= now) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#fee2e2', color: '#991b1b' }}>Expired</span>;
    } else if (daysUntilExpiry <= 7) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#fef3c7', color: '#92400e' }}>Expiring Soon</span>;
    } else {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#dcfce7', color: '#166534' }}>Active</span>;
    }
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return 'Lifetime';
    const now = new Date();
    const expiry = new Date(expiresAt);
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Expired';
    return `${days} days`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f4ef' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#6b4b3e' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f4ef', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#3b2a22', padding: '20px 0', borderBottom: '2px solid #6b4b3e' }}>
        <div className="max-w-[1400px] mx-auto px-6">
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', color: '#f59e0b' }}>
            ⚖ License Management
          </h1>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex gap-8 py-4">
            <a href="/admin" className="transition-colors" style={{ color: '#6b7280' }}>Dashboard</a>
            <a href="/admin/licenses" className="font-semibold" style={{ color: '#f59e0b', borderBottom: '2px solid #f59e0b', paddingBottom: '4px' }}>Licenses</a>
            <a href="/admin/users" className="transition-colors" style={{ color: '#6b7280' }}>Users</a>
            <a href="/admin/sales" className="transition-colors" style={{ color: '#6b7280' }}>Sales</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Search by key, email, name, or plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[300px] px-4 py-2 rounded-lg"
              style={{ border: '1px solid #e5e7eb', outline: 'none' }}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg"
              style={{ border: '1px solid #e5e7eb', outline: 'none' }}
            >
              <option value="all">All Licenses</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Licenses Table */}
        <div className="bg-white rounded-2xl shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
          <div className="p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex justify-between items-center">
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#3b2a22' }}>
                All Licenses ({filteredLicenses.length})
              </h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th className="text-left p-4" style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>License Key</th>
                  <th className="text-left p-4" style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>User</th>
                  <th className="text-left p-4" style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Plan</th>
                  <th className="text-left p-4" style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Expires</th>
                  <th className="text-left p-4" style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Machine</th>
                  <th className="text-left p-4" style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLicenses.map((license) => (
                  <tr key={license.id} style={{ borderBottom: '1px solid #e5e7eb' }} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 600, color: '#3b2a22' }}>
                        {license.license_key}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                        Created: {new Date(license.created_at).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="p-4">
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#3b2a22' }}>{license.user_name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{license.user_email}</div>
                    </td>
                    <td className="p-4">
                      <div style={{ fontSize: '14px', color: '#3b2a22' }}>{license.plan_name}</div>
                      {license.auto_renewal_enabled && (
                        <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>🔄 Auto-renewal ON</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div style={{ fontSize: '14px', color: '#3b2a22' }}>
                        {license.expires_at ? new Date(license.expires_at).toLocaleDateString('en-IN') : 'Never'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {getDaysRemaining(license.expires_at)}
                      </div>
                    </td>
                    <td className="p-4">
                      {license.machine_name ? (
                        <>
                          <div style={{ fontSize: '14px', color: '#3b2a22' }}>{license.machine_name}</div>
                          <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>
                            {license.machine_id?.substring(0, 16)}...
                          </div>
                          {license.last_seen_at && (
                            <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>
                              Last seen: {new Date(license.last_seen_at).toLocaleDateString('en-IN')}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ fontSize: '13px', color: '#9ca3af' }}>Not activated</div>
                      )}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(license)}
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
