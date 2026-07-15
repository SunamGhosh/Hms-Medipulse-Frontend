import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LayoutDashboard, Users, UserRound, Settings, LogOut, Activity, User, CalendarDays, Pill } from 'lucide-react';
=======
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserRound, Settings, LogOut, Activity, User, CalendarDays, Pill, FileText } from 'lucide-react';
>>>>>>> b9379630105c774da540e33a91a74b53c122ecbc
import './Sidebar.css';

const Sidebar = () => {
  const [adminName, setAdminName] = useState('Admin User');
  const [adminRole, setAdminRole] = useState('Administrator');
  const navigate = useNavigate();

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
    { name: 'Appointments', icon: CalendarDays, path: '/admin/appointments' },
    { name: 'Patients', icon: Users, path: '/admin/patients' },
    { name: 'Doctors', icon: UserRound, path: '/admin/doctors' },
    { name: 'Pharmacists', icon: Users, path: '/admin/pharmacists' },
    { name: 'Add Doctor', icon: User, path: '/admin/add-doctor' },
    { name: 'Add Pharmacist', icon: User, path: '/admin/add-pharmacist' },
    { name: 'Medicines', icon: Pill, path: '/admin/medicines' },
<<<<<<< HEAD
=======
    { name: 'Medical Records', icon: FileText, path: '/admin/medical-records' },
>>>>>>> b9379630105c774da540e33a91a74b53c122ecbc
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
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <img src="/img/logo.jpeg" alt="MediPulse Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain' }} />
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
        <NavLink to="/" className="nav-link logout" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
