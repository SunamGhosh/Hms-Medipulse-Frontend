import React from 'react';
import {
  Users, Calendar, TrendingUp, DollarSign,
  ArrowUpRight, ArrowDownRight, Heart, Stethoscope,
  Clock, CheckCircle, AlertCircle, MoreHorizontal
} from 'lucide-react';
import './Dashboard.css';

const StatCard = ({ title, value, icon: Icon, trend, color, subtitle }) => (
  <div className={`stat-card stat-card--${color}`}>
    <div className="stat-card__top">
      <div className={`stat-icon-wrapper stat-icon-wrapper--${color}`}>
        <Icon size={22} />
      </div>
      <div className="stat-badge">
        {trend.type === 'positive' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        <span>{trend.value}</span>
      </div>
    </div>
    <div className="stat-card__bottom">
      <p className="stat-value">{value}</p>
      <h3 className="stat-title">{title}</h3>
      {subtitle && <p className="stat-subtitle">{subtitle}</p>}
    </div>
    <div className="stat-card__glow"></div>
  </div>
);

const appointments = [
  { name: 'Rahul Sharma', time: '09:00 AM', doctor: 'Dr. Patel', status: 'confirmed', avatar: 'RS' },
  { name: 'Priya Mehta', time: '10:30 AM', doctor: 'Dr. Singh', status: 'pending', avatar: 'PM' },
  { name: 'Arjun Das', time: '11:00 AM', doctor: 'Dr. Verma', status: 'confirmed', avatar: 'AD' },
  { name: 'Sanya Kapoor', time: '01:00 PM', doctor: 'Dr. Patel', status: 'cancelled', avatar: 'SK' },
  { name: 'Vikram Nair', time: '02:30 PM', doctor: 'Dr. Joshi', status: 'confirmed', avatar: 'VN' },
];

const statusIcon = {
  confirmed: <CheckCircle size={14} />,
  pending: <Clock size={14} />,
  cancelled: <AlertCircle size={14} />,
};

const quickStats = [
  { label: 'New Patients Today', value: '8', icon: Heart },
  { label: 'Consultations Done', value: '31', icon: Stethoscope },
  { label: 'Pending Reports', value: '5', icon: AlertCircle },
];

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Patients',
      value: '2,451',
      icon: Users,
      trend: { type: 'positive', value: '+12.5%' },
      color: 'green',
      subtitle: 'vs last month',
    },
    {
      title: 'Appointments Today',
      value: '42',
      icon: Calendar,
      trend: { type: 'positive', value: '+4.2%' },
      color: 'teal',
      subtitle: '6 remaining',
    },
    {
      title: 'Total Revenue',
      value: '₹24,500',
      icon: DollarSign,
      trend: { type: 'positive', value: '+18.2%' },
      color: 'emerald',
      subtitle: 'vs last month',
    },
    {
      title: 'Recovery Rate',
      value: '94%',
      icon: TrendingUp,
      trend: { type: 'positive', value: '+1.5%' },
      color: 'lime',
      subtitle: 'industry avg: 88%',
    },
  ];

  return (
    <div className="dashboard">

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Welcome Back</h1>
          <p>Here's what's happening at <strong>MEDIPULSE</strong> today.</p>
        </div>
        <div className="dashboard-date">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content */}
      <div className="dashboard-content">

        {/* Left: Appointments Table */}
        <div className="card appointments-card">
          <div className="card-header">
            <div>
              <h2>Today's Appointments</h2>
              <p className="card-subtitle">42 total appointments scheduled</p>
            </div>
            <button className="card-action-btn">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="card-body">
            <div className="appointments-list">
              {appointments.map((appt, i) => (
                <div className="appointment-row" key={i}>
                  <div className="appt-avatar">{appt.avatar}</div>
                  <div className="appt-info">
                    <p className="appt-name">{appt.name}</p>
                    <p className="appt-doctor">{appt.doctor}</p>
                  </div>
                  <div className="appt-time">
                    <Clock size={12} />
                    {appt.time}
                  </div>
                  <div className={`appt-status appt-status--${appt.status}`}>
                    {statusIcon[appt.status]}
                    {appt.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Quick Stats + Activity */}
        <div className="right-panel">

          {/* Quick Stats */}
          <div className="card quick-stats-card">
            <div className="card-header">
              <h2>Quick Stats</h2>
            </div>
            <div className="card-body">
              {quickStats.map((qs, i) => (
                <div className="quick-stat-row" key={i}>
                  <div className="quick-stat-icon">
                    <qs.icon size={18} />
                  </div>
                  <p className="quick-stat-label">{qs.label}</p>
                  <p className="quick-stat-value">{qs.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="card activity-card">
            <div className="card-header">
              <h2>Recent Activity</h2>
            </div>
            <div className="card-body">
              <div className="activity-feed">
                <div className="activity-item">
                  <div className="activity-dot activity-dot--green"></div>
                  <div>
                    <p className="activity-text">New patient <strong>Sunam Ghosh</strong> registered</p>
                    <p className="activity-time">2 mins ago</p>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-dot activity-dot--teal"></div>
                  <div>
                    <p className="activity-text">Appointment confirmed with <strong>Dr. Patel</strong></p>
                    <p className="activity-time">15 mins ago</p>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-dot activity-dot--lime"></div>
                  <div>
                    <p className="activity-text">Lab report uploaded for <strong>Rahul Sharma</strong></p>
                    <p className="activity-time">1 hr ago</p>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-dot activity-dot--green"></div>
                  <div>
                    <p className="activity-text">Invoice <strong>#INV-042</strong> generated</p>
                    <p className="activity-time">3 hrs ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
