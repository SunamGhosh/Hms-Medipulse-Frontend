import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import RoleSelectionModal from '../components/RoleSelectionModal';
import SignupModal from '../components/SignupModal';
import ProfileDropdown from '../components/ProfileDropdown';
import './PharmacyPage.css';

// Mock data based on Home.jsx
const allMedicines = [
  { id: 1, name: 'Paracetamol 500mg', type: 'PAIN RELIEF', price: '₹400', stock: '150 in stock', image: '/img/medicine_bottle.png' },
  { id: 2, name: 'Amoxicillin 250mg', type: 'ANTIBIOTICS', price: '₹1000', stock: '80 in stock', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop' },
  { id: 3, name: 'Cetirizine 10mg', type: 'ALLERGY', price: '₹500', stock: '200 in stock', image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=600&auto=format&fit=crop' },
  { id: 4, name: 'Vitamin D3 1000IU', type: 'VITAMINS', price: '₹800', stock: '150 in stock', image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=600&auto=format&fit=crop' },
  { id: 5, name: 'Omeprazole 20mg', type: 'DIGESTIVE', price: '₹700', stock: '90 in stock', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=600&auto=format&fit=crop' },
  { id: 6, name: 'Ibuprofen 400mg', type: 'PAIN RELIEF', price: '₹450', stock: '110 in stock', image: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?q=80&w=600&auto=format&fit=crop' }
];

const categories = [
  'PAIN RELIEF',
  'ANTIBIOTICS',
  'ALLERGY',
  'VITAMINS',
  'DIGESTIVE'
];

const PharmacyPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const filteredMedicines = selectedCategory 
    ? allMedicines.filter(med => med.type === selectedCategory)
    : allMedicines;

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
          {localStorage.getItem('userToken') ? (
            <ProfileDropdown />
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
            {filteredMedicines.length > 0 ? (
              filteredMedicines.map(med => (
                <div key={med.id} className="pp-medicine-card">
                  <div className="pp-medicine-image-wrapper">
                    <img 
                      src={med.image} 
                      alt={med.name} 
                      className="pp-medicine-image" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop';
                      }}
                    />
                  </div>
                  <div className="pp-medicine-info">
                    <span className="pp-category-tag">{med.type}</span>
                    <h3 className="pp-medicine-name">{med.name}</h3>
                    
                    <div className="pp-medicine-pricing">
                      <span className="pp-price">{med.price}</span>
                      <span className="pp-stock">{med.stock}</span>
                    </div>
                    
                    <button className="pp-buy-btn">
                      <ShoppingCart size={16} /> Add to Cart
                    </button>
                  </div>
                </div>
              ))
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
