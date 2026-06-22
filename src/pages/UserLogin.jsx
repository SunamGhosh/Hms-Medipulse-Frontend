import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

const UserLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

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

  return (
    <div className="ul-container">
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
          <h1>Welcome back</h1>
          <p>Sign in to manage your health & appointments</p>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="ul-alert" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
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
                onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="ul-field">
            <div className="ul-label-row">
              <label htmlFor="ul-password">Password</label>
              <a href="#" className="ul-forgot">Forgot password?</a>
            </div>
            <div className="ul-field-wrap">
              <Lock size={15} className="ul-field-icon" />
              <input
                id="ul-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
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
