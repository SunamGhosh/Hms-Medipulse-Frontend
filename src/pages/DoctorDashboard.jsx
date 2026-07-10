import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, CalendarCheck, User, LogOut, ArrowRight, Clock, ShieldCheck, ArrowUpRight, CheckCircle2,
  AlertCircle, XCircle, Loader2, Users, Stethoscope, Check, Bell, Video, Edit2, Lock, Save, X
} from 'lucide-react';
import './DoctorDashboard.css';

const API = import.meta.env.VITE_URL;
const getToken = () => localStorage.getItem('doctorToken');

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
  PATIENTS: 'patients',
  PROFILE: 'profile',
};

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [doctorName, setDoctorName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [view, setView] = useState(VIEWS.DASHBOARD);
  
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);

  // Profile Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: '',
    consult_fee: '',
    consult_mode: '',
    work_time_start: '',
    work_time_end: '',
    visit_address: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  
  // Password Change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '' });
  const [passStatus, setPassStatus] = useState({ type: '', msg: '' });

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/doctor/login'); return; }
    const stored = localStorage.getItem('doctorName') || 'Doctor';
    setDoctorName(stored.charAt(0).toUpperCase() + stored.slice(1));
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, [navigate]);

  const [notification, setNotification] = useState('');
  const pendingCountRef = React.useRef(0);

  const fetchAppointments = useCallback(async (isPolling = false) => {
    const token = getToken();
    if (!token) return;
    if (!isPolling) setApptLoading(true);
    try {
      const res = await fetch(`${API}/appointment/doctorAll`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const appts = data.appointments || [];
        const newPendingCount = appts.filter(a => a.status === 'pending').length;
        if (isPolling && newPendingCount > pendingCountRef.current) {
          setNotification('New appointment request received!');
          setTimeout(() => setNotification(''), 5000);
        }
        pendingCountRef.current = newPendingCount;
        setAppointments(appts);
      }
    } catch { /* silent */ }
    finally { if (!isPolling) setApptLoading(false); }
  }, []);

  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/doctor/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDoctorProfile(data.doctor);
        setEditForm({
          phone: data.doctor.phone || '',
          consult_fee: data.doctor.consult_fee || '',
          consult_mode: data.doctor.consult_mode || '',
          work_time_start: data.doctor.work_time_start || '',
          work_time_end: data.doctor.work_time_end || '',
          visit_address: data.doctor.visit_address || ''
        });
      }
    } catch { /* silent */ }
  }, []);

  const fetchPatients = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setPatientLoading(true);
    try {
      const res = await fetch(`${API}/patient/doctor/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPatients(data.patients || []);
      }
    } catch { /* silent */ }
    finally {
      setPatientLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchProfile();
    fetchPatients();
    const intervalId = setInterval(() => fetchAppointments(true), 15000);
    return () => clearInterval(intervalId);
  }, [fetchAppointments, fetchProfile, fetchPatients]);

  const handleLogout = () => {
    localStorage.removeItem('doctorToken');
    localStorage.removeItem('doctorEmail');
    localStorage.removeItem('doctorName');
    navigate('/doctor/login');
  };

  const handleStatusUpdate = async (id, status) => {
    const token = getToken();
    try {
      const endpoint = status === 'confirmed' ? 'confirmed' : status === 'completed' ? 'complete' : status === 'rejected' ? 'reject' : 'cancel';
      const method = 'PUT';
      const res = await fetch(`${API}/appointment/doctor/${id}/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cancel_reason: 'Updated by doctor' })
      });
      if (res.ok) fetchAppointments();
    } catch { /* silent */ }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    const token = getToken();
    try {
      const res = await fetch(`${API}/doctor/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        await fetchProfile();
        setIsEditingProfile(false);
        setNotification('Profile updated successfully!');
        setTimeout(() => setNotification(''), 4000);
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      alert('Error updating profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassStatus({ type: '', msg: '' });
    const token = getToken();
    try {
      const res = await fetch(`${API}/doctor/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(passForm)
      });
      const data = await res.json();
      if (res.ok) {
        setPassStatus({ type: 'success', msg: 'Password changed successfully!' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPassForm({ currentPassword: '', newPassword: '' });
          setPassStatus({ type: '', msg: '' });
        }, 2000);
      } else {
        setPassStatus({ type: 'error', msg: data.message || 'Failed to change password' });
      }
    } catch {
      setPassStatus({ type: 'error', msg: 'Network error. Try again.' });
    }
  };

  const pendingAppts = appointments.filter(a => a.status === 'pending').length;
  const todaysAppts = appointments.filter(a => new Date(a.appointment_date).toDateString() === new Date().toDateString()).length;
  const totalCompleted = appointments.filter(a => a.status === 'completed').length;
  
  const stats = [
    { icon: <CalendarCheck size={22} />, label: 'Today\'s Visits', value: apptLoading ? '…' : todaysAppts, trend: 'Patients', color: 'teal' },
    { icon: <Users size={22} />,         label: 'Total Patients',  value: apptLoading ? '…' : appointments.length, trend: 'All time',    color: 'blue' },
    { icon: <CheckCircle2 size={22} />,  label: 'Completed',       value: apptLoading ? '…' : totalCompleted, trend: 'Consultations', color: 'purple' },
    { icon: <AlertCircle size={22} />,   label: 'Pending',         value: apptLoading ? '…' : pendingAppts, trend: 'Require action',         color: 'rose' },
  ];

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="dd-container">
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', background: '#0d9488', color: '#fff',
          padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600,
          animation: 'slideIn 0.3s ease-out'
        }}>
          <Bell size={18} /> {notification}
        </div>
      )}
      <div className="dd-blob dd-blob-1" />
      <div className="dd-blob dd-blob-2" />
      
      <aside className="dd-sidebar">
        <div className="dd-sidebar-brand">
          <div className="dd-sidebar-logo">
            <Stethoscope size={20} strokeWidth={2.5} color="#fff" />
          </div>
          <span>Doctor Portal</span>
        </div>

        <nav className="dd-nav">
          <button className={`dd-nav-item${view === VIEWS.DASHBOARD ? ' active' : ''}`}
            onClick={() => setView(VIEWS.DASHBOARD)}>
            <Activity size={18} /> Dashboard
          </button>

          <button className={`dd-nav-item${view === VIEWS.APPOINTMENTS ? ' active' : ''}`}
            onClick={() => setView(VIEWS.APPOINTMENTS)}>
            <CalendarCheck size={18} /> Appointments
            {pendingAppts > 0 && (
              <span className="dd-badge-count">{pendingAppts}</span>
            )}
          </button>

          <button className={`dd-nav-item${view === VIEWS.PATIENTS ? ' active' : ''}`}
            onClick={() => setView(VIEWS.PATIENTS)}>
            <Users size={18} /> My Patients
          </button>

          <div className="dd-nav-divider" />

          <button className={`dd-nav-item${view === VIEWS.PROFILE ? ' active' : ''}`}
            onClick={() => setView(VIEWS.PROFILE)}>
            <User size={18} /> My Profile
          </button>
        </nav>

        <button className="dd-logout-btn" onClick={handleLogout}>
          <LogOut size={17} /> Sign Out
        </button>
      </aside>

      <main className="dd-main">
        <div className="dd-hero">
          <div className="dd-hero-accent" />
          <div className="dd-hero-left">
            <h1 className="dd-hero-title">
              Welcome back, Dr. <span className="dd-hero-name">{doctorName}</span>
            </h1>
            <p className="dd-hero-sub">
              {greeting} &mdash; You have {todaysAppts} appointments scheduled for today.
            </p>
          </div>
          <div className="dd-hero-right">
            <div className="dd-date">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="dd-avatar">{doctorName.charAt(0).toUpperCase()}</div>
          </div>
        </div>

        {view === VIEWS.DASHBOARD && (
          <>
            <section className="dd-stats-grid">
              {stats.map((s, i) => (
                <div key={i} className={`dd-stat-card dd-stat-card--${s.color}`}>
                  <div className="dd-stat-top">
                    <div className={`dd-stat-icon-wrapper dd-stat-icon-wrapper--${s.color}`}>{s.icon}</div>
                    <div className="dd-stat-badge"><ArrowUpRight size={14} /><span>{s.trend}</span></div>
                  </div>
                  <div className="dd-stat-bottom">
                    <span className="dd-stat-value">{s.value}</span>
                    <span className="dd-stat-label">{s.label}</span>
                  </div>
                  <div className="dd-stat-glow" />
                </div>
              ))}
            </section>

            <section className="dd-section">
              <div className="dd-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="dd-section-title">Pending Appointments</h2>
                <button onClick={() => setView(VIEWS.APPOINTMENTS)}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View all <ArrowRight size={13} />
                </button>
              </div>
              <div className="dd-section-body">
                {apptLoading ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : appointments.filter(a => a.status === 'pending').length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    <CheckCircle2 size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                    <p>No pending appointments to confirm.</p>
                  </div>
                ) : (
                  <ul className="dd-activity-list">
                    {appointments.filter(a => a.status === 'pending').slice(0, 4).map((appt, i) => {
                      const cfg = STATUS_CONFIG[appt.status];
                      return (
                        <li key={i} className="dd-activity-item">
                          <div className="dd-activity-dot" style={{ background: cfg.dot, boxShadow: `0 0 0 3px ${cfg.dot}33` }} />
                          <div className="dd-activity-content">
                            <p className="dd-activity-title">
                              Patient: {appt.patient_id?.first_name} {appt.patient_id?.last_name}
                            </p>
                            <div className="dd-activity-meta">
                              <Clock size={11} />
                              <span>{formatDate(appt.appointment_date)} at {appt.appointment_time}</span>
                              <span className={`dd-activity-badge dd-badge-${cfg.color}`}>{cfg.label}</span>
                              <button onClick={() => handleStatusUpdate(appt._id, 'confirmed')} style={{marginLeft: 'auto', background: '#0d9488', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600}}>Confirm</button>
                              <button onClick={() => handleStatusUpdate(appt._id, 'rejected')} style={{background: '#fecaca', color: '#dc2626', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600}}>Reject</button>
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
          <section className="dd-section">
            <div className="dd-section-header">
              <h2 className="dd-section-title">All Appointments</h2>
            </div>
            <div className="dd-section-body">
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
                            {appt.disease && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Stethoscope size={12} /> {appt.disease}
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

                        {appt.status === 'pending' && (
                          <div style={{display: 'flex', gap: '8px', flexShrink: 0}}>
                            <button onClick={() => handleStatusUpdate(appt._id, 'confirmed')}
                              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={13} /> Confirm
                            </button>
                            <button onClick={() => handleStatusUpdate(appt._id, 'rejected')}
                              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={13} /> Reject
                            </button>
                          </div>
                        )}
                        {appt.status === 'confirmed' && (
                          <div style={{display: 'flex', gap: '8px', flexShrink: 0}}>
                            {appt.consult_mode === 'online' && (
                              <button onClick={() => navigate(`/video-call/MediPulse_${appt._id}`)}
                                style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Video size={13} /> Start Video Call
                              </button>
                            )}
                            <button onClick={() => handleStatusUpdate(appt._id, 'completed')}
                              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={13} /> Mark Complete
                            </button>
                            <button onClick={() => handleStatusUpdate(appt._id, 'cancel')}
                              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={13} /> Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {view === VIEWS.PATIENTS && (
          <section className="dd-section">
            <div className="dd-section-header">
              <h2 className="dd-section-title">My Patients</h2>
            </div>
            <div className="dd-section-body">
              {patientLoading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                  <p>Loading patients…</p>
                </div>
              ) : patients.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Users size={60} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>No patients found</h3>
                  <p>Patients will appear here once they are assigned to you.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {patients.map(p => (
                    <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: '#fff', fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {p.first_name?.[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.first_name} {p.last_name}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                          {p.gender} • {p.age || 'N/A'} yrs • {p.blood_group || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {view === VIEWS.PROFILE && (
          <section className="dd-section">
            <div className="dd-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="dd-section-title">My Profile</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                {!isEditingProfile && (
                  <button onClick={() => setShowPasswordModal(true)} className="dd-outline-btn">
                    <Lock size={15} /> Change Password
                  </button>
                )}
                <button onClick={() => setIsEditingProfile(!isEditingProfile)} className={isEditingProfile ? "dd-outline-btn-cancel" : "dd-solid-btn"}>
                  {isEditingProfile ? <><X size={15} /> Cancel</> : <><Edit2 size={15} /> Edit Profile</>}
                </button>
              </div>
            </div>

            <div className="dd-section-body">
              {doctorProfile ? (
                isEditingProfile ? (
                  <form onSubmit={handleProfileSave} className="dd-edit-form">
                    <div className="dd-form-grid">
                      <div className="dd-form-group">
                        <label>Phone Number</label>
                        <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="e.g. 9876543210" />
                      </div>
                      <div className="dd-form-group">
                        <label>Consult Fee (₹)</label>
                        <input type="number" value={editForm.consult_fee} onChange={e => setEditForm({...editForm, consult_fee: e.target.value})} placeholder="e.g. 500" />
                      </div>
                      <div className="dd-form-group">
                        <label>Consult Mode</label>
                        <select value={editForm.consult_mode} onChange={e => setEditForm({...editForm, consult_mode: e.target.value})}>
                          <option value="">Select mode</option>
                          <option value="online">Online</option>
                          <option value="offline">Offline</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                      <div className="dd-form-group">
                        <label>Work Time Start</label>
                        <input type="time" value={editForm.work_time_start} onChange={e => setEditForm({...editForm, work_time_start: e.target.value})} />
                      </div>
                      <div className="dd-form-group">
                        <label>Work Time End</label>
                        <input type="time" value={editForm.work_time_end} onChange={e => setEditForm({...editForm, work_time_end: e.target.value})} />
                      </div>
                      <div className="dd-form-group">
                        <label>Visit Address / Clinic</label>
                        <input type="text" value={editForm.visit_address} onChange={e => setEditForm({...editForm, visit_address: e.target.value})} placeholder="Full address" />
                      </div>
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" disabled={profileSaving} className="dd-solid-btn">
                        {profileSaving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />} 
                        {profileSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: '#fff', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(2,132,199,0.3)' }}>
                        {doctorProfile.first_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                          Dr. {doctorProfile.first_name} {doctorProfile.last_name}
                        </h3>
                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{doctorProfile.email}</p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      {[
                        { label: 'Specialization', value: doctorProfile.specialization || '—' },
                        { label: 'Department',     value: doctorProfile.department || '—' },
                        { label: 'Phone',          value: doctorProfile.phone || '—' },
                        { label: 'Consult Fee',    value: `₹${doctorProfile.consult_fee || 0}` },
                        { label: 'Consult Mode',   value: doctorProfile.consult_mode || '—' },
                        { label: 'Work Time',      value: `${doctorProfile.work_time_start || '—'} - ${doctorProfile.work_time_end || '—'}` },
                        { label: 'Account Status', value: doctorProfile.status || 'active' },
                        { label: 'Visit Address',  value: doctorProfile.visit_address || '—' },
                        { label: 'Available Days', value: (doctorProfile.available_days || []).join(', ') || '—' },
                        { label: 'Member Since',   value: formatDate(doctorProfile.createdAt) },
                      ].map((row) => (
                        <div key={row.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1.1rem', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>{row.label}</div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{row.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              )}
            </div>
          </section>
        )}

      </main>

      {/* --- Password Modal --- */}
      {showPasswordModal && (
        <div className="dd-modal-overlay">
          <div className="dd-modal">
            <div className="dd-modal-header">
              <h3>Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleChangePassword} className="dd-modal-body">
              {passStatus.msg && (
                <div className={`dd-alert dd-alert-${passStatus.type}`}>
                  {passStatus.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{passStatus.msg}</span>
                </div>
              )}
              <div className="dd-form-group">
                <label>Current Password</label>
                <input type="password" required value={passForm.currentPassword} onChange={e => setPassForm({...passForm, currentPassword: e.target.value})} placeholder="Enter current password" />
              </div>
              <div className="dd-form-group" style={{ marginTop: '12px' }}>
                <label>New Password</label>
                <input type="password" required value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})} placeholder="Enter new password" />
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowPasswordModal(false)} className="dd-outline-btn-cancel">Cancel</button>
                <button type="submit" className="dd-solid-btn">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default DoctorDashboard;
