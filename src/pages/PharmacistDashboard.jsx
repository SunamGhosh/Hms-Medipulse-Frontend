import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, CalendarCheck, User, LogOut, ArrowRight, Clock, ShieldCheck, ArrowUpRight, CheckCircle2,
  AlertCircle, Loader2, Users, Check, Bell, Pill
} from 'lucide-react';
import toast from 'react-hot-toast';
import './PharmacistDashboard.css';

const API = import.meta.env.VITE_URL;
const getToken = () => localStorage.getItem('pharmacistToken');

const STATUS_CONFIG = {
  pending:   { color: 'blue',   label: 'Pending',   dot: '#3b82f6' },
  confirmed: { color: 'teal',   label: 'Confirmed', dot: '#0d9488' },
  completed: { color: 'green',  label: 'Completed', dot: '#10b981' },
  cancelled: { color: 'rose',   label: 'Cancelled', dot: '#f43f5e' },
  rejected:  { color: 'orange', label: 'Rejected',  dot: '#f97316' },
};

const VIEWS = {
  DASHBOARD: 'dashboard',
  APPOINTMENTS: 'appointments',
  PROFILE: 'profile',
};

const PharmacistDashboard = () => {
  const navigate = useNavigate();
  const [pharmacistName, setPharmacistName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [view, setView] = useState(VIEWS.DASHBOARD);
  
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [pharmacistProfile, setPharmacistProfile] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/pharmacist/login'); return; }
    const stored = localStorage.getItem('pharmacistName') || 'Pharmacist';
    setPharmacistName(stored.charAt(0).toUpperCase() + stored.slice(1));
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, [navigate]);

  const fetchAppointments = useCallback(async (isPolling = false) => {
    const token = getToken();
    if (!token) return;
    if (!isPolling) setApptLoading(true);
    try {
      const res = await fetch(`${API}/appointment/pharmacistAll`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // We only care about confirmed/completed appointments to issue medicines
        const appts = data.appointments || [];
        setAppointments(appts);
      }
    } catch { /* silent */ }
    finally { if (!isPolling) setApptLoading(false); }
  }, []);

  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/pharmacist/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setPharmacistProfile(data.pharmacist);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchProfile();
    const intervalId = setInterval(() => fetchAppointments(true), 15000);
    return () => clearInterval(intervalId);
  }, [fetchAppointments, fetchProfile]);

  const handleLogout = () => {
    localStorage.removeItem('pharmacistToken');
    localStorage.removeItem('pharmacistEmail');
    localStorage.removeItem('pharmacistName');
    toast.success('Logged out successfully');
    navigate('/pharmacist/login');
  };

  const completedAppts = appointments.filter(a => a.status === 'completed').length;
  const confirmedAppts = appointments.filter(a => a.status === 'confirmed').length;
  const todaysAppts = appointments.filter(a => new Date(a.appointment_date).toDateString() === new Date().toDateString()).length;
  
  const stats = [
    { icon: <CalendarCheck size={22} />, label: 'Today\'s Activity', value: apptLoading ? '…' : todaysAppts, trend: 'Appointments', color: 'teal' },
    { icon: <Users size={22} />,         label: 'Total Appointments',value: apptLoading ? '…' : appointments.length, trend: 'All time', color: 'blue' },
    { icon: <CheckCircle2 size={22} />,  label: 'Completed',       value: apptLoading ? '…' : completedAppts, trend: 'Prescriptions', color: 'purple' },
    { icon: <AlertCircle size={22} />,   label: 'Confirmed',       value: apptLoading ? '…' : confirmedAppts, trend: 'To Be Completed', color: 'rose' },
  ];

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="pd-container">
      <div className="pd-blob pd-blob-1" />
      <div className="pd-blob pd-blob-2" />
      
      <aside className="pd-sidebar">
        <div className="pd-sidebar-brand">
          <div className="pd-sidebar-logo">
            <Pill size={20} strokeWidth={2.5} color="#fff" />
          </div>
          <span>Pharmacy Portal</span>
        </div>

        <nav className="pd-nav">
          <button className={`pd-nav-item${view === VIEWS.DASHBOARD ? ' active' : ''}`}
            onClick={() => setView(VIEWS.DASHBOARD)}>
            <Activity size={18} /> Dashboard
          </button>

          <button className={`pd-nav-item${view === VIEWS.APPOINTMENTS ? ' active' : ''}`}
            onClick={() => setView(VIEWS.APPOINTMENTS)}>
            <CalendarCheck size={18} /> Appointments
          </button>

          <div className="pd-nav-divider" />

          <button className={`pd-nav-item${view === VIEWS.PROFILE ? ' active' : ''}`}
            onClick={() => setView(VIEWS.PROFILE)}>
            <User size={18} /> My Profile
          </button>
        </nav>

        <button className="pd-logout-btn" onClick={handleLogout}>
          <LogOut size={17} /> Sign Out
        </button>
      </aside>

      <main className="pd-main">
        <div className="pd-hero">
          <div className="pd-hero-accent" />
          <div className="pd-hero-left">
            <h1 className="pd-hero-title">
              Welcome back, <span className="pd-hero-name">{pharmacistName}</span>
            </h1>
            <p className="pd-hero-sub">
              {greeting} &mdash; There are {completedAppts} completed appointments you may need to check.
            </p>
          </div>
          <div className="pd-hero-right">
            <div className="pd-date">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="pd-avatar">{pharmacistName.charAt(0).toUpperCase()}</div>
          </div>
        </div>

        {view === VIEWS.DASHBOARD && (
          <>
            <section className="pd-stats-grid">
              {stats.map((s, i) => (
                <div key={i} className={`pd-stat-card pd-stat-card--${s.color}`}>
                  <div className="pd-stat-top">
                    <div className={`pd-stat-icon-wrapper pd-stat-icon-wrapper--${s.color}`}>{s.icon}</div>
                    <div className="pd-stat-badge"><ArrowUpRight size={14} /><span>{s.trend}</span></div>
                  </div>
                  <div className="pd-stat-bottom">
                    <span className="pd-stat-value">{s.value}</span>
                    <span className="pd-stat-label">{s.label}</span>
                  </div>
                </div>
              ))}
            </section>

            <section className="pd-section">
              <div className="pd-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="pd-section-title">Recent Completed Appointments</h2>
                <button onClick={() => setView(VIEWS.APPOINTMENTS)}
                  style={{ background: 'none', border: 'none', color: '#6d28d9', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View all <ArrowRight size={13} />
                </button>
              </div>
              <div className="pd-section-body">
                {apptLoading ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : appointments.filter(a => a.status === 'completed').length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    <CheckCircle2 size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                    <p>No recently completed appointments.</p>
                  </div>
                ) : (
                  <ul className="pd-activity-list">
                    {appointments.filter(a => a.status === 'completed').slice(0, 4).map((appt, i) => {
                      const cfg = STATUS_CONFIG[appt.status];
                      return (
                        <li key={i} className="pd-activity-item">
                          <div className="pd-activity-dot" style={{ background: cfg.dot, boxShadow: `0 0 0 3px ${cfg.dot}33` }} />
                          <div className="pd-activity-content">
                            <p className="pd-activity-title">
                              Patient: {appt.patient_id?.first_name} {appt.patient_id?.last_name} &bull; Doctor: Dr. {appt.doctor_id?.first_name} {appt.doctor_id?.last_name}
                            </p>
                            <div className="pd-activity-meta">
                              <Clock size={11} />
                              <span>{formatDate(appt.appointment_date)} at {appt.appointment_time}</span>
                              <span className={`pd-activity-badge pd-badge-${cfg.color}`}>{cfg.label}</span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}

        {view === VIEWS.APPOINTMENTS && (
          <section className="pd-section">
            <div className="pd-section-header">
              <h2 className="pd-section-title">All Appointments</h2>
            </div>
            <div className="pd-section-body">
              {apptLoading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                  <p>Loading appointments…</p>
                </div>
              ) : appointments.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <CalendarCheck size={60} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>No appointments yet</h3>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {appointments.map((appt) => {
                    const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
                    return (
                      <div key={appt._id} style={{
                        background: '#fff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem',
                        transition: 'all 0.2s',
                      }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: cfg.dot, flexShrink: 0, boxShadow: `0 0 0 4px ${cfg.dot}22` }} />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                              Patient: {appt.patient_id?.first_name} {appt.patient_id?.last_name}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '13px', color: '#64748b' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> {formatDate(appt.appointment_date)} at {appt.appointment_time}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              Doctor: Dr. {appt.doctor_id?.first_name} {appt.doctor_id?.last_name}
                            </span>
                            {appt.disease && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Disease: {appt.disease}
                              </span>
                            )}
                          </div>
                        </div>

                        <span style={{
                          padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                          background: cfg.dot + '18', color: cfg.dot, flexShrink: 0,
                        }}>
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {view === VIEWS.PROFILE && (
          <section className="pd-section">
            <div className="pd-section-header"><h2 className="pd-section-title">My Profile</h2></div>
            <div className="pd-section-body">
              {pharmacistProfile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', color: '#fff', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(109, 40, 217, 0.3)' }}>
                      {pharmacistProfile.first_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                        {pharmacistProfile.first_name} {pharmacistProfile.last_name}
                      </h3>
                      <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{pharmacistProfile.email}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    {[
                      { label: 'Pharmacy Name',  value: pharmacistProfile.pharmacy_name || '—' },
                      { label: 'Qualification',  value: pharmacistProfile.qualification || '—' },
                      { label: 'Phone',          value: pharmacistProfile.phone || '—' },
                      { label: 'License No',     value: pharmacistProfile.license_no || '—' },
                      { label: 'Work Time',      value: `${pharmacistProfile.work_time_start || '—'} - ${pharmacistProfile.work_time_end || '—'}` },
                      { label: 'Account Status', value: pharmacistProfile.status || 'active' },
                      { label: 'Member Since',   value: formatDate(pharmacistProfile.createdAt) },
                    ].map((row) => (
                      <div key={row.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1.1rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBotto: '4px' }}>{row.label}</div>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              )}
            </div>
          </section>
        )}

      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default PharmacistDashboard;
