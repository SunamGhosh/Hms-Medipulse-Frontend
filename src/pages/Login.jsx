import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, ArrowRight } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      setIsLoading(true);
      // Simulate API call for animation effect
      setTimeout(() => {
        setIsLoading(false);
        // Store admin details
        localStorage.setItem('adminEmail', email);
        localStorage.setItem('adminName', email.split('@')[0] || 'Admin');
        navigate('/admin/dashboard');
      }, 800);
    }
  };

  return (
    <div className="login-container">
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
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Password"
              required 
            />
            <Lock className="input-icon" size={20} />
          </div>

          <a href="#" className="forgot-password">Forgot password?</a>

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
