import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Bell, Monitor, Save, Shield, Hospital, Mail, Phone, Sun, Moon, Settings, Eye, EyeOff, Upload, Trash2, X, Camera } from 'lucide-react';
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

  const [profileImg, setProfileImg] = useState('');
  const [showViewImgModal, setShowViewImgModal] = useState(false);
  const fileInputRef = useRef(null);

  // Password Visibility States
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

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

  // Load basic admin details & profile img on mount
  useEffect(() => {
    const storedName = localStorage.getItem('adminName');
    const storedEmail = localStorage.getItem('adminEmail');
    const storedImg = localStorage.getItem('adminProfileImg');

    if (storedName) setProfileData(prev => ({ ...prev, name: storedName }));
    if (storedEmail) setProfileData(prev => ({ ...prev, email: storedEmail }));
    if (storedImg) setProfileImg(storedImg);
    
    // Fetch profile from backend if token exists
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${import.meta.env.VITE_URL}/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.email) {
          setProfileData({
            name: data.fullname || storedName || 'Admin User',
            email: data.email || storedEmail || ''
          });
          if (data.profile_img) {
            setProfileImg(data.profile_img);
            localStorage.setItem('adminProfileImg', data.profile_img);
          }
          localStorage.setItem('adminName', data.fullname || '');
          localStorage.setItem('adminEmail', data.email || '');
        }
      })
      .catch(err => console.error("Error fetching admin profile:", err));
    }

    // Load saved preferences
    const savedPrefs = localStorage.getItem('adminPreferences');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setPreferences(parsed);
        if (parsed.darkMode) {
          document.body.classList.add('dark-mode');
        }
      } catch (err) {
        console.error("Error parsing saved preferences", err);
      }
    }
  }, []);

  // Handle Profile Picture Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (JPG, PNG, GIF)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      setProfileImg(result);
      localStorage.setItem('adminProfileImg', result);
      window.dispatchEvent(new Event('adminProfileUpdated'));
      toast.success('Profile picture updated successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePicture = () => {
    setProfileImg('');
    localStorage.removeItem('adminProfileImg');
    window.dispatchEvent(new Event('adminProfileUpdated'));
    toast.success('Profile picture removed');
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_URL}/admin/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullname: profileData.name,
          email: profileData.email,
          profile_img: profileImg
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('adminName', profileData.name);
        localStorage.setItem('adminEmail', profileData.email.trim().toLowerCase());
        if (profileImg) localStorage.setItem('adminProfileImg', profileImg);
        window.dispatchEvent(new Event('adminProfileUpdated'));
        toast.success(data.message || 'Profile updated successfully');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Network error. Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySave = async (e) => {
    e.preventDefault();
    if (!securityData.currentPassword || !securityData.newPassword) {
      toast.error('Please enter both current and new password');
      return;
    }
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_URL}/admin/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success(data.message || 'Password updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update password');
      }
    } catch (error) {
      toast.error('Network error. Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  // Real-time Dynamic System Preference Change Handler
  const handlePreferenceChange = (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem('adminPreferences', JSON.stringify(updated));

    if (key === 'emailNotifications') {
      toast.success(`Email Notifications ${value ? 'enabled' : 'disabled'}`);
    } else if (key === 'pushNotifications') {
      toast.success(`Push Notifications ${value ? 'enabled' : 'disabled'}`);
    } else if (key === 'darkMode') {
      toast.success(`Dark Mode ${value ? 'enabled' : 'disabled'}`);
      if (value) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }
  };

  const handlePreferencesSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('adminPreferences', JSON.stringify(preferences));
      toast.success('Preferences saved successfully');
      setLoading(false);
    }, 400);
  };

  const handleHospitalSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success('Hospital details updated successfully');
      setLoading(false);
    }, 600);
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
              <p className="as-subtitle">Update your account's basic information and profile picture.</p>
              
              {/* Profile Picture Upload & View Section */}
              <div className="as-avatar-section">
                <div className="as-avatar-preview-box">
                  {profileImg ? (
                    <img src={profileImg} alt="Admin Profile Avatar" />
                  ) : (
                    profileData.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="as-avatar-controls">
                  <h4 className="as-avatar-controls-title">Profile Picture</h4>
                  <p className="as-avatar-controls-sub">Upload a high quality photo or avatar image.</p>
                  <div className="as-avatar-btn-group">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      style={{ display: 'none' }} 
                    />
                    <button 
                      type="button" 
                      className="as-btn-secondary" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={14} /> Upload New Photo
                    </button>
                    {profileImg && (
                      <button 
                        type="button" 
                        className="as-btn-secondary" 
                        onClick={() => setShowViewImgModal(true)}
                      >
                        <Eye size={14} /> View Picture
                      </button>
                    )}
                    {profileImg && (
                      <button 
                        type="button" 
                        className="as-btn-danger" 
                        onClick={handleRemovePicture}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

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
                {/* Current Password */}
                <div className="as-form-group">
                  <label>Current Password</label>
                  <div className="as-input-wrap">
                    <Lock className="as-input-icon" size={16} />
                    <input 
                      type={showCurrentPwd ? "text" : "password"} 
                      value={securityData.currentPassword} 
                      onChange={e => setSecurityData({...securityData, currentPassword: e.target.value})} 
                      required 
                      placeholder="Enter current password"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="as-pwd-toggle-btn"
                      title={showCurrentPwd ? "Hide password" : "Show password"}
                    >
                      {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                
                {/* New Password */}
                <div className="as-form-group">
                  <label>New Password</label>
                  <div className="as-input-wrap">
                    <Lock className="as-input-icon" size={16} />
                    <input 
                      type={showNewPwd ? "text" : "password"} 
                      value={securityData.newPassword} 
                      onChange={e => setSecurityData({...securityData, newPassword: e.target.value})} 
                      required 
                      minLength={8}
                      placeholder="Enter new password (min 8 chars)"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="as-pwd-toggle-btn"
                      title={showNewPwd ? "Hide password" : "Show password"}
                    >
                      {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="as-form-group">
                  <label>Confirm New Password</label>
                  <div className="as-input-wrap">
                    <Lock className="as-input-icon" size={16} />
                    <input 
                      type={showConfirmPwd ? "text" : "password"} 
                      value={securityData.confirmPassword} 
                      onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})} 
                      required 
                      placeholder="Confirm new password"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="as-pwd-toggle-btn"
                      title={showConfirmPwd ? "Hide password" : "Show password"}
                    >
                      {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
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
              <p className="as-subtitle">Customize your MEDIPULSE experience dynamically in real-time.</p>
              
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
                      onChange={e => handlePreferenceChange('emailNotifications', e.target.checked)}
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
                      onChange={e => handlePreferenceChange('pushNotifications', e.target.checked)}
                    />
                    <span className="as-slider"></span>
                  </label>
                </div>

                <div className="as-toggle-group">
                  <div className="as-toggle-info">
                    <h4>{preferences.darkMode ? <Moon size={16} /> : <Sun size={16} />} Dark Mode</h4>
                    <p>Switch between light and dark themes in real-time.</p>
                  </div>
                  <label className="as-switch">
                    <input 
                      type="checkbox" 
                      checked={preferences.darkMode}
                      onChange={e => handlePreferenceChange('darkMode', e.target.checked)}
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

      {/* View Profile Picture Modal Overlay */}
      {showViewImgModal && (
        <div className="as-modal-overlay" onClick={() => setShowViewImgModal(false)}>
          <div className="as-modal-card" onClick={e => e.stopPropagation()}>
            <div className="as-modal-header">
              <h4>Admin Profile Picture</h4>
              <button 
                type="button"
                className="as-modal-close-btn" 
                onClick={() => setShowViewImgModal(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="as-modal-img-wrapper">
              <img src={profileImg} alt="Full Resolution Admin Profile" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
