import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const dashboardPath = localStorage.getItem('userToken') ? '/user/dashboard' : null;


  return (
    <nav className="home-navbar" style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'transparent' }}>
      <Link to="/" className="nav-logo">
        <img src="/img/logo.jpeg" alt="MediPulse Logo" />
        <span className="nav-logo-text">MediPulse</span>
      </Link>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/about" className="nav-link">About</Link>
        <Link to="/doctors" className="nav-link">Doctor</Link>
        <Link to="/pharmacy" className="nav-link">Pharmacy</Link>
        <a href="#contact" className="nav-link">Contact</a>
      </div>
      <div className="nav-actions">
        {dashboardPath && (
          <Link to={dashboardPath} className="btn-dashboard">Dashboard</Link>
        )}
      </div>
    </nav>
  );
};

export default Header;
