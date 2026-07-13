import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, Save, FileText, Pill } from 'lucide-react';
import './WritePrescriptionModal.css';

const API = import.meta.env.VITE_URL;
const getToken = () => localStorage.getItem('doctorToken');

const WritePrescriptionModal = ({ isOpen, onClose, appointment, onSuccess }) => {
  const [medicinesList, setMedicinesList] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [prescribedMedicines, setPrescribedMedicines] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchMedicines();
      // Reset form
      setDiagnosis('');
      setSymptoms('');
      setDoctorNotes('');
      setFollowUpDate('');
      setPrescribedMedicines([]);
      setErrorMsg('');
    }
  }, [isOpen]);

  const fetchMedicines = async () => {
    setLoadingMedicines(true);
    try {
      const res = await fetch(`${API}/medicine/`);
      const data = await res.json();
      if (res.ok) {
        // filter active only
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

  const addMedicineRow = () => {
    setPrescribedMedicines([
      ...prescribedMedicines,
      { medicine_id: '', dosage: '', frequency: '', duration: '', quantity: 1, instructions: '' }
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
        setErrorMsg('Please fill out all required fields for each medicine.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg('');
    const token = getToken();

    try {
      // 1. Create Medical Record
      const medRecPayload = {
        patient_id: appointment.patient_id._id || appointment.patient_id,
        appointment_id: appointment._id,
        diagnosis,
        symptoms,
        doctor_notes: doctorNotes,
        visit_date: appointment.appointment_date,
        follow_up_date: followUpDate || undefined,
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
          medicines: prescribedMedicines,
          general_instructions: doctorNotes,
          follow_up_date: followUpDate || undefined
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
              <label>Doctor Notes</label>
              <textarea
                rows="2"
                value={doctorNotes}
                onChange={e => setDoctorNotes(e.target.value)}
                placeholder="Additional instructions or notes..."
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
                      <div className="wpm-med-col wpm-med-dosage">
                        <input
                          type="text"
                          required
                          placeholder="Dosage (e.g. 1 Tablet)"
                          value={med.dosage}
                          onChange={e => updateMedicineRow(index, 'dosage', e.target.value)}
                        />
                      </div>
                      <div className="wpm-med-col wpm-med-freq">
                        <input
                          type="text"
                          required
                          placeholder="Freq (e.g. 1-0-1)"
                          value={med.frequency}
                          onChange={e => updateMedicineRow(index, 'frequency', e.target.value)}
                        />
                      </div>
                      <div className="wpm-med-col wpm-med-dur">
                        <input
                          type="text"
                          required
                          placeholder="Duration (e.g. 5 days)"
                          value={med.duration}
                          onChange={e => updateMedicineRow(index, 'duration', e.target.value)}
                        />
                      </div>
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
                      <div className="wpm-med-col wpm-med-inst">
                        <input
                          type="text"
                          placeholder="Instructions (Optional)"
                          value={med.instructions}
                          onChange={e => updateMedicineRow(index, 'instructions', e.target.value)}
                        />
                      </div>
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
