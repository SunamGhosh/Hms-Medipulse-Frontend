import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Clock, Star, Users } from 'lucide-react';
import RoleSelectionModal from '../components/RoleSelectionModal';
import './DoctorsPage.css';

// Mock data to match the design requested
const allDoctors = [
  { id: 1, name: 'Dr. John Carter', specialty: 'General physician', credentials: 'MBBS, MD', experience: '12y', hours: '09:00-17:00', patients: '300+', image: '/img/doctor_portrait.png' },
  { id: 2, name: 'Dr. Emily Zhang', specialty: 'Pediatricians', credentials: 'MBBS, DCH', experience: '8y', hours: '09:00-17:00', patients: '275+', image: '/img/doctor_2.png' },
  { id: 3, name: 'Dr. Rajiv Mehta', specialty: 'Cardiologist', credentials: 'MBBS, MD, DM Cardiology', experience: '15y', hours: '09:00-17:00', patients: '500+', image: '/img/doctor_3.png' },
  { id: 4, name: 'Dr. Amina Okafor', specialty: 'Neurologist', credentials: 'MBBS, DM Neurology', experience: '10y', hours: '09:30-17:30', patients: '450+', image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=600&auto=format&fit=crop' },
  { id: 5, name: 'Dr. Sarah Lee', specialty: 'Gynecologist', credentials: 'MBBS, MS, DGO', experience: '9y', hours: '10:00-18:00', patients: '400+', image: 'https://images.unsplash.com/photo-1594824436951-7f12bc00a9e3?q=80&w=600&auto=format&fit=crop' },
  { id: 6, name: 'Dr. Michael Chen', specialty: 'Dermatologist', credentials: 'MBBS, MD Dermatology', experience: '11y', hours: '08:00-16:00', patients: '350+', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=600&auto=format&fit=crop' },
  { id: 7, name: 'Dr. Robert Wilson', specialty: 'Gastroenterologist', credentials: 'MBBS, MD, DM Gastroenterology', experience: '14y', hours: '09:00-17:00', patients: '480+', image: 'https://images.unsplash.com/photo-1537368910025-70280451b211?q=80&w=600&auto=format&fit=crop' }
];

const specializations = [
  'General physician',
  'Gynecologist',
  'Dermatologist',
  'Pediatricians',
  'Neurologist',
  'Gastroenterologist'
];

const DoctorsPage = () => {
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const navigate = useNavigate();

  const filteredDoctors = selectedSpecialty 
    ? allDoctors.filter(doc => doc.specialty === selectedSpecialty)
    : allDoctors;

  return (
    <div className="dp-container">
      {/* Reusing Home Navigation Style */}
      <nav className="dp-navbar">
        <Link to="/" className="nav-logo">
          <img src="/img/logo.jpeg" alt="MediPulse Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain' }} />
          <span className="nav-logo-text">MediPulse</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/doctors" className="nav-link active">Doctor</Link>
          <Link to="/pharmacy" className="nav-link">Pharmacy</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="btn-outline">
            Admin login
          </Link>
          <button className="btn-primary-nav" onClick={() => setIsRoleModalOpen(true)}>
            Get Started
          </button>
        </div>
      </nav>

      <div className="dp-content-wrapper">
        <h1 className="dp-page-title">Find the right doctor for you</h1>
        <p className="dp-page-subtitle">Browse through our extensive list of trusted doctors.</p>

        <div className="dp-main-layout">
          {/* Left Sidebar: Specializations */}
          <aside className="dp-sidebar">
            <ul className="dp-specialty-list">
              <li 
                className={`dp-specialty-item ${selectedSpecialty === '' ? 'active' : ''}`}
                onClick={() => setSelectedSpecialty('')}
              >
                All Specializations
              </li>
              {specializations.map((spec, idx) => (
                <li 
                  key={idx} 
                  className={`dp-specialty-item ${selectedSpecialty === spec ? 'active' : ''}`}
                  onClick={() => setSelectedSpecialty(spec)}
                >
                  {spec}
                </li>
              ))}
            </ul>
          </aside>

          {/* Right Content: Doctors Grid */}
          <main className="dp-doctors-grid">
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map(doctor => (
                <div key={doctor.id} className="dp-doctor-card">
                  <div className="dp-doctor-image-wrapper">
                    <img 
                      src={doctor.image} 
                      alt={doctor.name} 
                      className="dp-doctor-image" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=600&auto=format&fit=crop';
                      }}
                    />
                  </div>
                  <div className="dp-doctor-info">
                    <span className="dp-specialty-tag">{doctor.specialty}</span>
                    <h3 className="dp-doctor-name">{doctor.name}</h3>
                    <p className="dp-doctor-credentials">{doctor.credentials}</p>
                    
                    <div className="dp-doctor-stats">
                      <div className="dp-stat"><Star size={14} className="dp-stat-icon" /> {doctor.experience}</div>
                      <div className="dp-stat"><Clock size={14} className="dp-stat-icon" /> {doctor.hours}</div>
                      <div className="dp-stat"><Users size={14} className="dp-stat-icon" /> {doctor.patients}</div>
                    </div>
                    
                    <button className="dp-book-btn">Book appointment</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="dp-no-doctors">
                <p>No doctors found for this specialization.</p>
                <button className="dp-reset-btn" onClick={() => setSelectedSpecialty('')}>View All Doctors</button>
              </div>
            )}
          </main>
        </div>
      </div>

      <RoleSelectionModal 
        isOpen={isRoleModalOpen} 
        onClose={() => setIsRoleModalOpen(false)} 
      />
    </div>
  );
};

export default DoctorsPage;
