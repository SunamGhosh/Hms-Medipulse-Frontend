import React, { useState, useEffect } from 'react';
import { User, Lock, Bell, Monitor, Save, Shield, Hospital, Mail, Phone, Sun, Moon, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import './AdminSettings.css';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Form States
  const [profileData, setProfileData] = useState({
    name: 'Admin User',
    email: 'admin@medipulse.com'
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false
  });

  const [hospitalInfo, setHospitalInfo] = useState({
    hospitalName: 'MEDIPULSE Hospital',
    contactEmail: 'support@medipulse.com',
    supportPhone: '+1 (555) 123-4567',
    address: '123 Health Ave, Medical City, MC 10001'
  });

  // Load basic admin details on mount
  useEffect(() => {
    const storedName = localStorage.getItem('adminName');
    const storedEmail = localStorage.getItem('adminEmail');
    if (storedName) setProfileData(prev => ({ ...prev, name: storedName }));
    if (storedEmail) setProfileData(prev => ({ ...prev, email: storedEmail }));
    
    // Load local preferences if any
    const savedPrefs = localStorage.getItem('adminPreferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
  }, []);

  const handleProfileSave = (e) => {
    e.preventDefault();
    setLoading(true);
    // Mock save
    setTimeout(() => {
      localStorage.setItem('adminName', profileData.name);
      localStorage.setItem('adminEmail', profileData.email);
      toast.success('Profile updated successfully');
      setLoading(false);
    }, 800);
  };

  const handleSecuritySave = (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
      setLoading(false);
    }, 800);
  };

  const handlePreferencesSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('adminPreferences', JSON.stringify(preferences));
      toast.success('Preferences saved');
      setLoading(false);
    }, 500);
  };

  const handleHospitalSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success('Hospital details updated');
      setLoading(false);
    }, 800);
  };

  return (
    <div className="admin-settings-container">
      <div className="as-header">
        <div className="as-title-box">
          <div className="as-title-icon"><Settings size={28} strokeWidth={2} /></div>
          <div>
            <h2>Admin Settings</h2>
            <p>Manage your account preferences and system configuration.</p>
          </div>
        </div>
      </div>

      <div className="as-layout">
        <div className="as-sidebar">
          <button 
            className={`as-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> Profile Settings
          </button>
          <button 
            className={`as-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={18} /> Security
          </button>
          <button 
            className={`as-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Monitor size={18} /> Preferences
          </button>
          <button 
            className={`as-tab-btn ${activeTab === 'hospital' ? 'active' : ''}`}
            onClick={() => setActiveTab('hospital')}
          >
            <Hospital size={18} /> Hospital Configuration
          </button>
        </div>

        <div className="as-content">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="as-card fade-in">
              <h3>Profile Information</h3>
              <p className="as-subtitle">Update your account's basic information.</p>
              
              <form onSubmit={handleProfileSave}>
                <div className="as-form-group">
                  <label>Full Name</label>
                  <div className="as-input-wrap">
                    <User className="as-input-icon" size={16} />
                    <input 
                      type="text" 
                      value={profileData.name} 
                      onChange={e => setProfileData({...profileData, name: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="as-form-group">
                  <label>Email Address</label>
                  <div className="as-input-wrap">
                    <Mail className="as-input-icon" size={16} />
                    <input 
                      type="email" 
                      value={profileData.email} 
                      onChange={e => setProfileData({...profileData, email: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                <div className="as-form-actions">
                  <button type="submit" className="as-btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="as-card fade-in">
              <h3>Security Settings</h3>
              <p className="as-subtitle">Ensure your account is using a long, random password to stay secure.</p>
              
              <form onSubmit={handleSecuritySave}>
                <div className="as-form-group">
                  <label>Current Password</label>
                  <div className="as-input-wrap">
                    <Lock className="as-input-icon" size={16} />
                    <input 
                      type="password" 
                      value={securityData.currentPassword} 
                      onChange={e => setSecurityData({...securityData, currentPassword: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="as-form-group">
                  <label>New Password</label>
                  <div className="as-input-wrap">
                    <Lock className="as-input-icon" size={16} />
                    <input 
                      type="password" 
                      value={securityData.newPassword} 
                      onChange={e => setSecurityData({...securityData, newPassword: e.target.value})} 
                      required 
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="as-form-group">
                  <label>Confirm New Password</label>
                  <div className="as-input-wrap">
                    <Lock className="as-input-icon" size={16} />
                    <input 
                      type="password" 
                      value={securityData.confirmPassword} 
                      onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                <div className="as-form-actions">
                  <button type="submit" className="as-btn-primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <div className="as-card fade-in">
              <h3>System Preferences</h3>
              <p className="as-subtitle">Customize your MEDIPULSE experience.</p>
              
              <form onSubmit={handlePreferencesSave}>
                <div className="as-toggle-group">
                  <div className="as-toggle-info">
                    <h4><Bell size={16} /> Email Notifications</h4>
                    <p>Receive daily summaries and critical alerts via email.</p>
                  </div>
                  <label className="as-switch">
                    <input 
                      type="checkbox" 
                      checked={preferences.emailNotifications}
                      onChange={e => setPreferences({...preferences, emailNotifications: e.target.checked})}
                    />
                    <span className="as-slider"></span>
                  </label>
                </div>

                <div className="as-toggle-group">
                  <div className="as-toggle-info">
                    <h4><Monitor size={16} /> Push Notifications</h4>
                    <p>Enable browser push notifications for urgent updates.</p>
                  </div>
                  <label className="as-switch">
                    <input 
                      type="checkbox" 
                      checked={preferences.pushNotifications}
                      onChange={e => setPreferences({...preferences, pushNotifications: e.target.checked})}
                    />
                    <span className="as-slider"></span>
                  </label>
                </div>

                <div className="as-toggle-group">
                  <div className="as-toggle-info">
                    <h4>{preferences.darkMode ? <Moon size={16} /> : <Sun size={16} />} Dark Mode</h4>
                    <p>Switch between light and dark themes (Preview only).</p>
                  </div>
                  <label className="as-switch">
                    <input 
                      type="checkbox" 
                      checked={preferences.darkMode}
                      onChange={e => setPreferences({...preferences, darkMode: e.target.checked})}
                    />
                    <span className="as-slider"></span>
                  </label>
                </div>

                <div className="as-form-actions">
                  <button type="submit" className="as-btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* HOSPITAL TAB */}
          {activeTab === 'hospital' && (
            <div className="as-card fade-in">
              <h3>Hospital Configuration</h3>
              <p className="as-subtitle">Manage global hospital details displayed across the platform.</p>
              
              <form onSubmit={handleHospitalSave}>
                <div className="as-form-group">
                  <label>Hospital Name</label>
                  <div className="as-input-wrap">
                    <Hospital className="as-input-icon" size={16} />
                    <input 
                      type="text" 
                      value={hospitalInfo.hospitalName} 
                      onChange={e => setHospitalInfo({...hospitalInfo, hospitalName: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="as-form-group">
                  <label>Contact Email</label>
                  <div className="as-input-wrap">
                    <Mail className="as-input-icon" size={16} />
                    <input 
                      type="email" 
                      value={hospitalInfo.contactEmail} 
                      onChange={e => setHospitalInfo({...hospitalInfo, contactEmail: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                <div className="as-form-group">
                  <label>Support Phone</label>
                  <div className="as-input-wrap">
                    <Phone className="as-input-icon" size={16} />
                    <input 
                      type="text" 
                      value={hospitalInfo.supportPhone} 
                      onChange={e => setHospitalInfo({...hospitalInfo, supportPhone: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                <div className="as-form-group">
                  <label>Official Address</label>
                  <textarea 
                    className="as-textarea" 
                    rows={3} 
                    value={hospitalInfo.address}
                    onChange={e => setHospitalInfo({...hospitalInfo, address: e.target.value})}
                  />
                </div>

                <div className="as-form-actions">
                  <button type="submit" className="as-btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Update Details'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
