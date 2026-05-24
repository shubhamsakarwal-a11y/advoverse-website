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
  auto_renewal_enabled: boolean;
  razorpay_subscription_id: string | null;
  activation?: {
    machine_id: string;
    machine_name: string;
    activated_at: string;
    last_validated_at: string | null;
  } | null;
}

export default function MyLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchLicenses = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      setUser(session.user);

      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching licenses:', error);
        setLoading(false);
        return;
      }

      // Fetch active machine activations for each license
      const licensesWithActivations = await Promise.all(
        (data || []).map(async (license) => {
          const { data: activation } = await supabase
            .from('license_activations')
            .select('machine_id, machine_name, activated_at, last_validated_at')
            .eq('license_id', license.id)
            .eq('is_active', true)
            .single();

          return {
            ...license,
            activation: activation || null,
          };
        })
      );

      setLicenses(licensesWithActivations);
      setLoading(false);
    };

    fetchLicenses();
  }, [router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('License key copied to clipboard!');
  };

  const handleToggleAutoRenewal = async (license: License) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;

    if (license.auto_renewal_enabled) {
      // Disable auto-renewal
      if (!confirm('Are you sure you want to disable auto-renewal? You will need to renew manually before expiry.')) {
        return;
      }

      try {
        const res = await fetch('/api/subscription/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ licenseId: license.id }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }

        alert('✅ Auto-renewal disabled successfully');
        // Refresh licenses
        window.location.reload();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to disable auto-renewal');
      }
    } else {
      // Enable auto-renewal
      alert('To enable auto-renewal, please contact support@advoverse.com or use the Razorpay payment link.');
      // TODO: Implement Razorpay subscription UI
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f4ef' }}>
        <div className="text-center">
          <div className="text-2xl" style={{ color: '#3b2a22' }}>Loading your licenses...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f4ef', fontFamily: 'Inter, sans-serif', color: '#2d2d2d' }}>
      {/* HEADER */}
      <header style={{ background: '#f5eee4', padding: '24px 0', borderBottom: '1px solid #cbb8a4' }}>
        <div className="max-w-[1300px] mx-auto w-[90%]">
          <div className="flex justify-between items-center">
            <a href="/" style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', fontStyle: 'italic', fontWeight: 500, color: '#2f1d16', textDecoration: 'none' }}>
              Advoverse ⚖
            </a>
            <a href="/" className="px-6 py-2 rounded-lg transition-colors" style={{ background: '#6b4b3e', color: 'white', textDecoration: 'none' }}>
              Back to Home
            </a>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="py-16">
        <div className="max-w-[1100px] mx-auto w-[90%]">
          <h1 className="mb-3" style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', color: '#3b2a22' }}>
            My License Keys
          </h1>
          <p className="mb-10" style={{ color: '#666', fontSize: '18px' }}>
            Welcome, <strong>{user?.email}</strong>
          </p>

          {licenses.length === 0 ? (
            <div className="bg-white rounded-2xl text-center" style={{ padding: '60px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <div className="mb-4" style={{ fontSize: '64px' }}>📋</div>
              <h2 className="mb-3" style={{ fontSize: '28px', color: '#3b2a22', fontFamily: 'Playfair Display, serif' }}>
                No Licenses Yet
              </h2>
              <p className="mb-6" style={{ color: '#666' }}>
                You haven't purchased any plans yet. Choose a plan to get started!
              </p>
              <a href="/#pricing" className="inline-block px-8 py-3 rounded-xl text-white transition-colors" style={{ background: '#6b4b3e', textDecoration: 'none' }}>
                View Plans
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {licenses.map((license) => (
                <div key={license.id} className="bg-white rounded-2xl" style={{ padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #ddd' }}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="mb-2" style={{ fontSize: '32px', color: '#3b2a22', fontFamily: 'Playfair Display, serif' }}>
                        {license.plan_name}
                      </h3>
                      <div className="flex gap-4 text-sm" style={{ color: '#666' }}>
                        <span>Purchased: {new Date(license.created_at).toLocaleDateString()}</span>
                        {license.expires_at && (
                          <span>Expires: {new Date(license.expires_at).toLocaleDateString()}</span>
                        )}
                        {!license.expires_at && <span>Validity: Lifetime</span>}
                      </div>
                    </div>
                    <span className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: license.is_active ? '#dcfce7' : '#fee2e2', color: license.is_active ? '#166534' : '#991b1b' }}>
                      {license.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="rounded-xl" style={{ background: '#0f1720', border: '2px solid #f59e0b', padding: '30px' }}>
                    <div className="mb-3" style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Your License Key
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <code className="flex-1" style={{ color: '#f59e0b', fontSize: '28px', fontWeight: 'bold', letterSpacing: '4px', fontFamily: 'monospace' }}>
                        {license.license_key}
                      </code>
                      <button
                        onClick={() => copyToClipboard(license.license_key)}
                        className="px-6 py-3 rounded-lg transition-colors"
                        style={{ background: '#f59e0b', color: '#000', fontWeight: 600 }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
                      >
                        Copy Key
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl" style={{ background: '#f9fafb', padding: '24px' }}>
                    <h4 className="mb-3" style={{ fontSize: '18px', color: '#374151', fontWeight: 600 }}>
                      How to Activate
                    </h4>
                    <ol style={{ color: '#4b5563', lineHeight: 2, paddingLeft: '20px' }}>
                      <li>Download and install Advoverse application on your Windows computer</li>
                      <li>Open the application and click "Enter License Key"</li>
                      <li>Paste the license key above and click "Activate"</li>
                      <li>Start using all features of your {license.plan_name} plan</li>
                    </ol>
                  </div>

                  {/* Auto-Renewal Section */}
                  <div className="mt-6 rounded-xl" style={{ background: license.auto_renewal_enabled ? '#dcfce7' : '#fef3c7', padding: '24px', border: `2px solid ${license.auto_renewal_enabled ? '#22c55e' : '#fbbf24'}` }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="mb-2" style={{ fontSize: '18px', color: '#374151', fontWeight: 600 }}>
                          🔄 Auto-Renewal
                        </h4>
                        <p style={{ color: '#4b5563', fontSize: '14px', marginBottom: '12px' }}>
                          {license.auto_renewal_enabled 
                            ? 'Your license will automatically renew before expiry. You can cancel anytime.'
                            : 'Enable auto-renewal to never worry about license expiry. Your payment method will be charged automatically.'}
                        </p>
                        {license.auto_renewal_enabled && license.expires_at && (
                          <p style={{ color: '#16a34a', fontSize: '13px', fontWeight: 600 }}>
                            Next billing: {new Date(license.expires_at).toLocaleDateString('en-IN')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleAutoRenewal(license)}
                        className="px-6 py-2 rounded-lg transition-colors font-semibold"
                        style={{ 
                          background: license.auto_renewal_enabled ? '#dc2626' : '#16a34a',
                          color: 'white'
                        }}
                      >
                        {license.auto_renewal_enabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>

                  {/* Machine Activation Section */}
                  <div className="mt-6 rounded-xl" style={{ background: license.activation ? '#dcfce7' : '#f3f4f6', padding: '24px', border: `2px solid ${license.activation ? '#22c55e' : '#d1d5db'}` }}>
                    <h4 className="mb-3" style={{ fontSize: '18px', color: '#374151', fontWeight: 600 }}>
                      💻 Machine Activation
                    </h4>
                    {license.activation ? (
                      <div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>Active Machine</p>
                            <p style={{ color: '#166534', fontSize: '16px', fontWeight: 600 }}>{license.activation.machine_name}</p>
                          </div>
                          <div>
                            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>Activated On</p>
                            <p style={{ color: '#166534', fontSize: '16px', fontWeight: 600 }}>
                              {new Date(license.activation.activated_at).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                        {license.activation.last_validated_at && (
                          <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '12px' }}>
                            Last validated: {new Date(license.activation.last_validated_at).toLocaleString('en-IN')}
                          </p>
                        )}
                        <div className="rounded-lg" style={{ background: '#fef3c7', padding: '16px', border: '1px solid #fbbf24' }}>
                          <p style={{ color: '#92400e', fontSize: '13px', marginBottom: '8px', fontWeight: 600 }}>
                            ⚠️ One License = One Machine
                          </p>
                          <p style={{ color: '#92400e', fontSize: '12px' }}>
                            To use this license on a different machine, enter the license key on the new machine. You'll receive an email to approve the transfer.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>
                          This license is not activated on any machine yet.
                        </p>
                        <div className="rounded-lg" style={{ background: '#e0f2fe', padding: '16px', border: '1px solid #0ea5e9' }}>
                          <p style={{ color: '#075985', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                            💡 How to Activate
                          </p>
                          <p style={{ color: '#075985', fontSize: '12px' }}>
                            Open Caseline desktop app, enter your license key, and click "Activate". The license will be activated on that machine.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 text-center text-white" style={{ background: '#3b2a22' }}>
        <div className="max-w-[1300px] mx-auto w-[90%]">
          <h2 className="mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>⚖ Advoverse | Caseline ⚖</h2>
          <p style={{ color: '#c9c1b8' }}>
            Professional litigation management infrastructure for advocates and chambers.
          </p>
        </div>
      </footer>
    </div>
  );
}
