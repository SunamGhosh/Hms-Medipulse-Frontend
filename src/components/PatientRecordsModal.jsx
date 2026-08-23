import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Loader2, CalendarCheck, Pill } from 'lucide-react';
import './PatientRecordsModal.css';

const API = import.meta.env.VITE_URL;
const getToken = () => localStorage.getItem('doctorToken');

const PatientRecordsModal = ({ isOpen, onClose, patient }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/med-rec/my-records?patient_id=${patient._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRecords(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && patient) {
      fetchRecords();
    }
  }, [isOpen, patient]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="prm-overlay">
      <div className="prm-modal">
        <div className="prm-header">
          <div className="prm-header-title">
            <ShieldCheck size={20} color="#0d9488" />
            <h2>Medical History: {patient?.first_name} {patient?.last_name}</h2>
          </div>
          <button onClick={onClose} className="prm-close-btn"><X size={20} /></button>
        </div>

        <div className="prm-body">
          {loading ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
              <p>Loading medical records…</p>
            </div>
          ) : records.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
              <ShieldCheck size={60} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>No medical records found</h3>
              <p>This patient has no past consultation records with you.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {records.map((record) => (
                <div key={record._id} style={{
                  background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ padding: '4px 10px', background: '#eff6ff', color: '#2563eb', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                          {formatDate(record.visit_date || record.createdAt)}
                        </span>
                        {record.follow_up_date && (
                          <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CalendarCheck size={12} /> Follow up: {formatDate(record.follow_up_date)}
                          </span>
                        )}
                      </div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                        {record.diagnosis}
                      </h3>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Symptoms</h4>
                      <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>{record.symptoms}</p>
                    </div>
                    {record.doctor_notes && (
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Doctor's Notes</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>{record.doctor_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Prescriptions */}
                  {record.medicines_prescribed && record.medicines_prescribed.length > 0 && (
                    <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', marginTop: '0.5rem' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Pill size={15} color="#0d9488" /> Prescribed Medicines
                      </h4>
                      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>
                              <th style={{ padding: '8px 10px', textAlign: 'center', width: '40px' }}>Sl. No.</th>
                              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Medicine Name</th>
                              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Dosage</th>
                              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.medicines_prescribed.map((med, idx) => (
                              <tr key={idx} style={{ borderTop: '1px solid #e2e8f0', background: '#fff' }}>
                                <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>
                                  {med.medicine_id?.medicine_name || med.medicine_name || 'Prescribed Medicine'}
                                  {med.medicine_id?.strength ? ` (${med.medicine_id.strength})` : ''}
                                </td>
                                <td style={{ padding: '8px 10px', color: '#334155' }}>{med.dosage}</td>
                                <td style={{ padding: '8px 10px', color: '#334155' }}>{med.duration}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientRecordsModal;
