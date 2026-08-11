import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ShoppingBasket, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import ProfileDropdown from '../components/ProfileDropdown';
import './Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [address, setAddress] = useState({ street: '', city: '', state: '', zip_code: '' });
  const navigate = useNavigate();
  const token = localStorage.getItem('userToken');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchCart();
  }, [navigate, token]);

  const fetchCart = async () => {
    try {
      const res = await fetch('http://localhost:5000/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCartItems(data.success && data.cart ? data.cart : []);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Optimistic quantity update ───────────────────────────
  const handleQuantity = async (medicineId, action) => {
    const item = cartItems.find(i => i.medicine_id === medicineId);
    if (!item) return;

    if (action === 'decrease' && item.quantity === 1) {
      setCartItems(prev => prev.filter(i => i.medicine_id !== medicineId));
      await fetch(`http://localhost:5000/cart/remove/${medicineId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return;
    }

    // Optimistic update
    setCartItems(prev =>
      prev.map(i =>
        i.medicine_id === medicineId
          ? { ...i, quantity: action === 'increase' ? i.quantity + 1 : i.quantity - 1 }
          : i
      )
    );

    const endpoint = action === 'increase'
      ? `http://localhost:5000/cart/increase/${medicineId}`
      : `http://localhost:5000/cart/decrease/${medicineId}`;

    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) { fetchCart(); }
    } catch (err) {
      fetchCart();
      console.error('Error updating quantity:', err);
    }
  };

  const handleCheckout = async () => {
    if (!cartItems.length) { toast.error('Your cart is empty.'); return; }
    if (!address.street || !address.city || !address.state || !address.zip_code) {
      toast.error('Please enter complete delivery address.');
      return;
    }
    setCheckoutLoading(true);
    try {
      const orderRes = await fetch('http://localhost:5000/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount: grandTotal })
      });
      const orderData = await orderRes.json();
      console.log('Order Data:', orderData);

      if (!orderData.success || !orderData.order) {
        toast.error('Failed to initiate payment. Please try again.');
        setCheckoutLoading(false);
        return;
      }
      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh and try again.');
        setCheckoutLoading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: 'rzp_test_SEs85pwuNzMOCZ',
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'MediPulse Healthcare',
        description: 'Medicine Purchase',
        image: '/img/logo.jpeg',
        order_id: orderData.order.id,
        handler: async (response) => {
          const verRes = await fetch('http://localhost:5000/api/payment/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              delivery_address: address
            })
          });
          const verData = await verRes.json();
          if (verData.success) {
            toast.success('🎉 Payment successful! Your order has been placed.');
            setCartItems([]);
          } else {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {},
        theme: { color: '#16a34a' },
        modal: { ondismiss: () => setCheckoutLoading(false) }
      });

      rzp.on('payment.failed', (r) => {
        toast.error('Payment Failed: ' + r.error.description);
        setCheckoutLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('An error occurred during checkout.');
      setCheckoutLoading(false);
    }
  };

  if (loading) return <div className="cart-loading">Loading your cart...</div>;

  // ── Live derived totals ────────────────────────────────
  const itemsTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const grandTotal = itemsTotal;
  const totalQty   = cartItems.reduce((s, i) => s + i.quantity, 0);
  const hasItems   = cartItems.length > 0;

  return (
    <div className="cart-page">
      {/* Navbar */}
      <nav className="cart-navbar">
        <button className="cart-nav-back" onClick={() => navigate('/pharmacy')}>
          <ArrowLeft size={18} /> My Cart
        </button>
        <span className="cart-nav-title">{hasItems ? `${totalQty} item${totalQty > 1 ? 's' : ''}` : ''}</span>
        <ProfileDropdown />
      </nav>

      <div className="cart-body">
        {!hasItems ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any medicines yet.</p>
            <Link to="/pharmacy" className="cart-empty-link">Explore Pharmacy</Link>
          </div>
        ) : (
          <>
            {/* ── Items Card ── */}
            <div className="cart-items-card">
              <div className="cart-items-header">Your Items</div>
              {cartItems.map(item => (
                <div className="cart-item-row" key={item.medicine_id}>
                  <img
                    src={item.medicine_image || '/img/medicine_bottle.png'}
                    alt={item.medicine_name}
                    className="cart-item-img"
                    onError={e => { e.target.src = '/img/medicine_bottle.png'; }}
                  />
                  <div className="cart-item-info">
                    <h4>{item.medicine_name}</h4>
                    <p className="cart-item-meta">{item.unit || 'Strip'} &middot; ₹{item.price} each</p>
                    <p className="cart-item-price">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <div className="blinkit-qty">
                    <button onClick={() => handleQuantity(item.medicine_id, 'decrease')}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleQuantity(item.medicine_id, 'increase')}>+</button>
                  </div>
                </div>
              ))}
            </div>



            {/* ── Delivery Details ── */}
            <div className="cart-address-card" style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Delivery Address</h3>
              <div className="address-form" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="text" placeholder="Street Address" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, outline: 'none' }} />
                <input type="text" placeholder="City" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, outline: 'none' }} />
                <div className="address-row" style={{ display: 'flex', gap: 12 }}>
                  <input type="text" placeholder="State" value={address.state} onChange={e => setAddress({...address, state: e.target.value})} style={{ flex: 1, padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, outline: 'none' }} />
                  <input type="text" placeholder="ZIP Code" value={address.zip_code} onChange={e => setAddress({...address, zip_code: e.target.value})} style={{ flex: 1, padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, outline: 'none' }} />
                </div>
              </div>
            </div>

            {/* ── Bill Details ── */}
            <div className="bill-details-card">
              <h3>Bill Details</h3>

              <div className="bill-row">
                <span className="label"><ShoppingBasket size={14} /> Items total</span>
                <span className="amount">₹{itemsTotal.toFixed(2)}</span>
              </div>

              <div className="bill-row">
                <span className="label">Total quantity</span>
                <span className="amount">{totalQty} item{totalQty > 1 ? 's' : ''}</span>
              </div>

              <hr className="bill-divider" />

              <div className="bill-row grand-total">
                <span className="label">Grand total</span>
                <span className="amount">₹{grandTotal.toFixed(2)}</span>
              </div>

              <hr className="bill-divider" />

              {/* ── Inline Pay Button ── */}
              <button
                className="bill-pay-btn"
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                <div className="bill-pay-left">
                  <span className="bill-pay-amount">₹{grandTotal.toFixed(2)}</span>
                  <span className="bill-pay-label">Total payable</span>
                </div>
                <div className="bill-pay-right">
                  {checkoutLoading ? 'Processing...' : 'Proceed to Pay'}
                  <ChevronRight size={18} />
                </div>
              </button>
            </div>

            {/* ── Cancellation Policy ── */}
            <div className="cart-policy-card">
              <h4><Info size={13} /> Cancellation Policy</h4>
              <p>
                Orders cannot be cancelled once packed for delivery.
                In case of unexpected delays, a full refund will be provided.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
