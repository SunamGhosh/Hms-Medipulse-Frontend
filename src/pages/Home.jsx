import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, HeartPulse, Shield, Users, ArrowRight, Stethoscope, Leaf, Search, Clock, Star } from 'lucide-react';
import RoleSelectionModal from '../components/RoleSelectionModal';
import './Home.css';

const doctors = [
  {
    id: 1,
    name: 'Dr. John Carter',
    specialty: 'General Physician',
    credentials: 'MBBS, MD',
    rating: '12y',
    hours: '09:00-17:00',
    patients: '300+',
    image: '/img/doctor_portrait.png'
  },
  {
    id: 2,
    name: 'Dr. Emily Zhang',
    specialty: 'Pediatrician',
    credentials: 'MBBS, DCH',
    rating: '8y',
    hours: '09:00-17:00',
    patients: '275+',
    image: '/img/doctor_2.png'
  },
  {
    id: 3,
    name: 'Dr. Rajiv Mehta',
    specialty: 'Cardiologist',
    credentials: 'MBBS, MD, DM Cardiology',
    rating: '15y',
    hours: '09:00-17:00',
    patients: '500+',
    image: '/img/doctor_3.png'
  },
  {
    id: 4,
    name: 'Dr. Amina Okafor',
    specialty: 'Neurologist',
    credentials: 'MBBS, DM Neurology',
    rating: '10y',
    hours: '09:30-17:30',
    patients: '450+',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=600&auto=format&fit=crop'
  }
];

const medicines = [
  {
    id: 1,
    name: 'Paracetamol 500mg',
    type: 'PAIN RELIEF',
    price: '₹400',
    stock: '150 in stock',
    image: '/img/medicine_bottle.png'
  },
  {
    id: 2,
    name: 'Amoxicillin 250mg',
    type: 'ANTIBIOTICS',
    price: '₹1000',
    stock: '80 in stock',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 3,
    name: 'Cetirizine 10mg',
    type: 'ALLERGY',
    price: '₹500',
    stock: '200 in stock',
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 4,
    name: 'Vitamin D3 1000IU',
    type: 'VITAMINS',
    price: '₹800',
    stock: '150 in stock',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 5,
    name: 'Omeprazole 20mg',
    type: 'DIGESTIVE',
    price: '₹700',
    stock: '90 in stock',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 6,
    name: 'Ibuprofen 400mg',
    type: 'PAIN RELIEF',
    price: '₹450',
    stock: '110 in stock',
    image: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?q=80&w=600&auto=format&fit=crop'
  }
];

const Home = () => {
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

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
          <div className="nav-logo-icon-wrapper">
            <Activity size={24} className="nav-logo-icon" strokeWidth={3} />
          </div>
          <span className="nav-logo-text">MediPulse</span>
        </Link>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#services" className="nav-link">Services</a>
          <Link to="/about" className="nav-link">About</Link>
          <a href="#contact" className="nav-link">Contact</a>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="btn-outline">
            Admin login
          </Link>
          <button className="btn-primary-nav" onClick={() => setIsRoleModalOpen(true)}>
            Get Started
          </button>
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
        <section className="mg-hero" style={{borderTop: '1px solid #e2e8f0'}}>
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
              <a href="#doctors" className="mg-btn-primary">
                <Leaf size={18} /> Find a doctor
              </a>
              <a href="#pharmacy" className="mg-btn-secondary">
                <Clock size={18} /> Browse pharmacy
              </a>
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
            {doctors.map(doctor => (
              <div key={doctor.id} className="mg-card">
                <img src={doctor.image} alt={doctor.name} className="mg-card-image" />
                <div className="mg-card-content">
                  <span className="mg-card-tag">{doctor.specialty}</span>
                  <h3 className="mg-card-title">{doctor.name}</h3>
                  <p className="mg-card-subtitle">{doctor.credentials}</p>
                  <div className="mg-card-stats">
                    <div className="mg-stat"><Star size={14} /> {doctor.rating}</div>
                    <div className="mg-stat"><Clock size={14} /> {doctor.hours}</div>
                    <div className="mg-stat"><Users size={14} /> {doctor.patients}</div>
                  </div>
                  <button className="mg-card-btn">Book appointment</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pharmacy Section */}
        <section id="pharmacy" className="mg-section" style={{background: '#F8F9FA'}}>
          <div className="mg-section-header">
            <div>
              <div className="mg-section-tag">02 - PHARMACY</div>
              <h2 className="mg-section-title">Medicines at your door</h2>
            </div>
            <div className="mg-search-bar">
              <Search size={18} color="#a0aec0" />
              <input type="text" placeholder="Search medicines..." />
            </div>
          </div>

          <div className="mg-pharmacy-grid">
            {medicines.map(med => (
              <div key={med.id} className="mg-card">
                <img src={med.image} alt={med.name} className="mg-card-image" style={{objectFit: 'contain', padding: '1rem'}} />
                <div className="mg-card-content">
                  <span className="mg-card-tag" style={{background: '#fff3e0', color: '#e65100'}}>{med.type}</span>
                  <h3 className="mg-card-title" style={{fontSize: '1.1rem'}}>{med.name}</h3>
                  <div className="mg-price-row">
                    <span className="mg-price">{med.price}</span>
                    <span className="mg-stock">{med.stock}</span>
                  </div>
                  <button className="mg-card-btn-light">🛒 Buy</button>
                </div>
              </div>
            ))}
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
    </div>
  );
};

export default Home;
