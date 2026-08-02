import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import './PharmacistLogin.css';

import Header from '../components/Header';

const PharmacistLogin = () => {
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
  const [showNewPassword, setShowNewPassword] = useState(false);
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
      const response = await fetch(`${import.meta.env.VITE_URL}/pharmacist/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('pharmacistToken', data.token);
        localStorage.setItem('pharmacistEmail', email);
        localStorage.setItem('pharmacistName', data.pharmacist?.first_name || email.split('@')[0]);
        navigate('/pharmacist/dashboard');
      } else {
        setErrorMsg(data.message || 'Invalid email or password. Please try again.');
      }
    } catch {
      setErrorMsg('Connection error. Please make sure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Forgot Password Submit Handler ---
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotEmail || !newPassword) {
      setForgotError('Please enter both your registered email and a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    setIsForgotLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_URL}/pharmacist/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, newPassword })
      });
      const data = await res.json();

      if (res.ok) {
        setForgotSuccess(data.message || 'Password reset successfully! Auto-switching to login...');
        setEmail(forgotEmail);
        setPassword(newPassword);
        setTimeout(() => {
          setShowForgot(false);
          setForgotEmail('');
          setNewPassword('');
          setForgotSuccess('');
        }, 1400);
      } else {
        setForgotError(data.message || 'Failed to reset password');
      }
    } catch {
      setForgotError('Connection error. Please check server connection.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="pl-container">
      <Header />
      <div className="pl-blob pl-blob-1" />
      <div className="pl-blob pl-blob-2" />
      <div className="pl-blob pl-blob-3" />

      <div className="pl-card">
        <div className="pl-brand">
          <div className="pl-logo">
            <img src="/img/logo.jpeg" alt="MediPulse Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain' }} />
          </div>
          <span className="pl-brand-name">MediPulse Pharmacist Portal</span>
        </div>

        {!showForgot ? (
          /* ── Login Form ── */
          <>
            <div className="pl-header">
              <h1>Welcome, Pharmacist</h1>
              <p>Sign in to manage pharmacy tasks and view appointments</p>
            </div>

            {errorMsg && (
              <div className="pl-alert" role="alert">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form className="pl-form" onSubmit={handleLogin} noValidate>
              <div className="pl-field">
                <label htmlFor="pl-email">Email Address</label>
                <div className="pl-field-wrap">
                  <Mail size={15} className="pl-field-icon" />
                  <input
                    id="pl-email"
                    type="email"
                    placeholder="pharmacist@medipulse.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="pl-field">
                <div className="pl-label-row">
                  <label htmlFor="pl-password">Password</label>
                  <button
                    type="button"
                    className="pl-forgot"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={() => {
                      setShowForgot(true);
                      setForgotEmail(email);
                      setErrorMsg('');
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="pl-field-wrap">
                  <Lock size={15} className="pl-field-icon" />
                  <input
                    id="pl-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="pl-eye-btn"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                id="pharmacist-login-submit-btn"
                type="submit"
                className="pl-button"
                disabled={isLoading}
              >
                {isLoading
                  ? <><span className="pl-spinner" /> Signing in…</>
                  : <>Sign In <ArrowRight size={17} /></>
                }
              </button>
            </form>
          </>
        ) : (
          /* ── Forgot Password Form ── */
          <div className="pl-forgot-flow">
            <div className="pl-header">
              <h1>Reset Password</h1>
              <p>Enter your registered pharmacist email and a new password</p>
            </div>

            {forgotError && (
              <div className="pl-alert" role="alert">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{forgotError}</span>
              </div>
            )}
            {forgotSuccess && (
              <div className="pl-alert pl-alert-success" role="alert">
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{forgotSuccess}</span>
              </div>
            )}

            <form className="pl-form" onSubmit={handleForgotSubmit} noValidate>
              <div className="pl-field">
                <label htmlFor="pl-forgot-email">Registered Email Address</label>
                <div className="pl-field-wrap">
                  <Mail size={15} className="pl-field-icon" />
                  <input
                    id="pl-forgot-email"
                    type="email"
                    placeholder="pharmacist@medipulse.com"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); }}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="pl-field">
                <label htmlFor="pl-new-password">New Password</label>
                <div className="pl-field-wrap">
                  <Lock size={15} className="pl-field-icon" />
                  <input
                    id="pl-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setForgotError(''); }}
                    required
                  />
                  <button
                    type="button"
                    className="pl-eye-btn"
                    onClick={() => setShowNewPassword(v => !v)}
                    aria-label="Toggle password visibility"
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="pl-button"
                disabled={isForgotLoading}
              >
                {isForgotLoading
                  ? <><span className="pl-spinner" /> Updating password…</>
                  : <>Set New Password <ArrowRight size={17} /></>
                }
              </button>

              <button
                type="button"
                className="pl-btn-text"
                onClick={() => { setShowForgot(false); setForgotError(''); setForgotSuccess(''); }}
              >
                ← Back to Sign In
              </button>
            </form>
          </div>
        )}

        <div className="pl-trust-row">
          <span className="pl-trust-badge">
            <ShieldCheck size={12} color="#0d9488" /> Verified Portal
          </span>
          <span className="pl-trust-badge">
            <CheckCircle2 size={12} color="#0d9488" /> Staff Only
          </span>
        </div>
      </div>
    </div>
  );
};

export default PharmacistLogin;
