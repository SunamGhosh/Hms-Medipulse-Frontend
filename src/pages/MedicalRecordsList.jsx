import React, { useState, useEffect } from 'react';
import { Search, FileText, AlertTriangle, Archive, RotateCcw, CheckCircle, Clock } from 'lucide-react';
import './MedicalRecordsList.css';

const MedicalRecordsList = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_URL}/med-rec/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setRecords(data.data || data.records || data || []);
      } else {
        setError(data.message || 'Failed to fetch medical records');
      }
    } catch (err) {
      setError('Connection error. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleArchive = async (recordId) => {
    if (!window.confirm('Archive this medical record?')) return;
    setActionLoading(recordId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_URL}/med-rec/${recordId}/archive`,
        { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      if (response.ok) {
        setRecords(prev =>
          prev.map(r => r._id === recordId ? { ...r, record_status: 'Archived' } : r)
        );
      } else {
        alert(data.message || 'Archive failed');
      }
    } catch (err) {
      alert('Connection error.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (recordId) => {
    setActionLoading(recordId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_URL}/med-rec/${recordId}/restore`,
        { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      if (response.ok) {
        setRecords(prev =>
          prev.map(r => r._id === recordId ? { ...r, record_status: 'Active' } : r)
        );
      } else {
        alert(data.message || 'Restore failed');
      }
    } catch (err) {
      alert('Connection error.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch =
      r._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.patient_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.doctor_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.record_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalActive = records.filter(r => r.record_status === 'Active').length;
  const totalArchived = records.filter(r => r.record_status === 'Archived').length;

  return (
    <div className="medical-records-container">
      <div className="medical-records-header">
        <div>
          <h2>Medical Records</h2>
          <p>View and manage all patient medical records system-wide.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card total">
          <div className="stat-num">{records.length}</div>
          <div className="stat-label">Total Records</div>
        </div>
        <div className="stat-card active-stat">
          <div className="stat-num">{totalActive}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card archived-stat">
          <div className="stat-num">{totalArchived}</div>
          <div className="stat-label">Archived</div>
        </div>
      </div>

      <div className="records-table-controls">
        <div className="records-search-box">
          <Search className="records-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search by ID, patient, doctor, diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Archived">Archived</option>
          </select>
          <span style={{ color: '#64748b', fontSize: '14px' }}>
            {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="records-table-wrapper">
        {loading ? (
          <div className="records-loading-state">
            <div className="records-spinner" />
            <p>Loading medical records...</p>
          </div>
        ) : error ? (
          <div className="records-error-state">
            <AlertTriangle size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
            <p>{error}</p>
          </div>
        ) : (
          <table className="records-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Patient ID</th>
                <th>Doctor ID</th>
                <th>Appointment ID</th>
                <th>Diagnosis</th>
                <th>Visit Date</th>
                <th>Follow-up</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8', padding: '48px' }}>
                    No medical records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record._id}>
                    <td className="record-id-cell">
                      <FileText size={12} style={{ display: 'inline', marginRight: '5px', color: '#3b82f6' }} />
                      {record._id}
                    </td>
                    <td className="record-id-cell">{record.patient_id}</td>
                    <td className="record-id-cell">{record.doctor_id}</td>
                    <td className="record-id-cell">{record.appointment_id}</td>
                    <td>
                      <div className="diagnosis-cell" title={record.diagnosis}>
                        {record.diagnosis}
                      </div>
                    </td>
                    <td style={{ fontSize: '13px' }}>{formatDate(record.visit_date)}</td>
                    <td style={{ fontSize: '13px', color: record.follow_up_date ? '#f97316' : '#94a3b8' }}>
                      {record.follow_up_date ? (
                        <><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />{formatDate(record.follow_up_date)}</>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`record-status-badge ${record.record_status}`}>
                        {record.record_status === 'Active'
                          ? <><CheckCircle size={12} /> Active</>
                          : <><Archive size={12} /> Archived</>}
                      </span>
                    </td>
                    <td>
                      <div className="record-action-buttons">
                        {record.record_status === 'Active' ? (
                          <button
                            className="btn-archive"
                            onClick={() => handleArchive(record._id)}
                            disabled={actionLoading === record._id}
                          >
                            {actionLoading === record._id ? '...' : (
                              <><Archive size={12} style={{ display: 'inline', marginRight: '4px' }} />Archive</>
                            )}
                          </button>
                        ) : (
                          <button
                            className="btn-restore"
                            onClick={() => handleRestore(record._id)}
                            disabled={actionLoading === record._id}
                          >
                            {actionLoading === record._id ? '...' : (
                              <><RotateCcw size={12} style={{ display: 'inline', marginRight: '4px' }} />Restore</>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MedicalRecordsList;
