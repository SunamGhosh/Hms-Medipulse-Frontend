import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Star, Users, Loader2 } from 'lucide-react';
import RoleSelectionModal from '../components/RoleSelectionModal';
import BookAppointmentModal from '../components/BookAppointmentModal';
import SignupModal from '../components/SignupModal';
import ProfileDropdown from '../components/ProfileDropdown';
import './DoctorsPage.css';

const API = import.meta.env.VITE_URL || 'http://localhost:4000/api';

const DoctorsPage = () => {
  const [allDoctors, setAllDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [bookDoctorId, setBookDoctorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const dashboardPath = localStorage.getItem('userToken') ? '/user/dashboard' : null;


  const handleBookAppointment = (doctorId) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      setIsRoleModalOpen(true);
      return;
    }
    setBookDoctorId(doctorId);
    setIsBookModalOpen(true);
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch(`${API}/doctor/active`);
        const data = await res.json();
        if (res.ok && data.doctors) {
          const docs = data.doctors.map(doc => ({
            id: doc._id,
            name: `Dr. ${doc.first_name} ${doc.last_name}`,
            specialty: doc.specialization,
            credentials: doc.qualification,
            experience: `${doc.experience_year}y`,
            hours: `${doc.work_time_start}-${doc.work_time_end}`,
            patients: '200+', // fallback stat
            image: (doc.profile_img && !doc.profile_img.includes('placeholder')) 
              ? doc.profile_img 
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.first_name)}+${encodeURIComponent(doc.last_name)}&background=0d9488&color=fff&size=400&font-size=0.33`
          }));
          setAllDoctors(docs);
          
          const uniqueSpecs = [...new Set(docs.map(d => d.specialty))].filter(Boolean);
          setSpecializations(uniqueSpecs);
        }
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const filteredDoctors = selectedSpecialty 
    ? allDoctors.filter(doc => doc.specialty === selectedSpecialty)
    : allDoctors;

  return (
    <div className="dp-container">
      {/* Reusing Home Navigation Style */}
      <nav className="dp-navbar">
        <Link to="/" className="nav-logo">
          <img src="/img/logo.jpeg" alt="MediPulse Logo" />
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
          {localStorage.getItem('userToken') ? (
            <>
              {dashboardPath && (
                <Link to={dashboardPath} className="btn-dashboard">Dashboard</Link>
              )}
              <ProfileDropdown />
            </>
          ) : dashboardPath ? (
            <>
              <Link to={dashboardPath} className="btn-dashboard">Dashboard</Link>
            </>
          ) : (
            <>
              <button className="btn-outline" onClick={() => setIsSignupModalOpen(true)}>
                Signup
              </button>
              <button className="btn-primary-nav" onClick={() => setIsRoleModalOpen(true)}>
                Login
              </button>
            </>
          )}
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
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', gridColumn: '1 / -1' }}>
                <Loader2 size={32} className="spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-color)' }} />
              </div>
            ) : filteredDoctors.length > 0 ? (
              filteredDoctors.map(doctor => (
                <div key={doctor.id} className="dp-doctor-card">
                  <div className="dp-doctor-image-wrapper">
                    <img 
                      src={doctor.image} 
                      alt={doctor.name} 
                      className="dp-doctor-image" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=0d9488&color=fff&size=400&font-size=0.33`;
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
                    
                    <button className="dp-book-btn" onClick={() => handleBookAppointment(doctor.id)}>Book appointment</button>
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

      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        preselectedDoctorId={bookDoctorId}
      />

      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
      />
    </div>
  );
};

export default DoctorsPage;
