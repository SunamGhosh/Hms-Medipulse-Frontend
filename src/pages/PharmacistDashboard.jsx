import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, CalendarCheck, User, LogOut, ArrowRight, Clock, ShieldCheck, ArrowUpRight, CheckCircle2,
  AlertCircle, Loader2, Users, Check, Pill, Edit3, Lock, Plus, Search, Package,
  ShoppingCart, X, Building2, Phone, Award, FileCheck, MapPin, Calendar, DollarSign,
  AlertTriangle, Eye, RefreshCw, FileText, Stethoscope, Tag, Percent
} from 'lucide-react';
import toast from 'react-hot-toast';
import './PharmacistDashboard.css';

const API = import.meta.env.VITE_URL;
const getToken = () => localStorage.getItem('pharmacistToken');

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
  INVENTORY: 'inventory',
  REQUESTS: 'requests',
  SALES: 'sales',
  PROFILE: 'profile',
};

const PharmacistDashboard = () => {
  const navigate = useNavigate();
  const [pharmacistName, setPharmacistName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [view, setView] = useState(VIEWS.DASHBOARD);
  
  // Profile state
  const profileFileInputRef = useRef(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [pharmacistProfile, setPharmacistProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    pharmacy_name: '',
    qualification: '',
    work_time_start: '',
    work_time_end: '',
    working_days: ''
  });

  // Password state
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Appointments state (Only pharmacist's own booked doctor appointments)
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [apptFilter, setApptFilter] = useState('all');
  const [apptSearch, setApptSearch] = useState('');

  // Doctor Consultation Booking state (10% Discount)
  const [showBookModal, setShowBookModal] = useState(false);
  const [doctorsList, setDoctorsList] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [submittingBook, setSubmittingBook] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');  // search within booking modal
  const [bookForm, setBookForm] = useState({
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    consult_mode: 'offline',
    disease: '',
    symptoms: ''
  });

  // Real-time clock — updates every minute for live slot restriction
  const [nowTime, setNowTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNowTime(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Standard 30-min appointment slots (24h format stored, 12h displayed)
  const SLOT_TIMES = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  // Returns true if slot time ("HH:mm") is already in the past for today
  const isPastTimeSlot = (time24) => {
    if (!bookForm.appointment_date) return false;
    const todayStr = nowTime.toISOString().split('T')[0];
    if (bookForm.appointment_date !== todayStr) return false;
    const [h, m] = time24.split(':').map(Number);
    const slotDate = new Date(nowTime);
    slotDate.setHours(h, m, 0, 0);
    return slotDate <= nowTime;
  };

  // Format HH:mm → 12h display
  const fmt12h = (t24) => {
    const [h, m] = t24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };


  // Inventory state
  const [medicines, setMedicines] = useState([]);
  const [medLoading, setMedLoading] = useState(false);
  const [medSearch, setMedSearch] = useState('');

  // Medicine Requests state
  const [medRequests, setMedRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);
  const [submittingReq, setSubmittingReq] = useState(false);
  const [reqForm, setReqForm] = useState({
    medicine_name: '',
    generic_name: '',
    category: 'Tablet',
    manufacturer: '',
    strength: '',
    unit: 'Strip',
    price: '',
    stock_available: '',
    mfg_date: '',
    expiry_date: '',
    description: '',
    requires_prescription: false
  });

  // Sales state
  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/pharmacist/login'); return; }
    const stored = localStorage.getItem('pharmacistName') || 'Pharmacist';
    setPharmacistName(stored.charAt(0).toUpperCase() + stored.slice(1));
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, [navigate]);

  // Fetch Profile
  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setProfileLoading(true);
    try {
      const res = await fetch(`${API}/pharmacist/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.pharmacist) {
        setPharmacistProfile(data.pharmacist);
        const name = `${data.pharmacist.first_name || ''} ${data.pharmacist.last_name || ''}`.trim();
        if (name) {
          setPharmacistName(name);
          localStorage.setItem('pharmacistName', name);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Compress & Upload / Update Profile Image
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, WEBP, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingImg(true);
    try {
      // Compress image using HTML5 Canvas
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 400;
            let w = img.width;
            let h = img.height;
            if (w > h) {
              if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
            } else {
              if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          };
          img.onerror = reject;
        };
        reader.onerror = reject;
      });

      const res = await fetch(`${API}/pharmacist/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ profile_img: base64Data })
      });

      const data = await res.json();
      if (res.ok && data.pharmacist) {
        toast.success('Profile picture updated successfully!');
        setPharmacistProfile(data.pharmacist);
      } else {
        toast.error(data.message || 'Failed to update profile picture');
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      toast.error('Error processing image upload');
    } finally {
      setUploadingImg(false);
      if (profileFileInputRef.current) profileFileInputRef.current.value = '';
    }
  };

  // Fetch Pharmacist's Own Appointments
  const fetchAppointments = useCallback(async (isPolling = false) => {
    const token = getToken();
    if (!token) return;
    if (!isPolling) setApptLoading(true);
    try {
      const res = await fetch(`${API}/appointment/pharmacistAll`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments(data.appointments || []);
      }
    } catch { /* silent */ }
    finally { if (!isPolling) setApptLoading(false); }
  }, []);

  // Fetch Active Doctors for Booking Modal
  const fetchActiveDoctors = useCallback(async () => {
    setDoctorsLoading(true);
    try {
      const res = await fetch(`${API}/doctor/active`);
      const data = await res.json();
      if (res.ok) {
        setDoctorsList(data.doctors || []);
      }
    } catch { /* silent */ }
    finally { setDoctorsLoading(false); }
  }, []);

  // Fetch Medicine Inventory
  const fetchMedicines = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setMedLoading(true);
    try {
      const res = await fetch(`${API}/medicine`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMedicines(data.data || data.medicines || []);
      }
    } catch { /* silent */ }
    finally { setMedLoading(false); }
  }, []);

  // Fetch Medicine Requests
  const fetchMedicineRequests = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setReqLoading(true);
    try {
      const res = await fetch(`${API}/med-req/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMedRequests(data.data || []);
      }
    } catch { /* silent */ }
    finally { setReqLoading(false); }
  }, []);

  // Fetch Pharmacy Sales
  const fetchSales = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setSalesLoading(true);
    try {
      const res = await fetch(`${API}/sale`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSales(data.sales || []);
      }
    } catch { /* silent */ }
    finally { setSalesLoading(false); }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchAppointments();
    fetchMedicines();
    fetchMedicineRequests();
    fetchSales();
    fetchActiveDoctors();

    // Live polling every 3 seconds for real-time status updates
    const intervalId = setInterval(() => fetchAppointments(true), 3000);
    return () => clearInterval(intervalId);
  }, [fetchProfile, fetchAppointments, fetchMedicines, fetchMedicineRequests, fetchSales, fetchActiveDoctors]);

  // Open Edit Profile Modal
  const openEditModal = () => {
    if (!pharmacistProfile) return;
    setEditForm({
      first_name: pharmacistProfile.first_name || '',
      last_name: pharmacistProfile.last_name || '',
      phone: pharmacistProfile.phone || '',
      address: pharmacistProfile.address || '',
      pharmacy_name: pharmacistProfile.pharmacy_name || '',
      qualification: pharmacistProfile.qualification || '',
      work_time_start: pharmacistProfile.work_time_start || '',
      work_time_end: pharmacistProfile.work_time_end || '',
      working_days: Array.isArray(pharmacistProfile.working_days) 
        ? pharmacistProfile.working_days.join(', ') 
        : pharmacistProfile.working_days || ''
    });
    setShowEditModal(true);
  };

  // Submit Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const payload = {
        ...editForm,
        working_days: typeof editForm.working_days === 'string'
          ? editForm.working_days.split(',').map(d => d.trim()).filter(Boolean)
          : editForm.working_days
      };

      const res = await fetch(`${API}/pharmacist/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.pharmacist) {
        toast.success('Profile updated successfully!');
        setPharmacistProfile(data.pharmacist);
        const name = `${data.pharmacist.first_name || ''} ${data.pharmacist.last_name || ''}`.trim();
        if (name) {
          setPharmacistName(name);
          localStorage.setItem('pharmacistName', name);
        }
        setShowEditModal(false);
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      toast.error('Server error updating profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Submit Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setChangingPwd(true);
    try {
      const res = await fetch(`${API}/pharmacist/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          currentPassword: pwdForm.currentPassword,
          newPassword: pwdForm.newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Password changed successfully!');
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPwdModal(false);
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (err) {
      toast.error('Server error changing password');
    } finally {
      setChangingPwd(false);
    }
  };

  // Submit Doctor Appointment Booking (with 10% Pharmacist Discount)
  const handleBookDoctorAppointment = async (e) => {
    e.preventDefault();
    if (!bookForm.doctor_id) {
      toast.error('Please select a doctor');
      return;
    }
    if (!bookForm.appointment_date) {
      toast.error('Please select an appointment date');
      return;
    }
    if (!bookForm.appointment_time) {
      toast.error('Please select a time slot');
      return;
    }
    setSubmittingBook(true);
    try {
      const res = await fetch(`${API}/appointment/pharmacist/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(bookForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Appointment request sent! Awaiting doctor approval.');
        setShowBookModal(false);
        setDoctorSearch('');
        setBookForm({
          doctor_id: '',
          appointment_date: '',
          appointment_time: '',
          consult_mode: 'offline',
          disease: '',
          symptoms: ''
        });
        fetchAppointments();
        setView(VIEWS.APPOINTMENTS);
        setApptFilter('pending');
      } else {
        toast.error(data.message || 'Failed to book doctor appointment');
      }
    } catch (err) {
      toast.error('Server error booking appointment');
    } finally {
      setSubmittingBook(false);
    }
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const completedAppts = appointments.filter(a => a.status === 'completed').length;
  const confirmedAppts = appointments.filter(a => a.status === 'confirmed').length;
  const todaysAppts = appointments.filter(a => isSameDay(a.appointment_date, new Date())).length;
  const lowStockMeds = medicines.filter(m => (m.stock_available || 0) < 20).length;
  const pendingRequests = medRequests.filter(r => r.status === 'Pending').length;
  
  const stats = [
    { icon: <CalendarCheck size={22} />, label: 'My Consultations', value: apptLoading ? '…' : appointments.length, trend: `${todaysAppts} Today`, color: 'teal' },
    { icon: <Stethoscope size={22} />,   label: 'Specialist Doctors',value: doctorsLoading ? '…' : doctorsList.length, trend: 'Available', color: 'blue' },
    { icon: <Package size={22} />,       label: 'Medicines Stock',   value: medLoading ? '…' : medicines.length, trend: `${lowStockMeds} Low Stock`, color: 'purple' },
    { icon: <FileCheck size={22} />,     label: 'Pending Stock Req', value: reqLoading ? '…' : pendingRequests, trend: `${medRequests.length} Total`, color: 'rose' },
  ];

  // Pay for appointment after doctor confirms (Step 3)
  const handlePayAppointment = async (apptId) => {
    if (!window.confirm('Confirm payment for this appointment?')) return;
    try {
      const res = await fetch(`${API}/appointment/pharmacist/${apptId}/pay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ payment_method: 'upi' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Payment confirmed! Appointment scheduled.');
        fetchAppointments();
      } else {
        toast.error(data.message || 'Payment failed');
      }
    } catch {
      toast.error('Server error processing payment');
    }
  };

  // Cancel pharmacist appointment
  const handleCancelAppointment = async (apptId) => {
    const reason = window.prompt('Reason for cancellation (optional):') ?? '';
    if (reason === null) return; // user clicked Cancel on prompt
    try {
      const res = await fetch(`${API}/appointment/pharmacist/${apptId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ cancel_reason: reason || 'Cancelled by pharmacist' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Appointment cancelled successfully.');
        fetchAppointments();
      } else {
        toast.error(data.message || 'Cancellation failed');
      }
    } catch {
      toast.error('Server error cancelling appointment');
    }
  };


  // Submit Create Medicine Request
  const handleCreateMedicineRequest = async (e) => {
    e.preventDefault();
    setSubmittingReq(true);
    try {
      const res = await fetch(`${API}/med-req/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          ...reqForm,
          price: Number(reqForm.price),
          stock_available: Number(reqForm.stock_available)
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Medicine stock request submitted!');
        setShowReqModal(false);
        setReqForm({
          medicine_name: '', generic_name: '', category: 'Tablet', manufacturer: '',
          strength: '', unit: 'Strip', price: '', stock_available: '',
          mfg_date: '', expiry_date: '', description: '', requires_prescription: false
        });
        fetchMedicineRequests();
      } else {
        toast.error(data.message || 'Failed to submit medicine request');
      }
    } catch (err) {
      toast.error('Server error submitting request');
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pharmacistToken');
    localStorage.removeItem('pharmacistEmail');
    localStorage.removeItem('pharmacistName');
    toast.success('Logged out successfully');
    navigate('/pharmacist/login');
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  // Filtered Pharmacist Appointments — dynamic search across Doctor Name, Specialization, Dept, Disease, ID, Patient
  const filteredAppointments = appointments.filter(a => {
    // 1. Status Filter
    const apptStatus = (a.status || 'pending').toLowerCase().trim();
    const filterStatus = (apptFilter || 'all').toLowerCase().trim();
    if (filterStatus !== 'all' && apptStatus !== filterStatus) {
      return false;
    }

    // 2. Search Query Filter
    if (!apptSearch || !apptSearch.trim()) return true;

    const rawQ = apptSearch.toLowerCase().trim();
    const cleanQ = rawQ.replace(/^(dr\.|dr\s+|doctor\s+)/i, '').trim();

    let docObj = (typeof a.doctor_id === 'object' && a.doctor_id) ? a.doctor_id : null;
    if (!docObj && typeof a.doctor_id === 'string') {
      docObj = doctorsList.find(d => d._id === a.doctor_id) || {};
    }
    if (!docObj) docObj = {};

    const docFirstName = (docObj.first_name || '').toLowerCase();
    const docLastName = (docObj.last_name || '').toLowerCase();
    const docFullName = `${docFirstName} ${docLastName}`.trim();
    const docFullWithDr = `dr. ${docFullName}`;

    const spec = (docObj.specialization || a.specialization || '').toLowerCase();
    const dept = (docObj.department || a.department || '').toLowerCase();
    const disease = (a.disease || '').toLowerCase();
    const mode = (a.consult_mode || '').toLowerCase();
    const apptId = (a._id || '').toLowerCase();
    const patientObj = (typeof a.patient_id === 'object' && a.patient_id) ? a.patient_id : {};
    const patientName = `${patientObj.first_name || ''} ${patientObj.last_name || ''}`.toLowerCase();

    return (
      docFullName.includes(rawQ) ||
      docFullWithDr.includes(rawQ) ||
      (cleanQ && docFullName.includes(cleanQ)) ||
      spec.includes(rawQ) ||
      (cleanQ && spec.includes(cleanQ)) ||
      dept.includes(rawQ) ||
      (cleanQ && dept.includes(cleanQ)) ||
      disease.includes(rawQ) ||
      mode.includes(rawQ) ||
      apptId.includes(rawQ) ||
      patientName.includes(rawQ)
    );
  });

  // Filtered Medicines
  const filteredMedicines = medicines.filter(m => {
    if (!medSearch.trim()) return true;
    const q = medSearch.toLowerCase();
    return (
      (m.medicine_name || '').toLowerCase().includes(q) ||
      (m.generic_name || '').toLowerCase().includes(q) ||
      (m.category || '').toLowerCase().includes(q) ||
      (m.manufacturer || '').toLowerCase().includes(q)
    );
  });

  // Selected Doctor info for booking modal calculations
  const selectedDoctor = doctorsList.find(d => d._id === bookForm.doctor_id);
  const origFee = selectedDoctor ? (selectedDoctor.consult_fee || 500) : 0;
  const discountedFee = Math.round(origFee * 0.90);
  const savings = origFee - discountedFee;

  return (
    <div className="pd-container">
      <div className="pd-blob pd-blob-1" />
      <div className="pd-blob pd-blob-2" />
      
      {/* ── SIDEBAR ── */}
      <aside className="pd-sidebar">
        <div className="pd-sidebar-brand">
          <div className="pd-sidebar-logo">
            <Pill size={20} strokeWidth={2.5} color="#fff" />
          </div>
          <span>Pharmacy Portal</span>
        </div>

        <nav className="pd-nav">
          <button className={`pd-nav-item${view === VIEWS.DASHBOARD ? ' active' : ''}`}
            onClick={() => setView(VIEWS.DASHBOARD)}>
            <Activity size={18} /> Dashboard
          </button>

          <button className={`pd-nav-item${view === VIEWS.APPOINTMENTS ? ' active' : ''}`}
            onClick={() => setView(VIEWS.APPOINTMENTS)}>
            <CalendarCheck size={18} /> Doctor Consultations
          </button>

          <button className={`pd-nav-item${view === VIEWS.INVENTORY ? ' active' : ''}`}
            onClick={() => setView(VIEWS.INVENTORY)}>
            <Package size={18} /> Medicine Inventory
          </button>

          <button className={`pd-nav-item${view === VIEWS.REQUESTS ? ' active' : ''}`}
            onClick={() => setView(VIEWS.REQUESTS)}>
            <FileText size={18} /> Stock Requests
          </button>

          <button className={`pd-nav-item${view === VIEWS.SALES ? ' active' : ''}`}
            onClick={() => setView(VIEWS.SALES)}>
            <ShoppingCart size={18} /> Sales History
          </button>

          <div className="pd-nav-divider" />

          <button className={`pd-nav-item${view === VIEWS.PROFILE ? ' active' : ''}`}
            onClick={() => setView(VIEWS.PROFILE)}>
            <User size={18} /> My Profile
          </button>
        </nav>

        <button className="pd-logout-btn" onClick={handleLogout}>
          <LogOut size={17} /> Sign Out
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="pd-main">
        {/* HERO BANNER */}
        <div className="pd-hero">
          <div className="pd-hero-accent" />
          <div className="pd-hero-left">
            <h1 className="pd-hero-title">
              Welcome back, <span className="pd-hero-name">{pharmacistName}</span>
            </h1>
            <p className="pd-hero-sub">
              {greeting} &mdash; Manage pharmacy inventory, doctor consultations (with 10% discount), and stock requests.
            </p>
          </div>
          <div className="pd-hero-right">
            <div className="pd-date">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="pd-avatar" onClick={() => setView(VIEWS.PROFILE)} title="View Profile" style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {pharmacistProfile?.profile_img ? (
                <img src={pharmacistProfile.profile_img} alt="Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                pharmacistName.charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </div>

        {/* ==================== DASHBOARD VIEW ==================== */}
        {view === VIEWS.DASHBOARD && (
          <>
            <section className="pd-stats-grid">
              {stats.map((s, i) => (
                <div key={i} className={`pd-stat-card pd-stat-card--${s.color}`}>
                  <div className="pd-stat-top">
                    <div className={`pd-stat-icon-wrapper pd-stat-icon-wrapper--${s.color}`}>{s.icon}</div>
                    <div className="pd-stat-badge"><ArrowUpRight size={14} /><span>{s.trend}</span></div>
                  </div>
                  <div className="pd-stat-bottom">
                    <span className="pd-stat-value">{s.value}</span>
                    <span className="pd-stat-label">{s.label}</span>
                  </div>
                </div>
              ))}
            </section>

            <div className="pd-bottom-layout">
              {/* My Booked Doctor Consultations */}
              <section className="pd-section">
                <div className="pd-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="pd-section-title">My Doctor Consultations</h2>
                  <button onClick={() => setView(VIEWS.APPOINTMENTS)}
                    style={{ background: 'none', border: 'none', color: '#0d9488', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View all <ArrowRight size={13} />
                  </button>
                </div>
                <div className="pd-section-body">
                  {apptLoading ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : appointments.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      <Stethoscope size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                      <p>No doctor consultations booked yet.</p>
                      <button onClick={() => setShowBookModal(true)} className="pd-btn-primary" style={{ marginTop: '0.75rem', fontSize: 13 }}>
                        <Plus size={14} /> Book Doctor Consultation (10% Off)
                      </button>
                    </div>
                  ) : (
                    <ul className="pd-activity-list">
                      {appointments.slice(0, 4).map((appt, i) => {
                        const statusKey = (appt.status || 'pending').toLowerCase();
                        const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
                        return (
                          <li key={i} className="pd-activity-item">
                            <div className="pd-activity-dot" style={{ background: cfg.dot, boxShadow: `0 0 0 3px ${cfg.dot}33` }} />
                            <div className="pd-activity-content">
                              <p className="pd-activity-title">
                                Doctor: Dr. {appt.doctor_id?.first_name} {appt.doctor_id?.last_name} ({appt.doctor_id?.specialization || 'General'})
                              </p>
                              <div className="pd-activity-meta">
                                <Clock size={11} />
                                <span>{formatDate(appt.appointment_date)} at {appt.appointment_time}</span>
                                <span className={`pd-activity-badge pd-badge-${cfg.color}`}>{cfg.label}</span>
                                {appt.consultation_fee && (
                                  <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#059669' }}>
                                    Fee: ₹{appt.consultation_fee} (10% Discounted)
                                  </span>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>

              {/* Quick Actions Card */}
              <section className="pd-section">
                <div className="pd-section-header">
                  <h2 className="pd-section-title">Quick Actions</h2>
                </div>
                <div className="pd-section-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button onClick={() => setShowBookModal(true)} className="pd-action-btn pd-action-teal">
                    <Stethoscope size={18} /> Book Doctor Consultation (10% Off)
                  </button>

                  <button onClick={() => { setView(VIEWS.REQUESTS); setShowReqModal(true); }} className="pd-action-btn pd-action-blue">
                    <Plus size={18} /> Request Medicine Stock
                  </button>

                  <button onClick={() => setView(VIEWS.INVENTORY)} className="pd-action-btn pd-action-purple">
                    <Package size={18} /> Check Medicine Inventory
                  </button>

                  <button onClick={openEditModal} className="pd-action-btn pd-action-rose">
                    <Edit3 size={18} /> Update Profile Info
                  </button>
                </div>
              </section>
            </div>
          </>
        )}

        {/* ==================== APPOINTMENTS VIEW ==================== */}
        {view === VIEWS.APPOINTMENTS && (
          <section className="pd-section">
            <div className="pd-section-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 className="pd-section-title">My Doctor Consultations</h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                  Book and track doctor consultations dynamically with 10% Pharmacist discount
                </p>
              </div>
              
              <button onClick={() => setShowBookModal(true)} className="pd-btn-primary">
                <Plus size={16} /> Book Doctor Consultation (10% Off)
              </button>
            </div>

            {/* ── Dynamic Status Metrics Overview Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div onClick={() => setApptFilter('all')} style={{
                background: apptFilter === 'all' ? 'linear-gradient(135deg, #f0fdf9, #ccfbf1)' : '#ffffff',
                border: `1.5px solid ${apptFilter === 'all' ? '#0d9488' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '1rem', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>All Consultations</span>
                  <Stethoscope size={16} color="#0d9488" />
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 6 }}>
                  {appointments.length}
                </div>
              </div>

              <div onClick={() => setApptFilter('pending')} style={{
                background: apptFilter === 'pending' ? 'linear-gradient(135deg, #eff6ff, #dbeafe)' : '#ffffff',
                border: `1.5px solid ${apptFilter === 'pending' ? '#3b82f6' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '1rem', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Pending Approval</span>
                  <Clock size={16} color="#3b82f6" />
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1d4ed8', marginTop: 6 }}>
                  {appointments.filter(a => (a.status||'').toLowerCase() === 'pending').length}
                </div>
              </div>

              <div onClick={() => setApptFilter('confirmed')} style={{
                background: apptFilter === 'confirmed' ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : '#ffffff',
                border: `1.5px solid ${apptFilter === 'confirmed' ? '#0d9488' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '1rem', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Confirmed & Active</span>
                  <CalendarCheck size={16} color="#0d9488" />
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f766e', marginTop: 6 }}>
                  {appointments.filter(a => (a.status||'').toLowerCase() === 'confirmed').length}
                </div>
              </div>

              <div onClick={() => setApptFilter('completed')} style={{
                background: apptFilter === 'completed' ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : '#ffffff',
                border: `1.5px solid ${apptFilter === 'completed' ? '#10b981' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '1rem', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Completed</span>
                  <CheckCircle2 size={16} color="#10b981" />
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#047857', marginTop: 6 }}>
                  {appointments.filter(a => (a.status||'').toLowerCase() === 'completed').length}
                </div>
              </div>
            </div>

            {/* ── Search & Status Pills Filter Bar ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Search Input Bar */}
                <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search doctor by name (e.g. Dr. Smith) or specialization (e.g. Cardiologist)..."
                    value={apptSearch}
                    onChange={e => setApptSearch(e.target.value)}
                    style={{ width: '100%', padding: '9px 32px 9px 36px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                  />
                  {apptSearch && (
                    <button
                      onClick={() => setApptSearch('')}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2, display: 'flex' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {(apptSearch || apptFilter !== 'all') && (
                  <button
                    onClick={() => { setApptSearch(''); setApptFilter('all'); }}
                    style={{ padding: '8px 14px', borderRadius: 8, background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <X size={13} /> Reset Filters
                  </button>
                )}
              </div>

              {/* Status Filter Pills Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { key: 'all', label: 'All Consultations', count: appointments.length, color: '#0d9488' },
                  { key: 'pending', label: 'Pending', count: appointments.filter(a => (a.status||'').toLowerCase() === 'pending').length, color: '#3b82f6' },
                  { key: 'confirmed', label: 'Confirmed', count: appointments.filter(a => (a.status||'').toLowerCase() === 'confirmed').length, color: '#0d9488' },
                  { key: 'completed', label: 'Completed', count: appointments.filter(a => (a.status||'').toLowerCase() === 'completed').length, color: '#10b981' },
                  { key: 'cancelled', label: 'Cancelled', count: appointments.filter(a => (a.status||'').toLowerCase() === 'cancelled').length, color: '#f43f5e' },
                  { key: 'rejected', label: 'Rejected', count: appointments.filter(a => (a.status||'').toLowerCase() === 'rejected').length, color: '#f97316' }
                ].map(tab => {
                  const isActive = apptFilter.toLowerCase() === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setApptFilter(tab.key)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: `1.5px solid ${isActive ? tab.color : '#cbd5e1'}`,
                        background: isActive ? tab.color : '#ffffff',
                        color: isActive ? '#ffffff' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: isActive ? `0 2px 8px ${tab.color}40` : 'none'
                      }}
                    >
                      <span>{tab.label}</span>
                      <span style={{
                        background: isActive ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                        color: isActive ? '#ffffff' : '#64748b',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 800
                      }}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pd-section-body">
              {apptLoading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                  <p>Loading your consultations…</p>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Stethoscope size={60} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>
                    {apptSearch || apptFilter !== 'all' ? 'No matching doctor consultations' : 'No doctor consultations found'}
                  </h3>
                  <p style={{ fontSize: 14, color: '#64748b', marginBottom: '1rem' }}>
                    {apptSearch || apptFilter !== 'all'
                      ? 'Try clearing your search query or switching status tabs.'
                      : 'Book a doctor appointment whenever you need a medical consultation.'}
                  </p>
                  {apptSearch || apptFilter !== 'all' ? (
                    <button onClick={() => { setApptSearch(''); setApptFilter('all'); }} className="pd-btn-secondary" style={{ fontSize: 13 }}>
                      Clear Search & Filters
                    </button>
                  ) : (
                    <button onClick={() => setShowBookModal(true)} className="pd-btn-primary">
                      <Plus size={16} /> Book Doctor Appointment (10% Off)
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredAppointments.map((appt) => {
                    const statusKey = (appt.status || 'pending').toLowerCase();
                    const paymentKey = (appt.payment_status || 'pending').toLowerCase();
                    const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
                    const needsPayment = statusKey === 'confirmed' && paymentKey !== 'paid';
                    const canCancel = ['pending', 'confirmed'].includes(statusKey) && paymentKey !== 'paid';
                    const docObj = (typeof appt.doctor_id === 'object' && appt.doctor_id) 
                      ? appt.doctor_id 
                      : (doctorsList.find(d => d._id === appt.doctor_id) || {});
                    const docName = docObj.first_name ? `Dr. ${docObj.first_name} ${docObj.last_name || ''}` : 'Doctor Consultation';
                    const docSpec = docObj.specialization || appt.specialization || 'General Specialist';

                    let statusBadgeLabel = cfg.label;
                    if (statusKey === 'pending') statusBadgeLabel = 'Pending Approval';
                    if (statusKey === 'confirmed' && needsPayment) statusBadgeLabel = 'Confirmed (Pay Fee)';
                    if (statusKey === 'completed') statusBadgeLabel = 'Completed ✓';

                    return (
                      <div key={appt._id} style={{
                        background: needsPayment ? 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' : '#fff',
                        border: needsPayment ? '1.5px solid #34d399' : '1.5px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: cfg.dot, flexShrink: 0, boxShadow: `0 0 0 4px ${cfg.dot}22` }} />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>
                              {docName}
                            </span>
                            <span className="pd-tag" style={{ background: '#f0fdf9', color: '#0d9488', border: '1px solid #ccfbf1', fontWeight: 700 }}>
                              {docSpec}
                            </span>
                            <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Percent size={11} /> 10% Pharmacist Discount
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '13px', color: '#64748b' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> {formatDate(appt.appointment_date)} at {appt.appointment_time}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'capitalize' }}>
                              Mode: {appt.consult_mode || 'offline'}
                            </span>
                            {appt.disease && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Reason: {appt.disease}
                              </span>
                            )}
                            {appt.consultation_fee && (
                              <span style={{ fontWeight: 700, color: '#059669' }}>
                                Fee: ₹{appt.consultation_fee}
                                {appt.original_fee && appt.original_fee > appt.consultation_fee && (
                                  <span style={{ textDecoration: 'line-through', color: '#94a3b8', marginLeft: 4, fontWeight: 400 }}>
                                    ₹{appt.original_fee}
                                  </span>
                                )}
                              </span>
                            )}
                            <span style={{ color: appt.payment_status === 'paid' ? '#059669' : '#f97316', fontWeight: 600 }}>
                              Payment: {appt.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
                            </span>
                          </div>

                          {/* Payment CTA when doctor has confirmed */}
                          {needsPayment && (
                            <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: '#d1fae5', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <AlertCircle size={16} color="#059669" />
                              <span style={{ fontSize: 13, color: '#047857', fontWeight: 600 }}>
                                Doctor approved! Complete your payment to finalise the appointment.
                              </span>
                              <button
                                onClick={() => handlePayAppointment(appt._id)}
                                style={{ padding: '6px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                              >
                                <DollarSign size={14} /> Pay ₹{appt.consultation_fee}
                              </button>
                            </div>
                          )}

                          {/* Video Call CTA when confirmed, paid, and online */}
                          {statusKey === 'confirmed' && paymentKey === 'paid' && appt.consult_mode === 'online' && (
                            <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <Stethoscope size={16} color="#2563eb" />
                              <span style={{ fontSize: 13, color: '#1e40af', fontWeight: 600 }}>
                                Online Consultation Scheduled! Click below to enter the video call room.
                              </span>
                              <button
                                onClick={() => navigate(`/video-call/${appt._id}`)}
                                style={{ padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                              >
                                <ArrowRight size={14} /> Join Video Call Room
                              </button>
                            </div>
                          )}

                          {/* Cancellation or Rejection Feedback info */}
                          {statusKey === 'rejected' && (
                            <div style={{ marginTop: '0.5rem', fontSize: 12, color: '#ea580c', fontWeight: 600 }}>
                              Doctor Rejection Reason: {appt.cancel_reason || 'Doctor unavailable at this slot.'}
                            </div>
                          )}
                          {statusKey === 'cancelled' && (
                            <div style={{ marginTop: '0.5rem', fontSize: 12, color: '#e11d48', fontWeight: 600 }}>
                              Cancelled by {appt.cancelled_by || 'pharmacist'}: {appt.cancel_reason || 'No reason provided.'}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                          <span style={{
                            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                            background: cfg.dot + '18', color: cfg.dot,
                          }}>
                            {statusBadgeLabel}
                          </span>
                          {canCancel && (
                            <button
                              onClick={() => handleCancelAppointment(appt._id)}
                              style={{ padding: '5px 12px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <X size={12} /> Cancel
                            </button>
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

        {/* ==================== MEDICINE INVENTORY VIEW ==================== */}
        {view === VIEWS.INVENTORY && (
          <section className="pd-section">
            <div className="pd-section-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div>
                <h2 className="pd-section-title">Medicine Inventory</h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>Active medicines available in system</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search medicine, category..."
                    value={medSearch}
                    onChange={e => setMedSearch(e.target.value)}
                    style={{ padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', width: 240 }}
                  />
                </div>

                <button onClick={fetchMedicines} className="pd-btn-secondary" style={{ padding: '8px 12px', fontSize: 13 }}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </div>

            <div className="pd-section-body">
              {medLoading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                  <p>Loading medicines inventory…</p>
                </div>
              ) : filteredMedicines.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Package size={60} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>No medicines found</h3>
                </div>
              ) : (
                <div className="pd-table-wrapper">
                  <table className="pd-table">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Category</th>
                        <th>Manufacturer</th>
                        <th>Price</th>
                        <th>Stock Status</th>
                        <th>Prescription</th>
                        <th>Expiry Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMedicines.map((m) => {
                        const stock = m.stock_available || 0;
                        const isLow = stock > 0 && stock < 20;
                        const isOut = stock === 0;
                        return (
                          <tr key={m._id}>
                            <td>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.medicine_name}</div>
                              {m.generic_name && <div style={{ fontSize: 11, color: '#64748b' }}>{m.generic_name} ({m.strength})</div>}
                            </td>
                            <td><span className="pd-tag">{m.category}</span></td>
                            <td>{m.manufacturer || '—'}</td>
                            <td style={{ fontWeight: 700, color: '#059669' }}>₹{m.price}</td>
                            <td>
                              {isOut ? (
                                <span className="pd-badge pd-badge-rose"><AlertCircle size={12} /> Out of Stock (0)</span>
                              ) : isLow ? (
                                <span className="pd-badge pd-badge-orange"><AlertTriangle size={12} /> Low Stock ({stock})</span>
                              ) : (
                                <span className="pd-badge pd-badge-green"><CheckCircle2 size={12} /> In Stock ({stock})</span>
                              )}
                            </td>
                            <td>
                              {m.requires_prescription ? (
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>Rx Required</span>
                              ) : (
                                <span style={{ fontSize: 12, color: '#94a3b8' }}>OTC</span>
                              )}
                            </td>
                            <td>{formatDate(m.expiry_date)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ==================== MEDICINE STOCK REQUESTS VIEW ==================== */}
        {view === VIEWS.REQUESTS && (
          <section className="pd-section">
            <div className="pd-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="pd-section-title">Medicine Stock Requests</h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>Stock approval requests submitted to Admin</p>
              </div>

              <button onClick={() => setShowReqModal(true)} className="pd-btn-primary">
                <Plus size={16} /> Request New Stock
              </button>
            </div>

            <div className="pd-section-body">
              {reqLoading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                  <p>Loading stock requests…</p>
                </div>
              ) : medRequests.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <FileText size={60} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>No stock requests submitted yet</h3>
                  <button onClick={() => setShowReqModal(true)} className="pd-btn-primary" style={{ marginTop: '1rem' }}>
                    <Plus size={16} /> Submit Your First Request
                  </button>
                </div>
              ) : (
                <div className="pd-table-wrapper">
                  <table className="pd-table">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Category</th>
                        <th>Strength / Unit</th>
                        <th>Qty / Price</th>
                        <th>Status</th>
                        <th>Submitted On</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medRequests.map((req) => (
                        <tr key={req._id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{req.medicine_name}</div>
                            {req.generic_name && <div style={{ fontSize: 11, color: '#64748b' }}>{req.generic_name}</div>}
                          </td>
                          <td><span className="pd-tag">{req.category}</span></td>
                          <td>{req.strength} ({req.unit})</td>
                          <td>
                            <div>Qty: <strong>{req.stock_available}</strong></div>
                            <div style={{ fontSize: 12, color: '#059669' }}>₹{req.price}</div>
                          </td>
                          <td>
                            {req.status === 'Approved' ? (
                              <span className="pd-badge pd-badge-green"><CheckCircle2 size={12} /> Approved</span>
                            ) : req.status === 'Rejected' ? (
                              <span className="pd-badge pd-badge-rose"><X size={12} /> Rejected</span>
                            ) : (
                              <span className="pd-badge pd-badge-blue"><Clock size={12} /> Pending Admin</span>
                            )}
                          </td>
                          <td>{formatDate(req.createdAt)}</td>
                          <td>
                            {req.rejection_reason && (
                              <span style={{ fontSize: 12, color: '#ef4444' }} title={req.rejection_reason}>
                                Reason: {req.rejection_reason}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ==================== PHARMACY SALES HISTORY VIEW ==================== */}
        {view === VIEWS.SALES && (
          <section className="pd-section">
            <div className="pd-section-header">
              <h2 className="pd-section-title">Pharmacy Sales History</h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>Record of completed medicine transactions</p>
            </div>

            <div className="pd-section-body">
              {salesLoading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                  <p>Loading sales history…</p>
                </div>
              ) : sales.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <ShoppingCart size={60} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>No sales recorded yet</h3>
                </div>
              ) : (
                <div className="pd-table-wrapper">
                  <table className="pd-table">
                    <thead>
                      <tr>
                        <th>Sale ID</th>
                        <th>Total Items</th>
                        <th>Quantity</th>
                        <th>Total Amount</th>
                        <th>Date & Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((s) => (
                        <tr key={s._id}>
                          <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0d9488' }}>{s._id}</td>
                          <td>{s.total_items} items</td>
                          <td>{s.total_quantity} units</td>
                          <td style={{ fontWeight: 800, color: '#059669', fontSize: 15 }}>₹{s.total_price}</td>
                          <td>{s.sold_at ? new Date(s.sold_at).toLocaleString('en-IN') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ==================== MY PROFILE VIEW ==================== */}
        {view === VIEWS.PROFILE && (
          <section className="pd-section">
            <div className="pd-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="pd-section-title">Pharmacist Profile</h2>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={openEditModal} className="pd-btn-primary">
                  <Edit3 size={16} /> Edit Profile
                </button>
                <button onClick={() => setShowPwdModal(true)} className="pd-btn-secondary">
                  <Lock size={16} /> Change Password
                </button>
              </div>
            </div>

            <div className="pd-section-body">
              {profileLoading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: '1rem' }}>Fetching pharmacist profile…</p>
                </div>
              ) : pharmacistProfile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Top Profile Card (No ID shown) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                    borderRadius: '16px',
                    padding: '1.75rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
                        {pharmacistProfile.profile_img ? (
                          <img
                            src={pharmacistProfile.profile_img}
                            alt="Pharmacist Profile"
                            style={{
                              width: '100%', height: '100%', borderRadius: '50%',
                              objectFit: 'cover', border: '3px solid #0d9488',
                              boxShadow: '0 8px 24px rgba(13, 148, 136, 0.3)'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981, #0d9488)',
                            color: '#fff', fontSize: 36, fontWeight: 800,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 24px rgba(13, 148, 136, 0.3)'
                          }}>
                            {pharmacistProfile.first_name?.[0]?.toUpperCase()}
                          </div>
                        )}

                        {/* Dynamic + (Plus) icon overlay badge button */}
                        <button
                          type="button"
                          onClick={() => profileFileInputRef.current?.click()}
                          title="Click to upload or update profile photo"
                          disabled={uploadingImg}
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: '#0d9488',
                            color: '#ffffff',
                            border: '2.5px solid #ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
                            transition: 'all 0.15s ease-in-out',
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          {uploadingImg ? (
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Plus size={16} strokeWidth={3} />
                          )}
                        </button>
                        <input
                          type="file"
                          ref={profileFileInputRef}
                          accept="image/*"
                          onChange={handleProfileImageUpload}
                          style={{ display: 'none' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                            {pharmacistProfile.first_name} {pharmacistProfile.last_name}
                          </h3>
                          {pharmacistProfile.is_verified && (
                            <span title="Verified Pharmacist" style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <ShieldCheck size={14} /> Verified
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{pharmacistProfile.email}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <span style={{
                        padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: '0.6px',
                        background: pharmacistProfile.status === 'active' ? '#ecfdf5' : '#fef2f2',
                        color: pharmacistProfile.status === 'active' ? '#047857' : '#b91c1c',
                        border: `1px solid ${pharmacistProfile.status === 'active' ? '#a7f3d0' : '#fecaca'}`
                      }}>
                        ● {pharmacistProfile.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Profile Info Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {[
                      { icon: <Building2 size={18} color="#0d9488" />, label: 'Pharmacy Name',  value: pharmacistProfile.pharmacy_name || '—' },
                      { icon: <Award size={18} color="#0d9488" />,     label: 'Qualification',  value: pharmacistProfile.qualification || '—' },
                      { icon: <Phone size={18} color="#0d9488" />,     label: 'Phone',          value: pharmacistProfile.phone || '—' },
                      { icon: <FileCheck size={18} color="#0d9488" />, label: 'License No',     value: pharmacistProfile.license_no || '—' },
                      { icon: <Clock size={18} color="#0d9488" />,     label: 'Work Time',      value: (pharmacistProfile.work_time_start && pharmacistProfile.work_time_end) ? `${pharmacistProfile.work_time_start} - ${pharmacistProfile.work_time_end}` : '—' },
                      { icon: <Calendar size={18} color="#0d9488" />,  label: 'Working Days',   value: Array.isArray(pharmacistProfile.working_days) ? pharmacistProfile.working_days.join(', ') : (pharmacistProfile.working_days || '—') },
                      { icon: <MapPin size={18} color="#0d9488" />,    label: 'Address',        value: pharmacistProfile.address || '—' },
                      { icon: <User size={18} color="#0d9488" />,      label: 'Member Since',   value: formatDate(pharmacistProfile.createdAt || pharmacistProfile.joining_date) },
                    ].map((item, idx) => (
                      <div key={idx} style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        padding: '1rem 1.25rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem'
                      }}>
                        <div style={{ background: '#f0fdf9', padding: '10px', borderRadius: '10px', flexShrink: 0 }}>
                          {item.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '3px' }}>
                            {item.label}
                          </div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', lineHeight: 1.4 }}>
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
                  <p>Could not load profile information.</p>
                  <button onClick={fetchProfile} className="pd-btn-secondary" style={{ marginTop: '1rem' }}>
                    Retry Loading Profile
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

      </main>

      {/* ==================== BOOK DOCTOR CONSULTATION MODAL (10% DISCOUNT) ==================== */}
      {showBookModal && (
        <div className="pd-modal-overlay">
          <div className="pd-modal-content" style={{ maxWidth: 560 }}>
            <div className="pd-modal-header">
              <h3><Stethoscope size={20} /> Book Doctor Consultation</h3>
              <button className="pd-modal-close" onClick={() => { setShowBookModal(false); setDoctorSearch(''); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleBookDoctorAppointment}>
              <div className="pd-modal-body">
                {/* 10% Pharmacist Discount Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                  border: '1.5px dashed #059669',
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <div style={{ background: '#059669', color: '#fff', padding: 8, borderRadius: 8, display: 'flex' }}>
                    <Tag size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#065f46' }}>
                      Pharmacist Special Benefit
                    </div>
                    <div style={{ fontSize: 12, color: '#047857', fontWeight: 600 }}>
                      Automatic 10% Discount applied on all doctor consultations!
                    </div>
                  </div>
                </div>

                {/* Searchable doctor list */}
                <div className="pd-form-group">
                  <label>Search & Select Specialist Doctor *</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Type doctor name or specialization..."
                      value={doctorSearch}
                      onChange={e => setDoctorSearch(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  {doctorsLoading ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: 13 }}>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading doctors...
                    </div>
                  ) : (
                    <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6,
                      scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
                      {doctorsList
                        .filter(d => {
                          if (!doctorSearch.trim()) return true;
                          const q = doctorSearch.toLowerCase();
                          return (
                            `${d.first_name} ${d.last_name}`.toLowerCase().includes(q) ||
                            (d.specialization || '').toLowerCase().includes(q) ||
                            (d.department || '').toLowerCase().includes(q)
                          );
                        })
                        .map(d => {
                          const isSelected = bookForm.doctor_id === d._id;
                          const fee = d.consult_fee || 500;
                          const discounted = Math.round(fee * 0.90);
                          return (
                            <div
                              key={d._id}
                              onClick={() => setBookForm({ ...bookForm, doctor_id: d._id, appointment_time: '' })}
                              style={{
                                padding: '10px 14px',
                                borderRadius: 10,
                                border: `1.5px solid ${isSelected ? '#0d9488' : '#e2e8f0'}`,
                                background: isSelected ? '#f0fdf9' : '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 10,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: '50%',
                                  background: isSelected ? '#0d9488' : '#f1f5f9',
                                  color: isSelected ? '#fff' : '#475569',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontWeight: 800, fontSize: 14, flexShrink: 0
                                }}>
                                  {d.first_name?.[0]}{d.last_name?.[0]}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                                    Dr. {d.first_name} {d.last_name}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#64748b' }}>
                                    {d.specialization || 'General'}{d.department ? ` · ${d.department}` : ''}
                                  </div>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>₹{fee}</div>
                                <div style={{ fontWeight: 800, fontSize: 13, color: '#059669' }}>₹{discounted}</div>
                              </div>
                            </div>
                          );
                        })}
                      {doctorsList.filter(d => {
                        if (!doctorSearch.trim()) return true;
                        const q = doctorSearch.toLowerCase();
                        return `${d.first_name} ${d.last_name}`.toLowerCase().includes(q) ||
                          (d.specialization || '').toLowerCase().includes(q);
                      }).length === 0 && (
                        <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: 13 }}>
                          No doctors found matching "{doctorSearch}"
                        </div>
                      )}
                    </div>
                  )}
                  {!bookForm.doctor_id && (
                    <p style={{ fontSize: 12, color: '#ef4444', margin: '4px 0 0' }}>Please select a doctor</p>
                  )}
                </div>


                {selectedDoctor && (
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: 10,
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    fontSize: 13
                  }}>
                    <span>Consultation Fee:</span>
                    <div>
                      <span style={{ textDecoration: 'line-through', color: '#94a3b8', marginRight: 8 }}>₹{origFee}</span>
                      <span style={{ fontWeight: 800, color: '#059669', fontSize: 15 }}>₹{discountedFee}</span>
                      <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: 8, marginLeft: 6, fontWeight: 700 }}>
                        Save ₹{savings} (10% Off)
                      </span>
                    </div>
                  </div>
                )}

                 <div className="pd-form-row">
                  <div className="pd-form-group">
                    <label>Appointment Date *</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={bookForm.appointment_date}
                      onChange={e => {
                        setBookForm({ ...bookForm, appointment_date: e.target.value, appointment_time: '' });
                      }}
                    />
                  </div>
                </div>

                {/* Time slot grid — past slots greyed with ✕ */}
                {bookForm.appointment_date && (
                  <div className="pd-form-group" style={{ width: '100%' }}>
                    <label>Select Time Slot *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px', marginTop: '0.5rem' }}>
                      {SLOT_TIMES.map(t24 => {
                        const isPast = isPastTimeSlot(t24);
                        const isSelected = bookForm.appointment_time === t24;
                        return (
                          <button
                            key={t24}
                            type="button"
                            disabled={isPast}
                            title={isPast ? 'This time has already passed' : ''}
                            onClick={() => !isPast && setBookForm({ ...bookForm, appointment_time: t24 })}
                            style={{
                              position: 'relative',
                              padding: '8px 4px',
                              borderRadius: '8px',
                              border: `1.5px solid ${isSelected ? '#0d9488' : isPast ? '#fecaca' : '#cbd5e1'}`,
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: isPast ? 'not-allowed' : 'pointer',
                              background: isSelected ? '#0d9488' : isPast ? '#fef2f2' : '#fff',
                              color: isSelected ? '#fff' : isPast ? '#fca5a5' : '#334155',
                              opacity: isPast ? 0.75 : 1,
                              transition: 'all 0.15s',
                            }}
                          >
                            {fmt12h(t24)}
                            {isPast && (
                              <span style={{
                                position: 'absolute', top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)',
                                fontSize: '20px', fontWeight: 900, color: '#ef4444',
                                lineHeight: 1, pointerEvents: 'none'
                              }}>✕</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {!bookForm.appointment_time && (
                      <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>Please select a time slot</p>
                    )}
                  </div>
                )}


                <div className="pd-form-row">
                  <div className="pd-form-group">
                    <label>Consultation Mode</label>
                    <select
                      value={bookForm.consult_mode}
                      onChange={e => setBookForm({ ...bookForm, consult_mode: e.target.value })}
                    >
                      <option value="offline">In-Person (Offline)</option>
                      <option value="online">Video Call (Online)</option>
                    </select>
                  </div>

                  <div className="pd-form-group">
                    <label>Reason / Consultation Issue *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Health Checkup / Medical Query"
                      value={bookForm.disease}
                      onChange={e => setBookForm({ ...bookForm, disease: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pd-form-group">
                  <label>Symptoms / Additional Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Describe symptoms or query..."
                    value={bookForm.symptoms}
                    onChange={e => setBookForm({ ...bookForm, symptoms: e.target.value })}
                  />
                </div>
              </div>

              <div className="pd-modal-footer">
                <button type="button" className="pd-btn-secondary" onClick={() => setShowBookModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="pd-btn-primary" disabled={submittingBook}>
                  {submittingBook ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : `Confirm & Pay ₹${discountedFee || 0}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT PROFILE MODAL ==================== */}
      {showEditModal && (
        <div className="pd-modal-overlay">
          <div className="pd-modal-content">
            <div className="pd-modal-header">
              <h3><Edit3 size={20} /> Edit Pharmacist Profile</h3>
              <button className="pd-modal-close" onClick={() => setShowEditModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="pd-modal-body">
                {/* Profile Photo Upload inside Edit Modal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div style={{ position: 'relative', width: 54, height: 54, flexShrink: 0 }}>
                    {pharmacistProfile?.profile_img ? (
                      <img src={pharmacistProfile.profile_img} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0d9488' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0d9488', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22 }}>
                        {editForm.first_name?.[0]?.toUpperCase() || 'P'}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Profile Picture</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>JPG, PNG or WEBP (Max 5MB)</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => profileFileInputRef.current?.click()}
                    className="pd-btn-secondary"
                    style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Plus size={14} /> Upload / Change Photo
                  </button>
                </div>

                <div className="pd-form-row">
                  <div className="pd-form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.first_name}
                      onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                    />
                  </div>
                  <div className="pd-form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.last_name}
                      onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pd-form-row">
                  <div className="pd-form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      required
                      value={editForm.phone}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="pd-form-group">
                    <label>Pharmacy Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.pharmacy_name}
                      onChange={e => setEditForm({ ...editForm, pharmacy_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pd-form-row">
                  <div className="pd-form-group">
                    <label>Qualification</label>
                    <input
                      type="text"
                      required
                      value={editForm.qualification}
                      onChange={e => setEditForm({ ...editForm, qualification: e.target.value })}
                    />
                  </div>
                  <div className="pd-form-group">
                    <label>Working Days (comma separated)</label>
                    <input
                      type="text"
                      placeholder="Monday, Tuesday, Wednesday..."
                      value={editForm.working_days}
                      onChange={e => setEditForm({ ...editForm, working_days: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pd-form-row">
                  <div className="pd-form-group">
                    <label>Work Time Start</label>
                    <input
                      type="text"
                      placeholder="09:00 AM"
                      value={editForm.work_time_start}
                      onChange={e => setEditForm({ ...editForm, work_time_start: e.target.value })}
                    />
                  </div>
                  <div className="pd-form-group">
                    <label>Work Time End</label>
                    <input
                      type="text"
                      placeholder="05:00 PM"
                      value={editForm.work_time_end}
                      onChange={e => setEditForm({ ...editForm, work_time_end: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pd-form-group">
                  <label>Pharmacy Address</label>
                  <textarea
                    rows={2}
                    value={editForm.address}
                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="pd-modal-footer">
                <button type="button" className="pd-btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="pd-btn-primary" disabled={updatingProfile}>
                  {updatingProfile ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CHANGE PASSWORD MODAL ==================== */}
      {showPwdModal && (
        <div className="pd-modal-overlay">
          <div className="pd-modal-content" style={{ maxWidth: 440 }}>
            <div className="pd-modal-header">
              <h3><Lock size={20} /> Change Password</h3>
              <button className="pd-modal-close" onClick={() => setShowPwdModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="pd-modal-body">
                <div className="pd-form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter current password"
                    value={pwdForm.currentPassword}
                    onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                  />
                </div>

                <div className="pd-form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password (min 6 chars)"
                    value={pwdForm.newPassword}
                    onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  />
                </div>

                <div className="pd-form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={pwdForm.confirmPassword}
                    onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <div className="pd-modal-footer">
                <button type="button" className="pd-btn-secondary" onClick={() => setShowPwdModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="pd-btn-primary" disabled={changingPwd}>
                  {changingPwd ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CREATE MEDICINE REQUEST MODAL ==================== */}
      {showReqModal && (
        <div className="pd-modal-overlay">
          <div className="pd-modal-content" style={{ maxWidth: 640 }}>
            <div className="pd-modal-header">
              <h3><Plus size={20} /> Request New Medicine Stock</h3>
              <button className="pd-modal-close" onClick={() => setShowReqModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateMedicineRequest}>
              <div className="pd-modal-body">
                <div className="pd-form-row">
                  <div className="pd-form-group">
                    <label>Medicine Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amoxicillin 500mg"
                      value={reqForm.medicine_name}
                      onChange={e => setReqForm({ ...reqForm, medicine_name: e.target.value })}
                    />
                  </div>
                  <div className="pd-form-group">
                    <label>Generic Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Amoxicillin"
                      value={reqForm.generic_name}
                      onChange={e => setReqForm({ ...reqForm, generic_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pd-form-row">
                  <div className="pd-form-group">
                    <label>Category *</label>
                    <select
                      value={reqForm.category}
                      onChange={e => setReqForm({ ...reqForm, category: e.target.value })}
                    >
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Ointment">Ointment</option>
                      <option value="Drops">Drops</option>
                      <option value="Equipment">Equipment</option>
                    </select>
                  </div>
                  <div className="pd-form-group">
                    <label>Manufacturer *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sun Pharma"
                      value={reqForm.manufacturer}
                      onChange={e => setReqForm({ ...reqForm, manufacturer: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pd-form-row">
                  <div className="pd-form-group">
                    <label>Strength *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 500mg"
                      value={reqForm.strength}
                      onChange={e => setReqForm({ ...reqForm, strength: e.target.value })}
                    />
                  </div>
                  <div className="pd-form-group">
                    <label>Unit *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Strip / Bottle"
                      value={reqForm.unit}
                      onChange={e => setReqForm({ ...reqForm, unit: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pd-form-row">
                  <div className="pd-form-group">
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      placeholder="e.g. 150"
                      value={reqForm.price}
                      onChange={e => setReqForm({ ...reqForm, price: e.target.value })}
                    />
                  </div>
                  <div className="pd-form-group">
                    <label>Quantity Available *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 100"
                      value={reqForm.stock_available}
                      onChange={e => setReqForm({ ...reqForm, stock_available: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pd-form-row">
                  <div className="pd-form-group">
                    <label>MFG Date *</label>
                    <input
                      type="date"
                      required
                      value={reqForm.mfg_date}
                      onChange={e => setReqForm({ ...reqForm, mfg_date: e.target.value })}
                    />
                  </div>
                  <div className="pd-form-group">
                    <label>Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={reqForm.expiry_date}
                      onChange={e => setReqForm({ ...reqForm, expiry_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pd-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="reqRx"
                    checked={reqForm.requires_prescription}
                    onChange={e => setReqForm({ ...reqForm, requires_prescription: e.target.checked })}
                    style={{ width: 18, height: 18 }}
                  />
                  <label htmlFor="reqRx" style={{ margin: 0, fontWeight: 600, cursor: 'pointer' }}>
                    Requires Prescription (Rx)
                  </label>
                </div>
              </div>

              <div className="pd-modal-footer">
                <button type="button" className="pd-btn-secondary" onClick={() => setShowReqModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="pd-btn-primary" disabled={submittingReq}>
                  {submittingReq ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default PharmacistDashboard;
