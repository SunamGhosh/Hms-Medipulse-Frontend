import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  ArrowLeft, 
  ShoppingBag, 
  Check, 
  AlertCircle, 
  Sparkles,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import ProfileDropdown from '../components/ProfileDropdown';
import './Wishlist.css';

const API = import.meta.env.VITE_URL || 'http://localhost:5000';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartTotalItems, setCartTotalItems] = useState(0);
  const [cartItemMap, setCartItemMap] = useState({});
  const [addingToCartId, setAddingToCartId] = useState(null);
  const [movingAllLoading, setMovingAllLoading] = useState(false);

  const token = localStorage.getItem('userToken');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast.error('Please login to view your wishlist');
      navigate('/login');
      return;
    }
    fetchWishlist();
    fetchCart();
  }, [token]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWishlistItems(data.wishlist || []);
      } else {
        toast.error(data.message || 'Failed to fetch wishlist');
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await fetch(`${API}/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.cart) {
        setCartTotalItems(data.total_items || 0);
        const map = {};
        data.cart.forEach(item => {
          map[item.medicine_id] = item.quantity;
        });
        setCartItemMap(map);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  const handleRemoveItem = async (medicineId) => {
    try {
      // Optimistic update
      setWishlistItems(prev => prev.filter(item => item.medicine_id !== medicineId));

      const res = await fetch(`${API}/wishlist/remove/${medicineId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Removed from wishlist');
      } else {
        fetchWishlist();
        toast.error(data.message || 'Failed to remove item');
      }
    } catch (err) {
      console.error('Error removing item:', err);
      fetchWishlist();
      toast.error('Failed to remove item');
    }
  };

  const handleClearWishlist = async () => {
    if (wishlistItems.length === 0) return;
    if (!window.confirm('Are you sure you want to clear your entire wishlist?')) return;

    try {
      setWishlistItems([]);
      const res = await fetch(`${API}/wishlist/clear`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Wishlist cleared');
      } else {
        fetchWishlist();
        toast.error(data.message || 'Failed to clear wishlist');
      }
    } catch (err) {
      console.error('Error clearing wishlist:', err);
      fetchWishlist();
      toast.error('Failed to clear wishlist');
    }
  };

  const handleAddToCart = async (medicineId) => {
    setAddingToCartId(medicineId);
    try {
      const res = await fetch(`${API}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ medicine_id: medicineId, quantity: 1 })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Added to cart!');
        fetchCart();
      } else {
        toast.error(data.message || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Error adding to cart');
    } finally {
      setAddingToCartId(null);
    }
  };

  const handleMoveAllToCart = async () => {
    const inStockItems = wishlistItems.filter(
      item => item.medicine && item.medicine.stock_available > 0
    );

    if (inStockItems.length === 0) {
      toast.error('No in-stock items to add');
      return;
    }

    setMovingAllLoading(true);
    let addedCount = 0;

    for (const item of inStockItems) {
      try {
        const res = await fetch(`${API}/cart/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ medicine_id: item.medicine_id, quantity: 1 })
        });
        const data = await res.json();
        if (data.success) addedCount++;
      } catch (e) {
        // continue with other items
      }
    }

    setMovingAllLoading(false);
    fetchCart();
    if (addedCount > 0) {
      toast.success(`Added ${addedCount} items to your cart!`);
    } else {
      toast.error('Could not add items to cart.');
    }
  };

  return (
    <div className="wl-container">
      {/* Navbar */}
      <nav className="wl-navbar">
        <Link to="/" className="nav-logo">
          <img src="/img/logo.jpeg" alt="MediPulse Logo" />
          <span className="nav-logo-text">MediPulse</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/doctors" className="nav-link">Doctor</Link>
          <Link to="/pharmacy" className="nav-link">Pharmacy</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </div>
        <div className="nav-actions">
          <Link to="/user/dashboard" className="btn-dashboard">Dashboard</Link>
          <Link to="/wishlist" className="nav-wishlist-icon active-nav" title="My Wishlist">
            <Heart size={20} className="wishlist-icon-filled" />
            {wishlistItems.length > 0 && <span className="wishlist-badge">{wishlistItems.length}</span>}
          </Link>
          <Link to="/cart" className="nav-cart-icon" title="My Cart">
            <ShoppingCart size={22} />
            {cartTotalItems > 0 && <span className="cart-badge">{cartTotalItems}</span>}
          </Link>
          <ProfileDropdown />
        </div>
      </nav>

      {/* Main Content */}
      <div className="wl-content-wrapper">
        <div className="wl-header-bar">
          <div>
            <div className="wl-breadcrumb">
              <Link to="/pharmacy" className="wl-breadcrumb-link">
                <ArrowLeft size={16} /> Back to Pharmacy
              </Link>
            </div>
            <div className="wl-title-row">
              <h1 className="wl-page-title">My Wishlist</h1>
              <span className="wl-badge-counter">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="wl-page-subtitle">Saved medicines you want to buy later</p>
          </div>

          {wishlistItems.length > 0 && (
            <div className="wl-actions-top">
              <button 
                className="wl-btn-clear" 
                onClick={handleClearWishlist}
                title="Clear all wishlist items"
              >
                <Trash2 size={16} /> Clear Wishlist
              </button>
              <button 
                className="wl-btn-move-all" 
                onClick={handleMoveAllToCart}
                disabled={movingAllLoading}
              >
                {movingAllLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Adding to Cart...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} /> Add All In-Stock to Cart
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="wl-loading-box">
            <Loader2 size={36} className="animate-spin text-rose-500" />
            <p>Loading your saved medicines...</p>
          </div>
        ) : wishlistItems.length > 0 ? (
          <div className="wl-grid">
            {wishlistItems.map((item) => {
              const med = item.medicine;
              if (!med) return null;
              const inStock = (med.stock_available || 0) > 0;
              const inCartQty = cartItemMap[med._id] || 0;
              const isAdding = addingToCartId === med._id;

              return (
                <div key={item.medicine_id} className="wl-card">
                  <div className="wl-card-image-box">
                    <button 
                      className="wl-remove-btn"
                      onClick={() => handleRemoveItem(med._id)}
                      title="Remove from wishlist"
                      aria-label="Remove item"
                    >
                      <Trash2 size={17} />
                    </button>
                    <img 
                      src={med.medicine_image || '/img/medicine_bottle.png'} 
                      alt={med.medicine_name} 
                      className="wl-card-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/img/medicine_bottle.png';
                      }}
                    />
                  </div>

                  <div className="wl-card-details">
                    <div className="wl-card-meta">
                      <span className="wl-card-category">{med.category}</span>
                      {inStock ? (
                        <span className="wl-stock-badge in-stock">
                          ● In Stock ({med.stock_available})
                        </span>
                      ) : (
                        <span className="wl-stock-badge out-stock">
                          ● Out of Stock
                        </span>
                      )}
                    </div>

                    <h3 className="wl-card-title">{med.medicine_name}</h3>
                    {med.generic_name && (
                      <p className="wl-card-generic">{med.generic_name}</p>
                    )}

                    <div className="wl-card-specs">
                      {med.strength && <span>{med.strength}</span>}
                      {med.unit && <span>• {med.unit}</span>}
                      {med.manufacturer && <span>• {med.manufacturer}</span>}
                    </div>

                    <div className="wl-card-footer">
                      <div className="wl-card-price">
                        ₹{med.price}
                      </div>

                      <div className="wl-card-actions">
                        <button 
                          className={`wl-btn-add-cart ${!inStock ? 'disabled' : ''} ${inCartQty > 0 ? 'in-cart' : ''}`}
                          onClick={() => handleAddToCart(med._id)}
                          disabled={!inStock || isAdding}
                        >
                          {isAdding ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : inCartQty > 0 ? (
                            <>
                              <Check size={16} /> In Cart ({inCartQty})
                            </>
                          ) : (
                            <>
                              <ShoppingCart size={16} /> Add to Cart
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="wl-empty-box">
            <div className="wl-empty-icon-wrap">
              <Heart size={48} className="wl-empty-heart" />
            </div>
            <h2 className="wl-empty-title">Your wishlist is empty</h2>
            <p className="wl-empty-desc">
              Explore our wide variety of genuine medicines and healthcare essentials. Save items here to buy whenever you need them.
            </p>
            <Link to="/pharmacy" className="wl-btn-explore">
              <ShoppingBag size={18} /> Explore Pharmacy
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
