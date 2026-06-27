import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, Upload, X, CheckCircle, AlertCircle, Loader2,
  Eye, Edit2, Phone, Mail, MapPin, Clock, Calendar,
  Award, Stethoscope, DollarSign, ShieldCheck
} from 'lucide-react';
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

  /* ---- Modal state ---- */
  const [viewDoctor, setViewDoctor] = useState(null);       // View modal
  const [editDoctor, setEditDoctor] = useState(null);       // Update modal
  const [photoDoctor, setPhotoDoctor] = useState(null);     // Photo update (inside update modal)

  /* ---- Edit form state ---- */
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError] = useState('');

  /* ---- Photo upload state ---- */
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

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
      if (response.ok) setDoctors(data.doctors);
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
    });
    setEditSuccess('');
    setEditError('');
    // reset photo state too
    setNewImageFile(null);
    setNewImagePreview(null);
    setUploadSuccess('');
    setUploadError('');
  };

  const closeEditModal = () => {
    setEditDoctor(null);
    setEditForm({});
    setEditSuccess('');
    setEditError('');
    setNewImageFile(null);
    setNewImagePreview(null);
    setUploadSuccess('');
    setUploadError('');
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
        setEditSuccess('Doctor updated successfully!');
        setDoctors(prev => prev.map(d =>
          d._id === editDoctor._id ? { ...d, ...editForm } : d
        ));
        setEditDoctor(prev => ({ ...prev, ...editForm }));
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
     Photo Upload (inside edit modal)
  ============================================================ */
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadError('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('Image must be less than 5MB.'); return; }
    setUploadError('');
    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  };

  const handlePhotoUpload = async () => {
    if (!newImageFile || !editDoctor) return;
    setUploading(true);
    setUploadSuccess('');
    setUploadError('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profile_img', newImageFile);
      const response = await fetch(`${API}/admin/update-doctor-profile/${editDoctor._id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        setUploadSuccess('Photo updated successfully!');
        setDoctors(prev => prev.map(d =>
          d._id === editDoctor._id ? { ...d, profile_img: data.doctor.profile_img } : d
        ));
        setEditDoctor(prev => ({ ...prev, profile_img: data.doctor.profile_img }));
      } else {
        setUploadError(data.message || 'Upload failed');
      }
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
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
        setDoctors(doctors.map(doc => doc._id === id ? { ...doc, status: newStatus } : doc));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  /* ============================================================
     Helpers
  ============================================================ */
  const avatarUrl = (doctor, size = 80) =>
    doctor.profile_img ||
    `https://ui-avatars.com/api/?name=${doctor.first_name}+${doctor.last_name}&background=0ea5e9&color=fff&size=${size}`;

  const statusColor = (s) => ({
    active: 'status-active',
    inactive: 'status-inactive',
    'on-leave': 'status-onleave',
    blocked: 'status-blocked',
  }[s] || 'status-inactive');

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
      <div className="doctors-header">
        <h2>Doctors Management</h2>
        <p>{doctors.length} doctor{doctors.length !== 1 ? 's' : ''} registered</p>
      </div>

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
            {doctors.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center" style={{ padding: '3rem', color: '#9ca3af' }}>
                  No doctors found. Add one to get started.
                </td>
              </tr>
            ) : (
              doctors.map(doctor => (
                <tr key={doctor._id}>
                  <td>
                    <div className="dl-doctor-cell">
                      <img
                        src={avatarUrl(doctor)}
                        alt={doctor.first_name}
                        className="dl-avatar"
                        onError={e => { e.target.src = avatarUrl(doctor); }}
                      />
                      <div>
                        <div className="dl-name">Dr. {doctor.first_name} {doctor.last_name}</div>
                        <div className="dl-exp">{doctor.experience_year} yrs exp</div>
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
                <img
                  src={avatarUrl(viewDoctor, 200)}
                  alt={viewDoctor.first_name}
                  className="dl-view-avatar"
                  onError={e => { e.target.src = avatarUrl(viewDoctor, 200); }}
                />
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
                  <DollarSign size={15} className="dl-view-icon" />
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
          UPDATE / EDIT MODAL
      ================================================================ */}
      {editDoctor && (
        <div className="dl-modal-overlay" onClick={closeEditModal}>
          <div className="dl-modal dl-modal-edit" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="dl-modal-header">
              <h3><Edit2 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Update Doctor</h3>
              <button className="dl-modal-close" onClick={closeEditModal}><X size={20} /></button>
            </div>

            <div className="dl-modal-body dl-edit-body">
              {/* --- Photo Section --- */}
              <div className="dl-edit-photo-section">
                <img
                  src={newImagePreview || avatarUrl(editDoctor, 200)}
                  alt="Preview"
                  className="dl-edit-avatar"
                  onError={e => { e.target.src = avatarUrl(editDoctor, 200); }}
                />
                <div className="dl-edit-photo-actions">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  <button
                    className="dl-btn dl-btn-image"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={14} /> {newImageFile ? 'Change Photo' : 'Change Photo'}
                  </button>
                  {newImageFile && (
                    <button
                      className="dl-btn dl-btn-save"
                      type="button"
                      onClick={handlePhotoUpload}
                      disabled={uploading}
                    >
                      {uploading ? <><Loader2 size={14} className="dl-spinner" /> Uploading...</> : <><Upload size={14} /> Save Photo</>}
                    </button>
                  )}
                </div>
                {uploadSuccess && <div className="dl-alert dl-alert-success"><CheckCircle size={14} /> {uploadSuccess}</div>}
                {uploadError && <div className="dl-alert dl-alert-error"><AlertCircle size={14} /> {uploadError}</div>}
              </div>

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
    </div>
  );
};

export default DoctorsList;
