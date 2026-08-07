import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, TrendingUp, IndianRupee,
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
  confirmed: <CheckCircle size={14} color="#1d4ed8" />,
  pending: <Clock size={14} color="#b45309" />,
  completed: <CheckCircle size={14} color="#15803d" />,
  expired: <AlertCircle size={14} color="#c2410c" />,
  cancelled: <AlertCircle size={14} color="#be123c" />,
  rejected: <AlertCircle size={14} color="#7e22ce" />
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminName, setAdminName] = useState('Admin');
  const [adminProfileImg, setAdminProfileImg] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const loadProfile = () => {
      const storedName = localStorage.getItem('adminName');
      const storedImg = localStorage.getItem('adminProfileImg');
      if (storedName) {
        setAdminName(storedName.charAt(0).toUpperCase() + storedName.slice(1));
      }
      if (storedImg) {
        setAdminProfileImg(storedImg);
      } else {
        setAdminProfileImg('');
      }
    };
    loadProfile();
    window.addEventListener('adminProfileUpdated', loadProfile);

    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/admin/login');
          return;
        }
        const response = await fetch(`${import.meta.env.VITE_URL}/admin/dashboard-stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (response.ok && result.stats) {
          setData(result.stats);
        } else {
          if (response.status === 401) {
            navigate('/admin/login');
            return;
          }
          setError(result.message || 'Failed to fetch dashboard stats');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    return () => window.removeEventListener('adminProfileUpdated', loadProfile);
  }, [navigate]);

  if (loading) return <div className="dashboard"><div style={{padding: '40px', textAlign: 'center'}}>Loading dashboard...</div></div>;
  if (error) return <div className="dashboard"><div style={{padding: '40px', textAlign: 'center', color: 'red'}}>Error: {error}</div></div>;

  const totalPatients = data?.totalPatients ?? 0;
  const appointmentsToday = data?.appointmentsToday ?? 0;
  const totalRevenue = data?.totalRevenue ?? 0;
  const recoveryRate = data?.recoveryRate || '95%';

  const newPatientsToday = data?.quickStats?.newPatientsToday ?? 0;
  const consultationsDone = data?.quickStats?.consultationsDone ?? 0;
  const pendingReports = data?.quickStats?.pendingReports ?? 5;

  const apptList = data?.todaysAppointmentsList || data?.recentAppointmentsList || [];

  const stats = [
    {
      title: 'Total Patients',
      value: totalPatients,
      icon: Users,
      trend: { type: 'positive', value: '+5.2%' },
      color: 'green',
      subtitle: 'vs last month',
    },
    {
      title: 'Appointments Today',
      value: appointmentsToday,
      icon: Calendar,
      trend: { type: 'positive', value: '+2.1%' },
      color: 'teal',
      subtitle: 'today\'s schedule',
    },
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue}`,
      icon: IndianRupee,
      trend: { type: 'positive', value: '+10.5%' },
      color: 'emerald',
      subtitle: 'all time',
    },
    {
      title: 'Recovery Rate',
      value: recoveryRate,
      icon: TrendingUp,
      trend: { type: 'positive', value: '+1.5%' },
      color: 'lime',
      subtitle: 'industry avg: 88%',
    },
  ];

  const quickStats = [
    { label: 'New Patients Today', value: newPatientsToday, icon: Heart },
    { label: 'Consultations Done', value: consultationsDone, icon: Stethoscope },
    { label: 'Pending Reports', value: pendingReports, icon: AlertCircle },
  ];

  return (
    <div className="dashboard">

      {/* Hero Welcome Banner */}
      <div className="ad-hero">
        <div className="ad-hero-accent" />
        <div className="ad-hero-left">
          <h1 className="ad-hero-title">
            Welcome back, <span className="ad-hero-name">{adminName}</span>
          </h1>
          <p className="ad-hero-sub">
            {greeting} &mdash; Manage hospital operations, doctors, pharmacists, and medical records.
          </p>
        </div>
        <div className="ad-hero-right">
          <div className="ad-date">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div
            className="ad-avatar"
            onClick={() => navigate('/admin/settings')}
            title="View Profile & Settings"
            style={{ cursor: 'pointer', overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {adminProfileImg ? (
              <img src={adminProfileImg} alt="Admin Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              adminName.charAt(0).toUpperCase()
            )}
          </div>
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
          <div className="card-body" style={{ padding: 0 }}>
            {/* Table Column Headers Bar */}
            <div className="ad-table-header">
              <span>Patient Name</span>
              <span>Assigned Doctor</span>
              <span>Scheduled Time</span>
              <span>Status</span>
            </div>

            <div className="appointments-list">
              {apptList && apptList.length > 0 ? (
                apptList.map((appt, i) => {
                  const statusKey = (appt.status || 'pending').toLowerCase();
                  const pName = appt.patient || appt.name || 'Patient';
                  const dName = appt.doctor || 'Doctor';
                  return (
                    <div className="ad-table-row" key={i}>
                      <div className="ad-patient-col">
                        <div className="patient-avatar">{pName[0]}</div>
                        <span className="patient-name" title={pName}>{pName}</span>
                      </div>
                      <div className="ad-doctor-col">
                        <Stethoscope size={14} className="ad-doc-icon" />
                        <span className="doctor-name" title={dName}>{dName}</span>
                      </div>
                      <div className="ad-time-col">
                        <Clock size={13} color="#94a3b8" />
                        <span>{appt.time || '10:00 AM'}</span>
                      </div>
                      <div className="ad-status-col">
                        <span className={`status-badge status-badge--${statusKey}`}>
                          {statusIcon[statusKey] || statusIcon.pending}
                          <span style={{ textTransform: 'capitalize' }}>{statusKey}</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2.5rem' }}>
                  No appointments scheduled
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Insights */}
        <div className="card insights-card">
          <div className="card-header">
            <h2>Today's Overview</h2>
            <span className="live-dot" title="Live System Updates"></span>
          </div>
          <div className="card-body">
            <div className="quick-stats-list">
              {quickStats.map((item, index) => {
                const ItemIcon = item.icon;
                return (
                  <div className="quick-stat-item" key={index}>
                    <div className="quick-stat-icon">
                      <ItemIcon size={18} />
                    </div>
                    <div className="quick-stat-info">
                      <p className="quick-stat-label">{item.label}</p>
                      <p className="quick-stat-value">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="system-health">
              <div className="system-health-header">
                <span>System Operational</span>
                <span className="health-percentage">100%</span>
              </div>
              <div className="health-bar">
                <div className="health-bar-fill" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
