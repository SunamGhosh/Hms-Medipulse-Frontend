import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login'; // Admin Login
import UserLogin from './pages/UserLogin'; // Patient Login
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import AddDoctor from './pages/AddDoctor';
import AddPharmacist from './pages/AddPharmacist';
import MedicinesList from './pages/MedicinesList';
import DoctorsList from './pages/DoctorsList';
import PharmacistsList from './pages/PharmacistsList';
import AppointmentsList from './pages/AppointmentsList';
import Home from './pages/Home';
import About from './pages/About';
import DoctorsPage from './pages/DoctorsPage';
import PharmacyPage from './pages/PharmacyPage';
import UserDashboard from './pages/UserDashboard';
import DoctorLogin from './pages/DoctorLogin';
import DoctorDashboard from './pages/DoctorDashboard';
import PharmacistLogin from './pages/PharmacistLogin';
import PharmacistDashboard from './pages/PharmacistDashboard';
import VideoCall from './pages/VideoCall';
import Cart from './pages/Cart';
import MyOrders from './pages/MyOrders';

import Chatbot from './components/Chatbot';
import { Toaster } from 'react-hot-toast';

function App() {
  const location = useLocation();
  const hideChatbotPaths = ['/admin', '/doctor', '/pharmacist', '/video-call'];
  const shouldShowChatbot = !hideChatbotPaths.some(path => location.pathname.startsWith(path));

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/pharmacy" element={<PharmacyPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/login" element={<UserLogin />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/user/dashboard" element={<UserDashboard />} />
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/pharmacist/login" element={<PharmacistLogin />} />
        <Route path="/pharmacist/dashboard" element={<PharmacistDashboard />} />
        <Route path="/video-call/:roomId" element={<VideoCall />} />
        
        {/* Admin Protected Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="add-doctor" element={<AddDoctor />} />
          <Route path="add-pharmacist" element={<AddPharmacist />} />
          <Route path="medicines" element={<MedicinesList />} />
          {/* Placeholders for other pages */}
          <Route path="patients" element={<div style={{padding: '24px'}}><h2>Patients List (Placeholder)</h2></div>} />
          <Route path="doctors" element={<DoctorsList />} />
          <Route path="pharmacists" element={<PharmacistsList />} />
          <Route path="appointments" element={<AppointmentsList />} />
          <Route path="settings" element={<div style={{padding: '24px'}}><h2>Settings (Placeholder)</h2></div>} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      {shouldShowChatbot && <Chatbot />}
    </>
  );
}

export default App;

