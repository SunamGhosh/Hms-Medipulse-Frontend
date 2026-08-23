import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LayoutDashboard, Users, UserRound, Settings, LogOut, Activity, User, CalendarDays, Pill, FileText, FileCheck, ChevronLeft, ChevronRight, Truck } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  const [adminName, setAdminName] = useState('Admin User');
  const [adminRole, setAdminRole] = useState('Administrator');
  const [adminProfileImg, setAdminProfileImg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = () => {
      const storedName = localStorage.getItem('adminName');
      const storedEmail = localStorage.getItem('adminEmail');
      const storedImg = localStorage.getItem('adminProfileImg');

      if (storedName) {
        setAdminName(storedName.charAt(0).toUpperCase() + storedName.slice(1));
      }
      if (storedEmail) {
        setAdminRole(storedEmail);
      }
      if (storedImg) {
        setAdminProfileImg(storedImg);
      } else {
        setAdminProfileImg('');
      }
    };

    loadProfile();
    window.addEventListener('adminProfileUpdated', loadProfile);
    return () => window.removeEventListener('adminProfileUpdated', loadProfile);
  }, []);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Appointments', icon: CalendarDays, path: '/admin/appointments' },
    { name: 'Orders & Deliveries', icon: Truck, path: '/admin/orders' },
    { name: 'Patients', icon: Users, path: '/admin/patients' },
    { name: 'Doctors', icon: UserRound, path: '/admin/doctors' },
    { name: 'Pharmacists', icon: Users, path: '/admin/pharmacists' },
    { name: 'Add Doctor', icon: User, path: '/admin/add-doctor' },
    { name: 'Add Pharmacist', icon: User, path: '/admin/add-pharmacist' },
    { name: 'Medicines', icon: Pill, path: '/admin/medicines' },
    { name: 'Medicine Requests', icon: FileCheck, path: '/admin/medicine-requests' },
    { name: 'Medical Records', icon: FileText, path: '/admin/medical-records' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  return (
    <div className={`sidebar${isCollapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/img/logo.jpeg" alt="MediPulse Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain', flexShrink: 0 }} />
          {!isCollapsed && <span>MEDIPULSE</span>}
        </div>
        {toggleCollapse && (
          <button
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px',
              width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#475569', transition: 'all 0.2s', flexShrink: 0
            }}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.name}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                title={isCollapsed ? item.name : ""}
              >
                <item.icon size={20} />
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {/* Admin Profile */}
        <div className="sidebar-profile">
          <div className="sidebar-avatar" style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {adminProfileImg ? (
              <img src={adminProfileImg} alt="Admin Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={18} />
            )}
          </div>
          {!isCollapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{adminName} (Admin)</span>
              <span className="sidebar-user-role">{adminRole}</span>
            </div>
          )}
        </div>

        {/* Logout */}
        <NavLink to="/" className="nav-link logout" onClick={handleLogout} title={isCollapsed ? "Logout" : ""}>
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
