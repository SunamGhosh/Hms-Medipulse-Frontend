import React, { useState, useEffect } from 'react';
import { Pill, Plus, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './MedicinesList.css';

const API = import.meta.env.VITE_URL || 'http://localhost:5000';

const CATEGORIES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Powder', 'Other'];
const UNITS = ['Strip', 'Bottle', 'Box', 'Tube', 'Piece', 'Packet'];

const MedicinesList = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    medicine_name: '', generic_name: '', category: 'Tablet', manufacturer: '',
    strength: '', unit: 'Strip', price: '', stock_available: '',
    description: '', requires_prescription: false, mfg_date: '', expiry_date: ''
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await fetch(`${API}/medicine`);
      const data = await response.json();
      if (data.success) {
        setMedicines(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch medicines');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    const token = localStorage.getItem('token'); // Admin token

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (imageFile) {
        data.append('medicine_image', imageFile);
      }

      const response = await fetch(`${API}/medicine/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Medicine added successfully!');
        setShowAddModal(false);
        setFormData({
          medicine_name: '', generic_name: '', category: 'Tablet', manufacturer: '',
          strength: '', unit: 'Strip', price: '', stock_available: '',
          description: '', requires_prescription: false, mfg_date: '', expiry_date: ''
        });
        setImageFile(null);
        fetchMedicines(); // Refresh list
      } else {
        toast.error(result.message || 'Error adding medicine');
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
      toast.error('An error occurred while adding medicine.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return (
    <div className="medicines-list-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <Loader2 size={32} className="ml-spinner" />
    </div>
  );
  if (error) return <div className="medicines-list-container"><p style={{ color: 'red' }}>Error: {error}</p></div>;

  return (
    <div className="medicines-list-container">
      <div className="medicines-header">
        <div className="medicines-header-info">
          <h2>Medicines Inventory</h2>
          <p>{medicines.length} medicine{medicines.length !== 1 ? 's' : ''} available in pharmacy</p>
        </div>
        <button className="add-medicine-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Add New Medicine
        </button>
      </div>

      <div className="table-responsive">
        <table className="medicines-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Category</th>
              <th>Manufacturer</th>
              <th>Strength</th>
              <th>Stock</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {medicines.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                  No medicines found in the inventory. Add one to get started.
                </td>
              </tr>
            ) : (
              medicines.map(med => (
                <tr key={med._id}>
                  <td>
                    <div className="ml-medicine-cell">
                      <img
                        src={med.medicine_image || '/img/medicine_bottle.png'}
                        alt={med.medicine_name}
                        className="ml-avatar"
                        onError={e => { e.target.src = '/img/medicine_bottle.png'; }}
                      />
                      <div>
                        <div className="ml-name">{med.medicine_name}</div>
                        <div className="ml-desc">{med.generic_name || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{med.category}</td>
                  <td>{med.manufacturer}</td>
                  <td>{med.strength} / {med.unit}</td>
                  <td>
                    <span style={{ color: med.stock_available > 10 ? '#166534' : '#991b1b', fontWeight: '500' }}>
                      {med.stock_available} units
                    </span>
                  </td>
                  <td className="ml-price">₹{med.price}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="ml-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="ml-modal ml-modal-add" onClick={e => e.stopPropagation()}>
            <div className="ml-modal-header">
              <h3><Pill size={18} style={{ marginRight: 8 }} /> Add New Medicine</h3>
              <button className="ml-modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="ml-add-body">
                <div className="ml-form-grid">
                  <div className="ml-form-group">
                    <label>Medicine Name *</label>
                    <input type="text" name="medicine_name" value={formData.medicine_name} onChange={handleChange} required placeholder="e.g. Paracetamol 500mg" />
                  </div>
                  <div className="ml-form-group">
                    <label>Generic Name</label>
                    <input type="text" name="generic_name" value={formData.generic_name} onChange={handleChange} placeholder="e.g. Acetaminophen" />
                  </div>
                  <div className="ml-form-group">
                    <label>Category *</label>
                    <select name="category" value={formData.category} onChange={handleChange} required>
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="ml-form-group">
                    <label>Manufacturer *</label>
                    <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} required placeholder="e.g. GSK" />
                  </div>
                  <div className="ml-form-group">
                    <label>Strength *</label>
                    <input type="text" name="strength" value={formData.strength} onChange={handleChange} required placeholder="e.g. 500mg" />
                  </div>
                  <div className="ml-form-group">
                    <label>Unit *</label>
                    <select name="unit" value={formData.unit} onChange={handleChange} required>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="ml-form-group">
                    <label>Price (₹) *</label>
                    <input type="number" min="0" step="0.01" name="price" value={formData.price} onChange={handleChange} required placeholder="e.g. 150" />
                  </div>
                  <div className="ml-form-group">
                    <label>Stock Available *</label>
                    <input type="number" min="0" name="stock_available" value={formData.stock_available} onChange={handleChange} required placeholder="e.g. 100" />
                  </div>
                  <div className="ml-form-group">
                    <label>Manufacturing Date *</label>
                    <input type="date" name="mfg_date" value={formData.mfg_date} onChange={handleChange} required />
                  </div>
                  <div className="ml-form-group">
                    <label>Expiry Date *</label>
                    <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} required />
                  </div>
                  <div className="ml-form-group ml-form-full">
                    <label>Medicine Image</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ padding: '7px' }} />
                  </div>
                  <div className="ml-form-group ml-form-full">
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Enter medicine description, uses, etc."></textarea>
                  </div>
                  <div className="ml-form-group ml-form-full ml-checkbox-group">
                    <input type="checkbox" id="req_pres" name="requires_prescription" checked={formData.requires_prescription} onChange={handleChange} />
                    <label htmlFor="req_pres">Requires Prescription</label>
                  </div>
                </div>
              </div>
              <div className="ml-modal-footer">
                <button type="button" className="ml-btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="ml-btn-save" disabled={submitLoading}>
                  {submitLoading ? <><Loader2 size={14} className="ml-spinner" style={{ marginRight: '5px', verticalAlign: 'middle' }} /> Saving...</> : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicinesList;
