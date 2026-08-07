import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle, AlertCircle, Loader2,
  Eye, Edit2, Phone, Mail, MapPin, Clock, Calendar,
  Award, ShieldCheck, Search, Users, UserCheck, UserX, UserMinus, ShieldAlert, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import './PharmacistsList.css';

const API = import.meta.env.VITE_URL || 'http://localhost:4000/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const STATUSES = ['active', 'inactive', 'on-leave', 'blocked'];

const PharmacistsList = () => {
  const [pharmacists, setPharmacists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ---- Search & Filter state ---- */
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  /* ---- Modal state ---- */
  const [viewPharmacist, setViewPharmacist] = useState(null);   // View modal
  const [editPharmacist, setEditPharmacist] = useState(null);   // Update modal

  /* ---- Edit form state ---- */
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError] = useState('');

  /* ============================================================
     Fetch
  ============================================================ */
  const fetchPharmacists = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch(`${API}/pharmacist/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setPharmacists(data.pharmacists || []);
      else setError(data.message || 'Failed to fetch pharmacists');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPharmacists(); }, []);

  /* ============================================================
     View Modal
  ============================================================ */
  const openViewModal = (pharmacist) => setViewPharmacist(pharmacist);
  const closeViewModal = () => setViewPharmacist(null);

  /* ============================================================
     Update (Edit) Modal
  ============================================================ */
  const openEditModal = (pharmacist) => {
    setEditPharmacist(pharmacist);
    setEditForm({
      first_name: pharmacist.first_name || '',
      last_name: pharmacist.last_name || '',
      email: pharmacist.email || '',
      phone: pharmacist.phone || '',
      pharmacy_name: pharmacist.pharmacy_name || '',
      qualification: pharmacist.qualification || '',
      license_no: pharmacist.license_no || '',
      address: pharmacist.address || '',
      work_time_start: pharmacist.work_time_start || '',
      work_time_end: pharmacist.work_time_end || '',
      working_days: pharmacist.working_days || [],
      status: pharmacist.status || 'active',
      is_verified: pharmacist.is_verified ?? false,
    });
    setEditSuccess('');
    setEditError('');
  };

  const closeEditModal = () => {
    setEditPharmacist(null);
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
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day]
    }));
  };

  /* ---- Status Pop Up Modal state ---- */
  const [statusPopup, setStatusPopup] = useState({ open: false, pharmacistName: '', oldStatus: '', newStatus: '' });

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditSuccess('');
    setEditError('');
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch(`${API}/admin/update-pharmacist-profile/${editPharmacist._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      const contentType = response.headers.get('content-type');
      let data = {};
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server endpoint error (${response.status}). Please restart the backend server.`);
      }

      if (response.ok) {
        const oldStatus = editPharmacist.status;
        const newStatus = editForm.status;
        const pharmacistName = `${editForm.first_name} ${editForm.last_name}`;

        setEditSuccess('Pharmacist updated successfully!');
        setPharmacists(prev => prev.map(p =>
          p._id === editPharmacist._id ? { ...p, ...editForm } : p
        ));
        setEditPharmacist(prev => ({ ...prev, ...editForm }));

        if (oldStatus !== newStatus) {
          setStatusPopup({ open: true, pharmacistName, oldStatus, newStatus });
        } else {
          toast.success(`${pharmacistName} updated successfully!`);
        }
      } else {
        setEditError(data.message || 'Update failed');
        toast.error(data.message || 'Update failed');
      }
    } catch (err) {
      setEditError(err.message);
      toast.error(err.message);
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
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch(`${API}/pharmacist/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });

      const contentType = response.headers.get('content-type');
      let data = {};
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        await response.text();
      }

      if (response.ok) {
        const ph = pharmacists.find(p => p._id === id);
        const pharmacistName = ph ? `${ph.first_name} ${ph.last_name}` : 'Pharmacist';
        setPharmacists(pharmacists.map(ph => ph._id === id ? { ...ph, status: newStatus } : ph));
        setStatusPopup({ open: true, pharmacistName, oldStatus: currentStatus, newStatus });
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ============================================================
     Avatar Helper (Initial letter when no custom photo)
  ============================================================ */
  const renderAvatar = (pharmacist, size = 44, fontSize = '16px') => {
    const initial = pharmacist?.first_name ? pharmacist.first_name.charAt(0).toUpperCase() : 'P';
    const hasCustomImg = pharmacist?.profile_img &&
      !pharmacist.profile_img.includes('placeholder') &&
      !pharmacist.profile_img.includes('ui-avatars.com');

    if (hasCustomImg) {
      return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <img
            src={pharmacist.profile_img}
            alt={pharmacist.first_name}
            className="ph-avatar"
            style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div
            className="ph-avatar-initial"
            style={{
              display: 'none',
              width: size,
              height: size,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #0d9488)',
              color: '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: fontSize,
              boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)'
            }}
          >
            {initial}
          </div>
        </div>
      );
    }

    return (
      <div
        className="ph-avatar-initial"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981, #0d9488)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: fontSize,
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)'
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
    all: pharmacists.length,
    active: pharmacists.filter(p => p.status === 'active').length,
    inactive: pharmacists.filter(p => p.status === 'inactive').length,
    'on-leave': pharmacists.filter(p => p.status === 'on-leave').length,
    blocked: pharmacists.filter(p => p.status === 'blocked').length,
    verified: pharmacists.filter(p => p.is_verified).length,
  };

  const filteredPharmacists = pharmacists.filter(ph => {
    const matchesStatus = selectedStatus === 'all'
      ? true
      : selectedStatus === 'verified'
        ? !!ph.is_verified
        : ph.status === selectedStatus;
    const name = `${ph.first_name || ''} ${ph.last_name || ''}`.toLowerCase();
    const email = (ph.email || '').toLowerCase();
    const pharmacy = (ph.pharmacy_name || '').toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || name.includes(q) || email.includes(q) || pharmacy.includes(q);
    return matchesStatus && matchesSearch;
  });

  /* ============================================================
     Render
  ============================================================ */
  if (loading) return (
    <div className="pharmacists-list-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <Loader2 size={32} className="ph-spinner" />
    </div>
  );
  if (error) return <div className="pharmacists-list-container"><div className="ph-error">Error: {error}</div></div>;

  return (
    <div className="pharmacists-list-container">
      {/* Header */}
      <div className="pharmacists-header">
        <div>
          <h2>Pharmacists Management</h2>
          <p>{pharmacists.length} total pharmacist{pharmacists.length !== 1 ? 's' : ''} registered in system</p>
        </div>
      </div>

      {/* Status Section (Filter Tabs with Counts) */}
      <div className="ph-status-cards">
        <button
          className={`ph-status-card ${selectedStatus === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('all')}
        >
          <div className="ph-status-card-icon ph-icon-all"><Users size={18} /></div>
          <div className="ph-status-card-info">
            <span className="ph-status-card-title">All Pharmacists</span>
            <span className="ph-status-card-count">{counts.all}</span>
          </div>
        </button>

        <button
          className={`ph-status-card ${selectedStatus === 'active' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('active')}
        >
          <div className="ph-status-card-icon ph-icon-active"><UserCheck size={18} /></div>
          <div className="ph-status-card-info">
            <span className="ph-status-card-title">Active</span>
            <span className="ph-status-card-count">{counts.active}</span>
          </div>
        </button>

        <button
          className={`ph-status-card ${selectedStatus === 'verified' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('verified')}
        >
          <div className="ph-status-card-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}><ShieldCheck size={18} /></div>
          <div className="ph-status-card-info">
            <span className="ph-status-card-title">Verified</span>
            <span className="ph-status-card-count">{counts.verified}</span>
          </div>
        </button>

        <button
          className={`ph-status-card ${selectedStatus === 'inactive' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('inactive')}
        >
          <div className="ph-status-card-icon ph-icon-inactive"><UserX size={18} /></div>
          <div className="ph-status-card-info">
            <span className="ph-status-card-title">Inactive</span>
            <span className="ph-status-card-count">{counts.inactive}</span>
          </div>
        </button>

        <button
          className={`ph-status-card ${selectedStatus === 'on-leave' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('on-leave')}
        >
          <div className="ph-status-card-icon ph-icon-onleave"><UserMinus size={18} /></div>
          <div className="ph-status-card-info">
            <span className="ph-status-card-title">On Leave</span>
            <span className="ph-status-card-count">{counts['on-leave']}</span>
          </div>
        </button>

        <button
          className={`ph-status-card ${selectedStatus === 'blocked' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('blocked')}
        >
          <div className="ph-status-card-icon ph-icon-blocked"><ShieldAlert size={18} /></div>
          <div className="ph-status-card-info">
            <span className="ph-status-card-title">Blocked</span>
            <span className="ph-status-card-count">{counts.blocked}</span>
          </div>
        </button>
      </div>

      {/* Search Bar */}
      <div className="ph-toolbar">
        <div className="ph-search-box">
          <Search size={18} className="ph-search-icon" />
          <input
            type="text"
            placeholder="Search pharmacist by name, email, or pharmacy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ph-search-input"
          />
          {searchQuery && (
            <button className="ph-search-clear" onClick={() => setSearchQuery('')} title="Clear search">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="ph-results-count">
          Showing {filteredPharmacists.length} of {pharmacists.length} pharmacists
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="pharmacists-table">
          <thead>
            <tr>
              <th>Pharmacist</th>
              <th>Email</th>
              <th>Pharmacy Name</th>
              <th>Qualification</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPharmacists.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center" style={{ padding: '3rem', color: '#9ca3af' }}>
                  No pharmacists found matching criteria.
                </td>
              </tr>
            ) : (
              filteredPharmacists.map(pharmacist => (
                <tr key={pharmacist._id}>
                  <td>
                    <div className="ph-pharmacist-cell">
                      {renderAvatar(pharmacist, 44, '16px')}
                      <div>
                        <div className="ph-name">{pharmacist.first_name} {pharmacist.last_name}</div>
                        <div className="ph-phone">{pharmacist.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="ph-email">{pharmacist.email}</td>
                  <td>{pharmacist.pharmacy_name}</td>
                  <td>{pharmacist.qualification || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${statusColor(pharmacist.status)}`}>
                      {pharmacist.status}
                    </span>
                  </td>
                  <td>
                    <div className="ph-actions">
                      {/* View */}
                      <button
                        className="ph-btn ph-btn-view"
                        onClick={() => openViewModal(pharmacist)}
                        title="View Pharmacist Details"
                      >
                        <Eye size={14} /> View
                      </button>
                      {/* Update */}
                      <button
                        className="ph-btn ph-btn-edit"
                        onClick={() => openEditModal(pharmacist)}
                        title="Update Pharmacist Info"
                      >
                        <Edit2 size={14} /> Update
                      </button>
                      {/* Quick status toggle */}
                      <button
                        className={`toggle-btn ${pharmacist.status === 'active' ? 'btn-suspend' : 'btn-activate'}`}
                        onClick={() => toggleStatus(pharmacist._id, pharmacist.status)}
                      >
                        {pharmacist.status === 'active' ? 'Suspend' : 'Activate'}
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
      {viewPharmacist && (
        <div className="ph-modal-overlay" onClick={closeViewModal}>
          <div className="ph-modal ph-modal-view" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="ph-modal-header ph-view-header">
              <h3>Pharmacist Profile</h3>
              <button className="ph-modal-close" onClick={closeViewModal}><X size={20} /></button>
            </div>

            <div className="ph-modal-body ph-view-body">
              {/* Avatar & basic */}
              <div className="ph-view-top">
                {renderAvatar(viewPharmacist, 72, '28px')}
                <div className="ph-view-title">
                  <h4>{viewPharmacist.first_name} {viewPharmacist.last_name}</h4>
                  <p className="ph-view-spec">{viewPharmacist.pharmacy_name}</p>
                  <span className={`status-badge ${statusColor(viewPharmacist.status)}`}>{viewPharmacist.status}</span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="ph-view-grid">
                <div className="ph-view-info-item">
                  <Mail size={15} className="ph-view-icon" />
                  <div>
                    <span className="ph-view-label">Email</span>
                    <span className="ph-view-value">{viewPharmacist.email}</span>
                  </div>
                </div>
                <div className="ph-view-info-item">
                  <Phone size={15} className="ph-view-icon" />
                  <div>
                    <span className="ph-view-label">Phone</span>
                    <span className="ph-view-value">{viewPharmacist.phone}</span>
                  </div>
                </div>
                <div className="ph-view-info-item">
                  <Building2 size={15} className="ph-view-icon" />
                  <div>
                    <span className="ph-view-label">Pharmacy Name</span>
                    <span className="ph-view-value">{viewPharmacist.pharmacy_name}</span>
                  </div>
                </div>
                <div className="ph-view-info-item">
                  <Award size={15} className="ph-view-icon" />
                  <div>
                    <span className="ph-view-label">Qualification</span>
                    <span className="ph-view-value">{viewPharmacist.qualification}</span>
                  </div>
                </div>
                <div className="ph-view-info-item">
                  <ShieldCheck size={15} className="ph-view-icon" />
                  <div>
                    <span className="ph-view-label">License No.</span>
                    <span className="ph-view-value">{viewPharmacist.license_no}</span>
                  </div>
                </div>
                <div className="ph-view-info-item">
                  <Clock size={15} className="ph-view-icon" />
                  <div>
                    <span className="ph-view-label">Working Hours</span>
                    <span className="ph-view-value">{viewPharmacist.work_time_start || '09:00 AM'} – {viewPharmacist.work_time_end || '06:00 PM'}</span>
                  </div>
                </div>
                <div className="ph-view-info-item ph-view-full">
                  <MapPin size={15} className="ph-view-icon" />
                  <div>
                    <span className="ph-view-label">Address</span>
                    <span className="ph-view-value">{viewPharmacist.address}</span>
                  </div>
                </div>
                <div className="ph-view-info-item ph-view-full">
                  <Clock size={15} className="ph-view-icon" />
                  <div>
                    <span className="ph-view-label">Last Login Date</span>
                    <span className="ph-view-value">
                      {viewPharmacist.last_login
                        ? new Date(viewPharmacist.last_login).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })
                        : 'Never logged in yet'}
                    </span>
                  </div>
                </div>
                <div className="ph-view-info-item ph-view-full">
                  <Calendar size={15} className="ph-view-icon" />
                  <div>
                    <span className="ph-view-label">Working Days</span>
                    <div className="ph-view-days">
                      {(viewPharmacist.working_days || []).map(d => (
                        <span key={d} className="ph-day-chip ph-day-chip--on">{d.slice(0,3)}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ph-modal-footer">
              <button className="ph-btn ph-btn-cancel" onClick={closeViewModal}>Close</button>
              <button className="ph-btn ph-btn-edit" onClick={() => { closeViewModal(); openEditModal(viewPharmacist); }}>
                <Edit2 size={14} /> Edit Pharmacist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          UPDATE / EDIT MODAL (Admin updates text details only)
      ================================================================ */}
      {editPharmacist && (
        <div className="ph-modal-overlay" onClick={closeEditModal}>
          <div className="ph-modal ph-modal-edit" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="ph-modal-header">
              <h3><Edit2 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Update Pharmacist Information</h3>
              <button className="ph-modal-close" onClick={closeEditModal}><X size={20} /></button>
            </div>

            <div className="ph-modal-body ph-edit-body">
              {/* --- Edit Form --- */}
              <form className="ph-edit-form" onSubmit={handleEditSubmit}>
                <div className="ph-form-grid">
                  <div className="ph-form-group">
                    <label>First Name</label>
                    <input name="first_name" value={editForm.first_name} onChange={handleEditChange} required />
                  </div>
                  <div className="ph-form-group">
                    <label>Last Name</label>
                    <input name="last_name" value={editForm.last_name} onChange={handleEditChange} required />
                  </div>
                  <div className="ph-form-group">
                    <label>Email</label>
                    <input name="email" type="email" value={editForm.email} onChange={handleEditChange} required />
                  </div>
                  <div className="ph-form-group">
                    <label>Phone</label>
                    <input name="phone" value={editForm.phone} onChange={handleEditChange} required />
                  </div>
                  <div className="ph-form-group">
                    <label>Pharmacy Name</label>
                    <input name="pharmacy_name" value={editForm.pharmacy_name} onChange={handleEditChange} required />
                  </div>
                  <div className="ph-form-group">
                    <label>Qualification</label>
                    <input name="qualification" value={editForm.qualification} onChange={handleEditChange} required />
                  </div>
                  <div className="ph-form-group">
                    <label>License No.</label>
                    <input name="license_no" value={editForm.license_no} onChange={handleEditChange} required />
                  </div>
                  <div className="ph-form-group">
                    <label>Status</label>
                    <select name="status" value={editForm.status} onChange={handleEditChange}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="ph-form-group">
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
                  <div className="ph-form-group">
                    <label>Work Start</label>
                    <input name="work_time_start" value={editForm.work_time_start} onChange={handleEditChange} placeholder="e.g. 09:00 AM" />
                  </div>
                  <div className="ph-form-group">
                    <label>Work End</label>
                    <input name="work_time_end" value={editForm.work_time_end} onChange={handleEditChange} placeholder="e.g. 06:00 PM" />
                  </div>
                  <div className="ph-form-group ph-form-full">
                    <label>Pharmacy Address</label>
                    <input name="address" value={editForm.address} onChange={handleEditChange} required />
                  </div>
                  <div className="ph-form-group ph-form-full">
                    <label>Working Days</label>
                    <div className="ph-days-picker">
                      {DAYS.map(day => (
                        <button
                          key={day}
                          type="button"
                          className={`ph-day-chip ${editForm.working_days?.includes(day) ? 'ph-day-chip--on' : ''}`}
                          onClick={() => toggleDay(day)}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {editSuccess && <div className="ph-alert ph-alert-success"><CheckCircle size={14} /> {editSuccess}</div>}
                {editError && <div className="ph-alert ph-alert-error"><AlertCircle size={14} /> {editError}</div>}

                <div className="ph-modal-footer ph-edit-footer">
                  <button type="button" className="ph-btn ph-btn-cancel" onClick={closeEditModal}>Cancel</button>
                  <button type="submit" className="ph-btn ph-btn-save" disabled={editLoading}>
                    {editLoading ? <><Loader2 size={14} className="ph-spinner" /> Saving...</> : <><CheckCircle size={14} /> Save Changes</>}
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
        <div className="ph-modal-overlay" onClick={() => setStatusPopup({ ...statusPopup, open: false })}>
          <div className="ph-modal" style={{ maxWidth: 440, padding: 24, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
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
              Status for <strong style={{ color: '#0f172a' }}>{statusPopup.pharmacistName}</strong> has been changed from{' '}
              <span style={{ textTransform: 'uppercase', fontWeight: 700, color: '#64748b' }}>{statusPopup.oldStatus}</span> to{' '}
              <span style={{
                textTransform: 'uppercase', fontWeight: 800,
                color: statusPopup.newStatus === 'active' ? '#16a34a' : statusPopup.newStatus === 'inactive' ? '#dc2626' : statusPopup.newStatus === 'on-leave' ? '#ca8a04' : '#475569'
              }}>{statusPopup.newStatus}</span>.
            </p>
            <button
              className="ph-btn ph-btn-save"
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

export default PharmacistsList;
