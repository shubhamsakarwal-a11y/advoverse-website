'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface MachineActivation {
  id: string;
  license_id: number;
  machine_id: string;
  machine_name: string;
  ip_address: string | null;
  activated_at: string;
  last_validated_at: string | null;
  is_active: boolean;
  deactivated_at: string | null;
  license: {
    license_key: string;
    plan_name: string;
    expires_at: string | null;
  };
  profile: {
    name: string | null;
    email: string;
  };
}

interface TransferRequest {
  id: string;
  license_id: number;
  old_machine_name: string;
  new_machine_name: string;
  new_machine_ip: string | null;
  status: string;
  requested_at: string;
  processed_at: string | null;
  license: {
    license_key: string;
    plan_name: string;
  };
  profile: {
    name: string | null;
    email: string;
  };
}

interface BlockedMachine {
  id: string;
  machine_id: string;
  machine_name: string;
  ip_address: string | null;
  reason: string;
  blocked_at: string;
  license: {
    license_key: string;
    plan_name: string;
  };
  profile: {
    name: string | null;
    email: string;
  };
}

export default function AdminMachinesPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'transfers' | 'blocked'>('active');
  const [activeMachines, setActiveMachines] = useState<MachineActivation[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [blockedMachines, setBlockedMachines] = useState<BlockedMachine[]>([]);
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

      await fetchData();
    };

    checkAuth();
  }, [router]);

  const fetchData = async () => {
    const supabase = createClient();

    // Fetch active machines
    const { data: activations } = await supabase
      .from('license_activations')
      .select(`
        *,
        licenses!inner (
          license_key,
          plan_name,
          expires_at,
          user_id
        )
      `)
      .eq('is_active', true)
      .order('activated_at', { ascending: false });

    // Fetch user profiles for activations
    if (activations) {
      const userIds = [...new Set(activations.map((a: any) => a.licenses.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const { data: { users } } = await supabase.auth.admin.listUsers();

      const activationsWithProfiles = activations.map((activation: any) => ({
        ...activation,
        license: activation.licenses,
        profile: {
          name: profiles?.find((p: any) => p.id === activation.licenses.user_id)?.name || null,
          email: users?.find((u: any) => u.id === activation.licenses.user_id)?.email || 'Unknown',
        },
      }));

      setActiveMachines(activationsWithProfiles);
    }

    // Fetch transfer requests
    const { data: transfers } = await supabase
      .from('transfer_requests')
      .select(`
        *,
        licenses!inner (
          license_key,
          plan_name,
          user_id
        )
      `)
      .order('requested_at', { ascending: false });

    if (transfers) {
      const userIds = [...new Set(transfers.map((t: any) => t.licenses.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const { data: { users } } = await supabase.auth.admin.listUsers();

      const transfersWithProfiles = transfers.map((transfer: any) => ({
        ...transfer,
        license: transfer.licenses,
        profile: {
          name: profiles?.find((p: any) => p.id === transfer.licenses.user_id)?.name || null,
          email: users?.find((u: any) => u.id === transfer.licenses.user_id)?.email || 'Unknown',
        },
      }));

      setTransferRequests(transfersWithProfiles);
    }

    // Fetch blocked machines
    const { data: blocked } = await supabase
      .from('blocked_machines')
      .select(`
        *,
        licenses!inner (
          license_key,
          plan_name,
          user_id
        )
      `)
      .order('blocked_at', { ascending: false });

    if (blocked) {
      const userIds = [...new Set(blocked.map((b: any) => b.licenses.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const { data: { users } } = await supabase.auth.admin.listUsers();

      const blockedWithProfiles = blocked.map((block: any) => ({
        ...block,
        license: block.licenses,
        profile: {
          name: profiles?.find((p: any) => p.id === block.licenses.user_id)?.name || null,
          email: users?.find((u: any) => u.id === block.licenses.user_id)?.email || 'Unknown',
        },
      }));

      setBlockedMachines(blockedWithProfiles);
    }

    setLoading(false);
  };

  const filteredActiveMachines = activeMachines.filter(m =>
    m.machine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.license.license_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransfers = transferRequests.filter(t =>
    t.new_machine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.license.license_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBlocked = blockedMachines.filter(b =>
    b.machine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.license.license_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.profile.email.toLowerCase().includes(searchTerm.toLowerCase())
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
              <a href="/admin/machines" className="px-4 py-2 rounded-lg" style={{ background: '#f59e0b', color: '#000', textDecoration: 'none', fontWeight: 600 }}>
                Machines
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
              Machine Management
            </h2>

            {/* Search */}
            <input
              type="text"
              placeholder="Search by machine name, license key, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-3 rounded-xl"
              style={{ border: '2px solid #cbb8a4', fontSize: '16px' }}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('active')}
              className="px-6 py-3 rounded-xl font-semibold transition-colors"
              style={{ 
                background: activeTab === 'active' ? '#16a34a' : '#e5e7eb',
                color: activeTab === 'active' ? 'white' : '#374151'
              }}
            >
              Active Machines ({activeMachines.length})
            </button>
            <button
              onClick={() => setActiveTab('transfers')}
              className="px-6 py-3 rounded-xl font-semibold transition-colors"
              style={{ 
                background: activeTab === 'transfers' ? '#f59e0b' : '#e5e7eb',
                color: activeTab === 'transfers' ? '#000' : '#374151'
              }}
            >
              Transfer Requests ({transferRequests.filter(t => t.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('blocked')}
              className="px-6 py-3 rounded-xl font-semibold transition-colors"
              style={{ 
                background: activeTab === 'blocked' ? '#dc2626' : '#e5e7eb',
                color: activeTab === 'blocked' ? 'white' : '#374151'
              }}
            >
              Blocked Machines ({blockedMachines.length})
            </button>
          </div>

          {/* Active Machines Tab */}
          {activeTab === 'active' && (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <table className="w-full">
                <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <tr>
                    <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Machine</th>
                    <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>License Key</th>
                    <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Plan</th>
                    <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>User</th>
                    <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Activated</th>
                    <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Last Validated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActiveMachines.map((machine) => (
                    <tr key={machine.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td className="px-6 py-4">
                        <div style={{ fontWeight: 600, color: '#111827' }}>{machine.machine_name}</div>
                        {machine.ip_address && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>IP: {machine.ip_address}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <code style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontSize: '13px' }}>
                          {machine.license.license_key}
                        </code>
                      </td>
                      <td className="px-6 py-4" style={{ color: '#4b5563' }}>{machine.license.plan_name}</td>
                      <td className="px-6 py-4">
                        <div style={{ fontWeight: 600, color: '#111827' }}>{machine.profile.name || 'N/A'}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{machine.profile.email}</div>
                      </td>
                      <td className="px-6 py-4" style={{ color: '#4b5563', fontSize: '14px' }}>
                        {new Date(machine.activated_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#4b5563', fontSize: '14px' }}>
                        {machine.last_validated_at 
                          ? new Date(machine.last_validated_at).toLocaleString('en-IN')
                          : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredActiveMachines.length === 0 && (
                <div className="text-center py-12" style={{ color: '#6b7280' }}>
                  No active machines found
                </div>
              )}
            </div>
          )}

          {/* Transfer Requests Tab */}
          {activeTab === 'transfers' && (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <table className="w-full">
                <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <tr>
                    <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Old → New Machine</th>
                    <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>License Key</th>
                    <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>User</th>
                    <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Requested</th>
                    <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransfers.map((transfer) => (
                    <tr key={transfer.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td className="px-6 py-4">
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>{transfer.old_machine_name}</div>
                        <div style={{ fontSize: '20px', margin: '4px 0' }}>↓</div>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{transfer.new_machine_name}</div>
                        {transfer.new_machine_ip && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>IP: {transfer.new_machine_ip}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <code style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontSize: '13px' }}>
                          {transfer.license.license_key}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div style={{ fontWeight: 600, color: '#111827' }}>{transfer.profile.name || 'N/A'}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{transfer.profile.email}</div>
                      </td>
                      <td className="px-6 py-4" style={{ color: '#4b5563', fontSize: '14px' }}>
                        {new Date(transfer.requested_at).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span 
                          className="px-3 py-1 rounded-lg text-sm font-semibold"
                          style={{ 
                            background: transfer.status === 'pending' ? '#fef3c7' : transfer.status === 'approved' ? '#dcfce7' : '#fee2e2',
                            color: transfer.status === 'pending' ? '#92400e' : transfer.status === 'approved' ? '#166534' : '#991b1b'
                          }}
                        >
                          {transfer.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTransfers.length === 0 && (
                <div className="text-center py-12" style={{ color: '#6b7280' }}>
                  No transfer requests found
                </div>
              )}
            </div>
          )}

          {/* Blocked Machines Tab */}
          {activeTab === 'blocked' && (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <table className="w-full">
                <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <tr>
                    <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Machine</th>
                    <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>License Key</th>
                    <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>User</th>
                    <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Reason</th>
                    <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Blocked</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBlocked.map((blocked) => (
                    <tr key={blocked.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td className="px-6 py-4">
                        <div style={{ fontWeight: 600, color: '#dc2626' }}>{blocked.machine_name}</div>
                        {blocked.ip_address && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>IP: {blocked.ip_address}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <code style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontSize: '13px' }}>
                          {blocked.license.license_key}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div style={{ fontWeight: 600, color: '#111827' }}>{blocked.profile.name || 'N/A'}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{blocked.profile.email}</div>
                      </td>
                      <td className="px-6 py-4" style={{ color: '#4b5563', fontSize: '14px' }}>
                        {blocked.reason}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#4b5563', fontSize: '14px' }}>
                        {new Date(blocked.blocked_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredBlocked.length === 0 && (
                <div className="text-center py-12" style={{ color: '#6b7280' }}>
                  No blocked machines found
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
