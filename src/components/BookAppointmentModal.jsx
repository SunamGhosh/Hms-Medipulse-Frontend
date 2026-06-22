import React, { useState, useEffect } from 'react';
import {
  X, User, CheckCircle2, ArrowRight, ArrowLeft, AlertCircle,
  Calendar, Clock, Stethoscope, Plus, Video, MapPin, FileText, Loader2
} from 'lucide-react';
import './BookAppointmentModal.css';

const API = import.meta.env.VITE_URL;

/* ── helpers ── */
const getToken = () => localStorage.getItem('userToken');

const BookAppointmentModal = ({ isOpen, onClose, preselectedDoctorId = null }) => {
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const stepsList = preselectedDoctorId ? ['Patient', 'Details'] : ['Patient', 'Doctor', 'Details'];
  const currentStepName = stepsList[step - 1];

  /* ── Step 1 – Patient ── */
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({
    first_name: '', last_name: '', phone: '', dob: '',
    gender: '', blood_group: '', relationship_to_user: '',
    emergency_contact_name: '', emergency_contact_number: ''
  });

  /* ── Step 2 – Doctor ── */
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  /* ── Step 3 – Details ── */
  const [appt, setAppt] = useState({
    appointment_date: '', appointment_time: '',
    consult_mode: 'online', disease: '', symptoms: ''
  });

  /* reset on open */
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMsg('');
      setSuccessMsg('');
      setSelectedPatient(null);
      setSelectedDoctor(null);
      setShowAddPatient(false);
      setNewPatient({ first_name: '', last_name: '', phone: '', dob: '', gender: '', blood_group: '', relationship_to_user: '', emergency_contact_name: '', emergency_contact_number: '' });
      setAppt({ appointment_date: '', appointment_time: '', consult_mode: 'online', disease: '', symptoms: '' });
      loadPatients();
      loadDoctors();
    }
  }, [isOpen]);

  /* ── Auto-select preselected doctor once doctors load ── */
  useEffect(() => {
    if (preselectedDoctorId && doctors.length > 0) {
      const doc = doctors.find(d => d._id === preselectedDoctorId);
      if (doc) setSelectedDoctor(doc);
    }
  }, [doctors, preselectedDoctorId]);

  const loadPatients = async () => {
    const token = getToken();
    if (!token) return;
    setPatientsLoading(true);
    try {
      const res = await fetch(`${API}/patient/my`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setPatients(data.patients || []);
    } catch { /* silently fail */ }
    finally { setPatientsLoading(false); }
  };

  const loadDoctors = async () => {
    setDoctorsLoading(true);
    try {
      const res = await fetch(`${API}/doctor/active`);
      const data = await res.json();
      if (res.ok) setDoctors(data.doctors || []);
    } catch { /* silently fail */ }
    finally { setDoctorsLoading(false); }
  };

  /* ── Patient creation ── */
  const handleAddPatient = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) { setErrorMsg('Please log in first.'); return; }
    const required = ['first_name', 'last_name', 'phone', 'dob', 'gender', 'blood_group', 'relationship_to_user', 'emergency_contact_name', 'emergency_contact_number'];
    for (const f of required) {
      if (!newPatient[f]) { setErrorMsg('Please fill in all required fields.'); return; }
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API}/patient/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newPatient)
      });
      const data = await res.json();
      if (res.ok) {
        await loadPatients();
        setShowAddPatient(false);
        setSuccessMsg('Patient profile added successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.message || 'Failed to add patient.');
      }
    } catch { setErrorMsg('Connection error.'); }
    finally { setIsLoading(false); }
  };

  /* ── Appointment booking ── */
  const handleBook = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) { setErrorMsg('Please log in first.'); return; }
    if (!selectedPatient || !selectedDoctor) { setErrorMsg('Please select a patient and doctor.'); return; }
    if (!appt.appointment_date || !appt.appointment_time || !appt.disease) {
      setErrorMsg('Please fill in all required fields (date, time, disease).'); return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API}/appointment/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patient_id: selectedPatient._id,
          doctor_id: selectedDoctor._id,
          appointment_date: appt.appointment_date,
          appointment_time: appt.appointment_time,
          consult_mode: appt.consult_mode,
          disease: appt.disease,
          symptoms: appt.symptoms ? [appt.symptoms] : []
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Appointment booked successfully! The doctor will confirm it shortly.');
        setTimeout(() => { onClose(); }, 2500);
      } else {
        setErrorMsg(data.message || 'Failed to book appointment.');
      }
    } catch { setErrorMsg('Connection error.'); }
    finally { setIsLoading(false); }
  };

  if (!isOpen) return null;

  /* ── Step circle state ── */
  const stepState = (n) => {
    if (n < step) return 'done';
    if (n === step) return 'active';
    return 'pending';
  };

  const stepLineClass = (afterStep) => afterStep < step ? 'bam-step-line bam-step-line--done' : 'bam-step-line';

  return (
    <div className="bam-overlay" onClick={onClose}>
      <div className="bam-card" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="bam-header">
          <button className="bam-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
          <h2 className="bam-header-title">📅 Book Appointment</h2>
          <p className="bam-header-sub">Schedule an appointment for you or your family</p>

          {/* Progress stepper */}
          <div className="bam-stepper">
            {stepsList.map((label, i) => {
              const n = i + 1;
              const state = stepState(n);
              return (
                <React.Fragment key={n}>
                  <div className={`bam-step bam-step--${state}`}>
                    <div className="bam-step-circle">
                      {state === 'done' ? <CheckCircle2 size={14} /> : n}
                    </div>
                    <span className="bam-step-label">{label}</span>
                  </div>
                  {i < stepsList.length - 1 && <div className={stepLineClass(n)} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="bam-body">

          {/* Global alerts */}
          {errorMsg && (
            <div className="bam-alert error">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="bam-alert success">
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ────────── STEP 1: Patient ────────── */}
          {currentStepName === 'Patient' && (
            <div>
              <p className="bam-section-title">Select a patient</p>

              {patientsLoading ? (
                <div className="bam-loading">
                  <div className="bam-skeleton" />
                  <div className="bam-skeleton" />
                </div>
              ) : (
                <div className="bam-patient-list">
                  {patients.filter(p => p.status === 'active').map(p => (
                    <div
                      key={p._id}
                      className={`bam-patient-card ${selectedPatient?._id === p._id ? 'selected' : ''}`}
                      onClick={() => { setSelectedPatient(p); setErrorMsg(''); }}
                    >
                      <div className="bam-patient-avatar">{p.first_name[0]}</div>
                      <div className="bam-patient-info">
                        <div className="bam-patient-name">{p.first_name} {p.last_name}</div>
                        <div className="bam-patient-meta">{p.relationship_to_user} • {p.gender} • {p.blood_group}</div>
                      </div>
                      <div className="bam-patient-radio" />
                    </div>
                  ))}
                </div>
              )}

              {/* Add new patient toggle */}
              {!showAddPatient && (
                <button className="bam-add-patient-toggle" onClick={() => setShowAddPatient(true)}>
                  <Plus size={16} /> Add a new patient
                </button>
              )}

              {showAddPatient && (
                <form onSubmit={handleAddPatient}>
                  <p className="bam-section-title" style={{ marginTop: '1.25rem' }}>New patient details</p>

                  <div className="bam-form-row">
                    <div className="bam-field">
                      <label>First Name *</label>
                      <div className="bam-field-wrap">
                        <User size={14} className="bam-field-icon" />
                        <input type="text" placeholder="First name" value={newPatient.first_name}
                          onChange={e => setNewPatient(p => ({ ...p, first_name: e.target.value }))} />
                      </div>
                    </div>
                    <div className="bam-field">
                      <label>Last Name *</label>
                      <div className="bam-field-wrap">
                        <User size={14} className="bam-field-icon" />
                        <input type="text" placeholder="Last name" value={newPatient.last_name}
                          onChange={e => setNewPatient(p => ({ ...p, last_name: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div className="bam-form-row">
                    <div className="bam-field">
                      <label>Phone *</label>
                      <div className="bam-field-wrap">
                        <User size={14} className="bam-field-icon" />
                        <input type="tel" placeholder="10-digit number" maxLength={10} value={newPatient.phone}
                          onChange={e => setNewPatient(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                    </div>
                    <div className="bam-field">
                      <label>Date of Birth *</label>
                      <div className="bam-field-wrap">
                        <Calendar size={14} className="bam-field-icon" />
                        <input type="date" value={newPatient.dob}
                          onChange={e => setNewPatient(p => ({ ...p, dob: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div className="bam-form-row">
                    <div className="bam-field">
                      <label>Gender *</label>
                      <div className="bam-field-wrap">
                        <User size={14} className="bam-field-icon" />
                        <select value={newPatient.gender} onChange={e => setNewPatient(p => ({ ...p, gender: e.target.value }))}>
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="bam-field">
                      <label>Blood Group *</label>
                      <div className="bam-field-wrap">
                        <User size={14} className="bam-field-icon" />
                        <select value={newPatient.blood_group} onChange={e => setNewPatient(p => ({ ...p, blood_group: e.target.value }))}>
                          <option value="">Select</option>
                          {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bam-field">
                    <label>Relationship to you *</label>
                    <div className="bam-field-wrap">
                      <User size={14} className="bam-field-icon" />
                      <select value={newPatient.relationship_to_user} onChange={e => setNewPatient(p => ({ ...p, relationship_to_user: e.target.value }))}>
                        <option value="">Select relationship</option>
                        {['self','father','mother','spouse','son','daughter','brother','sister','other'].map(r => (
                          <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bam-form-row">
                    <div className="bam-field">
                      <label>Emergency Contact Name *</label>
                      <div className="bam-field-wrap">
                        <User size={14} className="bam-field-icon" />
                        <input type="text" placeholder="Contact name" value={newPatient.emergency_contact_name}
                          onChange={e => setNewPatient(p => ({ ...p, emergency_contact_name: e.target.value }))} />
                      </div>
                    </div>
                    <div className="bam-field">
                      <label>Emergency Contact Number *</label>
                      <div className="bam-field-wrap">
                        <User size={14} className="bam-field-icon" />
                        <input type="tel" placeholder="10-digit number" maxLength={10} value={newPatient.emergency_contact_number}
                          onChange={e => setNewPatient(p => ({ ...p, emergency_contact_number: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div className="bam-footer">
                    <button type="button" className="bam-btn-back" onClick={() => { setShowAddPatient(false); setErrorMsg(''); }}>
                      <ArrowLeft size={15} /> Cancel
                    </button>
                    <button type="submit" className="bam-btn-next" disabled={isLoading}>
                      {isLoading ? <><span className="bam-spinner" /> Saving…</> : <><Plus size={15} /> Add Patient</>}
                    </button>
                  </div>
                </form>
              )}

              {!showAddPatient && (
                <div className="bam-footer">
                  <div />
                  <button className="bam-btn-next"
                    disabled={!selectedPatient}
                    onClick={() => { setErrorMsg(''); setStep(step + 1); }}>
                    Next <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ────────── STEP 2: Doctor ────────── */}
          {currentStepName === 'Doctor' && (
            <div>
              <p className="bam-section-title">Choose a doctor</p>

              {doctorsLoading ? (
                <div className="bam-loading">
                  <div className="bam-skeleton" />
                  <div className="bam-skeleton" />
                  <div className="bam-skeleton" />
                </div>
              ) : doctors.length === 0 ? (
                <div className="bam-empty">No active doctors available at the moment.</div>
              ) : (
                <div className="bam-doctor-grid">
                  {doctors.map(doc => (
                    <div
                      key={doc._id}
                      className={`bam-doctor-card ${selectedDoctor?._id === doc._id ? 'selected' : ''}`}
                      onClick={() => { setSelectedDoctor(doc); setErrorMsg(''); }}
                    >
                      <img
                        src={doc.profile_img || '/img/doctor_portrait.png'}
                        alt={doc.first_name}
                        className="bam-doctor-img"
                        onError={e => { e.target.src = '/img/doctor_portrait.png'; }}
                      />
                      <div className="bam-doctor-name">Dr. {doc.first_name} {doc.last_name}</div>
                      <div className="bam-doctor-spec">{doc.specialization || doc.department || 'General'}</div>
                      {doc.consult_fee && <div className="bam-doctor-fee">₹{doc.consult_fee} / session</div>}
                    </div>
                  ))}
                </div>
              )}

              <div className="bam-footer">
                <button className="bam-btn-back" onClick={() => { setErrorMsg(''); setStep(step - 1); }}>
                  <ArrowLeft size={15} /> Back
                </button>
                <button className="bam-btn-next"
                  disabled={!selectedDoctor}
                  onClick={() => { setErrorMsg(''); setStep(step + 1); }}>
                  Next <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ────────── STEP 3: Appointment Details ────────── */}
          {currentStepName === 'Details' && (
            <form onSubmit={handleBook}>

              {/* Summary */}
              <div className="bam-summary-box">
                <div className="bam-summary-row">
                  <span className="bam-summary-label">Patient</span>
                  <span className="bam-summary-value">{selectedPatient?.first_name} {selectedPatient?.last_name}</span>
                </div>
                <div className="bam-summary-row">
                  <span className="bam-summary-label">Doctor</span>
                  <span className="bam-summary-value">Dr. {selectedDoctor?.first_name} {selectedDoctor?.last_name}</span>
                </div>
                {selectedDoctor?.consult_fee && (
                  <div className="bam-summary-row">
                    <span className="bam-summary-label">Consultation Fee</span>
                    <span className="bam-summary-value">₹{selectedDoctor.consult_fee}</span>
                  </div>
                )}
              </div>

              <p className="bam-section-title">Select date & time</p>

              <div className="bam-form-row">
                <div className="bam-field">
                  <label>Appointment Date *</label>
                  <div className="bam-field-wrap">
                    <Calendar size={14} className="bam-field-icon" />
                    <input type="date" value={appt.appointment_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setAppt(a => ({ ...a, appointment_date: e.target.value }))} />
                  </div>
                </div>
                <div className="bam-field">
                  <label>Appointment Time *</label>
                  <div className="bam-field-wrap">
                    <Clock size={14} className="bam-field-icon" />
                    <input type="time" value={appt.appointment_time}
                      onChange={e => setAppt(a => ({ ...a, appointment_time: e.target.value }))} />
                  </div>
                </div>
              </div>

              <p className="bam-section-title">Consultation mode</p>
              <div className="bam-mode-row">
                <button type="button"
                  className={`bam-mode-pill ${appt.consult_mode === 'online' ? 'selected' : ''}`}
                  onClick={() => setAppt(a => ({ ...a, consult_mode: 'online' }))}>
                  <Video size={15} /> Online
                </button>
                <button type="button"
                  className={`bam-mode-pill ${appt.consult_mode === 'offline' ? 'selected' : ''}`}
                  onClick={() => setAppt(a => ({ ...a, consult_mode: 'offline' }))}>
                  <MapPin size={15} /> In-Person
                </button>
              </div>

              <p className="bam-section-title">Medical information</p>

              <div className="bam-field">
                <label>Disease / Condition *</label>
                <div className="bam-field-wrap">
                  <Stethoscope size={14} className="bam-field-icon" />
                  <input type="text" placeholder="e.g. Fever, Back pain, Diabetes…" value={appt.disease}
                    onChange={e => setAppt(a => ({ ...a, disease: e.target.value }))} />
                </div>
              </div>

              <div className="bam-field">
                <label>Symptoms (optional)</label>
                <div className="bam-field-wrap">
                  <FileText size={14} className="bam-field-icon" style={{ top: '0.75rem', alignSelf: 'flex-start', position: 'absolute' }} />
                  <textarea placeholder="Describe your symptoms in detail…" value={appt.symptoms}
                    style={{ paddingLeft: '2.4rem' }}
                    onChange={e => setAppt(a => ({ ...a, symptoms: e.target.value }))} />
                </div>
              </div>

              <div className="bam-footer">
                <button type="button" className="bam-btn-back" onClick={() => { setErrorMsg(''); setStep(step - 1); }}>
                  <ArrowLeft size={15} /> Back
                </button>
                <button type="submit" className="bam-btn-next" disabled={isLoading}>
                  {isLoading
                    ? <><span className="bam-spinner" /> Booking…</>
                    : <><CheckCircle2 size={15} /> Confirm Booking</>}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default BookAppointmentModal;
