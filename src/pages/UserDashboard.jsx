import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Activity, CalendarCheck, Stethoscope, Pill, Bell, User, LogOut,
  ArrowRight, Clock, Heart, ShieldCheck, ArrowUpRight, Users,
  X, CheckCircle2, AlertCircle, XCircle, Loader2, Plus, Video, Package, Truck, Trash2, CreditCard,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import './UserDashboard.css';
import './MyOrders.css';
import './PharmacyPage.css';
import BookAppointmentModal from '../components/BookAppointmentModal';

const API = import.meta.env.VITE_URL;
const getToken = () => localStorage.getItem('userToken');

/* ── status colour map ── */
const STATUS_CONFIG = {
  pending: { color: 'blue', label: 'Pending', dot: '#3b82f6' },
  confirmed: { color: 'teal', label: 'Confirmed', dot: '#0d9488' },
  completed: { color: 'green', label: 'Completed', dot: '#10b981' },
  cancelled: { color: 'rose', label: 'Cancelled', dot: '#f43f5e' },
  rejected: { color: 'orange', label: 'Rejected', dot: '#f97316' },
};

/* ── order status colour map ── */
const ORDER_STATUS_CONFIG = {
  paid:             { label: 'Order Placed',      icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', step: 1 },
  processing:       { label: 'Processing',        icon: Clock,        color: '#d97706', bg: '#fffbeb', border: '#fde68a', step: 2 },
  shipped:          { label: 'Shipped',           icon: Truck,        color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', step: 3 },
  out_for_delivery: { label: 'Out for Delivery',  icon: Truck,        color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', step: 4 },
  delivered:        { label: 'Delivered',         icon: CheckCircle2, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', step: 5 },
  cancelled:        { label: 'Cancelled',         icon: XCircle,      color: '#dc2626', bg: '#fef2f2', border: '#fecaca', step: 0 },
  pending:          { label: 'Pending',           icon: Clock,        color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', step: 0 },
};

const TRACKING_STEPS = ['paid', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

/* ── views ── */
const VIEWS = {
  DASHBOARD: 'dashboard',
  APPOINTMENTS: 'appointments',
  RECORDS: 'records',
  PROFILE: 'profile',
  ORDERS: 'orders',
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth <= 1024);
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [view, setView] = useState(VIEWS.DASHBOARD);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  /* ── API data ── */
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
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
      if (res.ok) {
        const sorted = (data.appointments || []).sort(
          (a, b) => new Date(b.appointment_date) - new Date(a.appointment_date)
        );
        setAppointments(sorted);
      }
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

  const fetchOrders = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API}/api/payment/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
    } catch { /* silent */ }
    finally { setOrdersLoading(false); }
  }, []);

  /* ── remove order ── */
  const handleRemoveOrder = async (orderId) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/payment/my-orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Order removed successfully');
        setOrders(prev => prev.filter(o => o._id !== orderId));
      } else {
        toast.error(data.message || 'Failed to remove order');
      }
    } catch (error) {
      toast.error('Error removing order');
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchProfile();
    fetchOrders();

    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchAppointments, fetchPatients, fetchProfile, fetchOrders]);

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
      if (res.ok) {
        toast.success('Appointment cancelled successfully');
        fetchAppointments();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to cancel appointment');
      }
    } catch {
      toast.error('An error occurred while cancelling');
    }
  };

  /* ── join video call & send reminder email ── */
  const handleJoinVideoCall = async (apptId) => {
    const token = getToken();
    fetch(`${API}/appointment/${apptId}/video-call-reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }).catch(err => console.error('Video call reminder failed:', err));

    navigate(`/video-call/MediPulse_${apptId}`);
  };

  /* ── pay for confirmed appointment via Razorpay ── */
  const handleApptPayment = async (appt) => {
    const token = getToken();
    if (!token) return;
    try {
      // Create a Razorpay order for the appointment fee
      const res = await fetch(`${API}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: appt.consultation_fee, appointment_id: appt._id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to initiate payment');
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        name: 'MediPulse Healthcare',
        description: `Consultation with Dr. ${appt.doctor_id?.first_name} ${appt.doctor_id?.last_name}`,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API}/api/payment/verify-appointment-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                appointment_id: appt._id
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              toast.success('Payment successful! Your appointment is confirmed.');
              fetchAppointments();
            } else {
              toast.error(verifyData.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            toast.error('Error verifying payment: ' + err.message);
          }
        },
        prefill: {
          name: userName,
          email: userProfile?.email || ''
        },
        theme: { color: '#0d9488' }
      };

      if (!window.Razorpay) {
        toast.error('Razorpay not loaded. Please refresh the page.');
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      toast.error('Error initiating payment');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  /* ── derived stats ── */
  const totalAppts = appointments.length;
  const pendingAppts = appointments.filter(a => a.status === 'pending').length;
  const completedAppts = appointments.filter(a => a.status === 'completed').length;
  const activePatients = patients.filter(p => p.status === 'active').length;

  const stats = [
    { icon: <CalendarCheck size={22} />, label: 'Total Appointments', value: apptLoading ? '…' : totalAppts, trend: `${pendingAppts} pending`, color: 'teal' },
    { icon: <Users size={22} />, label: 'Family Members', value: patientLoading ? '…' : activePatients, trend: 'Patients', color: 'blue' },
    { icon: <CheckCircle2 size={22} />, label: 'Completed', value: apptLoading ? '…' : completedAppts, trend: 'Visits done', color: 'purple' },
    { icon: <Heart size={22} />, label: 'Health Score', value: '92%', trend: '+5%', color: 'rose' },
  ];

  const quickActions = [
    { icon: <CalendarCheck size={20} />, label: 'Book Appointment', desc: 'Schedule with a doctor', action: () => setIsBookModalOpen(true), color: 'teal' },
    { icon: <Stethoscope size={20} />, label: 'Find Doctors', desc: 'Browse specialists', to: '/doctors', color: 'blue' },
    { icon: <Pill size={20} />, label: 'Order Medicine', desc: 'From our pharmacy', to: '/pharmacy', color: 'purple' },
    { icon: <ShieldCheck size={20} />, label: 'Health Records', desc: 'View your history', action: () => setView(VIEWS.RECORDS), color: 'green' },
  ];

  /* ── helpers ── */
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="ud-container">
      <div className="ud-blob ud-blob-1" />
      <div className="ud-blob ud-blob-2" />
      <div className="ud-blob ud-blob-3" />

      {/* ── Sidebar ── */}
      <aside className={`ud-sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
        <div className="ud-sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="ud-sidebar-logo">
              <Activity size={20} strokeWidth={2.5} color="#fff" />
            </div>
            {!sidebarCollapsed && <span>MediPulse</span>}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px',
              width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#475569', transition: 'all 0.2s', flexShrink: 0
            }}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="ud-nav">
          <button className={`ud-nav-item${view === VIEWS.DASHBOARD ? ' active' : ''}`}
            onClick={() => setView(VIEWS.DASHBOARD)} title={sidebarCollapsed ? "Dashboard" : ""} style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <Activity size={18} /> {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          <Link to="/doctors" className="ud-nav-item" title={sidebarCollapsed ? "Doctors" : ""}>
            <Stethoscope size={18} /> {!sidebarCollapsed && <span>Doctors</span>}
          </Link>

          <Link to="/pharmacy" className="ud-nav-item" title={sidebarCollapsed ? "Pharmacy" : ""}>
            <Pill size={18} /> {!sidebarCollapsed && <span>Pharmacy</span>}
          </Link>

          <button className={`ud-nav-item${view === VIEWS.APPOINTMENTS ? ' active' : ''}`}
            onClick={() => setView(VIEWS.APPOINTMENTS)} title={sidebarCollapsed ? "Appointments" : ""} style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <CalendarCheck size={18} /> {!sidebarCollapsed && <span>Appointments</span>}
            {pendingAppts > 0 && (
              <span style={{ marginLeft: sidebarCollapsed ? '0' : 'auto', background: '#0d9488', color: '#fff', borderRadius: '12px', fontSize: '11px', fontWeight: 700, padding: '2px 8px' }}>
                {pendingAppts}
              </span>
            )}
          </button>

          <button className={`ud-nav-item${view === VIEWS.ORDERS ? ' active' : ''}`}
            onClick={() => setView(VIEWS.ORDERS)} title={sidebarCollapsed ? "My Orders" : ""} style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <Package size={18} /> {!sidebarCollapsed && <span>My Orders</span>}
          </button>

          {/* ── Book Appointment — sidebar CTA ── */}
          <div className="ud-nav-divider" />
          <button className="ud-nav-item ud-nav-book" onClick={() => setIsBookModalOpen(true)} title={sidebarCollapsed ? "Book Appointment" : ""}
            style={{ background: 'linear-gradient(135deg,#0d9488,#14b8a6)', color: '#fff', border: 'none', font: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left', borderRadius: '10px', margin: '4px 0', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <Plus size={18} /> {!sidebarCollapsed && <span>Book Appointment</span>}
          </button>
          <div className="ud-nav-divider" />

          <button className={`ud-nav-item${view === VIEWS.PROFILE ? ' active' : ''}`}
            onClick={() => setView(VIEWS.PROFILE)} title={sidebarCollapsed ? "My Profile" : ""} style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <User size={18} /> {!sidebarCollapsed && <span>My Profile</span>}
          </button>
        </nav>

        <button className="ud-logout-btn" onClick={handleLogout} title={sidebarCollapsed ? "Sign Out" : ""} style={{ color: '#ef4444', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
          <LogOut size={17} /> {!sidebarCollapsed && <span>Sign Out</span>}
        </button>
      </aside>

      {/* ── Main ── */}
      <main className={`ud-main${sidebarCollapsed ? ' collapsed' : ''}`}>

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
            <div
              className="ud-avatar"
              onClick={() => setView(VIEWS.PROFILE)}
              title="View Profile"
              style={{ cursor: 'pointer', overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {userProfile?.profile_img ? (
                <img src={userProfile.profile_img} alt="Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>
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
                <div className="ud-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="ud-section-title">Recent Orders</h2>
                  <button onClick={() => setView(VIEWS.ORDERS)}
                    style={{ background: 'none', border: 'none', color: '#0d9488', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View all <ArrowRight size={13} />
                  </button>
                </div>
                <div className="ud-section-body">
                  {ordersLoading ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      <Package size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                      <p>No recent orders. <Link to="/pharmacy" style={{ color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, textDecoration: 'none' }}>Order medicine →</Link></p>
                    </div>
                  ) : (
                    <ul className="ud-activity-list">
                      {orders.slice(0, 4).map((order, i) => {
                        const isDelivered = order.status === 'delivered';
                        const dotColor = isDelivered ? '#10b981' : order.status === 'paid' ? '#0d9488' : order.status === 'cancelled' ? '#ef4444' : '#f97316';
                        return (
                          <li key={i} className="ud-activity-item">
                            <div className="ud-activity-dot" style={{ background: dotColor, boxShadow: `0 0 0 3px ${dotColor}33` }} />
                            <div className="ud-activity-content">
                              <p className="ud-activity-title">
                                Order #{order._id.slice(-6).toUpperCase()}
                                <span style={{ color: '#94a3b8', fontWeight: 400 }}> — ₹{order.grand_total}</span>
                              </p>
                              <div className="ud-activity-meta">
                                <Clock size={11} />
                                <span>{formatDate(order.placed_at || order.createdAt)}</span>
                                <span className="ud-activity-badge" style={{
                                  background: isDelivered ? '#f0fdf4' : order.status === 'paid' ? '#ecfdf5' : '#fff7ed',
                                  color: isDelivered ? '#16a34a' : order.status === 'paid' ? '#10b981' : '#f97316'
                                }}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
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
                          {/* Meeting Time Info — visible on completed appointments */}
                          {appt.status === 'completed' && (appt.meet_time_start || appt.meet_time_end) && (
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px',
                              fontSize: '12px', color: '#475569', background: '#f0fdfa',
                              padding: '4px 12px', borderRadius: '20px', border: '1px solid #99f6e4'
                            }}>
                              <Clock size={12} style={{ color: '#0d9488', flexShrink: 0 }} />
                              <span style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                                {appt.meet_time_start && (
                                  <span>Started: <strong style={{ color: '#0f172a' }}>{new Date(appt.meet_time_start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</strong></span>
                                )}
                                {appt.meet_time_start && appt.meet_time_end && <span style={{ color: '#cbd5e1' }}> · </span>}
                                {appt.meet_time_end && (
                                  <span>Ended: <strong style={{ color: '#0f172a' }}>{new Date(appt.meet_time_end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</strong></span>
                                )}
                                {appt.meet_time != null && (
                                  <span style={{ color: '#0d9488', fontWeight: 700 }}> · {appt.meet_time} min</span>
                                )}
                              </span>
                            </div>
                          )}
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

                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                          {/* Payment Done badge */}
                          {appt.payment_status === 'paid' && (
                            <span style={{ background: '#f0fdf4', border: '1.5px solid #86efac', color: '#16a34a', borderRadius: '20px', padding: '5px 13px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} /> Payment Done
                            </span>
                          )}
                          {/* Pay Now button — only for confirmed + unpaid */}
                          {appt.status === 'confirmed' && appt.payment_status !== 'paid' && appt.consultation_fee && (
                            <button onClick={() => handleApptPayment(appt)}
                              style={{ background: 'linear-gradient(135deg,#0d9488,#14b8a6)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 10px rgba(13,148,136,0.35)' }}>
                              <CreditCard size={13} /> Pay Now
                            </button>
                          )}
                          {appt.status === 'confirmed' && appt.payment_status === 'paid' && appt.consult_mode === 'online' && (
                            <button onClick={() => handleJoinVideoCall(appt._id)}
                              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Video size={13} /> Join Video Call
                            </button>
                          )}
                          {/* Cancel button */}
                          {canCancel && (
                            <button onClick={() => handleCancel(appt._id)}
                              style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
                              <XCircle size={13} /> Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ════════════ ORDERS VIEW ════════════ */}
        {view === VIEWS.ORDERS && (
          <section className="ud-section">
            <div className="ud-section-header">
              <h2 className="ud-section-title">My Orders</h2>
            </div>
            <div className="ud-section-body">
              {ordersLoading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                  <p>Loading orders…</p>
                </div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Package size={60} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>No orders yet</h3>
                  <p style={{ marginBottom: '1.5rem' }}>Order medicines from our pharmacy</p>
                  <Link to="/pharmacy"
                    style={{ background: '#0d9488', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <Pill size={16} /> Order Medicine
                  </Link>
                </div>
              ) : (
                <div className="mo-body" style={{ padding: 0, maxWidth: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                  {orders.map(order => {
                    const status = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.pending;
                    const StatusIcon = status.icon;
                    return (
                      <div className="mo-order-card" key={order._id}>
                        {/* Order Header */}
                        <div className="mo-order-header">
                          <div className="mo-order-meta">
                            <div className="mo-order-id">
                              <Package size={15} />
                              <span>#{order._id?.slice(-8).toUpperCase() || 'N/A'}</span>
                            </div>
                            <div className="mo-order-date">{formatDate(order.placed_at || order.createdAt)}</div>
                          </div>
                          <div
                            className="mo-status-badge"
                            style={{ color: status.color, background: status.bg, border: `1px solid ${status.border}` }}
                          >
                            <StatusIcon size={13} />
                            {status.label}
                          </div>
                        </div>

                        {/* Visual Tracking */}
                        {status.step > 0 && order.status !== 'cancelled' && (
                          <div className="mo-tracking-container">
                            <div className="mo-tracking-steps" style={{ maxWidth: '100%' }}>
                              {TRACKING_STEPS.map((stepKey, i) => {
                                const stepConfig = ORDER_STATUS_CONFIG[stepKey];
                                const isCompleted = status.step >= stepConfig.step;
                                const isCurrent = status.step === stepConfig.step;
                                
                                return (
                                  <div className={`mo-track-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`} key={stepKey}>
                                    <div className="mo-track-icon-wrapper">
                                      <div className={`mo-track-line ${isCompleted && i > 0 ? 'filled' : ''}`}></div>
                                      <div className="mo-track-dot">
                                          {isCompleted ? <CheckCircle2 size={16} strokeWidth={3} /> : <div className="mo-dot-inner"></div>}
                                      </div>
                                    </div>
                                    <span className="mo-track-label">{stepConfig.label}</span>
                                  </div>
                                )
                              })}
                            </div>
                            {order.delivery_address && (
                              <div className="mo-delivery-address">
                                <strong>Delivery Address:</strong> {order.delivery_address.street}, {order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.zip_code}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Items */}
                        <div className="mo-items-list">
                          {order.items.map((item, idx) => (
                            <div className="mo-item-row" key={idx}>
                              <img
                                src={item.medicine_image || '/img/medicine_bottle.png'}
                                alt={item.medicine_name}
                                className="mo-item-img"
                                onError={e => { e.target.src = '/img/medicine_bottle.png'; }}
                              />
                              <div className="mo-item-info">
                                <span className="mo-item-name">{item.medicine_name}</span>
                                <span className="mo-item-qty">Qty: {item.quantity} × ₹{item.price}</span>
                              </div>
                              <span className="mo-item-total">₹{item.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Footer */}
                        <div className="mo-order-footer">
                          <div className="mo-order-summary">
                            <span>{order.total_quantity} item{order.total_quantity > 1 ? 's' : ''}</span>
                            <span className="mo-dot">·</span>
                            <span>Order Total</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div className="mo-order-total">₹{order.grand_total.toFixed(2)}</div>
                            <button onClick={() => handleRemoveOrder(order._id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Order">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
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
                      { label: 'First Name', value: userProfile.first_name },
                      { label: 'Last Name', value: userProfile.last_name },
                      { label: 'Email', value: userProfile.email },
                      { label: 'Phone', value: userProfile.phone || '—' },
                      { label: 'Address', value: userProfile.address || '—' },
                      { label: 'Account Status', value: userProfile.status || 'active' },
                      { label: 'Member Since', value: formatDate(userProfile.createdAt) },
                      { label: 'Last Login', value: userProfile.last_login ? formatDate(userProfile.last_login) : '—' },
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
