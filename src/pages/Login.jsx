import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

import './Login.css';

import Header from '../components/Header';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- Forgot Password States ---
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail && password) {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const response = await fetch(`${import.meta.env.VITE_URL}/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password })
        });
        const data = await response.json();
        
        if (response.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('adminEmail', cleanEmail);
          localStorage.setItem('adminName', cleanEmail.split('@')[0] || 'Admin');
          navigate('/admin/dashboard');
        } else {
          setErrorMsg(data.message || 'Invalid email or password. Please check your credentials.');
        }
      } catch (error) {
        setErrorMsg('Connection error. Is the backend server running?');
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrorMsg('Please enter both email and password.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !forgotNewPassword) {
      setForgotErrorMsg('Please enter both registered email and new password.');
      return;
    }
    if (forgotNewPassword.length < 4) {
      setForgotErrorMsg('New password must be at least 4 characters long.');
      return;
    }

    setForgotLoading(true);
    setForgotErrorMsg('');
    setForgotSuccessMsg('');

    try {
      const response = await fetch(`${import.meta.env.VITE_URL}/admin/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, newPassword: forgotNewPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setForgotSuccessMsg(data.message || 'Password reset successfully! Redirecting to login...');
        setEmail(cleanEmail);
        setPassword(forgotNewPassword);
        setTimeout(() => {
          setIsForgotMode(false);
          setForgotEmail('');
          setForgotNewPassword('');
          setForgotSuccessMsg('');
        }, 1500);
      } else {
        setForgotErrorMsg(data.message || 'Failed to reset password.');
      }
    } catch (error) {
      setForgotErrorMsg('Connection error. Is the backend server running?');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleFillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <div className="login-container">
      <Header />
      {/* Animated Background Elements */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <Activity className="logo-icon" size={36} strokeWidth={2.5} />
          </div>
          <h2>{isForgotMode ? 'Reset Password' : 'Welcome Back'}</h2>
          <p>{isForgotMode ? 'Enter your admin email and a new password' : 'Sign in to Medipulse Admin Portal'}</p>
        </div>
        
        {!isForgotMode ? (
          /* ── LOGIN FORM ── */
          <>
            {errorMsg && (
              <div className="login-alert-banner">
                <AlertCircle size={20} className="alert-icon" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <input 
                  type="email" 
                  id="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Email address"
                  required 
                />
                <Mail className="input-icon" size={20} />
              </div>
              
              <div className="form-group">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Password"
                  required 
                />
                <Lock className="input-icon" size={20} />
                <button
                  type="button"
                  className="password-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div style={{ textAlign: 'right', marginTop: '-12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(true);
                    setErrorMsg('');
                    setForgotEmail(email);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0d9488',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <button type="submit" className="login-button" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="demo-credentials-card" style={{ marginTop: '24px', padding: '12px 16px', background: 'rgba(241, 245, 249, 0.8)', borderRadius: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🔑 Admin Credentials:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button 
                  type="button"
                  onClick={() => handleFillDemo('mandeep@gmail.com', 'admin123')}
                  style={{ padding: '6px 14px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Mandeep Kaur (mandeep@gmail.com)
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ── FORGOT PASSWORD FORM ── */
          <>
            {forgotErrorMsg && (
              <div className="login-alert-banner">
                <AlertCircle size={20} className="alert-icon" />
                <span>{forgotErrorMsg}</span>
              </div>
            )}

            {forgotSuccessMsg && (
              <div className="login-alert-banner" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                <AlertCircle size={20} className="alert-icon" style={{ color: '#15803d' }} />
                <span>{forgotSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="login-form">
              <div className="form-group">
                <input 
                  type="email" 
                  value={forgotEmail} 
                  onChange={(e) => setForgotEmail(e.target.value)} 
                  placeholder="Registered Admin Email"
                  required 
                />
                <Mail className="input-icon" size={20} />
              </div>

              <div className="form-group">
                <input 
                  type={showForgotPwd ? 'text' : 'password'} 
                  value={forgotNewPassword} 
                  onChange={(e) => setForgotNewPassword(e.target.value)} 
                  placeholder="Enter New Password"
                  required 
                />
                <Lock className="input-icon" size={20} />
                <button
                  type="button"
                  className="password-eye-btn"
                  onClick={() => setShowForgotPwd(!showForgotPwd)}
                  tabIndex={-1}
                >
                  {showForgotPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button type="submit" className="login-button" disabled={forgotLoading}>
                {forgotLoading ? 'Updating Password...' : 'Reset Password'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(false);
                    setForgotErrorMsg('');
                    setForgotSuccessMsg('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
};

export default Login;
