import React, { useState, useEffect } from 'react';
import './DoctorsList.css';

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/doctors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  useEffect(() => {
    fetchDoctors();
  }, []);

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/doctors/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (response.ok) {
        setDoctors(doctors.map(doc => doc._id === id ? { ...doc, status: newStatus } : doc));
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="doctors-list-container">Loading...</div>;
  if (error) return <div className="doctors-list-container">Error: {error}</div>;

  return (
    <div className="doctors-list-container">
      <div className="doctors-header">
        <h2>Doctors List</h2>
      </div>
      <div className="table-responsive">
        <table className="doctors-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">No doctors found</td>
              </tr>
            ) : (
              doctors.map(doctor => (
                <tr key={doctor._id}>
                  <td>{doctor.first_name} {doctor.last_name}</td>
                  <td>{doctor.email}</td>
                  <td>{doctor.department}</td>
                  <td>
                    <span className={`status-badge ${doctor.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                      {doctor.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className={`toggle-btn ${doctor.status === 'active' ? 'btn-suspend' : 'btn-activate'}`}
                      onClick={() => toggleStatus(doctor._id, doctor.status)}
                    >
                      {doctor.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorsList;
