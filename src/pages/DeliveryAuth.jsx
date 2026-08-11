import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Mail, Lock, User, Phone, Truck, ArrowRight } from 'lucide-react';
import './DeliveryAuth.css';

const API = import.meta.env.VITE_URL || 'http://localhost:5000';

const DeliveryAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', password: '', phone: '', vehicle_number: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/delivery/login' : '/delivery/register';
      const response = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        localStorage.setItem('deliveryToken', data.token);
        localStorage.setItem('deliveryBoy', JSON.stringify(data.deliveryBoy));
        setTimeout(() => navigate('/delivery-dashboard'), 1500);
      } else {
        toast.error(data.message || 'Authentication failed');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delivery-auth-page">
      <Toaster position="top-center" />
      <div className="auth-card">
        <div className="auth-header">
          <Truck size={40} className="auth-icon" />
          <h2>{isLogin ? 'Delivery Partner Login' : 'Become a Delivery Partner'}</h2>
          <p>{isLogin ? 'Sign in to access your deliveries' : 'Join our fleet and start earning'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="name-row">
              <div className="input-group">
                <User size={18} />
                <input type="text" name="first_name" placeholder="First Name" required onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <User size={18} />
                <input type="text" name="last_name" placeholder="Last Name" required onChange={handleInputChange} />
              </div>
            </div>
          )}

          <div className="input-group">
            <Mail size={18} />
            <input type="email" name="email" placeholder="Email Address" required onChange={handleInputChange} />
          </div>

          {!isLogin && (
            <>
              <div className="input-group">
                <Phone size={18} />
                <input type="tel" name="phone" placeholder="Phone Number" required onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <Truck size={18} />
                <input type="text" name="vehicle_number" placeholder="Vehicle Number (e.g. DL 01 AB 1234)" required onChange={handleInputChange} />
              </div>
            </>
          )}

          <div className="input-group">
            <Lock size={18} />
            <input type="password" name="password" placeholder="Password" required onChange={handleInputChange} />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')} <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already a partner?"}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="toggle-btn">
              {isLogin ? 'Register Here' : 'Login Here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAuth;
