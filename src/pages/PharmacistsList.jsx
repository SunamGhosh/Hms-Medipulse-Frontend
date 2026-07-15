import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './PharmacistsList.css';

const PharmacistsList = () => {
  const [pharmacists, setPharmacists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPharmacists = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_URL}/pharmacist/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setPharmacists(data.pharmacists);
      } else {
        setError(data.message || 'Failed to fetch pharmacists');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacists();
  }, []);

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_URL}/api/admin/pharmacists/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (response.ok) {
        setPharmacists(pharmacists.map(ph => ph._id === id ? { ...ph, status: newStatus } : ph));
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="pharmacists-list-container">Loading...</div>;
  if (error) return <div className="pharmacists-list-container">Error: {error}</div>;

  return (
    <div className="pharmacists-list-container">
      <div className="pharmacists-header">
        <h2>Pharmacists List</h2>
      </div>
      <div className="table-responsive">
        <table className="pharmacists-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Pharmacy Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pharmacists.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">No pharmacists found</td>
              </tr>
            ) : (
              pharmacists.map(pharmacist => (
                <tr key={pharmacist._id}>
                  <td>{pharmacist.first_name} {pharmacist.last_name}</td>
                  <td>{pharmacist.email}</td>
                  <td>{pharmacist.pharmacy_name}</td>
                  <td>
                    <span className={`status-badge ${pharmacist.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                      {pharmacist.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className={`toggle-btn ${pharmacist.status === 'active' ? 'btn-suspend' : 'btn-activate'}`}
                      onClick={() => toggleStatus(pharmacist._id, pharmacist.status)}
                    >
                      {pharmacist.status === 'active' ? 'Suspend' : 'Activate'}
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

export default PharmacistsList;
