import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle, AlertCircle, Loader2,
  Eye, Edit2, Phone, Mail, MapPin, Clock, Calendar,
  Award, Stethoscope, IndianRupee, ShieldCheck, Search, Users, UserCheck, UserX, UserMinus, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import './DoctorsList.css';

const API = import.meta.env.VITE_URL || 'http://localhost:4000/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEPARTMENTS = ['Cardiology', 'Dermatology', 'Orthopedics', 'Neurology', 'Pediatrics', 'General Medicine', 'ENT', 'Gynecology', 'Psychiatry', 'Ophthalmology', 'Radiology', 'Oncology'];
const CONSULT_MODES = ['online', 'offline', 'both'];
const STATUSES = ['active', 'inactive', 'on-leave', 'blocked'];

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ---- Search & Filter state ---- */
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  /* ---- Modal state ---- */
  const [viewDoctor, setViewDoctor] = useState(null);       // View modal
  const [editDoctor, setEditDoctor] = useState(null);       // Update modal

  /* ---- Edit form state ---- */
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError] = useState('');

  /* ============================================================
     Fetch
  ============================================================ */
  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/doctor/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setDoctors(data.doctors || []);
      else setError(data.message || 'Failed to fetch doctors');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  /* ============================================================
     View Modal
  ============================================================ */
  const openViewModal = (doctor) => setViewDoctor(doctor);
  const closeViewModal = () => setViewDoctor(null);

  /* ============================================================
     Update (Edit) Modal
  ============================================================ */
  const openEditModal = (doctor) => {
    setEditDoctor(doctor);
    setEditForm({
      first_name: doctor.first_name || '',
      last_name: doctor.last_name || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      department: doctor.department || '',
      specialization: doctor.specialization || '',
      qualification: doctor.qualification || '',
      experience_year: doctor.experience_year || '',
      visit_address: doctor.visit_address || '',
      consult_fee: doctor.consult_fee || '',
      consult_mode: doctor.consult_mode || 'both',
      available_days: doctor.available_days || [],
      work_time_start: doctor.work_time_start || '',
      work_time_end: doctor.work_time_end || '',
      status: doctor.status || 'active',
      license_no: doctor.license_no || '',
      is_verified: doctor.is_verified ?? false,
    });
    setEditSuccess('');
    setEditError('');
  };

  const closeEditModal = () => {
    setEditDoctor(null);
    setEditForm({});
    setEditSuccess('');
    setEditError('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleDay = (day) => {
    setEditForm(prev => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter(d => d !== day)
        : [...prev.available_days, day]
    }));
  };

  /* ---- Status Pop Up Modal state ---- */
  const [statusPopup, setStatusPopup] = useState({ open: false, doctorName: '', oldStatus: '', newStatus: '' });

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditSuccess('');
    setEditError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/update-doctor-profile/${editDoctor._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editForm,
          experience_year: Number(editForm.experience_year),
          consult_fee: Number(editForm.consult_fee),
        })
      });
      const data = await response.json();
      if (response.ok) {
        const oldStatus = editDoctor.status;
        const newStatus = editForm.status;
        const doctorName = `Dr. ${editForm.first_name} ${editForm.last_name}`;

        setEditSuccess('Doctor updated successfully!');
        setDoctors(prev => prev.map(d =>
          d._id === editDoctor._id ? { ...d, ...editForm } : d
        ));
        setEditDoctor(prev => ({ ...prev, ...editForm }));

        if (oldStatus !== newStatus) {
          setStatusPopup({ open: true, doctorName, oldStatus, newStatus });
        } else {
          toast.success(`${doctorName} updated successfully!`);
        }
      } else {
        setEditError(data.message || 'Update failed');
      }
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  /* ============================================================
     Toggle Status (quick action)
  ============================================================ */
  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/update-doctor-profile/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        const doc = doctors.find(d => d._id === id);
        const doctorName = doc ? `Dr. ${doc.first_name} ${doc.last_name}` : 'Doctor';
        setDoctors(doctors.map(d => d._id === id ? { ...d, status: newStatus } : d));
        setStatusPopup({ open: true, doctorName, oldStatus: currentStatus, newStatus });
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ============================================================
     Avatar Helper (Initial letter when no custom photo)
  ============================================================ */
  const renderAvatar = (doctor, size = 44, fontSize = '16px') => {
    const initial = doctor?.first_name ? doctor.first_name.charAt(0).toUpperCase() : 'D';
    const hasCustomImg = doctor?.profile_img &&
      !doctor.profile_img.includes('placeholder') &&
      !doctor.profile_img.includes('ui-avatars.com');

    if (hasCustomImg) {
      return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <img
            src={doctor.profile_img}
            alt={doctor.first_name}
            className="dl-avatar"
            style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div
            className="dl-avatar-initial"
            style={{
              display: 'none',
              width: size,
              height: size,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: fontSize,
              boxShadow: '0 2px 8px rgba(14, 165, 233, 0.25)'
            }}
          >
            {initial}
          </div>
        </div>
      );
    }

    return (
      <div
        className="dl-avatar-initial"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: fontSize,
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(14, 165, 233, 0.25)'
        }}
      >
        {initial}
      </div>
    );
  };

  const statusColor = (s) => ({
    active: 'status-active',
    inactive: 'status-inactive',
    'on-leave': 'status-onleave',
    blocked: 'status-blocked',
  }[s] || 'status-inactive');

  /* ============================================================
     Counts & Filtered Data
  ============================================================ */
  const counts = {
    all: doctors.length,
    active: doctors.filter(d => d.status === 'active').length,
    inactive: doctors.filter(d => d.status === 'inactive').length,
    'on-leave': doctors.filter(d => d.status === 'on-leave').length,
    blocked: doctors.filter(d => d.status === 'blocked').length,
    verified: doctors.filter(d => d.is_verified).length,
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesStatus = selectedStatus === 'all'
      ? true
      : selectedStatus === 'verified'
        ? !!doc.is_verified
        : doc.status === selectedStatus;
    const name = `${doc.first_name || ''} ${doc.last_name || ''}`.toLowerCase();
    const dept = (doc.department || '').toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || name.includes(q) || dept.includes(q);
    return matchesStatus && matchesSearch;
  });

  /* ============================================================
     Render
  ============================================================ */
  if (loading) return (
    <div className="doctors-list-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <Loader2 size={32} className="dl-spinner" />
    </div>
  );
  if (error) return <div className="doctors-list-container"><div className="dl-error">Error: {error}</div></div>;

  return (
    <div className="doctors-list-container">
      {/* Header */}
      <div className="doctors-header">
        <div>
          <h2>Doctors Management</h2>
          <p>{doctors.length} total doctor{doctors.length !== 1 ? 's' : ''} registered in system</p>
        </div>
      </div>

      {/* Status Section (Filter Tabs with Counts) */}
      <div className="dl-status-cards">
        <button
          className={`dl-status-card ${selectedStatus === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('all')}
        >
          <div className="dl-status-card-icon dl-icon-all"><Users size={18} /></div>
          <div className="dl-status-card-info">
            <span className="dl-status-card-title">All Doctors</span>
            <span className="dl-status-card-count">{counts.all}</span>
          </div>
        </button>

        <button
          className={`dl-status-card ${selectedStatus === 'active' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('active')}
        >
          <div className="dl-status-card-icon dl-icon-active"><UserCheck size={18} /></div>
          <div className="dl-status-card-info">
            <span className="dl-status-card-title">Active</span>
            <span className="dl-status-card-count">{counts.active}</span>
          </div>
        </button>

        <button
          className={`dl-status-card ${selectedStatus === 'verified' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('verified')}
        >
          <div className="dl-status-card-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}><ShieldCheck size={18} /></div>
          <div className="dl-status-card-info">
            <span className="dl-status-card-title">Verified</span>
            <span className="dl-status-card-count">{counts.verified}</span>
          </div>
        </button>

        <button
          className={`dl-status-card ${selectedStatus === 'inactive' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('inactive')}
        >
          <div className="dl-status-card-icon dl-icon-inactive"><UserX size={18} /></div>
          <div className="dl-status-card-info">
            <span className="dl-status-card-title">Inactive</span>
            <span className="dl-status-card-count">{counts.inactive}</span>
          </div>
        </button>

        <button
          className={`dl-status-card ${selectedStatus === 'on-leave' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('on-leave')}
        >
          <div className="dl-status-card-icon dl-icon-onleave"><UserMinus size={18} /></div>
          <div className="dl-status-card-info">
            <span className="dl-status-card-title">On Leave</span>
            <span className="dl-status-card-count">{counts['on-leave']}</span>
          </div>
        </button>

        <button
          className={`dl-status-card ${selectedStatus === 'blocked' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('blocked')}
        >
          <div className="dl-status-card-icon dl-icon-blocked"><ShieldAlert size={18} /></div>
          <div className="dl-status-card-info">
            <span className="dl-status-card-title">Blocked</span>
            <span className="dl-status-card-count">{counts.blocked}</span>
          </div>
        </button>
      </div>

      {/* Search Bar */}
      <div className="dl-toolbar">
        <div className="dl-search-box">
          <Search size={18} className="dl-search-icon" />
          <input
            type="text"
            placeholder="Search doctor by name or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="dl-search-input"
          />
          {searchQuery && (
            <button className="dl-search-clear" onClick={() => setSearchQuery('')} title="Clear search">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="dl-results-count">
          Showing {filteredDoctors.length} of {doctors.length} doctors
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="doctors-table">
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Email</th>
              <th>Department</th>
              <th>Specialization</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDoctors.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center" style={{ padding: '3rem', color: '#9ca3af' }}>
                  No doctors found matching criteria.
                </td>
              </tr>
            ) : (
              filteredDoctors.map(doctor => (
                <tr key={doctor._id}>
                  <td>
                    <div className="dl-doctor-cell">
                      {renderAvatar(doctor, 44, '16px')}
                      <div>
                        <div className="dl-name">Dr. {doctor.first_name} {doctor.last_name}</div>
                        <div className="dl-exp">{doctor.experience_year || 0} yrs exp</div>
                      </div>
                    </div>
                  </td>
                  <td className="dl-email">{doctor.email}</td>
                  <td>{doctor.department}</td>
                  <td>{doctor.specialization}</td>
                  <td>
                    <span className={`status-badge ${statusColor(doctor.status)}`}>
                      {doctor.status}
                    </span>
                  </td>
                  <td>
                    <div className="dl-actions">
                      {/* View */}
                      <button
                        className="dl-btn dl-btn-view"
                        onClick={() => openViewModal(doctor)}
                        title="View Doctor Details"
                      >
                        <Eye size={14} /> View
                      </button>
                      {/* Update */}
                      <button
                        className="dl-btn dl-btn-edit"
                        onClick={() => openEditModal(doctor)}
                        title="Update Doctor Info"
                      >
                        <Edit2 size={14} /> Update
                      </button>
                      {/* Quick status toggle */}
                      <button
                        className={`toggle-btn ${doctor.status === 'active' ? 'btn-suspend' : 'btn-activate'}`}
                        onClick={() => toggleStatus(doctor._id, doctor.status)}
                      >
                        {doctor.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================================================================
          VIEW MODAL
      ================================================================ */}
      {viewDoctor && (
        <div className="dl-modal-overlay" onClick={closeViewModal}>
          <div className="dl-modal dl-modal-view" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="dl-modal-header dl-view-header">
              <h3>Doctor Profile</h3>
              <button className="dl-modal-close" onClick={closeViewModal}><X size={20} /></button>
            </div>

            <div className="dl-modal-body dl-view-body">
              {/* Avatar & basic */}
              <div className="dl-view-top">
                {renderAvatar(viewDoctor, 72, '28px')}
                <div className="dl-view-title">
                  <h4>Dr. {viewDoctor.first_name} {viewDoctor.last_name}</h4>
                  <p className="dl-view-spec">{viewDoctor.specialization}</p>
                  <span className={`status-badge ${statusColor(viewDoctor.status)}`}>{viewDoctor.status}</span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="dl-view-grid">
                <div className="dl-view-info-item">
                  <Mail size={15} className="dl-view-icon" />
                  <div>
                    <span className="dl-view-label">Email</span>
                    <span className="dl-view-value">{viewDoctor.email}</span>
                  </div>
                </div>
                <div className="dl-view-info-item">
                  <Phone size={15} className="dl-view-icon" />
                  <div>
                    <span className="dl-view-label">Phone</span>
                    <span className="dl-view-value">{viewDoctor.phone}</span>
                  </div>
                </div>
                <div className="dl-view-info-item">
                  <Stethoscope size={15} className="dl-view-icon" />
                  <div>
                    <span className="dl-view-label">Department</span>
                    <span className="dl-view-value">{viewDoctor.department}</span>
                  </div>
                </div>
                <div className="dl-view-info-item">
                  <Award size={15} className="dl-view-icon" />
                  <div>
                    <span className="dl-view-label">Qualification</span>
                    <span className="dl-view-value">{viewDoctor.qualification}</span>
                  </div>
                </div>
                <div className="dl-view-info-item">
                  <ShieldCheck size={15} className="dl-view-icon" />
                  <div>
                    <span className="dl-view-label">License No.</span>
                    <span className="dl-view-value">{viewDoctor.license_no}</span>
                  </div>
                </div>
                <div className="dl-view-info-item">
                  <IndianRupee size={15} className="dl-view-icon" />
                  <div>
                    <span className="dl-view-label">Consult Fee</span>
                    <span className="dl-view-value">₹{viewDoctor.consult_fee}</span>
                  </div>
                </div>
                <div className="dl-view-info-item">
                  <Clock size={15} className="dl-view-icon" />
                  <div>
                    <span className="dl-view-label">Working Hours</span>
                    <span className="dl-view-value">{viewDoctor.work_time_start} – {viewDoctor.work_time_end}</span>
                  </div>
                </div>
                <div className="dl-view-info-item">
                  <MapPin size={15} className="dl-view-icon" />
                  <div>
                    <span className="dl-view-label">Visit Address</span>
                    <span className="dl-view-value">{viewDoctor.visit_address}</span>
                  </div>
                </div>
                <div className="dl-view-info-item dl-view-full">
                  <Calendar size={15} className="dl-view-icon" />
                  <div>
                    <span className="dl-view-label">Available Days</span>
                    <div className="dl-view-days">
                      {(viewDoctor.available_days || []).map(d => (
                        <span key={d} className="dl-day-chip dl-day-chip--on">{d.slice(0,3)}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="dl-view-info-item">
                  <Stethoscope size={15} className="dl-view-icon" />
                  <div>
                    <span className="dl-view-label">Consult Mode</span>
                    <span className="dl-view-value" style={{ textTransform: 'capitalize' }}>{viewDoctor.consult_mode}</span>
                  </div>
                </div>
                <div className="dl-view-info-item">
                  <Award size={15} className="dl-view-icon" />
                  <div>
                    <span className="dl-view-label">Experience</span>
                    <span className="dl-view-value">{viewDoctor.experience_year} years</span>
                  </div>
                </div>
                <div className="dl-view-info-item dl-view-full">
                  <Clock size={15} className="dl-view-icon" />
                  <div>
                    <span className="dl-view-label">Last Login Date</span>
                    <span className="dl-view-value">
                      {viewDoctor.last_login
                        ? new Date(viewDoctor.last_login).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })
                        : 'Never logged in yet'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="dl-modal-footer">
              <button className="dl-btn dl-btn-cancel" onClick={closeViewModal}>Close</button>
              <button className="dl-btn dl-btn-edit" onClick={() => { closeViewModal(); openEditModal(viewDoctor); }}>
                <Edit2 size={14} /> Edit Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          UPDATE / EDIT MODAL (Admin updates details only)
      ================================================================ */}
      {editDoctor && (
        <div className="dl-modal-overlay" onClick={closeEditModal}>
          <div className="dl-modal dl-modal-edit" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="dl-modal-header">
              <h3><Edit2 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Update Doctor Information</h3>
              <button className="dl-modal-close" onClick={closeEditModal}><X size={20} /></button>
            </div>

            <div className="dl-modal-body dl-edit-body">
              {/* --- Edit Form --- */}
              <form className="dl-edit-form" onSubmit={handleEditSubmit}>
                <div className="dl-form-grid">
                  <div className="dl-form-group">
                    <label>First Name</label>
                    <input name="first_name" value={editForm.first_name} onChange={handleEditChange} required />
                  </div>
                  <div className="dl-form-group">
                    <label>Last Name</label>
                    <input name="last_name" value={editForm.last_name} onChange={handleEditChange} required />
                  </div>
                  <div className="dl-form-group">
                    <label>Email</label>
                    <input name="email" type="email" value={editForm.email} onChange={handleEditChange} required />
                  </div>
                  <div className="dl-form-group">
                    <label>Phone</label>
                    <input name="phone" value={editForm.phone} onChange={handleEditChange} />
                  </div>
                  <div className="dl-form-group">
                    <label>Department</label>
                    <select name="department" value={editForm.department} onChange={handleEditChange}>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="dl-form-group">
                    <label>Specialization</label>
                    <input name="specialization" value={editForm.specialization} onChange={handleEditChange} />
                  </div>
                  <div className="dl-form-group">
                    <label>Qualification</label>
                    <input name="qualification" value={editForm.qualification} onChange={handleEditChange} />
                  </div>
                  <div className="dl-form-group">
                    <label>License No.</label>
                    <input name="license_no" value={editForm.license_no} onChange={handleEditChange} />
                  </div>
                  <div className="dl-form-group">
                    <label>Experience (years)</label>
                    <input name="experience_year" type="number" min="0" value={editForm.experience_year} onChange={handleEditChange} />
                  </div>
                  <div className="dl-form-group">
                    <label>Consult Fee (₹)</label>
                    <input name="consult_fee" type="number" min="0" value={editForm.consult_fee} onChange={handleEditChange} />
                  </div>
                  <div className="dl-form-group">
                    <label>Work Start</label>
                    <input name="work_time_start" type="time" value={editForm.work_time_start} onChange={handleEditChange} />
                  </div>
                  <div className="dl-form-group">
                    <label>Work End</label>
                    <input name="work_time_end" type="time" value={editForm.work_time_end} onChange={handleEditChange} />
                  </div>
                  <div className="dl-form-group">
                    <label>Consult Mode</label>
                    <select name="consult_mode" value={editForm.consult_mode} onChange={handleEditChange}>
                      {CONSULT_MODES.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="dl-form-group">
                    <label>Status</label>
                    <select name="status" value={editForm.status} onChange={handleEditChange}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="dl-form-group">
                    <label>Verification Status</label>
                    <select
                      name="is_verified"
                      value={editForm.is_verified ? 'true' : 'false'}
                      onChange={(e) => setEditForm(prev => ({ ...prev, is_verified: e.target.value === 'true' }))}
                    >
                      <option value="true">Verified ✓</option>
                      <option value="false">Unverified</option>
                    </select>
                  </div>
                  <div className="dl-form-group dl-form-full">
                    <label>Visit Address</label>
                    <input name="visit_address" value={editForm.visit_address} onChange={handleEditChange} />
                  </div>
                  <div className="dl-form-group dl-form-full">
                    <label>Available Days</label>
                    <div className="dl-days-picker">
                      {DAYS.map(day => (
                        <button
                          key={day}
                          type="button"
                          className={`dl-day-chip ${editForm.available_days?.includes(day) ? 'dl-day-chip--on' : ''}`}
                          onClick={() => toggleDay(day)}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {editSuccess && <div className="dl-alert dl-alert-success"><CheckCircle size={14} /> {editSuccess}</div>}
                {editError && <div className="dl-alert dl-alert-error"><AlertCircle size={14} /> {editError}</div>}

                <div className="dl-modal-footer dl-edit-footer">
                  <button type="button" className="dl-btn dl-btn-cancel" onClick={closeEditModal}>Cancel</button>
                  <button type="submit" className="dl-btn dl-btn-save" disabled={editLoading}>
                    {editLoading ? <><Loader2 size={14} className="dl-spinner" /> Saving...</> : <><CheckCircle size={14} /> Save Changes</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          STATUS CHANGE POPUP MODAL
      ================================================================ */}
      {statusPopup.open && (
        <div className="dl-modal-overlay" onClick={() => setStatusPopup({ ...statusPopup, open: false })}>
          <div className="dl-modal" style={{ maxWidth: 440, padding: 24, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: statusPopup.newStatus === 'active' ? '#dcfce7' : statusPopup.newStatus === 'inactive' ? '#fee2e2' : statusPopup.newStatus === 'on-leave' ? '#fef9c3' : '#f1f5f9',
              color: statusPopup.newStatus === 'active' ? '#16a34a' : statusPopup.newStatus === 'inactive' ? '#dc2626' : statusPopup.newStatus === 'on-leave' ? '#ca8a04' : '#475569',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <CheckCircle size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Status Updated!</h3>
            <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '0 0 20px', lineHeight: 1.5 }}>
              Status for <strong style={{ color: '#0f172a' }}>{statusPopup.doctorName}</strong> has been changed from{' '}
              <span style={{ textTransform: 'uppercase', fontWeight: 700, color: '#64748b' }}>{statusPopup.oldStatus}</span> to{' '}
              <span style={{
                textTransform: 'uppercase', fontWeight: 800,
                color: statusPopup.newStatus === 'active' ? '#16a34a' : statusPopup.newStatus === 'inactive' ? '#dc2626' : statusPopup.newStatus === 'on-leave' ? '#ca8a04' : '#475569'
              }}>{statusPopup.newStatus}</span>.
            </p>
            <button
              className="dl-btn dl-btn-save"
              style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, borderRadius: 12 }}
              onClick={() => setStatusPopup({ ...statusPopup, open: false })}
            >
              OK, Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsList;
