import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import SignupModal from '../components/SignupModal';
import './UserLogin.css';

import Header from '../components/Header';

const UserLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  // --- Forgot Password States ---
  const [isForgotPassword, setIsForgotPassword] = useState(location.state?.forgotPassword || false);
  const [fpStep, setFpStep] = useState(1);
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpSuccessMsg, setFpSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setFpSuccessMsg('');

    try {
      const response = await fetch(`${import.meta.env.VITE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', data.user?.first_name || email.split('@')[0]);
        navigate('/user/dashboard');
      } else {
        setErrorMsg(data.message || 'Invalid email or password. Please try again.');
      }
    } catch {
      setErrorMsg('Connection error. Please make sure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!fpEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setFpLoading(true);
    setErrorMsg('');
    setFpSuccessMsg('');

    try {
      const response = await fetch(`${import.meta.env.VITE_URL}/user/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        setFpSuccessMsg('OTP sent! Please check your email inbox.');
        setFpStep(2);
      } else {
        setErrorMsg(data.message || 'Failed to send OTP.');
      }
    } catch {
      setErrorMsg('Connection error. Please make sure the server is running.');
    } finally {
      setFpLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!fpOtp || !fpNewPassword) {
      setErrorMsg('Please enter both OTP and new password.');
      return;
    }
    setFpLoading(true);
    setErrorMsg('');
    setFpSuccessMsg('');

    try {
      const response = await fetch(`${import.meta.env.VITE_URL}/user/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail, otp: fpOtp, newPassword: fpNewPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setFpSuccessMsg('Password reset successfully! You can now sign in.');
        setIsForgotPassword(false);
        setFpStep(1);
        setFpEmail('');
        setFpOtp('');
        setFpNewPassword('');
      } else {
        setErrorMsg(data.message || 'Failed to reset password.');
      }
    } catch {
      setErrorMsg('Connection error. Please make sure the server is running.');
    } finally {
      setFpLoading(false);
    }
  };

  return (
    <div className="ul-container">
      <Header />
      {/* Animated blobs */}
      <div className="ul-blob ul-blob-1" />
      <div className="ul-blob ul-blob-2" />
      <div className="ul-blob ul-blob-3" />

      <div className="ul-card">

        {/* Brand */}
        <div className="ul-brand">
          <div className="ul-logo">
            <img src="/img/logo.jpeg" alt="MediPulse Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain' }} />
          </div>
          <span className="ul-brand-name">MediPulse</span>
        </div>

        {/* Header */}
        <div className="ul-header">
          <h1>{isForgotPassword ? 'Reset Password' : 'Welcome back'}</h1>
          <p>
            {isForgotPassword 
              ? (fpStep === 1 ? 'Enter your email to receive a verification code' : 'Enter the code and your new password')
              : 'Sign in to manage your health & appointments'}
          </p>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="ul-alert" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success alert */}
        {fpSuccessMsg && (
          <div className="ul-alert" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }} role="alert">
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{fpSuccessMsg}</span>
          </div>
        )}

        {/* Form */}
        {isForgotPassword ? (
          fpStep === 1 ? (
            <form className="ul-form" onSubmit={handleSendOtp} noValidate>
              <div className="ul-field">
                <label htmlFor="fp-email">Email Address</label>
                <div className="ul-field-wrap">
                  <Mail size={15} className="ul-field-icon" />
                  <input
                    id="fp-email"
                    type="email"
                    placeholder="you@example.com"
                    value={fpEmail}
                    onChange={(e) => { setFpEmail(e.target.value); setErrorMsg(''); }}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="ul-button" disabled={fpLoading}>
                {fpLoading ? <><span className="ul-spinner" /> Sending OTP…</> : <>Send OTP <ArrowRight size={17} /></>}
              </button>
              <button 
                type="button" 
                className="ul-button" 
                style={{ background: '#f1f5f9', color: '#475569', marginTop: '10px' }} 
                onClick={() => { setIsForgotPassword(false); setErrorMsg(''); setFpSuccessMsg(''); }}
              >
                Back to Sign In
              </button>
            </form>
          ) : (
            <form className="ul-form" onSubmit={handleResetPassword} noValidate>
              <div className="ul-field">
                <label htmlFor="fp-otp">Verification Code (OTP)</label>
                <div className="ul-field-wrap">
                  <ShieldCheck size={15} className="ul-field-icon" />
                  <input
                    id="fp-otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={fpOtp}
                    onChange={(e) => { setFpOtp(e.target.value); setErrorMsg(''); }}
                    required
                  />
                </div>
              </div>
              <div className="ul-field">
                <label htmlFor="fp-new-password">New Password</label>
                <div className="ul-field-wrap">
                  <Lock size={15} className="ul-field-icon" />
                  <input
                    id="fp-new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your new password"
                    value={fpNewPassword}
                    onChange={(e) => { setFpNewPassword(e.target.value); setErrorMsg(''); }}
                    required
                  />
                  <button type="button" className="ul-eye-btn" onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="ul-button" disabled={fpLoading}>
                {fpLoading ? <><span className="ul-spinner" /> Resetting…</> : <>Reset Password <CheckCircle2 size={17} /></>}
              </button>
              <button 
                type="button" 
                className="ul-button" 
                style={{ background: '#f1f5f9', color: '#475569', marginTop: '10px' }} 
                onClick={() => { setFpStep(1); setErrorMsg(''); setFpSuccessMsg(''); }}
              >
                Back
              </button>
            </form>
          )
        ) : (
          <form className="ul-form" onSubmit={handleLogin} noValidate>
            {/* Email */}
            <div className="ul-field">
              <label htmlFor="ul-email">Email Address</label>
              <div className="ul-field-wrap">
                <Mail size={15} className="ul-field-icon" />
                <input
                  id="ul-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); setFpSuccessMsg(''); }}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="ul-field">
              <div className="ul-label-row">
                <label htmlFor="ul-password">Password</label>
                <button 
                  type="button" 
                  className="ul-forgot" 
                  style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
                  onClick={() => { setIsForgotPassword(true); setErrorMsg(''); setFpSuccessMsg(''); }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="ul-field-wrap">
                <Lock size={15} className="ul-field-icon" />
                <input
                  id="ul-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); setFpSuccessMsg(''); }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="ul-eye-btn"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="user-login-submit-btn"
              type="submit"
              className="ul-button"
              disabled={isLoading}
            >
              {isLoading
                ? <><span className="ul-spinner" /> Signing in…</>
                : <>Sign In <ArrowRight size={17} /></>
              }
            </button>
          </form>
        )}

        {/* Signup redirect */}
        <p className="ul-redirect">
          Don&apos;t have an account?{' '}
          <button type="button" className="ul-redirect-link" onClick={() => setIsSignupModalOpen(true)} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>Create one free →</button>
        </p>

        {/* Trust badges */}
        <div className="ul-trust-row">
          <span className="ul-trust-badge">
            <ShieldCheck size={12} color="#14b8a6" /> SSL Secured
          </span>
          <span className="ul-trust-badge">
            <CheckCircle2 size={12} color="#14b8a6" /> HIPAA Compliant
          </span>
        </div>

      </div>

      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
      />
    </div>
  );
};

export default UserLogin;
