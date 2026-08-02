import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import RoleSelectionModal from '../components/RoleSelectionModal';
import SignupModal from '../components/SignupModal';
import ProfileDropdown from '../components/ProfileDropdown';
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

const API = import.meta.env.VITE_URL || 'http://localhost:5000';

const PharmacyPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Cart state
  const [cartItems, setCartItems] = useState({});
  const [cartTotalItems, setCartTotalItems] = useState(0);

  const token = localStorage.getItem('userToken');
  const navigate = useNavigate();

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
    if (token) fetchCart();
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

  const filteredMedicines = selectedCategory 
    ? medicines.filter(med => med.category === selectedCategory)
    : medicines;

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
              <Link to="/cart" className="nav-cart-icon">
                <ShoppingCart size={22} />
                {cartTotalItems > 0 && <span className="cart-badge">{cartTotalItems}</span>}
              </Link>
              <ProfileDropdown />
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
        <h1 className="pp-page-title">Pharmacy Shop</h1>
        <p className="pp-page-subtitle">Get your medicines delivered right to your door.</p>

        <div className="pp-main-layout">
          {/* Left Sidebar: Categories */}
          <aside className="pp-sidebar">
            <ul className="pp-category-list">
              <li 
                className={`pp-category-item ${selectedCategory === '' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('')}
              >
                All Categories
              </li>
              {categories.map((cat, idx) => (
                <li 
                  key={idx} 
                  className={`pp-category-item ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </li>
              ))}
            </ul>
          </aside>

          {/* Right Content: Medicine Grid */}
          <main className="pp-medicines-grid">
            {loading ? (
              <p>Loading medicines...</p>
            ) : filteredMedicines.length > 0 ? (
              filteredMedicines.map(med => {
                const qtyInCart = cartItems[med._id] || 0;
                
                return (
                  <div key={med._id} className="pp-medicine-card">
                    <div className="pp-medicine-image-wrapper">
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
                <p>No medicines found for this category.</p>
                <button className="pp-reset-btn" onClick={() => setSelectedCategory('')}>View All Medicines</button>
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
