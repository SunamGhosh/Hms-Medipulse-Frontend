import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './AppointmentsList.css';

const AppointmentsList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAppointments = async () => {
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

  useEffect(() => { fetchAppointments(); }, []);

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
      } else {
        toast.error(data.message || 'Failed to cancel');
      }
    } catch (err) { toast.error(err.message); }
  };

  const doctorName = (a) => a.doctor_id?.first_name ? `Dr. ${a.doctor_id.first_name} ${a.doctor_id.last_name}` : '—';
  const patientName = (a) => a.patient_id?.first_name ? `${a.patient_id.first_name} ${a.patient_id.last_name}` : '—';
  const bookedBy = (a) => a.booked_by?.first_name
    ? `${a.booked_by.first_name} ${a.booked_by.last_name}`
    : '—';

  if (loading) return <div className="appointments-list-container"><p className="al-loading">Loading...</p></div>;
  if (error) return <div className="appointments-list-container"><p className="al-error">Error: {error}</p></div>;

  return (
    <div className="appointments-list-container">
      <div className="appointments-header">
        <h2>Appointments List</h2>
        <span className="appointments-count">{appointments.length} total</span>
      </div>

      {/* Column Headers */}
      <div className="al-table-header">
        <span>Doctor</span>
        <span>Patient</span>
        <span>Booked By</span>
        <span>Date</span>
        <span>Time</span>
        <span>Mode</span>
        <span>Disease</span>
        <span>Status</span>
        <span>Action</span>
      </div>

      {appointments.length === 0 ? (
        <div className="al-empty">No appointments found.</div>
      ) : (
        <div className="al-cards">
          {appointments.map(appointment => (
            <div key={appointment._id} className="al-card">
              <div className="al-cell" title={doctorName(appointment)}>{doctorName(appointment)}</div>
              <div className="al-cell" title={patientName(appointment)}>{patientName(appointment)}</div>
              <div className="al-cell" title={bookedBy(appointment)}>{bookedBy(appointment)}</div>
              <div className="al-cell al-cell-sub">{new Date(appointment.appointment_date).toLocaleDateString()}</div>
              <div className="al-cell al-cell-sub">{appointment.appointment_time}</div>
              <div className="al-cell al-cell-sub" style={{ textTransform: 'capitalize' }}>{appointment.consult_mode}</div>
              <div className="al-cell" title={appointment.disease}>{appointment.disease}</div>
              <div className="al-cell">
                <span className={`status-badge status-${appointment.status}`}>{appointment.status}</span>
              </div>
              <div className="al-cell">
                <button
                  className="btn-cancel"
                  onClick={() => handleCancel(appointment._id)}
                  disabled={['cancelled', 'completed', 'rejected'].includes(appointment.status)}
                >
                  {appointment.status === 'cancelled' ? 'Cancelled' : 'Cancel'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentsList;
