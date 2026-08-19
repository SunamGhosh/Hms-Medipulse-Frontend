import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Package, Phone, CheckCircle, LogOut, Navigation, Clock, ShieldCheck, KeyRound, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import DeliveryRouteMapModal from '../components/DeliveryRouteMapModal';
import './DeliveryDashboard.css';

const API = import.meta.env.VITE_URL || 'http://localhost:5000';

const DeliveryDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMapOrder, setSelectedMapOrder] = useState(null);
  const [otpInputs, setOtpInputs] = useState({});
  const [otpLoading, setOtpLoading] = useState({});
  const navigate = useNavigate();
  const token = localStorage.getItem('deliveryToken');
  const deliveryBoy = JSON.parse(localStorage.getItem('deliveryBoy') || '{}');

  useEffect(() => {
    if (!token) {
      navigate('/delivery-auth');
      return;
    }
    fetchOrders();
  }, [token, navigate]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API}/delivery/my-orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API}/delivery/update-status/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        if (newStatus === 'out_for_delivery') {
          toast.success('Order marked Out for Delivery! Customer received verification OTP via email 📧');
        } else {
          toast.success(`Order marked as ${newStatus.replace('_', ' ')}`);
        }
        fetchOrders();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleVerifyOtp = async (orderId) => {
    const enteredOtp = (otpInputs[orderId] || '').trim();
    if (!enteredOtp || enteredOtp.length !== 6) {
      toast.error('Please enter the full 6-digit OTP sent to customer email');
      return;
    }

    setOtpLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch(`${API}/delivery/verify-otp-deliver/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp: enteredOtp })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'OTP Verified! Order delivered successfully.');
        setOtpInputs(prev => ({ ...prev, [orderId]: '' }));
        fetchOrders();
      } else {
        toast.error(data.message || 'Invalid OTP');
      }
    } catch (error) {
      toast.error('Failed to verify OTP');
    } finally {
      setOtpLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('deliveryToken');
    localStorage.removeItem('deliveryBoy');
    navigate('/delivery-auth');
  };

  if (loading) return <div className="dvd-loading">Loading dashboard...</div>;

  const activeOrders = orders.filter(o => ['paid', 'processing', 'shipped', 'out_for_delivery'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'delivered');

  return (
    <div className="delivery-dashboard">
      <Toaster position="top-center" />
      <header className="dvd-header">
        <div className="dvd-header-left">
          <Truck size={24} color="#fff" />
          <h2>Delivery Partner Hub</h2>
        </div>
        <div className="dvd-header-right">
          <span className="dvd-name">Hi, {deliveryBoy.first_name}</span>
          <button onClick={handleLogout} className="dvd-logout-btn"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="dvd-main">
        <section className="dvd-section">
          <h3>Active Deliveries ({activeOrders.length})</h3>
          {activeOrders.length === 0 ? (
            <div className="dvd-empty">No active deliveries at the moment.</div>
          ) : (
            <div className="dvd-order-list">
              {activeOrders.map(order => (
                <div key={order._id} className="dvd-order-card">
                  <div className="dvd-order-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="dvd-order-id">#{order._id.slice(-6).toUpperCase()}</span>
                      <span className={`dvd-status badge-${order.status}`}>{order.status.replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                    {/* View Route Map Button */}
                    <button
                      onClick={() => setSelectedMapOrder(order)}
                      className="dvd-map-trigger-btn"
                      title="Open Interactive Navigation Map"
                    >
                      <Navigation size={15} /> Route Map
                    </button>
                  </div>
                  
                  <div className="dvd-customer-details">
                    <div className="dvd-detail-row">
                      <UserIcon size={16} /> 
                      <span>{order.user_id?.first_name} {order.user_id?.last_name}</span>
                    </div>
                    <div className="dvd-detail-row">
                      <Phone size={16} /> 
                      <span>{order.user_id?.phone || 'N/A'}</span>
                    </div>
                    <div className="dvd-detail-row address-row">
                      <MapPin size={16} /> 
                      <span>
                        {order.delivery_address?.street}, {order.delivery_address?.city}, {order.delivery_address?.state} {order.delivery_address?.zip_code}
                      </span>
                    </div>

                    {/* ETA & Payment Info Banner */}
                    <div className="dvd-meta-bar">
                      <div className="dvd-meta-item">
                        <Clock size={15} color="#0d9488" />
                        <span>ETA: <strong>~{order.estimated_delivery_minutes || 25} Mins</strong></span>
                      </div>
                      <div className="dvd-meta-item">
                        <span>Mode: <strong>{order.payment_mode || 'UPI'}</strong></span>
                      </div>
                      <div className="dvd-meta-item">
                        <span className={`dvd-pay-badge ${order.payment_status === 'paid' || order.payment_mode === 'UPI' ? 'paid' : 'pending'}`}>
                          {(order.payment_status === 'paid' || order.payment_mode === 'UPI') ? 'Paid ✓' : 'Collect Cash (COD)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="dvd-order-items">
                    <div className="dvd-detail-row">
                      <Package size={16} />
                      <span>{order.total_items} items (Total: ₹{order.grand_total})</span>
                    </div>
                  </div>

                  {/* Actions & Verification Section */}
                  <div className="dvd-actions-container">
                    {order.status !== 'out_for_delivery' && (
                      <button 
                        onClick={() => updateStatus(order._id, 'out_for_delivery')}
                        className="dvd-btn dvd-btn-primary"
                      >
                        <Truck size={16} /> Mark Out for Delivery & Send OTP
                      </button>
                    )}

                    {order.status === 'out_for_delivery' && (
                      <div className="dvd-otp-verification-card">
                        <div className="dvd-otp-header">
                          <KeyRound size={18} color="#16a34a" />
                          <div>
                            <strong>Customer Email OTP Verification</strong>
                            <p>An email with a 6-digit OTP has been sent to customer ({order.user_id?.email || 'Customer Email'}). Ask them for the OTP at delivery.</p>
                          </div>
                        </div>

                        <div className="dvd-otp-input-group">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            value={otpInputs[order._id] || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setOtpInputs(prev => ({ ...prev, [order._id]: val }));
                            }}
                            className="dvd-otp-input"
                          />
                          <button
                            onClick={() => handleVerifyOtp(order._id)}
                            disabled={otpLoading[order._id]}
                            className="dvd-verify-btn"
                          >
                            {otpLoading[order._id] ? (
                              <><Loader2 size={16} className="dvd-spin" /> Verifying...</>
                            ) : (
                              <><ShieldCheck size={16} /> Verify OTP & Complete</>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dvd-section mt-4">
          <h3>Past Deliveries ({completedOrders.length})</h3>
          <div className="dvd-order-list">
            {completedOrders.slice(0, 10).map(order => (
              <div key={order._id} className="dvd-order-card completed-card">
                <div className="dvd-order-header">
                  <span className="dvd-order-id">#{order._id.slice(-6).toUpperCase()}</span>
                  <span className="dvd-status badge-delivered">DELIVERED ✓</span>
                </div>
                <div className="dvd-customer-details compact">
                  <span>{order.user_id?.first_name} {order.user_id?.last_name}</span>
                  <span className="dvd-address-compact">{order.delivery_address?.city}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Render Leaflet Route Navigation Map Modal when triggered */}
      {selectedMapOrder && (
        <DeliveryRouteMapModal
          order={selectedMapOrder}
          onClose={() => setSelectedMapOrder(null)}
        />
      )}
    </div>
  );
};

// Helper User icon
const UserIcon = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

export default DeliveryDashboard;

