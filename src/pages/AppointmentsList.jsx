import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, X, CalendarDays, Filter, RefreshCw } from 'lucide-react';
import './AppointmentsList.css';

const AppointmentsList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_URL}/appointment/adminAll`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAppointments(data.appointments || []);
      } else {
        setError(data.message || 'Failed to fetch appointments');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchAppointments(); 
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_URL}/appointment/admin/${id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setAppointments(prev => prev.map(app => app._id === id ? { ...app, status: 'cancelled' } : app));
        toast.success('Appointment cancelled successfully');
      } else {
        toast.error(data.message || 'Failed to cancel');
      }
    } catch (err) { 
      toast.error(err.message); 
    }
  };

  const doctorName = (a) => a.doctor_id?.first_name ? `Dr. ${a.doctor_id.first_name} ${a.doctor_id.last_name}` : '—';
  const patientName = (a) => a.patient_id?.first_name ? `${a.patient_id.first_name} ${a.patient_id.last_name}` : '—';
  const bookedBy = (a) => a.booked_by?.first_name ? `${a.booked_by.first_name} ${a.booked_by.last_name}` : '—';

  // Count helper
  const getCount = (key) => {
    if (key === 'all') return appointments.length;
    if (key === 'follow_up') return appointments.filter(a => a.follow_up_date || (a.follow_up_status && a.follow_up_status !== 'none')).length;
    return appointments.filter(a => (a.status || '').toLowerCase() === key).length;
  };

  const statusOptions = [
    { key: 'all', label: 'All', count: getCount('all') },
    { key: 'pending', label: 'Pending', count: getCount('pending') },
    { key: 'confirmed', label: 'Confirmed', count: getCount('confirmed') },
    { key: 'completed', label: 'Completed', count: getCount('completed') },
    { key: 'follow_up', label: 'Follow-up', count: getCount('follow_up') },
    { key: 'expired', label: 'Expired', count: getCount('expired') },
    { key: 'cancelled', label: 'Cancelled', count: getCount('cancelled') },
    { key: 'rejected', label: 'Rejected', count: getCount('rejected') },
  ];

  // Filtering Logic
  const filteredAppointments = appointments.filter(app => {
    // 1. Status Filter
    if (statusFilter === 'follow_up') {
      if (!app.follow_up_date && (!app.follow_up_status || app.follow_up_status === 'none')) return false;
    } else if (statusFilter !== 'all') {
      if ((app.status || '').toLowerCase() !== statusFilter) return false;
    }

    // 2. Search Filter (Doctor or Patient)
    if (!searchTerm.trim()) return true;

    const query = searchTerm.toLowerCase().trim();
    const cleanQuery = query.replace(/^(dr\.|dr\s+|doctor\s+)/i, '').trim();

    const dName = doctorName(app).toLowerCase();
    const pName = patientName(app).toLowerCase();
    const bName = bookedBy(app).toLowerCase();
    const diseaseStr = (app.disease || '').toLowerCase();
    const apptId = (app._id || '').toLowerCase();

    return dName.includes(query) || (cleanQuery && dName.includes(cleanQuery)) || 
           pName.includes(query) || bName.includes(query) || 
           diseaseStr.includes(query) || apptId.includes(query);
  });

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  if (loading) return <div className="appointments-list-container"><p className="al-loading">Loading appointments...</p></div>;
  if (error) return <div className="appointments-list-container"><p className="al-error">Error: {error}</p></div>;

  return (
    <div className="appointments-list-container">
      {/* Header */}
      <div className="appointments-header">
        <div className="al-title-box">
          <h2>Appointments Management</h2>
          <p className="al-subtitle">Search, view, and manage all patient & doctor appointments.</p>
        </div>
        <span className="appointments-count">{appointments.length} Total Appointments</span>
      </div>

      {/* Search & Status Filter Controls */}
      <div className="al-controls-card">
        <div className="al-search-box">
          <Search className="al-search-icon" size={18} />
          <input
            type="text"
            placeholder="Search by doctor name (e.g. Dr. Somnath) or patient name (e.g. Subham)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="al-clear-btn" onClick={() => setSearchTerm('')} title="Clear search">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="al-tabs-bar">
          {statusOptions.map(opt => (
            <button
              key={opt.key}
              className={`al-tab-btn ${statusFilter === opt.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(opt.key)}
            >
              <span>{opt.label}</span>
              <span className="al-tab-count">{opt.count}</span>
            </button>
          ))}
          {(searchTerm || statusFilter !== 'all') && (
            <button className="al-reset-btn" onClick={resetFilters} title="Reset filters">
              <RefreshCw size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Results Counter Bar */}
      <div className="al-results-info">
        <span>Showing <strong>{filteredAppointments.length}</strong> of {appointments.length} appointments</span>
        {searchTerm && <span> &bull; Filtered by doctor/patient: "<strong>{searchTerm}</strong>"</span>}
      </div>

      {/* Table Column Headers */}
      <div className="al-table-header">
        <span>Doctor</span>
        <span>Patient</span>
        <span>Booked By</span>
        <span>Date</span>
        <span>Time</span>
        <span>Meeting Time</span>
        <span>Mode</span>
        <span>Disease</span>
        <span>Status</span>
        <span>Action</span>
      </div>

      {/* Appointments List Grid */}
      {filteredAppointments.length === 0 ? (
        <div className="al-empty">
          <CalendarDays size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <p style={{ margin: '0 0 6px 0', fontWeight: 700, color: '#475569', fontSize: 16 }}>No matching appointments found</p>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Try searching with a different doctor or patient name.</p>
          {(searchTerm || statusFilter !== 'all') && (
            <button className="al-reset-btn" style={{ marginTop: 16 }} onClick={resetFilters}>
              Clear Search Filters
            </button>
          )}
        </div>
      ) : (
        <div className="al-cards">
          {filteredAppointments.map(appointment => {
            const statusKey = (appointment.status || 'pending').toLowerCase();
            const hasFollowUp = appointment.follow_up_date || (appointment.follow_up_status && appointment.follow_up_status !== 'none');
            return (
              <div key={appointment._id} className="al-card" style={{ flexWrap: 'wrap' }}>
                <div className="al-cell al-cell-doctor" title={doctorName(appointment)}>
                  {doctorName(appointment)}
                </div>
                <div className="al-cell al-cell-patient" title={patientName(appointment)}>
                  {patientName(appointment)}
                </div>
                <div className="al-cell" title={bookedBy(appointment)}>{bookedBy(appointment)}</div>
                <div className="al-cell al-cell-sub">{new Date(appointment.appointment_date).toLocaleDateString()}</div>
                <div className="al-cell al-cell-sub">{appointment.appointment_time}</div>
                {/* Meeting Time Column */}
                <div className="al-cell" title={appointment.status === 'completed' && appointment.meet_time_start ? 'Meeting time details' : 'No meeting recorded'}>
                  {appointment.status === 'completed' && (appointment.meet_time_start || appointment.meet_time_end) ? (
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11 }}>
                      {appointment.meet_time_start && (
                        <span style={{ color: '#0d9488', fontWeight: 600 }}>
                          ▶ {new Date(appointment.meet_time_start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                      )}
                      {appointment.meet_time_end && (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>
                          ■ {new Date(appointment.meet_time_end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                      )}
                      {appointment.meet_time != null && (
                        <span style={{ color: '#7c3aed', fontWeight: 700 }}>{appointment.meet_time} min</span>
                      )}
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>—</span>
                  )}
                </div>
                <div className="al-cell al-cell-sub" style={{ textTransform: 'capitalize' }}>{appointment.consult_mode}</div>
                <div className="al-cell" title={appointment.disease}>{appointment.disease}</div>
                <div className="al-cell">
                  <span className={`status-badge status-${statusKey}`}>{statusKey}</span>
                </div>
                <div className="al-cell">
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancel(appointment._id)}
                    disabled={['cancelled', 'completed', 'rejected', 'expired'].includes(statusKey)}
                  >
                    {statusKey === 'cancelled' ? 'Cancelled' : 'Cancel'}
                  </button>
                </div>

                {/* Follow-up Status Box in Admin Panel */}
                {hasFollowUp && (
                  <div style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #f0fdfa 0%, #e6fffa 100%)',
                    border: '1.5px solid #99f6e4',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginTop: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '12px',
                    boxShadow: '0 2px 8px rgba(13, 148, 136, 0.06)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        📅 Follow-up Consultation Details
                      </span>
                      <span style={{
                        padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                        background: appointment.follow_up_status === 'accepted' ? '#dcfce7' : appointment.follow_up_status === 'requested' ? '#dbeafe' : appointment.follow_up_status === 'rejected' ? '#ffedd5' : appointment.follow_up_status === 'cancelled' ? '#fee2e2' : '#f1f5f9',
                        color: appointment.follow_up_status === 'accepted' ? '#15803d' : appointment.follow_up_status === 'requested' ? '#1d4ed8' : appointment.follow_up_status === 'rejected' ? '#c2410c' : appointment.follow_up_status === 'cancelled' ? '#b91c1c' : '#475569',
                        border: `1px solid ${appointment.follow_up_status === 'accepted' ? '#86efac' : appointment.follow_up_status === 'requested' ? '#93c5fd' : appointment.follow_up_status === 'rejected' ? '#fdba74' : appointment.follow_up_status === 'cancelled' ? '#fca5a5' : '#cbd5e1'}`
                      }}>
                        Status: {appointment.follow_up_status || 'none'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: '#334155' }}>
                      <span><strong>Follow-up Date & Time:</strong> {appointment.follow_up_date ? new Date(appointment.follow_up_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'} {appointment.follow_up_time ? `at ${appointment.follow_up_time}` : ''}</span>
                      <span><strong>Consultation Mode:</strong> <span style={{ textTransform: 'capitalize', color: '#0d9488', fontWeight: 700 }}>{appointment.consult_mode}</span> (Same as initial meet)</span>
                      <span><strong>Consultation Fee:</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>Free / ₹0 (No Charges)</span></span>
                      <span><strong>Booked By Role:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{appointment.booker_role === 'pharmacist' ? 'Pharmacist' : 'Patient'}</span></span>
                    </div>
                    {appointment.follow_up_reason && (
                      <div style={{ background: '#fff', border: '1px solid #99f6e4', borderRadius: '8px', padding: '6px 12px', color: '#0f766e', fontWeight: 600 }}>
                        📝 Patient Request Note: {appointment.follow_up_reason}
                      </div>
                    )}
                    {appointment.follow_up_status === 'rejected' && (appointment.cancel_reason || appointment.follow_up_cancel_reason) && (
                      <div style={{ background: '#fff', border: '1px solid #fed7aa', borderRadius: '8px', padding: '8px 12px', color: '#c2410c', fontWeight: 600 }}>
                        ❌ Rejection Reason: {appointment.cancel_reason || appointment.follow_up_cancel_reason}
                      </div>
                    )}
                    {appointment.follow_up_status === 'cancelled' && appointment.follow_up_cancel_reason && (
                      <div style={{ background: '#fff', border: '1px solid #fca5a5', borderRadius: '8px', padding: '8px 12px', color: '#991b1b', marginTop: '2px', fontWeight: 600 }}>
                        ❌ Cancellation Reason: {appointment.follow_up_cancel_reason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AppointmentsList;
