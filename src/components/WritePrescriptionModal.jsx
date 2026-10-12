import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Plus, Trash2, Loader2, Save, FileText, Pill, CalendarCheck, Search, ChevronDown, Check, Download, Building2, Stethoscope } from 'lucide-react';
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

// Searchable Medicine Dropdown Component with Live Search Bar
const SearchableMedicineSelect = ({
  value,
  onChange,
  medicinesList,
  loadingMedicines
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedMed = useMemo(() => {
    return medicinesList.find(m => m._id === value);
  }, [medicinesList, value]);

  const filteredMedicines = useMemo(() => {
    if (!searchQuery.trim()) return medicinesList;
    const q = searchQuery.toLowerCase().trim();
    return medicinesList.filter(m =>
      (m.medicine_name && m.medicine_name.toLowerCase().includes(q)) ||
      (m.generic_name && m.generic_name.toLowerCase().includes(q)) ||
      (m.strength && m.strength.toLowerCase().includes(q)) ||
      (m.category && m.category.toLowerCase().includes(q)) ||
      (m.manufacturer && m.manufacturer.toLowerCase().includes(q))
    );
  }, [medicinesList, searchQuery]);

  return (
    <div
      className={`wpm-searchable-select ${isOpen ? 'is-open' : ''}`}
      ref={containerRef}
      style={{ position: 'relative', zIndex: isOpen ? 100 : 1 }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        className={`wpm-select-trigger ${selectedMed ? 'has-value' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        title={selectedMed ? `${selectedMed.medicine_name} ${selectedMed.strength || ''}` : 'Click to select medicine'}
      >
        <div className="wpm-trigger-content">
          {selectedMed ? (
            <span className="wpm-selected-med-name">
              <span className="wpm-med-title">{selectedMed.medicine_name}</span>
              {selectedMed.strength && (
                <span className="wpm-med-strength-tag">{selectedMed.strength}</span>
              )}
              {selectedMed.category && (
                <span className="wpm-med-cat-tag">{selectedMed.category}</span>
              )}
            </span>
          ) : (
            <span className="wpm-placeholder">
              {loadingMedicines ? 'Loading medicines...' : 'Select / Search Medicine...'}
            </span>
          )}
        </div>
        <div className="wpm-trigger-icons">
          {selectedMed && (
            <span
              className="wpm-clear-btn"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setSearchQuery('');
              }}
              title="Clear selection"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown size={14} className={`wpm-chevron ${isOpen ? 'open' : ''}`} />
        </div>
      </button>

      {/* Hidden input for HTML5 required form validation */}
      <input
        type="text"
        required
        value={value || ''}
        onChange={() => {}}
        tabIndex={-1}
        style={{
          opacity: 0,
          position: 'absolute',
          pointerEvents: 'none',
          height: 0,
          width: 0,
          margin: 0,
          padding: 0,
          border: 'none',
          bottom: 0,
          left: 0
        }}
      />

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="wpm-dropdown-popover">
          {/* Search Bar at top of dropdown */}
          <div className="wpm-search-bar-wrap">
            <Search size={14} className="wpm-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="wpm-search-input"
              placeholder="Search medicine by name, generic, strength..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
            {searchQuery && (
              <button
                type="button"
                className="wpm-search-clear"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Results Summary if filtering */}
          {searchQuery.trim() && (
            <div className="wpm-search-results-count">
              Found {filteredMedicines.length} {filteredMedicines.length === 1 ? 'medicine' : 'medicines'}
            </div>
          )}

          {/* List of Medicines */}
          <div className="wpm-med-dropdown-list">
            {filteredMedicines.length === 0 ? (
              <div className="wpm-med-empty">
                No medicines found matching "{searchQuery}"
              </div>
            ) : (
              filteredMedicines.map(m => {
                const isSelected = m._id === value;
                return (
                  <div
                    key={m._id}
                    className={`wpm-med-dropdown-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onChange(m._id);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <div className="wpm-med-item-info">
                      <div className="wpm-med-item-main">
                        <span className="wpm-med-item-name">{m.medicine_name}</span>
                        {m.strength && (
                          <span className="wpm-med-item-strength">{m.strength}</span>
                        )}
                        {m.category && (
                          <span className="wpm-med-item-cat">{m.category}</span>
                        )}
                      </div>
                      {(m.generic_name || m.manufacturer) && (
                        <div className="wpm-med-item-sub">
                          {m.generic_name && (
                            <span className="wpm-med-item-generic">{m.generic_name}</span>
                          )}
                          {m.generic_name && m.manufacturer && <span>•</span>}
                          {m.manufacturer && (
                            <span className="wpm-med-item-mfg">{m.manufacturer}</span>
                          )}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check size={16} className="wpm-check-icon" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const WritePrescriptionModal = ({ isOpen, onClose, appointment, doctor, isFollowUp = false, onSuccess }) => {
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
  const [followUpStatusOption, setFollowUpStatusOption] = useState('none'); // 'none' | 'scheduled'
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
      const calculatedDobAge = pat?.dob ? Math.floor((new Date() - new Date(pat.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : '';
      const initialAge = pat?.patient_age || pat?.age || calculatedDobAge || appointment?.patient_age || appointment?.age || '';
      const initialGender = pat?.gender ? (pat.gender.charAt(0).toUpperCase() + pat.gender.slice(1).toLowerCase()) : '';
      setPatientAge(initialAge ? String(initialAge) : '');
      setPatientGender(initialGender);
      setDiagnosis('');
      setSymptoms('');
      setDoctorNotes('');
      if (!isFollowUp && appointment?.follow_up_date) {
        setFollowUpStatusOption('scheduled');
        try {
          setFollowUpDate(new Date(appointment.follow_up_date).toISOString().split('T')[0]);
        } catch {
          setFollowUpDate('');
        }
      } else {
        setFollowUpStatusOption('none');
        setFollowUpDate('');
      }
      setPrescribedMedicines([]);
      setErrorMsg('');
    }
  }, [isOpen, appointment, isFollowUp]);

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

  const handleDownloadRecord = () => {
    const pat = appointment?.patient_id;
    const pName = pat?.first_name
      ? `${pat.first_name} ${pat.last_name || ''}`.trim()
      : (appointment?.patient_name || 'Patient');
    const docName = doctor?.first_name
      ? `Dr. ${doctor.first_name} ${doctor.last_name || ''}`
      : (localStorage.getItem('doctorName') ? `Dr. ${localStorage.getItem('doctorName')}` : 'Dr. Shruti Mishra');
    const docSpec = doctor?.specialization || 'Cardiology & General Medicine';
    const docEmail = doctor?.email || localStorage.getItem('doctorEmail') || 'shruti.mishra@medipulse.com';
    const docPhone = doctor?.phone || '+91 98765 12345';
    const docAddress = doctor?.visit_address || 'Medipulse OPD Block, Sector 4';
    const recDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const disease = diagnosis || appointment?.disease || 'General Consultation';
    const ageVal = patientAge || 'N/A';
    const genderVal = patientGender || 'N/A';
    const phoneVal = pat?.phone || appointment?.phone || '+91 98765 43210';
    const followUpDateStr = (!isFollowUp && followUpStatusOption === 'scheduled' && followUpDate) ? followUpDate : null;

    let medsText = '';
    if (prescribedMedicines.length > 0) {
      medsText = prescribedMedicines.map((m, i) => {
        const medObj = medicinesList.find(x => x._id === m.medicine_id);
        const medName = medObj ? `${medObj.medicine_name} ${medObj.strength ? `(${medObj.strength})` : ''}` : 'Prescribed Medicine';
        return `${i + 1}. ${medName} | Dosage: ${m.dosage || '1 Tablet'} | Freq: ${m.frequency || 'Once a day'} | Duration: ${m.duration || '5 Days'} | Qty: ${m.quantity || 1} | Inst: ${m.instructions || 'After food'}`;
      }).join('\n');
    } else {
      medsText = 'No prescribed medicines attached.';
    }

    const content = `
====================================================================
           MEDIPULSE MULTISPECIALTY CLINIC & CARE CENTER
               OFFICIAL MEDICAL RECORD & PRESCRIPTION
====================================================================

DOCTOR DETAILS:
--------------------------------------------------------------------
Doctor Name  : ${docName} (${docSpec})
Email        : ${docEmail}
Phone        : ${docPhone}
Clinic Addr  : ${docAddress}

PATIENT & CONSULTATION DETAILS:
--------------------------------------------------------------------
Patient Name : ${pName}
Age / Gender : ${ageVal} Yrs / ${genderVal}
Date         : ${recDate}
Phone        : ${phoneVal}
Diagnosis    : ${disease}
Symptoms     : ${symptoms || 'N/A'}
${followUpDateStr ? `Follow-up Date: ${followUpDateStr}\n` : ''}
PRESCRIBED MEDICINES:
--------------------------------------------------------------------
${medsText}

${doctorNotes ? `DOCTOR INSTRUCTIONS:\n${doctorNotes}\n` : ''}
====================================================================
Digitally Signed By: ${docName}
Verification Status: Official ${isFollowUp ? 'Follow-up' : 'Primary'} Medical Consultation Record
====================================================================
`;

    // 1. Direct text file download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Medical_Record_${pName.replace(/\s+/g, '_')}_${recDate.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // 2. Open Print Window for PDF export
    const printWin = window.open('', '_blank');
    if (printWin) {
      const medsHtml = (prescribedMedicines.length > 0)
        ? prescribedMedicines.map((m, i) => {
            const medObj = medicinesList.find(x => x._id === m.medicine_id);
            const medName = medObj ? `${medObj.medicine_name}${medObj.strength ? ` (${medObj.strength})` : ''}` : 'Prescribed Medicine';
            return `
              <tr>
                <td style="text-align: center; color: #475569; font-weight: 600;">${i + 1}</td>
                <td style="font-weight: 700; color: #0f172a;">${medName}</td>
                <td style="color: #334155;">${m.dosage || '1 Tablet'}</td>
                <td style="color: #334155;">${m.frequency || 'Once a day'}</td>
                <td style="color: #334155;">${m.duration || '5 Days'}</td>
                <td style="text-align: center; font-weight: 700; color: #0f172a;">${m.quantity || 1}</td>
                <td style="color: #475569;">${m.instructions || 'After food'}</td>
              </tr>
            `;
          }).join('')
        : `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 16px;">No prescribed medicines attached.</td></tr>`;

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Medical Record - ${pName}</title>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .header-title { color: #000000 !important; }
            }
            body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 36px; color: #0f172a; background: #fff; line-height: 1.5; }
            .header-banner { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            .header-title { margin: 0 0 6px 0; font-size: 24px; font-weight: 900; color: #000000 !important; letter-spacing: 0.5px; text-transform: uppercase; }
            .header-sub { margin: 2px 0; font-size: 13px; color: #1e293b; font-weight: 600; }
            .header-meta { margin-top: 6px; font-size: 12px; color: #334155; display: flex; gap: 16px; flex-wrap: wrap; }
            .patient-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 12px; margin-bottom: 24px; }
            .patient-grid div { font-size: 13px; }
            .patient-grid label { font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; display: block; margin-bottom: 2px; }
            .section-title { font-size: 16px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #0d9488; padding-bottom: 6px; margin-bottom: 12px; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 9px 12px; text-align: left; }
            th { background: #f1f5f9; font-weight: 800; color: #334155; text-transform: uppercase; font-size: 11px; }
            .instructions-box { background: #fffbe6; border: 1px solid #ffe58f; padding: 14px; border-radius: 10px; margin-bottom: 24px; font-size: 13px; color: #434343; }
            .signature-section { margin-top: 36px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px dashed #cbd5e1; padding-top: 16px; }
            .sig-font { font-family: cursive; font-size: 24px; color: #0d9488; font-weight: bold; border-bottom: 1.5px solid #0d9488; }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <h1 class="header-title">MEDIPULSE MULTISPECIALTY CLINIC & CARE CENTER</h1>
            <p class="header-sub"><strong>${docName}</strong> (${docSpec})</p>
            <div class="header-meta">
              <span><strong>Email:</strong> ${docEmail}</span>
              <span><strong>Phone:</strong> ${docPhone}</span>
              <span><strong>Address:</strong> ${docAddress}</span>
              <span><strong>Record Type:</strong> ${isFollowUp ? 'Follow-up Consultation Record' : 'Primary Consultation Record'}</span>
            </div>
          </div>

          <div class="patient-grid">
            <div><label>Patient Name</label><strong>${pName}</strong></div>
            <div><label>Age / Gender</label><strong>${ageVal} Yrs / ${genderVal}</strong></div>
            <div><label>Date</label><strong>${recDate}</strong></div>
            <div><label>Phone</label><strong>${phoneVal}</strong></div>
            <div><label>Diagnosis</label><strong>${disease}</strong></div>
            <div><label>Symptoms</label><strong>${symptoms || 'N/A'}</strong></div>
          </div>

          ${followUpDateStr ? `
            <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; padding: 10px 14px; border-radius: 8px; margin-bottom: 20px;">
              <label style="font-size: 11px; font-weight: 800; color: #1e40af; text-transform: uppercase; display: block; margin-bottom: 2px;">Follow-up Date</label>
              <strong style="font-size: 14px; color: #1d4ed8;">${followUpDateStr}</strong>
            </div>
          ` : ''}

          <div class="section-title">Prescribed Medicines</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine Name</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Qty</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${medsHtml}
            </tbody>
          </table>

          ${doctorNotes ? `
            <div class="instructions-box">
              <strong style="color: #d48806; font-size: 11px; text-transform: uppercase; display: block; margin-bottom: 4px;">Doctor's Advice / Instructions:</strong>
              ${doctorNotes}
            </div>
          ` : ''}

          <div class="signature-section">
            <div>
              <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Official Verification</span>
              <p style="margin: 2px 0 0; font-size: 12px; color: #10b981; font-weight: 700;">✓ Digitally Verified Medical Record</p>
            </div>
            <div style="text-align: right;">
              <div class="sig-font">${docName}</div>
              <p style="margin: 4px 0 0; font-weight: 800; font-size: 13px; color: #0f172a;">Authorized Doctor Signature</p>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `);
      printWin.document.close();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!diagnosis || !symptoms) {
      setErrorMsg('Diagnosis and Symptoms are required.');
      return;
    }

    if (!isFollowUp && followUpStatusOption === 'scheduled' && (!followUpDate || followUpDate.trim() === '')) {
      setErrorMsg('Please select a Follow-up Date since Follow-up is marked as Required, or select "No Follow-up Required".');
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
      const cleanFollowUpDate = (!isFollowUp && followUpStatusOption === 'scheduled' && followUpDate && followUpDate.trim() !== '') ? followUpDate : undefined;

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
        is_follow_up: isFollowUp,
        record_type: isFollowUp ? 'follow_up' : 'primary',
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
          is_follow_up: isFollowUp,
          prescription_type: isFollowUp ? 'follow_up' : 'primary',
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
      <div className="wpm-modal" style={{ maxWidth: '860px' }}>
        <div className="wpm-header">
          <div className="wpm-header-title">
            <FileText size={20} color="#0d9488" />
            <h2>{isFollowUp ? 'Add Prescription' : 'Write Prescription'}</h2>
          </div>
          <button onClick={onClose} className="wpm-close-btn" title="Close"><X size={20} /></button>
        </div>

        {/* Clinic & Doctor Official Banner with Download Record Button */}
        <div className="wpm-clinic-banner">
          <div className="wpm-cb-info">
            <h3 className="wpm-cb-clinic-name">MEDIPULSE MULTISPECIALTY CLINIC & CARE CENTER</h3>
            <p className="wpm-cb-doctor-name">
              Dr. {doctor?.first_name || localStorage.getItem('doctorName') || 'Shruti'} {doctor?.last_name || 'Mishra'}
              {doctor?.specialization ? ` (${doctor.specialization})` : ''}
            </p>
            <div className="wpm-cb-meta">
              <span><strong>Email:</strong> {doctor?.email || localStorage.getItem('doctorEmail') || 'shruti.mishra@medipulse.com'}</span>
              <span><strong>Phone:</strong> {doctor?.phone || '+91 98765 12345'}</span>
              <span><strong>Address:</strong> {doctor?.visit_address || 'Medipulse OPD Block, Sector 4'}</span>
              <span className="wpm-cb-type-badge">
                {isFollowUp ? 'Follow-up Prescription' : 'Official Consultation Record'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="wpm-download-record-btn"
            onClick={handleDownloadRecord}
            title="Download current medical record / printable prescription"
          >
            <Download size={15} /> Download Record
          </button>
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

            <div className="wpm-form-group">
              <label>Diagnosis *</label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                placeholder="E.g. Viral Fever, Hypertension, Acute Gastritis..."
              />
            </div>

            {/* Follow-up Consultation Status Card (Hidden for follow-up prescription) */}
            {!isFollowUp && (
              <div className="wpm-followup-card" style={{
                marginTop: '1rem',
                background: '#f0fdfa',
                border: '1.5px solid #99f6e4',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ margin: 0, fontWeight: 800, fontSize: '13px', color: '#0f766e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarCheck size={16} color="#0d9488" /> Follow-up Consultation Status *
                  </label>
                  <span style={{ fontSize: '11px', color: '#0f766e', background: '#ccfbf1', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, border: '1px solid #99f6e4' }}>
                    Locked after prescription submission
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'flex-start' }}>
                  <div className="wpm-form-group">
                    <label style={{ fontSize: '12px', color: '#334155', fontWeight: 700 }}>Follow-up Requirement *</label>
                    <select
                      value={followUpStatusOption}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFollowUpStatusOption(val);
                        if (val === 'none') {
                          setFollowUpDate('');
                        }
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #0d9488',
                        fontSize: '13px',
                        background: '#fff',
                        color: '#0f172a',
                        fontWeight: 600
                      }}
                    >
                      <option value="none">No Follow-up Required</option>
                      <option value="scheduled">Follow-up Required</option>
                    </select>
                  </div>

                  {followUpStatusOption === 'scheduled' ? (
                    <div className="wpm-form-group">
                      <label style={{ fontSize: '12px', color: '#0f766e', fontWeight: 700 }}>Follow-up Date *</label>
                      <input
                        type="date"
                        required={followUpStatusOption === 'scheduled'}
                        value={followUpDate}
                        onChange={e => setFollowUpDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1.5px solid #0d9488',
                          fontSize: '13px',
                          background: '#fff'
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '12.5px', color: '#64748b', fontStyle: 'italic', paddingTop: '24px' }}>
                      ✓ No follow-up consultation will be scheduled.
                    </div>
                  )}
                </div>

                <p style={{ margin: 0, fontSize: '11.5px', color: '#0f766e', fontWeight: 500, lineHeight: 1.4 }}>
                  🔒 <strong>Note:</strong> Doctor can only set follow-up consultation status while creating this prescription. Once submitted, you cannot change the prescription or add/update follow-up status.
                </p>
              </div>
            )}

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
                      {/* Medicine Select with Search Bar */}
                      <div className="wpm-med-col wpm-med-select">
                        <SearchableMedicineSelect
                          value={med.medicine_id}
                          onChange={val => updateMedicineRow(index, 'medicine_id', val)}
                          medicinesList={medicinesList}
                          loadingMedicines={loadingMedicines}
                        />
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
