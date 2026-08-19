import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import './DoctorLogin.css';

import Header from '../components/Header';

const API = import.meta.env.VITE_URL || 'http://localhost:4000/api';

const DoctorLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- Forgot Password States ---
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API}/doctor/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const rawName = `${data.doctor?.first_name || ''} ${data.doctor?.last_name || ''}`.trim() || email.split('@')[0];
        const docName = rawName.replace(/^(dr\.\s*|dr\s+)/i, '');
        sessionStorage.setItem('doctorToken', data.token);
        sessionStorage.setItem('doctorEmail', email);
        sessionStorage.setItem('doctorName', docName);
        localStorage.setItem('doctorToken', data.token);
        localStorage.setItem('doctorEmail', email);
        localStorage.setItem('doctorName', docName);
        navigate('/doctor/dashboard');
      } else {
        setErrorMsg(data.message || 'Invalid email or password. Please try again.');
      }
    } catch {
      setErrorMsg('Connection error. Please make sure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Forgot Password Handlers ---
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotEmail || !newPassword) {
      setForgotError('Both email and new password are required');
      return;
    }

    setIsForgotLoading(true);

    try {
      const res = await fetch(`${API}/doctor/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, newPassword })
      });
      const data = await res.json();

      if (res.ok) {
        setForgotSuccess('Password reset successfully! You can now login.');
        setTimeout(() => {
          setShowForgot(false);
          setForgotEmail('');
          setNewPassword('');
          setForgotSuccess('');
        }, 3000);
      } else {
        setForgotError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setForgotError('Network error. Try again.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="dl-container">
      <Header />
      <div className="dl-blob dl-blob-1" />
      <div className="dl-blob dl-blob-2" />
      <div className="dl-blob dl-blob-3" />

      <div className="dl-card">
        <div className="dl-brand">
          <div className="dl-logo">
            <img src="/img/logo.jpeg" alt="MediPulse Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain' }} />
          </div>
          <span className="dl-brand-name">MediPulse Doctor Portal</span>
        </div>

        {/* --- Main Login Form --- */}
        {!showForgot ? (
          <>
            <div className="dl-header">
              <h1>Welcome, Doctor</h1>
              <p>Sign in to manage your appointments and profile</p>
            </div>

            {errorMsg && (
              <div className="dl-alert" role="alert">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form className="dl-form" onSubmit={handleLogin} noValidate>
              <div className="dl-field">
                <label htmlFor="dl-email">Email Address</label>
                <div className="dl-field-wrap">
                  <Mail size={15} className="dl-field-icon" />
                  <input
                    id="dl-email"
                    type="email"
                    placeholder="doctor@medipulse.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="dl-field">
                <div className="dl-label-row">
                  <label htmlFor="dl-password">Password</label>
                  <button type="button" className="dl-forgot" onClick={() => { setShowForgot(true); setForgotSuccess(''); setForgotError(''); }}>
                    Forgot password?
                  </button>
                </div>
                <div className="dl-field-wrap">
                  <Lock size={15} className="dl-field-icon" />
                  <input
                    id="dl-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="dl-eye-btn"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                id="doctor-login-submit-btn"
                type="submit"
                className="dl-button"
                disabled={isLoading}
              >
                {isLoading
                  ? <><span className="dl-spinner" /> Signing in…</>
                  : <>Sign In <ArrowRight size={17} /></>
                }
              </button>
            </form>
          </>
        ) : (
          /* --- Forgot Password Flow (No OTP) --- */
          <div className="dl-forgot-flow">
            <div className="dl-header">
              <h1>Reset Password</h1>
              <p>Enter your email and a new password</p>
            </div>

            {forgotError && (
              <div className="dl-alert" role="alert">
                <AlertCircle size={16} /> <span>{forgotError}</span>
              </div>
            )}
            {forgotSuccess && (
              <div className="dl-alert dl-alert-success" role="alert">
                <CheckCircle2 size={16} /> <span>{forgotSuccess}</span>
              </div>
            )}

            <form className="dl-form" onSubmit={handleForgotSubmit}>
              <div className="dl-field">
                <label>Email Address</label>
                <div className="dl-field-wrap">
                  <Mail size={15} className="dl-field-icon" />
                  <input
                    type="email"
                    placeholder="doctor@medipulse.com"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); }}
                    required
                  />
                </div>
              </div>

              <div className="dl-field">
                <label>New Password</label>
                <div className="dl-field-wrap">
                  <Lock size={15} className="dl-field-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setForgotError(''); }}
                    required
                  />
                  <button
                    type="button"
                    className="dl-eye-btn"
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="dl-button" disabled={isForgotLoading}>
                {isForgotLoading ? (
                  <><span className="dl-spinner" /> Processing…</>
                ) : (
                  <>Reset Password <ArrowRight size={17} /></>
                )}
              </button>

              <button
                type="button"
                className="dl-btn-text"
                onClick={() => { setShowForgot(false); setForgotError(''); setForgotSuccess(''); }}
              >
                Back to Login
              </button>
            </form>
          </div>
        )}

        <div className="dl-trust-row">
          <span className="dl-trust-badge">
            <ShieldCheck size={12} color="#0284c7" /> Verified Portal
          </span>
          <span className="dl-trust-badge">
            <CheckCircle2 size={12} color="#0284c7" /> Staff Only
          </span>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;
