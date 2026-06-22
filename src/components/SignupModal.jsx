import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Mail, Lock, User, Phone, MapPin,
  Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2,
  ShieldCheck, Zap, Key, X
} from 'lucide-react';
import '../pages/Signup.css';

const SignupModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  // Step 1: Email, Step 2: OTP, Step 3: Details
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setErrorMsg('Please enter an email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`${import.meta.env.VITE_URL}/user/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg('OTP sent successfully! Please check your email.');
        setStep(2);
      } else {
        setErrorMsg(data.message || 'Failed to send OTP.');
      }
    } catch {
      setErrorMsg('Connection error. Is the backend server running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setErrorMsg('Please enter the OTP.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`${import.meta.env.VITE_URL}/user/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg('Email verified successfully!');
        setStep(3);
      } else {
        setErrorMsg(data.message || 'Invalid OTP.');
      }
    } catch {
      setErrorMsg('Connection error. Is the backend server running?');
    } finally {
      setIsLoading(false);
    }
  };

  const validate = () => {
    const { first_name, last_name, email, password, confirmPassword, phone } = formData;
    if (!first_name || !last_name || !email || !password || !confirmPassword || !phone)
      return 'Please fill in all required fields.';
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) return 'Phone number must be exactly 10 digits.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setErrorMsg(validationError); return; }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { confirmPassword: _, ...payload } = formData;
      const response = await fetch(`${import.meta.env.VITE_URL}/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg('Account created successfully! You can now login.');
        setTimeout(() => {
          onClose();
          navigate('/login');
        }, 2000);
      } else {
        setErrorMsg(data.message || 'Registration failed. Please try again.');
      }
    } catch {
      setErrorMsg('Connection error. Is the backend server running?');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = formData.password;
    if (!p) return null;
    if (p.length < 6) return 'weak';
    if (p.length >= 10 && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)) return 'strong';
    if (p.length >= 8) return 'medium';
    return 'weak';
  };

  const strength = passwordStrength();

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={onClose}>
      <div className="signup-card" style={{ zIndex: 1001, position: 'relative', margin: 'auto', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={onClose}>
          <X size={20} />
        </button>

        {/* ── Top brand bar ── */}
        <div className="signup-brand">
          <div className="signup-logo">
            <img src="/img/logo.jpeg" alt="MediPulse Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain' }} />
          </div>
          <span className="signup-brand-name">MediPulse</span>
        </div>

        {/* ── Header ── */}
        <div className="signup-header">
          <h1>Create your account</h1>
          <p>
            {step === 1 && "Step 1: Enter your email address"}
            {step === 2 && "Step 2: Verify your email"}
            {step === 3 && "Step 3: Complete your details"}
          </p>
        </div>

        {/* ── Alerts ── */}
        {errorMsg && (
          <div className="signup-alert error" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="signup-alert success" role="alert">
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── Form ── */}
        {step === 1 && (
          <form className="signup-form" onSubmit={handleSendOtp} noValidate>
            <div className="signup-field">
              <label htmlFor="email">Email Address <span className="req">*</span></label>
              <div className="field-wrap">
                <Mail size={15} className="field-icon" />
                <input id="email" name="email" type="email"
                  placeholder="you@example.com" value={formData.email}
                  onChange={handleChange} required autoComplete="email" />
              </div>
            </div>
            <button id="signup-submit-btn" type="submit" className="signup-button" disabled={isLoading}>
              {isLoading
                ? <><span className="spinner" /> Sending OTP…</>
                : <>Send OTP <ArrowRight size={17} /></>}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="signup-form" onSubmit={handleVerifyOtp} noValidate>
            <div className="signup-field">
              <label htmlFor="email">Email Address</label>
              <div className="field-wrap">
                <Mail size={15} className="field-icon" />
                <input id="email" name="email" type="email"
                  value={formData.email} disabled />
              </div>
            </div>
            <div className="signup-field">
              <label htmlFor="otp">Enter Verification Code <span className="req">*</span></label>
              <div className="field-wrap">
                <Key size={15} className="field-icon" />
                <input id="otp" name="otp" type="text"
                  placeholder="6-digit code" value={otp}
                  onChange={(e) => { setOtp(e.target.value); setErrorMsg(''); }} required />
              </div>
            </div>
            <button id="signup-submit-btn" type="submit" className="signup-button" disabled={isLoading}>
              {isLoading
                ? <><span className="spinner" /> Verifying…</>
                : <>Verify OTP <ArrowRight size={17} /></>}
            </button>
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button type="button" onClick={handleSendOtp} disabled={isLoading} style={{ background: 'none', border: 'none', color: '#14b8a6', cursor: 'pointer', textDecoration: 'underline' }}>
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form className="signup-form" onSubmit={handleSubmit} noValidate>

            {/* Row: First + Last Name */}
            <div className="form-row">
              <div className="signup-field">
                <label htmlFor="first_name">First Name <span className="req">*</span></label>
                <div className="field-wrap">
                  <User size={15} className="field-icon" />
                  <input id="first_name" name="first_name" type="text"
                    placeholder="John" value={formData.first_name}
                    onChange={handleChange} required autoComplete="given-name" />
                </div>
              </div>
              <div className="signup-field">
                <label htmlFor="last_name">Last Name <span className="req">*</span></label>
                <div className="field-wrap">
                  <User size={15} className="field-icon" />
                  <input id="last_name" name="last_name" type="text"
                    placeholder="Doe" value={formData.last_name}
                    onChange={handleChange} required autoComplete="family-name" />
                </div>
              </div>
            </div>

            {/* Email (Disabled in step 3 as it's already verified) */}
            <div className="signup-field">
              <label htmlFor="email">Email Address <span className="req">*</span> <span style={{color: '#14b8a6', fontSize: '0.8em'}}>(Verified)</span></label>
              <div className="field-wrap">
                <Mail size={15} className="field-icon" />
                <input id="email" name="email" type="email"
                  value={formData.email} disabled />
              </div>
            </div>

            {/* Row: Phone + Address */}
            <div className="form-row">
              <div className="signup-field">
                <label htmlFor="phone">Phone Number <span className="req">*</span></label>
                <div className="field-wrap">
                  <Phone size={15} className="field-icon" />
                  <input id="phone" name="phone" type="tel"
                    placeholder="10-digit number" value={formData.phone}
                    onChange={handleChange} maxLength={10} required autoComplete="tel" />
                </div>
              </div>
              <div className="signup-field">
                <label htmlFor="address">Address <span className="optional">(optional)</span></label>
                <div className="field-wrap">
                  <MapPin size={15} className="field-icon" />
                  <input id="address" name="address" type="text"
                    placeholder="Your home address" value={formData.address}
                    onChange={handleChange} autoComplete="street-address" />
                </div>
              </div>
            </div>

            {/* Row: Password + Confirm */}
            <div className="form-row">
              <div className="signup-field">
                <label htmlFor="password">Password <span className="req">*</span></label>
                <div className="field-wrap">
                  <Lock size={15} className="field-icon" />
                  <input id="password" name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters" value={formData.password}
                    onChange={handleChange} required autoComplete="new-password" />
                  <button type="button" className="eye-btn"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {strength && (
                  <div className="strength-wrap">
                    <div className="strength-track">
                      <div className={`strength-bar ${strength}`} />
                    </div>
                    <span className={`strength-label ${strength}`}>
                      {strength === 'weak' ? 'Weak' : strength === 'medium' ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              <div className="signup-field">
                <label htmlFor="confirmPassword">Confirm Password <span className="req">*</span></label>
                <div className="field-wrap">
                  <Lock size={15} className="field-icon" />
                  <input id="confirmPassword" name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter password" value={formData.confirmPassword}
                    onChange={handleChange} required autoComplete="new-password" />
                  <button type="button" className="eye-btn"
                    onClick={() => setShowConfirm(v => !v)}
                    aria-label="Toggle confirm password visibility">
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button id="signup-submit-btn" type="submit" className="signup-button" disabled={isLoading}>
              {isLoading
                ? <><span className="spinner" /> Creating account…</>
                : <>Create Account <ArrowRight size={17} /></>}
            </button>

          </form>
        )}

        {/* ── Footer ── */}
        <p className="login-redirect">
          Already have an account?{' '}
          <button type="button" className="login-link" onClick={() => { onClose(); navigate('/login'); }} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>Sign In</button>
        </p>

        {/* Trust badges */}
        <div className="trust-row">
          <span className="trust-badge"><ShieldCheck size={12} color="#14b8a6" /> SSL Secured</span>
          <span className="trust-badge"><CheckCircle2 size={12} color="#14b8a6" /> HIPAA Compliant</span>
          <span className="trust-badge"><Zap size={12} color="#14b8a6" /> Instant Access</span>
        </div>

      </div>
    </div>
  );
};

export default SignupModal;
