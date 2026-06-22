import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Activity, CalendarCheck, Stethoscope, Pill, Bell, User, LogOut,
  ArrowRight, Clock, Heart, ShieldCheck, ArrowUpRight, Users,
  X, CheckCircle2, AlertCircle, XCircle, Loader2, Plus,
} from 'lucide-react';
import './UserDashboard.css';
import BookAppointmentModal from '../components/BookAppointmentModal';

const API = import.meta.env.VITE_URL;
const getToken = () => localStorage.getItem('userToken');

/* ── status colour map ── */
const STATUS_CONFIG = {
  pending:   { color: 'blue',   label: 'Pending',   dot: '#3b82f6' },
  confirmed: { color: 'teal',   label: 'Confirmed', dot: '#0d9488' },
  completed: { color: 'green',  label: 'Completed', dot: '#10b981' },
  cancelled: { color: 'rose',   label: 'Cancelled', dot: '#f43f5e' },
  rejected:  { color: 'orange', label: 'Rejected',  dot: '#f97316' },
};

/* ── views ── */
const VIEWS = {
  DASHBOARD: 'dashboard',
  APPOINTMENTS: 'appointments',
  PROFILE: 'profile',
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [view, setView] = useState(VIEWS.DASHBOARD);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  /* ── API data ── */
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  /* ── auth ── */
  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/login'); return; }
    const stored = localStorage.getItem('userName') || 'User';
    setUserName(stored.charAt(0).toUpperCase() + stored.slice(1));
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, [navigate]);

  /* ── fetch appointments ── */
  const fetchAppointments = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setApptLoading(true);
    try {
      const res = await fetch(`${API}/appointment/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAppointments(data.appointments || []);
    } catch { /* silent */ }
    finally { setApptLoading(false); }
  }, []);

  /* ── fetch patients ── */
  const fetchPatients = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setPatientLoading(true);
    try {
      const res = await fetch(`${API}/patient/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setPatients(data.patients || []);
    } catch { /* silent */ }
    finally { setPatientLoading(false); }
  }, []);

  /* ── fetch profile ── */
  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUserProfile(data.user);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchProfile();
  }, [fetchAppointments, fetchPatients, fetchProfile]);

  /* refresh after booking */
  const handleBookClose = () => {
    setIsBookModalOpen(false);
    fetchAppointments();
  };

  /* ── cancel appointment ── */
  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    const token = getToken();
    try {
      const res = await fetch(`${API}/appointment/${id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cancel_reason: 'Cancelled by user' })
      });
      if (res.ok) fetchAppointments();
    } catch { /* silent */ }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  /* ── derived stats ── */
  const totalAppts = appointments.length;
  const pendingAppts = appointments.filter(a => a.status === 'pending').length;
  const completedAppts = appointments.filter(a => a.status === 'completed').length;
  const activePatients = patients.filter(p => p.status === 'active').length;

  const stats = [
    { icon: <CalendarCheck size={22} />, label: 'Total Appointments', value: apptLoading ? '…' : totalAppts, trend: `${pendingAppts} pending`, color: 'teal' },
    { icon: <Users size={22} />,         label: 'Family Members',     value: patientLoading ? '…' : activePatients, trend: 'Patients',    color: 'blue' },
    { icon: <CheckCircle2 size={22} />,  label: 'Completed',          value: apptLoading ? '…' : completedAppts, trend: 'Visits done', color: 'purple' },
    { icon: <Heart size={22} />,         label: 'Health Score',       value: '92%',  trend: '+5%',         color: 'rose' },
  ];

  const quickActions = [
    { icon: <CalendarCheck size={20} />, label: 'Book Appointment', desc: 'Schedule with a doctor', action: () => setIsBookModalOpen(true), color: 'teal' },
    { icon: <Stethoscope size={20} />,   label: 'Find Doctors',     desc: 'Browse specialists',    to: '/doctors',                          color: 'blue' },
    { icon: <Pill size={20} />,          label: 'Order Medicine',   desc: 'From our pharmacy',     to: '/pharmacy',                         color: 'purple' },
    { icon: <ShieldCheck size={20} />,   label: 'Health Records',   desc: 'View your history',     to: '#',                                 color: 'green' },
  ];

  /* ── helpers ── */
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="ud-container">
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
          <button className={`ud-nav-item${view === VIEWS.DASHBOARD ? ' active' : ''}`}
            onClick={() => setView(VIEWS.DASHBOARD)} style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <Activity size={18} /> Dashboard
          </button>

          <Link to="/doctors" className="ud-nav-item">
            <Stethoscope size={18} /> Doctors
          </Link>

          <Link to="/pharmacy" className="ud-nav-item">
            <Pill size={18} /> Pharmacy
          </Link>

          <button className={`ud-nav-item${view === VIEWS.APPOINTMENTS ? ' active' : ''}`}
            onClick={() => setView(VIEWS.APPOINTMENTS)} style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <CalendarCheck size={18} /> Appointments
            {pendingAppts > 0 && (
              <span style={{ marginLeft: 'auto', background: '#0d9488', color: '#fff', borderRadius: '12px', fontSize: '11px', fontWeight: 700, padding: '2px 8px' }}>
                {pendingAppts}
              </span>
            )}
          </button>

          {/* ── Book Appointment — sidebar CTA ── */}
          <div className="ud-nav-divider" />
          <button className="ud-nav-item ud-nav-book" onClick={() => setIsBookModalOpen(true)}
            style={{ background: 'linear-gradient(135deg,#0d9488,#14b8a6)', color: '#fff', border: 'none', font: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left', borderRadius: '10px', margin: '4px 0' }}>
            <Plus size={18} /> Book Appointment
          </button>
          <div className="ud-nav-divider" />

          <button className={`ud-nav-item${view === VIEWS.PROFILE ? ' active' : ''}`}
            onClick={() => setView(VIEWS.PROFILE)} style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <User size={18} /> My Profile
          </button>
        </nav>

        <button className="ud-logout-btn" onClick={handleLogout} style={{ color: '#ef4444' }}>
          <LogOut size={17} /> Sign Out
        </button>
      </aside>

      {/* ── Main ── */}
      <main className="ud-main">

        {/* ── Hero ── */}
        <div className="ud-hero">
          <div className="ud-hero-accent" />
          <div className="ud-hero-left">
            <h1 className="ud-hero-title">
              Welcome back, <span className="ud-hero-name">{userName}</span>!
            </h1>
            <p className="ud-hero-sub">
              {greeting} &mdash; Here&apos;s your personalised health overview for today.
            </p>
          </div>
          <div className="ud-hero-right">
            <div className="ud-date">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <button className="ud-notif-btn" aria-label="Notifications">
              <Bell size={19} />
              {pendingAppts > 0 && <span className="ud-notif-dot" />}
            </button>
            <div className="ud-avatar">{userName.charAt(0).toUpperCase()}</div>
          </div>
        </div>

        {/* ════════════ DASHBOARD VIEW ════════════ */}
        {view === VIEWS.DASHBOARD && (
          <>
            {/* Stats */}
            <section className="ud-stats-grid">
              {stats.map((s, i) => (
                <div key={i} className={`ud-stat-card ud-stat-card--${s.color}`}>
                  <div className="ud-stat-top">
                    <div className={`ud-stat-icon-wrapper ud-stat-icon-wrapper--${s.color}`}>{s.icon}</div>
                    <div className="ud-stat-badge"><ArrowUpRight size={14} /><span>{s.trend}</span></div>
                  </div>
                  <div className="ud-stat-bottom">
                    <span className="ud-stat-value">{s.value}</span>
                    <span className="ud-stat-label">{s.label}</span>
                    <span className="ud-stat-sub">Live from your records</span>
                  </div>
                  <div className="ud-stat-glow" />
                </div>
              ))}
            </section>

            {/* Quick Actions */}
            <section className="ud-section">
              <div className="ud-section-header">
                <h2 className="ud-section-title">Quick Actions</h2>
              </div>
              <div className="ud-section-body">
                <div className="ud-actions-grid">
                  {quickActions.map((a, i) =>
                    a.action ? (
                      <button key={i} className={`ud-action-card ud-action-${a.color}`} onClick={a.action}
                        style={{ background: 'none', border: '1.5px solid rgba(255,255,255,0.6)', cursor: 'pointer', textAlign: 'left', width: '100%', font: 'inherit', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="ud-action-icon">{a.icon}</div>
                        <div className="ud-action-text"><strong>{a.label}</strong><span>{a.desc}</span></div>
                        <ArrowRight size={18} className="ud-action-arrow" />
                      </button>
                    ) : (
                      <Link key={i} to={a.to} className={`ud-action-card ud-action-${a.color}`}>
                        <div className="ud-action-icon">{a.icon}</div>
                        <div className="ud-action-text"><strong>{a.label}</strong><span>{a.desc}</span></div>
                        <ArrowRight size={18} className="ud-action-arrow" />
                      </Link>
                    )
                  )}
                </div>
              </div>
            </section>

            {/* Recent appointments + health tip */}
            <div className="ud-bottom-layout">
              <section className="ud-section">
                <div className="ud-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="ud-section-title">Recent Appointments</h2>
                  <button onClick={() => setView(VIEWS.APPOINTMENTS)}
                    style={{ background: 'none', border: 'none', color: '#0d9488', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View all <ArrowRight size={13} />
                  </button>
                </div>
                <div className="ud-section-body">
                  {apptLoading ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      <Loader2 size={24} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : appointments.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      <CalendarCheck size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                      <p>No appointments yet. <button onClick={() => setIsBookModalOpen(true)} style={{ color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Book one now →</button></p>
                    </div>
                  ) : (
                    <ul className="ud-activity-list">
                      {appointments.slice(0, 4).map((appt, i) => {
                        const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
                        return (
                          <li key={i} className="ud-activity-item">
                            <div className="ud-activity-dot" style={{ background: cfg.dot, boxShadow: `0 0 0 3px ${cfg.dot}33` }} />
                            <div className="ud-activity-content">
                              <p className="ud-activity-title">
                                Dr. {appt.doctor_id?.first_name} {appt.doctor_id?.last_name}
                                {appt.patient_id && <span style={{ color: '#94a3b8', fontWeight: 400 }}> — {appt.patient_id?.first_name}</span>}
                              </p>
                              <div className="ud-activity-meta">
                                <Clock size={11} />
                                <span>{formatDate(appt.appointment_date)} at {appt.appointment_time}</span>
                                <span className={`ud-activity-badge ud-badge-${cfg.color}`}>{cfg.label}</span>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>

              <section className="ud-section">
                <div className="ud-section-header"><h2 className="ud-section-title">Today&apos;s Health Tip</h2></div>
                <div className="ud-section-body">
                  <div className="ud-tip-body">
                    <div className="ud-tip-icon">💧</div>
                    <h3>Stay Hydrated</h3>
                    <p>Drinking at least 8 glasses of water a day helps your body maintain energy levels, flush out toxins, and keep your skin healthy.</p>
                    <div className="ud-tip-tag"><Heart size={12} color="#f43f5e" /> Wellness Reminder</div>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}

        {/* ════════════ APPOINTMENTS VIEW ════════════ */}
        {view === VIEWS.APPOINTMENTS && (
          <section className="ud-section">
            <div className="ud-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="ud-section-title">My Appointments</h2>
              <button className="ud-book-appt-btn" onClick={() => setIsBookModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,#0d9488,#14b8a6)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }}>
                <Plus size={16} /> Book New Appointment
              </button>
            </div>
            <div className="ud-section-body">
              {apptLoading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                  <p>Loading appointments…</p>
                </div>
              ) : appointments.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <CalendarCheck size={60} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>No appointments yet</h3>
                  <p style={{ marginBottom: '1.5rem' }}>Book your first appointment to get started</p>
                  <button onClick={() => setIsBookModalOpen(true)}
                    style={{ background: '#0d9488', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} /> Book Appointment
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {appointments.map((appt) => {
                    const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
                    const canCancel = appt.status === 'pending' || appt.status === 'confirmed';
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
                        {/* Status dot */}
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: cfg.dot, flexShrink: 0, boxShadow: `0 0 0 4px ${cfg.dot}22` }} />

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                              Dr. {appt.doctor_id?.first_name} {appt.doctor_id?.last_name}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '2px 10px', borderRadius: '12px', fontWeight: 600 }}>
                              {appt.doctor_id?.specialization || 'General'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '13px', color: '#64748b' }}>
                            {appt.patient_id && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <User size={12} /> {appt.patient_id?.first_name} {appt.patient_id?.last_name}
                              </span>
                            )}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> {formatDate(appt.appointment_date)} at {appt.appointment_time}
                            </span>
                            {appt.disease && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Stethoscope size={12} /> {appt.disease}
                              </span>
                            )}
                            {appt.consult_mode && (
                              <span style={{ textTransform: 'capitalize', background: '#f0fdfa', color: '#0d9488', padding: '1px 8px', borderRadius: '8px', fontWeight: 600 }}>
                                {appt.consult_mode}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Fee */}
                        {appt.consultation_fee && (
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0d9488' }}>₹{appt.consultation_fee}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>fee</div>
                          </div>
                        )}

                        {/* Status badge */}
                        <span style={{
                          padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                          background: cfg.dot + '18', color: cfg.dot, flexShrink: 0,
                        }}>
                          {cfg.label}
                        </span>

                        {/* Cancel button */}
                        {canCancel && (
                          <button onClick={() => handleCancel(appt._id)}
                            style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
                            <XCircle size={13} /> Cancel
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ════════════ PROFILE VIEW ════════════ */}
        {view === VIEWS.PROFILE && (
          <section className="ud-section">
            <div className="ud-section-header"><h2 className="ud-section-title">My Profile</h2></div>
            <div className="ud-section-body">
              {userProfile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Avatar row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#0d9488)', color: '#fff', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(13,148,136,0.3)' }}>
                      {userProfile.first_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                        {userProfile.first_name} {userProfile.last_name}
                      </h3>
                      <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{userProfile.email}</p>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    {[
                      { label: 'First Name',  value: userProfile.first_name },
                      { label: 'Last Name',   value: userProfile.last_name },
                      { label: 'Email',       value: userProfile.email },
                      { label: 'Phone',       value: userProfile.phone || '—' },
                      { label: 'Address',     value: userProfile.address || '—' },
                      { label: 'Account Status', value: userProfile.status || 'active' },
                      { label: 'Member Since', value: formatDate(userProfile.createdAt) },
                      { label: 'Last Login',   value: userProfile.last_login ? formatDate(userProfile.last_login) : '—' },
                    ].map((row) => (
                      <div key={row.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1.1rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>{row.label}</div>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{row.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Family patients */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Family Patients</h4>
                      <button onClick={() => setIsBookModalOpen(true)}
                        style={{ background: '#f0fdfa', border: 'none', color: '#0d9488', fontWeight: 700, fontSize: '13px', cursor: 'pointer', padding: '6px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Plus size={13} /> Add via Booking
                      </button>
                    </div>
                    {patientLoading ? (
                      <p style={{ color: '#94a3b8' }}>Loading…</p>
                    ) : patients.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontSize: '14px' }}>No patients added yet. Add one when booking an appointment.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {patients.map(p => (
                          <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#14b8a6,#0d9488)', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {p.first_name?.[0]}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{p.first_name} {p.last_name}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{p.relationship_to_user} • {p.gender} • {p.blood_group}</div>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: p.status === 'active' ? '#f0fdf4' : '#fef2f2', color: p.status === 'active' ? '#16a34a' : '#ef4444' }}>
                              {p.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
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

      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={handleBookClose}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default UserDashboard;
