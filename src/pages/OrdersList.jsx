import React, { useState, useEffect } from 'react';
import { Package, Truck, Clock, CheckCircle2, Search, X, User, Phone, MapPin, KeyRound, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './OrdersList.css';

const API = import.meta.env.VITE_URL || 'http://localhost:5000';

const getToken = () => {
  let t = localStorage.getItem('token') || localStorage.getItem('adminToken') || '';
  if (!t) return '';
  t = t.trim();
  if (t.startsWith('Bearer ')) t = t.substring(7).trim();
  return t.replace(/^["']|["']$/g, '').trim();
};

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async (isPolling = false) => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API}/api/payment/all-orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      if (!isPolling) console.error('Failed to fetch orders:', err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'All' ? true : order.status === statusFilter.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const orderId = (order._id || '').toLowerCase();
    const userName = (order.user_id?.first_name || '' + ' ' + (order.user_id?.last_name || '')).toLowerCase();
    const city = (order.delivery_address?.city || '').toLowerCase();
    const matchesSearch = !q || orderId.includes(q) || userName.includes(q) || city.includes(q);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid': case 'processing':
        return <span className="ol-badge badge-processing"><Clock size={13} /> Processing</span>;
      case 'shipped':
        return <span className="ol-badge badge-shipped"><Truck size={13} /> Shipped</span>;
      case 'out_for_delivery':
        return <span className="ol-badge badge-out-delivery"><Truck size={13} /> Out for Delivery</span>;
      case 'delivered':
        return <span className="ol-badge badge-delivered"><CheckCircle2 size={13} /> Delivered</span>;
      case 'cancelled':
        return <span className="ol-badge badge-cancelled"><X size={13} /> Cancelled</span>;
      default:
        return <span className="ol-badge badge-pending">{status}</span>;
    }
  };

  if (loading) return <div className="ol-loading">Loading pharmacy orders...</div>;

  return (
    <div className="ol-container">
      {/* Header */}
      <div className="ol-header">
        <div>
          <h2>Pharmacy Medicine Orders & Deliveries</h2>
          <p>Monitor customer orders, delivery partner assignments, ETAs, and verification status in real-time</p>
        </div>
      </div>

      {/* Summary Filters */}
      <div className="ol-summary-cards">
        <button className={`ol-card ${statusFilter === 'All' ? 'active' : ''}`} onClick={() => setStatusFilter('All')}>
          <div className="ol-card-title">Total Orders</div>
          <div className="ol-card-count">{orders.length}</div>
        </button>
        <button className={`ol-card ${statusFilter === 'out_for_delivery' ? 'active' : ''}`} onClick={() => setStatusFilter('out_for_delivery')}>
          <div className="ol-card-title" style={{ color: '#be185d' }}>Out for Delivery</div>
          <div className="ol-card-count" style={{ color: '#be185d' }}>{orders.filter(o => o.status === 'out_for_delivery').length}</div>
        </button>
        <button className={`ol-card ${statusFilter === 'processing' ? 'active' : ''}`} onClick={() => setStatusFilter('processing')}>
          <div className="ol-card-title" style={{ color: '#d97706' }}>Processing / Shipped</div>
          <div className="ol-card-count" style={{ color: '#d97706' }}>{orders.filter(o => ['paid', 'processing', 'shipped'].includes(o.status)).length}</div>
        </button>
        <button className={`ol-card ${statusFilter === 'delivered' ? 'active' : ''}`} onClick={() => setStatusFilter('delivered')}>
          <div className="ol-card-title" style={{ color: '#16a34a' }}>Delivered</div>
          <div className="ol-card-count" style={{ color: '#16a34a' }}>{orders.filter(o => o.status === 'delivered').length}</div>
        </button>
      </div>

      {/* Toolbar / Search */}
      <div className="ol-toolbar">
        <div className="ol-search-box">
          <Search size={18} className="ol-search-icon" />
          <input
            type="text"
            placeholder="Search by Order ID, customer name, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ol-search-input"
          />
          {searchQuery && (
            <button className="ol-search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="ol-table-wrapper">
        <table className="ol-table">
          <thead>
            <tr>
              <th>Order ID & Date</th>
              <th>Customer Details</th>
              <th>Items & Total</th>
              <th>Status</th>
              <th>Estimated Delivery Time</th>
              <th>OTP & Delivery Verification</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No orders found.
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order._id}>
                  <td>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                      #{order._id?.slice(-8).toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                      {new Date(order.placed_at || order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <div className="ol-cust-cell">
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {order.user_id?.first_name} {order.user_id?.last_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {order.delivery_address?.city}, {order.delivery_address?.state}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div><strong>{order.total_items} items</strong> ({order.total_quantity} qty)</div>
                    <div style={{ color: '#059669', fontWeight: 800, fontSize: '0.9rem' }}>₹{order.grand_total}</div>
                  </td>
                  <td>
                    {getStatusBadge(order.status)}
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                      Mode: <strong>{order.payment_mode || 'UPI'}</strong>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', fontWeight: 700, color: '#0d9488' }}>
                      <Clock size={15} /> ~{order.estimated_delivery_minutes || 25} Mins
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                      {order.tracking?.out_for_delivery_at ? `Out: ${new Date(order.tracking.out_for_delivery_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : 'Processing'}
                    </div>
                  </td>
                  <td>
                    {order.status === 'out_for_delivery' && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 10px', borderRadius: 8 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <KeyRound size={13} /> Email OTP Sent
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#15803d', marginTop: 2 }}>
                          {order.is_otp_verified ? 'Verified ✓' : 'Awaiting Customer Verification'}
                        </div>
                      </div>
                    )}
                    {order.status === 'delivered' && (
                      <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.85rem' }}>
                        ✓ Verified & Delivered
                      </span>
                    )}
                    {['paid', 'processing', 'shipped'].includes(order.status) && (
                      <span style={{ color: '#64748b', fontSize: '0.82rem' }}>
                        OTP generates on dispatch
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersList;
