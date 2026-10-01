import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import RoleSelectionModal from '../components/RoleSelectionModal';
import SignupModal from '../components/SignupModal';
import ProfileDropdown from '../components/ProfileDropdown';
import API_BASE_URL from '../config/api';
import './PharmacyPage.css';

const categories = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Cream',
  'Drops',
  'Powder',
  'Other'
];

const API = API_BASE_URL;

const PharmacyPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  
  // Cart state
  const [cartItems, setCartItems] = useState({});
  const [cartTotalItems, setCartTotalItems] = useState(0);

  // Wishlist state
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [wishlistTotalItems, setWishlistTotalItems] = useState(0);

  const token = localStorage.getItem('userToken');
  const navigate = useNavigate();

  const dashboardPath = token ? '/user/dashboard' : null;

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await fetch(`${API}/medicine`);
        const data = await response.json();
        if (data.success) {
          setMedicines(data.data || []);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching medicines:', error);
        setLoading(false);
      }
    };
    
    fetchMedicines();
    if (token) {
      fetchCart();
      fetchWishlist();
    }
  }, [token]);

  const fetchCart = async () => {
    try {
      const response = await fetch(`${API}/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.cart) {
        setCartTotalItems(data.total_items);
        const itemsMap = {};
        data.cart.forEach(item => {
          itemsMap[item.medicine_id] = item.quantity;
        });
        setCartItems(itemsMap);
      } else {
        setCartTotalItems(0);
        setCartItems({});
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  const fetchWishlist = async () => {
    try {
      const response = await fetch(`${API}/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setWishlistIds(new Set(data.medicine_ids || []));
        setWishlistTotalItems(data.total_items || 0);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    }
  };

  const handleToggleWishlist = async (medicineId, e) => {
    if (e) e.stopPropagation();
    if (!token) {
      toast.error('Please login to save medicines to your wishlist.');
      setIsRoleModalOpen(true);
      return;
    }

    const wasWishlisted = wishlistIds.has(medicineId);
    const updatedSet = new Set(wishlistIds);
    if (wasWishlisted) {
      updatedSet.delete(medicineId);
    } else {
      updatedSet.add(medicineId);
    }
    setWishlistIds(updatedSet);
    setWishlistTotalItems(updatedSet.size);

    try {
      const res = await fetch(`${API}/wishlist/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ medicine_id: medicineId })
      });
      const data = await res.json();
      if (data.success) {
        if (data.in_wishlist) {
          toast.success('Added to wishlist ❤️');
        } else {
          toast('Removed from wishlist', { icon: '🤍' });
        }
        if (typeof data.total_items === 'number') {
          setWishlistTotalItems(data.total_items);
        }
      } else {
        fetchWishlist();
        toast.error(data.message || 'Failed to update wishlist');
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      fetchWishlist();
      toast.error('Failed to update wishlist');
    }
  };

  const handleAddToCart = async (medicineId) => {
    if (!token) {
      toast.error('Please login to add items to your cart.');
      setIsRoleModalOpen(true);
      return;
    }
    
    try {
      const response = await fetch(`${API}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ medicine_id: medicineId, quantity: 1 })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Added to cart!');
        fetchCart();
      } else {
        toast.error(data.message || 'Error adding to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error adding to cart');
    }
  };

  const handleUpdateQuantity = async (medicineId, action) => {
    if (!token) return;
    try {
      if (action === 'decrease' && cartItems[medicineId] === 1) {
        // Remove item if quantity becomes 0
        const response = await fetch(`${API}/cart/remove/${medicineId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) fetchCart();
        return;
      }

      const endpoint = action === 'increase' 
        ? `${API}/cart/increase/${medicineId}`
        : `${API}/cart/decrease/${medicineId}`;
        
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        fetchCart();
      } else {
        toast.error(data.message || 'Error updating quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setActiveSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setActiveSearchQuery('');
  };

  const filteredMedicines = medicines.filter(med => {
    if (showWishlistOnly && !wishlistIds.has(med._id)) {
      return false;
    }
    const matchesCategory = !selectedCategory || med.category === selectedCategory;
    const q = activeSearchQuery.trim().toLowerCase();
    const name = (med.medicine_name || '').toLowerCase();
    const generic = (med.generic_name || '').toLowerCase();
    const cat = (med.category || '').toLowerCase();
    const mfg = (med.manufacturer || '').toLowerCase();
    const matchesSearch = !q || name.includes(q) || generic.includes(q) || cat.includes(q) || mfg.includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pp-container">
      {/* Navigation */}
      <nav className="pp-navbar">
        <Link to="/" className="nav-logo">
          <img src="/img/logo.jpeg" alt="MediPulse Logo" />
          <span className="nav-logo-text">MediPulse</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/doctors" className="nav-link">Doctor</Link>
          <Link to="/pharmacy" className="nav-link active">Pharmacy</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </div>
        <div className="nav-actions">
          {token ? (
            <>
              {dashboardPath && (
                <Link to={dashboardPath} className="btn-dashboard">Dashboard</Link>
              )}
              <Link to="/wishlist" className="nav-wishlist-icon" title="My Wishlist">
                <Heart size={20} className={wishlistTotalItems > 0 ? "wishlist-icon-filled" : ""} />
                {wishlistTotalItems > 0 && <span className="wishlist-badge">{wishlistTotalItems}</span>}
              </Link>
              <Link to="/cart" className="nav-cart-icon" title="My Cart">
                <ShoppingCart size={22} />
                {cartTotalItems > 0 && <span className="cart-badge">{cartTotalItems}</span>}
              </Link>
              <ProfileDropdown />
            </>
          ) : dashboardPath ? (
            <>
              <Link to={dashboardPath} className="btn-dashboard">Dashboard</Link>
            </>
          ) : (
            <>
              <button className="btn-outline" onClick={() => setIsSignupModalOpen(true)}>
                Signup
              </button>
              <button className="btn-primary-nav" onClick={() => setIsRoleModalOpen(true)}>
                Login
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="pp-content-wrapper">
        <div className="pp-header-row">
          <div>
            <h1 className="pp-page-title">Pharmacy Shop</h1>
            <p className="pp-page-subtitle">Get your medicines delivered right to your door.</p>
          </div>

          {/* Search Medicine Bar with Search Button */}
          <form onSubmit={handleSearchSubmit} className="pp-search-form">
            <div className="pp-search-box-container">
              <Search size={18} className="pp-search-icon" />
              <input
                type="text"
                placeholder="Search medicine, category, or generic..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setActiveSearchQuery(e.target.value);
                }}
                className="pp-search-input"
              />
              {searchInput && (
                <button type="button" className="pp-search-clear-btn" onClick={handleClearSearch} title="Clear search">
                  <X size={16} />
                </button>
              )}
            </div>
            <button type="submit" className="pp-search-submit-btn">
              <Search size={16} /> Search
            </button>
          </form>
        </div>

        <div className="pp-main-layout">
          {/* Left Sidebar: Categories */}
          <aside className="pp-sidebar">
            <ul className="pp-category-list">
              <li 
                className={`pp-category-item ${selectedCategory === '' && !showWishlistOnly ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory('');
                  setShowWishlistOnly(false);
                }}
              >
                All Categories
              </li>
              {categories.map((cat, idx) => (
                <li 
                  key={idx} 
                  className={`pp-category-item ${selectedCategory === cat && !showWishlistOnly ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setShowWishlistOnly(false);
                  }}
                >
                  {cat}
                </li>
              ))}

              {token && (
                <li 
                  className={`pp-category-item pp-category-item-wishlist ${showWishlistOnly ? 'active' : ''}`}
                  onClick={() => {
                    setShowWishlistOnly(!showWishlistOnly);
                    setSelectedCategory('');
                  }}
                  title="Filter to only wishlisted items"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Heart size={16} fill="#e11d48" color="#e11d48" /> My Wishlist
                  </span>
                  <span className="pp-wishlist-count-pill">{wishlistTotalItems}</span>
                </li>
              )}
            </ul>
          </aside>

          {/* Right Content: Medicine Grid */}
          <main className="pp-medicines-grid">
            {loading ? (
              <p>Loading medicines...</p>
            ) : filteredMedicines.length > 0 ? (
              filteredMedicines.map(med => {
                const qtyInCart = cartItems[med._id] || 0;
                const isWishlisted = wishlistIds.has(med._id);
                
                return (
                  <div key={med._id} className="pp-medicine-card">
                    <div className="pp-medicine-image-wrapper">
                      <button 
                        type="button" 
                        className={`pp-wishlist-btn ${isWishlisted ? 'active' : ''}`}
                        onClick={(e) => handleToggleWishlist(med._id, e)}
                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                        aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        <Heart 
                          size={18} 
                          fill={isWishlisted ? "#e11d48" : "none"} 
                          color={isWishlisted ? "#e11d48" : "#64748b"} 
                        />
                      </button>
                      <img 
                        src={med.medicine_image || '/img/medicine_bottle.png'} 
                        alt={med.medicine_name} 
                        className="pp-medicine-image" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/img/medicine_bottle.png';
                        }}
                      />
                    </div>
                    <div className="pp-medicine-info">
                      <span className="pp-category-tag">{med.category}</span>
                      <h3 className="pp-medicine-name">{med.medicine_name}</h3>
                      
                      <div className="pp-medicine-pricing">
                        <span className="pp-price">₹{med.price}</span>
                        <span className="pp-stock">{med.stock_available} in stock</span>
                      </div>
                      
                      <button 
                        className="pp-buy-btn"
                        onClick={() => handleAddToCart(med._id)}
                      >
                        ADD TO CART
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="pp-no-medicines">
                {showWishlistOnly ? (
                  <>
                    <Heart size={44} color="#e11d48" style={{ marginBottom: '12px' }} />
                    <p>Your wishlist is currently empty.</p>
                    <button className="pp-reset-btn" onClick={() => setShowWishlistOnly(false)}>Browse All Medicines</button>
                  </>
                ) : (
                  <>
                    <p>No medicines found for this category.</p>
                    <button className="pp-reset-btn" onClick={() => { setSelectedCategory(''); setShowWishlistOnly(false); }}>View All Medicines</button>
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      <RoleSelectionModal 
        isOpen={isRoleModalOpen} 
        onClose={() => setIsRoleModalOpen(false)} 
      />

      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
      />
    </div>
  );
};

export default PharmacyPage;
