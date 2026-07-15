<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { Pill, Plus, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './MedicinesList.css';

const API = import.meta.env.VITE_URL || 'http://localhost:5000';

const CATEGORIES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Powder', 'Other'];
const UNITS = ['Strip', 'Bottle', 'Box', 'Tube', 'Piece', 'Packet'];
=======
import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Pill, Package, CheckCircle, XCircle, AlertTriangle,
  Plus, X, Beaker, Factory, Box, IndianRupee, Archive,
  FileText, Calendar, ShieldCheck, Tag, ImagePlus, Trash2
} from 'lucide-react';
import './MedicinesList.css';

const CATEGORIES = ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops", "Powder", "Other"];
const UNITS = ["Strip", "Bottle", "Box", "Tube", "Piece", "Packet"];

const EMPTY_FORM = {
  medicine_name: '', generic_name: '', category: CATEGORIES[0],
  manufacturer: '', strength: '', unit: UNITS[0], price: '',
  stock_available: '', description: '', requires_prescription: false,
  mfg_date: '', expiry_date: '', status: 'active'
};
>>>>>>> b9379630105c774da540e33a91a74b53c122ecbc

const MedicinesList = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
<<<<<<< HEAD

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
=======
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const imageInputRef = useRef(null);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_URL}/medicine/`);
      const data = await response.json();
      if (response.ok) {
        setMedicines(data.data || data.medicines || data || []);
>>>>>>> b9379630105c774da540e33a91a74b53c122ecbc
      } else {
        setError(data.message || 'Failed to fetch medicines');
      }
    } catch (err) {
<<<<<<< HEAD
      setError(err.message);
=======
      setError('Connection error. Please check if backend is running.');
>>>>>>> b9379630105c774da540e33a91a74b53c122ecbc
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
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
  if (error) return <div className="medicines-list-container"><p style={{color: 'red'}}>Error: {error}</p></div>;
=======
  useEffect(() => { fetchMedicines(); }, []);

  const handleToggleStatus = async (medicineId, currentStatus) => {
    const action = currentStatus === 'active' ? 'deactivate' : 'activate';
    setActionLoading(medicineId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_URL}/medicine/${medicineId}/${action}`,
        { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      if (response.ok) {
        setMedicines(prev =>
          prev.map(m =>
            m._id === medicineId
              ? { ...m, status: action === 'activate' ? 'active' : 'inactive' }
              : m
          )
        );
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      alert('Connection error.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const validateForm = () => {
    const errors = {};
    if (!form.medicine_name.trim()) errors.medicine_name = 'Required';
    if (!form.manufacturer.trim()) errors.manufacturer = 'Required';
    if (!form.strength.trim()) errors.strength = 'Required';
    if (form.price === '' || Number(form.price) < 0) errors.price = 'Required';
    if (form.stock_available === '' || Number(form.stock_available) < 0) errors.stock_available = 'Required';
    if (!form.mfg_date) errors.mfg_date = 'Required';
    if (!form.expiry_date) errors.expiry_date = 'Required';
    if (form.mfg_date && form.expiry_date && new Date(form.mfg_date) > new Date(form.expiry_date))
      errors.expiry_date = 'Must be after manufacturing date';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      const token = localStorage.getItem('token');
      let response;
      if (imageFile) {
        // Use FormData for multipart upload when image is selected
        const formData = new FormData();
        Object.entries({ ...form, price: Number(form.price), stock_available: Number(form.stock_available) })
          .forEach(([k, v]) => formData.append(k, v));
        formData.append('medicine_image', imageFile);
        response = await fetch(`${import.meta.env.VITE_URL}/medicine/create`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      } else {
        response = await fetch(`${import.meta.env.VITE_URL}/medicine/create`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, price: Number(form.price), stock_available: Number(form.stock_available) })
        });
      }
      const data = await response.json();
      if (response.ok) {
        setFormSuccess('Medicine added successfully!');
        setForm(EMPTY_FORM);
        setFormErrors({});
        setImageFile(null);
        setImagePreview(null);
        fetchMedicines();
        setTimeout(() => { setShowModal(false); setFormSuccess(''); }, 1500);
      } else {
        setFormError(data.message || 'Failed to add medicine');
      }
    } catch (err) {
      setFormError('Connection error.');
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStockClass = (stock) => {
    if (stock === 0) return 'out';
    if (stock < 20) return 'low';
    return 'high';
  };

  const filteredMedicines = medicines.filter(m =>
    m.medicine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );
>>>>>>> b9379630105c774da540e33a91a74b53c122ecbc

  return (
    <div className="medicines-list-container">
      <div className="medicines-header">
<<<<<<< HEAD
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
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{padding: '7px'}} />
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
                  {submitLoading ? <><Loader2 size={14} className="ml-spinner" style={{marginRight: '5px', verticalAlign: 'middle'}}/> Saving...</> : 'Save Medicine'}
=======
        <div>
          <h2>Medicines Inventory</h2>
          <p>Manage all medicines available in the pharmacy system.</p>
        </div>
        <button className="add-medicine-btn" onClick={() => { setShowModal(true); setFormError(''); setFormSuccess(''); setImageFile(null); setImagePreview(null); }}>
          <Plus size={16} /> Add Medicine
        </button>
      </div>

      <div className="table-controls">
        <div className="search-box">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Search by name, manufacturer, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span style={{ color: '#64748b', fontSize: '14px', alignSelf: 'center' }}>
          {filteredMedicines.length} medicine{filteredMedicines.length !== 1 ? 's' : ''} found
        </span>
      </div>

      <div className="medicines-table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading medicines...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertTriangle size={32} style={{ margin: '0 auto 12px' }} />
            <p>{error}</p>
          </div>
        ) : (
          <table className="medicines-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Medicine Name</th>
                <th>Category</th>
                <th>Strength</th>
                <th>Manufacturer</th>
                <th>Unit</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Expiry</th>
                <th>Rx</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', color: '#94a3b8', padding: '48px' }}>
                    No medicines found.
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((medicine) => (
                  <tr key={medicine._id}>
                    <td style={{ fontSize: '12px', color: '#94a3b8' }}>{medicine._id}</td>
                    <td>
                      <div className="medicine-name-cell">
                        {medicine.medicine_image ? (
                          <img src={medicine.medicine_image} alt={medicine.medicine_name}
                            style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', marginRight: 8, verticalAlign: 'middle', border: '1px solid #e2e8f0' }} />
                        ) : (
                          <Pill size={14} style={{ display: 'inline', marginRight: '6px', color: '#3b82f6' }} />
                        )}
                        {medicine.medicine_name}
                      </div>
                      {medicine.generic_name && (
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{medicine.generic_name}</div>
                      )}
                    </td>
                    <td><span className="medicine-category-badge">{medicine.category}</span></td>
                    <td>{medicine.strength}</td>
                    <td>{medicine.manufacturer}</td>
                    <td>{medicine.unit}</td>
                    <td>₹{medicine.price?.toFixed(2)}</td>
                    <td>
                      <div className={`stock-indicator ${getStockClass(medicine.stock_available)}`}>
                        <Package size={14} /> {medicine.stock_available}
                      </div>
                    </td>
                    <td style={{ fontSize: '13px' }}>{formatDate(medicine.expiry_date)}</td>
                    <td>
                      {medicine.requires_prescription
                        ? <span style={{ color: '#f97316', fontSize: '12px', fontWeight: 600 }}>Yes</span>
                        : <span style={{ color: '#94a3b8', fontSize: '12px' }}>No</span>}
                    </td>
                    <td>
                      <span className={`status-badge ${medicine.status}`}>
                        {medicine.status === 'active'
                          ? <><CheckCircle size={12} /> Active</>
                          : <><XCircle size={12} /> Inactive</>}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {medicine.status === 'active' ? (
                          <button className="btn-toggle deactivate" onClick={() => handleToggleStatus(medicine._id, medicine.status)} disabled={actionLoading === medicine._id}>
                            {actionLoading === medicine._id ? '...' : 'Deactivate'}
                          </button>
                        ) : (
                          <button className="btn-toggle activate" onClick={() => handleToggleStatus(medicine._id, medicine.status)} disabled={actionLoading === medicine._id}>
                            {actionLoading === medicine._id ? '...' : 'Activate'}
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

      {/* ── Add Medicine Modal ── */}
      {showModal && (
        <div className="med-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="med-modal" onClick={(e) => e.stopPropagation()}>
            <div className="med-modal-header">
              <div className="med-modal-title">
                <Pill size={20} color="#3b82f6" />
                <span>Add New Medicine</span>
              </div>
              <button className="med-modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            {formSuccess && (
              <div className="med-form-alert success"><CheckCircle size={16} /> {formSuccess}</div>
            )}
            {formError && (
              <div className="med-form-alert error"><AlertTriangle size={16} /> {formError}</div>
            )}

            <form className="med-modal-form" onSubmit={handleAddMedicine} noValidate>
              <div className="med-form-grid">

                <div className="med-form-group">
                  <label>Medicine Name <span className="req">*</span></label>
                  <div className="med-input-wrap">
                    <Pill className="med-input-icon" size={15} />
                    <input name="medicine_name" value={form.medicine_name} onChange={handleFormChange} placeholder="e.g. Amoxicillin" className={formErrors.medicine_name ? 'err' : ''} />
                  </div>
                  {formErrors.medicine_name && <span className="med-err">{formErrors.medicine_name}</span>}
                </div>

                <div className="med-form-group">
                  <label>Generic Name</label>
                  <div className="med-input-wrap">
                    <Tag className="med-input-icon" size={15} />
                    <input name="generic_name" value={form.generic_name} onChange={handleFormChange} placeholder="e.g. Amoxicillin Trihydrate" />
                  </div>
                </div>

                <div className="med-form-group">
                  <label>Category <span className="req">*</span></label>
                  <div className="med-input-wrap">
                    <Box className="med-input-icon" size={15} />
                    <select name="category" value={form.category} onChange={handleFormChange}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="med-form-group">
                  <label>Manufacturer <span className="req">*</span></label>
                  <div className="med-input-wrap">
                    <Factory className="med-input-icon" size={15} />
                    <input name="manufacturer" value={form.manufacturer} onChange={handleFormChange} placeholder="e.g. Pfizer" className={formErrors.manufacturer ? 'err' : ''} />
                  </div>
                  {formErrors.manufacturer && <span className="med-err">{formErrors.manufacturer}</span>}
                </div>

                <div className="med-form-group">
                  <label>Strength <span className="req">*</span></label>
                  <div className="med-input-wrap">
                    <Beaker className="med-input-icon" size={15} />
                    <input name="strength" value={form.strength} onChange={handleFormChange} placeholder="e.g. 500mg" className={formErrors.strength ? 'err' : ''} />
                  </div>
                  {formErrors.strength && <span className="med-err">{formErrors.strength}</span>}
                </div>

                <div className="med-form-group">
                  <label>Unit <span className="req">*</span></label>
                  <div className="med-input-wrap">
                    <Box className="med-input-icon" size={15} />
                    <select name="unit" value={form.unit} onChange={handleFormChange}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div className="med-form-group">
                  <label>Price (₹) <span className="req">*</span></label>
                  <div className="med-input-wrap">
                    <IndianRupee className="med-input-icon" size={15} />
                    <input name="price" type="number" value={form.price} onChange={handleFormChange} placeholder="e.g. 15.50" className={formErrors.price ? 'err' : ''} />
                  </div>
                  {formErrors.price && <span className="med-err">{formErrors.price}</span>}
                </div>

                <div className="med-form-group">
                  <label>Stock Available <span className="req">*</span></label>
                  <div className="med-input-wrap">
                    <Archive className="med-input-icon" size={15} />
                    <input name="stock_available" type="number" value={form.stock_available} onChange={handleFormChange} placeholder="e.g. 100" className={formErrors.stock_available ? 'err' : ''} />
                  </div>
                  {formErrors.stock_available && <span className="med-err">{formErrors.stock_available}</span>}
                </div>

                <div className="med-form-group">
                  <label>Mfg. Date <span className="req">*</span></label>
                  <div className="med-input-wrap">
                    <Calendar className="med-input-icon" size={15} />
                    <input name="mfg_date" type="date" value={form.mfg_date} onChange={handleFormChange} className={formErrors.mfg_date ? 'err' : ''} />
                  </div>
                  {formErrors.mfg_date && <span className="med-err">{formErrors.mfg_date}</span>}
                </div>

                <div className="med-form-group">
                  <label>Expiry Date <span className="req">*</span></label>
                  <div className="med-input-wrap">
                    <Calendar className="med-input-icon" size={15} />
                    <input name="expiry_date" type="date" value={form.expiry_date} onChange={handleFormChange} className={formErrors.expiry_date ? 'err' : ''} />
                  </div>
                  {formErrors.expiry_date && <span className="med-err">{formErrors.expiry_date}</span>}
                </div>

                {/* Image Upload */}
                <div className="med-form-group full">
                  <label>Medicine Image</label>
                  {imagePreview ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 16px' }}>
                      <img src={imagePreview} alt="preview"
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#334155', marginBottom: 4 }}>{imageFile?.name}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{imageFile && (imageFile.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <button type="button" onClick={handleRemoveImage}
                        style={{ background: '#fee2e2', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      style={{ border: '2px dashed #cbd5e1', borderRadius: 12, padding: '28px 16px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', transition: 'border-color 0.2s, background 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
                    >
                      <ImagePlus size={28} color="#3b82f6" style={{ marginBottom: 8 }} />
                      <div style={{ fontWeight: 600, color: '#334155', fontSize: 14 }}>Click to upload image</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>PNG, JPG, WEBP up to 5MB</div>
                    </div>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="med-form-group full">
                  <label>Description</label>
                  <div className="med-input-wrap">
                    <FileText className="med-input-icon" size={15} style={{ top: '12px' }} />
                    <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Optional notes..." rows={2} />
                  </div>
                </div>

                <div className="med-form-group full">
                  <div className="med-toggle-row">
                    <div>
                      <strong>Requires Prescription</strong>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Turn on if a doctor's prescription is mandatory.</p>
                    </div>
                    <label className="med-switch">
                      <input type="checkbox" name="requires_prescription" checked={form.requires_prescription} onChange={handleFormChange} />
                      <span className="med-slider" />
                    </label>
                  </div>
                </div>

              </div>

              <div className="med-modal-footer">
                <button type="button" className="med-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="med-btn-submit" disabled={formLoading}>
                  {formLoading ? <><span className="med-spinner" /> Saving...</> : <><ShieldCheck size={15} /> Save Medicine</>}
>>>>>>> b9379630105c774da540e33a91a74b53c122ecbc
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
