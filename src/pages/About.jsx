import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Target, Users, Award, HeartPulse, Sparkles, Globe, Zap, ArrowRight } from 'lucide-react';
import ProfileDropdown from '../components/ProfileDropdown';
import RoleSelectionModal from '../components/RoleSelectionModal';
import SignupModal from '../components/SignupModal';
import './About.css';

const About = () => {
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector('.about-nav');
      if (navbar) {
        if (window.scrollY > 50) {
          navbar.style.background = 'rgba(255, 255, 255, 0.9)';
          navbar.style.backdropFilter = 'blur(20px)';
          navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
        } else {
          navbar.style.background = 'transparent';
          navbar.style.backdropFilter = 'none';
          navbar.style.boxShadow = 'none';
        }
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Scroll Animation Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="about-wrapper">
      {/* Sleek Minimal Navigation */}
      <nav className="about-nav">
        <Link to="/" className="nav-logo">
          <img src="/img/logo.jpeg" alt="MediPulse Logo" />
          <span className="nav-logo-text">MediPulse</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link active">About</Link>
          <Link to="/doctors" className="nav-link">Doctor</Link>
          <Link to="/pharmacy" className="nav-link">Pharmacy</Link>
          <a href="#contact" className="nav-link">Contact</a>
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

      {/* Hero: Split Layout with Doctor Photo */}
      <header className="premium-hero animate-on-scroll animate-fade-in">
        <div className="premium-hero-glow"></div>
        <div className="premium-hero-grid"></div>
        <div className="premium-hero-container">
          <div className="premium-hero-content">
            <div className="badge-glow">
              <Sparkles size={14} className="text-teal" /> 
              <span>THE FUTURE OF HEALTHCARE</span>
            </div>
            <h1 className="premium-title">
              Redefining <br/>
              <span className="premium-gradient">Patient Care.</span>
            </h1>
            <p className="premium-subtitle">
              Founded in 2026 by <strong>Sunam Ghosh, Ritu Singh, and Mandeep Kaur</strong>. <br/>
              We are seamlessly connecting the entire healthcare ecosystem to give doctors their time back.
            </p>
            <div className="hero-buttons">
              <a href="#stats" className="btn-explore">Explore Our Impact <ArrowRight size={18}/></a>
            </div>
          </div>
          <div className="premium-hero-image-wrapper">
            <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=800&auto=format&fit=crop" alt="Doctor providing care" className="hero-doctor-photo"/>
          </div>
        </div>
      </header>

      {/* Stats Banner */}
      <section id="stats" className="stats-banner-section">
        <div className="stats-banner-grid">
          {/* Stat 1 */}
          <div className="bento-item bento-stat theme-teal animate-on-scroll animate-stagger-item stagger-1">
            <HeartPulse size={36} className="bento-icon"/>
            <h2>500+</h2>
            <p>Partner Hospitals</p>
          </div>

          {/* Stat 2 */}
          <div className="bento-item bento-stat theme-blue animate-on-scroll animate-stagger-item stagger-2">
            <Users size={36} className="bento-icon"/>
            <h2>2M+</h2>
            <p>Patients Served</p>
          </div>

          {/* Stat 3 */}
          <div className="bento-item bento-stat theme-purple animate-on-scroll animate-stagger-item stagger-3">
            <Award size={36} className="bento-icon"/>
            <h2>99.9%</h2>
            <p>System Uptime</p>
          </div>
        </div>
      </section>

      {/* Dedicated Mission Section */}
      <section className="dedicated-mission-section animate-on-scroll animate-fade-in">
        <div className="mission-content-wrapper">
          <div className="mission-image-col">
            <img src="https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=1000&auto=format&fit=crop" alt="Medical Mission"/>
            <div className="mission-photo-glow"></div>
          </div>
          <div className="mission-text-col">
            <h2 className="premium-section-title">Our Mission</h2>
            <p className="premium-section-subtitle mb-4">Eliminating administrative friction to put the focus back on healing.</p>
            <p className="mission-body">
              Healthcare providers are drowning in paperwork and fragmented systems. Our mission is to seamlessly connect the entire healthcare ecosystem—from clinics to pharmacies to patients—giving doctors their time back so they can focus on what truly matters: patient care.
            </p>
          </div>
        </div>
      </section>

      {/* Dedicated Core Values Section */}
      <section className="dedicated-values-section animate-on-scroll animate-zoom-in">
        <div className="text-center mb-5">
           <h2 className="premium-section-title">Our Core Values</h2>
           <p className="premium-section-subtitle">The pillars that guide every line of code we write.</p>
        </div>
        <div className="values-card-grid">
          <div className="value-dedicated-card">
            <ShieldCheck size={32} className="val-icon text-teal mb-3"/>
            <h3>Uncompromising Security</h3>
            <p>Medical data is sensitive. We employ military-grade encryption.</p>
          </div>
          <div className="value-dedicated-card">
            <Target size={32} className="val-icon text-blue mb-3"/>
            <h3>Patient-Centric</h3>
            <p>Technology should heal, not hinder. Everything starts with the patient.</p>
          </div>
          <div className="value-dedicated-card">
            <Globe size={32} className="val-icon text-purple mb-3"/>
            <h3>Collaborative Care</h3>
            <p>Breaking down silos to enable seamless specialist communication.</p>
          </div>
          <div className="value-dedicated-card">
            <Zap size={32} className="val-icon text-green mb-3"/>
            <h3>Lightning Fast</h3>
            <p>Speed is critical in healthcare. Our systems operate in milliseconds.</p>
          </div>
        </div>
      </section>

      {/* Minimalist Founders Banner */}
      <section className="premium-founders">
        <div className="text-center mb-5">
           <h2 className="premium-section-title">Meet The Visionaries</h2>
           <p className="premium-section-subtitle">The leadership driving healthcare forward.</p>
        </div>
        
        <div className="founders-row">
           <div className="founder-avatar animate-on-scroll animate-stagger-item stagger-1">
             <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop" alt="Sunam Ghosh"/>
             <div className="founder-info-overlay">
                <h4>Sunam Ghosh</h4>
                <span>Chief Executive Officer</span>
             </div>
           </div>
           <div className="founder-avatar animate-on-scroll animate-stagger-item stagger-2">
             <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop" alt="Ritu Singh"/>
             <div className="founder-info-overlay">
                <h4>Ritu Singh</h4>
                <span>Chief Medical Officer</span>
             </div>
           </div>
           <div className="founder-avatar animate-on-scroll animate-stagger-item stagger-3">
             <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=600&auto=format&fit=crop" alt="Mandeep Kaur"/>
             <div className="founder-info-overlay">
                <h4>Mandeep Kaur</h4>
                <span>Chief Technology Officer</span>
             </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="premium-footer">
        <div className="premium-footer-content">
          <div className="footer-logo">
            <HeartPulse size={24} color="var(--primary-light)" />
            <span>Medipulse</span>
          </div>
          <p>© {new Date().getFullYear()} MediPulse Healthcare Systems. Designed for the future.</p>
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
    </div>
  );
};

export default About;
