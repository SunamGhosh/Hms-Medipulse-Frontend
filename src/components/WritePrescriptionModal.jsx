import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, Save, FileText, Pill } from 'lucide-react';
import './WritePrescriptionModal.css';

const API = import.meta.env.VITE_URL;
const getToken = () => localStorage.getItem('doctorToken');

const DOSAGE_OPTIONS = [
  "1 Tablet",
  "2 Tablets",
  "1/2 Tablet",
  "1 Capsule",
  "2 Capsules",
  "5 ml",
  "10 ml",
  "15 ml",
  "1 Drop",
  "2 Drops",
  "1 Puff",
  "2 Puffs",
  "1 Sachet",
  "1 Injection",
  "1 Application"
];

const FREQUENCY_OPTIONS = [
  "Once a day (1-0-0)",
  "Twice a day (1-0-1)",
  "Thrice a day (1-1-1)",
  "Four times a day (1-1-1-1)",
  "Once at night (0-0-1)",
  "Every 4 hours",
  "Every 6 hours",
  "Every 8 hours",
  "Every 12 hours",
  "Once every 2 days",
  "Once a week",
  "As needed (PRN)"
];

const DURATION_OPTIONS = [
  "1 Day",
  "2 Days",
  "3 Days",
  "5 Days",
  "7 Days (1 Week)",
  "10 Days",
  "14 Days (2 Weeks)",
  "21 Days (3 Weeks)",
  "1 Month",
  "2 Months",
  "3 Months"
];

const WritePrescriptionModal = ({ isOpen, onClose, appointment, onSuccess }) => {
  const [medicinesList, setMedicinesList] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [prescribedMedicines, setPrescribedMedicines] = useState([]);

  const fetchMedicines = async () => {
    setLoadingMedicines(true);
    try {
      const res = await fetch(`${API}/medicine/`);
      const data = await res.json();
      if (res.ok) {
        const allMedicines = data.data || data.medicines || [];
        const active = allMedicines.filter(m => m.status === 'active');
        setMedicinesList(active);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMedicines(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedicines();
      const pat = appointment?.patient_id;
      const initialAge = pat?.age || pat?.patient_age || (pat?.dob ? Math.floor((new Date() - new Date(pat.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : '');
      const initialGender = pat?.gender ? (pat.gender.charAt(0).toUpperCase() + pat.gender.slice(1).toLowerCase()) : '';
      setPatientAge(initialAge ? String(initialAge) : '');
      setPatientGender(initialGender);
      setDiagnosis('');
      setSymptoms('');
      setDoctorNotes('');
      setFollowUpDate('');
      setPrescribedMedicines([]);
      setErrorMsg('');
    }
  }, [isOpen, appointment]);

  const addMedicineRow = () => {
    setPrescribedMedicines([
      ...prescribedMedicines,
      {
        medicine_id: '',
        dosage: '',
        dosage_custom: false,
        frequency: '',
        frequency_custom: false,
        duration: '',
        duration_custom: false,
        quantity: 1,
        instructions: ''
      }
    ]);
  };

  const updateMedicineRow = (index, field, value) => {
    const updated = [...prescribedMedicines];
    updated[index][field] = value;
    setPrescribedMedicines(updated);
  };

  const removeMedicineRow = (index) => {
    const updated = [...prescribedMedicines];
    updated.splice(index, 1);
    setPrescribedMedicines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!diagnosis || !symptoms) {
      setErrorMsg('Diagnosis and Symptoms are required.');
      return;
    }
    
    // Validate medicine rows
    for (const m of prescribedMedicines) {
      if (!m.medicine_id || !m.dosage || !m.frequency || !m.duration || !m.quantity) {
        setErrorMsg('Please fill out all required fields (Medicine, Dosage, Frequency, Duration, Quantity) for each prescribed medicine.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg('');
    const token = getToken();

    try {
      const cleanFollowUpDate = (followUpDate && followUpDate.trim() !== '') ? followUpDate : undefined;

      // 1. Create Medical Record
      const medRecPayload = {
        patient_id: appointment.patient_id._id || appointment.patient_id,
        appointment_id: appointment._id,
        patient_age: patientAge ? Number(patientAge) : undefined,
        patient_gender: patientGender || undefined,
        diagnosis,
        symptoms,
        doctor_notes: doctorNotes,
        visit_date: appointment.appointment_date,
        follow_up_date: cleanFollowUpDate,
        prescription: prescribedMedicines.length > 0 ? 'Prescription attached' : '', 
        medicines_prescribed: prescribedMedicines.map(m => ({
          medicine_id: m.medicine_id,
          dosage: m.dosage,
          duration: m.duration
        }))
      };

      const medRecRes = await fetch(`${API}/med-rec/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(medRecPayload)
      });
      const medRecData = await medRecRes.json();
      if (!medRecRes.ok) throw new Error(medRecData.message || 'Failed to create Medical Record');

      const medical_record_id = medRecData.data._id;

      // 2. Create Prescription (if medicines are added)
      if (prescribedMedicines.length > 0) {
        const presPayload = {
          appointment_id: appointment._id,
          medical_record_id,
          patient_id: appointment.patient_id._id || appointment.patient_id,
          patient_age: patientAge ? Number(patientAge) : undefined,
          patient_gender: patientGender || undefined,
          medicines: prescribedMedicines.map(m => ({
            medicine_id: m.medicine_id,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            quantity: Number(m.quantity) || 1,
            instructions: m.instructions || ''
          })),
          quantity: 1,
          general_instructions: doctorNotes,
          follow_up_date: cleanFollowUpDate
        };

        const presRes = await fetch(`${API}/prescription/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(presPayload)
        });
        const presData = await presRes.json();
        if (!presRes.ok) throw new Error(presData.message || 'Failed to create Prescription');
      }

      onSuccess();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="wpm-overlay">
      <div className="wpm-modal">
        <div className="wpm-header">
          <div className="wpm-header-title">
            <FileText size={20} color="#0d9488" />
            <h2>Write Consultation Record</h2>
          </div>
          <button onClick={onClose} className="wpm-close-btn"><X size={20} /></button>
        </div>

        <div className="wpm-body">
          {errorMsg && <div className="wpm-error">{errorMsg}</div>}

          <form id="wpm-form" onSubmit={handleSubmit}>
            {/* Patient Details Row: Age & Gender */}
            <div className="wpm-form-grid" style={{ marginBottom: '1rem' }}>
              <div className="wpm-form-group">
                <label>Patient Age *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="120"
                  value={patientAge}
                  onChange={e => setPatientAge(e.target.value)}
                  placeholder="E.g. 28"
                />
              </div>
              <div className="wpm-form-group">
                <label>Patient Gender *</label>
                <select
                  required
                  value={patientGender}
                  onChange={e => setPatientGender(e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="wpm-form-grid">
              <div className="wpm-form-group">
                <label>Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  placeholder="E.g. Viral Fever"
                />
              </div>
              <div className="wpm-form-group">
                <label>Follow-up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="wpm-form-group" style={{ marginTop: '1rem' }}>
              <label>Symptoms *</label>
              <textarea
                required
                rows="2"
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                placeholder="Patient symptoms..."
              />
            </div>

            <div className="wpm-form-group" style={{ marginTop: '1rem' }}>
              <label>Doctor Notes / Instructions</label>
              <textarea
                rows="2"
                value={doctorNotes}
                onChange={e => setDoctorNotes(e.target.value)}
                placeholder="Additional advice, diet or general instructions..."
              />
            </div>

            <div className="wpm-medicines-section">
              <div className="wpm-medicines-header">
                <h3><Pill size={16} /> Prescribe Medicines</h3>
                <button type="button" onClick={addMedicineRow} className="wpm-add-med-btn">
                  <Plus size={14} /> Add Medicine
                </button>
              </div>

              {prescribedMedicines.length === 0 ? (
                <div className="wpm-no-meds">No medicines added. Click "Add Medicine" to prescribe.</div>
              ) : (
                <div className="wpm-meds-list">
                  {prescribedMedicines.map((med, index) => (
                    <div key={index} className="wpm-med-row">
                      {/* Medicine Select */}
                      <div className="wpm-med-col wpm-med-select">
                        <select
                          required
                          value={med.medicine_id}
                          onChange={e => updateMedicineRow(index, 'medicine_id', e.target.value)}
                        >
                          <option value="">Select Medicine</option>
                          {medicinesList.map(m => (
                            <option key={m._id} value={m._id}>
                              {m.medicine_name} {m.strength ? `(${m.strength})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Dosage Dropdown */}
                      <div className="wpm-med-col wpm-med-dosage">
                        <select
                          value={med.dosage_custom ? 'custom' : (DOSAGE_OPTIONS.includes(med.dosage) ? med.dosage : (med.dosage ? 'custom' : ''))}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'custom') {
                              updateMedicineRow(index, 'dosage_custom', true);
                              updateMedicineRow(index, 'dosage', '');
                            } else {
                              updateMedicineRow(index, 'dosage_custom', false);
                              updateMedicineRow(index, 'dosage', val);
                            }
                          }}
                        >
                          <option value="">Select Dosage</option>
                          {DOSAGE_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                          <option value="custom">Custom...</option>
                        </select>
                        {(med.dosage_custom || (!DOSAGE_OPTIONS.includes(med.dosage) && med.dosage)) && (
                          <input
                            type="text"
                            required
                            placeholder="Custom dosage"
                            value={med.dosage}
                            style={{ marginTop: '4px' }}
                            onChange={e => updateMedicineRow(index, 'dosage', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Frequency Dropdown */}
                      <div className="wpm-med-col wpm-med-freq">
                        <select
                          value={med.frequency_custom ? 'custom' : (FREQUENCY_OPTIONS.includes(med.frequency) ? med.frequency : (med.frequency ? 'custom' : ''))}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'custom') {
                              updateMedicineRow(index, 'frequency_custom', true);
                              updateMedicineRow(index, 'frequency', '');
                            } else {
                              updateMedicineRow(index, 'frequency_custom', false);
                              updateMedicineRow(index, 'frequency', val);
                            }
                          }}
                        >
                          <option value="">Select Frequency</option>
                          {FREQUENCY_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                          <option value="custom">Custom...</option>
                        </select>
                        {(med.frequency_custom || (!FREQUENCY_OPTIONS.includes(med.frequency) && med.frequency)) && (
                          <input
                            type="text"
                            required
                            placeholder="Custom frequency"
                            value={med.frequency}
                            style={{ marginTop: '4px' }}
                            onChange={e => updateMedicineRow(index, 'frequency', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Duration Dropdown */}
                      <div className="wpm-med-col wpm-med-dur">
                        <select
                          value={med.duration_custom ? 'custom' : (DURATION_OPTIONS.includes(med.duration) ? med.duration : (med.duration ? 'custom' : ''))}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'custom') {
                              updateMedicineRow(index, 'duration_custom', true);
                              updateMedicineRow(index, 'duration', '');
                            } else {
                              updateMedicineRow(index, 'duration_custom', false);
                              updateMedicineRow(index, 'duration', val);
                            }
                          }}
                        >
                          <option value="">Select Duration</option>
                          {DURATION_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                          <option value="custom">Custom...</option>
                        </select>
                        {(med.duration_custom || (!DURATION_OPTIONS.includes(med.duration) && med.duration)) && (
                          <input
                            type="text"
                            required
                            placeholder="Custom duration"
                            value={med.duration}
                            style={{ marginTop: '4px' }}
                            onChange={e => updateMedicineRow(index, 'duration', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Quantity Input */}
                      <div className="wpm-med-col wpm-med-qty">
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Qty"
                          value={med.quantity}
                          onChange={e => updateMedicineRow(index, 'quantity', e.target.value)}
                        />
                      </div>

                      {/* Instruction Input */}
                      <div className="wpm-med-col wpm-med-inst">
                        <input
                          type="text"
                          placeholder="Instructions (e.g. After food)"
                          value={med.instructions}
                          onChange={e => updateMedicineRow(index, 'instructions', e.target.value)}
                        />
                      </div>

                      {/* Delete Row Button */}
                      <button
                        type="button"
                        onClick={() => removeMedicineRow(index)}
                        className="wpm-remove-med-btn"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="wpm-footer">
          <button type="button" onClick={onClose} className="wpm-cancel-btn">Cancel</button>
          <button type="submit" form="wpm-form" className="wpm-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={16} className="wpm-spin" /> : <Save size={16} />}
            {isSubmitting ? 'Saving...' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WritePrescriptionModal;
