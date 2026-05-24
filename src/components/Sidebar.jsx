import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserRound, Settings, LogOut, Activity, User } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const [adminName, setAdminName] = useState('Admin User');
  const [adminRole, setAdminRole] = useState('Administrator');

  useEffect(() => {
    const storedName = localStorage.getItem('adminName');
    const storedEmail = localStorage.getItem('adminEmail');
    if (storedName) {
      // Capitalize first letter
      setAdminName(storedName.charAt(0).toUpperCase() + storedName.slice(1));
    }
    if (storedEmail) {
      setAdminRole(storedEmail);
    }
  }, []);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Patients', icon: Users, path: '/admin/patients' },
    { name: 'Doctors', icon: UserRound, path: '/admin/doctors' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminEmail');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <Activity size={32} color="var(--primary-color)" />
          <span>MEDIPULSE</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.name}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {/* Admin Profile */}
        <div className="sidebar-profile">
          <div className="sidebar-avatar">
            <User size={18} />
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{adminName} (Admin)</span>
            <span className="sidebar-user-role">{adminRole}</span>
          </div>
        </div>

        {/* Logout */}
        <NavLink to="/login" className="nav-link logout" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
