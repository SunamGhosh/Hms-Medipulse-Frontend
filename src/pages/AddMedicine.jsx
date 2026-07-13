import React, { useState } from 'react';
import {
  Pill, Tag, Factory, Beaker, Box, DollarSign, Archive, FileText, Calendar, ShieldCheck,
  CheckCircle2, AlertCircle, ArrowRight
} from 'lucide-react';
import './AddMedicine.css';

const CATEGORIES = ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops", "Powder", "Other"];
const UNITS = ["Strip", "Bottle", "Box", "Tube", "Piece", "Packet"];

const AddMedicine = () => {
  const [form, setForm] = useState({
    medicine_name: '',
    generic_name: '',
    category: CATEGORIES[0],
    manufacturer: '',
    strength: '',
    unit: UNITS[0],
    price: '',
    stock_available: '',
    description: '',
    requires_prescription: false,
    mfg_date: '',
    expiry_date: '',
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    });
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!form.medicine_name.trim()) errors.medicine_name = 'Medicine name is required';
    if (!form.manufacturer.trim()) errors.manufacturer = 'Manufacturer is required';
    if (!form.strength.trim()) errors.strength = 'Strength is required';
    if (!form.price || Number(form.price) < 0) errors.price = 'Valid price is required';
    if (!form.stock_available || Number(form.stock_available) < 0) errors.stock_available = 'Valid stock amount is required';
    if (!form.mfg_date) errors.mfg_date = 'Manufacturing date is required';
    if (!form.expiry_date) errors.expiry_date = 'Expiry date is required';
    if (form.mfg_date && form.expiry_date && new Date(form.mfg_date) > new Date(form.expiry_date)) {
      errors.expiry_date = 'Expiry date must be after manufacturing date';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setMessage('');
    setErrorMsg('');

    try {
      const token = localStorage.getItem('token');

      // The backend uses upload.none() so we can send as form-data, or we can send JSON if backend allows.
      // We will send JSON because it's a simple text payload
      const response = await fetch(`${import.meta.env.VITE_URL}/api/medicine/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock_available: Number(form.stock_available)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Medicine added successfully!');
        setForm({
          medicine_name: '', generic_name: '', category: CATEGORIES[0], manufacturer: '',
          strength: '', unit: UNITS[0], price: '', stock_available: '', description: '',
          requires_prescription: false, mfg_date: '', expiry_date: '', status: 'active'
        });
      } else {
        setErrorMsg(data.message || 'Failed to add medicine');
      }
    } catch (error) {
      setErrorMsg(error.message || 'An unexpected connection error occurred');
    } finally {
      setLoading(false);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="add-medicine-container">
      <div className="form-header-section">
        <div className="header-icon-wrapper">
          <Pill size={30} color="var(--primary-color)" />
        </div>
        <div>
          <h2>Add New Medicine</h2>
          <p>Register a new medication or product into the pharmacy inventory.</p>
        </div>
      </div>

      {message && (
        <div className="alert-banner success">
          <CheckCircle2 className="alert-icon" size={20} />
          <div>
            <h4>Success</h4>
            <p>{message}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="alert-banner error">
          <AlertCircle className="alert-icon" size={20} />
          <div>
            <h4>Failed</h4>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="form-card">
        <form onSubmit={handleSubmit} noValidate>
          <h3 className="section-title">Medicine Details</h3>

          <div className="form-grid">
            <div className="form-group">
              <label className="field-label">Medicine Name <span className="req">*</span></label>
              <div className="input-with-icon">
                <Pill className="input-icon" size={18} />
                <input
                  name="medicine_name"
                  value={form.medicine_name}
                  onChange={handleChange}
                  placeholder="e.g. Amoxicillin"
                  className={formErrors.medicine_name ? 'input-error' : ''}
                  required
                />
              </div>
              {formErrors.medicine_name && <span className="error-text">{formErrors.medicine_name}</span>}
            </div>

            <div className="form-group">
              <label className="field-label">Generic Name</label>
              <div className="input-with-icon">
                <Tag className="input-icon" size={18} />
                <input
                  name="generic_name"
                  value={form.generic_name}
                  onChange={handleChange}
                  placeholder="e.g. Amoxicillin Trihydrate"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="field-label">Category <span className="req">*</span></label>
              <div className="input-with-icon">
                <Box className="input-icon" size={18} />
                <select name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="field-label">Manufacturer <span className="req">*</span></label>
              <div className="input-with-icon">
                <Factory className="input-icon" size={18} />
                <input
                  name="manufacturer"
                  value={form.manufacturer}
                  onChange={handleChange}
                  placeholder="e.g. Pfizer"
                  className={formErrors.manufacturer ? 'input-error' : ''}
                  required
                />
              </div>
              {formErrors.manufacturer && <span className="error-text">{formErrors.manufacturer}</span>}
            </div>

            <div className="form-group">
              <label className="field-label">Strength <span className="req">*</span></label>
              <div className="input-with-icon">
                <Beaker className="input-icon" size={18} />
                <input
                  name="strength"
                  value={form.strength}
                  onChange={handleChange}
                  placeholder="e.g. 500mg"
                  className={formErrors.strength ? 'input-error' : ''}
                  required
                />
              </div>
              {formErrors.strength && <span className="error-text">{formErrors.strength}</span>}
            </div>

            <div className="form-group">
              <label className="field-label">Unit <span className="req">*</span></label>
              <div className="input-with-icon">
                <Box className="input-icon" size={18} />
                <select name="unit" value={form.unit} onChange={handleChange}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="field-label">Price ($) <span className="req">*</span></label>
              <div className="input-with-icon">
                <DollarSign className="input-icon" size={18} />
                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="e.g. 15.50"
                  className={formErrors.price ? 'input-error' : ''}
                  required
                />
              </div>
              {formErrors.price && <span className="error-text">{formErrors.price}</span>}
            </div>

            <div className="form-group">
              <label className="field-label">Stock Available <span className="req">*</span></label>
              <div className="input-with-icon">
                <Archive className="input-icon" size={18} />
                <input
                  name="stock_available"
                  type="number"
                  value={form.stock_available}
                  onChange={handleChange}
                  placeholder="e.g. 100"
                  className={formErrors.stock_available ? 'input-error' : ''}
                  required
                />
              </div>
              {formErrors.stock_available && <span className="error-text">{formErrors.stock_available}</span>}
            </div>

            <div className="form-group">
              <label className="field-label">Manufacturing Date <span className="req">*</span></label>
              <div className="input-with-icon">
                <Calendar className="input-icon" size={18} />
                <input
                  name="mfg_date"
                  type="date"
                  value={form.mfg_date}
                  onChange={handleChange}
                  className={formErrors.mfg_date ? 'input-error' : ''}
                  required
                />
              </div>
              {formErrors.mfg_date && <span className="error-text">{formErrors.mfg_date}</span>}
            </div>

            <div className="form-group">
              <label className="field-label">Expiry Date <span className="req">*</span></label>
              <div className="input-with-icon">
                <Calendar className="input-icon" size={18} />
                <input
                  name="expiry_date"
                  type="date"
                  value={form.expiry_date}
                  onChange={handleChange}
                  className={formErrors.expiry_date ? 'input-error' : ''}
                  required
                />
              </div>
              {formErrors.expiry_date && <span className="error-text">{formErrors.expiry_date}</span>}
            </div>
          </div>

          <div className="form-group full-width" style={{ marginTop: '24px' }}>
            <label className="field-label">Description</label>
            <div className="input-with-icon">
              <FileText className="input-icon" size={18} style={{ top: '14px' }} />
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter additional details or instructions..."
              />
            </div>
          </div>

          <div className="toggle-wrapper" style={{ marginTop: '24px' }}>
            <div className="toggle-info">
              <h4>Requires Prescription</h4>
              <p>Turn this on if a doctor's prescription is mandatory to sell this medicine.</p>
            </div>
            <label className="ios-switch">
              <input
                type="checkbox"
                name="requires_prescription"
                checked={form.requires_prescription}
                onChange={handleChange}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="form-navigation-actions">
            <button type="submit" className="action-btn primary" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner-loader" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Save Medicine</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddMedicine;
