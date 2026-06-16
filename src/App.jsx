import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import AddDoctor from './pages/AddDoctor';
import AddPharmacist from './pages/AddPharmacist';
import DoctorsList from './pages/DoctorsList';
import PharmacistsList from './pages/PharmacistsList';
import Home from './pages/Home';
import About from './pages/About';
import DoctorsPage from './pages/DoctorsPage';
import PharmacyPage from './pages/PharmacyPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/doctors" element={<DoctorsPage />} />
      <Route path="/pharmacy" element={<PharmacyPage />} />
      <Route path="/login" element={<Login />} />
      
      {/* Admin Protected Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="add-doctor" element={<AddDoctor />} />
        <Route path="add-pharmacist" element={<AddPharmacist />} />
        {/* Placeholders for other pages */}
        <Route path="patients" element={<div style={{padding: '24px'}}><h2>Patients List (Placeholder)</h2></div>} />
        <Route path="doctors" element={<DoctorsList />} />
        <Route path="pharmacists" element={<PharmacistsList />} />
        <Route path="settings" element={<div style={{padding: '24px'}}><h2>Settings (Placeholder)</h2></div>} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
