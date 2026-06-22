import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Settings, Gift } from 'lucide-react';
import './ProfileDropdown.css';

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const userName = localStorage.getItem('userName') || 'User';
  // Get initials (e.g., Sunam Ghosh -> SG)
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    window.location.reload();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <button 
        className="profile-avatar-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title={userName}
      >
        {initials}
      </button>

      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="profile-dropdown-header">
            <div className="profile-avatar-lg">{initials}</div>
            <div className="profile-info">
              <span className="profile-name">{userName}</span>
              <span className="profile-email">{userName.toLowerCase().replace(' ', '')}@gmail.com</span>
            </div>
          </div>
          
          <div className="profile-dropdown-divider"></div>
          
          <Link to="/user/dashboard" className="profile-dropdown-item" onClick={() => setIsOpen(false)}>
            <User size={18} /> My profile
          </Link>
          <div className="profile-dropdown-item" onClick={() => setIsOpen(false)}>
            <Settings size={18} /> Theme
          </div>
          <div className="profile-dropdown-item" onClick={() => setIsOpen(false)}>
            <Gift size={18} /> Share with a friend
          </div>
          
          <div className="profile-dropdown-divider"></div>
          
          <button className="profile-dropdown-item profile-logout-item" onClick={handleLogout}>
            <LogOut size={18} /> Log out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
