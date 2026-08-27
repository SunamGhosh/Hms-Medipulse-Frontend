import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, CalendarCheck, User, LogOut, ArrowRight, Clock, ShieldCheck, ArrowUpRight, CheckCircle2, XCircle,
  AlertCircle, Loader2, Users, Check, Pill, Edit3, Lock, Plus, Search, Package,
  ShoppingCart, X, Building2, Phone, Award, FileCheck, MapPin, Calendar,
  AlertTriangle, Eye, EyeOff, RefreshCw, FileText, Stethoscope, Tag, Percent, ChevronLeft, ChevronRight, Download, CreditCard, Banknote, Video
} from 'lucide-react';
import toast from 'react-hot-toast';
import './PharmacistDashboard.css';
import DoctorLocationMapModal from '../components/DoctorLocationMapModal';

const API = import.meta.env.VITE_URL || 'http://localhost:5000';
const getToken = () => sessionStorage.getItem('pharmacistToken') || localStorage.getItem('pharmacistToken');

const STATUS_CONFIG = {
  pending:   { color: 'blue',   label: 'Pending',   dot: '#3b82f6' },
  confirmed: { color: 'teal',   label: 'Confirmed', dot: '#0d9488' },
  completed: { color: 'green',  label: 'Completed', dot: '#10b981' },
  cancelled: { color: 'rose',   label: 'Cancelled', dot: '#f43f5e' },
  rejected:  { color: 'orange', label: 'Rejected',  dot: '#f97316' },
  expired:   { color: 'amber',  label: 'Expired',   dot: '#d97706' },
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth <= 1024);
  
  // Profile state
  const profileFileInputRef = useRef(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [pharmacistProfile, setPharmacistProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [showProfilePicModal, setShowProfilePicModal] = useState(false);
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
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Appointments state (Only pharmacist's own booked doctor appointments)
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [apptFilter, setApptFilter] = useState('all');
  const [apptTimeFilter, setApptTimeFilter] = useState('all'); // 'all', 'today', 'upcoming', 'past'
  const [apptSearch, setApptSearch] = useState('');

  // Booked Slots state for dynamic slot availability
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Prescription View state for completed consultations
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [allPrescriptions, setAllPrescriptions] = useState([]);

  // Cancellation Modal state (Appointments)
  const [showCancelApptModal, setShowCancelApptModal] = useState(false);
  const [apptToCancel, setApptToCancel] = useState(null);
  const [apptCancelCategory, setApptCancelCategory] = useState('Schedule Conflict');
  const [apptCancelReasonText, setApptCancelReasonText] = useState('');
  const [cancellingAppt, setCancellingAppt] = useState(false);

  // Fee Payment Modal state for Pharmacist
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAppt, setPaymentAppt] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  /* ── Doctor Clinic Location Map Modal State ── */
  const [showDoctorMapModal, setShowDoctorMapModal] = useState(false);
  const [selectedApptForMap, setSelectedApptForMap] = useState(null);

  const openDoctorMapModal = (appt) => {
    setSelectedApptForMap(appt);
    setShowDoctorMapModal(true);
  };

  // Cancellation Modal state (Stock Requests)
  const [showCancelReqModal, setShowCancelReqModal] = useState(false);
  const [reqToCancel, setReqToCancel] = useState(null);
  const [reqCancelCategory, setReqCancelCategory] = useState('Stock No Longer Required');
  const [reqCancelReasonText, setReqCancelReasonText] = useState('');
  const [cancellingReq, setCancellingReq] = useState(false);

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

  // Dynamically fetch booked slots when selected doctor or date changes
  useEffect(() => {
    if (bookForm.doctor_id && bookForm.appointment_date) {
      setLoadingSlots(true);
      fetch(`${API}/appointment/slots/${bookForm.doctor_id}/${bookForm.appointment_date}`)
        .then(res => res.json())
        .then(data => {
          setBookedSlots(data.bookedTimes || []);
        })
        .catch(err => console.error("Error fetching booked slots:", err))
        .finally(() => setLoadingSlots(false));
    } else {
      setBookedSlots([]);
    }
  }, [bookForm.doctor_id, bookForm.appointment_date]);

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
  const [reqFilter, setReqFilter] = useState('all'); // 'all', 'Pending', 'Approved', 'Rejected', 'Cancelled'
  const [reqSearch, setReqSearch] = useState('');
  const [showReqDetailsModal, setShowReqDetailsModal] = useState(false);
  const [selectedReqDetails, setSelectedReqDetails] = useState(null);
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
    const stored = sessionStorage.getItem('pharmacistName') || localStorage.getItem('pharmacistName') || 'Pharmacist';
    setPharmacistName(stored.charAt(0).toUpperCase() + stored.slice(1));
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, [navigate]);

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
          sessionStorage.setItem('pharmacistName', name);
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
      const apiBase = API || import.meta.env.VITE_URL || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/doctor/active`);
      const data = await res.json();
      if (res.ok) {
        setDoctorsList(data.doctors || data.data || (Array.isArray(data) ? data : []));
      } else {
        console.error("Failed to fetch active doctors:", data?.message);
      }
    } catch (err) {
      console.error("Error fetching active doctors:", err);
    } finally {
      setDoctorsLoading(false);
    }
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
  const fetchMedicineRequests = useCallback(async (isPolling = false) => {
    const token = getToken();
    if (!token) return;
    if (!isPolling) setReqLoading(true);
    try {
      const res = await fetch(`${API}/med-req/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMedRequests(data.data || []);
      }
    } catch { /* silent */ }
    finally { if (!isPolling) setReqLoading(false); }
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

  // Fetch All Prescriptions (for real-time completed consultation matching)
  const fetchAllPrescriptions = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/prescription`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAllPrescriptions(data.prescriptions || []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchAppointments();
    fetchMedicines();
    fetchMedicineRequests();
    fetchSales();
    fetchActiveDoctors();
    fetchAllPrescriptions();

    // Live polling every 3 seconds for real-time status updates (Appointments & Stock Requests)
    const intervalId = setInterval(() => {
      fetchAppointments(true);
      fetchMedicineRequests(true);
    }, 3000);

    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
    };
  }, [fetchProfile, fetchAppointments, fetchMedicines, fetchMedicineRequests, fetchSales, fetchActiveDoctors]);

  // Refetch active doctors whenever consultation booking modal opens
  useEffect(() => {
    if (showBookModal) {
      fetchActiveDoctors();
    }
  }, [showBookModal, fetchActiveDoctors]);

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
        setApptFilter('all');
        setApptTimeFilter('all');
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

  // Open Appointment Cancellation Modal
  const openCancelApptModal = (appt) => {
    setApptToCancel(appt);
    setApptCancelCategory('Schedule Conflict');
    setApptCancelReasonText('');
    setShowCancelApptModal(true);
  };

  // Submit Appointment Cancellation Form
  const submitCancelAppointment = async (e) => {
    e.preventDefault();
    if (!apptToCancel) return;
    setCancellingAppt(true);
    const finalReason = apptCancelReasonText.trim()
      ? `${apptCancelCategory}: ${apptCancelReasonText.trim()}`
      : apptCancelCategory;
    try {
      const res = await fetch(`${API}/appointment/pharmacist/${apptToCancel._id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ cancel_reason: finalReason })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Appointment cancelled successfully.');
        setShowCancelApptModal(false);
        setApptToCancel(null);
        fetchAppointments();
      } else {
        toast.error(data.message || 'Cancellation failed');
      }
    } catch {
      toast.error('Server error cancelling appointment');
    } finally {
      setCancellingAppt(false);
    }
  };

  // View Doctor Prescription for Completed Consultations
  const handleViewPrescription = async (target) => {
    if (!target) return;
    const apptId = typeof target === 'object' ? (target?.appointment_id?._id || target?.appointment_id || target?._id) : target;

    setShowPrescriptionModal(true);
    setPrescriptionLoading(true);
    setSelectedPrescription(null);

    try {
      // 1. Check local allPrescriptions cache
      const localMatch = allPrescriptions.find(p => (p.appointment_id?._id || p.appointment_id) === apptId || p._id === apptId);

      // 2. Fetch from backend endpoint
      const res = await fetch(`${API}/prescription/appointment/${apptId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      let pObj = null;
      if (res.ok && data.prescription) {
        pObj = data.prescription;
      } else if (localMatch) {
        pObj = localMatch;
      } else if (typeof target === 'object') {
        pObj = target;
      }

      if (pObj) {
        const fUp = pObj.follow_up_date 
          || (typeof target === 'object' && target?.follow_up_date)
          || pObj.medical_record_id?.follow_up_date
          || pObj.appointment_id?.follow_up_date;
        if (fUp) {
          pObj.follow_up_date = fUp;
        }
        setSelectedPrescription(pObj);
      } else {
        toast.info(data.message || 'Prescription record has not been created for this consultation yet.');
        setShowPrescriptionModal(false);
      }
    } catch {
      toast.error('Failed to load prescription record.');
      setShowPrescriptionModal(false);
    } finally {
      setPrescriptionLoading(false);
    }
  };

  const handleDownloadRecord = (rec) => {
    if (!rec) return;
    const docObj = rec.doctor_id || {};
    const patObj = rec.patient_id || {};

    const pName = patObj.first_name
      ? `${patObj.first_name} ${patObj.last_name || ''}`.trim()
      : (rec.patient_name || 'Patient');

    const docName = docObj.first_name
      ? `Dr. ${docObj.first_name} ${docObj.last_name || ''}`.trim()
      : 'Dr. Specialist Doctor';

    const docSpec = docObj.specialization || docObj.department || 'Specialist Doctor';
    const docEmail = docObj.email || '';
    const docPhone = docObj.phone || '+91 98765 12345';
    const docAddress = docObj.visit_address || 'Medipulse OPD Block, Sector 4';
    const recDate = formatDate(rec.prescribed_date || rec.appointment_date || rec.createdAt);
    const disease = rec.disease || rec.diagnosis || rec.appointment_id?.disease || 'General Consultation';
    const age = patObj.age || rec.age || '28';
    const gender = patObj.gender || rec.gender || 'Male';
    const phone = patObj.phone || rec.phone || rec.booked_by?.phone || '+91 98765 43210';
    const followUpDateStr = rec.follow_up_date ? formatDate(rec.follow_up_date) : null;
    const docSig = docObj.signature;

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

    // Direct text download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Medical_Record_${pName.replace(/\s+/g, '_')}_${recDate.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Open Print Window for PDF export
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
          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `);
      printWin.document.close();
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
    sessionStorage.removeItem('pharmacistToken');
    sessionStorage.removeItem('pharmacistEmail');
    sessionStorage.removeItem('pharmacistName');
    localStorage.removeItem('pharmacistToken');
    localStorage.removeItem('pharmacistEmail');
    localStorage.removeItem('pharmacistName');
    toast.success('Logged out successfully');
    navigate('/pharmacist/login');
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  // Get effective status considering real-time expiration
  const getEffectiveStatus = useCallback((a) => {
    const st = (a?.status || 'pending').toLowerCase().trim();
    if (['cancelled', 'completed', 'rejected', 'expired'].includes(st)) return st;

    const isPending = st === 'pending';
    const isConfirmedUnpaid = st === 'confirmed' && (a?.payment_status || 'pending').toLowerCase() !== 'paid';

    if ((isPending || isConfirmedUnpaid) && a?.appointment_date && a?.appointment_time) {
      const d = new Date(a.appointment_date);
      const [h, m] = (a.appointment_time || '00:00').split(':').map(Number);
      d.setHours(h || 0, m || 0, 0, 0);
      if (d <= nowTime) return 'expired';
    }
    return st;
  }, [nowTime]);

  // Filtered Pharmacist Appointments — dynamic search across Doctor Name, Specialization, Dept, Disease, ID, Patient
  const filteredAppointments = appointments.filter(a => {
    // 1. Status Filter
    const apptStatus = getEffectiveStatus(a);
    const filterStatus = (apptFilter || 'all').toLowerCase().trim();
    if (filterStatus !== 'all' && apptStatus !== filterStatus) {
      return false;
    }

    // 2. Time Filter (Today, Upcoming, Past)
    if (apptTimeFilter !== 'all') {
      const isToday = isSameDay(a.appointment_date, new Date());
      const apptDateObj = new Date(a.appointment_date);
      const todayObj = new Date();
      todayObj.setHours(0, 0, 0, 0);

      if (apptTimeFilter === 'today' && !isToday) return false;
      if (apptTimeFilter === 'upcoming' && apptDateObj < todayObj && !isToday) return false;
      if (apptTimeFilter === 'past' && apptDateObj >= todayObj && !isToday) return false;
    }

    // 3. Search Query Filter
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

  // Open Pharmacist Consultation Payment Modal
  const openPaymentModal = (appt) => {
    setPaymentAppt(appt);
    setShowPaymentModal(true);
  };

  // Process Pharmacist Consultation Payment
  const handleConfirmPharmacistPayment = async () => {
    if (!paymentAppt) return;
    const token = getToken();
    if (!token) {
      toast.error('Session expired. Please log in again.');
      return;
    }
    setProcessingPayment(true);

    // Digital Online Payment via Razorpay
    try {
      const res = await fetch(`${API}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: paymentAppt.consultation_fee, appointment_id: paymentAppt._id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to initiate digital payment order');
        setProcessingPayment(false);
        return;
      }

      const docObj = (typeof paymentAppt.doctor_id === 'object' && paymentAppt.doctor_id) 
        ? paymentAppt.doctor_id 
        : (doctorsList.find(d => d._id === paymentAppt.doctor_id) || {});
      const docName = docObj.first_name ? `Dr. ${docObj.first_name} ${docObj.last_name || ''}` : 'Doctor Consultation';

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        name: 'MediPulse Pharmacy Portal',
        description: `Pharmacist Consultation Fee (10% Off) - ${docName}`,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API}/api/payment/verify-appointment-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                appointment_id: paymentAppt._id
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              toast.success('Digital payment verified successfully! Consultation scheduled.');
              setShowPaymentModal(false);
              setPaymentAppt(null);
              fetchAppointments();
            } else {
              toast.error(verifyData.message || 'Payment verification failed');
            }
          } catch (err) {
            toast.error('Error verifying payment: ' + err.message);
          } finally {
            setProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
          }
        },
        prefill: {
          name: pharmacistName || 'Pharmacist'
        },
        theme: { color: '#0d9488' }
      };

      if (!window.Razorpay) {
        toast.error('Razorpay SDK not available. Check internet connection.');
        setProcessingPayment(false);
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error('Error initiating digital payment');
      setProcessingPayment(false);
    }
  };

  // Open Stock Request Cancellation Modal
  const openCancelReqModal = (req) => {
    setReqToCancel(req);
    setReqCancelCategory('Stock No Longer Required');
    setReqCancelReasonText('');
    setShowCancelReqModal(true);
  };

  // Submit Stock Request Cancellation Form
  const submitCancelStockRequest = async (e) => {
    e.preventDefault();
    if (!reqToCancel) return;
    setCancellingReq(true);
    const finalReason = reqCancelReasonText.trim()
      ? `${reqCancelCategory}: ${reqCancelReasonText.trim()}`
      : reqCancelCategory;
    try {
      const res = await fetch(`${API}/med-req/cancel/${reqToCancel._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ cancellation_reason: finalReason })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Stock request cancelled successfully.');
        setShowCancelReqModal(false);
        setShowReqDetailsModal(false);
        setReqToCancel(null);
        fetchMedicineRequests();
      } else {
        toast.error(data.message || 'Failed to cancel stock request');
      }
    } catch {
      toast.error('Server error cancelling stock request');
    } finally {
      setCancellingReq(false);
    }
  };

  // Filtered Medicine Requests — dynamic search & status filter
  const filteredMedRequests = medRequests.filter(r => {
    const rStatus = (r.status || 'Pending').toLowerCase();
    const filterStatus = (reqFilter || 'all').toLowerCase();
    if (filterStatus !== 'all' && rStatus !== filterStatus) return false;

    if (!reqSearch || !reqSearch.trim()) return true;
    const q = reqSearch.toLowerCase().trim();
    return (
      (r.medicine_name || '').toLowerCase().includes(q) ||
      (r.generic_name || '').toLowerCase().includes(q) ||
      (r.category || '').toLowerCase().includes(q) ||
      (r.manufacturer || '').toLowerCase().includes(q) ||
      (r.strength || '').toLowerCase().includes(q) ||
      (r._id || '').toLowerCase().includes(q)
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
      <aside className={`pd-sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
        <div className="pd-sidebar-brand" style={{ justifyContent: sidebarCollapsed ? 'center' : 'space-between', padding: sidebarCollapsed ? '20px 10px' : '24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div className="pd-sidebar-logo">
              <Pill size={20} strokeWidth={2.5} color="#fff" />
            </div>
            {!sidebarCollapsed && <span style={{ whiteSpace: 'nowrap' }}>Pharmacy Portal</span>}
          </div>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
              transition: 'all 0.2s ease-in-out',
              flexShrink: 0
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#0d9488'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = '#0d9488'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="pd-nav">
          <button className={`pd-nav-item${view === VIEWS.DASHBOARD ? ' active' : ''}`}
            onClick={() => setView(VIEWS.DASHBOARD)}
            title={sidebarCollapsed ? "Dashboard" : ""}>
            <Activity size={18} />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          <button className={`pd-nav-item${view === VIEWS.APPOINTMENTS ? ' active' : ''}`}
            onClick={() => setView(VIEWS.APPOINTMENTS)}
            title={sidebarCollapsed ? "Doctor Consultations" : ""}>
            <CalendarCheck size={18} />
            {!sidebarCollapsed && <span>Doctor Consultations</span>}
          </button>

          <button className={`pd-nav-item${view === VIEWS.INVENTORY ? ' active' : ''}`}
            onClick={() => setView(VIEWS.INVENTORY)}
            title={sidebarCollapsed ? "Medicine Inventory" : ""}>
            <Package size={18} />
            {!sidebarCollapsed && <span>Medicine Inventory</span>}
          </button>

          <button className={`pd-nav-item${view === VIEWS.REQUESTS ? ' active' : ''}`}
            onClick={() => setView(VIEWS.REQUESTS)}
            title={sidebarCollapsed ? "Stock Requests" : ""}>
            <FileText size={18} />
            {!sidebarCollapsed && <span>Stock Requests</span>}
          </button>

          <button className={`pd-nav-item${view === VIEWS.SALES ? ' active' : ''}`}
            onClick={() => setView(VIEWS.SALES)}
            title={sidebarCollapsed ? "Sales History" : ""}>
            <ShoppingCart size={18} />
            {!sidebarCollapsed && <span>Sales History</span>}
          </button>

          <div className="pd-nav-divider" />

          <button className={`pd-nav-item${view === VIEWS.PROFILE ? ' active' : ''}`}
            onClick={() => setView(VIEWS.PROFILE)}
            title={sidebarCollapsed ? "My Profile" : ""}>
            <User size={18} />
            {!sidebarCollapsed && <span>My Profile</span>}
          </button>
        </nav>

        <button
          className="pd-logout-btn"
          onClick={handleLogout}
          title={sidebarCollapsed ? "Sign Out" : ""}
          style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start', padding: sidebarCollapsed ? '16px 0' : '16px 24px' }}
        >
          <LogOut size={17} />
          {!sidebarCollapsed && <span>Sign Out</span>}
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className={`pd-main${sidebarCollapsed ? ' collapsed' : ''}`}>
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

                {(apptSearch || apptFilter !== 'all' || apptTimeFilter !== 'all') && (
                  <button
                    onClick={() => { setApptSearch(''); setApptFilter('all'); setApptTimeFilter('all'); }}
                    style={{ padding: '8px 14px', borderRadius: 8, background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <X size={13} /> Reset Filters
                  </button>
                )}
              </div>

              {/* Status Filter Pills & Date Filter Pills Tabs */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginRight: 4 }}>Status:</span>
                  {[
                    { key: 'all', label: 'All', count: appointments.length, color: '#0d9488' },
                    { key: 'pending', label: 'Pending', count: appointments.filter(a => getEffectiveStatus(a) === 'pending').length, color: '#3b82f6' },
                    { key: 'confirmed', label: 'Confirmed', count: appointments.filter(a => getEffectiveStatus(a) === 'confirmed').length, color: '#0d9488' },
                    { key: 'completed', label: 'Completed', count: appointments.filter(a => getEffectiveStatus(a) === 'completed').length, color: '#10b981' },
                    { key: 'expired', label: 'Expired', count: appointments.filter(a => getEffectiveStatus(a) === 'expired').length, color: '#d97706' },
                    { key: 'cancelled', label: 'Cancelled', count: appointments.filter(a => getEffectiveStatus(a) === 'cancelled').length, color: '#f43f5e' },
                    { key: 'rejected', label: 'Rejected', count: appointments.filter(a => getEffectiveStatus(a) === 'rejected').length, color: '#f97316' }
                  ].map(tab => {
                    const isActive = apptFilter.toLowerCase() === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setApptFilter(tab.key)}
                        style={{
                          padding: '5px 12px',
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

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginRight: 4 }}>Date:</span>
                  {[
                    { key: 'all', label: 'All Dates' },
                    { key: 'today', label: 'Today' },
                    { key: 'upcoming', label: 'Upcoming' },
                    { key: 'past', label: 'Past / History' }
                  ].map(tab => {
                    const isActive = apptTimeFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setApptTimeFilter(tab.key)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          border: `1.5px solid ${isActive ? '#0f766e' : '#cbd5e1'}`,
                          background: isActive ? '#0f766e' : '#ffffff',
                          color: isActive ? '#ffffff' : '#475569',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
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
                    const statusKey = getEffectiveStatus(appt);
                    const paymentKey = (appt.payment_status || 'pending').toLowerCase();
                    const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
                    const needsPayment = statusKey === 'confirmed' && paymentKey !== 'paid';
                    const canCancel = ['pending', 'confirmed'].includes(statusKey) && paymentKey !== 'paid' && statusKey !== 'expired';
                    const docObj = (typeof appt.doctor_id === 'object' && appt.doctor_id) 
                      ? appt.doctor_id 
                      : (doctorsList.find(d => d._id === appt.doctor_id) || {});
                    const docName = docObj.first_name ? `Dr. ${docObj.first_name} ${docObj.last_name || ''}` : 'Doctor Consultation';
                    const docSpec = docObj.specialization || appt.specialization || 'General Specialist';

                    let statusBadgeLabel = cfg.label;
                    if (statusKey === 'pending') statusBadgeLabel = 'Pending Approval';
                    if (statusKey === 'confirmed' && needsPayment) statusBadgeLabel = 'Confirmed (Pay Fee)';
                    if (statusKey === 'completed') statusBadgeLabel = 'Completed ✓';
                    if (statusKey === 'expired') statusBadgeLabel = 'Expired (Time Passed)';

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
                          {/* Payment status pill in metadata */}
                            <span style={{ color: appt.payment_status === 'refunded' || appt.refund_status === 'refunded' ? '#0d9488' : appt.payment_status === 'paid' ? '#059669' : '#f97316', fontWeight: 600 }}>
                              Payment: {appt.refund_status === 'refunded' || appt.payment_status === 'refunded' ? '✓ Refunded (100%)' : appt.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
                            </span>
                          </div>

                          {/* Refund Status Banner */}
                          {appt.refund_status === 'refunded' ? (
                            <div style={{ marginTop: '0.6rem', padding: '0.6rem 1rem', background: '#f0fdfa', borderRadius: 8, border: '1.5px solid #99f6e4', fontSize: 13, color: '#0f766e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <CheckCircle2 size={16} color="#0d9488" />
                              100% Refund Done (₹{appt.refund_amount || appt.consultation_fee}) — Refunded to your account by Doctor
                            </div>
                          ) : paymentKey === 'paid' && appt.refund_status === 'pending' ? (
                            <div style={{ marginTop: '0.6rem', padding: '0.6rem 1rem', background: '#fff7ed', borderRadius: 8, border: '1.5px solid #fed7aa', fontSize: 13, color: '#c2410c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Clock size={16} color="#d97706" />
                              Eligible for 100% Refund (₹{appt.consultation_fee}). Doctor will process refund to your account.
                            </div>
                          ) : statusKey === 'expired' && appt.refund_status === 'not_applicable' ? (
                            <div style={{ marginTop: '0.6rem', padding: '0.6rem 1rem', background: '#fef2f2', borderRadius: 8, border: '1.5px solid #fecaca', fontSize: 13, color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <XCircle size={16} color="#dc2626" />
                              Expired (No Refund - Patient No-Show / Missed Appointment)
                            </div>
                          ) : null}

                          {/* Payment CTA when doctor has confirmed */}
                          {needsPayment && (
                            <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: '#d1fae5', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <AlertCircle size={16} color="#059669" />
                              <span style={{ fontSize: 13, color: '#047857', fontWeight: 600 }}>
                                Doctor approved! Complete your payment to finalise the appointment.
                              </span>
                              <button
                                onClick={() => openPaymentModal(appt)}
                                style={{ padding: '6px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                              >
                                Pay ₹{appt.consultation_fee}
                              </button>
                            </div>
                          )}

                          {/* Expired status alert */}
                          {statusKey === 'expired' && (
                            <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.8rem', background: '#fff7ed', borderRadius: 8, border: '1px solid #fed7aa', fontSize: 12, color: '#c2410c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Clock size={14} color="#d97706" />
                              {(appt.awaiting_pharmacist_payment || appt.status === 'confirmed')
                                ? 'Scheduled appointment time passed with doctor confirmation. Status marked as Expired.'
                                : 'Scheduled appointment time passed without doctor confirmation. Status marked as Expired.'}
                            </div>
                          )}

                          {/* Video Call CTA when confirmed, paid, online, and doctor has not ended meeting */}
                          {statusKey === 'confirmed' && paymentKey === 'paid' && appt.consult_mode === 'online' && !appt.meet_time_end && (
                            <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <Stethoscope size={16} color="#2563eb" />
                              <span style={{ fontSize: 13, color: '#1e40af', fontWeight: 600 }}>
                                {appt.meet_time_start ? 'Video Consultation is Live! Click below to rejoin the call.' : 'Online Consultation Scheduled! Click below to enter the video call room.'}
                              </span>
                              <button
                                onClick={() => handleJoinVideoCall(appt._id)}
                                style={{ padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                              >
                                <Video size={14} /> {appt.meet_time_start ? 'Rejoin Video Call Room' : 'Join Video Call Room'}
                              </button>
                            </div>
                          )}

                          {/* Clinic Map CTA when confirmed/completed, paid, and offline */}
                          {(statusKey === 'confirmed' || statusKey === 'completed') && paymentKey === 'paid' && (appt.consult_mode === 'offline' || appt.consult_mode !== 'online') && (
                            <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: '#f0fdfa', borderRadius: 8, border: '1px solid #99f6e4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={16} color="#0d9488" />
                                <span style={{ fontSize: 13, color: '#0f766e', fontWeight: 600 }}>
                                  Offline Clinic Visit Scheduled! View doctor's clinic location on map.
                                </span>
                              </div>
                              <button
                                onClick={() => openDoctorMapModal(appt)}
                                style={{ padding: '6px 14px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 8px rgba(13,148,136,0.25)' }}
                              >
                                <MapPin size={14} /> View Clinic Map
                              </button>
                            </div>
                          )}

                          {/* Completed Consultation Prescription CTA */}
                          {statusKey === 'completed' && (() => {
                            const apptId = appt._id;
                            const isPrescriptionCreated = Boolean(
                              appt.prescription_added ||
                              allPrescriptions.some(p => (p.appointment_id?._id || p.appointment_id) === apptId || p._id === apptId)
                            );

                            return (
                              <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: isPrescriptionCreated ? '#f0fdf4' : '#f8fafc', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <FileText size={16} color={isPrescriptionCreated ? "#0d9488" : "#94a3b8"} />
                                <span style={{ fontSize: 13, color: isPrescriptionCreated ? '#0f766e' : '#64748b', fontWeight: 600 }}>
                                  {isPrescriptionCreated
                                    ? "Consultation completed. View doctor's diagnosis, notes & prescribed medicines."
                                    : "Consultation completed. Doctor has not created prescription yet."}
                                </span>
                                {isPrescriptionCreated ? (
                                  <button
                                    onClick={() => handleViewPrescription(appt)}
                                    style={{ padding: '6px 14px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                                  >
                                    <FileText size={14} /> View Doctor Prescription
                                  </button>
                                ) : (
                                  <button
                                    disabled={true}
                                    style={{ padding: '6px 14px', background: '#e2e8f0', color: '#94a3b8', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: 5 }}
                                    title="Doctor has not added prescription yet"
                                  >
                                    <FileText size={14} /> Prescription Pending
                                  </button>
                                )}
                              </div>
                            );
                          })()}

                          {/* Meeting Time Info — shown for completed appointments */}
                          {statusKey === 'completed' && (appt.meet_time_start || appt.meet_time_end) && (
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px',
                              fontSize: '12px', color: '#475569', background: '#f0fdfa',
                              padding: '5px 12px', borderRadius: '20px', border: '1px solid #99f6e4'
                            }}>
                              <Clock size={12} style={{ color: '#0d9488', flexShrink: 0 }} />
                              <span style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                                {appt.meet_time_start && (
                                  <span>Started: <strong style={{ color: '#0f172a' }}>{new Date(appt.meet_time_start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</strong></span>
                                )}
                                {appt.meet_time_start && appt.meet_time_end && <span style={{ color: '#cbd5e1' }}> · </span>}
                                {appt.meet_time_end && (
                                  <span>Ended: <strong style={{ color: '#0f172a' }}>{new Date(appt.meet_time_end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</strong></span>
                                )}
                                {appt.meet_time != null && (
                                  <span style={{ color: '#0d9488', fontWeight: 700 }}> · {appt.meet_time} min</span>
                                )}
                              </span>
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
                              onClick={() => openCancelApptModal(appt)}
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
            <div className="pd-section-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 className="pd-section-title">Medicine Stock Requests</h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                  Track, submit & manage medicine stock requests dynamically with Admin approval status
                </p>
              </div>

              <button onClick={() => setShowReqModal(true)} className="pd-btn-primary">
                <Plus size={16} /> Request New Stock
              </button>
            </div>



            {/* Search Bar & Status Filter Pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search stock request by medicine name, generic name, category, or manufacturer..."
                    value={reqSearch}
                    onChange={e => setReqSearch(e.target.value)}
                    style={{ width: '100%', padding: '9px 32px 9px 36px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                  />
                  {reqSearch && (
                    <button
                      onClick={() => setReqSearch('')}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2, display: 'flex' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {(reqSearch || reqFilter !== 'all') && (
                  <button
                    onClick={() => { setReqSearch(''); setReqFilter('all'); }}
                    style={{ padding: '8px 14px', borderRadius: 8, background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <X size={13} /> Reset Filters
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { key: 'all', label: 'All Requests', count: medRequests.length, color: '#0d9488' },
                  { key: 'Pending', label: 'Pending Request', count: medRequests.filter(r => (r.status || 'Pending') === 'Pending').length, color: '#3b82f6' },
                  { key: 'Approved', label: 'Approved', count: medRequests.filter(r => r.status === 'Approved').length, color: '#10b981' },
                  { key: 'Rejected', label: 'Rejected', count: medRequests.filter(r => r.status === 'Rejected').length, color: '#f43f5e' },
                  { key: 'Cancelled', label: 'Cancelled', count: medRequests.filter(r => r.status === 'Cancelled').length, color: '#64748b' }
                ].map(tab => {
                  const isActive = reqFilter.toLowerCase() === tab.key.toLowerCase();
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setReqFilter(tab.key)}
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
              {reqLoading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                  <p>Loading stock requests…</p>
                </div>
              ) : filteredMedRequests.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <FileText size={60} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>
                    {reqSearch || reqFilter !== 'all' ? 'No matching stock requests found' : 'No stock requests submitted yet'}
                  </h3>
                  <p style={{ fontSize: 14, color: '#64748b', marginBottom: '1rem' }}>
                    {reqSearch || reqFilter !== 'all'
                      ? 'Try clearing your search query or switching status tabs.'
                      : 'Submit stock approval requests to Admin when new medicines are needed.'}
                  </p>
                  {reqSearch || reqFilter !== 'all' ? (
                    <button onClick={() => { setReqSearch(''); setReqFilter('all'); }} className="pd-btn-secondary" style={{ fontSize: 13 }}>
                      Clear Search & Filters
                    </button>
                  ) : (
                    <button onClick={() => setShowReqModal(true)} className="pd-btn-primary">
                      <Plus size={16} /> Submit Your First Request
                    </button>
                  )}
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
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMedRequests.map((req) => {
                        const statusKey = (req.status || 'Pending').toLowerCase();
                        const isPending = statusKey === 'pending';
                        return (
                          <tr key={req._id}>
                            <td>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{req.medicine_name}</div>
                              {req.generic_name && <div style={{ fontSize: 11, color: '#64748b' }}>{req.generic_name}</div>}
                            </td>
                            <td><span className="pd-tag">{req.category}</span></td>
                            <td>{req.strength} ({req.unit})</td>
                            <td>
                              <div>Qty: <strong>{req.stock_available}</strong></div>
                              <div style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>₹{req.price}</div>
                            </td>
                            <td>
                              {req.status === 'Approved' ? (
                                <span className="pd-badge pd-badge-green"><CheckCircle2 size={12} /> Approved</span>
                              ) : req.status === 'Rejected' ? (
                                <span className="pd-badge pd-badge-rose"><X size={12} /> Rejected</span>
                              ) : req.status === 'Cancelled' ? (
                                <span className="pd-badge" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>
                                  Cancelled
                                </span>
                              ) : (
                                <span className="pd-badge pd-badge-blue"><Clock size={12} /> Pending Request</span>
                              )}
                            </td>
                            <td>{formatDate(req.createdAt)}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button
                                  onClick={() => { setSelectedReqDetails(req); setShowReqDetailsModal(true); }}
                                  style={{ padding: '4px 10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                  <Eye size={13} /> View Specs
                                </button>
                                {isPending && (
                                  <button
                                    onClick={() => openCancelReqModal(req)}
                                    style={{ padding: '4px 10px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                    title="Cancel this pending stock request"
                                  >
                                    <X size={13} /> Cancel
                                  </button>
                                )}
                              </div>
                            </td>
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

                      {/* View Profile Picture Button */}
                      {pharmacistProfile.profile_img && (
                        <button
                          type="button"
                          onClick={() => setShowProfilePicModal(true)}
                          title="View profile picture"
                          style={{
                            marginTop: '8px',
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
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.4)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(13,148,136,0.3)'; }}
                        >
                          <Eye size={14} /> View Photo
                        </button>
                      )}

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
                            `${d.first_name || ''} ${d.last_name || ''}`.toLowerCase().includes(q) ||
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
                        return `${d.first_name || ''} ${d.last_name || ''}`.toLowerCase().includes(q) ||
                          (d.specialization || '').toLowerCase().includes(q) ||
                          (d.department || '').toLowerCase().includes(q);
                      }).length === 0 && (
                        <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: 13 }}>
                          {doctorsList.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                              <p style={{ margin: 0 }}>No active doctors available at the moment.</p>
                              <button
                                type="button"
                                onClick={fetchActiveDoctors}
                                className="pd-btn-secondary"
                                style={{ fontSize: 12, padding: '4px 12px' }}
                              >
                                Retry Loading Doctors
                              </button>
                            </div>
                          ) : (
                            `No doctors found matching "${doctorSearch}"`
                          )}
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

                {/* Time slot grid — past slots greyed with ✕, booked slots marked */}
                {bookForm.appointment_date && (
                  <div className="pd-form-group" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ margin: 0 }}>Select Time Slot *</label>
                      {loadingSlots && (
                        <span style={{ fontSize: 11, color: '#0d9488', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Checking live slots...
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px', marginTop: '0.5rem' }}>
                      {SLOT_TIMES.map(t24 => {
                        const isPast = isPastTimeSlot(t24);
                        const isBooked = bookedSlots.includes(t24);
                        const isDisabled = isPast || isBooked;
                        const isSelected = bookForm.appointment_time === t24;

                        let titleText = '';
                        if (isPast) titleText = 'This time has already passed today';
                        else if (isBooked) titleText = 'This time slot is already booked for this doctor';

                        return (
                          <button
                            key={t24}
                            type="button"
                            disabled={isDisabled}
                            title={titleText}
                            onClick={() => !isDisabled && setBookForm({ ...bookForm, appointment_time: t24 })}
                            style={{
                              position: 'relative',
                              padding: '8px 4px',
                              borderRadius: '8px',
                              border: `1.5px solid ${isSelected ? '#0d9488' : isBooked ? '#fdba74' : isPast ? '#fecaca' : '#cbd5e1'}`,
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              background: isSelected ? '#0d9488' : isBooked ? '#fff7ed' : isPast ? '#fef2f2' : '#fff',
                              color: isSelected ? '#fff' : isBooked ? '#c2410c' : isPast ? '#fca5a5' : '#334155',
                              opacity: isDisabled ? 0.75 : 1,
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
                            {isBooked && !isPast && (
                              <span style={{
                                display: 'block', fontSize: '9px', fontWeight: 800, color: '#ea580c'
                              }}>
                                BOOKED
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {!bookForm.appointment_time && (
                      <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>Please select an available time slot</p>
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
                  {submittingBook ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</> : 'Submit'}
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
                  <div className="pd-form-group" style={{ gridColumn: 'span 2' }}>
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
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      placeholder="Enter current password"
                      value={pwdForm.currentPassword}
                      onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
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

                <div className="pd-form-group">
                  <label>New Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      placeholder="Enter new password (min 6 chars)"
                      value={pwdForm.newPassword}
                      onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
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

                <div className="pd-form-group">
                  <label>Confirm New Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      placeholder="Re-enter new password"
                      value={pwdForm.confirmPassword}
                      onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
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

      {/* ==================== VIEW PRESCRIPTION / CONSULTATION RECORD MODAL ==================== */}
      {showPrescriptionModal && selectedPrescription && (
        <div className="pd-modal-overlay" onClick={() => setShowPrescriptionModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="pd-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 760, width: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: '16px', boxShadow: '0 20px 45px rgba(0,0,0,0.25)', border: 'none' }}>
            
            {/* Header: Teal Gradient Card with Clinic Info & Download Button */}
            <div style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)', color: '#fff', padding: '1.5rem', borderRadius: '16px 16px 0 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px', color: '#ffffff', textTransform: 'uppercase' }}>
                    MEDIPULSE MULTISPECIALTY CLINIC & CARE CENTER
                  </h2>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#ccfbf1' }}>
                    Dr. {selectedPrescription.doctor_id?.first_name || 'Specialist'} {selectedPrescription.doctor_id?.last_name || ''}
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>
                      {` (${selectedPrescription.doctor_id?.specialization || selectedPrescription.doctor_id?.department || 'Specialist Doctor'})`}
                    </span>
                  </p>
                  <div style={{ margin: '6px 0 0', fontSize: '12px', color: '#ccfbf1', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <span><strong>Email:</strong> {selectedPrescription.doctor_id?.email || 'N/A'}</span>
                    <span><strong>Phone:</strong> {selectedPrescription.doctor_id?.phone || '+91 98765 12345'}</span>
                    <span><strong>Address:</strong> {selectedPrescription.doctor_id?.visit_address || 'Medipulse OPD Block, Sector 4'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                  <button
                    className="pd-btn-primary"
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
                    onClick={() => handleDownloadRecord(selectedPrescription)}
                  >
                    <Download size={15} /> Download Record
                  </button>

                  <button
                    onClick={() => setShowPrescriptionModal(false)}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              {prescriptionLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                  <p>Fetching prescription record details…</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Patient Details Grid Card (Light Slate/Gray Card) */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient Name</span>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                          {selectedPrescription.patient_id?.first_name
                            ? `${selectedPrescription.patient_id.first_name} ${selectedPrescription.patient_id.last_name || ''}`.trim()
                            : (selectedPrescription.patient_name || 'Patient')}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Age</span>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                          {selectedPrescription.patient_age || selectedPrescription.age || selectedPrescription.patient_id?.age || 'N/A'} Yrs
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gender</span>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '3px', textTransform: 'capitalize' }}>
                          {selectedPrescription.patient_gender || selectedPrescription.gender || selectedPrescription.patient_id?.gender || 'N/A'}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disease / Condition</span>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                          {selectedPrescription.disease || selectedPrescription.diagnosis || selectedPrescription.appointment_id?.disease || 'General Consultation'}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prescription Date</span>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                          {formatDate(selectedPrescription.prescribed_date || selectedPrescription.appointment_date || selectedPrescription.createdAt)}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</span>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                          {selectedPrescription.patient_id?.phone || selectedPrescription.phone || selectedPrescription.booked_by?.phone || '+91 98765 43210'}
                        </div>
                      </div>

                      {selectedPrescription.follow_up_date && (
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 12px', borderRadius: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Follow-up Date</span>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#1d4ed8', marginTop: '3px' }}>
                            {formatDate(selectedPrescription.follow_up_date)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prescribed Medicines Section */}
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px', borderBottom: '2px solid #0d9488', marginBottom: '12px' }}>
                      <Stethoscope size={20} /> Prescribed Medicines
                    </div>

                    {Array.isArray(selectedPrescription.medicines) && selectedPrescription.medicines.length > 0 ? (
                      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px' }}>Sl. No.</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Medicine Name</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Dosage</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Frequency</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Duration</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', width: '65px' }}>Quantity</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Instruction</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedPrescription.medicines.map((med, idx) => (
                              <tr key={idx} style={{ borderTop: '1px solid #e2e8f0', fontSize: '13px' }}>
                                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                                  {med.medicine_name || med.name || 'Prescribed Medicine'}
                                  {med.strength ? <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}> ({med.strength})</span> : ''}
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
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
                        No prescribed medicines listed in this record.
                      </div>
                    )}
                  </div>

                  {/* Doctor's Advice / Instructions */}
                  {selectedPrescription.general_instructions && (
                    <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '12px', padding: '14px 16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#d48806', textTransform: 'uppercase' }}>Doctor's Advice / Instructions:</span>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#595959', fontWeight: 600 }}>
                        {selectedPrescription.general_instructions}
                      </p>
                    </div>
                  )}

                  {/* Doctor Signature Section */}
                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Prescription Verification</span>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={14} /> Official Medical Record
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      {selectedPrescription.doctor_id?.signature ? (
                        <img
                          src={selectedPrescription.doctor_id.signature}
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
                          textDecoration: 'underline',
                          marginBottom: '4px'
                        }}>
                          Dr. {selectedPrescription.doctor_id?.first_name || 'Specialist'} {selectedPrescription.doctor_id?.last_name || ''}
                        </div>
                      )}
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>Authorized Doctor Signature</span>
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>Digitally Verified Prescription</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== STOCK REQUEST DETAILS MODAL ==================== */}
      {showReqDetailsModal && selectedReqDetails && (
        <div className="pd-modal-overlay">
          <div className="pd-modal-content" style={{ maxWidth: 560 }}>
            <div className="pd-modal-header" style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: '#fff', borderRadius: '12px 12px 0 0' }}>
              <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={20} /> Stock Request Specifications
              </h3>
              <button className="pd-modal-close" style={{ color: '#fff' }} onClick={() => setShowReqDetailsModal(false)}><X size={18} /></button>
            </div>
            
            <div className="pd-modal-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{selectedReqDetails.medicine_name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Generic: {selectedReqDetails.generic_name || 'N/A'}</div>
                </div>
                <span className={`pd-badge pd-badge-${selectedReqDetails.status === 'Approved' ? 'green' : selectedReqDetails.status === 'Rejected' ? 'rose' : selectedReqDetails.status === 'Cancelled' ? 'slate' : 'blue'}`}>
                  {selectedReqDetails.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: 13 }}>
                <div><strong>Category:</strong> {selectedReqDetails.category}</div>
                <div><strong>Manufacturer:</strong> {selectedReqDetails.manufacturer}</div>
                <div><strong>Strength:</strong> {selectedReqDetails.strength}</div>
                <div><strong>Packaging Unit:</strong> {selectedReqDetails.unit}</div>
                <div><strong>Price per Unit:</strong> ₹{selectedReqDetails.price}</div>
                <div><strong>Requested Stock:</strong> {selectedReqDetails.stock_available} units</div>
                <div><strong>Mfg Date:</strong> {formatDate(selectedReqDetails.mfg_date)}</div>
                <div><strong>Expiry Date:</strong> {formatDate(selectedReqDetails.expiry_date)}</div>
                <div><strong>Prescription Rx:</strong> {selectedReqDetails.requires_prescription ? 'Required' : 'Not Required (OTC)'}</div>
                <div><strong>Submitted On:</strong> {formatDate(selectedReqDetails.createdAt)}</div>
              </div>

              {selectedReqDetails.description && (
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
                  <strong>Description / Notes:</strong> {selectedReqDetails.description}
                </div>
              )}

              {selectedReqDetails.rejection_reason && (
                <div style={{ background: '#fff1f2', padding: '10px 14px', borderRadius: 8, border: '1px solid #fecdd3', fontSize: 13, color: '#be123c' }}>
                  <strong>Admin Rejection Reason:</strong> {selectedReqDetails.rejection_reason}
                </div>
              )}

              {selectedReqDetails.cancellation_reason && (
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, color: '#475569' }}>
                  <strong>Pharmacist Cancellation Reason:</strong> {selectedReqDetails.cancellation_reason}
                </div>
              )}
            </div>

            <div className="pd-modal-footer" style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {selectedReqDetails.status === 'Pending' && (
                <button
                  type="button"
                  onClick={() => openCancelReqModal(selectedReqDetails)}
                  style={{ padding: '6px 14px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <X size={14} /> Cancel Stock Request
                </button>
              )}
              <button type="button" className="pd-btn-secondary" onClick={() => setShowReqDetailsModal(false)} style={{ marginLeft: 'auto' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== VIEW PROFILE PICTURE MODAL ==================== */}
      {showProfilePicModal && pharmacistProfile?.profile_img && (
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
              src={pharmacistProfile.profile_img}
              alt="Profile Picture"
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                borderRadius: '16px',
                objectFit: 'contain',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                border: '3px solid rgba(255,255,255,0.15)',
              }}
            />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, margin: 0 }}>
              {pharmacistProfile.first_name} {pharmacistProfile.last_name} — Profile Picture
            </p>
          </div>
        </div>
      )}

      {/* ==================== CANCEL DOCTOR CONSULTATION MODAL ==================== */}
      {showCancelApptModal && apptToCancel && (
        <div className="pd-modal-overlay" onClick={() => setShowCancelApptModal(false)}>
          <div className="pd-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, border: '2px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)' }}>
            <div className="pd-modal-header" style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#fee2e2', padding: 8, borderRadius: 8, color: '#dc2626' }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#991b1b' }}>Cancel Doctor Consultation</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#b91c1c' }}>Are you sure you want to cancel this appointment?</p>
                </div>
              </div>
              <button onClick={() => setShowCancelApptModal(false)} className="pd-modal-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitCancelAppointment}>
              <div className="pd-modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 13, boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                    Doctor: Dr. {apptToCancel.doctor_id?.first_name} {apptToCancel.doctor_id?.last_name} ({apptToCancel.doctor_id?.specialization || 'General'})
                  </div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>
                    Date & Time: <strong>{formatDate(apptToCancel.appointment_date)} at {apptToCancel.appointment_time}</strong>
                  </div>
                  {apptToCancel.consultation_fee && (
                    <div style={{ color: '#059669', fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                      Fee: ₹{apptToCancel.consultation_fee} (10% Discount)
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    Reason Category *
                  </label>
                  <select
                    value={apptCancelCategory}
                    onChange={(e) => setApptCancelCategory(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, outline: 'none', background: '#fff' }}
                  >
                    <option value="Schedule Conflict">Schedule Conflict</option>
                    <option value="Doctor Unresponsive / Slot Busy">Doctor Unresponsive / Slot Busy</option>
                    <option value="Patient No Longer Needed">Patient No Longer Needed</option>
                    <option value="Booked By Mistake">Booked By Mistake</option>
                    <option value="Other Reason">Other Reason</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    Additional Remarks / Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide additional details for cancelling this appointment..."
                    value={apptCancelReasonText}
                    onChange={(e) => setApptCancelReasonText(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="pd-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#f8fafc' }}>
                <button type="button" className="pd-btn-secondary" onClick={() => setShowCancelApptModal(false)}>
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={cancellingAppt}
                  style={{ padding: '9px 18px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {cancellingAppt ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><X size={15} /> Confirm Cancellation</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CANCEL STOCK REQUEST MODAL ==================== */}
      {showCancelReqModal && reqToCancel && (
        <div className="pd-modal-overlay" onClick={() => setShowCancelReqModal(false)}>
          <div className="pd-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, border: '2px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)' }}>
            <div className="pd-modal-header" style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#fee2e2', padding: 8, borderRadius: 8, color: '#dc2626' }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#991b1b' }}>Cancel Medicine Stock Request</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#b91c1c' }}>Cancel pending stock request for "{reqToCancel.medicine_name}"</p>
                </div>
              </div>
              <button onClick={() => setShowCancelReqModal(false)} className="pd-modal-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitCancelStockRequest}>
              <div className="pd-modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 13, boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                    {reqToCancel.medicine_name} {reqToCancel.generic_name ? `(${reqToCancel.generic_name})` : ''}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>
                    Category: <strong>{reqToCancel.category}</strong> | Quantity: <strong>{reqToCancel.stock_available} {reqToCancel.unit}</strong> | Price: <strong>₹{reqToCancel.price}</strong>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    Cancellation Reason Category *
                  </label>
                  <select
                    value={reqCancelCategory}
                    onChange={(e) => setReqCancelCategory(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, outline: 'none', background: '#fff' }}
                  >
                    <option value="Stock No Longer Required">Stock No Longer Required</option>
                    <option value="Sourced From Alternative Supplier">Sourced From Alternative Supplier</option>
                    <option value="Incorrect Item or Quantity Entered">Incorrect Item or Quantity Entered</option>
                    <option value="Budget / Price Revision Needed">Budget / Price Revision Needed</option>
                    <option value="Other Reason">Other Reason</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    Additional Remarks / Reason Details (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide reasons for cancelling this stock request..."
                    value={reqCancelReasonText}
                    onChange={(e) => setReqCancelReasonText(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="pd-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#f8fafc' }}>
                <button type="button" className="pd-btn-secondary" onClick={() => setShowCancelReqModal(false)}>
                  Keep Request
                </button>
                <button
                  type="submit"
                  disabled={cancellingReq}
                  style={{ padding: '9px 18px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {cancellingReq ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><X size={15} /> Confirm Cancellation</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════ PHARMACIST CONSULTATION FEE PAYMENT MODAL ════════════ */}
      {showPaymentModal && paymentAppt && (() => {
        const docObj = (typeof paymentAppt.doctor_id === 'object' && paymentAppt.doctor_id) 
          ? paymentAppt.doctor_id 
          : (doctorsList.find(d => d._id === paymentAppt.doctor_id) || {});
        const docName = docObj.first_name ? `Dr. ${docObj.first_name} ${docObj.last_name || ''}` : 'Doctor Consultation';
        const docSpec = docObj.specialization || paymentAppt.specialization || 'General Specialist';
        const origFee = paymentAppt.original_fee || (paymentAppt.consultation_fee ? Math.round(paymentAppt.consultation_fee / 0.9) : 500);
        const netFee = paymentAppt.consultation_fee;
        const discountVal = Math.max(0, origFee - netFee);

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}>
            <div style={{
              background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '520px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
              border: '1px solid #e2e8f0', animation: 'fadeIn 0.2s ease-out'
            }}>
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                color: '#ffffff', padding: '20px 24px', position: 'relative'
              }}>
                <button
                  onClick={() => { setShowPaymentModal(false); setPaymentAppt(null); }}
                  style={{
                    position: 'absolute', right: '16px', top: '16px', background: 'rgba(255,255,255,0.15)',
                    border: 'none', color: '#ffffff', borderRadius: '50%', width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <X size={18} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '12px' }}>
                    <CreditCard size={22} color="#ffffff" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Pharmacist Consultation Payment</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#ccfbf1', opacity: 0.9 }}>
                      Finalize doctor booking with 10% Pharmacist discount
                    </p>
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Doctor Details Summary */}
                <div style={{
                  background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        {docName}
                      </h4>
                      <span style={{ fontSize: '12px', color: '#0d9488', fontWeight: 700 }}>
                        {docSpec}
                      </span>
                    </div>
                    <span style={{
                      background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0',
                      padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800,
                      display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      <Percent size={11} /> 10% Discount Applied
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#475569', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: 700 }}>CONSULTATION DATE</span>
                      <strong style={{ color: '#0f172a' }}>{formatDate(paymentAppt.appointment_date)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: 700 }}>SLOT TIME</span>
                      <strong style={{ color: '#0f172a' }}>{paymentAppt.appointment_time}</strong>
                    </div>
                  </div>
                </div>

                {/* Payment Method Display */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '10px' }}>
                    Payment Method:
                  </label>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: '12px',
                    border: '2px solid #0d9488', background: '#f0fdfa'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: '#0d9488', color: '#ffffff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>Online Digital Payment</strong>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>UPI, Cards, Net Banking (Razorpay)</span>
                      </div>
                    </div>
                    <span style={{
                      background: '#0d9488', color: '#fff', fontSize: '11px', fontWeight: 800,
                      padding: '3px 10px', borderRadius: '12px', textTransform: 'uppercase'
                    }}>
                      Selected
                    </span>
                  </div>
                </div>

                {/* Price Breakdown with Discount Highlight */}
                <div style={{
                  background: '#f1f5f9', borderRadius: '12px', padding: '14px 16px',
                  display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
                    <span>Standard Consultation Fee</span>
                    <span style={{ textDecoration: discountVal > 0 ? 'line-through' : 'none' }}>₹{origFee}</span>
                  </div>
                  {discountVal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#059669', fontWeight: 700 }}>
                      <span>10% Pharmacist Privilege Savings</span>
                      <span>-₹{discountVal}</span>
                    </div>
                  )}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800,
                    color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginTop: '4px'
                  }}>
                    <span>Net Amount Payable</span>
                    <span style={{ color: '#0d9488' }}>₹{netFee}</span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{
                padding: '16px 24px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0',
                display: 'flex', justifyContent: 'flex-end', gap: '12px'
              }}>
                <button
                  disabled={processingPayment}
                  onClick={() => { setShowPaymentModal(false); setPaymentAppt(null); }}
                  style={{
                    padding: '10px 20px', borderRadius: '10px', border: '1px solid #cbd5e1',
                    background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '14px',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  Cancel
                </button>

                <button
                  disabled={processingPayment}
                  onClick={handleConfirmPharmacistPayment}
                  style={{
                    padding: '10px 24px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                    color: '#ffffff', fontWeight: 800, fontSize: '14px', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  {processingPayment ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing...
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Pay ₹{netFee} Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Doctor Location Map Modal */}
      <DoctorLocationMapModal
        isOpen={showDoctorMapModal}
        onClose={() => setShowDoctorMapModal(false)}
        doctor={selectedApptForMap?.doctor_id}
        appointment={selectedApptForMap}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default PharmacistDashboard;
