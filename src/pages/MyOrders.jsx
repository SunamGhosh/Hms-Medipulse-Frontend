import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, CheckCircle2, Clock, Truck, XCircle, ShoppingBag, ChevronRight, Headphones, RotateCcw, User, CreditCard, MapPin, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import ProfileDropdown from '../components/ProfileDropdown';
import './MyOrders.css';

const STATUS_CONFIG = {
  paid:             { label: 'Order Placed',      icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', step: 1 },
  processing:       { label: 'Processing',        icon: Clock,        color: '#d97706', bg: '#fffbeb', border: '#fde68a', step: 2 },
  shipped:          { label: 'Shipped',           icon: Truck,        color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', step: 3 },
  out_for_delivery: { label: 'Out for Delivery',  icon: Truck,        color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', step: 4 },
  delivered:        { label: 'Delivered',         icon: CheckCircle2, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', step: 5 },
  cancelled:        { label: 'Cancelled',         icon: XCircle,      color: '#dc2626', bg: '#fef2f2', border: '#fecaca', step: 0 },
  pending:          { label: 'Pending',           icon: Clock,        color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', step: 0 },
};

const TRACKING_STEPS = ['paid', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

const getStatusColorClass = (statusStr) => {
  if (statusStr === 'cancelled') return 'red';
  if (statusStr === 'delivered') return 'blue';
  return 'green';
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingModalItem, setTrackingModalItem] = useState(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('userToken');

  const handleTrackItem = (flatItem) => {
    setTrackingModalItem(flatItem);
    setIsTrackingModalOpen(true);
  };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchOrders();
  }, [navigate, token]);

  useEffect(() => {
    const handleOrderStatusUpdated = (e) => {
      const { orderId, status } = e.detail;
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    };
    window.addEventListener('order-status-updated', handleOrderStatusUpdated);
    return () => window.removeEventListener('order-status-updated', handleOrderStatusUpdated);
  }, []);

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

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/payment/update-order-status/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Order cancelled successfully!');
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'cancelled' } : o));
      } else {
        toast.error(data.message || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      toast.error('Network error. Failed to cancel order.');
    }
  };

  const handleNeedHelp = (order, item) => {
    window.dispatchEvent(new CustomEvent('open-chatbot-help', {
      detail: { order, item }
    }));
  };

  if (loading) return <div className="mo-loading">Loading your orders...</div>;

  // Flatten orders into item-wise rows for e-commerce Myntra layout
  const orderItems = [];
  orders.forEach(order => {
    order.items.forEach(item => {
      orderItems.push({
        ...order,
        orderId: order._id,
        item
      });
    });
  });

  return (
    <div className="mo-page">
      {/* Navbar */}
      <nav className="mo-navbar">
        <button className="mo-nav-back" onClick={() => navigate('/pharmacy')}>
          <ArrowLeft size={18} /> My Orders
        </button>
        <span className="mo-nav-count">
          {orderItems.length > 0 ? `${orderItems.length} item${orderItems.length > 1 ? 's' : ''}` : ''}
        </span>
        <ProfileDropdown />
      </nav>

      {/* Main Body */}
      <div className="mo-layout-wrapper">
        {/* Left Sidebar */}
        <aside className="mo-left-sidebar">
          <div className="mo-sidebar-title">Account</div>
          <ul className="mo-sidebar-menu">
            <li>
              <Link to="/user/dashboard" className="mo-sidebar-link">
                <User size={16} /> Profile
              </Link>
            </li>
            <li>
              <span className="mo-sidebar-link">
                <CreditCard size={16} /> Saved Cards
              </span>
            </li>
            <li>
              <span className="mo-sidebar-link">
                <MapPin size={16} /> Addresses
              </span>
            </li>
            <li>
              <span className="mo-sidebar-link active">
                <Package size={16} /> My Orders
              </span>
            </li>
            <li>
              <span className="mo-sidebar-link" style={{ color: '#ec4899' }}>
                ⭐ Medipulse Club
              </span>
            </li>
          </ul>
        </aside>

        {/* Right Content */}
        <div className="mo-right-content">
          {orderItems.length === 0 ? (
            <div className="mo-empty">
              <ShoppingBag size={60} color="#cbd5e1" />
              <h2>No orders yet</h2>
              <p>You haven't placed any orders. Browse our pharmacy and get your medicines delivered!</p>
              <Link to="/pharmacy" className="mo-shop-btn">Shop Now</Link>
            </div>
          ) : (
            <div className="mo-single-col-body">
              {orderItems.map((flatItem, idx) => {
                const { orderId, item, status: orderStatus, placed_at } = flatItem;
                const statusCfg = STATUS_CONFIG[orderStatus] || STATUS_CONFIG.pending;
                const StatusIcon = statusCfg.icon;
                const colorClass = getStatusColorClass(orderStatus);

                let timelineText = '';
                if (orderStatus === 'cancelled') {
                  timelineText = `on ${new Date(placed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} As per your request`;
                } else if (orderStatus === 'delivered') {
                  timelineText = `on ${new Date(flatItem.tracking?.delivered_at || placed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
                } else {
                  const estDate = new Date(placed_at);
                  estDate.setDate(estDate.getDate() + 3);
                  const dateStr = estDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                  timelineText = `Arriving by ${dateStr}`;
                }

                const isCancelled = orderStatus === 'cancelled';
                const isDelivered = orderStatus === 'delivered';
                const isActive = !isCancelled && !isDelivered;

                return (
                  <div className="mo-item-card" key={`${orderId}-${idx}`}>
                    {/* Header status */}
                    <div className="mo-card-status-header">
                      <div className={`mo-status-icon-box ${colorClass}`}>
                        <StatusIcon size={18} />
                      </div>
                      <div className="mo-status-text-details">
                        <span className={`mo-status-title-text ${colorClass}`}>
                          {statusCfg.label}
                        </span>
                        <span className="mo-status-sub-text">{timelineText}</span>
                      </div>
                    </div>

                    {/* Item info box */}
                    <Link to="/pharmacy" className="mo-nested-item-box">
                      <div className="mo-nested-img-wrapper">
                        <img
                          src={item.medicine_image || '/img/medicine_bottle.png'}
                          alt={item.medicine_name}
                          className="mo-nested-img"
                          onError={e => { e.target.src = '/img/medicine_bottle.png'; }}
                        />
                      </div>
                      <div className="mo-nested-info">
                        <span className="mo-nested-brand">{item.medicine_name}</span>
                        <span className="mo-nested-desc">Prescription Medicine • Qty: {item.quantity}</span>
                        <span className="mo-nested-price-qty">₹{item.price.toFixed(2)} each</span>
                      </div>
                      <ChevronRight size={18} className="mo-nested-chevron" />
                    </Link>

                    {/* Action buttons (only for non-cancelled) */}
                    {!isCancelled && (
                      <div className="mo-actions-button-row">
                        {isActive && (
                          <>
                            <button
                              className="mo-action-btn-flat"
                              onClick={() => handleTrackItem(flatItem)}
                            >
                              <Truck size={15} /> Track Item
                            </button>
                            <button className="mo-action-btn-flat" onClick={() => handleCancelOrder(orderId)}>
                              <XCircle size={15} /> Cancel Item
                            </button>
                          </>
                        )}
                        {isDelivered && (
                          <button className="mo-action-btn-flat" onClick={() => toast.success('Return period expired')}>
                            <RotateCcw size={15} /> Return Item
                          </button>
                        )}
                        <button className="mo-action-btn-flat" onClick={() => handleNeedHelp(flatItem, item)}>
                          <Headphones size={15} /> Need Help?
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tracking Modal */}
      <TrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        flatItem={trackingModalItem}
        STATUS_CONFIG={STATUS_CONFIG}
        TRACKING_STEPS={TRACKING_STEPS}
      />
    </div>
  );
};

// Vertical timeline tracking modal component
const TrackingModal = ({ isOpen, onClose, flatItem, STATUS_CONFIG, TRACKING_STEPS }) => {
  if (!isOpen || !flatItem) return null;

  const { orderId, status: orderStatus, placed_at } = flatItem;
  const statusCfg = STATUS_CONFIG[orderStatus] || STATUS_CONFIG.pending;

  const getStepTime = (stepKey) => {
    if (stepKey === 'paid') return placed_at;
    if (stepKey === 'processing') return flatItem.tracking?.processing_at;
    if (stepKey === 'shipped') return flatItem.tracking?.shipped_at;
    if (stepKey === 'out_for_delivery') return flatItem.tracking?.out_for_delivery_at;
    if (stepKey === 'delivered') return flatItem.tracking?.delivered_at;
    return null;
  };

  return (
    <div className="mo-track-modal-overlay" onClick={onClose}>
      <div className="mo-track-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mo-track-modal-header">
          <h3 className="mo-track-modal-title">Track Shipment</h3>
          <button className="mo-track-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="mo-track-modal-body">
          {/* Order Details Header */}
          <div style={{ marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>ORDER ID</div>
            <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: 800, textTransform: 'uppercase' }}>#{orderId.toUpperCase()}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Placed on {new Date(placed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Vertical Stepper */}
          <div className="mo-vertical-timeline">
            {TRACKING_STEPS.map((stepKey, i) => {
              const stepConfig = STATUS_CONFIG[stepKey];
              const isStepCompleted = statusCfg.step >= stepConfig.step;
              const isStepCurrent = statusCfg.step === stepConfig.step;
              
              const stepTime = getStepTime(stepKey);
              const timeText = stepTime
                ? new Date(stepTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                : '';

              const nextStepKey = TRACKING_STEPS[i + 1];
              const isLineFilled = nextStepKey && statusCfg.step >= STATUS_CONFIG[nextStepKey].step;

              return (
                <div className={`mo-vertical-step ${isStepCompleted ? 'completed' : ''} ${isStepCurrent ? 'current' : ''}`} key={stepKey}>
                  <div className="mo-vertical-line-wrapper">
                    <div className="mo-vertical-dot">
                      {isStepCompleted ? <Check size={12} strokeWidth={4} /> : <div className="mo-vertical-dot-inner"></div>}
                    </div>
                    <div className={`mo-vertical-line ${isLineFilled ? 'filled' : ''}`}></div>
                  </div>
                  <div className="mo-vertical-text-wrapper">
                    <span className="mo-vertical-label">{stepConfig.label}</span>
                    <span className="mo-vertical-desc">
                      {isStepCurrent && `In Progress — `}
                      {timeText || (isStepCompleted ? 'Completed' : 'Pending')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Address Box */}
          {flatItem.delivery_address && (
            <div className="mo-delivery-address" style={{ marginTop: '0', marginBottom: '16px', background: '#f8fafc' }}>
              <strong>Delivery Address:</strong>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569', lineHeight: '1.4' }}>
                {flatItem.delivery_address.street}, {flatItem.delivery_address.city}, {flatItem.delivery_address.state} {flatItem.delivery_address.zip_code}
              </p>
            </div>
          )}

          {/* Payment Status Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 13,
            padding: '10px 14px',
            background: (flatItem.payment_mode === 'COD' && flatItem.payment_status !== 'paid') ? '#fff7ed' : '#f0fdf4',
            borderRadius: 8,
            border: `1px solid ${(flatItem.payment_mode === 'COD' && flatItem.payment_status !== 'paid') ? '#fed7aa' : '#bbf7d0'}`
          }}>
            <div>
              <span style={{ color: '#475569', fontWeight: 500 }}>Mode: </span>
              <strong style={{ color: '#0f172a' }}>{flatItem.payment_mode || 'UPI'}</strong>
            </div>
            <div>
              <span style={{ color: '#475569', fontWeight: 500 }}>Status: </span>
              <span style={{
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700,
                background: (flatItem.payment_status === 'paid' || flatItem.payment_mode === 'UPI') ? '#16a34a' : '#f97316',
                color: '#ffffff'
              }}>
                {(flatItem.payment_status === 'paid' || flatItem.payment_mode === 'UPI') ? 'Done' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
