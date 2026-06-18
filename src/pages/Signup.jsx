import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Activity,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const validate = () => {
    const { first_name, last_name, email, password, confirmPassword, phone } = formData;
    if (!first_name || !last_name || !email || !password || !confirmPassword || !phone)
      return 'Please fill in all required fields.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address.';
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
        setSuccessMsg('Account created successfully! Redirecting to login…');
        setTimeout(() => navigate('/login'), 2000);
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
    <div className="signup-container">
      {/* Animated background blobs */}
      <div className="sb sb-1" />
      <div className="sb sb-2" />
      <div className="sb sb-3" />

      <div className="signup-card">

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
          <p>Join thousands managing their health smarter</p>
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

          {/* Email */}
          <div className="signup-field">
            <label htmlFor="email">Email Address <span className="req">*</span></label>
            <div className="field-wrap">
              <Mail size={15} className="field-icon" />
              <input id="email" name="email" type="email"
                placeholder="you@example.com" value={formData.email}
                onChange={handleChange} required autoComplete="email" />
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

        {/* ── Footer ── */}
        <p className="login-redirect">
          Already have an account?{' '}
          <Link to="/login" className="login-link">Sign In</Link>
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

export default Signup;
