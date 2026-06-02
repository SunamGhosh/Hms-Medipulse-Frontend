import React, { useState } from 'react';
import { X, Stethoscope, Users, Pill, Activity, Mail, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './RoleSelectionModal.css';

const RoleSelectionModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUserLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        localStorage.setItem('adminEmail', email);
        localStorage.setItem('adminName', email.split('@')[0] || 'User');
        navigate('/admin/dashboard');
        onClose();
      }, 800);
    }
  };

  const handleRoleSelect = (role) => {
    navigate('/login', { state: { role } });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className="modal-logo-wrapper">
            <Activity size={32} className="modal-logo-icon" strokeWidth={3} />
          </div>
          <h2 className="modal-title">Welcome to MediPulse</h2>
          <p className="modal-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleUserLogin} className="modal-login-form">
          <div className="form-group">
            <input 
              type="email" 
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
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Password"
              required 
            />
            <Lock className="input-icon" size={20} />
          </div>

          <div className="forgot-password-modal">
            <a href="#">Forgot password?</a>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="other-roles-divider">
          <span>Or login as</span>
        </div>

        <div className="quick-roles-row">
          <button className="quick-role-card role-doctor" onClick={() => handleRoleSelect('doctor')}>
            <div className="quick-role-icon">
              <Stethoscope size={20} />
            </div>
            <span>Doctor</span>
          </button>
          <button className="quick-role-card role-patient" onClick={() => handleRoleSelect('patient')}>
            <div className="quick-role-icon">
              <Users size={20} />
            </div>
            <span>Patient</span>
          </button>
          <button className="quick-role-card role-pharmacy" onClick={() => handleRoleSelect('pharmacist')}>
            <div className="quick-role-icon">
              <Pill size={20} />
            </div>
            <span>Pharmacist</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
