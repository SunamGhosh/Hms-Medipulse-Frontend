import React, { useState, useRef } from 'react';
import {
  User, Mail, Lock, Phone, CreditCard, Award,
  Briefcase, MapPin, DollarSign, Calendar, Clock,
  CheckCircle2, AlertCircle, ArrowRight, ArrowLeft,
  Stethoscope, Upload
} from 'lucide-react';
import './AddDoctor.css';

const DEPARTMENTS = [
  'General Medicine',
  'Pediatrics',
  'Cardiology',
  'Orthopedics',
  'Neurology',
  'Dermatology',
  'Gynecology',
  'Ophthalmology',
  'Psychiatry',
  'Oncology'
];

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const AddDoctor = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    profile_img: 'https://via.placeholder.com/150', // Default placeholder for schema validation
    license_no: '',
    department: DEPARTMENTS[0],
    specialization: '',
    qualification: '',
    experience_year: '',
    visit_address: '',
    consult_fee: '',
    consult_mode: 'both',
    work_time_start: '09:00',
    work_time_end: '17:00',
    status: 'active',
    is_verified: true
  });

  const [availableDays, setAvailableDays] = useState(['Monday', 'Wednesday', 'Friday']);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
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
    if (availableDays.includes(day)) {
      updatedDays = availableDays.filter(d => d !== day);
    } else {
      updatedDays = [...availableDays, day];
    }
    setAvailableDays(updatedDays);
    if (formErrors.available_days) {
      setFormErrors({ ...formErrors, available_days: '' });
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
      if (!form.license_no.trim()) errors.license_no = 'License number is required';
      if (!form.specialization.trim()) errors.specialization = 'Specialization is required';
      if (!form.qualification.trim()) errors.qualification = 'Qualification is required';
      if (!form.experience_year) {
        errors.experience_year = 'Years of experience is required';
      } else if (Number(form.experience_year) < 0) {
        errors.experience_year = 'Experience must be a positive number';
      }
    }

    if (currentStep === 3) {
      if (!form.visit_address.trim()) errors.visit_address = 'Clinic/Visit Address is required';
      if (!form.consult_fee) {
        errors.consult_fee = 'Consultation fee is required';
      } else if (Number(form.consult_fee) < 0) {
        errors.consult_fee = 'Fee must be a positive number';
      }
      if (!form.work_time_start) errors.work_time_start = 'Start time is required';
      if (!form.work_time_end) errors.work_time_end = 'End time is required';
      if (availableDays.length === 0) {
        errors.available_days = 'Please select at least one available day';
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
        if (key === 'profile_img') return; // handled separately
        formData.append(key, form[key]);
      });
      formData.append('available_days', JSON.stringify(availableDays));
      formData.append('experience_year', Number(form.experience_year));
      formData.append('consult_fee', Number(form.consult_fee));
      formData.append('work_time_start', formatTime(form.work_time_start));
      formData.append('work_time_end', formatTime(form.work_time_end));
      
      if (imageFile) {
        formData.append('profile_img', imageFile);
      }

      const response = await fetch(`${import.meta.env.VITE_URL}/admin/add-doctor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` // let fetch set Content-Type for multipart/form-data
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Doctor registered successfully!');
        // Reset form and return to step 1
        setForm({
          first_name: '', last_name: '', email: '', password: '', phone: '',
          profile_img: 'https://via.placeholder.com/150', license_no: '', department: DEPARTMENTS[0],
          specialization: '', qualification: '', experience_year: '', visit_address: '',
          consult_fee: '', consult_mode: 'both', work_time_start: '09:00', work_time_end: '17:00',
          status: 'active', is_verified: true
        });
        setAvailableDays(['Monday', 'Wednesday', 'Friday']);
        setImageFile(null);
        setImagePreview(null);
        setStep(1);
      } else {
        setErrorMsg(data.message || 'Failed to add doctor');
      }
    } catch (error) {
      setErrorMsg(error.message || 'An unexpected connection error occurred');
    } finally {
      setLoading(false);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="add-doctor-container">
      <div className="form-header-section">
        <div className="header-icon-wrapper">
          <Stethoscope size={30} color="var(--primary-color)" />
        </div>
        <div>
          <h2>Register New Doctor</h2>
          <p>Add a new physician profile to the MEDIpulse health management network.</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="steps-tracker">
        <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-circle">{step > 1 ? <CheckCircle2 size={16} /> : '1'}</div>
          <span>Account Credentials</span>
        </div>
        <div className="step-line" />
        <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-circle">{step > 2 ? <CheckCircle2 size={16} /> : '2'}</div>
          <span>Professional Info</span>
        </div>
        <div className="step-line" />
        <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
          <div className="step-circle">3</div>
          <span>Availability & Fees</span>
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
                <label className="field-label">Doctor Profile Photo</label>
                <div className="ad-image-upload-area">
                  <div className="ad-image-preview">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="ad-preview-img" />
                    ) : (
                      <div className="ad-preview-placeholder">
                        <User size={36} color="#9ca3af" />
                      </div>
                    )}
                  </div>
                  <div className="ad-upload-right">
                    <button
                      type="button"
                      className="ad-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={16} />
                      {imageFile ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {imageFile && (
                      <span className="ad-file-name">{imageFile.name}</span>
                    )}
                    {!imageFile && (
                      <span className="ad-file-hint">PNG, JPG, WEBP · max 5MB</span>
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
                  <label className="field-label">Email Address <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <Mail className="input-icon" size={18} />
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="doctor@medipulse.com"
                      className={formErrors.email ? 'input-error' : ''}
                      required
                    />
                  </div>
                  {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="field-label">Password <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <Lock className="input-icon" size={18} />
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={formErrors.password ? 'input-error' : ''}
                      required
                    />
                  </div>
                  {formErrors.password && <span className="error-text">{formErrors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="field-label">First Name <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <User className="input-icon" size={18} />
                    <input
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      placeholder="John"
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
                      placeholder="Doe"
                      className={formErrors.last_name ? 'input-error' : ''}
                      required
                    />
                  </div>
                  {formErrors.last_name && <span className="error-text">{formErrors.last_name}</span>}
                </div>

                <div className="form-group">
                  <label className="field-label">Phone Number <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <Phone className="input-icon" size={18} />
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 019-2834"
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

          {/* STEP 2: PROFESSIONAL DETAILS */}
          {step === 2 && (
            <div className="form-step-content fade-in">
              <h3 className="section-title">Step 2: Professional Details & Experience</h3>

              <div className="form-grid">
                <div className="form-group">
                  <label className="field-label">Medical License Number <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <Award className="input-icon" size={18} />
                    <input
                      name="license_no"
                      value={form.license_no}
                      onChange={handleChange}
                      placeholder="e.g. LIC-998877"
                      className={formErrors.license_no ? 'input-error' : ''}
                      required
                    />
                  </div>
                  {formErrors.license_no && <span className="error-text">{formErrors.license_no}</span>}
                </div>

                <div className="form-group">
                  <label className="field-label">Department <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <Briefcase className="input-icon" size={18} />
                    <select
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="field-label">Specialization <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <Stethoscope className="input-icon" size={18} />
                    <input
                      name="specialization"
                      value={form.specialization}
                      onChange={handleChange}
                      placeholder="e.g. Interventional Cardiology"
                      className={formErrors.specialization ? 'input-error' : ''}
                      required
                    />
                  </div>
                  {formErrors.specialization && <span className="error-text">{formErrors.specialization}</span>}
                </div>

                <div className="form-group">
                  <label className="field-label">Qualifications <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <Award className="input-icon" size={18} />
                    <input
                      name="qualification"
                      value={form.qualification}
                      onChange={handleChange}
                      placeholder="e.g. MD, FACC, MBBS"
                      className={formErrors.qualification ? 'input-error' : ''}
                      required
                    />
                  </div>
                  {formErrors.qualification && <span className="error-text">{formErrors.qualification}</span>}
                </div>

                <div className="form-group">
                  <label className="field-label">Years of Experience <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <Briefcase className="input-icon" size={18} />
                    <input
                      name="experience_year"
                      type="number"
                      value={form.experience_year}
                      onChange={handleChange}
                      placeholder="e.g. 12"
                      className={formErrors.experience_year ? 'input-error' : ''}
                      required
                    />
                  </div>
                  {formErrors.experience_year && <span className="error-text">{formErrors.experience_year}</span>}
                </div>

                <div className="form-group">
                  <label className="field-label">Consultation Mode</label>
                  <div className="input-with-icon">
                    <Briefcase className="input-icon" size={18} />
                    <select
                      name="consult_mode"
                      value={form.consult_mode}
                      onChange={handleChange}
                    >
                      <option value="both">Both (Online & Offline)</option>
                      <option value="online">Online Only</option>
                      <option value="offline">Offline Only</option>
                    </select>
                  </div>
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

          {/* STEP 3: WORK HOURS, AVAILABILITY, FEES */}
          {step === 3 && (
            <div className="form-step-content fade-in">
              <h3 className="section-title">Step 3: Consultation Schedule & Fees</h3>

              <div className="form-group full-width">
                <label className="field-label">Clinic / Visit Address <span className="req">*</span></label>
                <div className="input-with-icon">
                  <MapPin className="input-icon" size={18} />
                  <input
                    name="visit_address"
                    value={form.visit_address}
                    onChange={handleChange}
                    placeholder="Suite 400, Medipulse Building, Medical Parkway, NY"
                    className={formErrors.visit_address ? 'input-error' : ''}
                    required
                  />
                </div>
                {formErrors.visit_address && <span className="error-text">{formErrors.visit_address}</span>}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="field-label">Consultation Fee ($) <span className="req">*</span></label>
                  <div className="input-with-icon">
                    <DollarSign className="input-icon" size={18} />
                    <input
                      name="consult_fee"
                      type="number"
                      value={form.consult_fee}
                      onChange={handleChange}
                      placeholder="150"
                      className={formErrors.consult_fee ? 'input-error' : ''}
                      required
                    />
                  </div>
                  {formErrors.consult_fee && <span className="error-text">{formErrors.consult_fee}</span>}
                </div>

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
                  <span>Available Days <span className="req">*</span></span>
                  <span className="info-badge">{availableDays.length} selected</span>
                </label>
                <div className="days-selector-grid">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = availableDays.includes(day);
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
                {formErrors.available_days && <span className="error-text">{formErrors.available_days}</span>}
              </div>

              <div className="verification-toggle-wrapper">
                <div className="toggle-info">
                  <h4>Verify Account Profile</h4>
                  <p>Check if doctor is credentialed and verified for instant scheduling.</p>
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
    </div>
  );
};

export default AddDoctor;
