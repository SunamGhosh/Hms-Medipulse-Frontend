import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Package, Phone, CheckCircle, LogOut } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import './DeliveryDashboard.css';

const API = import.meta.env.VITE_URL || 'http://localhost:5000';

const DeliveryDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
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
        toast.success(`Order marked as ${newStatus.replace('_', ' ')}`);
        fetchOrders();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('deliveryToken');
    localStorage.removeItem('deliveryBoy');
    navigate('/delivery-auth');
  };

  if (loading) return <div className="dd-loading">Loading dashboard...</div>;

  const activeOrders = orders.filter(o => ['paid', 'processing', 'shipped', 'out_for_delivery'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'delivered');

  return (
    <div className="delivery-dashboard">
      <Toaster position="top-center" />
      <header className="dd-header">
        <div className="dd-header-left">
          <Truck size={24} color="#fff" />
          <h2>Delivery Partner Hub</h2>
        </div>
        <div className="dd-header-right">
          <span className="dd-name">Hi, {deliveryBoy.first_name}</span>
          <button onClick={handleLogout} className="dd-logout-btn"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="dd-main">
        <section className="dd-section">
          <h3>Active Deliveries ({activeOrders.length})</h3>
          {activeOrders.length === 0 ? (
            <div className="dd-empty">No active deliveries at the moment.</div>
          ) : (
            <div className="dd-order-list">
              {activeOrders.map(order => (
                <div key={order._id} className="dd-order-card">
                  <div className="dd-order-header">
                    <span className="dd-order-id">#{order._id.slice(-6).toUpperCase()}</span>
                    <span className={`dd-status badge-${order.status}`}>{order.status.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                  
                  <div className="dd-customer-details">
                    <div className="dd-detail-row">
                      <UserIcon size={16} /> 
                      <span>{order.user_id?.first_name} {order.user_id?.last_name}</span>
                    </div>
                    <div className="dd-detail-row">
                      <Phone size={16} /> 
                      <span>{order.user_id?.phone}</span>
                    </div>
                    <div className="dd-detail-row address-row">
                      <MapPin size={16} /> 
                      <span>
                        {order.delivery_address?.street}, {order.delivery_address?.city}, {order.delivery_address?.state} {order.delivery_address?.zip_code}
                      </span>
                    </div>
                  </div>

                  <div className="dd-order-items">
                    <div className="dd-detail-row">
                      <Package size={16} />
                      <span>{order.total_items} items (Total: ₹{order.grand_total})</span>
                    </div>
                  </div>

                  <div className="dd-actions">
                    {order.status !== 'out_for_delivery' && (
                      <button 
                        onClick={() => updateStatus(order._id, 'out_for_delivery')}
                        className="dd-btn dd-btn-primary"
                      >
                        <Truck size={16} /> Mark Out for Delivery
                      </button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <button 
                        onClick={() => updateStatus(order._id, 'delivered')}
                        className="dd-btn dd-btn-success"
                      >
                        <CheckCircle size={16} /> Mark as Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dd-section mt-4">
          <h3>Past Deliveries ({completedOrders.length})</h3>
          <div className="dd-order-list">
            {completedOrders.slice(0, 10).map(order => (
              <div key={order._id} className="dd-order-card completed-card">
                <div className="dd-order-header">
                  <span className="dd-order-id">#{order._id.slice(-6).toUpperCase()}</span>
                  <span className="dd-status badge-delivered">DELIVERED</span>
                </div>
                <div className="dd-customer-details compact">
                  <span>{order.user_id?.first_name} {order.user_id?.last_name}</span>
                  <span className="dd-address-compact">{order.delivery_address?.city}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

// Helper User icon since User isn't imported from lucide-react above
const UserIcon = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

export default DeliveryDashboard;
