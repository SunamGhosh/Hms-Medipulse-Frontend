import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, CalendarCheck, Stethoscope, Pill, Heart, Package,
  User, LogOut, Plus, ChevronLeft, ChevronRight, ShoppingCart
} from 'lucide-react';
import toast from 'react-hot-toast';
import API_BASE_URL from '../config/api';
import './UserSidebar.css';

const API = API_BASE_URL;

const UserSidebar = ({
  activeItem = 'dashboard',
  sidebarCollapsed: controlledCollapsed,
  setSidebarCollapsed: controlledSetCollapsed,
  pendingAppts: propPendingAppts,
  onViewChange,
  onBookClick
}) => {
  const navigate = useNavigate();

  // Internal collapse state if not controlled
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    if (window.innerWidth <= 1024) return true;
    const saved = localStorage.getItem('userSidebarCollapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    if (controlledSetCollapsed) {
      controlledSetCollapsed(nextVal);
    } else {
      setInternalCollapsed(nextVal);
    }
    localStorage.setItem('userSidebarCollapsed', JSON.stringify(nextVal));
  };

  // Pending appointments count badge
  const [pendingCount, setPendingCount] = useState(propPendingAppts || 0);

  useEffect(() => {
    if (propPendingAppts !== undefined) {
      setPendingCount(propPendingAppts);
      return;
    }
    const token = localStorage.getItem('userToken');
    if (!token) return;

    fetch(`${API}/appointment/my`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.appointments) {
          const count = data.appointments.filter(a => a.status === 'pending').length;
          setPendingCount(count);
        }
      })
      .catch(() => {});
  }, [propPendingAppts]);

  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) return;

    fetch(`${API}/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setCartCount(data.total_items || (data.cart ? data.cart.length : 0));
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleNav = (itemKey) => {
    switch (itemKey) {
      case 'dashboard':
        if (onViewChange) {
          onViewChange('dashboard');
        } else {
          navigate('/user/dashboard', { state: { view: 'dashboard' } });
        }
        break;

      case 'doctors':
        navigate('/doctors');
        break;

      case 'pharmacy':
        navigate('/pharmacy');
        break;

      case 'wishlist':
        navigate('/wishlist');
        break;

      case 'cart':
        navigate('/cart');
        break;

      case 'appointments':
        if (onViewChange) {
          onViewChange('appointments');
        } else {
          navigate('/user/dashboard', { state: { view: 'appointments' } });
        }
        break;

      case 'orders':
        if (onViewChange) {
          onViewChange('orders');
        } else {
          navigate('/user/dashboard', { state: { view: 'orders' } });
        }
        break;

      case 'profile':
        if (onViewChange) {
          onViewChange('profile');
        } else {
          navigate('/user/dashboard', { state: { view: 'profile' } });
        }
        break;

      case 'book':
        if (onBookClick) {
          onBookClick();
        } else {
          navigate('/doctors');
        }
        break;

      default:
        break;
    }
  };

  return (
    <aside className={`ud-sidebar${isCollapsed ? ' collapsed' : ''}`}>
      {/* Brand Header */}
      <div className={`ud-sidebar-brand${isCollapsed ? ' collapsed' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="ud-sidebar-logo" onClick={() => handleNav('dashboard')} style={{ cursor: 'pointer' }}>
            <Activity size={20} strokeWidth={2.5} color="#fff" />
          </div>
          {!isCollapsed && <span className="ud-sidebar-brand-name">MediPulse</span>}
        </div>
        <button
          className="ud-sidebar-toggle-btn"
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="ud-nav">
        {/* Dashboard */}
        <button
          className={`ud-nav-item${activeItem === 'dashboard' ? ' active' : ''}`}
          onClick={() => handleNav('dashboard')}
          title={isCollapsed ? 'Dashboard' : ''}
        >
          <Activity size={18} /> {!isCollapsed && <span>Dashboard</span>}
        </button>

        {/* Doctors */}
        <button
          className={`ud-nav-item${activeItem === 'doctors' ? ' active' : ''}`}
          onClick={() => handleNav('doctors')}
          title={isCollapsed ? 'Doctors' : ''}
        >
          <Stethoscope size={18} /> {!isCollapsed && <span>Doctors</span>}
        </button>

        {/* Pharmacy */}
        <button
          className={`ud-nav-item${activeItem === 'pharmacy' ? ' active' : ''}`}
          onClick={() => handleNav('pharmacy')}
          title={isCollapsed ? 'Pharmacy' : ''}
        >
          <Pill size={18} /> {!isCollapsed && <span>Pharmacy</span>}
        </button>

        {/* My Wishlist */}
        <button
          className={`ud-nav-item${activeItem === 'wishlist' ? ' active' : ''}`}
          onClick={() => handleNav('wishlist')}
          title={isCollapsed ? 'My Wishlist' : ''}
        >
          <Heart size={18} /> {!isCollapsed && <span>My Wishlist</span>}
        </button>

        {/* My Cart */}
        <button
          className={`ud-nav-item${activeItem === 'cart' ? ' active' : ''}`}
          onClick={() => handleNav('cart')}
          title={isCollapsed ? 'My Cart' : ''}
        >
          <ShoppingCart size={18} /> {!isCollapsed && <span>My Cart</span>}
          {cartCount > 0 && (
            <span
              className="ud-nav-item-badge"
              style={{ marginLeft: isCollapsed ? '0' : 'auto' }}
            >
              {cartCount}
            </span>
          )}
        </button>

        {/* Appointments */}
        <button
          className={`ud-nav-item${activeItem === 'appointments' ? ' active' : ''}`}
          onClick={() => handleNav('appointments')}
          title={isCollapsed ? 'Appointments' : ''}
        >
          <CalendarCheck size={18} /> {!isCollapsed && <span>Appointments</span>}
          {pendingCount > 0 && (
            <span
              className="ud-nav-item-badge"
              style={{ marginLeft: isCollapsed ? '0' : 'auto' }}
            >
              {pendingCount}
            </span>
          )}
        </button>

        {/* My Orders */}
        <button
          className={`ud-nav-item${activeItem === 'orders' ? ' active' : ''}`}
          onClick={() => handleNav('orders')}
          title={isCollapsed ? 'My Orders' : ''}
        >
          <Package size={18} /> {!isCollapsed && <span>My Orders</span>}
        </button>

        {/* Book Appointment CTA */}
        <div className="ud-nav-divider" />
        <button
          className="ud-nav-item ud-nav-book"
          onClick={() => handleNav('book')}
          title={isCollapsed ? 'Book Appointment' : ''}
          style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
        >
          <Plus size={18} /> {!isCollapsed && <span>Book Appointment</span>}
        </button>
        <div className="ud-nav-divider" />

        {/* My Profile */}
        <button
          className={`ud-nav-item${activeItem === 'profile' ? ' active' : ''}`}
          onClick={() => handleNav('profile')}
          title={isCollapsed ? 'My Profile' : ''}
        >
          <User size={18} /> {!isCollapsed && <span>My Profile</span>}
        </button>
      </nav>

      {/* Logout */}
      <button
        className="ud-logout-btn"
        onClick={handleLogout}
        title={isCollapsed ? 'Sign Out' : ''}
        style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
      >
        <LogOut size={17} /> {!isCollapsed && <span>Sign Out</span>}
      </button>
    </aside>
  );
};

export default UserSidebar;
