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

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (email && password) {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const response = await fetch(`${import.meta.env.VITE_URL}/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        
        if (response.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('adminEmail', email);
          localStorage.setItem('adminName', email.split('@')[0] || 'Admin');
          navigate('/admin/dashboard');
        } else {
          setErrorMsg(data.message || 'Login failed. Please check your credentials.');
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
          <h2>Welcome Back</h2>
          <p>Sign in to Medipulse Admin Portal</p>
        </div>
        
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


          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;
