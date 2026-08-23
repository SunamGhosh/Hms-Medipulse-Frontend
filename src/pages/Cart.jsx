import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ShoppingBasket, Info, MapPin, Navigation, Loader2, Map, CreditCard, Banknote, CheckCircle2, Volume2 } from 'lucide-react';
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

  // Checkout pipeline and address CRUD states
  const [checkoutStep, setCheckoutStep] = useState('address'); // 'address', 'payment'
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [userInfo, setUserInfo] = useState({ first_name: '', last_name: '', phone: '' });
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [orderConfirmedInfo, setOrderConfirmedInfo] = useState(null);

  // Address modal form states
  const [modalStreet, setModalStreet] = useState('');
  const [modalCity, setModalCity] = useState('');
  const [modalState, setModalState] = useState('');
  const [modalZipCode, setModalZipCode] = useState('');
  const [modalIsDefault, setModalIsDefault] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchCart();
    fetchUserProfileAddress();
    fetchAddresses();
  }, [navigate, token]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('http://localhost:5000/user/addresses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses || []);
        const def = (data.addresses || []).find(a => a.is_default);
        if (def) {
          setSelectedAddressId(def._id);
          setAddress({
            street: def.street,
            city: def.city,
            state: def.state,
            zip_code: def.zip_code
          });
        } else if (data.addresses && data.addresses.length > 0) {
          setSelectedAddressId(data.addresses[0]._id);
          setAddress({
            street: data.addresses[0].street,
            city: data.addresses[0].city,
            state: data.addresses[0].state,
            zip_code: data.addresses[0].zip_code
          });
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setModalStreet('');
    setModalCity('');
    setModalState('');
    setModalZipCode('');
    setModalIsDefault(addresses.length === 0);
    setShowAddressModal(true);
  };

  const handleOpenEditModal = (addr, e) => {
    if (e) e.stopPropagation();
    setEditingAddress(addr);
    setModalStreet(addr.street || '');
    setModalCity(addr.city || '');
    setModalState(addr.state || '');
    setModalZipCode(addr.zip_code || addr.pincode || '');
    setModalIsDefault(addr.is_default || false);
    setShowAddressModal(true);
  };

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setAddress({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zip_code: addr.zip_code
    });
  };

  const handleDeleteAddress = async (addressId, e) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await fetch(`http://localhost:5000/user/addresses/${addressId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Address deleted successfully.');
        fetchAddresses();
        if (selectedAddressId === addressId) {
          setSelectedAddressId(null);
          setAddress({ street: '', city: '', state: '', zip_code: '' });
        }
      } else {
        toast.error(data.message || 'Failed to delete address.');
      }
    } catch (err) {
      console.error('Delete address error:', err);
      toast.error('Error deleting address.');
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!modalStreet || !modalCity || !modalState || !modalZipCode) {
      toast.error('All fields are required.');
      return;
    }

    const body = {
      street: modalStreet,
      city: modalCity,
      state: modalState,
      zip_code: modalZipCode,
      is_default: modalIsDefault
    };

    try {
      const url = editingAddress
        ? `http://localhost:5000/user/addresses/${editingAddress._id}`
        : 'http://localhost:5000/user/addresses';
      const method = editingAddress ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingAddress ? 'Address updated successfully!' : 'Address added successfully!');
        setShowAddressModal(false);
        fetchAddresses();
      } else {
        toast.error(data.message || 'Failed to save address.');
      }
    } catch (err) {
      console.error('Save address error:', err);
      toast.error('Error saving address.');
    }
  };

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
    try {
      const storedUser = localStorage.getItem('user') || localStorage.getItem('userInfo');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUserInfo({
          first_name: parsed.first_name || '',
          last_name: parsed.last_name || '',
          phone: parsed.phone || ''
        });
        fillAddressFromObjOrString(parsed.address, parsed.city, parsed.state, parsed.zip_code || parsed.pincode);
      }
    } catch (e) {}

    try {
      const API_URL = import.meta.env.VITE_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const user = data.user || data;
      if (user) {
        setUserInfo({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          phone: user.phone || ''
        });
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

            if (showAddressModal) {
              setModalStreet(streetName || data.display_name || '');
              setModalCity(city);
              setModalState(state);
              setModalZipCode(zip);
            } else {
              setAddress({
                street: streetName || data.display_name || '',
                city: city,
                state: state,
                zip_code: zip
              });
            }
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
  const [showCodSuccessModal, setShowCodSuccessModal] = useState(false);

  const playBuzzerSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();

      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(150, audioCtx.currentTime); // Low buzz

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(151.5, audioCtx.currentTime); // Slightly detuned square

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.05); // Attack
      gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime + 0.95);
      gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 1.05); // 1.0 second duration

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start();
      osc2.start();

      osc1.stop(audioCtx.currentTime + 1.05);
      osc2.stop(audioCtx.currentTime + 1.05);
    } catch (e) {
      console.warn("Failed to play buzzer sound", e);
    }
  };

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
          playBuzzerSound();
          setCartItems([]);
          setOrderConfirmedInfo({
            name: `${userInfo.first_name} ${userInfo.last_name}`,
            phone: userInfo.phone,
            address: `${address.street}, ${address.city}, ${address.state} - ${address.zip_code}`
          });
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
            setOrderConfirmedInfo({
              name: `${userInfo.first_name} ${userInfo.last_name}`,
              phone: userInfo.phone,
              address: `${address.street}, ${address.city}, ${address.state} - ${address.zip_code}`
            });
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

  const itemsTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const handlingFee = 9;
  const grandTotal = itemsTotal + handlingFee;
  const totalQty   = cartItems.reduce((s, i) => s + i.quantity, 0);
  const hasItems   = cartItems.length > 0;

  if (orderConfirmedInfo) {
    return (
      <div className="cart-page">
        {/* Navbar */}
        <nav className="cart-navbar">
          <button className="cart-nav-back" onClick={() => navigate('/pharmacy')}>
            <ArrowLeft size={18} /> My Cart
          </button>
          <span className="cart-nav-title">Order Confirmed</span>
          <ProfileDropdown />
        </nav>

        {/* Step progress bar */}
        <div className="checkout-pipeline-header">
          <div className="steps-pipeline">
            <span className="step-name completed" onClick={() => navigate('/pharmacy')}>ADDRESS</span>
            <span className="step-dots">--------------------</span>
            <span className="step-name completed">PAYMENT</span>
          </div>
          <div className="secure-badge">
            <svg className="shield-icon" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" width="16" height="16">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>100% SECURE</span>
          </div>
        </div>

        <div className="order-confirmed-body">
          <div className="order-confirmed-card">
            <div className="success-checkmark-circle">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            
            <h2 className="confirmed-title">Order confirmed</h2>
            <p className="confirmed-desc">
              Your order is confirmed. You will receive an order confirmation email/SMS shortly with the expected delivery date for your items.
            </p>

            <div className="delivery-info-box">
              <div className="delivery-left">
                <span className="delivering-to-label">Delivering to:</span>
                <p className="delivery-recipient">
                  <strong>{orderConfirmedInfo.name}</strong>
                  <span className="recipient-divider">|</span>
                  <span className="recipient-phone">{orderConfirmedInfo.phone}</span>
                </p>
                <p className="delivery-full-address">{orderConfirmedInfo.address}</p>
                
                <button className="myntra-order-details-btn" onClick={() => navigate('/my-orders')}>
                  ORDER DETAILS &gt;
                </button>
              </div>

              <div className="delivery-right-illustrations">
                <svg width="90" height="70" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="scooter-svg-illustration">
                  <line x1="5" y1="62" x2="95" y2="62" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M15 50h32l4-15h14l4 15h15" stroke="#ff3f6c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="18" y="30" width="16" height="20" rx="3" fill="#ff3f6c"/>
                  <rect x="22" y="34" width="8" height="12" fill="white" opacity="0.3"/>
                  <path d="M69 35l-2-12h5" stroke="#334155" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="28" cy="58" r="8" fill="#e2e8f0" stroke="#334155" strokeWidth="4"/>
                  <circle cx="72" cy="58" r="8" fill="#e2e8f0" stroke="#334155" strokeWidth="4"/>
                  <line x1="2" y1="33" x2="10" y2="33" stroke="#ff3f6c" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="6" y1="40" x2="12" y2="40" stroke="#ff3f6c" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            <div className="track-hint-text">
              <span className="sparkle-icon">✨</span>
              You can Track/View/Modify order from orders page.
            </div>
            
            <button className="myntra-go-orders-btn" onClick={() => navigate('/my-orders')}>
              Go to My Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Checkout step progress pipeline */}
      {hasItems && (
        <div className="checkout-pipeline-header">
          <div className="steps-pipeline">
            <span 
              className={`step-name ${checkoutStep === 'address' ? 'active' : ''} ${(checkoutStep === 'payment') ? 'completed' : ''}`}
              onClick={() => setCheckoutStep('address')}
            >
              ADDRESS
            </span>
            <span className="step-dots">--------------------</span>
            <span 
              className={`step-name ${checkoutStep === 'payment' ? 'active' : ''}`}
              onClick={() => {
                if (cartItems.length > 0 && address.street && address.city) {
                  setCheckoutStep('payment');
                }
              }}
            >
              PAYMENT
            </span>
          </div>
          <div className="secure-badge">
            <svg className="shield-icon" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" width="16" height="16">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>100% SECURE</span>
          </div>
        </div>
      )}

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
              {/* ── Step 1: ADDRESS (with compact items preview) ── */}
              {checkoutStep === 'address' && (
                <>
                  <div className="cart-items-card compact" style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 20 }}>
                    <div className="cart-items-header" style={{ padding: '14px 20px 10px', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Items in Order ({totalQty})</span>
                    </div>
                    {cartItems.map(item => (
                      <div className="cart-item-row compact" key={item.medicine_id} style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid #f8fafc', gap: 14 }}>
                        <img
                          src={item.medicine_image || '/img/medicine_bottle.png'}
                          alt={item.medicine_name}
                          className="cart-item-img compact"
                          style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, background: '#f8fafc', padding: 4, flexShrink: 0, border: '1px solid #e2e8f0' }}
                          onError={e => { e.target.src = '/img/medicine_bottle.png'; }}
                        />
                        <div className="cart-item-info compact" style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.medicine_name}</h4>
                          <p className="cart-item-meta" style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Qty: {item.quantity} &middot; ₹{item.price} each</p>
                        </div>
                        <div className="blinkit-qty compact" style={{ display: 'flex', alignItems: 'center', background: '#16a34a', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                          <button onClick={() => handleQuantity(item.medicine_id, 'decrease')} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.95rem', fontWeight: 700, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <span style={{ color: 'white', fontWeight: 700, fontSize: '0.82rem', minWidth: 18, textAlign: 'center' }}>{item.quantity}</span>
                          <button onClick={() => handleQuantity(item.medicine_id, 'increase')} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.95rem', fontWeight: 700, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="checkout-address-section">
                    <div className="address-section-header">
                      <h3>Select Delivery Address</h3>
                      <button className="add-address-top-btn" onClick={handleOpenAddModal}>ADD NEW ADDRESS</button>
                    </div>

                    {addresses.length === 0 ? (
                      <div className="no-addresses-card" onClick={handleOpenAddModal}>
                        <MapPin size={32} className="no-addr-icon" />
                        <p>No saved addresses found. Click to add your delivery address.</p>
                        <button className="add-addr-btn">+ Add Address</button>
                      </div>
                    ) : (
                      <div className="address-cards-list">
                        {addresses.map(addr => {
                          const isSelected = addr._id === selectedAddressId;
                          return (
                            <div 
                              className={`address-card ${isSelected ? 'selected' : ''}`} 
                              key={addr._id} 
                              onClick={() => handleSelectAddress(addr)}
                            >
                              <div className="address-card-header">
                                <label className="custom-radio">
                                  <input 
                                    type="radio" 
                                    name="selected_address" 
                                    checked={isSelected} 
                                    onChange={() => handleSelectAddress(addr)} 
                                  />
                                  <span className="radio-checkmark"></span>
                                </label>
                                <span className="address-name">{userInfo.first_name} {userInfo.last_name}</span>
                                <span className="address-badge">{addr.is_default ? 'HOME' : 'OTHER'}</span>
                              </div>
                              <div className="address-card-details">
                                <p>{addr.street}</p>
                                <p>{addr.city}, {addr.state} - <strong>{addr.zip_code}</strong></p>
                                <p className="address-phone">Mobile: {userInfo.phone}</p>
                              </div>
                              <div className="address-card-actions">
                                <button className="addr-action-btn remove" onClick={(e) => handleDeleteAddress(addr._id, e)}>REMOVE</button>
                                <button className="addr-action-btn edit" onClick={(e) => handleOpenEditModal(addr, e)}>EDIT</button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Add New Address dashed card */}
                        <div className="add-new-address-dashed" onClick={handleOpenAddModal}>
                          <span className="dashed-text">+ Add New Address</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Step 2: PAYMENT ── */}
              {checkoutStep === 'payment' && (
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
                    flexDirection: 'column',
                    gap: 8
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
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
                    {paymentMode === 'COD' && (
                      <div style={{ 
                        fontSize: 12, 
                        color: '#c2410c', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6, 
                        borderTop: '1px dashed #fed7aa', 
                        paddingTop: 8,
                        marginTop: 2
                      }}>
                        <Volume2 size={14} style={{ flexShrink: 0 }} />
                        <span><strong>Side Note:</strong> A 1-second buzzer alarm will play upon successful booking.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
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

                <div className="bill-row">
                  <span className="label">Handling Fee</span>
                  <span className="amount">₹{handlingFee.toFixed(2)}</span>
                </div>

                <hr className="bill-divider" />

                <div className="bill-row grand-total">
                  <span className="label">Grand total</span>
                  <span className="amount">₹{grandTotal.toFixed(2)}</span>
                </div>

                <hr className="bill-divider" />

                {/* ── Dynamic Action Button ── */}
                {checkoutStep === 'address' && (
                  <button
                    className="bill-pay-btn"
                    onClick={() => {
                      if (!address.street || !address.city || !address.state || !address.zip_code) {
                        toast.error('Please select or add an address to continue.');
                        return;
                      }
                      setCheckoutStep('payment');
                    }}
                  >
                    <div className="bill-pay-left">
                      <span className="bill-pay-amount">₹{grandTotal.toFixed(2)}</span>
                      <span className="bill-pay-label">Total payable</span>
                    </div>
                    <div className="bill-pay-right">
                      Continue
                      <ChevronRight size={18} />
                    </div>
                  </button>
                )}

                {checkoutStep === 'payment' && (
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
                )}
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

      {/* ── Add / Edit Address Modal ── */}
      {showAddressModal && (
        <div className="address-modal-overlay">
          <div className="address-modal-container">
            <div className="address-modal-header">
              <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              <button className="close-modal-btn" onClick={() => setShowAddressModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveAddress} className="address-modal-form">
              <div className="form-group">
                <input 
                  type="text" 
                  placeholder="Street Address (Flat, House No, Building)" 
                  value={modalStreet} 
                  onChange={e => setModalStreet(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <input 
                  type="text" 
                  placeholder="City" 
                  value={modalCity} 
                  onChange={e => setModalCity(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <input 
                    type="text" 
                    placeholder="State" 
                    value={modalState} 
                    onChange={e => setModalState(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="text" 
                    placeholder="Pincode" 
                    value={modalZipCode} 
                    onChange={e => setModalZipCode(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              {/* GPS & Map Picker Row inside modal */}
              <div className="modal-location-tools">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="modal-tool-btn gps"
                >
                  {detectingLocation ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                  {detectingLocation ? 'Locating...' : 'GPS Detect'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="modal-tool-btn map"
                >
                  <Map size={14} />
                  Pinpoint on Map
                </button>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={modalIsDefault} 
                    onChange={e => setModalIsDefault(e.target.checked)} 
                    disabled={!editingAddress && addresses.length === 0}
                  />
                  <span>Make this my default address</span>
                </label>
              </div>

              <div className="address-modal-actions">
                <button type="button" className="modal-btn cancel" onClick={() => setShowAddressModal(false)}>Cancel</button>
                <button type="submit" className="modal-btn save">{editingAddress ? 'Save Changes' : 'Add Address'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Interactive Map Picker Modal ── */}
      <MapPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirmAddress={(newAddr) => {
          if (showAddressModal) {
            setModalStreet(newAddr.street || '');
            setModalCity(newAddr.city || '');
            setModalState(newAddr.state || '');
            setModalZipCode(newAddr.zip_code || '');
          } else {
            setAddress(prev => ({
              ...prev,
              street: newAddr.street || prev.street,
              city: newAddr.city || prev.city,
              state: newAddr.state || prev.state,
              zip_code: newAddr.zip_code || prev.zip_code
            }));
          }
        }}
        initialAddress={showAddressModal ? { street: modalStreet, city: modalCity, state: modalState, zip_code: modalZipCode } : address}
      />
    </div>
  );
};

export default Cart;
