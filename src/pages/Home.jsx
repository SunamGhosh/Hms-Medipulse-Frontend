import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, HeartPulse, Shield, Users, ArrowRight, Stethoscope, Leaf, Search, Clock, Star, Loader2, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import RoleSelectionModal from '../components/RoleSelectionModal';
import SignupModal from '../components/SignupModal';
import BookAppointmentModal from '../components/BookAppointmentModal';
import ProfileDropdown from '../components/ProfileDropdown';
import './Home.css';

const API = import.meta.env.VITE_URL || 'http://localhost:4000/api';

const Home = () => {
  const navigate = useNavigate();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookDoctorId, setBookDoctorId] = useState(null);
  const [allDoctors, setAllDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [searchMedQuery, setSearchMedQuery] = useState('');
  const [medicinesLoading, setMedicinesLoading] = useState(true);
  const [cartTotalItems, setCartTotalItems] = useState(0);
  const token = localStorage.getItem('userToken');

  const dashboardPath = token ? '/user/dashboard' : null;

  const fetchCart = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:5000/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.cart) {
        setCartTotalItems(data.total_items || 0);
      } else {
        setCartTotalItems(0);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch(`${API}/doctor/active`);
        const data = await res.json();
        if (res.ok && data.doctors) {
          const docs = data.doctors.map(doc => ({
            id: doc._id,
            name: `Dr. ${doc.first_name} ${doc.last_name}`,
            specialty: doc.specialization,
            credentials: doc.qualification,
            rating: `${doc.experience_year}y`,
            hours: `${doc.work_time_start}-${doc.work_time_end}`,
            patients: '200+', // fallback stat
            image: (doc.profile_img && !doc.profile_img.includes('placeholder')) 
              ? doc.profile_img 
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.first_name)}+${encodeURIComponent(doc.last_name)}&background=0d9488&color=fff&size=400&font-size=0.33`
          }));
          setAllDoctors(docs.slice(0, 5));
        }
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
      } finally {
        setDoctorsLoading(false);
      }
    };
    fetchDoctors();
    
    const fetchMedicines = async () => {
      try {
        const res = await fetch('http://localhost:5000/medicine');
        const data = await res.json();
        if (data.success) {
          setMedicines(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch medicines:", error);
      } finally {
        setMedicinesLoading(false);
      }
    };
    fetchMedicines();
    fetchCart();
  }, [token]);

  const handleAddToCart = async (medicineId) => {
    if (!token) {
      toast.error('Please login to add items to your cart.');
      setIsRoleModalOpen(true);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/cart/add', {
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
      toast.error('Failed to add item to cart');
    }
  };

  const filteredMedicines = medicines.filter(med => 
    (med.medicine_name && med.medicine_name.toLowerCase().includes(searchMedQuery.toLowerCase())) || 
    (med.category && med.category.toLowerCase().includes(searchMedQuery.toLowerCase()))
  ).slice(0, 8);

  const handleBookAppointment = (doctorId = null) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      setIsRoleModalOpen(true);
      return;
    }
    setBookDoctorId(doctorId);
    setIsBookModalOpen(true);
  };

  // Simple scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector('.home-navbar');
      if (navbar) {
        if (window.scrollY > 50) {
          navbar.style.background = 'rgba(255, 255, 255, 0.95)';
          navbar.style.boxShadow = 'var(--shadow-sm)';
          navbar.style.backdropFilter = 'blur(12px)';
          navbar.style.position = 'fixed';
          navbar.style.borderBottom = '1px solid var(--border-color)';
        } else {
          navbar.style.background = 'transparent';
          navbar.style.boxShadow = 'none';
          navbar.style.backdropFilter = 'none';
          navbar.style.position = 'absolute';
          navbar.style.borderBottom = 'none';
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      id: "patient",
      icon: <Users size={28} />,
      title: "Patient Management",
      description: "Comprehensive tools for tracking patient histories, appointments, and medical records securely.",
      colorClass: "theme-blue"
    },
    {
      id: "doctor",
      icon: <Stethoscope size={28} />,
      title: "Doctor Portal",
      description: "Empower healthcare professionals with streamlined access to schedules and patient insights.",
      colorClass: "theme-teal"
    },
    {
      id: "analytics",
      icon: <Activity size={28} />,
      title: "Real-time Analytics",
      description: "Make data-driven decisions with real-time dashboards and comprehensive reporting.",
      colorClass: "theme-purple"
    },
    {
      id: "secure",
      icon: <Shield size={28} />,
      title: "Secure & Compliant",
      description: "Enterprise-grade security ensuring all medical data meets strict compliance standards.",
      colorClass: "theme-green"
    }
  ];

  return (
    <div className="home-container">
      {/* Original Navigation */}
      <nav className="home-navbar">
        <Link to="/" className="nav-logo">
          <img src="/img/logo.jpeg" alt="MediPulse Logo" />
          <span className="nav-logo-text">MediPulse</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link active">Home</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/doctors" className="nav-link">Doctor</Link>
          <Link to="/pharmacy" className="nav-link">Pharmacy</Link>
          <a href="#contact" className="nav-link">Contact</a>
        </div>
        <div className="nav-actions">
          {localStorage.getItem('userToken') ? (
            <>
              {dashboardPath && (
                <Link to={dashboardPath} className="btn-dashboard">Dashboard</Link>
              )}
              <Link to="/cart" className="nav-cart-icon">
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

      {/* Original Hero Section */}
      <section className="home-hero">
        <div className="hero-content">
          <div className="hero-badge">Next-Gen HMS platform</div>
          <h1 className="hero-title">
            Modern Healthcare <br />
            <span className="text-gradient">Management</span>
          </h1>
          <p className="hero-description">
            Transform your healthcare facility with Medipulse. Streamline operations,
            enhance patient care, and empower your medical staff with our state-of-the-art
            management system.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => setIsRoleModalOpen(true)}>
              Get Started <ArrowRight size={20} />
            </button>
            <a href="#features" className="btn-secondary">
              Learn More
            </a>
          </div>
        </div>
        <div className="hero-image-wrapper">
          <div className="hero-image-container">
            <div className="hero-image-glow"></div>
            <img
              src="/img/hero-image.png"
              alt="Modern Healthcare Technology"
              className="hero-image"
            />
          </div>
        </div>
      </section>

      {/* Original Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Why Choose Medipulse?</h2>
          <p className="section-subtitle">
            Our platform provides everything you need to run a modern, efficient,
            and patient-centered healthcare facility.
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className={`feature-card ${feature.colorClass}`}>
              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">
                {feature.description}
              </p>
              <a href="#" className="read-more-link">
                Read More <ArrowRight size={16} />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* --- NEW MEDIGROVE DESIGN APPENDED BELOW --- */}
      <div className="medigrove-container">

        {/* MediGrove Hero Section */}
        <section className="mg-hero" style={{ borderTop: '1px solid #e2e8f0' }}>
          <div className="mg-hero-content">
            <div className="mg-hero-badge">TRUSTED HEALTHCARE • SINCE 2026</div>
            <h1 className="mg-hero-title">
              Care for your whole family,<br />
              in one calm place.
            </h1>
            <p className="mg-hero-desc">
              Book appointments with trusted doctors, manage family health, and order medicines — all from a single, friendly dashboard.
            </p>
            <div className="mg-hero-actions">
              <Link to="/doctors" className="mg-btn-primary">
                <Leaf size={18} /> Find a doctor
              </Link>
              <Link to="/pharmacy" className="mg-btn-secondary">
                <Clock size={18} /> Browse pharmacy
              </Link>
            </div>
          </div>
          <div className="mg-hero-image-wrapper">
            <img
              src="/img/hero_flipboard.png"
              alt="MediGrove flipboard sign"
              className="mg-hero-image"
            />
          </div>
        </section>

        {/* Doctors Section */}
        <section id="doctors" className="mg-section">
          <div className="mg-section-header">
            <div>
              <div className="mg-section-tag">01 - OUR PHYSICIANS</div>
              <h2 className="mg-section-title">Meet the doctors</h2>
            </div>
            <div className="mg-search-bar">
              <Search size={18} color="#a0aec0" />
              <input type="text" placeholder="Search by name or specialty..." />
            </div>
          </div>

          <div className="mg-doctors-grid">
            {doctorsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', gridColumn: '1 / -1' }}>
                <Loader2 size={32} className="spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-color)' }} />
              </div>
            ) : allDoctors.map(doctor => (
              <div key={doctor.id} className="mg-card">
                <img 
                  src={doctor.image} 
                  alt={doctor.name} 
                  className="mg-card-image" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=0d9488&color=fff&size=400&font-size=0.33`;
                  }}
                />
                <div className="mg-card-content">
                  <span className="mg-card-tag">{doctor.specialty}</span>
                  <h3 className="mg-card-title">{doctor.name}</h3>
                  <p className="mg-card-subtitle">{doctor.credentials}</p>
                  <div className="mg-card-stats">
                    <div className="mg-stat"><Star size={14} /> {doctor.rating}</div>
                    <div className="mg-stat"><Clock size={14} /> {doctor.hours}</div>
                    <div className="mg-stat"><Users size={14} /> {doctor.patients}</div>
                  </div>
                  <button className="mg-card-btn" onClick={() => handleBookAppointment(doctor.id)}>Book appointment</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pharmacy Section */}
        <section id="pharmacy" className="mg-section" style={{ background: '#F8F9FA' }}>
          <div className="mg-section-header">
            <div>
              <div className="mg-section-tag">02 - PHARMACY</div>
              <h2 className="mg-section-title">Medicines at your door</h2>
            </div>
            <div className="mg-search-bar">
              <Search size={18} color="#a0aec0" />
              <input 
                type="text" 
                placeholder="Search medicines..." 
                value={searchMedQuery}
                onChange={(e) => setSearchMedQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="mg-pharmacy-grid">
            {medicinesLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>Loading medicines...</div>
            ) : filteredMedicines.length > 0 ? (
              filteredMedicines.map(med => (
                <div key={med._id} className="mg-card">
                  <img 
                    src={med.medicine_image || '/img/medicine_bottle.png'} 
                    alt={med.medicine_name} 
                    className="mg-card-image" 
                    style={{ objectFit: 'contain', padding: '1rem' }} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/img/medicine_bottle.png';
                    }}
                  />
                  <div className="mg-card-content">
                    <span className="mg-card-tag" style={{ background: '#fff3e0', color: '#e65100' }}>{med.category}</span>
                    <h3 className="mg-card-title" style={{ fontSize: '1.1rem' }}>{med.medicine_name}</h3>
                    <div className="mg-price-row">
                      <span className="mg-price">₹{med.price}</span>
                      <span className="mg-stock">{med.stock_available} in stock</span>
                    </div>
                    <button className="mg-card-btn-light" onClick={() => handleAddToCart(med._id)}>Buy</button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>No medicines found.</div>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <HeartPulse size={24} color="var(--primary-light)" />
            <span>Medipulse & MediGrove</span>
          </div>
          <p className="footer-text">
            © {new Date().getFullYear()} Healthcare Systems. All rights reserved.
          </p>
        </div>
      </footer>

      <RoleSelectionModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />

      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
      />

      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        preselectedDoctorId={bookDoctorId}
      />
    </div>
  );
};

export default Home;
