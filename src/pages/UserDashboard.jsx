import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Activity,
  CalendarCheck,
  Stethoscope,
  Pill,
  Bell,
  User,
  LogOut,
  ArrowRight,
  Clock,
  ChevronRight,
  Heart,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import './UserDashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) { navigate('/login'); return; }

    const stored = localStorage.getItem('userName') || 'User';
    setUserName(stored.charAt(0).toUpperCase() + stored.slice(1));

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const stats = [
    { icon: <CalendarCheck size={22} />, label: 'Appointments', value: '3', trend: '+1', color: 'teal' },
    { icon: <Stethoscope size={22} />, label: 'My Doctors', value: '2', trend: 'New', color: 'blue' },
    { icon: <Pill size={22} />, label: 'Prescriptions', value: '5', trend: '2 Active', color: 'purple' },
    { icon: <Heart size={22} />, label: 'Health Score', value: '92%', trend: '+5%', color: 'rose' },
  ];

  const quickActions = [
    { icon: <CalendarCheck size={20} />, label: 'Book Appointment', desc: 'Schedule with a doctor', to: '/doctors', color: 'teal' },
    { icon: <Stethoscope size={20} />, label: 'Find Doctors', desc: 'Browse specialists', to: '/doctors', color: 'blue' },
    { icon: <Pill size={20} />, label: 'Order Medicine', desc: 'From our pharmacy', to: '/pharmacy', color: 'purple' },
    { icon: <ShieldCheck size={20} />, label: 'Health Records', desc: 'View your history', to: '#', color: 'green' },
  ];

  const recentActivity = [
    { title: 'Appointment with Dr. John Carter', time: '2 days ago', status: 'Completed', statusColor: 'green' },
    { title: 'Prescription: Paracetamol 500mg', time: '5 days ago', status: 'Active', statusColor: 'teal' },
    { title: 'Profile updated', time: '1 week ago', status: 'Done', statusColor: 'blue' },
  ];

  return (
    <div className="ud-container">
      {/* Animated blobs for premium aesthetic */}
      <div className="ud-blob ud-blob-1" />
      <div className="ud-blob ud-blob-2" />
      <div className="ud-blob ud-blob-3" />

      {/* ── Sidebar ── */}
      <aside className="ud-sidebar">
        <div className="ud-sidebar-brand">
          <div className="ud-sidebar-logo">
            <Activity size={20} strokeWidth={2.5} color="#fff" />
          </div>
          <span>MediPulse</span>
        </div>

        <nav className="ud-nav">
          <a href="#" className="ud-nav-item active">
            <Activity size={18} /> Dashboard
          </a>
          <Link to="/doctors" className="ud-nav-item">
            <Stethoscope size={18} /> Doctors
          </Link>
          <Link to="/pharmacy" className="ud-nav-item">
            <Pill size={18} /> Pharmacy
          </Link>
          <a href="#" className="ud-nav-item">
            <CalendarCheck size={18} /> Appointments
          </a>
          <a href="#" className="ud-nav-item">
            <User size={18} /> My Profile
          </a>
        </nav>

        <button className="ud-logout-btn" onClick={handleLogout}>
          <LogOut size={17} /> Sign Out
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className="ud-main">

        {/* ── Welcome Hero Banner ── */}
        <div className="ud-hero">
          <div className="ud-hero-accent" />

          {/* Left: greeting */}
          <div className="ud-hero-left">
            <h1 className="ud-hero-title">
              Welcome back, <span className="ud-hero-name">{userName}</span>!
            </h1>
            <p className="ud-hero-sub">
              {greeting} &mdash; Here&apos;s your personalised health overview for today.
            </p>
          </div>

          {/* Right: date + actions in one row */}
          <div className="ud-hero-right">
            <div className="ud-date">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <button className="ud-notif-btn" aria-label="Notifications">
              <Bell size={19} />
              <span className="ud-notif-dot" />
            </button>
            <div className="ud-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <section className="ud-stats-grid">
          {stats.map((s, i) => (
            <div key={i} className={`ud-stat-card ud-stat-card--${s.color}`}>
              <div className="ud-stat-top">
                <div className={`ud-stat-icon-wrapper ud-stat-icon-wrapper--${s.color}`}>
                  {s.icon}
                </div>
                <div className="ud-stat-badge">
                  <ArrowUpRight size={14} />
                  <span>{s.trend}</span>
                </div>
              </div>
              <div className="ud-stat-bottom">
                <span className="ud-stat-value">{s.value}</span>
                <span className="ud-stat-label">{s.label}</span>
                <span className="ud-stat-sub">Compared to last month</span>
              </div>
              <div className="ud-stat-glow" />
            </div>
          ))}
        </section>

        {/* Quick actions */}
        <section className="ud-section">
          <div className="ud-section-header">
            <h2 className="ud-section-title">Quick Actions</h2>
          </div>
          <div className="ud-section-body">
            <div className="ud-actions-grid">
              {quickActions.map((a, i) => (
                <Link key={i} to={a.to} className={`ud-action-card ud-action-${a.color}`}>
                  <div className="ud-action-icon">{a.icon}</div>
                  <div className="ud-action-text">
                    <strong>{a.label}</strong>
                    <span>{a.desc}</span>
                  </div>
                  <ArrowRight size={18} className="ud-action-arrow" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Recent activity + Health tip */}
        <div className="ud-bottom-layout">

          {/* Activity */}
          <section className="ud-section">
            <div className="ud-section-header">
              <h2 className="ud-section-title">Recent Activity</h2>
            </div>
            <div className="ud-section-body">
              <ul className="ud-activity-list">
                {recentActivity.map((item, i) => (
                  <li key={i} className="ud-activity-item">
                    <div className={`ud-activity-dot ud-activity-dot--${item.statusColor}`} />
                    <div className="ud-activity-content">
                      <p className="ud-activity-title">{item.title}</p>
                      <div className="ud-activity-meta">
                        <Clock size={11} />
                        <span>{item.time}</span>
                        <span className={`ud-activity-badge ud-badge-${item.statusColor}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <a href="#" className="ud-view-all">
                View all activity <ArrowRight size={14} />
              </a>
            </div>
          </section>

          {/* Health tip */}
          <section className="ud-section">
            <div className="ud-section-header">
              <h2 className="ud-section-title">Today's Health Tip</h2>
            </div>
            <div className="ud-section-body">
              <div className="ud-tip-body">
                <div className="ud-tip-icon">💧</div>
                <h3>Stay Hydrated</h3>
                <p>
                  Drinking at least 8 glasses of water a day helps your body maintain energy levels,
                  flush out toxins, and keep your skin healthy.
                </p>
                <div className="ud-tip-tag">
                  <Heart size={12} color="#f43f5e" /> Wellness Reminder
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
