import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import './DoctorsList.css';

const API = import.meta.env.VITE_URL || 'http://localhost:4000/api';

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Update image modal state
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/doctor/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setDoctors(data.doctors);
      } else {
        setError(data.message || 'Failed to fetch doctors');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const openUpdateModal = (doctor) => {
    setSelectedDoctor(doctor);
    setNewImageFile(null);
    setNewImagePreview(null);
    setUploadSuccess('');
    setUploadError('');
  };

  const closeModal = () => {
    setSelectedDoctor(null);
    setNewImageFile(null);
    setNewImagePreview(null);
    setUploadSuccess('');
    setUploadError('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB.');
      return;
    }
    setUploadError('');
    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!newImageFile || !selectedDoctor) return;
    setUploading(true);
    setUploadSuccess('');
    setUploadError('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profile_img', newImageFile);

      const response = await fetch(`${API}/admin/update-doctor-profile/${selectedDoctor._id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        setUploadSuccess('Profile image updated successfully!');
        // Update doctor in list
        setDoctors(prev => prev.map(d =>
          d._id === selectedDoctor._id ? { ...d, profile_img: data.doctor.profile_img } : d
        ));
        setSelectedDoctor(prev => ({ ...prev, profile_img: data.doctor.profile_img }));
      } else {
        setUploadError(data.message || 'Upload failed');
      }
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/update-doctor-profile/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setDoctors(doctors.map(doc => doc._id === id ? { ...doc, status: newStatus } : doc));
      }
    } catch (err) {
      alert(err.message);
    }
  };

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
                        src={doctor.profile_img || `https://ui-avatars.com/api/?name=${doctor.first_name}+${doctor.last_name}&background=0ea5e9&color=fff`}
                        alt={doctor.first_name}
                        className="dl-avatar"
                        onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${doctor.first_name}+${doctor.last_name}&background=0ea5e9&color=fff`; }}
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
                    <span className={`status-badge ${doctor.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                      {doctor.status}
                    </span>
                  </td>
                  <td>
                    <div className="dl-actions">
                      <button
                        className="dl-btn dl-btn-image"
                        onClick={() => openUpdateModal(doctor)}
                        title="Update Profile Image"
                      >
                        <Camera size={14} />
                        Update Photo
                      </button>
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

      {/* Update Image Modal */}
      {selectedDoctor && (
        <div className="dl-modal-overlay" onClick={closeModal}>
          <div className="dl-modal" onClick={e => e.stopPropagation()}>
            <div className="dl-modal-header">
              <h3>Update Profile Photo</h3>
              <button className="dl-modal-close" onClick={closeModal}><X size={20} /></button>
            </div>

            <div className="dl-modal-body">
              <div className="dl-preview-area">
                <img
                  src={newImagePreview || selectedDoctor.profile_img || `https://ui-avatars.com/api/?name=${selectedDoctor.first_name}+${selectedDoctor.last_name}&background=0ea5e9&color=fff&size=200`}
                  alt="Preview"
                  className="dl-preview-img"
                  onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${selectedDoctor.first_name}+${selectedDoctor.last_name}&background=0ea5e9&color=fff&size=200`; }}
                />
                <div className="dl-preview-name">Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}</div>
                <div className="dl-preview-spec">{selectedDoctor.specialization}</div>
              </div>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              <button
                className="dl-upload-area"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <Upload size={28} />
                <span>{newImageFile ? newImageFile.name : 'Click to select an image'}</span>
                <small>PNG, JPG, WEBP — max 5MB</small>
              </button>

              {uploadSuccess && (
                <div className="dl-alert dl-alert-success">
                  <CheckCircle size={16} /> {uploadSuccess}
                </div>
              )}
              {uploadError && (
                <div className="dl-alert dl-alert-error">
                  <AlertCircle size={16} /> {uploadError}
                </div>
              )}
            </div>

            <div className="dl-modal-footer">
              <button className="dl-btn dl-btn-cancel" onClick={closeModal}>Cancel</button>
              <button
                className="dl-btn dl-btn-save"
                onClick={handleUpload}
                disabled={!newImageFile || uploading}
              >
                {uploading ? <><Loader2 size={16} className="dl-spinner" /> Uploading...</> : <><Upload size={16} /> Save Photo</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsList;
