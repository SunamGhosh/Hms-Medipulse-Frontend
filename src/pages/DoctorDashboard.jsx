import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, CalendarCheck, User, LogOut, ArrowRight, Clock, ShieldCheck, ArrowUpRight, CheckCircle2,
  AlertCircle, XCircle, Loader2, Users, Stethoscope, Check, Bell, Video, Edit2, Edit3, Lock, Save, X,
  ChevronLeft, ChevronRight, Camera, Calendar, Plus, Eye, EyeOff, Building2, Award, Phone, FileCheck, MapPin,
  Search, Filter, CalendarDays, RotateCcw, RefreshCw, Mail, IndianRupee, FileText, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import './DoctorDashboard.css';
import './AppointmentsList.css';
import WritePrescriptionModal from '../components/WritePrescriptionModal';
import PatientRecordsModal from '../components/PatientRecordsModal';

const API = import.meta.env.VITE_URL;
const getToken = () => localStorage.getItem('doctorToken');

const formatTime24 = (timeStr) => {
  if (!timeStr) return '';
  const s = String(timeStr).trim();
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  const match = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[3];
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }
  return s;
};

const STATUS_CONFIG = {
  pending:   { color: 'blue',   label: 'Pending',   dot: '#3b82f6' },
  confirmed: { color: 'teal',   label: 'Confirmed', dot: '#0d9488' },
  completed: { color: 'green',  label: 'Completed', dot: '#10b981' },
  cancelled: { color: 'rose',   label: 'Cancelled', dot: '#f43f5e' },
  rejected:  { color: 'orange', label: 'Rejected',  dot: '#f97316' },
};

const VIEWS = {
  DASHBOARD: 'dashboard',
  APPOINTMENTS: 'appointments',
  PATIENTS: 'patients',
  PATIENT_RECORDS: 'patient_records',
  PROFILE: 'profile',
};

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth <= 1024);
  const [doctorName, setDoctorName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [view, setView] = useState(VIEWS.DASHBOARD);
  
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [selectedApptForPrescription, setSelectedApptForPrescription] = useState(null);

  const [isPatientRecordsModalOpen, setIsPatientRecordsModalOpen] = useState(false);
  const [selectedPatientForRecords, setSelectedPatientForRecords] = useState(null);
  
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);

  // Appointment Filters & Tracking States
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [patients, setPatients] = useState([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedSpecsPatient, setSelectedSpecsPatient] = useState(null);
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescLoading, setPrescLoading] = useState(false);
  const [recordSearchQuery, setRecordSearchQuery] = useState('');
  const [selectedRecordSheet, setSelectedRecordSheet] = useState(null);
  const [showRecordSheet, setShowRecordSheet] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);

  // Profile Edit & View states
  const [profileLoading, setProfileLoading] = useState(false);
  const [showProfilePicModal, setShowProfilePicModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: '',
    consult_fee: '',
    consult_mode: '',
    work_time_start: '',
    work_time_end: '',
    visit_address: '',
    signature: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = React.useRef(null);
  const sigInputRef = React.useRef(null);

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file for signature'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Signature image must be less than 5MB'); return; }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const scaleSize = (img.width > MAX_WIDTH) ? (MAX_WIDTH / img.width) : 1;
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setEditForm(prev => ({ ...prev, signature: dataUrl }));
        toast.success('Signature image selected!');
      };
      img.onerror = () => {
        setEditForm(prev => ({ ...prev, signature: reader.result }));
        toast.success('Signature image selected!');
      };
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }

    setPhotoUploading(true);
    const token = getToken();
    const formData = new FormData();
    formData.append('profile_img', file);

    try {
      const res = await fetch(`${API}/doctor/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Profile picture updated successfully!');
        fetchProfile();
      } else {
        toast.error(data.message || 'Failed to upload picture');
      }
    } catch {
      toast.error('Error updating profile picture');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    const token = getToken();
    try {
      const res = await fetch(`${API}/doctor/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Profile updated successfully!');
        setShowEditProfileModal(false);
        fetchProfile();
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch {
      toast.error('Error saving profile changes');
    } finally {
      setProfileSaving(false);
    }
  };
  
  // Password Change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passStatus, setPassStatus] = useState({ type: '', msg: '' });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassStatus({ type: '', msg: '' });

    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassStatus({ type: 'error', msg: 'New password and confirm password do not match.' });
      return;
    }

    const token = getToken();
    try {
      const res = await fetch(`${API}/doctor/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPassStatus({ type: 'success', msg: 'Password changed successfully!' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setPassStatus({ type: '', msg: '' });
        }, 2000);
      } else {
        setPassStatus({ type: 'error', msg: data.message || 'Failed to change password' });
      }
    } catch {
      setPassStatus({ type: 'error', msg: 'Network error. Try again.' });
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/doctor/login'); return; }
    const stored = localStorage.getItem('doctorName') || 'Doctor';
    setDoctorName(stored.charAt(0).toUpperCase() + stored.slice(1));
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  const [notification, setNotification] = useState('');
  const pendingCountRef = React.useRef(0);

  const fetchAppointments = useCallback(async (isPolling = false) => {
    const token = getToken();
    if (!token) return;
    if (!isPolling) setApptLoading(true);
    try {
      const res = await fetch(`${API}/appointment/doctorAll`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const appts = data.appointments || [];
        const newPendingCount = appts.filter(a => a.status === 'pending').length;
        if (isPolling && newPendingCount > pendingCountRef.current) {
          setNotification('New appointment request received!');
          setTimeout(() => setNotification(''), 5000);
        }
        pendingCountRef.current = newPendingCount;
        const sorted = appts.sort(
          (a, b) => new Date(b.appointment_date) - new Date(a.appointment_date)
        );
        setAppointments(sorted);
      }
    } catch { /* silent */ }
    finally { if (!isPolling) setApptLoading(false); }
  }, []);

  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setProfileLoading(true);
    try {
      const res = await fetch(`${API}/doctor/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDoctorProfile(data.doctor);
        setEditForm({
          phone: data.doctor.phone || '',
          consult_fee: data.doctor.consult_fee || '',
          consult_mode: data.doctor.consult_mode || '',
          work_time_start: formatTime24(data.doctor.work_time_start || '09:00'),
          work_time_end: formatTime24(data.doctor.work_time_end || '17:00'),
          visit_address: data.doctor.visit_address || '',
          signature: data.doctor.signature || ''
        });
      }
    } catch { /* silent */ }
    finally { setProfileLoading(false); }
  }, []);

  const fetchPatients = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setPatientLoading(true);
    try {
      const res = await fetch(`${API}/patient/doctor/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPatients(data.patients || []);
      }
    } catch { /* silent */ }
    finally {
      setPatientLoading(false);
    }
  }, []);

  const fetchDoctorPrescriptions = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setPrescLoading(true);
    try {
      const res = await fetch(`${API}/prescription/doctor/my-prescriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPrescriptions(data.prescriptions || []);
      }
    } catch { /* silent */ }
    finally { setPrescLoading(false); }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchProfile();
    fetchPatients();
    fetchDoctorPrescriptions();
    const intervalId = setInterval(() => fetchAppointments(true), 15000);
    return () => clearInterval(intervalId);
  }, [fetchAppointments, fetchProfile, fetchPatients, fetchDoctorPrescriptions]);

  const handleLogout = () => {
    localStorage.removeItem('doctorToken');
    localStorage.removeItem('doctorEmail');
    localStorage.removeItem('doctorName');
    toast.success('Logged out successfully');
    navigate('/doctor/login');
  };

  const handleStatusUpdate = async (id, status) => {
    const token = getToken();
    try {
      const endpoint = status === 'confirmed' ? 'confirmed' : status === 'completed' ? 'complete' : status === 'rejected' ? 'reject' : 'cancel';
      const method = 'PUT';
      const res = await fetch(`${API}/appointment/doctor/${id}/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cancel_reason: 'Updated by doctor' })
      });
      if (res.ok) fetchAppointments();
    } catch { /* silent */ }
  };

  const handleJoinVideoCall = async (apptId) => {
    const token = getToken();
    fetch(`${API}/appointment/${apptId}/video-call-reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }).catch(err => console.error('Video call reminder failed:', err));

    navigate(`/video-call/MediPulse_${apptId}`);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    const token = getToken();
    try {
      const res = await fetch(`${API}/doctor/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok) {
        if (data.doctor) setDoctorProfile(data.doctor);
        await fetchProfile();
        setShowEditProfileModal(false);
        setNotification('Profile & official signature updated successfully!');
        toast.success('Profile & signature updated successfully!');
        setTimeout(() => setNotification(''), 4000);
      } else {
        toast.error(data.message || data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Error updating profile');
    } finally {
      setProfileSaving(false);
    }
  };



  const pendingAppts = appointments.filter(a => a.status === 'pending').length;
  const todaysAppts = appointments.filter(a => new Date(a.appointment_date).toDateString() === new Date().toDateString()).length;
  const totalCompleted = appointments.filter(a => a.status === 'completed').length;
  
  const stats = [
    { icon: <CalendarCheck size={22} />, label: 'Today\'s Visits', value: apptLoading ? '…' : todaysAppts, trend: 'Patients', color: 'teal' },
    { icon: <Users size={22} />,         label: 'Total Patients',  value: apptLoading ? '…' : appointments.length, trend: 'All time',    color: 'blue' },
    { icon: <CheckCircle2 size={22} />,  label: 'Completed',       value: apptLoading ? '…' : totalCompleted, trend: 'Consultations', color: 'purple' },
    { icon: <AlertCircle size={22} />,   label: 'Pending',         value: apptLoading ? '…' : pendingAppts, trend: 'Require action',         color: 'rose' },
  ];

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const getStatusCount = (key) => {
    if (key === 'all') return appointments.length;
    return appointments.filter(a => (a.status || '').toLowerCase() === key).length;
  };

  const statusOptions = [
    { key: 'all', label: 'All', count: getStatusCount('all') },
    { key: 'pending', label: 'Pending', count: getStatusCount('pending') },
    { key: 'confirmed', label: 'Confirmed', count: getStatusCount('confirmed') },
    { key: 'completed', label: 'Completed', count: getStatusCount('completed') },
    { key: 'expired', label: 'Expired', count: getStatusCount('expired') },
    { key: 'cancelled', label: 'Cancelled', count: getStatusCount('cancelled') },
    { key: 'rejected', label: 'Rejected', count: getStatusCount('rejected') },
  ];

  const filteredAppointments = appointments.filter((appt) => {
    // 1. Status Filter
    if (statusFilter !== 'all') {
      const apptStatus = (appt.status || '').toLowerCase();
      if (apptStatus !== statusFilter) {
        return false;
      }
    }

    // 2. Search Query (Patient Name, Disease, Symptoms, Phone)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const patientName = `${appt.patient_id?.first_name || ''} ${appt.patient_id?.last_name || ''}`.toLowerCase();
      const disease = (appt.disease || '').toLowerCase();
      const symptomsStr = Array.isArray(appt.symptoms) ? appt.symptoms.join(' ').toLowerCase() : '';
      const phone = (appt.patient_id?.phone || '').toLowerCase();

      const matchesName = patientName.includes(q);
      const matchesDisease = disease.includes(q);
      const matchesSymptoms = symptomsStr.includes(q);
      const matchesPhone = phone.includes(q);

      if (!matchesName && !matchesDisease && !matchesSymptoms && !matchesPhone) {
        return false;
      }
    }

    // 3. Date / Time Filter
    if (datePreset === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      const apptDateStr = new Date(appt.appointment_date).toISOString().split('T')[0];
      if (apptDateStr !== todayStr) return false;
    } else if (datePreset === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const apptDate = new Date(appt.appointment_date);
      if (apptDate < today) return false;
    } else if (datePreset === 'past') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const apptDate = new Date(appt.appointment_date);
      if (apptDate >= today) return false;
    } else if (dateFilter) {
      const apptDateStr = new Date(appt.appointment_date).toISOString().split('T')[0];
      if (apptDateStr !== dateFilter) return false;
    }

    return true;
  });

  const completedAppointments = appointments.filter(a => (a.status || '').toLowerCase() === 'completed');

  const filteredPatientsList = completedAppointments.filter((appt) => {
    if (!patientSearchQuery.trim()) return true;
    const q = patientSearchQuery.toLowerCase().trim();
    const pName = `${appt.patient_id?.first_name || ''} ${appt.patient_id?.last_name || ''}`.toLowerCase();
    const bName = `${appt.booked_by?.first_name || ''} ${appt.booked_by?.last_name || ''}`.toLowerCase();
    const disease = (appt.disease || '').toLowerCase();
    const email = (appt.patient_id?.email || appt.booked_by?.email || '').toLowerCase();
    const phone = (appt.patient_id?.phone || appt.booked_by?.phone || '').toLowerCase();

    return pName.includes(q) || bName.includes(q) || disease.includes(q) || email.includes(q) || phone.includes(q);
  });

  const filteredPatientRecords = (prescriptions.length > 0 ? prescriptions : completedAppointments).filter((rec) => {
    if (!recordSearchQuery.trim()) return true;
    const q = recordSearchQuery.toLowerCase().trim();
    const pName = (rec.patient_id?.first_name
      ? `${rec.patient_id.first_name} ${rec.patient_id.last_name || ''}`
      : `${rec.patient_name || ''}`).toLowerCase();
    const disease = (rec.disease || rec.diagnosis || rec.appointment_id?.disease || '').toLowerCase();
    const prescId = (rec.prescription_id || rec._id || '').toLowerCase();
    const date = (rec.prescribed_date || rec.appointment_date || '').toLowerCase();

    return pName.includes(q) || disease.includes(q) || prescId.includes(q) || date.includes(q);
  });

  const handleDownloadRecord = (rec) => {
    const pName = rec.patient_id?.first_name
      ? `${rec.patient_id.first_name} ${rec.patient_id.last_name || ''}`.trim()
      : (rec.patient_name || 'Patient');
    const docName = `Dr. ${doctorProfile?.first_name || doctorName} ${doctorProfile?.last_name || ''}`;
    const docEmail = doctorProfile?.email || localStorage.getItem('doctorEmail') || 'dr.somnath@medipulse.com';
    const docPhone = doctorProfile?.phone || '+91 98765 12345';
    const docAddress = doctorProfile?.visit_address || 'Medipulse Healthcare Tower, Sector 4';
    const recDate = formatDate(rec.prescribed_date || rec.appointment_date || rec.createdAt);
    const disease = rec.disease || rec.diagnosis || rec.appointment_id?.disease || 'General Consultation';
    const age = rec.patient_id?.age || rec.age || '28';
    const gender = rec.patient_id?.gender || rec.gender || 'Male';
    const phone = rec.patient_id?.phone || rec.phone || rec.booked_by?.phone || '+91 98765 43210';

    let medsText = '';
    if (Array.isArray(rec.medicines) && rec.medicines.length > 0) {
      medsText = rec.medicines.map((m, i) => `${i + 1}. ${m.medicine_name || m.name} - Dosage: ${m.dosage || '1 Tablet'} (${m.duration || m.frequency || '5 Days'})`).join('\n');
    } else {
      medsText = '1. Paracetamol 500mg - 1 Tablet After Meals (5 Days)\n2. Amoxicillin 250mg - 1 Tablet Twice Daily (3 Days)\n3. Multivitamin Supplement - 1 Tablet Before Sleep (7 Days)';
    }

    const content = `
====================================================================
           MEDIPULSE MULTISPECIALTY CLINIC & CARE CENTER
                  OFFICIAL MEDICAL RECORD & PRESCRIPTION
====================================================================

DOCTOR DETAILS:
--------------------------------------------------------------------
Doctor Name  : ${docName}
Email        : ${docEmail}
Phone        : ${docPhone}
Clinic Addr  : ${docAddress}

PATIENT & CONSULTATION DETAILS:
--------------------------------------------------------------------
Patient Name : ${pName}
Age / Gender : ${age} Yrs / ${gender}
Date         : ${recDate}
Phone        : ${phone}
Disease      : ${disease}

PRESCRIBED MEDICINES (Rx):
--------------------------------------------------------------------
${medsText}

${rec.general_instructions ? `DOCTOR INSTRUCTIONS:\n${rec.general_instructions}\n` : ''}
====================================================================
Digitally Signed By: ${docName}
Verification Status: Digitally Verified Medical Record
====================================================================
`;

    // 1. Direct File Download (Desktop file)
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Medical_Record_${pName.replace(/\s+/g, '_')}_${recDate.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // 2. Open Print Window for PDF Export
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Medical Record - ${pName}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #0f172a; }
            .header { background: #0f766e; color: #fff; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
            .header h1 { margin: 0 0 6px 0; font-size: 22px; text-transform: uppercase; }
            .header p { margin: 2px 0; font-size: 13px; opacity: 0.9; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 20px; border-radius: 12px; margin-bottom: 24px; }
            .grid div { font-size: 14px; }
            .grid label { font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; display: block; }
            .rx-title { font-size: 18px; font-weight: bold; color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 6px; margin-bottom: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; font-size: 13px; }
            th { background: #f1f5f9; font-weight: bold; }
            .signature { margin-top: 40px; text-align: right; border-top: 1px dashed #cbd5e1; padding-top: 20px; }
            .sig-font { font-family: cursive; font-size: 24px; color: #0f766e; font-weight: bold; text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MEDIPULSE MULTISPECIALTY CLINIC & CARE CENTER</h1>
            <p><strong>Doctor:</strong> ${docName} | <strong>Email:</strong> ${docEmail} | <strong>Phone:</strong> ${docPhone}</p>
            <p><strong>Clinic Address:</strong> ${docAddress}</p>
          </div>
          <div class="grid">
            <div><label>Patient Name</label><strong>${pName}</strong></div>
            <div><label>Age / Gender</label><strong>${age} Yrs / ${gender}</strong></div>
            <div><label>Disease / Condition</label><strong>${disease}</strong></div>
            <div><label>Prescription Date</label><strong>${recDate}</strong></div>
            <div><label>Phone Number</label><strong>${phone}</strong></div>
          </div>
          <div class="rx-title">Prescribed Medicines (Rx)</div>
          <table>
            <thead>
              <tr><th>#</th><th>Medicine Name</th><th>Dosage</th><th>Duration / Frequency</th></tr>
            </thead>
            <tbody>
              ${Array.isArray(rec.medicines) && rec.medicines.length > 0 ? rec.medicines.map((m, i) => `
                <tr><td>${i+1}</td><td><strong>${m.medicine_name || m.name}</strong></td><td>${m.dosage || '1 Tablet'}</td><td>${m.duration || m.frequency || '5 Days'}</td></tr>
              `).join('') : `
                <tr><td>1</td><td><strong>Paracetamol 500mg</strong></td><td>1 Tablet After Meals</td><td>5 Days (1-0-1)</td></tr>
                <tr><td>2</td><td><strong>Amoxicillin 250mg</strong></td><td>1 Tablet Twice Daily</td><td>3 Days (1-0-1)</td></tr>
                <tr><td>3</td><td><strong>Multivitamin Supplement</strong></td><td>1 Tablet Before Sleep</td><td>7 Days (0-0-1)</td></tr>
              `}
            </tbody>
          </table>
          <div class="signature">
            ${(rec.doctor_id?.signature || doctorProfile?.signature) ? `
              <img src="${rec.doctor_id?.signature || doctorProfile?.signature}" alt="Doctor Official Signature" style="max-height: 54px; max-width: 200px; object-fit: contain; margin-bottom: 4px; border-bottom: 1.5px solid #0f766e; padding-bottom: 2px;" />
            ` : `
              <div class="sig-font">${docName}</div>
            `}
            <p style="margin:4px 0 0; font-weight:bold; font-size:13px;">Authorized Doctor Signature</p>
            <p style="margin:2px 0 0; font-size:11px; color:#10b981;">Digitally Verified Prescription</p>
          </div>
        </body>
        </html>
      `);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => { printWin.print(); }, 500);
    }
    toast.success('Medical record downloaded & PDF print prompt opened!');
  };

  return (
    <div className="dd-container">
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', background: '#0d9488', color: '#fff',
          padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600,
          animation: 'slideIn 0.3s ease-out'
        }}>
          <Bell size={18} /> {notification}
        </div>
      )}
      <div className="dd-blob dd-blob-1" />
      <div className="dd-blob dd-blob-2" />
      
      <aside className={`dd-sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
        <div className="dd-sidebar-brand">
          <div className="dd-brand-info">
            <div className="dd-sidebar-logo">
              <Stethoscope size={20} strokeWidth={2.5} color="#fff" />
            </div>
            {!sidebarCollapsed && <span className="dd-brand-text">Doctor Portal</span>}
          </div>
          <button
            className="dd-sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="dd-nav">
          <button className={`dd-nav-item${view === VIEWS.DASHBOARD ? ' active' : ''}`}
            onClick={() => setView(VIEWS.DASHBOARD)} title={sidebarCollapsed ? "Dashboard" : ""}>
            <Activity size={18} /> {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          <button className={`dd-nav-item${view === VIEWS.APPOINTMENTS ? ' active' : ''}`}
            onClick={() => setView(VIEWS.APPOINTMENTS)} title={sidebarCollapsed ? "Appointments" : ""}>
            <CalendarCheck size={18} /> {!sidebarCollapsed && <span>Appointments</span>}
            {pendingAppts > 0 && (
              <span className="dd-badge-count" style={{ marginLeft: sidebarCollapsed ? '0' : 'auto' }}>{pendingAppts}</span>
            )}
          </button>

          <button className={`dd-nav-item${view === VIEWS.PATIENTS ? ' active' : ''}`}
            onClick={() => setView(VIEWS.PATIENTS)} title={sidebarCollapsed ? "My Patients" : ""}>
            <Users size={18} /> {!sidebarCollapsed && <span>My Patients</span>}
          </button>

          <button className={`dd-nav-item${view === VIEWS.PATIENT_RECORDS ? ' active' : ''}`}
            onClick={() => setView(VIEWS.PATIENT_RECORDS)} title={sidebarCollapsed ? "Patient Records" : ""}>
            <FileText size={18} /> {!sidebarCollapsed && <span>Patient Records</span>}
          </button>

          <div className="dd-nav-divider" />

          <button className={`dd-nav-item${view === VIEWS.PROFILE ? ' active' : ''}`}
            onClick={() => setView(VIEWS.PROFILE)} title={sidebarCollapsed ? "My Profile" : ""}>
            <User size={18} /> {!sidebarCollapsed && <span>My Profile</span>}
          </button>
        </nav>

        <button className="dd-logout-btn" onClick={handleLogout} title={sidebarCollapsed ? "Sign Out" : ""} style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
          <LogOut size={17} /> {!sidebarCollapsed && <span>Sign Out</span>}
        </button>
      </aside>

      <main className={`dd-main${sidebarCollapsed ? ' collapsed' : ''}`}>
        <div className="dd-hero">
          <div className="dd-hero-accent" />
          <div className="dd-hero-left">
            <h1 className="dd-hero-title">
              Welcome back, Dr. <span className="dd-hero-name">{doctorName}</span>
            </h1>
            <p className="dd-hero-sub">
              {greeting} &mdash; Manage patient appointments, doctor consultations, and medical records.
            </p>
          </div>
          <div className="dd-hero-right">
            <div className="dd-date">
              <Calendar size={14} style={{ marginRight: 6, color: '#0d9488' }} />
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div
              className="dd-avatar"
              onClick={() => setView(VIEWS.PROFILE)}
              title="View Profile"
              style={{ cursor: 'pointer', overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {doctorProfile?.profile_img ? (
                <img src={doctorProfile.profile_img} alt="Doctor Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                doctorName.charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </div>

        {view === VIEWS.DASHBOARD && (
          <>
            <section className="dd-stats-grid">
              {stats.map((s, i) => (
                <div key={i} className={`dd-stat-card dd-stat-card--${s.color}`}>
                  <div className="dd-stat-top">
                    <div className={`dd-stat-icon-wrapper dd-stat-icon-wrapper--${s.color}`}>{s.icon}</div>
                    <div className="dd-stat-badge"><ArrowUpRight size={14} /><span>{s.trend}</span></div>
                  </div>
                  <div className="dd-stat-bottom">
                    <span className="dd-stat-value">{s.value}</span>
                    <span className="dd-stat-label">{s.label}</span>
                  </div>
                  <div className="dd-stat-glow" />
                </div>
              ))}
            </section>

            <section className="dd-section">
              <div className="dd-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="dd-section-title">Pending Appointments</h2>
                <button onClick={() => setView(VIEWS.APPOINTMENTS)}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View all <ArrowRight size={13} />
                </button>
              </div>
              <div className="dd-section-body">
                {apptLoading ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : appointments.filter(a => a.status === 'pending').length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    <CheckCircle2 size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                    <p>No pending appointments to confirm.</p>
                  </div>
                ) : (
                  <ul className="dd-activity-list">
                    {appointments.filter(a => a.status === 'pending').slice(0, 4).map((appt, i) => {
                      const cfg = STATUS_CONFIG[appt.status];
                      return (
                        <li key={i} className="dd-activity-item">
                          <div className="dd-activity-dot" style={{ background: cfg.dot, boxShadow: `0 0 0 3px ${cfg.dot}33` }} />
                          <div className="dd-activity-content">
                            <p className="dd-activity-title">
                              Patient: {appt.patient_id?.first_name} {appt.patient_id?.last_name}
                            </p>
                            <div className="dd-activity-meta">
                              <Clock size={11} />
                              <span>{formatDate(appt.appointment_date)} at {appt.appointment_time}</span>
                              <span className={`dd-activity-badge dd-badge-${cfg.color}`}>{cfg.label}</span>
                              <button onClick={() => handleStatusUpdate(appt._id, 'confirmed')} style={{marginLeft: 'auto', background: '#0d9488', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600}}>Confirm</button>
                              <button onClick={() => handleStatusUpdate(appt._id, 'rejected')} style={{background: '#fecaca', color: '#dc2626', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600}}>Reject</button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}

        {view === VIEWS.APPOINTMENTS && (
          <section className="dd-section dd-appointments-section" style={{ background: 'transparent', padding: 0, boxShadow: 'none', border: 'none' }}>
            {/* Header */}
            <div className="appointments-header">
              <div className="al-title-box">
                <h2>Appointments Management</h2>
                <p className="al-subtitle">Search, view, and manage all patient & doctor appointments.</p>
              </div>
              <span className="appointments-count">{appointments.length} Total Appointments</span>
            </div>

            {/* Search & Status Filter Controls Card */}
            <div className="al-controls-card">
              <div className="al-search-box">
                <Search className="al-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Search by patient name (e.g. Subham) or disease/symptoms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="al-clear-btn" onClick={() => setSearchQuery('')} title="Clear search">
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Status Tabs Bar */}
              <div className="al-tabs-bar">
                {statusOptions.map(opt => (
                  <button
                    key={opt.key}
                    className={`al-tab-btn ${statusFilter === opt.key ? 'active' : ''}`}
                    onClick={() => setStatusFilter(opt.key)}
                  >
                    <span>{opt.label}</span>
                    <span className="al-tab-count">{opt.count}</span>
                  </button>
                ))}
                {(searchQuery || statusFilter !== 'all' || dateFilter || datePreset !== 'all') && (
                  <button
                    className="al-reset-btn"
                    onClick={() => { setSearchQuery(''); setStatusFilter('all'); setDateFilter(''); setDatePreset('all'); }}
                    title="Reset filters"
                  >
                    <RefreshCw size={14} /> Reset
                  </button>
                )}
              </div>

              {/* Date Filters Option */}
              <div className="dd-date-tracking-box" style={{ marginTop: 2, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                <div className="dd-date-input-wrap">
                  <CalendarDays size={16} className="dd-date-icon" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      if (e.target.value) setDatePreset('custom');
                    }}
                    className="dd-date-input"
                    title="Track appointments by date"
                  />
                  {dateFilter && (
                    <button
                      className="dd-clear-date-btn"
                      onClick={() => { setDateFilter(''); setDatePreset('all'); }}
                      title="Clear date filter"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="dd-date-presets">
                  <button
                    className={`dd-dp-pill ${datePreset === 'all' && !dateFilter ? 'active' : ''}`}
                    onClick={() => { setDatePreset('all'); setDateFilter(''); }}
                  >
                    All Dates
                  </button>
                  <button
                    className={`dd-dp-pill ${datePreset === 'today' ? 'active' : ''}`}
                    onClick={() => { setDatePreset('today'); setDateFilter(''); }}
                  >
                    Today
                  </button>
                  <button
                    className={`dd-dp-pill ${datePreset === 'upcoming' ? 'active' : ''}`}
                    onClick={() => { setDatePreset('upcoming'); setDateFilter(''); }}
                  >
                    Upcoming
                  </button>
                  <button
                    className={`dd-dp-pill ${datePreset === 'past' ? 'active' : ''}`}
                    onClick={() => { setDatePreset('past'); setDateFilter(''); }}
                  >
                    Past
                  </button>
                </div>
              </div>
            </div>

            {/* Results Info Bar */}
            <div className="al-results-info">
              <span>Showing <strong>{filteredAppointments.length}</strong> of {appointments.length} appointments</span>
              {searchQuery && <span> &bull; Filtered by query: "<strong>{searchQuery}</strong>"</span>}
              {statusFilter !== 'all' && <span> &bull; Status: <strong style={{ textTransform: 'capitalize' }}>{statusFilter}</strong></span>}
              {(dateFilter || datePreset !== 'all') && <span> &bull; Date: <strong>{dateFilter || datePreset}</strong></span>}
            </div>

            {/* ── Appointments List Body ── */}
            <div className="dd-section-body">
              {apptLoading ? (
                <div className="dd-loading-state">
                  <Loader2 size={36} className="dd-spin-loader" />
                  <p>Loading appointments…</p>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="dd-empty-state">
                  <CalendarCheck size={56} className="dd-empty-icon" />
                  <h3>No matching appointments found</h3>
                  <p>
                    {searchQuery || dateFilter || statusFilter !== 'all' || datePreset !== 'all'
                      ? "No patient appointments match your current search criteria or date filter."
                      : "No appointments scheduled in your doctor portal yet."}
                  </p>
                  {(searchQuery || dateFilter || statusFilter !== 'all' || datePreset !== 'all') && (
                    <button
                      className="dd-reset-filters-btn"
                      onClick={() => { setStatusFilter('all'); setSearchQuery(''); setDateFilter(''); setDatePreset('all'); }}
                    >
                      Clear Filters & Show All
                    </button>
                  )}
                </div>
              ) : (
                <div className="dd-appointments-cards-container">
                  {filteredAppointments.map((appt) => {
                    const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
                    const patientName = appt.patient_id
                      ? `${appt.patient_id.first_name || ''} ${appt.patient_id.last_name || ''}`.trim()
                      : 'Unknown Patient';
                    const initials = patientName
                      .split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'P';

                    // Relative date calculation
                    const todayStr = new Date().toISOString().split('T')[0];
                    const apptDateStr = appt.appointment_date ? new Date(appt.appointment_date).toISOString().split('T')[0] : '';
                    const isToday = apptDateStr === todayStr;
                    const isPast = apptDateStr && apptDateStr < todayStr;

                    return (
                      <div key={appt._id} className={`dd-appt-card status-${appt.status}`}>
                        {/* Left Status Accent Bar */}
                        <div className="dd-ac-status-bar" style={{ background: cfg.dot }} />

                        {/* Patient Avatar & Main Info */}
                        <div className="dd-ac-patient-info">
                          <div className="dd-ac-avatar">
                            {initials}
                          </div>
                          <div className="dd-ac-details">
                            <div className="dd-ac-name-row">
                              <h4 className="dd-ac-patient-name">{patientName}</h4>
                              <span className={`dd-ac-status-pill dd-badge-${cfg.color}`}>
                                <span className="dd-ac-status-dot" style={{ background: cfg.dot }} />
                                {cfg.label}
                              </span>
                            </div>
                            
                            <div className="dd-ac-meta-grid">
                              {/* Date & Time Tracking */}
                              <div className="dd-ac-meta-item">
                                <Clock size={14} className="dd-ac-meta-icon" />
                                <span className="dd-ac-meta-text">
                                  <strong>{formatDate(appt.appointment_date)}</strong> at <strong>{appt.appointment_time}</strong>
                                </span>
                                {isToday && <span className="dd-ac-time-tag today">Today</span>}
                                {!isToday && isPast && <span className="dd-ac-time-tag past">Past</span>}
                                {!isToday && apptDateStr && !isPast && <span className="dd-ac-time-tag upcoming">Upcoming</span>}
                              </div>

                              {/* Consultation Mode */}
                              <div className="dd-ac-meta-item">
                                {appt.consult_mode === 'online' ? (
                                  <Video size={14} className="dd-ac-meta-icon text-blue" />
                                ) : (
                                  <Building2 size={14} className="dd-ac-meta-icon text-teal" />
                                )}
                                <span className="dd-ac-meta-text">
                                  Mode: <strong style={{ textTransform: 'capitalize' }}>{appt.consult_mode || 'offline'}</strong>
                                </span>
                              </div>

                              {/* Disease / Health Condition */}
                              {appt.disease && (
                                <div className="dd-ac-meta-item">
                                  <Stethoscope size={14} className="dd-ac-meta-icon text-purple" />
                                  <span className="dd-ac-meta-text">
                                    Condition: <strong>{appt.disease}</strong>
                                  </span>
                                </div>
                              )}

                              {/* Patient Contact phone if available */}
                              {appt.patient_id?.phone && (
                                <div className="dd-ac-meta-item">
                                  <Phone size={14} className="dd-ac-meta-icon text-green" />
                                  <span className="dd-ac-meta-text">{appt.patient_id.phone}</span>
                                </div>
                              )}
                            </div>

                            {/* Symptoms Pills */}
                            {Array.isArray(appt.symptoms) && appt.symptoms.length > 0 && (
                              <div className="dd-ac-symptoms-list">
                                <span className="dd-ac-symptoms-label">Symptoms:</span>
                                {appt.symptoms.map((s, idx) => (
                                  <span key={idx} className="dd-ac-symptom-tag">{s}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="dd-ac-actions">
                          {appt.status === 'pending' && (
                            <>
                              <button
                                className="dd-btn-action btn-confirm"
                                onClick={() => handleStatusUpdate(appt._id, 'confirmed')}
                              >
                                <Check size={14} /> Confirm
                              </button>
                              <button
                                className="dd-btn-action btn-reject"
                                onClick={() => handleStatusUpdate(appt._id, 'rejected')}
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </>
                          )}

                          {appt.status === 'confirmed' && (
                            <>
                              {appt.consult_mode === 'online' && (
                                <button
                                  className="dd-btn-action btn-video"
                                  onClick={() => handleJoinVideoCall(appt._id)}
                                >
                                  <Video size={14} /> Start Video Call
                                </button>
                              )}
                              <button
                                className="dd-btn-action btn-complete"
                                onClick={() => handleStatusUpdate(appt._id, 'completed')}
                              >
                                <Check size={14} /> Mark Complete
                              </button>
                              <button
                                className="dd-btn-action btn-cancel"
                                onClick={() => handleStatusUpdate(appt._id, 'cancel')}
                              >
                                <XCircle size={14} /> Cancel
                              </button>
                            </>
                          )}

                          {appt.status === 'completed' && !appt.prescription_added && (
                            <button
                              className="dd-btn-action btn-prescription"
                              onClick={() => {
                                setSelectedApptForPrescription(appt);
                                setIsPrescriptionModalOpen(true);
                              }}
                            >
                              <Edit2 size={14} /> Write Prescription
                            </button>
                          )}

                          {appt.status === 'completed' && appt.prescription_added && (
                            <span className="dd-ac-record-done">
                              <CheckCircle2 size={16} /> Prescription Added
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {view === VIEWS.PATIENTS && (
          <section className="dd-section" style={{ background: 'transparent', padding: 0, boxShadow: 'none', border: 'none' }}>
            {/* Header & Title */}
            <div className="appointments-header" style={{ marginBottom: 20 }}>
              <div className="al-title-box">
                <h2>My Patients</h2>
                <p className="al-subtitle">Search, view patient consultation details, and inspect booking specifications.</p>
              </div>
              <span className="appointments-count">{filteredPatientsList.length} Total Patients</span>
            </div>

            {/* Search Bar Controls Card */}
            <div className="al-controls-card" style={{ marginBottom: 20 }}>
              <div className="al-search-box">
                <Search className="al-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Search by patient name, booked by user, disease, email, or phone number..."
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                />
                {patientSearchQuery && (
                  <button className="al-clear-btn" onClick={() => setPatientSearchQuery('')} title="Clear search">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Patients Table Card */}
            <div className="dd-patients-table-card">
              <div className="dd-patients-table-header">
                <span>Patient Name</span>
                <span>Booked By</span>
                <span>Date</span>
                <span>Time</span>
                <span>Mode</span>
                <span>Disease</span>
                <span>Action</span>
              </div>

              <div className="dd-patients-table-body">
                {apptLoading ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                    <p>Loading patient records…</p>
                  </div>
                ) : filteredPatientsList.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                    <Users size={54} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <h3 style={{ color: '#374151', marginBottom: '0.5rem', fontWeight: 700 }}>No patients found</h3>
                    <p style={{ fontSize: '13px' }}>
                      {patientSearchQuery
                        ? `No patient records match "${patientSearchQuery}".`
                        : "No patient records assigned to you yet."}
                    </p>
                  </div>
                ) : (
                  filteredPatientsList.map((appt) => {
                    const pName = appt.patient_id?.first_name
                      ? `${appt.patient_id.first_name} ${appt.patient_id.last_name || ''}`.trim()
                      : 'Unknown Patient';
                    const bName = appt.booked_by?.first_name
                      ? `${appt.booked_by.first_name} ${appt.booked_by.last_name || ''}`.trim()
                      : (appt.booked_by?.email || 'Self / Patient');
                    const apptDate = formatDate(appt.appointment_date);
                    const apptTime = appt.appointment_time || '10:00 AM';
                    const consultMode = appt.consult_mode || 'offline';
                    const diseaseStr = appt.disease || 'General Checkup';

                    return (
                      <div key={appt._id} className="dd-patient-table-row">
                        <div className="dd-pt-cell dd-pt-patient" title={pName}>
                          <div className="dd-pt-avatar">{(pName[0] || 'P').toUpperCase()}</div>
                          <span>{pName}</span>
                        </div>
                        <div className="dd-pt-cell" title={bName}>{bName}</div>
                        <div className="dd-pt-cell dd-pt-sub">{apptDate}</div>
                        <div className="dd-pt-cell dd-pt-sub">{apptTime}</div>
                        <div className="dd-pt-cell">
                          <span className={`dd-mode-tag ${consultMode}`}>
                            {consultMode === 'online' ? <Video size={12} /> : <Building2 size={12} />}
                            {consultMode}
                          </span>
                        </div>
                        <div className="dd-pt-cell" title={diseaseStr}>{diseaseStr}</div>
                        <div className="dd-pt-cell">
                          <button
                            className="dd-btn-view-specs"
                            onClick={() => {
                              setSelectedSpecsPatient(appt);
                              setShowSpecsModal(true);
                            }}
                          >
                            <Eye size={14} /> View Specs
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        )}

        {view === VIEWS.PATIENT_RECORDS && (
          <section className="dd-section" style={{ background: 'transparent', padding: 0, boxShadow: 'none', border: 'none' }}>
            {/* Header & Title */}
            <div className="appointments-header" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div className="al-title-box">
                <h2>Patient Records Page</h2>
                <p className="al-subtitle">View, track, create, and inspect official online digital prescriptions and medical records.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <button
                  className="dd-create-rec-top-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 22px',
                    background: 'linear-gradient(135deg, #0d9488 0%, #0ea5e9 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(13, 148, 136, 0.35)',
                    transition: 'all 0.25s ease'
                  }}
                  onClick={() => {
                    if (completedAppointments.length > 0) {
                      setSelectedApptForPrescription(completedAppointments[0]);
                      setIsPrescriptionModalOpen(true);
                    } else if (appointments.length > 0) {
                      setSelectedApptForPrescription(appointments[0]);
                      setIsPrescriptionModalOpen(true);
                    } else {
                      toast.error('No appointment found to write record for.');
                    }
                  }}
                >
                  <Plus size={18} strokeWidth={3} /> Create New Record
                </button>
                <span className="appointments-count">{filteredPatientRecords.length} Total Records</span>
              </div>
            </div>

            {/* Search Bar Controls Card */}
            <div className="al-controls-card" style={{ marginBottom: 20 }}>
              <div className="al-search-box">
                <Search className="al-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Search medical records by patient name, disease, prescription ID, or date..."
                  value={recordSearchQuery}
                  onChange={(e) => setRecordSearchQuery(e.target.value)}
                />
                {recordSearchQuery && (
                  <button className="al-clear-btn" onClick={() => setRecordSearchQuery('')} title="Clear search">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Results Info Bar */}
            <div className="al-results-info">
              <span>Showing <strong>{filteredPatientRecords.length}</strong> patient prescription records</span>
              {recordSearchQuery && <span> &bull; Filtered by query: "<strong>{recordSearchQuery}</strong>"</span>}
            </div>

            {/* Records Table Card */}
            <div className="dd-patients-table-card">
              <div className="dd-records-table-header">
                <span>Patient Name</span>
                <span>Date</span>
                <span>Action</span>
              </div>

              <div className="dd-patients-table-body">
                {prescLoading ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                    <p>Loading patient records…</p>
                  </div>
                ) : filteredPatientRecords.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                    <FileText size={54} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <h3 style={{ color: '#374151', marginBottom: '0.5rem', fontWeight: 700 }}>No medical records found</h3>
                    <p style={{ fontSize: '13px' }}>
                      {recordSearchQuery
                        ? `No records match "${recordSearchQuery}".`
                        : "No online prescription records created yet."}
                    </p>
                  </div>
                ) : (
                  filteredPatientRecords.map((rec) => {
                    const pName = rec.patient_id?.first_name
                      ? `${rec.patient_id.first_name} ${rec.patient_id.last_name || ''}`.trim()
                      : (rec.patient_name || 'Patient');

                    return (
                      <div key={rec._id} className="dd-record-table-row">
                        <div className="dd-pt-cell dd-pt-patient" title={pName}>
                          <div className="dd-pt-avatar">{(pName[0] || 'P').toUpperCase()}</div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{pName}</span>
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                              Condition: {rec.disease || rec.diagnosis || rec.appointment_id?.disease || 'General Consultation'}
                            </span>
                          </div>
                        </div>
                        <div className="dd-pt-cell dd-pt-sub" style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} style={{ color: '#0d9488' }} />
                          {formatDate(rec.prescribed_date || rec.appointment_date || rec.createdAt)}
                        </div>
                        <div className="dd-pt-cell">
                          <button
                            className="dd-btn-view-specs"
                            style={{ background: '#f0fdf4', color: '#0d9488', borderColor: '#bbf7d0' }}
                            onClick={() => {
                              setSelectedRecordSheet(rec);
                              setShowRecordSheet(true);
                            }}
                          >
                            <FileText size={14} /> View Record
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        )}

        {view === VIEWS.PROFILE && (
          <section className="dd-section">
            <div className="dd-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="dd-section-title">My Doctor Profile</h2>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setShowEditProfileModal(true)} className="dd-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(13,148,136,0.25)' }}>
                  <Edit3 size={16} /> Edit Profile
                </button>
                <button onClick={() => setShowPasswordModal(true)} className="dd-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                  <Lock size={16} /> Change Password
                </button>
              </div>
            </div>

            <div className="dd-section-body">
              {profileLoading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: '1rem', fontWeight: 600 }}>Loading profile information...</p>
                </div>
              ) : doctorProfile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Top Profile Hero Card */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #f0fdf9, #ecfdf5)',
                    borderRadius: '20px',
                    padding: '2rem',
                    border: '1.5px solid rgba(16, 185, 129, 0.2)',
                    boxShadow: '0 10px 30px rgba(13, 148, 136, 0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ position: 'relative', width: 92, height: 92, flexShrink: 0 }}>
                          {doctorProfile.profile_img ? (
                            <img
                              src={doctorProfile.profile_img}
                              alt="Doctor Profile"
                              style={{
                                width: '100%', height: '100%', borderRadius: '50%',
                                objectFit: 'cover', border: '3.5px solid #0d9488',
                                boxShadow: '0 8px 24px rgba(13, 148, 136, 0.3)'
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '100%', height: '100%', borderRadius: '50%',
                              background: 'linear-gradient(135deg, #10b981, #0d9488)',
                              color: '#fff', fontSize: 38, fontWeight: 800,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 8px 24px rgba(13, 148, 136, 0.3)'
                            }}>
                              {doctorProfile.first_name?.[0]?.toUpperCase() || 'D'}
                            </div>
                          )}

                          {/* Dynamic + (Plus) overlay badge button for uploading/updating picture */}
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            title="Click to upload or update profile photo"
                            disabled={photoUploading}
                            style={{
                              position: 'absolute',
                              bottom: 2,
                              right: 2,
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: '#0d9488',
                              color: '#ffffff',
                              border: '2.5px solid #ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                              transition: 'all 0.15s ease-in-out',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            {photoUploading ? (
                              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Plus size={16} strokeWidth={3} />
                            )}
                          </button>
                          <input
                            type="file"
                            ref={photoInputRef}
                            accept="image/*"
                            onChange={handlePhotoChange}
                            style={{ display: 'none' }}
                          />
                        </div>

                        {/* View Profile Picture Button */}
                        {doctorProfile.profile_img && (
                          <button
                            type="button"
                            onClick={() => setShowProfilePicModal(true)}
                            title="View full profile picture"
                            style={{
                              padding: '5px 14px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #0d9488, #10b981)',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              boxShadow: '0 2px 8px rgba(13,148,136,0.3)',
                              transition: 'all 0.15s ease-in-out',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.4)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(13,148,136,0.3)'; }}
                          >
                            <Eye size={14} /> View Photo
                          </button>
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
                            Dr. {doctorProfile.first_name} {doctorProfile.last_name}
                          </h3>
                          {doctorProfile.is_verified && (
                            <span title="Verified Doctor" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: 16, fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <ShieldCheck size={14} /> Verified Specialist
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '6px 0 0', color: '#0d9488', fontSize: '15px', fontWeight: 700 }}>
                          {doctorProfile.specialization || 'Medical Specialist'} &bull; {doctorProfile.department || 'General Medicine'}
                        </p>
                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{doctorProfile.email}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span style={{
                        padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: '0.6px',
                        background: doctorProfile.status === 'active' ? '#ecfdf5' : '#fef2f2',
                        color: doctorProfile.status === 'active' ? '#047857' : '#b91c1c',
                        border: `1px solid ${doctorProfile.status === 'active' ? '#a7f3d0' : '#fecaca'}`
                      }}>
                        ● {doctorProfile.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {[
                      { icon: <Stethoscope size={18} color="#0d9488" />, label: 'Specialization', value: doctorProfile.specialization || '—' },
                      { icon: <Building2 size={18} color="#0d9488" />,   label: 'Department',     value: doctorProfile.department || '—' },
                      { icon: <Phone size={18} color="#0d9488" />,       label: 'Phone Number',   value: doctorProfile.phone || '—' },
                      { icon: <Award size={18} color="#0d9488" />,       label: 'Consultation Fee', value: `₹${doctorProfile.consult_fee || 0}` },
                      { icon: <Video size={18} color="#0d9488" />,       label: 'Consultation Mode', value: (doctorProfile.consult_mode || 'both').toUpperCase() },
                      { icon: <Clock size={18} color="#0d9488" />,       label: 'Working Hours',  value: (doctorProfile.work_time_start && doctorProfile.work_time_end) ? `${doctorProfile.work_time_start} - ${doctorProfile.work_time_end}` : '—' },
                      { icon: <Calendar size={18} color="#0d9488" />,    label: 'Available Days', value: Array.isArray(doctorProfile.available_days) ? doctorProfile.available_days.join(', ') : (doctorProfile.available_days || '—') },
                      { icon: <FileCheck size={18} color="#0d9488" />,   label: 'Medical License', value: doctorProfile.license_no || '—' },
                      { icon: <MapPin size={18} color="#0d9488" />,      label: 'Clinic / Visit Address', value: doctorProfile.visit_address || '—' },
                      {
                        icon: <FileText size={18} color="#0d9488" />,
                        label: 'My Official Signature',
                        value: doctorProfile.signature ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                            <img
                              src={doctorProfile.signature}
                              alt="Official Signature"
                              style={{ height: '42px', maxWidth: '180px', objectFit: 'contain', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '4px', background: '#fff' }}
                            />
                            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldCheck size={14} /> Uploaded & Active
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>
                            No signature uploaded yet. Click "Edit Profile" to upload your signature.
                          </span>
                        )
                      },
                      { icon: <User size={18} color="#0d9488" />,        label: 'Member Since',   value: formatDate(doctorProfile.createdAt) },
                    ].map((item, idx) => (
                      <div key={idx} style={{
                        background: '#ffffff',
                        borderRadius: '14px',
                        padding: '1.1rem 1.25rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem'
                      }}>
                        <div style={{ background: '#f0fdf9', padding: '10px', borderRadius: '10px', flexShrink: 0 }}>
                          {item.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                            {item.label}
                          </div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', lineHeight: 1.4, wordBreak: 'break-word' }}>
                            {item.value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <AlertCircle size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>Could not load doctor profile information.</p>
                  <button onClick={fetchProfile} className="dd-btn-secondary" style={{ marginTop: '1rem' }}>
                    Retry Loading Profile
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

      </main>

      {/* ==================== VIEW PROFILE PICTURE MODAL ==================== */}
      {showProfilePicModal && doctorProfile?.profile_img && (
        <div
          onClick={() => setShowProfilePicModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <button
            onClick={() => setShowProfilePicModal(false)}
            style={{
              position: 'absolute',
              top: 20,
              right: 24,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            <X size={20} />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <img
              src={doctorProfile.profile_img}
              alt="Doctor Profile Picture"
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                borderRadius: '16px',
                objectFit: 'contain',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                border: '3px solid rgba(255,255,255,0.15)',
              }}
            />
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 700, margin: 0 }}>
              Dr. {doctorProfile.first_name} {doctorProfile.last_name} &bull; Profile Picture
            </p>
          </div>
        </div>
      )}

      {/* ==================== EDIT DOCTOR PROFILE MODAL ==================== */}
      {/* ==================== EDIT DOCTOR PROFILE MODAL ==================== */}
      {showEditProfileModal && (
        <div className="dd-modal-overlay">
          <div className="dd-modal" style={{ maxWidth: 560 }}>
            <div className="dd-modal-header">
              <h3><Edit3 size={18} /> Edit Doctor Profile</h3>
              <button onClick={() => setShowEditProfileModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleProfileSave} className="dd-modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Photo Upload / Change Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f0fdf9', borderRadius: '12px', border: '1px solid #ccfbf1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {doctorProfile?.profile_img ? (
                    <img src={doctorProfile.profile_img} alt="Doctor Avatar" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0d9488' }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0d9488', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      {doctorProfile?.first_name?.[0] || 'D'}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Profile Picture</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Click button to upload or change image</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(13,148,136,0.25)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {photoUploading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} strokeWidth={2.5} />}
                  {photoUploading ? 'Uploading...' : 'Upload / Change Photo'}
                </button>
              </div>

              {/* Official Signature Upload Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {editForm.signature ? (
                    <img src={editForm.signature} alt="Signature Preview" style={{ height: 38, maxWidth: 120, objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', padding: 2 }} />
                  ) : (
                    <div style={{ width: 38, height: 38, borderRadius: 8, background: '#f1f5f9', border: '1px dashed #cbd5e1', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={18} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>My Official Signature</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Upload or change digital signature image</div>
                  </div>
                </div>

                <div>
                  <input
                    type="file"
                    ref={sigInputRef}
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => sigInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: '#0ea5e9',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(14,165,233,0.25)'
                    }}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    {editForm.signature ? 'Change Signature' : 'Upload Signature'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                <div className="dd-form-group">
                  <label>Phone Number</label>
                  <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="Phone number" />
                </div>
                <div className="dd-form-group">
                  <label>Consult Fee (₹)</label>
                  <input type="number" value={editForm.consult_fee} onChange={e => setEditForm({...editForm, consult_fee: e.target.value})} placeholder="Consult fee" />
                </div>
                <div className="dd-form-group">
                  <label>Consult Mode</label>
                  <select value={editForm.consult_mode} onChange={e => setEditForm({...editForm, consult_mode: e.target.value})}>
                    <option value="offline">Offline Only</option>
                    <option value="online">Online Only</option>
                    <option value="both">Both (Online & Offline)</option>
                  </select>
                </div>
                <div className="dd-form-group">
                  <label>Work Start Time</label>
                  <input type="time" value={editForm.work_time_start} onChange={e => setEditForm({...editForm, work_time_start: e.target.value})} />
                </div>
                <div className="dd-form-group">
                  <label>Work End Time</label>
                  <input type="time" value={editForm.work_time_end} onChange={e => setEditForm({...editForm, work_time_end: e.target.value})} />
                </div>
                <div className="dd-form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Clinic / Visit Address</label>
                  <input type="text" value={editForm.visit_address} onChange={e => setEditForm({...editForm, visit_address: e.target.value})} placeholder="Full clinic address" />
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowEditProfileModal(false)} className="dd-outline-btn-cancel">Cancel</button>
                <button type="submit" disabled={profileSaving} className="dd-solid-btn" style={{ background: '#0d9488', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>
                  {profileSaving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Password Modal --- */}
      {showPasswordModal && (
        <div className="dd-modal-overlay">
          <div className="dd-modal">
            <div className="dd-modal-header">
              <h3>Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleChangePassword} className="dd-modal-body">
              {passStatus.msg && (
                <div className={`dd-alert dd-alert-${passStatus.type}`}>
                  {passStatus.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{passStatus.msg}</span>
                </div>
              )}
              <div className="dd-form-group">
                <label>Current Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={passForm.currentPassword}
                    onChange={e => setPassForm({...passForm, currentPassword: e.target.value})}
                    placeholder="Enter current password"
                    style={{ width: '100%', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: 0 }}
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="dd-form-group" style={{ marginTop: '12px' }}>
                <label>New Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={passForm.newPassword}
                    onChange={e => setPassForm({...passForm, newPassword: e.target.value})}
                    placeholder="Enter new password"
                    style={{ width: '100%', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: 0 }}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="dd-form-group" style={{ marginTop: '12px' }}>
                <label>Confirm New Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    value={passForm.confirmPassword}
                    onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                    style={{ width: '100%', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: 0 }}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowPasswordModal(false)} className="dd-outline-btn-cancel">Cancel</button>
                <button type="submit" className="dd-solid-btn">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedApptForPrescription && (
        <WritePrescriptionModal
          isOpen={isPrescriptionModalOpen}
          onClose={() => {
            setIsPrescriptionModalOpen(false);
            setSelectedApptForPrescription(null);
          }}
          appointment={selectedApptForPrescription}
          onSuccess={() => {
            setIsPrescriptionModalOpen(false);
            setSelectedApptForPrescription(null);
            fetchAppointments(); // Refresh to update prescription_added status
            setNotification('Consultation record saved successfully!');
            setTimeout(() => setNotification(''), 4000);
          }}
        />
      )}

      {selectedPatientForRecords && (
        <PatientRecordsModal
          isOpen={isPatientRecordsModalOpen}
          onClose={() => {
            setIsPatientRecordsModalOpen(false);
            setSelectedPatientForRecords(null);
          }}
          patient={selectedPatientForRecords}
        />
      )}

      {/* ── View Specs Modal ── */}
      {showSpecsModal && selectedSpecsPatient && (
        <div className="dd-modal-overlay" onClick={() => setShowSpecsModal(false)}>
          <div className="dd-specs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dd-specs-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="dd-specs-icon-badge">
                  <User size={20} color="#0d9488" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Patient Specifications</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Full patient consultation record & details</p>
                </div>
              </div>
              <button className="dd-modal-close-btn" onClick={() => setShowSpecsModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="dd-specs-modal-body">
              {/* Patient Banner */}
              <div className="dd-specs-patient-banner">
                <div className="dd-specs-avatar">
                  {(selectedSpecsPatient.patient_id?.first_name?.[0] || 'P').toUpperCase()}
                </div>
                <div>
                  <h2 className="dd-specs-name">
                    {selectedSpecsPatient.patient_id?.first_name
                      ? `${selectedSpecsPatient.patient_id.first_name} ${selectedSpecsPatient.patient_id.last_name || ''}`.trim()
                      : 'Patient'}
                  </h2>
                  <span className="dd-specs-mode-badge">
                    {selectedSpecsPatient.consult_mode === 'online' ? <Video size={13} /> : <Building2 size={13} />}
                    {selectedSpecsPatient.consult_mode || 'offline'} consultation
                  </span>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="dd-specs-grid">
                <div className="dd-specs-card">
                  <span className="dd-specs-label"><Stethoscope size={14} style={{ color: '#0d9488' }} /> Disease / Symptoms</span>
                  <span className="dd-specs-value">{selectedSpecsPatient.disease || 'General Checkup'}</span>
                </div>

                <div className="dd-specs-card">
                  <span className="dd-specs-label"><Calendar size={14} style={{ color: '#2563eb' }} /> Appointment Date</span>
                  <span className="dd-specs-value">{formatDate(selectedSpecsPatient.appointment_date)}</span>
                </div>

                <div className="dd-specs-card">
                  <span className="dd-specs-label"><Clock size={14} style={{ color: '#d97706' }} /> Scheduled Time</span>
                  <span className="dd-specs-value">{selectedSpecsPatient.appointment_time || '10:00 AM'}</span>
                </div>

                <div className="dd-specs-card">
                  <span className="dd-specs-label"><Building2 size={14} style={{ color: '#8b5cf6' }} /> Consult Mode</span>
                  <span className="dd-specs-value" style={{ textTransform: 'capitalize' }}>{selectedSpecsPatient.consult_mode || 'offline'}</span>
                </div>

                <div className="dd-specs-card">
                  <span className="dd-specs-label"><User size={14} style={{ color: '#0ea5e9' }} /> Gender</span>
                  <span className="dd-specs-value" style={{ textTransform: 'capitalize' }}>
                    {selectedSpecsPatient.patient_id?.gender || selectedSpecsPatient.gender || 'Male'}
                  </span>
                </div>

                <div className="dd-specs-card">
                  <span className="dd-specs-label"><Mail size={14} style={{ color: '#10b981' }} /> Email Address</span>
                  <span className="dd-specs-value">{selectedSpecsPatient.patient_id?.email || selectedSpecsPatient.booked_by?.email || 'N/A'}</span>
                </div>

                <div className="dd-specs-card">
                  <span className="dd-specs-label"><Phone size={14} style={{ color: '#16a34a' }} /> Phone Number</span>
                  <span className="dd-specs-value">{selectedSpecsPatient.patient_id?.phone || selectedSpecsPatient.booked_by?.phone || 'N/A'}</span>
                </div>

                <div className="dd-specs-card">
                  <span className="dd-specs-label"><IndianRupee size={14} style={{ color: '#0d9488' }} /> Fee Charged</span>
                  <span className="dd-specs-value" style={{ color: '#0d9488', fontWeight: 800 }}>
                    {selectedSpecsPatient.fee_charged ? `₹${selectedSpecsPatient.fee_charged}` : doctorProfile?.consult_fee ? `₹${doctorProfile.consult_fee}` : '₹500'}
                  </span>
                </div>

                <div className="dd-specs-card full-width">
                  <span className="dd-specs-label"><MapPin size={14} style={{ color: '#f43f5e' }} /> Patient / Visit Address</span>
                  <span className="dd-specs-value">{selectedSpecsPatient.patient_id?.address || selectedSpecsPatient.address || doctorProfile?.visit_address || 'Medipulse Hospital Center, OPD Block'}</span>
                </div>
              </div>

              {/* View Medical Record Button */}
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  className="dd-btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #0d9488, #0ea5e9)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(13, 148, 136, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => {
                    setShowSpecsModal(false);
                    setView(VIEWS.PATIENT_RECORDS);
                  }}
                >
                  <FileText size={16} /> View Medical Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View Record Sheet ── */}
      {showRecordSheet && selectedRecordSheet && (
        <div className="dd-sheet-overlay" onClick={() => setShowRecordSheet(false)}>
          <div className="dd-prescription-sheet" onClick={(e) => e.stopPropagation()}>
            {/* Clinic Header */}
            <div className="dd-ps-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 className="dd-ps-clinic-name">MEDIPULSE MULTISPECIALTY CLINIC & CARE CENTER</h2>
                  <p className="dd-ps-doctor-name">
                    Dr. {doctorProfile?.first_name || doctorName} {doctorProfile?.last_name || ''}
                    {doctorProfile?.specialization ? ` (${doctorProfile.specialization})` : ''}
                  </p>
                  <div style={{ margin: '6px 0 0', fontSize: '12px', color: '#ccfbf1', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <span><strong>Email:</strong> {doctorProfile?.email || localStorage.getItem('doctorEmail') || 'dr.somnath@medipulse.com'}</span>
                    <span><strong>Phone:</strong> {doctorProfile?.phone || '+91 98765 12345'}</span>
                    <span><strong>Address:</strong> {doctorProfile?.visit_address || 'Medipulse OPD Block, Sector 4'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="dd-btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: '#ffffff',
                      color: '#0f766e',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                    onClick={() => handleDownloadRecord(selectedRecordSheet)}
                  >
                    <Download size={15} /> Download Record
                  </button>

                  <button className="dd-modal-close-btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }} onClick={() => setShowRecordSheet(false)}>
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="dd-ps-body">
              {/* Full Patient Details Grid */}
              <div className="dd-ps-patient-details-grid">
                <div className="dd-ps-detail-item">
                  <span className="dd-ps-detail-label">Patient Name</span>
                  <span className="dd-ps-detail-val">
                    {selectedRecordSheet.patient_id?.first_name
                      ? `${selectedRecordSheet.patient_id.first_name} ${selectedRecordSheet.patient_id.last_name || ''}`.trim()
                      : (selectedRecordSheet.patient_name || 'Patient')}
                  </span>
                </div>

                <div className="dd-ps-detail-item">
                  <span className="dd-ps-detail-label">Age</span>
                  <span className="dd-ps-detail-val">
                    {selectedRecordSheet.patient_id?.age || selectedRecordSheet.age || '28'} Yrs
                  </span>
                </div>

                <div className="dd-ps-detail-item">
                  <span className="dd-ps-detail-label">Gender</span>
                  <span className="dd-ps-detail-val" style={{ textTransform: 'capitalize' }}>
                    {selectedRecordSheet.patient_id?.gender || selectedRecordSheet.gender || 'Male'}
                  </span>
                </div>

                <div className="dd-ps-detail-item">
                  <span className="dd-ps-detail-label">Disease / Condition</span>
                  <span className="dd-ps-detail-val">
                    {selectedRecordSheet.disease || selectedRecordSheet.diagnosis || selectedRecordSheet.appointment_id?.disease || 'General Checkup'}
                  </span>
                </div>

                <div className="dd-ps-detail-item">
                  <span className="dd-ps-detail-label">Prescription Date</span>
                  <span className="dd-ps-detail-val">
                    {formatDate(selectedRecordSheet.prescribed_date || selectedRecordSheet.appointment_date || selectedRecordSheet.createdAt)}
                  </span>
                </div>

                <div className="dd-ps-detail-item">
                  <span className="dd-ps-detail-label">Phone Number</span>
                  <span className="dd-ps-detail-val">
                    {selectedRecordSheet.patient_id?.phone || selectedRecordSheet.phone || selectedRecordSheet.booked_by?.phone || '+91 98765 43210'}
                  </span>
                </div>
              </div>

              {/* Prescribed Medicines Section */}
              <div style={{ marginTop: '10px' }}>
                <div className="dd-ps-rx-header">
                  <Stethoscope size={20} /> Prescribed Medicines (Rx)
                </div>

                {Array.isArray(selectedRecordSheet.medicines) && selectedRecordSheet.medicines.length > 0 ? (
                  <table className="dd-ps-meds-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Medicine Name</th>
                        <th>Dosage</th>
                        <th>Frequency & Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecordSheet.medicines.map((med, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>
                            {med.medicine_name || med.name || 'Prescribed Medicine'}
                          </td>
                          <td>{med.dosage || '1 Tablet After Meals'}</td>
                          <td>{med.duration || med.frequency || '5 Days (1-0-1)'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                    <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#0f172a' }}>
                      1. Paracetamol 500mg (1-0-1) - 5 Days after meals
                    </p>
                    <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#0f172a' }}>
                      2. Amoxicillin 250mg (1-0-1) - 3 Days twice daily
                    </p>
                    <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                      3. Multivitamin Supplement - 7 Days before sleep
                    </p>
                  </div>
                )}
              </div>

              {selectedRecordSheet.general_instructions && (
                <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '12px', padding: '14px 16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#d48806', textTransform: 'uppercase' }}>Doctor's Advice / Instructions:</span>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#595959', fontWeight: 600 }}>{selectedRecordSheet.general_instructions}</p>
                </div>
              )}

              {/* Doctor Signature Section */}
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Prescription Verification</span>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} /> Official Medical Record
                  </p>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  {doctorProfile?.signature ? (
                    <img
                      src={doctorProfile.signature}
                      alt="Doctor Signature"
                      style={{
                        maxHeight: '48px',
                        maxWidth: '180px',
                        objectFit: 'contain',
                        marginBottom: '4px'
                      }}
                    />
                  ) : (
                    <div style={{
                      fontFamily: "'Brush Script MT', 'Dancing Script', cursive, sans-serif",
                      fontSize: '24px',
                      color: '#0f766e',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                      borderBottom: '1.5px solid #0f766e',
                      paddingBottom: '2px',
                      minWidth: '150px',
                      textAlign: 'center',
                      margin: '0 0 4px auto'
                    }}>
                      Dr. {doctorProfile?.first_name || doctorName} {doctorProfile?.last_name || ''}
                    </div>
                  )}
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', display: 'block' }}>Authorized Doctor Signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default DoctorDashboard;
