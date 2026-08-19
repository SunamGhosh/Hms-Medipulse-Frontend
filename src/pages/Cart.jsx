import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ShoppingBasket, Info, MapPin, Navigation, Loader2, Map, CreditCard, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import ProfileDropdown from '../components/ProfileDropdown';
import MapPickerModal from '../components/MapPickerModal';
import './Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [address, setAddress] = useState({ street: '', city: '', state: '', zip_code: '' });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('userToken');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchCart();
    fetchUserProfileAddress();
  }, [navigate, token]);

  const fillAddressFromObjOrString = (rawAddr, city, state, zip) => {
    if (!rawAddr && !city && !state && !zip) return;

    if (typeof rawAddr === 'object' && rawAddr !== null) {
      setAddress(prev => ({
        street: rawAddr.street || rawAddr.address || prev.street,
        city: rawAddr.city || city || prev.city,
        state: rawAddr.state || state || prev.state,
        zip_code: rawAddr.zip_code || rawAddr.pincode || zip || prev.zip_code
      }));
      return;
    }

    if (typeof rawAddr === 'string' && rawAddr.trim()) {
      const parts = rawAddr.split(',').map(p => p.trim());
      if (parts.length >= 4) {
        setAddress({
          street: parts.slice(0, parts.length - 3).join(', '),
          city: parts[parts.length - 3] || city || '',
          state: parts[parts.length - 2] || state || '',
          zip_code: parts[parts.length - 1] || zip || ''
        });
      } else {
        setAddress(prev => ({
          street: rawAddr,
          city: city || prev.city,
          state: state || prev.state,
          zip_code: zip || prev.zip_code
        }));
      }
    } else if (city || state || zip) {
      setAddress(prev => ({
        ...prev,
        city: city || prev.city,
        state: state || prev.state,
        zip_code: zip || prev.zip_code
      }));
    }
  };

  const fetchUserProfileAddress = async () => {
    // 1. Try local storage user profile first
    try {
      const storedUser = localStorage.getItem('user') || localStorage.getItem('userInfo');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        fillAddressFromObjOrString(parsed.address, parsed.city, parsed.state, parsed.zip_code || parsed.pincode);
      }
    } catch (e) {}

    // 2. Fetch profile from backend user profile endpoint
    try {
      const API_URL = import.meta.env.VITE_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const user = data.user || data;
      if (user) {
        fillAddressFromObjOrString(user.address, user.city, user.state, user.zip_code || user.pincode);
      }
    } catch (err) {
      console.error('Error fetching user profile address:', err);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingLocation(true);
    toast.loading('Detecting your location...', { id: 'geoToast' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const streetName = [
              addr.building || addr.house_number || '',
              addr.road || addr.suburb || addr.neighbourhood || addr.residential || ''
            ].filter(Boolean).join(', ') || (data.display_name ? data.display_name.split(',')[0] : '');

            const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || '';
            const state = addr.state || '';
            const zip = addr.postcode || '';

            setAddress({
              street: streetName || data.display_name || '',
              city: city,
              state: state,
              zip_code: zip
            });
            toast.success('📍 Location auto-filled!', { id: 'geoToast' });
          } else {
            toast.error('Could not determine exact address details.', { id: 'geoToast' });
          }
        } catch (err) {
          console.error('Geocoding error:', err);
          toast.error('Failed to fetch location details.', { id: 'geoToast' });
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        console.error('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location permission denied. Please allow location access.', { id: 'geoToast' });
        } else {
          toast.error('Unable to retrieve location.', { id: 'geoToast' });
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

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

  const [paymentMode, setPaymentMode] = useState('UPI'); // 'UPI' or 'COD'

  const handleCheckout = async () => {
    if (!cartItems.length) { toast.error('Your cart is empty.'); return; }
    if (!address.street || !address.city || !address.state || !address.zip_code) {
      toast.error('Please enter complete delivery address.');
      return;
    }
    setCheckoutLoading(true);

    if (paymentMode === 'COD') {
      try {
        const API_BASE = import.meta.env.VITE_URL || 'http://localhost:5000';
        const res = await fetch(`${API_BASE}/api/payment/place-cod-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ delivery_address: address })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success('🎉 Order placed successfully with Cash on Delivery!');
          setCartItems([]);
          setTimeout(() => navigate('/my-orders'), 1200);
        } else {
          toast.error(data.message || 'Failed to place COD order.');
        }
      } catch (err) {
        console.error('COD Order error:', err);
        toast.error(err.message || 'An error occurred during COD checkout.');
      } finally {
        setCheckoutLoading(false);
      }
      return;
    }

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
            setTimeout(() => navigate('/my-orders'), 1200);
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
          <div className="cart-grid">
            {/* ── Left Column: Items, Address, Payment ── */}
            <div className="cart-left-col">
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
              <div className="cart-address-card" style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Delivery Address</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={detectingLocation}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 12px',
                        borderRadius: 20,
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafc',
                        color: '#475569',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: detectingLocation ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      {detectingLocation ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                      {detectingLocation ? 'Locating...' : 'GPS Detect'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMapOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 12px',
                        borderRadius: 20,
                        border: '1px solid #0d9488',
                        backgroundColor: '#f0fdfa',
                        color: '#0d9488',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <Map size={14} />
                      Pinpoint on Map
                    </button>
                  </div>
                </div>
                <div className="address-form" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input type="text" placeholder="Street Address" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, outline: 'none' }} />
                  <input type="text" placeholder="City" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, outline: 'none' }} />
                  <div className="address-row" style={{ display: 'flex', gap: 12 }}>
                    <input type="text" placeholder="State" value={address.state} onChange={e => setAddress({...address, state: e.target.value})} style={{ flex: 1, padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, outline: 'none' }} />
                    <input type="text" placeholder="ZIP Code" value={address.zip_code} onChange={e => setAddress({...address, zip_code: e.target.value})} style={{ flex: 1, padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, outline: 'none' }} />
                  </div>
                </div>
              </div>

              {/* ── Payment Options & Description Below Address ── */}
              <div className="cart-payment-card" style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px 0', color: '#0f172a' }}>Payment Options</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {/* UPI / Online Option */}
                  <div
                    onClick={() => setPaymentMode('UPI')}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      border: `2px solid ${paymentMode === 'UPI' ? '#0d9488' : '#e2e8f0'}`,
                      background: paymentMode === 'UPI' ? '#f0fdfa' : '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'all 0.2s'
                    }}
                  >
                    <CreditCard size={20} color={paymentMode === 'UPI' ? '#0d9488' : '#64748b'} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>UPI / Online</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Instant Online Pay</div>
                    </div>
                  </div>

                  {/* COD Option */}
                  <div
                    onClick={() => setPaymentMode('COD')}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      border: `2px solid ${paymentMode === 'COD' ? '#0d9488' : '#e2e8f0'}`,
                      background: paymentMode === 'COD' ? '#f0fdfa' : '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'all 0.2s'
                    }}
                  >
                    <Banknote size={20} color={paymentMode === 'COD' ? '#0d9488' : '#64748b'} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Cash on Delivery</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Pay cash at doorstep</div>
                    </div>
                  </div>
                </div>

                {/* Payment Details below address */}
                <div style={{
                  background: paymentMode === 'COD' ? '#fff7ed' : '#f0fdf4',
                  border: `1px solid ${paymentMode === 'COD' ? '#fed7aa' : '#bbf7d0'}`,
                  borderRadius: 8,
                  padding: '12px 16px',
                  fontSize: 13,
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ color: '#475569', fontWeight: 500 }}>Payment Mode: </span>
                    <strong style={{ color: '#0f172a' }}>{paymentMode === 'COD' ? 'COD (Cash on Delivery)' : 'UPI / Online'}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#475569', fontWeight: 500 }}>Status: </span>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                      background: paymentMode === 'COD' ? '#f97316' : '#16a34a',
                      color: '#ffffff'
                    }}>
                      {paymentMode === 'COD' ? 'Pending' : 'Done'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right Column: Summary, Pay & Policy ── */}
            <div className="cart-right-col">
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
            </div>
          </div>
        )}
      </div>

      {/* ── Interactive Map Picker Modal ── */}
      <MapPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirmAddress={(newAddr) => {
          setAddress(prev => ({
            ...prev,
            street: newAddr.street || prev.street,
            city: newAddr.city || prev.city,
            state: newAddr.state || prev.state,
            zip_code: newAddr.zip_code || prev.zip_code
          }));
        }}
        initialAddress={address}
      />
    </div>
  );
};

export default Cart;
