import React, { useState, useEffect } from 'react';
import {
  FileCheck, Clock, CheckCircle2, XCircle, Search, Eye, X,
  AlertCircle, Check, Loader2, Pill, AlertTriangle, User, Edit, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import './MedicineRequestsList.css';

import API_BASE_URL from '../config/api';

const API = API_BASE_URL;

const getToken = () => {
  let t = localStorage.getItem('token') || localStorage.getItem('adminToken') || '';
  if (!t) return '';
  t = t.trim();
  if (t.startsWith('Bearer ')) {
    t = t.substring(7).trim();
  }
  return t.replace(/^["']|["']$/g, '').trim();
};

const getPharmacistDetails = (req) => {
  if (!req.requested_by) return { name: 'Unknown', id: 'N/A', email: '', store: '' };
  if (typeof req.requested_by === 'object') {
    const fn = req.requested_by.first_name || '';
    const ln = req.requested_by.last_name || '';
    const fullName = `${fn} ${ln}`.trim();
    const id = req.requested_by._id || req.requested_by.id || 'N/A';
    return {
      name: fullName || id,
      id: id,
      email: req.requested_by.email || '',
      store: req.requested_by.pharmacy_name || ''
    };
  }
  return { name: req.requested_by, id: req.requested_by, email: '', store: '' };
};

const MedicineRequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* Filter and Search */
  const [statusFilter, setStatusFilter] = useState('Pending'); // 'All', 'Pending', 'Approved', 'Rejected', 'Cancelled'
  const [searchQuery, setSearchQuery] = useState('');

  /* Action States */
  const [actionLoading, setActionLoading] = useState(false);

  /* Approve Success Modal State */
  const [approveSuccessModal, setApproveSuccessModal] = useState({
    open: false, medicineName: '', stockQty: 0, category: ''
  });

  /* Rejection Modal State */
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingReq, setRejectingReq] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  /* View Details Modal State */
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);

  /* Edit Medicine Request Modal State (Admin) */
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReq, setEditingReq] = useState(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    medicine_name: '',
    generic_name: '',
    category: 'Tablet',
    manufacturer: '',
    strength: '',
    unit: 'Strip',
    price: '',
    stock_available: '',
    mfg_date: '',
    expiry_date: '',
    description: '',
    medicine_image: '',
    requires_prescription: false,
    status: 'Pending'
  });

  const fetchRequests = async (isPolling = false) => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await fetch(`${API}/med-req`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRequests(data.data || []);
      } else if (!isPolling) {
        setError(data.message || 'Failed to fetch medicine requests');
      }
    } catch (err) {
      if (!isPolling) setError(err.message || 'Error connecting to server');
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  /* ---- APPROVE (ACCEPT) MEDICINE REQUEST ---- */
  const handleApprove = async (reqItem) => {
    setActionLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${API}/med-req/approve/${reqItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setApproveSuccessModal({
          open: true,
          medicineName: reqItem.medicine_name,
          stockQty: reqItem.stock_available,
          category: reqItem.category
        });
        fetchRequests(); // Refresh requests
      } else {
        toast.error(data.message || 'Failed to approve medicine request');
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred while approving request');
    } finally {
      setActionLoading(false);
    }
  };

  /* ---- OPEN REJECTION MODAL ---- */
  const openRejectModal = (reqItem) => {
    setRejectingReq(reqItem);
    setRejectionReason('');
    setRejectError('');
    setShowRejectModal(true);
  };

  /* ---- SUBMIT REJECTION FORM ---- */
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setRejectError('Please enter a reason for rejecting this medicine request.');
      return;
    }

    setActionLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${API}/med-req/reject/${rejectingReq._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rejection_reason: rejectionReason.trim() })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`Medicine request for "${rejectingReq.medicine_name}" rejected.`);
        setShowRejectModal(false);
        setRejectingReq(null);
        setRejectionReason('');
        fetchRequests();
      } else {
        setRejectError(data.message || 'Failed to reject medicine request');
      }
    } catch (err) {
      setRejectError(err.message || 'An error occurred while rejecting request');
    } finally {
      setActionLoading(false);
    }
  };

  /* ---- EDIT / UPDATE MEDICINE REQUEST (ADMIN) ---- */
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size should be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm(prev => ({ ...prev, medicine_image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const openEditModal = (req) => {
    setEditingReq(req);
    setEditForm({
      medicine_name: req.medicine_name || '',
      generic_name: req.generic_name || '',
      category: req.category || 'Tablet',
      manufacturer: req.manufacturer || '',
      strength: req.strength || '',
      unit: req.unit || 'Strip',
      price: req.price !== undefined ? req.price : '',
      stock_available: req.stock_available !== undefined ? req.stock_available : '',
      mfg_date: req.mfg_date ? new Date(req.mfg_date).toISOString().split('T')[0] : '',
      expiry_date: req.expiry_date ? new Date(req.expiry_date).toISOString().split('T')[0] : '',
      description: req.description || '',
      medicine_image: req.medicine_image || '',
      requires_prescription: req.requires_prescription || false,
      status: req.status || 'Pending'
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingReq) return;
    setSubmittingEdit(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/med-req/update/${editingReq._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editForm,
          price: Number(editForm.price),
          stock_available: Number(editForm.stock_available)
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Medicine request for "${editForm.medicine_name}" updated successfully!`);
        setShowEditModal(false);
        setEditingReq(null);
        fetchRequests();
      } else {
        toast.error(data.message || data.error || 'Failed to update medicine request');
      }
    } catch (err) {
      toast.error(err.message || 'Server error updating medicine request');
    } finally {
      setSubmittingEdit(false);
    }
  };

  /* ---- Dynamic Filter Logic ---- */
  const filteredRequests = requests.filter(req => {
    const matchesStatus = statusFilter === 'All' ? true : (req.status || '').toLowerCase() === statusFilter.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const name = (req.medicine_name || '').toLowerCase();
    const generic = (req.generic_name || '').toLowerCase();
    const cat = (req.category || '').toLowerCase();
    const mfg = (req.manufacturer || '').toLowerCase();
    const phDetails = getPharmacistDetails(req);
    const phName = phDetails.name.toLowerCase();

    const matchesSearch = !q || name.includes(q) || generic.includes(q) || cat.includes(q) || mfg.includes(q) || phName.includes(q);
    return matchesStatus && matchesSearch;
  });

  const countPending = requests.filter(r => (r.status || '').toLowerCase() === 'pending').length;
  const countApproved = requests.filter(r => (r.status || '').toLowerCase() === 'approved').length;
  const countRejected = requests.filter(r => (r.status || '').toLowerCase() === 'rejected').length;
  const countCancelled = requests.filter(r => (r.status || '').toLowerCase() === 'cancelled').length;

  if (loading) return (
    <div className="mr-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <Loader2 size={32} className="mr-spinner" />
    </div>
  );

  return (
    <div className="mr-container">
      {/* Header Section */}
      <div className="mr-header">
        <div>
          <h2>Pharmacist Medicine Requests</h2>
          <p>Review and accept or reject medicine stock addition requests submitted by pharmacists</p>
        </div>
      </div>

      {/* Summary Filter Cards */}
      <div className="mr-summary-cards">
        <button
          className={`mr-card ${statusFilter === 'All' ? 'active' : ''}`}
          onClick={() => setStatusFilter('All')}
        >
          <div className="mr-card-title">All Requests</div>
          <div className="mr-card-count" style={{ color: '#0f172a' }}>{requests.length}</div>
        </button>

        <button
          className={`mr-card ${statusFilter === 'Pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('Pending')}
        >
          <div className="mr-card-title" style={{ color: '#d97706' }}>Pending Approval</div>
          <div className="mr-card-count" style={{ color: '#d97706' }}>{countPending}</div>
        </button>

        <button
          className={`mr-card ${statusFilter === 'Approved' ? 'active' : ''}`}
          onClick={() => setStatusFilter('Approved')}
        >
          <div className="mr-card-title" style={{ color: '#16a34a' }}>Approved</div>
          <div className="mr-card-count" style={{ color: '#16a34a' }}>{countApproved}</div>
        </button>

        <button
          className={`mr-card ${statusFilter === 'Rejected' ? 'active' : ''}`}
          onClick={() => setStatusFilter('Rejected')}
        >
          <div className="mr-card-title" style={{ color: '#dc2626' }}>Rejected</div>
          <div className="mr-card-count" style={{ color: '#dc2626' }}>{countRejected}</div>
        </button>

        <button
          className={`mr-card ${statusFilter === 'Cancelled' ? 'active' : ''}`}
          onClick={() => setStatusFilter('Cancelled')}
        >
          <div className="mr-card-title" style={{ color: '#64748b' }}>Cancelled</div>
          <div className="mr-card-count" style={{ color: '#64748b' }}>{countCancelled}</div>
        </button>
      </div>

      {/* Toolbar / Search */}
      <div className="mr-toolbar">
        <div className="mr-search-box">
          <Search size={18} className="mr-search-icon" />
          <input
            type="text"
            placeholder="Search medicine, category, or pharmacist name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mr-search-input"
          />
          {searchQuery && (
            <button className="mr-search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Requests Table */}
      <div className="mr-table-wrapper">
        <table className="mr-table">
          <thead>
            <tr>
              <th>Medicine Details</th>
              <th>Requested By</th>
              <th>Category / Specs</th>
              <th>Qty & Price</th>
              <th>Status</th>
              <th>Request Time</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No medicine requests found for the selected filter.
                </td>
              </tr>
            ) : (
              filteredRequests.map(req => {
                const status = req.status || 'Pending';
                const isPending = status.toLowerCase() === 'pending';
                const isApproved = status.toLowerCase() === 'approved';
                const isRejected = status.toLowerCase() === 'rejected';
                const phInfo = getPharmacistDetails(req);

                return (
                  <tr key={req._id}>
                    <td>
                      <div className="mr-medicine-cell">
                        <img
                          src={req.medicine_image || '/img/medicine_bottle.png'}
                          alt={req.medicine_name}
                          className="mr-avatar"
                          onError={e => { e.target.src = '/img/medicine_bottle.png'; }}
                        />
                        <div>
                          <div className="mr-name">{req.medicine_name}</div>
                          <div className="mr-desc">{req.generic_name || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="mr-ph-cell">
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                          {phInfo.name}
                        </div>
                        {phInfo.store && (
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {phInfo.store}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="mr-cat-badge">{req.category}</span>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                        {req.strength} / {req.unit}
                      </div>
                    </td>
                    <td>
                      <div>Qty: <strong>{req.stock_available}</strong></div>
                      <div style={{ color: '#059669', fontWeight: 700, fontSize: '0.85rem' }}>₹{req.price}</div>
                    </td>
                    <td>
                      {isApproved && (
                        <span className="mr-badge mr-badge-approved">
                          <CheckCircle2 size={13} /> Approved
                        </span>
                      )}
                      {isRejected && (
                        <span className="mr-badge mr-badge-rejected" title={req.rejection_reason || 'Rejected by Admin'}>
                          <XCircle size={13} /> Rejected
                        </span>
                      )}
                      {isPending && (
                        <span className="mr-badge mr-badge-pending">
                          <Clock size={13} /> Pending
                        </span>
                      )}
                      {status.toLowerCase() === 'cancelled' && (
                        <span className="mr-badge mr-badge-cancelled">
                          Cancelled
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                        {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(req.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <div className="mr-action-buttons">
                        <button
                          className="mr-btn mr-btn-view"
                          onClick={() => { setSelectedReq(req); setShowViewModal(true); }}
                          title="View Details"
                        >
                          <Eye size={15} /> View Specs
                        </button>

                        {isApproved && (
                          <button
                            className="mr-btn mr-btn-edit"
                            onClick={() => openEditModal(req)}
                            style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', borderRadius: 6, padding: '4px 10px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                            title="Update Approved Medicine Request Specs & Stock Image"
                          >
                            <Edit size={14} /> Update Specs
                          </button>
                        )}

                        {isPending && (
                          <>
                            <button
                              className="mr-btn mr-btn-approve"
                              onClick={() => handleApprove(req)}
                              disabled={actionLoading}
                            >
                              <Check size={15} /> Accept
                            </button>
                            <button
                              className="mr-btn mr-btn-reject"
                              onClick={() => openRejectModal(req)}
                              disabled={actionLoading}
                            >
                              <X size={15} /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================================================================
          SUCCESS MESSAGE BOX POPUP MODAL (ON ACCEPTING MEDICINE)
      ================================================================ */}
      {approveSuccessModal.open && (
        <div className="mr-modal-overlay" onClick={() => setApproveSuccessModal({ open: false, medicineName: '', stockQty: 0, category: '' })}>
          <div className="mr-modal" style={{ textAlign: 'center', padding: '32px 28px', maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: '#16a34a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.2)'
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>Medicine Request Approved!</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 24px' }}>
              <strong style={{ color: '#0f172a' }}>{approveSuccessModal.medicineName}</strong> ({approveSuccessModal.category}) has been accepted and automatically added to the pharmacy inventory with <strong style={{ color: '#16a34a' }}>{approveSuccessModal.stockQty} units</strong> stock.
            </p>
            <button
              type="button"
              className="mr-btn mr-btn-approve"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem', fontWeight: 700, borderRadius: 12 }}
              onClick={() => setApproveSuccessModal({ open: false, medicineName: '', stockQty: 0, category: '' })}
            >
              OK, Great!
            </button>
          </div>
        </div>
      )}

      {/* ================================================================
          REJECTION REASON MODAL FORM
      ================================================================ */}
      {showRejectModal && rejectingReq && (
        <div className="mr-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="mr-modal" onClick={e => e.stopPropagation()}>
            <div className="mr-modal-header">
              <h3><AlertTriangle size={20} color="#dc2626" /> Reject Medicine Request</h3>
              <button className="mr-modal-close" onClick={() => setShowRejectModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleRejectSubmit} className="mr-modal-body">
              <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '16px', lineHeight: 1.5 }}>
                You are rejecting the medicine request for <strong style={{ color: '#0f172a' }}>{rejectingReq.medicine_name}</strong>.
                Please state the reason for rejection below. The pharmacist will see this reason on their dashboard.
              </p>

              {rejectError && (
                <div className="mr-alert-error" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={16} /> {rejectError}
                </div>
              )}

              <div className="mr-form-group">
                <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                  Reason for Rejection <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (rejectError) setRejectError('');
                  }}
                  placeholder="e.g. Medicine already exists under different manufacturer, invalid pricing, or duplicate request."
                  required
                  style={{
                    width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit'
                  }}
                />
              </div>

              <div className="mr-modal-footer">
                <button
                  type="button"
                  className="mr-btn-cancel"
                  onClick={() => setShowRejectModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mr-btn-submit-reject"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 size={16} className="mr-spinner" /> Processing...
                    </>
                  ) : (
                    <>
                      <XCircle size={16} /> Confirm Rejection
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================
          VIEW DETAILS MODAL
      ================================================================ */}
      {showViewModal && selectedReq && (
        <div className="mr-modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="mr-modal mr-modal-view" onClick={e => e.stopPropagation()}>
            <div className="mr-modal-header">
              <h3><Pill size={20} color="#3b82f6" /> Medicine Request Details</h3>
              <button className="mr-modal-close" onClick={() => setShowViewModal(false)}><X size={20} /></button>
            </div>

            <div className="mr-modal-body">
              <div className="mr-view-top" style={{ display: 'flex', gap: 16, alignItems: 'center', background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <img
                  src={selectedReq.medicine_image || '/img/medicine_bottle.png'}
                  alt={selectedReq.medicine_name}
                  style={{ width: 68, height: 68, borderRadius: 12, objectFit: 'cover', border: '1px solid #cbd5e1', background: '#fff' }}
                  onError={e => { e.target.src = '/img/medicine_bottle.png'; }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>{selectedReq.medicine_name}</h4>
                  <p style={{ margin: '2px 0 6px', color: '#64748b', fontSize: '0.85rem' }}>{selectedReq.generic_name || 'Generic N/A'}</p>
                  <span className={`mr-badge mr-badge-${(selectedReq.status || 'pending').toLowerCase()}`}>
                    {selectedReq.status}
                  </span>
                </div>
              </div>

              {/* Pharmacist Request Info Box */}
              <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 10, padding: 14, margin: '16px 0', fontSize: '0.85rem' }}>
                <strong style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '0.9rem' }}>
                  <User size={16} color="#3b82f6" /> Requested By Pharmacist:
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', color: '#334155' }}>
                  <div><strong>Pharmacist ID:</strong> {getPharmacistDetails(selectedReq).id}</div>
                  {getPharmacistDetails(selectedReq).store && (
                    <div><strong>Pharmacy Name:</strong> {getPharmacistDetails(selectedReq).store}</div>
                  )}
                  {getPharmacistDetails(selectedReq).email && (
                    <div><strong>Email:</strong> {getPharmacistDetails(selectedReq).email}</div>
                  )}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 8, borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
                  <strong>Request Date & Time:</strong> {new Date(selectedReq.createdAt).toLocaleString()}
                </div>
              </div>

              {selectedReq.status === 'Rejected' && selectedReq.rejection_reason && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 12, margin: '16px 0', color: '#991b1b', fontSize: '0.85rem' }}>
                  <strong>Rejection Reason:</strong> {selectedReq.rejection_reason}
                </div>
              )}

              {selectedReq.status === 'Cancelled' && (
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: 12, margin: '16px 0', color: '#475569', fontSize: '0.85rem' }}>
                  <strong style={{ color: '#0f172a' }}>Cancellation Reason:</strong> {selectedReq.cancellation_reason || 'Cancelled by pharmacist'}
                  {selectedReq.cancelled_at && (
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
                      Cancelled On: {new Date(selectedReq.cancelled_at).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              <div className="mr-view-grid" style={{ marginTop: 16 }}>
                <div><strong>Category:</strong> {selectedReq.category}</div>
                <div><strong>Manufacturer:</strong> {selectedReq.manufacturer}</div>
                <div><strong>Strength:</strong> {selectedReq.strength}</div>
                <div><strong>Unit:</strong> {selectedReq.unit}</div>
                <div><strong>Price per Unit:</strong> ₹{selectedReq.price}</div>
                <div><strong>Stock Requested:</strong> {selectedReq.stock_available} units</div>
                <div><strong>Mfg Date:</strong> {selectedReq.mfg_date ? new Date(selectedReq.mfg_date).toLocaleDateString() : 'N/A'}</div>
                <div><strong>Expiry Date:</strong> {selectedReq.expiry_date ? new Date(selectedReq.expiry_date).toLocaleDateString() : 'N/A'}</div>
                <div><strong>Requires Prescription:</strong> {selectedReq.requires_prescription ? 'Yes ✓' : 'No'}</div>
                <div><strong>Stock Image:</strong> {selectedReq.medicine_image ? <span style={{ color: '#0369a1', fontWeight: 600 }}>Custom Image Attached ✓</span> : <span style={{ color: '#94a3b8' }}>Default Image</span>}</div>
              </div>

              {selectedReq.description && (
                <div style={{ marginTop: 16 }}>
                  <strong>Description / Instructions:</strong>
                  <p style={{ background: '#f8fafc', padding: 10, borderRadius: 8, marginTop: 4, color: '#334155', fontSize: '0.85rem' }}>
                    {selectedReq.description}
                  </p>
                </div>
              )}

              <div className="mr-modal-footer" style={{ marginTop: 20 }}>
                <button className="mr-btn-cancel" onClick={() => setShowViewModal(false)}>Close</button>
                {selectedReq.status === 'Approved' && (
                  <button
                    className="mr-btn mr-btn-edit"
                    onClick={() => { const r = selectedReq; setShowViewModal(false); openEditModal(r); }}
                    style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', borderRadius: 6, padding: '8px 14px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  >
                    <Edit size={16} /> Update Request Specs
                  </button>
                )}
                {selectedReq.status === 'Pending' && (
                  <>
                    <button className="mr-btn mr-btn-approve" onClick={() => { setShowViewModal(false); handleApprove(selectedReq); }}>
                      <Check size={16} /> Accept Request
                    </button>
                    <button className="mr-btn mr-btn-reject" onClick={() => { setShowViewModal(false); openRejectModal(selectedReq); }}>
                      <X size={16} /> Reject Request
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          EDIT / UPDATE MEDICINE REQUEST MODAL (ADMIN)
      ================================================================ */}
      {showEditModal && editingReq && (
        <div className="mr-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="mr-modal" style={{ maxWidth: 680, width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="mr-modal-header">
              <h3><Edit size={20} color="#0369a1" /> Update Medicine Request (Admin)</h3>
              <button className="mr-modal-close" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="mr-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', maxHeight: 'calc(88vh - 130px)', paddingRight: 6 }}>
              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
                Update medicine details, pricing, stock quantities, and image for request <strong style={{ color: '#0f172a' }}>#{editingReq._id}</strong> ({editingReq.medicine_name}).
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.medicine_name}
                    onChange={e => setEditForm({ ...editForm, medicine_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Generic Name</label>
                  <input
                    type="text"
                    value={editForm.generic_name}
                    onChange={e => setEditForm({ ...editForm, generic_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Category *</label>
                  <select
                    value={editForm.category}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Cream">Cream</option>
                    <option value="Drops">Drops</option>
                    <option value="Powder">Powder</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Manufacturer *</label>
                  <input
                    type="text"
                    required
                    value={editForm.manufacturer}
                    onChange={e => setEditForm({ ...editForm, manufacturer: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Strength *</label>
                  <input
                    type="text"
                    required
                    value={editForm.strength}
                    onChange={e => setEditForm({ ...editForm, strength: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Unit *</label>
                  <select
                    value={editForm.unit}
                    onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    <option value="Strip">Strip</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Ampoule">Ampoule</option>
                    <option value="Vial">Vial</option>
                    <option value="Tin">Tin</option>
                    <option value="Box">Box</option>
                    <option value="Tube">Tube</option>
                    <option value="Piece">Piece</option>
                    <option value="Packet">Packet</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Price (₹) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={editForm.price}
                    onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Quantity / Stock Available *</label>
                  <input
                    type="number"
                    required
                    value={editForm.stock_available}
                    onChange={e => setEditForm({ ...editForm, stock_available: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>MFG Date *</label>
                  <input
                    type="date"
                    required
                    value={editForm.mfg_date}
                    onChange={e => setEditForm({ ...editForm, mfg_date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={editForm.expiry_date}
                    onChange={e => setEditForm({ ...editForm, expiry_date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Medicine / Stock Image</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Paste Image URL or select image file below..."
                    value={editForm.medicine_image || ''}
                    onChange={e => setEditForm({ ...editForm, medicine_image: e.target.value })}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: '#0284c7',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}>
                    <Upload size={14} /> Upload Image File
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                {editForm.medicine_image && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={editForm.medicine_image}
                      alt="Preview"
                      style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid #cbd5e1' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, medicine_image: '' })}
                      style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="adminEditRx"
                  checked={editForm.requires_prescription}
                  onChange={e => setEditForm({ ...editForm, requires_prescription: e.target.checked })}
                  style={{ width: 18, height: 18 }}
                />
                <label htmlFor="adminEditRx" style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>
                  Requires Prescription (Rx)
                </label>
              </div>

              <div className="mr-modal-footer" style={{ marginTop: 16 }}>
                <button type="button" className="mr-btn-cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="mr-btn mr-btn-approve" disabled={submittingEdit}>
                  {submittingEdit ? <Loader2 size={16} className="mr-spinner" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineRequestsList;
