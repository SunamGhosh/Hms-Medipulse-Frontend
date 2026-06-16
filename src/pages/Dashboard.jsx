import React, { useState, useEffect } from 'react';
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

const statusIcon = {
  confirmed: <CheckCircle size={14} />,
  pending: <Clock size={14} />,
  cancelled: <AlertCircle size={14} />,
  completed: <CheckCircle size={14} />,
  rejected: <AlertCircle size={14} />
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_URL}/admin/dashboard-stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (response.ok) {
          setData(result.stats);
        } else {
          setError(result.message || 'Failed to fetch dashboard stats');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="dashboard"><div style={{padding: '40px', textAlign: 'center'}}>Loading dashboard...</div></div>;
  if (error) return <div className="dashboard"><div style={{padding: '40px', textAlign: 'center', color: 'red'}}>Error: {error}</div></div>;
  if (!data) return null;

  const stats = [
    {
      title: 'Total Patients',
      value: data.totalPatients,
      icon: Users,
      trend: { type: 'positive', value: '+5.2%' }, // Dummy trend for now
      color: 'green',
      subtitle: 'vs last month',
    },
    {
      title: 'Appointments Today',
      value: data.appointmentsToday,
      icon: Calendar,
      trend: { type: 'positive', value: '+2.1%' },
      color: 'teal',
      subtitle: 'today\'s schedule',
    },
    {
      title: 'Total Revenue',
      value: `₹${data.totalRevenue}`,
      icon: DollarSign,
      trend: { type: 'positive', value: '+10.5%' },
      color: 'emerald',
      subtitle: 'all time',
    },
    {
      title: 'Recovery Rate',
      value: data.recoveryRate,
      icon: TrendingUp,
      trend: { type: 'positive', value: '+1.5%' },
      color: 'lime',
      subtitle: 'industry avg: 88%',
    },
  ];

  const quickStats = [
    { label: 'New Patients Today', value: data.quickStats.newPatientsToday, icon: Heart },
    { label: 'Consultations Done', value: data.quickStats.consultationsDone, icon: Stethoscope },
    { label: 'Pending Reports', value: data.quickStats.pendingReports, icon: AlertCircle },
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
              <h2>Recent Appointments</h2>
              <p className="card-subtitle">Showing latest 10 appointments</p>
            </div>
            <button className="card-action-btn">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="card-body">
            <div className="appointments-list">
              {data.todaysAppointmentsList && data.todaysAppointmentsList.length > 0 ? (
                data.todaysAppointmentsList.map((appt, i) => (
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
                      {statusIcon[appt.status] || <Clock size={14} />}
                      {appt.status}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>No recent appointments found</div>
              )}
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
                    <p className="activity-text">System is running smoothly</p>
                    <p className="activity-time">Just now</p>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-dot activity-dot--teal"></div>
                  <div>
                    <p className="activity-text">Dashboard data updated</p>
                    <p className="activity-time">Live</p>
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
