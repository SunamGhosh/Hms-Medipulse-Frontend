import React, { useState, useRef } from 'react';
import { 
  User, Mail, Lock, Phone, CreditCard, Award, 
  Briefcase, MapPin, Calendar, Clock, CheckCircle2, 
  AlertCircle, ArrowRight, ArrowLeft,
  ShieldAlert, Eye, EyeOff, ShieldCheck, Upload
} from 'lucide-react';
import './AddPharmacist.css';

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const AddPharmacist = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [successModal, setSuccessModal] = useState({ open: false, pharmacistName: '' });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    pharmacy_name: '',
    qualification: '',
    license_no: '',
    address: '',
    profile_img: 'https://via.placeholder.com/150', // Default placeholder for schema validation
    work_time_start: '09:00',
    work_time_end: '17:00',
    status: 'active',
    is_verified: true,
    joining_date: new Date().toISOString().split('T')[0]
  });

  const [workingDays, setWorkingDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
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
    // Clear validation error on change
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const handleDayToggle = (day) => {
    let updatedDays;
    if (workingDays.includes(day)) {
      updatedDays = workingDays.filter(d => d !== day);
    } else {
      updatedDays = [...workingDays, day];
    }
    setWorkingDays(updatedDays);
    if (formErrors.working_days) {
      setFormErrors({ ...formErrors, working_days: '' });
    }
  };

  const validateStep = (currentStep) => {
    const errors = {};
    
    if (currentStep === 1) {
      if (!form.first_name.trim()) errors.first_name = 'First name is required';
      if (!form.last_name.trim()) errors.last_name = 'Last name is required';
      if (!form.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(form.email)) {
        errors.email = 'Please enter a valid email address';
      }
      if (!form.password) errors.password = 'Password is required';
      if (form.password && form.password.length < 6) errors.password = 'Password must be at least 6 characters';
      if (!form.phone.trim()) errors.phone = 'Phone number is required';
    }
    
    if (currentStep === 2) {
      if (!form.pharmacy_name.trim()) errors.pharmacy_name = 'Pharmacy name is required';
      if (!form.license_no.trim()) errors.license_no = 'License number is required';
      if (!form.qualification.trim()) errors.qualification = 'Qualification is required';
      if (!form.address.trim()) errors.address = 'Pharmacy Address is required';
      if (!form.joining_date) errors.joining_date = 'Joining date is required';
    }
    
    if (currentStep === 3) {
      if (!form.work_time_start) errors.work_time_start = 'Start time is required';
      if (!form.work_time_end) errors.work_time_end = 'End time is required';
      if (workingDays.length === 0) {
        errors.working_days = 'Please select at least one working day';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  // Helper to format time from HH:MM to 12-hour AM/PM format for backend
  const formatTime = (time24) => {
    if (!time24) return '';
    const [hoursStr, minutesStr] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedHours = hours < 10 ? '0' + hours : hours;
    return `${formattedHours}:${minutesStr} ${ampm}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setLoading(true);
    setMessage('');
    setErrorMsg('');
    
    try {
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'profile_img') return;
        formData.append(key, form[key]);
      });
      formData.append('working_days', JSON.stringify(workingDays));
      formData.set('work_time_start', formatTime(form.work_time_start));
      formData.set('work_time_end', formatTime(form.work_time_end));

      if (imageFile) {
        formData.append('profile_img', imageFile);
      }

      const response = await fetch(`${import.meta.env.VITE_URL}/admin/add-pharmacist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        const addedPhName = `${form.first_name} ${form.last_name}`;
        setMessage('Pharmacist registered successfully!');
        setSuccessModal({ open: true, pharmacistName: addedPhName });
        // Reset form and return to step 1
        setForm({
          first_name: '', last_name: '', email: '', password: '', phone: '',
          pharmacy_name: '', qualification: '', license_no: '', address: '',
          profile_img: 'https://via.placeholder.com/150', work_time_start: '09:00', work_time_end: '17:00',
          status: 'active', is_verified: true, joining_date: new Date().toISOString().split('T')[0]
        });
        setWorkingDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
        setImageFile(null);
        setImagePreview(null);
        setStep(1);
      } else {
        setErrorMsg(data.message || 'Failed to add pharmacist');
      }
    } catch (error) {
      setErrorMsg(error.message || 'An unexpected connection error occurred');
    } finally {
      setLoading(false);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="add-pharmacist-container">
      <div className="form-header-section">
        <div className="header-icon-wrapper">
          <ShieldAlert size={30} color="var(--primary-color)" />
        </div>
        <div>
          <h2>Register New Pharmacist</h2>
          <p>Add a new pharmacy professional profile to manage dispensaries and inventory.</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="steps-tracker">
        <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-circle">{step > 1 ? <CheckCircle2 size={16} /> : '1'}</div>
          <span>Basic Details</span>
        </div>
        <div className="step-line" />
        <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-circle">{step > 2 ? <CheckCircle2 size={16} /> : '2'}</div>
          <span>Pharmacy & License</span>
        </div>
        <div className="step-line" />
        <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
          <div className="step-circle">3</div>
          <span>Work Schedule</span>
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
            <h4>Registration Failed</h4>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="form-card">
        <form onSubmit={handleSubmit} noValidate>
          {/* STEP 1: PERSONAL & ACCOUNT DETAILS */}
          {step === 1 && (
            <div className="form-step-content fade-in">
              <h3 className="section-title">Step 1: Personal & Account Details</h3>
              
              <div className="form-group full-width" style={{ marginBottom: '1.5rem' }}>
                <label className="field-label">Pharmacist Profile Photo</label>
                <div className="ad-image-upload-area" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1.5px dashed #cbd5e1' }}>
                  <div className="ad-image-preview">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={30} color="#94a3b8" />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                      type="button"
                      className="action-btn secondary"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ padding: '8px 16px', fontSize: '0.85rem', width: 'fit-content' }}
                    >
                      <Upload size={16} style={{ marginRight: 6 }} />
                      {imageFile ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {imageFile ? (
                      <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>{imageFile.name}</span>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>PNG, JPG, WEBP · max 5MB</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="field-label">First Name <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <User className="input-icon" size={18} />
                    <input 
                      name="first_name" 
                      value={form.first_name} 
                      onChange={handleChange} 
                      placeholder="Jane" 
                      className={formErrors.first_name ? 'input-error' : ''}
                      required 
                    />
                  </div>
                  {formErrors.first_name && <span className="error-text">{formErrors.first_name}</span>}
                </div>

                <div className="form-group">
                  <label className="field-label">Last Name <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <User className="input-icon" size={18} />
                    <input 
                      name="last_name" 
                      value={form.last_name} 
                      onChange={handleChange} 
                      placeholder="Smith" 
                      className={formErrors.last_name ? 'input-error' : ''}
                      required 
                    />
                  </div>
                  {formErrors.last_name && <span className="error-text">{formErrors.last_name}</span>}
                </div>

                <div className="form-group">
                  <label className="field-label">Email Address <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <Mail className="input-icon" size={18} />
                    <input 
                      name="email" 
                      type="email"
                      value={form.email} 
                      onChange={handleChange} 
                      placeholder="pharmacist@medipulse.com" 
                      className={formErrors.email ? 'input-error' : ''}
                      required 
                    />
                  </div>
                  {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="field-label">Password <span className="req">*</span></label>
                  <div className="input-with-icon" style={{ position: 'relative' }}>
                    <Lock className="input-icon" size={18} />
                    <input 
                      name="password" 
                      type={showPassword ? 'text' : 'password'}
                      value={form.password} 
                      onChange={handleChange} 
                      placeholder="••••••••" 
                      className={formErrors.password ? 'input-error' : ''}
                      style={{ paddingRight: '42px' }}
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRadius: '6px'
                      }}
                      title={showPassword ? "Hide Password" : "Show Password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formErrors.password && <span className="error-text">{formErrors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="field-label">Phone Number <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <Phone className="input-icon" size={18} />
                    <input 
                      name="phone" 
                      value={form.phone} 
                      onChange={handleChange} 
                      placeholder="+1 (555) 012-3456" 
                      className={formErrors.phone ? 'input-error' : ''}
                      required 
                    />
                  </div>
                  {formErrors.phone && <span className="error-text">{formErrors.phone}</span>}
                </div>
              </div>

              <div className="form-navigation-actions">
                <div />
                <button type="button" className="action-btn primary" onClick={handleNext}>
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PHARMACY & LICENSE INFO */}
          {step === 2 && (
            <div className="form-step-content fade-in">
              <h3 className="section-title">Step 2: Pharmacy Details & Licensing</h3>

              <div className="form-grid">
                <div className="form-group">
                  <label className="field-label">Pharmacy Outlet Name <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <Briefcase className="input-icon" size={18} />
                    <input 
                      name="pharmacy_name" 
                      value={form.pharmacy_name} 
                      onChange={handleChange} 
                      placeholder="e.g. Main Clinic Dispensary A" 
                      className={formErrors.pharmacy_name ? 'input-error' : ''}
                      required 
                    />
                  </div>
                  {formErrors.pharmacy_name && <span className="error-text">{formErrors.pharmacy_name}</span>}
                </div>

                <div className="form-group">
                  <label className="field-label">Pharmacy License Number <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <Award className="input-icon" size={18} />
                    <input 
                      name="license_no" 
                      value={form.license_no} 
                      onChange={handleChange} 
                      placeholder="e.g. PHAR-554433" 
                      className={formErrors.license_no ? 'input-error' : ''}
                      required 
                    />
                  </div>
                  {formErrors.license_no && <span className="error-text">{formErrors.license_no}</span>}
                </div>

                <div className="form-group">
                  <label className="field-label">Qualifications <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <Award className="input-icon" size={18} />
                    <input 
                      name="qualification" 
                      value={form.qualification} 
                      onChange={handleChange} 
                      placeholder="e.g. B.Pharm, PharmD" 
                      className={formErrors.qualification ? 'input-error' : ''}
                      required 
                    />
                  </div>
                  {formErrors.qualification && <span className="error-text">{formErrors.qualification}</span>}
                </div>

                <div className="form-group">
                  <label className="field-label">Joining Date <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <Calendar className="input-icon" size={18} />
                    <input 
                      name="joining_date" 
                      type="date"
                      value={form.joining_date} 
                      onChange={handleChange} 
                      className={formErrors.joining_date ? 'input-error' : ''}
                      required 
                    />
                  </div>
                  {formErrors.joining_date && <span className="error-text">{formErrors.joining_date}</span>}
                </div>

                <div className="form-group full-width">
                  <label className="field-label">Pharmacy Outlet Address <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <MapPin className="input-icon" size={18} />
                    <input 
                      name="address" 
                      value={form.address} 
                      onChange={handleChange} 
                      placeholder="First Floor, Medipulse Building, Medical Parkway, NY" 
                      className={formErrors.address ? 'input-error' : ''}
                      required 
                    />
                  </div>
                  {formErrors.address && <span className="error-text">{formErrors.address}</span>}
                </div>
              </div>

              <div className="form-navigation-actions">
                <button type="button" className="action-btn secondary" onClick={handleBack}>
                  <ArrowLeft size={18} />
                  <span>Back</span>
                </button>
                <button type="button" className="action-btn primary" onClick={handleNext}>
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: WORK HOURS, AVAILABILITY, STATUS */}
          {step === 3 && (
            <div className="form-step-content fade-in">
              <h3 className="section-title">Step 3: Work Schedule & Credentials</h3>

              <div className="form-grid">
                <div className="form-group">
                  <label className="field-label">Duty Status</label>
                  <div className="input-with-icon">
                    <Briefcase className="input-icon" size={18} />
                    <select 
                      name="status" 
                      value={form.status} 
                      onChange={handleChange}
                    >
                      <option value="active">Active Duty</option>
                      <option value="inactive">Inactive</option>
                      <option value="on-leave">On Leave</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="field-label">Start Time <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <Clock className="input-icon" size={18} />
                    <input 
                      name="work_time_start" 
                      type="time"
                      value={form.work_time_start} 
                      onChange={handleChange} 
                      className={formErrors.work_time_start ? 'input-error' : ''}
                      required 
                    />
                  </div>
                  {formErrors.work_time_start && <span className="error-text">{formErrors.work_time_start}</span>}
                </div>

                <div className="form-group">
                  <label className="field-label">End Time <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <Clock className="input-icon" size={18} />
                    <input 
                      name="work_time_end" 
                      type="time"
                      value={form.work_time_end} 
                      onChange={handleChange} 
                      className={formErrors.work_time_end ? 'input-error' : ''}
                      required 
                    />
                  </div>
                  {formErrors.work_time_end && <span className="error-text">{formErrors.work_time_end}</span>}
                </div>
              </div>

              <div className="form-group full-width mt-4">
                <label className="field-label flex justify-between">
                  <span>Working Days <span className="req">*</span></span>
                  <span className="info-badge">{workingDays.length} selected</span>
                </label>
                <div className="days-selector-grid">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = workingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        className={`day-chip-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleDayToggle(day)}
                      >
                        <Calendar size={14} />
                        <span>{day}</span>
                      </button>
                    );
                  })}
                </div>
                {formErrors.working_days && <span className="error-text">{formErrors.working_days}</span>}
              </div>

              <div className="verification-toggle-wrapper">
                <div className="toggle-info">
                  <h4>Verify Account Profile</h4>
                  <p>Verify license credentials and activate pharmacist permissions immediately.</p>
                </div>
                <label className="ios-switch">
                  <input 
                    type="checkbox" 
                    name="is_verified" 
                    checked={form.is_verified} 
                    onChange={handleChange} 
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="form-navigation-actions">
                <button type="button" className="action-btn secondary" onClick={handleBack} disabled={loading}>
                  <ArrowLeft size={18} />
                  <span>Back</span>
                </button>
                <button type="submit" className="action-btn primary" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner-loader" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Complete Registration</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* ================================================================
          NEW PHARMACIST ADDED SUCCESS POPUP MODAL
      ================================================================ */}
      {successModal.open && (
        <div className="ph-modal-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16
        }} onClick={() => setSuccessModal({ open: false, pharmacistName: '' })}>
          <div style={{
            background: 'white', borderRadius: 24, padding: '32px 28px', maxWidth: 440, width: '100%',
            textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'ad-fade 0.25s ease'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: '#16a34a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.2)'
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>Pharmacist Registered Successfully!</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 24px' }}>
              <strong style={{ color: '#0f172a' }}>{successModal.pharmacistName}</strong> has been added to the MEDIpulse pharmacy network.
            </p>
            <button
              type="button"
              className="action-btn primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem', fontWeight: 700, borderRadius: 12 }}
              onClick={() => setSuccessModal({ open: false, pharmacistName: '' })}
            >
              OK, Great!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddPharmacist;
