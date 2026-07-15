import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, CheckCircle2, Clock, Truck, XCircle, ShoppingBag } from 'lucide-react';
import ProfileDropdown from '../components/ProfileDropdown';
import './MyOrders.css';

const STATUS_CONFIG = {
  paid:        { label: 'Order Placed',  icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  processing:  { label: 'Processing',    icon: Clock,        color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  delivered:   { label: 'Delivered',     icon: Truck,        color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  cancelled:   { label: 'Cancelled',     icon: XCircle,      color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  pending:     { label: 'Pending',       icon: Clock,        color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('userToken');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchOrders();
  }, [navigate, token]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/payment/my-orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="mo-loading">Loading your orders...</div>;

  return (
    <div className="mo-page">
      {/* Navbar */}
      <nav className="mo-navbar">
        <button className="mo-nav-back" onClick={() => navigate('/pharmacy')}>
          <ArrowLeft size={18} /> My Orders
        </button>
        <span className="mo-nav-count">{orders.length > 0 ? `${orders.length} order${orders.length > 1 ? 's' : ''}` : ''}</span>
        <ProfileDropdown />
      </nav>

      <div className="mo-body">
        {orders.length === 0 ? (
          <div className="mo-empty">
            <ShoppingBag size={60} color="#cbd5e1" />
            <h2>No orders yet</h2>
            <p>You haven't placed any orders. Browse our pharmacy and get your medicines delivered!</p>
            <Link to="/pharmacy" className="mo-shop-btn">Shop Now</Link>
          </div>
        ) : (
          orders.map(order => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = status.icon;
            return (
              <div className="mo-order-card" key={order._id}>
                {/* Order Header */}
                <div className="mo-order-header">
                  <div className="mo-order-meta">
                    <div className="mo-order-id">
                      <Package size={15} />
                      <span>#{order._id?.slice(-8).toUpperCase() || 'N/A'}</span>
                    </div>
                    <div className="mo-order-date">{formatDate(order.placed_at)}</div>
                  </div>
                  <div
                    className="mo-status-badge"
                    style={{ color: status.color, background: status.bg, border: `1px solid ${status.border}` }}
                  >
                    <StatusIcon size={13} />
                    {status.label}
                  </div>
                </div>

                {/* Items */}
                <div className="mo-items-list">
                  {order.items.map((item, idx) => (
                    <div className="mo-item-row" key={idx}>
                      <img
                        src={item.medicine_image || '/img/medicine_bottle.png'}
                        alt={item.medicine_name}
                        className="mo-item-img"
                        onError={e => { e.target.src = '/img/medicine_bottle.png'; }}
                      />
                      <div className="mo-item-info">
                        <span className="mo-item-name">{item.medicine_name}</span>
                        <span className="mo-item-qty">Qty: {item.quantity} × ₹{item.price}</span>
                      </div>
                      <span className="mo-item-total">₹{item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mo-order-footer">
                  <div className="mo-order-summary">
                    <span>{order.total_quantity} item{order.total_quantity > 1 ? 's' : ''}</span>
                    <span className="mo-dot">·</span>
                    <span>Order Total</span>
                  </div>
                  <div className="mo-order-total">₹{order.grand_total.toFixed(2)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyOrders;
