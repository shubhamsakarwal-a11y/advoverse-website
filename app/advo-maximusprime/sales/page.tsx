'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Sale {
  id: number;
  created_at: string;
  user_email: string;
  user_name: string | null;
  plan_name: string;
  amount: number;
  payment_method: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
}

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || session.user.email !== 'shubham.sakarwal@gmail.com') {
        router.push('/');
        return;
      }

      await fetchSales();
    };

    checkAuth();
  }, [router]);

  const fetchSales = async () => {
    const supabase = createClient();

    // Get all paid orders
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_user_id_fkey (
          id,
          name
        )
      `)
      .eq('status', 'paid')
      .order('created_at', { ascending: false });

    if (!orders) {
      setLoading(false);
      return;
    }

    // Get user emails
    const userIds = [...new Set(orders.map((o: any) => o.user_id))];
    const { data: { users } } = await supabase.auth.admin.listUsers();

    const salesData = orders.map((order: any) => ({
      id: order.id,
      created_at: order.created_at,
      user_email: users?.find(u => u.id === order.user_id)?.email || 'Unknown',
      user_name: order.profiles?.name || null,
      plan_name: order.plan_name,
      amount: order.amount,
      payment_method: 'Razorpay',
      razorpay_order_id: order.razorpay_order_id,
      razorpay_payment_id: order.razorpay_payment_id,
    }));

    setSales(salesData);
    setLoading(false);
  };

  const getFilteredSales = () => {
    let filtered = sales;

    // Apply period filter
    const now = new Date();
    if (filterPeriod === 'today') {
      filtered = filtered.filter(s => {
        const saleDate = new Date(s.created_at);
        return saleDate.toDateString() === now.toDateString();
      });
    } else if (filterPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(s => new Date(s.created_at) >= weekAgo);
    } else if (filterPeriod === 'month') {
      filtered = filtered.filter(s => {
        const saleDate = new Date(s.created_at);
        return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.razorpay_order_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredSales = getFilteredSales();
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
  const averageOrderValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

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
              <a href="/admin/users" className="px-4 py-2 rounded-lg transition-colors" style={{ background: '#6b4b3e', color: 'white', textDecoration: 'none' }}>
                Users
              </a>
              <a href="/admin/sales" className="px-4 py-2 rounded-lg" style={{ background: '#f59e0b', color: '#000', textDecoration: 'none', fontWeight: 600 }}>
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
              Sales & Revenue
            </h2>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Total Revenue ({filterPeriod})</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#16a34a' }}>
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Total Sales ({filterPeriod})</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b2a22' }}>{filteredSales.length}</div>
              </div>
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Average Order Value</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f59e0b' }}>
                  ₹{Math.round(averageOrderValue).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setFilterPeriod('all')}
                className="px-6 py-2 rounded-xl font-semibold transition-colors"
                style={{ 
                  background: filterPeriod === 'all' ? '#f59e0b' : '#e5e7eb',
                  color: filterPeriod === 'all' ? '#000' : '#374151'
                }}
              >
                All Time
              </button>
              <button
                onClick={() => setFilterPeriod('today')}
                className="px-6 py-2 rounded-xl font-semibold transition-colors"
                style={{ 
                  background: filterPeriod === 'today' ? '#f59e0b' : '#e5e7eb',
                  color: filterPeriod === 'today' ? '#000' : '#374151'
                }}
              >
                Today
              </button>
              <button
                onClick={() => setFilterPeriod('week')}
                className="px-6 py-2 rounded-xl font-semibold transition-colors"
                style={{ 
                  background: filterPeriod === 'week' ? '#f59e0b' : '#e5e7eb',
                  color: filterPeriod === 'week' ? '#000' : '#374151'
                }}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setFilterPeriod('month')}
                className="px-6 py-2 rounded-xl font-semibold transition-colors"
                style={{ 
                  background: filterPeriod === 'month' ? '#f59e0b' : '#e5e7eb',
                  color: filterPeriod === 'month' ? '#000' : '#374151'
                }}
              >
                This Month
              </button>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search by email, name, plan, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-3 rounded-xl"
              style={{ border: '2px solid #cbb8a4', fontSize: '16px' }}
            />
          </div>

          {/* Sales Table */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <table className="w-full">
              <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <tr>
                  <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Date</th>
                  <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Customer</th>
                  <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Plan</th>
                  <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Amount</th>
                  <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Payment Method</th>
                  <th className="px-6 py-4 text-left" style={{ color: '#374151', fontWeight: 600 }}>Order ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td className="px-6 py-4" style={{ color: '#4b5563', fontSize: '14px' }}>
                      {new Date(sale.created_at).toLocaleDateString('en-IN')}
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {new Date(sale.created_at).toLocaleTimeString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div style={{ fontWeight: 600, color: '#111827' }}>{sale.user_name || 'N/A'}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>{sale.user_email}</div>
                    </td>
                    <td className="px-6 py-4" style={{ color: '#4b5563' }}>{sale.plan_name}</td>
                    <td className="px-6 py-4">
                      <div style={{ fontWeight: 600, color: '#16a34a', fontSize: '16px' }}>
                        ₹{sale.amount.toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-lg text-sm" style={{ background: '#dbeafe', color: '#1e40af' }}>
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <code style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>
                        {sale.razorpay_order_id}
                      </code>
                      {sale.razorpay_payment_id && (
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                          Payment: {sale.razorpay_payment_id.substring(0, 20)}...
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSales.length === 0 && (
              <div className="text-center py-12" style={{ color: '#6b7280' }}>
                No sales found for the selected period
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
