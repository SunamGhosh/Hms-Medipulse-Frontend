import React, { useState, useEffect } from 'react';
import {
  ChevronDown, ChevronRight, Users, User, CheckCircle, AlertCircle,
  Loader2, Search, Phone, MapPin, Droplets, Heart, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import './PatientsList.css';

const API = import.meta.env.VITE_URL || 'http://localhost:5000';

const genderColor = { male: '#3b82f6', female: '#ec4899', other: '#8b5cf6' };

const PatientRow = ({ patient, idx }) => (
  <tr className="pl-patient-row">
    <td className="pl-pat-idx">{idx + 1}</td>
    <td>
      <div className="pl-pat-cell">
        <div className="pl-pat-avatar" style={{ background: genderColor[patient.gender] || '#14b8a6' }}>
          {patient.first_name?.[0]}{patient.last_name?.[0]}
        </div>
        <div>
          <div className="pl-pat-name">{patient.first_name} {patient.last_name}</div>
          <div className="pl-pat-relation">{patient.relationship_to_user}</div>
        </div>
      </div>
    </td>
    <td>
      <div className="pl-pat-detail-row">
        <Calendar size={12} className="pl-icon-muted" />
        {patient.dob ? new Date(patient.dob).toLocaleDateString('en-IN') : 'N/A'}
      </div>
    </td>
    <td>
      <span className="pl-gender-badge" style={{ background: genderColor[patient.gender] + '20', color: genderColor[patient.gender] || '#14b8a6' }}>
        {patient.gender}
      </span>
    </td>
    <td>
      <div className="pl-pat-detail-row">
        <Droplets size={12} className="pl-icon-muted" />
        <span className="pl-blood-badge">{patient.blood_group || 'N/A'}</span>
      </div>
    </td>
    <td>
      <div className="pl-pat-detail-row">
        <Phone size={12} className="pl-icon-muted" />
        {patient.phone || 'N/A'}
      </div>
    </td>
    <td>
      <div className="pl-pat-detail-row" title={patient.address}>
        <MapPin size={12} className="pl-icon-muted" />
        <span className="pl-address-text">
          {[patient.address, patient.city, patient.state].filter(Boolean).join(', ') || 'N/A'}
        </span>
      </div>
    </td>
    <td>
      <span className={`pl-status-badge ${patient.status === 'active' ? 'pl-status-active' : 'pl-status-inactive'}`}>
        {patient.status || 'active'}
      </span>
    </td>
  </tr>
);

const UserBlock = ({ userData, search }) => {
  const [expanded, setExpanded] = useState(userData.patients.length > 0);

  const filteredPatients = userData.patients.filter(p => {
    const q = search.toLowerCase();
    return (
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q) ||
      (p.blood_group || '').toLowerCase().includes(q)
    );
  });

  if (search && filteredPatients.length === 0) return null;

  const avatarUrl = userData.profile_img ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.first_name + ' ' + userData.last_name)}&background=0d9488&color=fff&size=80`;

  return (
    <div className={`pl-user-block ${userData.patients.length === 0 ? 'pl-user-block-empty' : ''} ${expanded ? 'expanded' : ''}`}>
      {/* User header row */}
      <div className="pl-user-header" onClick={() => setExpanded(v => !v)}>
        <div className="pl-user-left">
          <button className="pl-expand-btn">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <img src={avatarUrl} alt={userData.first_name} className="pl-user-avatar"
            onError={e => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${userData.first_name}&background=0d9488&color=fff&size=80`; }} />
          <div className="pl-user-info">
            <div className="pl-user-name">
              {userData.first_name} {userData.last_name}
              {userData.is_verified && (
                <span className="pl-verified-chip"><CheckCircle size={11} /> Verified</span>
              )}
            </div>
            <div className="pl-user-email">{userData.email}</div>
          </div>
        </div>
        <div className="pl-user-right">
          <div className="pl-patient-count-badge">
            <User size={13} />
            {userData.patients.length} patient{userData.patients.length !== 1 ? 's' : ''}
          </div>
          <span className={`pl-user-status-badge ${userData.status === 'active' ? 'pl-s-active' : userData.status === 'blocked' ? 'pl-s-blocked' : 'pl-s-inactive'}`}>
            {userData.status || 'inactive'}
          </span>
        </div>
      </div>

      {/* Patients sub-table */}
      {expanded && (
        <div className="pl-patients-sub">
          {filteredPatients.length === 0 ? (
            <div className="pl-no-patients">
              <Heart size={16} style={{ opacity: 0.3 }} /> No patients added yet
            </div>
          ) : (
            <table className="pl-patient-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Patient Name</th>
                  <th>Date of Birth</th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p, i) => (
                  <PatientRow key={p._id} patient={p} idx={i} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

const PatientsList = () => {
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [onlyWithPatients, setOnlyWithPatients] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/user/all-with-patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setUsersData(data.users || []);
      } else {
        setError(data.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalPatients = usersData.reduce((sum, u) => sum + (u.patients?.length || 0), 0);
  const usersWithPatients = usersData.filter(u => u.patients?.length > 0).length;

  const filteredUsers = usersData.filter(u => {
    const q = userSearch.toLowerCase();
    const matchesSearch = (
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
    const matchesFilter = onlyWithPatients ? u.patients?.length > 0 : true;
    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <div className="pl-loading-state">
      <Loader2 size={36} className="pl-spin-icon" />
      <p>Loading patient data…</p>
    </div>
  );

  if (error) return (
    <div className="patients-list-container">
      <div className="pl-error"><AlertCircle size={18} /> {error}</div>
    </div>
  );

  return (
    <div className="patients-list-container">

      {/* Page Header */}
      <div className="pl-page-header">
        <div className="pl-page-title">
          <div className="pl-title-icon"><Users size={22} /></div>
          <div>
            <h2>Patients Management</h2>
            <p>Users and their registered patients</p>
          </div>
        </div>
        <div className="pl-search-wrap">
          <Search size={15} className="pl-search-icon" />
          <input
            type="text"
            className="pl-search-input"
            placeholder="Search user by name or email…"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="pl-stats-row">
        <div className="pl-stat-card pl-stat-total">
          <span className="pl-stat-num">{usersData.length}</span>
          <span className="pl-stat-label">Total Users</span>
        </div>
        <div className="pl-stat-card pl-stat-active">
          <span className="pl-stat-num">{usersWithPatients}</span>
          <span className="pl-stat-label">Have Patients</span>
        </div>
        <div className="pl-stat-card pl-stat-verified">
          <span className="pl-stat-num">{totalPatients}</span>
          <span className="pl-stat-label">Total Patients</span>
        </div>
        <div className="pl-stat-card pl-stat-blocked">
          <span className="pl-stat-num">{usersData.filter(u => u.is_verified).length}</span>
          <span className="pl-stat-label">Verified Users</span>
        </div>
      </div>

      {/* Controls row: patient search + filter toggle */}
      <div className="pl-controls-row">
        <div className="pl-patient-search-row">
          <Search size={13} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            className="pl-patient-search-input"
            placeholder="Filter patients by name, city, blood group…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="pl-filter-dropdown-wrapper">
          <Users size={14} className="pl-filter-icon" />
          <select
            className="pl-filter-dropdown"
            value={onlyWithPatients ? "with_patients" : "all"}
            onChange={(e) => setOnlyWithPatients(e.target.value === "with_patients")}
          >
            <option value="all">Show All Users</option>
            <option value="with_patients">Show Users With Patients</option>
          </select>
        </div>
      </div>

      {/* User blocks */}
      <div className="pl-blocks-list">
        {filteredUsers.length === 0 ? (
          <div className="pl-empty-state">
            <Users size={48} style={{ opacity: 0.15, marginBottom: 12 }} />
            <p>No users found.</p>
          </div>
        ) : (
          filteredUsers.map(u => (
            <UserBlock key={u._id} userData={u} search={search} />
          ))
        )}
      </div>
    </div>
  );
};

export default PatientsList;
