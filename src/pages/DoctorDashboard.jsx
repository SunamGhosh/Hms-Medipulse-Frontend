import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, CalendarCheck, User, LogOut, ArrowRight, Clock, ShieldCheck, ArrowUpRight, CheckCircle2,
  AlertCircle, XCircle, Loader2, Users, Stethoscope, Check, Bell, Video, Edit2, Edit3, Lock, Save, X,
  ChevronLeft, ChevronRight, Camera, Calendar, Plus, Eye, EyeOff, Building2, Award, Phone, FileCheck, MapPin,
  Search, Filter, CalendarDays, RotateCcw, RefreshCw, Mail, IndianRupee, FileText, Download, CreditCard, Pill, Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import './DoctorDashboard.css';
import './AppointmentsList.css';
import WritePrescriptionModal from '../components/WritePrescriptionModal';
import PatientRecordsModal from '../components/PatientRecordsModal';

const API = import.meta.env.VITE_URL;
const getToken = () => sessionStorage.getItem('doctorToken') || localStorage.getItem('doctorToken');

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
  expired:   { color: 'gray',   label: 'Expired',   dot: '#94a3b8' },
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

  // Cancellation / Rejection modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelModalAppt, setCancelModalAppt] = useState(null);       // appointment being acted on
  const [cancelModalType, setCancelModalType] = useState('cancel');   // 'cancel' | 'rejected'
  const [cancelReason, setCancelReason] = useState('');
  const [cancelRemarks, setCancelRemarks] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  
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
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [medRecLoading, setMedRecLoading] = useState(false);
  const [recordSearchQuery, setRecordSearchQuery] = useState('');
  const [selectedRecordSheet, setSelectedRecordSheet] = useState(null);
  const [showRecordSheet, setShowRecordSheet] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);

  // Real-time clock for appointment meeting time validation
  const [nowTime, setNowTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  // Parse appointment scheduled Date object from appointment_date and appointment_time
  const getScheduledDateTime = useCallback((appt) => {
    if (!appt?.appointment_date || !appt?.appointment_time) return null;
    const d = new Date(appt.appointment_date);
    const timeStr = String(appt.appointment_time).trim();
    let hours = 0;
    let minutes = 0;
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
      const isPm = timeStr.toLowerCase().includes('pm');
      const cleanTime = timeStr.replace(/(am|pm)/gi, '').trim();
      const parts = cleanTime.split(':').map(Number);
      hours = parts[0] || 0;
      minutes = parts[1] || 0;
      if (isPm && hours < 12) hours += 12;
      if (!isPm && hours === 12) hours = 0;
    } else {
      const parts = timeStr.split(':').map(Number);
      hours = parts[0] || 0;
      minutes = parts[1] || 0;
    }
    d.setHours(hours, minutes, 0, 0);
    return d;
  }, []);

  // Check if current time is before scheduled appointment time
  const isBeforeScheduledTime = useCallback((appt) => {
    const scheduled = getScheduledDateTime(appt);
    if (!scheduled) return false;
    return nowTime < scheduled;
  }, [getScheduledDateTime, nowTime]);

  // Check if start meet button is enabled: enabled at scheduled time and up to 30 mins after scheduled time
  const isStartMeetEnabled = useCallback((appt) => {
    const scheduled = getScheduledDateTime(appt);
    if (!scheduled) return true;
    const windowEnd = new Date(scheduled.getTime() + 30 * 60 * 1000);
    return nowTime >= scheduled && nowTime <= windowEnd;
  }, [getScheduledDateTime, nowTime]);

  // Tooltip/title for Start Meet button
  const getStartMeetTooltip = useCallback((appt) => {
    const scheduled = getScheduledDateTime(appt);
    if (!scheduled) return "Start the consultation meeting";
    const windowEnd = new Date(scheduled.getTime() + 30 * 60 * 1000);
    if (nowTime < scheduled) {
      return `Meeting can only be started at scheduled time (${appt.appointment_time || ''})`;
    }
    if (nowTime > windowEnd) {
      return "Meeting start window (30 mins from scheduled time) has expired";
    }
    return "Start the consultation meeting";
  }, [getScheduledDateTime, nowTime]);

  // Dynamic effective status (if pending/confirmed past scheduled time or meeting limit without action, status is expired)
  const getEffectiveStatus = useCallback((appt) => {
    const st = (appt?.status || 'pending').toLowerCase().trim();
    if (['completed', 'cancelled', 'rejected', 'expired'].includes(st)) return st;

    const scheduled = getScheduledDateTime(appt);
    if (scheduled) {
      if (st === 'pending' && nowTime > scheduled) {
        return 'expired';
      }
      if (st === 'confirmed' && !appt.meet_time_start) {
        const expireTime = new Date(scheduled.getTime() + 30 * 60 * 1000);
        if (nowTime > expireTime) return 'expired';
      }
    }
    return st;
  }, [getScheduledDateTime, nowTime]);

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
    const stored = (sessionStorage.getItem('doctorName') || localStorage.getItem('doctorName') || 'Doctor').replace(/^(dr\.\s*|dr\s+)/i, '');
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
        const newPendingCount = appts.filter(a => getEffectiveStatus(a) === 'pending').length;
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
      if (res.ok && data.doctor) {
        setDoctorProfile(data.doctor);
        const rawName = `${data.doctor.first_name || ''} ${data.doctor.last_name || ''}`.trim();
        const cleanName = rawName.replace(/^(dr\.\s*|dr\s+)/i, '');
        if (cleanName) {
          setDoctorName(cleanName);
          sessionStorage.setItem('doctorName', cleanName);
          localStorage.setItem('doctorName', cleanName);
        }
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

  const fetchDoctorMedicalRecords = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setMedRecLoading(true);
    try {
      const res = await fetch(`${API}/med-rec/my-records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMedicalRecords(data.data || []);
      }
    } catch { /* silent */ }
    finally { setMedRecLoading(false); }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchProfile();
    fetchPatients();
    fetchDoctorPrescriptions();
    fetchDoctorMedicalRecords();
    const intervalId = setInterval(() => fetchAppointments(true), 15000);
    return () => clearInterval(intervalId);
  }, [fetchAppointments, fetchProfile, fetchPatients, fetchDoctorPrescriptions, fetchDoctorMedicalRecords]);

  const handleLogout = () => {
    sessionStorage.removeItem('doctorToken');
    sessionStorage.removeItem('doctorEmail');
    sessionStorage.removeItem('doctorName');
    localStorage.removeItem('doctorToken');
    localStorage.removeItem('doctorEmail');
    localStorage.removeItem('doctorName');
    toast.success('Logged out successfully');
    navigate('/doctor/login');
  };

  const handleStatusUpdate = async (id, status, cancelReasonText = '') => {
    const token = getToken();
    try {
      const endpoint = status === 'confirmed' ? 'confirmed' : status === 'completed' ? 'complete' : status === 'rejected' ? 'reject' : 'cancel';
      const method = 'PUT';
      const res = await fetch(`${API}/appointment/doctor/${id}/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cancel_reason: cancelReasonText || 'Updated by doctor' })
      });
      if (res.ok) fetchAppointments();
    } catch { /* silent */ }
  };

  // Start meeting — stamps meet_time_start on the appointment
  const handleStartMeeting = async (appt) => {
    const apptId = typeof appt === 'object' ? appt._id : appt;
    const mode = typeof appt === 'object' ? appt.consult_mode : 'offline';
    const token = getToken();
    try {
      const res = await fetch(`${API}/appointment/doctor/${apptId}/start-meeting`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Meeting started! Time tracking initiated.');
        fetchAppointments();
        if (mode === 'online') {
          handleJoinVideoCall(apptId);
        }
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to start meeting');
      }
    } catch { toast.error('Network error starting meeting'); }
  };

  // Open the cancellation / rejection modal
  const handleOpenCancelModal = (appt, type) => {
    setCancelModalAppt(appt);
    setCancelModalType(type);  // 'cancel' | 'rejected'
    setCancelReason('');
    setCancelRemarks('');
    setShowCancelModal(true);
  };

  // Submit the cancellation / rejection with the form data
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason) { toast.error('Please select a reason.'); return; }
    setCancelSubmitting(true);
    const fullReason = cancelRemarks ? `${cancelReason} — ${cancelRemarks}` : cancelReason;
    await handleStatusUpdate(cancelModalAppt._id, cancelModalType, fullReason);
    setCancelSubmitting(false);
    setShowCancelModal(false);
    setCancelModalAppt(null);
    toast.success(
      cancelModalType === 'rejected'
        ? 'Appointment rejected successfully.'
        : 'Appointment cancelled successfully.'
    );
  };

  const handleJoinVideoCall = (apptId) => {
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



  const pendingAppts = appointments.filter(a => getEffectiveStatus(a) === 'pending').length;
  const todaysAppts = appointments.filter(a => new Date(a.appointment_date).toDateString() === new Date().toDateString()).length;
  const completedAppointments = appointments.filter(a => (a.status || '').toLowerCase() === 'completed');
  const totalCompleted = completedAppointments.length;
  
  const stats = [
    { icon: <CalendarCheck size={22} />, label: 'Today\'s Visits', value: apptLoading ? '…' : todaysAppts, trend: 'Patients', color: 'teal' },
    { icon: <Users size={22} />,         label: 'Total Patients',  value: apptLoading ? '…' : completedAppointments.length, trend: 'All time',    color: 'blue' },
    { icon: <CheckCircle2 size={22} />,  label: 'Completed',       value: apptLoading ? '…' : totalCompleted, trend: 'Consultations', color: 'purple' },
    { icon: <AlertCircle size={22} />,   label: 'Pending',         value: apptLoading ? '…' : pendingAppts, trend: 'Require action',         color: 'rose' },
  ];

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const getStatusCount = (key) => {
    if (key === 'all') return appointments.length;
    return appointments.filter(a => getEffectiveStatus(a) === key).length;
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
      const apptStatus = getEffectiveStatus(appt);
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

  const handleViewDoctorRecordSheet = async (target) => {
    try {
      const token = getToken();
      if (!target) return;
      
      const apptId = typeof target.appointment_id === 'object' 
        ? target.appointment_id?._id 
        : (target.appointment_id || (target._id && String(target._id).startsWith('APPOINTMENT') ? target._id : null));
      
      let fetchedPrescription = null;

      // 1. Try fetching by appointment ID
      if (apptId) {
        const res = await fetch(`${API}/prescription/appointment/${apptId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.prescription) fetchedPrescription = data.prescription;
        }
      }

      // 2. If target is a prescription/record object (and not an appointment ID string), try fetching by ID
      if (!fetchedPrescription && target._id && !String(target._id).startsWith('APPOINTMENT')) {
        const resDirect = await fetch(`${API}/prescription/${target._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resDirect.ok) {
          const dataDirect = await resDirect.json();
          if (dataDirect.prescription) fetchedPrescription = dataDirect.prescription;
        }
      }

      // 3. Fallback to local prescriptions array or medicalRecords array
      if (!fetchedPrescription) {
        const foundPresc = prescriptions.find(p => 
          (p.appointment_id?._id || p.appointment_id) === (apptId || target._id) || p._id === target._id
        );
        if (foundPresc) {
          fetchedPrescription = foundPresc;
        } else {
          const foundRec = medicalRecords.find(r => 
            (r.appointment_id?._id || r.appointment_id) === (apptId || target._id) || r._id === target._id
          );
          if (foundRec) {
            fetchedPrescription = {
              _id: foundRec._id,
              appointment_id: foundRec.appointment_id,
              patient_id: foundRec.patient_id,
              doctor_id: foundRec.doctor_id,
              medicines: (foundRec.medicines_prescribed || []).map(m => ({
                medicine_name: m.medicine_id?.medicine_name || m.medicine_name || 'Prescribed Item',
                dosage: m.dosage || '',
                frequency: m.frequency || '',
                duration: m.duration || '',
                quantity: m.quantity || 1,
                instructions: m.instructions || ''
              })),
              general_instructions: foundRec.doctor_notes || foundRec.prescription || '',
              follow_up_date: foundRec.follow_up_date,
              prescribed_date: foundRec.visit_date || foundRec.createdAt,
              diagnosis: foundRec.diagnosis,
              symptoms: foundRec.symptoms
            };
          }
        }
      }

      if (fetchedPrescription) {
        setSelectedRecordSheet(fetchedPrescription);
        setShowRecordSheet(true);
      } else {
        toast.info('No consultation record or prescription has been created for this appointment yet.');
      }
    } catch (err) {
      toast.error('Failed to load prescription record.');
    }
  };

  const filteredPatientRecords = completedAppointments.filter((rec) => {
    if (!recordSearchQuery.trim()) return true;
    const q = recordSearchQuery.toLowerCase().trim();
    const pName = (rec.patient_id?.first_name
      ? `${rec.patient_id.first_name} ${rec.patient_id.last_name || ''}`
      : `${rec.patient_name || ''}`).toLowerCase();
    const disease = (rec.disease || rec.diagnosis || rec.appointment_id?.disease || '').toLowerCase();
    const prescId = (rec.prescription_id || rec._id || '').toLowerCase();
    const date = (rec.prescribed_date || rec.visit_date || rec.appointment_date || '').toLowerCase();

    return pName.includes(q) || disease.includes(q) || prescId.includes(q) || date.includes(q);
  });

  const handleDownloadRecord = (rec) => {
    if (!rec) return;
    const pName = rec.patient_id?.first_name
      ? `${rec.patient_id.first_name} ${rec.patient_id.last_name || ''}`.trim()
      : (rec.patient_name || 'Patient');
    const docName = rec.doctor_id?.first_name 
      ? `Dr. ${rec.doctor_id.first_name} ${rec.doctor_id.last_name || ''}`
      : `Dr. ${doctorProfile?.first_name || doctorName} ${doctorProfile?.last_name || ''}`;
    const docSpec = rec.doctor_id?.specialization || doctorProfile?.specialization || 'Specialist Doctor';
    const docEmail = rec.doctor_id?.email || doctorProfile?.email || localStorage.getItem('doctorEmail') || '';
    const docPhone = rec.doctor_id?.phone || doctorProfile?.phone || '+91 98765 12345';
    const docAddress = rec.doctor_id?.visit_address || doctorProfile?.visit_address || 'Medipulse OPD Block, Sector 4';
    const recDate = formatDate(rec.prescribed_date || rec.appointment_date || rec.createdAt);
    const disease = rec.disease || rec.diagnosis || rec.appointment_id?.disease || 'General Consultation';
    const age = rec.patient_id?.age || rec.age || '28';
    const gender = rec.patient_id?.gender || rec.gender || 'Male';
    const phone = rec.patient_id?.phone || rec.phone || rec.booked_by?.phone || '+91 98765 43210';
    const followUpDateStr = rec.follow_up_date ? formatDate(rec.follow_up_date) : null;
    const docSig = rec.doctor_id?.signature || doctorProfile?.signature;

    let medsText = '';
    if (Array.isArray(rec.medicines) && rec.medicines.length > 0) {
      medsText = rec.medicines.map((m, i) => 
        `${i + 1}. ${m.medicine_name || m.name} | Dosage: ${m.dosage || '1 Tablet'} | Freq: ${m.frequency || 'Once a day'} | Duration: ${m.duration || '5 Days'} | Qty: ${m.quantity || 1} | Inst: ${m.instructions || 'After food'}`
      ).join('\n');
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
Age / Gender : ${age} Yrs / ${gender}
Date         : ${recDate}
Phone        : ${phone}
Disease      : ${disease}
${followUpDateStr ? `Follow-up Date: ${followUpDateStr}\n` : ''}
PRESCRIBED MEDICINES:
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
      const medsHtml = (Array.isArray(rec.medicines) && rec.medicines.length > 0)
        ? rec.medicines.map((m, i) => `
            <tr>
              <td style="text-align: center; color: #475569; font-weight: 600;">${i + 1}</td>
              <td style="font-weight: 700; color: #0f172a;">${m.medicine_name || m.name}${m.strength ? ` (${m.strength})` : ''}</td>
              <td style="color: #334155;">${m.dosage || '1 Tablet'}</td>
              <td style="color: #334155;">${m.frequency || 'Once a day'}</td>
              <td style="color: #334155;">${m.duration || '5 Days'}</td>
              <td style="text-align: center; font-weight: 700; color: #0f172a;">${m.quantity || 1}</td>
              <td style="color: #475569;">${m.instructions || 'After food'}</td>
            </tr>
          `).join('')
        : `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 16px;">No prescribed medicines attached.</td></tr>`;

      const followUpHtml = followUpDateStr ? `
        <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; padding: 10px 14px; border-radius: 8px;">
          <label style="font-size: 11px; font-weight: 800; color: #1e40af; text-transform: uppercase; display: block; margin-bottom: 2px;">Follow-up Date</label>
          <strong style="font-size: 14px; color: #1d4ed8;">${followUpDateStr}</strong>
        </div>
      ` : '';

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
            .sig-font { font-family: cursive; font-size: 24px; color: #0f766e; font-weight: bold; border-bottom: 1.5px solid #0f766e; }
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
            </div>
          </div>

          <div class="patient-grid">
            <div><label>Patient Name</label><strong>${pName}</strong></div>
            <div><label>Age / Gender</label><strong>${age} Yrs / ${gender}</strong></div>
            <div><label>Disease / Condition</label><strong>${disease}</strong></div>
            <div><label>Prescription Date</label><strong>${recDate}</strong></div>
            <div><label>Phone Number</label><strong>${phone}</strong></div>
            ${followUpHtml}
          </div>

          <div class="section-title">Prescribed Medicines</div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 50px;">Sl. No.</th>
                <th>Medicine Name</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th style="text-align: center; width: 65px;">Quantity</th>
                <th>Instruction</th>
              </tr>
            </thead>
            <tbody>
              ${medsHtml}
            </tbody>
          </table>

          ${rec.general_instructions ? `
            <div class="instructions-box">
              <strong style="color: #d48806; font-size: 11px; text-transform: uppercase; display: block; margin-bottom: 4px;">Doctor's Advice / Instructions:</strong>
              ${rec.general_instructions}
            </div>
          ` : ''}

          <div class="signature-section">
            <div>
              <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Official Verification</span>
              <p style="margin: 2px 0 0; font-size: 12px; color: #10b981; font-weight: 700;">✓ Digitally Verified Medical Record</p>
            </div>
            <div style="text-align: right;">
              ${docSig ? `
                <img src="${docSig}" alt="Doctor Official Signature" style="max-height: 48px; max-width: 180px; object-fit: contain; margin-bottom: 4px;" />
              ` : `
                <div class="sig-font">${docName}</div>
              `}
              <p style="margin: 4px 0 0; font-weight: 800; font-size: 13px; color: #0f172a;">Authorized Doctor Signature</p>
            </div>
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
                ) : appointments.filter(a => getEffectiveStatus(a) === 'pending').length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    <CheckCircle2 size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                    <p>No pending appointments to confirm.</p>
                  </div>
                ) : (
                  <ul className="dd-activity-list">
                    {appointments.filter(a => getEffectiveStatus(a) === 'pending').slice(0, 4).map((appt, i) => {
                      const cfg = STATUS_CONFIG[getEffectiveStatus(appt)];
                      return (
                        <li key={i} className="dd-activity-item">
                          <div className="dd-activity-dot" style={{ background: cfg.dot, boxShadow: `0 0 0 3px ${cfg.dot}33` }} />
                          <div className="dd-activity-content">
                            <p className="dd-activity-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span>Patient: {appt.patient_id?.first_name} {appt.patient_id?.last_name}</span>
                              {appt.booker_role === 'pharmacist' ? (
                                <span style={{ background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0d9488', borderRadius: '12px', padding: '1px 8px', fontSize: '10px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <Pill size={10} /> Pharmacist (10% Off)
                                </span>
                              ) : (
                                <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', borderRadius: '12px', padding: '1px 8px', fontSize: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <User size={10} /> Patient
                                </span>
                              )}
                            </p>
                            <div className="dd-activity-meta">
                              <Clock size={11} />
                              <span>{formatDate(appt.appointment_date)} at {appt.appointment_time}</span>
                              <span className={`dd-activity-badge dd-badge-${cfg.color}`}>{cfg.label}</span>
                              <button onClick={() => handleStatusUpdate(appt._id, 'confirmed')} style={{marginLeft: 'auto', background: '#0d9488', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600}}>Confirm</button>
                              <button onClick={() => handleOpenCancelModal(appt, 'rejected')} style={{background: '#fecaca', color: '#dc2626', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600}}>Reject</button>
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
                    const statusKey = getEffectiveStatus(appt);
                    const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
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

                    const isPharmacistBooked = appt.booker_role === 'pharmacist';

                    return (
                      <div key={appt._id} className={`dd-appt-card status-${statusKey}`}>
                        {/* Left Status Accent Bar */}
                        <div className="dd-ac-status-bar" style={{ background: isPharmacistBooked ? '#0d9488' : cfg.dot }} />

                        {/* Patient Avatar & Main Info */}
                        <div className="dd-ac-patient-info">
                          <div className="dd-ac-avatar" style={{
                            background: isPharmacistBooked
                              ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)'
                              : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: '#ffffff',
                            border: isPharmacistBooked ? '2px solid #99f6e4' : '2px solid #bfdbfe',
                            boxShadow: isPharmacistBooked ? '0 4px 12px rgba(13, 148, 136, 0.35)' : '0 4px 12px rgba(59, 130, 246, 0.25)'
                          }}>
                            {initials}
                          </div>
                          <div className="dd-ac-details">
                            <div className="dd-ac-name-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <h4 className="dd-ac-patient-name" style={{ margin: 0 }}>{patientName}</h4>
                              
                              {/* Booker Role Badge */}
                              {isPharmacistBooked ? (
                                <span style={{
                                  background: '#f0fdfa', border: '1.5px solid #99f6e4', color: '#0d9488',
                                  borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: 800,
                                  display: 'inline-flex', alignItems: 'center', gap: '4px'
                                }} title="Booked by logged-in Pharmacist with 10% Privilege Offer">
                                  <Pill size={12} /> Pharmacist (10% Off Offer)
                                </span>
                              ) : (
                                <span style={{
                                  background: '#eff6ff', border: '1.5px solid #bfdbfe', color: '#2563eb',
                                  borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: 700,
                                  display: 'inline-flex', alignItems: 'center', gap: '4px'
                                }}>
                                  <User size={12} /> Direct Patient
                                </span>
                              )}

                              <span className={`dd-ac-status-pill dd-badge-${cfg.color}`} style={{ marginLeft: 'auto' }}>
                                <span className="dd-ac-status-dot" style={{ background: cfg.dot }} />
                                {cfg.label}
                              </span>
                            </div>
                            
                            <div className="dd-ac-meta-grid">
                              {/* Booker Role Details */}
                              <div className="dd-ac-meta-item">
                                {isPharmacistBooked ? (
                                  <Pill size={14} className="dd-ac-meta-icon text-teal" />
                                ) : (
                                  <User size={14} className="dd-ac-meta-icon text-blue" />
                                )}
                                <span className="dd-ac-meta-text">
                                  Booker: <strong style={{ color: isPharmacistBooked ? '#0d9488' : '#2563eb' }}>
                                    {isPharmacistBooked ? 'Pharmacist (10% Privilege)' : 'Patient User'}
                                  </strong>
                                </span>
                              </div>

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

                               {/* Payment Status & Fee */}
                               <div className="dd-ac-meta-item">
                                 <CreditCard size={14} className="dd-ac-meta-icon text-green" />
                                 <span className="dd-ac-meta-text">
                                   Fee (₹{appt.consultation_fee}): <strong style={{ color: appt.payment_status === 'paid' ? '#059669' : '#f97316' }}>
                                     {appt.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
                                   </strong>
                                 </span>
                               </div>
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
                           {statusKey === 'pending' && (
                             <>
                               <button
                                 className="dd-btn-action btn-confirm"
                                 onClick={() => handleStatusUpdate(appt._id, 'confirmed')}
                               >
                                 <Check size={14} /> Confirm
                               </button>
                               <button
                                 className="dd-btn-action btn-action btn-reject"
                                 onClick={() => handleOpenCancelModal(appt, 'rejected')}
                               >
                                 <XCircle size={14} /> Reject
                               </button>
                             </>
                           )}

                           {statusKey === 'confirmed' && (
                             <>
                               {appt.consult_mode === 'online' ? (
                                 !appt.meet_time_start ? (
                                   <button
                                     className="dd-btn-action btn-start-meeting"
                                     onClick={() => handleStartMeeting(appt)}
                                     disabled={!isStartMeetEnabled(appt)}
                                     title={getStartMeetTooltip(appt)}
                                   >
                                     <Clock size={14} /> Start Meet
                                   </button>
                                 ) : (
                                   <button
                                     className="dd-btn-action btn-video"
                                     onClick={() => handleJoinVideoCall(appt._id)}
                                   >
                                     <Video size={14} /> Join Video Call
                                   </button>
                                 )
                               ) : (
                                 /* Offline Consultation Mark Completed Button — enabled for 30 mins from scheduled time */
                                 <button
                                   className="dd-btn-action btn-confirm"
                                   onClick={() => handleStatusUpdate(appt._id, 'completed')}
                                   disabled={!isStartMeetEnabled(appt)}
                                   title={
                                     isBeforeScheduledTime(appt)
                                       ? `Mark Completed can only be clicked at scheduled time (${appt.appointment_time || ''})`
                                       : !isStartMeetEnabled(appt)
                                       ? "Mark completed window (30 mins from scheduled time) has expired"
                                       : "Mark offline consultation as completed"
                                   }
                                   style={{
                                     background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                     color: '#ffffff', border: 'none', borderRadius: '8px', padding: '6px 14px',
                                     fontWeight: 700, fontSize: '13px',
                                     cursor: isStartMeetEnabled(appt) ? 'pointer' : 'not-allowed',
                                     opacity: isStartMeetEnabled(appt) ? 1 : 0.65,
                                     display: 'flex', alignItems: 'center', gap: '5px',
                                     boxShadow: isStartMeetEnabled(appt) ? '0 4px 10px rgba(16,185,129,0.35)' : 'none'
                                   }}
                                 >
                                   <CheckCircle2 size={14} /> Mark Completed
                                 </button>
                               )}
                               <button
                                 className="dd-btn-action btn-cancel"
                                 onClick={() => handleOpenCancelModal(appt, 'cancel')}
                               >
                                 <XCircle size={14} /> Cancel Meet
                               </button>
                             </>
                           )}

                          {(appt.status === 'completed' || statusKey === 'completed') && (() => {
                            const isPrescAdded = Boolean(
                              appt.prescription_added ||
                              prescriptions.some(p => (p.appointment_id?._id || p.appointment_id) === appt._id || p._id === appt._id) ||
                              medicalRecords.some(m => (m.appointment_id?._id || m.appointment_id) === appt._id || m._id === appt._id)
                            );

                            return isPrescAdded ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span className="dd-ac-record-done">
                                  <CheckCircle2 size={16} /> Prescription Added
                                </span>
                                <button
                                  className="dd-btn-action btn-prescription"
                                  style={{ background: '#f0fdf4', color: '#0d9488', borderColor: '#bbf7d0', cursor: 'pointer' }}
                                  onClick={() => handleViewDoctorRecordSheet(appt)}
                                >
                                  <FileText size={14} /> View Prescription
                                </button>
                              </div>
                            ) : (
                              <button
                                className="dd-btn-action btn-prescription"
                                onClick={() => {
                                  setSelectedApptForPrescription(appt);
                                  setIsPrescriptionModalOpen(true);
                                }}
                              >
                                <Edit2 size={14} /> Write Prescription
                              </button>
                            );
                          })()}

                          {/* Meeting Time Info — shown on completed appointments */}
                          {appt.status === 'completed' && (appt.meet_time_start || appt.meet_time_end) && (
                            <div className="dd-ac-meeting-info">
                              <Clock size={13} className="dd-ac-meeting-icon" />
                              <span className="dd-ac-meeting-text">
                                {appt.meet_time_start && (
                                  <span>Started: <strong>{new Date(appt.meet_time_start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</strong></span>
                                )}
                                {appt.meet_time_start && appt.meet_time_end && <span className="dd-ac-meeting-sep"> · </span>}
                                {appt.meet_time_end && (
                                  <span>Ended: <strong>{new Date(appt.meet_time_end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</strong></span>
                                )}
                                {appt.meet_time != null && (
                                  <span className="dd-ac-meeting-dur"> · <strong>{appt.meet_time} min</strong></span>
                                )}
                              </span>
                            </div>
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
                {(prescLoading || medRecLoading) ? (
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

                    const apptId = rec._id;
                    const isPrescriptionCreated = Boolean(
                      rec.prescription_added ||
                      prescriptions.some(p => (p.appointment_id?._id || p.appointment_id) === apptId || p._id === apptId) ||
                      medicalRecords.some(m => (m.appointment_id?._id || m.appointment_id) === apptId || m._id === apptId)
                    );

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
                          {isPrescriptionCreated ? (
                            <button
                              className="dd-btn-view-specs"
                              style={{ background: '#f0fdf4', color: '#0d9488', borderColor: '#bbf7d0', cursor: 'pointer' }}
                              onClick={() => handleViewDoctorRecordSheet(rec)}
                            >
                              <FileText size={14} /> View Prescription
                            </button>
                          ) : (
                            <button
                              className="dd-btn-view-specs"
                              disabled={true}
                              style={{ background: '#f1f5f9', color: '#94a3b8', borderColor: '#cbd5e1', cursor: 'not-allowed', opacity: 0.7 }}
                              title="Doctor has not created prescription for this appointment yet"
                            >
                              <FileText size={14} /> View Prescription (Pending)
                            </button>
                          )}
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
            fetchAppointments(); // Refresh appointment state
            fetchDoctorPrescriptions(); // Refresh doctor prescriptions list
            fetchDoctorMedicalRecords(); // Refresh medical records list
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

              {/* ── Meeting Time Details (Dynamic) ── */}
              {(() => {
                const apptDateObj = getScheduledDateTime(selectedSpecsPatient);
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                // Past meet happened: scheduled date is before today, OR status is completed/expired/cancelled/rejected without meet_time_start tracked
                const isPastAppt = Boolean(
                  (apptDateObj && apptDateObj < todayStart) ||
                  (['completed', 'expired', 'cancelled', 'rejected'].includes((selectedSpecsPatient.status || '').toLowerCase()) && !selectedSpecsPatient.meet_time_start)
                );

                const hasMeetStarted = Boolean(selectedSpecsPatient.meet_time_start);
                const hasMeetEnded = Boolean(selectedSpecsPatient.meet_time_end);

                const formatTime = (ts) => {
                  if (!ts) return '—';
                  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                };

                const formatDateSub = (ts) => {
                  if (!ts) return null;
                  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                };

                const startTimeDisplay = isPastAppt ? '—' : (hasMeetStarted ? formatTime(selectedSpecsPatient.meet_time_start) : '—');
                const startTimeSub = isPastAppt ? null : (hasMeetStarted ? formatDateSub(selectedSpecsPatient.meet_time_start) : null);

                const endTimeDisplay = isPastAppt ? '—' : (hasMeetEnded ? formatTime(selectedSpecsPatient.meet_time_end) : '—');
                const endTimeSub = isPastAppt ? null : (hasMeetEnded ? formatDateSub(selectedSpecsPatient.meet_time_end) : null);

                let totalTimeDisplay = '—';
                let isLiveProgress = false;

                if (!isPastAppt) {
                  if (selectedSpecsPatient.meet_time != null) {
                    totalTimeDisplay = `${selectedSpecsPatient.meet_time} min`;
                  } else if (hasMeetStarted && hasMeetEnded) {
                    const durationMins = Math.max(1, Math.round((new Date(selectedSpecsPatient.meet_time_end) - new Date(selectedSpecsPatient.meet_time_start)) / 60000));
                    totalTimeDisplay = `${durationMins} min`;
                  } else if (hasMeetStarted && !hasMeetEnded) {
                    const liveMins = Math.max(1, Math.round((nowTime - new Date(selectedSpecsPatient.meet_time_start)) / 60000));
                    totalTimeDisplay = `${liveMins} min`;
                    isLiveProgress = true;
                  }
                }

                return (
                  <div style={{
                    marginTop: '16px',
                    background: 'linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%)',
                    border: '1.5px solid #99f6e4',
                    borderRadius: '14px',
                    padding: '16px 20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #0d9488, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Clock size={15} color="#fff" />
                        </div>
                        <div>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', display: 'block' }}>Meeting Time Details</span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Start time, end time & total consultation duration</span>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '12px',
                        background: selectedSpecsPatient.consult_mode === 'online' ? '#eff6ff' : '#f5f3ff',
                        color: selectedSpecsPatient.consult_mode === 'online' ? '#2563eb' : '#7c3aed',
                        border: `1px solid ${selectedSpecsPatient.consult_mode === 'online' ? '#bfdbfe' : '#ddd6fe'}`
                      }}>
                        {selectedSpecsPatient.consult_mode === 'online' ? 'Online Video Meet' : 'Offline / In-Person Meet'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {/* Meet Start Time */}
                      <div style={{ background: '#fff', borderRadius: '10px', padding: '12px 14px', border: '1px solid #ccfbf1', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: (!isPastAppt && hasMeetStarted) ? '#10b981' : '#cbd5e1', display: 'inline-block' }} />
                          Meet Start Time
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: (!isPastAppt && hasMeetStarted) ? '#0f172a' : '#94a3b8' }}>
                          {startTimeDisplay}
                        </div>
                        {startTimeSub && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: 3 }}>
                            {startTimeSub}
                          </div>
                        )}
                      </div>

                      {/* Meet End Time */}
                      <div style={{ background: '#fff', borderRadius: '10px', padding: '12px 14px', border: '1px solid #fecaca', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '2px', background: (!isPastAppt && hasMeetEnded) ? '#ef4444' : '#cbd5e1', display: 'inline-block' }} />
                          Meet End Time
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: (!isPastAppt && hasMeetEnded) ? '#0f172a' : '#94a3b8' }}>
                          {endTimeDisplay}
                        </div>
                        {endTimeSub && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: 3 }}>
                            {endTimeSub}
                          </div>
                        )}
                      </div>

                      {/* Overall / Total Meet Time */}
                      <div style={{ background: 'linear-gradient(135deg, #0d9488, #0ea5e9)', borderRadius: '10px', padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                          Total Meet Time
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
                          {totalTimeDisplay}
                        </div>
                        {isLiveProgress && (
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)', marginTop: 3, fontWeight: 700 }}>● Live In Progress</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* View Medical Record Button */}
              {(() => {
                const targetApptId = selectedSpecsPatient?._id || selectedSpecsPatient?.appointment_id?._id || selectedSpecsPatient?.appointment_id;
                const matchingAppt = appointments.find(a => a._id === targetApptId);
                const isPrescAddedFlag = Boolean(selectedSpecsPatient?.prescription_added || matchingAppt?.prescription_added);

                const hasPrescriptionDoc = prescriptions.some(p => {
                  const pApptId = p.appointment_id?._id || p.appointment_id;
                  return pApptId === targetApptId || p._id === targetApptId;
                });

                const hasMedicalRecordDoc = medicalRecords.some(r => {
                  const rApptId = r.appointment_id?._id || r.appointment_id;
                  return rApptId === targetApptId || r._id === targetApptId;
                });

                const isSpecsPrescriptionCreated = isPrescAddedFlag || hasPrescriptionDoc || hasMedicalRecordDoc;

                return (
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                    {isSpecsPrescriptionCreated ? (
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
                          handleViewDoctorRecordSheet(selectedSpecsPatient);
                        }}
                      >
                        <FileText size={16} /> View Medical Record
                      </button>
                    ) : (
                      <button
                        disabled={true}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 24px',
                          background: '#e2e8f0',
                          color: '#94a3b8',
                          border: 'none',
                          borderRadius: '12px',
                          fontWeight: 800,
                          fontSize: '14px',
                          cursor: 'not-allowed',
                          boxShadow: 'none'
                        }}
                        title="Prescription has not been created for this appointment yet"
                      >
                        <FileText size={16} /> View Medical Record (Pending)
                      </button>
                    )}
                  </div>
                );
              })()}
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
                    <span><strong>Email:</strong> {doctorProfile?.email || localStorage.getItem('doctorEmail') || ''}</span>
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

                {selectedRecordSheet.follow_up_date && (
                  <div className="dd-ps-detail-item" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <span className="dd-ps-detail-label" style={{ color: '#1e40af', fontWeight: 800 }}>Follow-up Date</span>
                    <span className="dd-ps-detail-val" style={{ color: '#1d4ed8', fontWeight: 800 }}>
                      {formatDate(selectedRecordSheet.follow_up_date)}
                    </span>
                  </div>
                )}
              </div>

              {/* Prescribed Medicines Section */}
              <div style={{ marginTop: '10px' }}>
                <div className="dd-ps-rx-header">
                  <Stethoscope size={20} /> Prescribed Medicines
                </div>

                {Array.isArray(selectedRecordSheet.medicines) && selectedRecordSheet.medicines.length > 0 ? (
                  <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                    <table className="dd-ps-meds-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', color: '#334155' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'center', width: '60px' }}>Sl. No.</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left' }}>Medicine Name</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left' }}>Dosage</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left' }}>Frequency</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left' }}>Duration</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', width: '70px' }}>Quantity</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left' }}>Instruction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecordSheet.medicines.map((med, idx) => (
                          <tr key={idx} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>{idx + 1}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                              {med.medicine_name || med.name || 'Prescribed Medicine'}
                              {med.strength ? <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '4px', fontWeight: 400 }}>({med.strength})</span> : null}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#334155' }}>{med.dosage || '1 Tablet'}</td>
                            <td style={{ padding: '10px 12px', color: '#334155' }}>{med.frequency || 'Once a day'}</td>
                            <td style={{ padding: '10px 12px', color: '#334155' }}>{med.duration || '5 Days'}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>{med.quantity || 1}</td>
                            <td style={{ padding: '10px 12px', color: '#475569', fontStyle: med.instructions ? 'normal' : 'italic' }}>
                              {med.instructions || 'After food'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '10px', color: '#64748b', fontSize: '13px' }}>
                    No prescribed medicines attached.
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

      {/* ── Cancellation / Rejection Modal ── */}
      {showCancelModal && cancelModalAppt && (() => {
        const isReject = cancelModalType === 'rejected';
        const patientName = cancelModalAppt.patient_id
          ? `${cancelModalAppt.patient_id.first_name || ''} ${cancelModalAppt.patient_id.last_name || ''}`.trim()
          : 'Patient';
        const CANCEL_REASONS = isReject
          ? [
              'Schedule conflict',
              'Patient not eligible for treatment',
              'Insufficient medical history',
              'Appointment outside my specialisation',
              'Duplicate booking detected',
              'Patient did not provide required documents',
              'Other',
            ]
          : [
              'Doctor unavailable / emergency leave',
              'Clinic / facility closed',
              'Patient requested rescheduling',
              'Technical issue (video call)',
              'Appointment time conflict',
              'Weather or travel disruption',
              'Other',
            ];
        return (
          <div className="dd-cancel-overlay" onClick={() => setShowCancelModal(false)}>
            <div
              className="dd-cancel-modal"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancel-modal-title"
            >
              {/* ── Modal Header ── */}
              <div className={`dd-cancel-modal-header ${isReject ? 'header-reject' : 'header-cancel'}`}>
                <div className="dd-cancel-modal-header-icon">
                  {isReject ? <XCircle size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <h3 id="cancel-modal-title">
                    {isReject ? 'Reject Appointment' : 'Cancel Appointment'}
                  </h3>
                  <p className="dd-cancel-modal-subtitle">
                    {isReject
                      ? 'Provide a reason for rejecting this appointment request'
                      : 'Provide a reason for cancelling this confirmed appointment'}
                  </p>
                </div>
                <button
                  className="dd-cancel-close-btn"
                  onClick={() => setShowCancelModal(false)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* ── Patient Info Strip ── */}
              <div className="dd-cancel-patient-strip">
                <div className="dd-cancel-patient-avatar">
                  {patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'P'}
                </div>
                <div className="dd-cancel-patient-info">
                  <span className="dd-cancel-patient-name">{patientName}</span>
                  <span className="dd-cancel-patient-meta">
                    <Calendar size={12} />
                    {formatDate(cancelModalAppt.appointment_date)} &nbsp;·&nbsp; {cancelModalAppt.appointment_time}
                    &nbsp;·&nbsp;
                    <span style={{ textTransform: 'capitalize' }}>{cancelModalAppt.consult_mode || 'offline'}</span>
                  </span>
                </div>
                <span className={`dd-cancel-status-badge ${isReject ? 'badge-reject' : 'badge-cancel'}`}>
                  {isReject ? 'Rejecting' : 'Cancelling'}
                </span>
              </div>

              {/* ── Form ── */}
              <form className="dd-cancel-form" onSubmit={handleCancelSubmit}>
                {/* Reason Select */}
                <div className="dd-cancel-field">
                  <label className="dd-cancel-label" htmlFor="cancel-reason-select">
                    <FileText size={14} />
                    {isReject ? 'Rejection Reason' : 'Cancellation Reason'}
                    <span className="dd-cancel-required">*</span>
                  </label>
                  <div className="dd-cancel-reason-grid">
                    {CANCEL_REASONS.map((reason) => (
                      <label
                        key={reason}
                        className={`dd-cancel-reason-option ${cancelReason === reason ? (isReject ? 'selected-reject' : 'selected-cancel') : ''}`}
                      >
                        <input
                          type="radio"
                          name="cancelReason"
                          value={reason}
                          checked={cancelReason === reason}
                          onChange={() => setCancelReason(reason)}
                        />
                        {reason}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Remarks */}
                <div className="dd-cancel-field">
                  <label className="dd-cancel-label" htmlFor="cancel-remarks">
                    <Edit3 size={14} />
                    Additional Remarks
                    <span className="dd-cancel-optional">(optional)</span>
                  </label>
                  <textarea
                    id="cancel-remarks"
                    className="dd-cancel-textarea"
                    rows={3}
                    placeholder={`Provide any additional details about this ${isReject ? 'rejection' : 'cancellation'}…`}
                    value={cancelRemarks}
                    onChange={e => setCancelRemarks(e.target.value)}
                    maxLength={500}
                  />
                  <span className="dd-cancel-char-count">{cancelRemarks.length}/500</span>
                </div>

                {/* Warning Banner */}
                <div className={`dd-cancel-warning ${isReject ? 'warning-reject' : 'warning-cancel'}`}>
                  <AlertCircle size={15} />
                  <span>
                    {isReject
                      ? 'The patient will be notified of this rejection and may re-book.'
                      : 'The patient will be notified of this cancellation. This action cannot be undone.'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="dd-cancel-actions">
                  <button
                    type="button"
                    className="dd-cancel-btn-secondary"
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancelSubmitting}
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    className={`dd-cancel-btn-primary ${isReject ? 'btn-primary-reject' : 'btn-primary-cancel'}`}
                    disabled={cancelSubmitting || !cancelReason}
                  >
                    {cancelSubmitting ? (
                      <><Loader2 size={16} className="dd-cancel-spinner" /> Processing…</>
                    ) : (
                      <>{isReject ? <><XCircle size={16} /> Confirm Rejection</> : <><XCircle size={16} /> Confirm Cancellation</>}</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default DoctorDashboard;
