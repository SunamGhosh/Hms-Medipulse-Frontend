import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Activity, CalendarCheck, Stethoscope, Pill, Bell, User, LogOut,
  ArrowRight, Clock, Heart, ShieldCheck, ArrowUpRight, Users,
  X, CheckCircle2, AlertCircle, XCircle, Loader2, Plus, Video, Package, Truck, Trash2, CreditCard,
  ChevronLeft, ChevronRight, FileText, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import './UserDashboard.css';
import './MyOrders.css';
import './PharmacyPage.css';
import BookAppointmentModal from '../components/BookAppointmentModal';

const API = import.meta.env.VITE_URL;
const getToken = () => localStorage.getItem('userToken');

/* ── status colour map ── */
const STATUS_CONFIG = {
  pending: { color: 'blue', label: 'Pending', dot: '#3b82f6' },
  confirmed: { color: 'teal', label: 'Confirmed', dot: '#0d9488' },
  completed: { color: 'green', label: 'Completed', dot: '#10b981' },
  cancelled: { color: 'rose', label: 'Cancelled', dot: '#f43f5e' },
  rejected: { color: 'orange', label: 'Rejected', dot: '#f97316' },
};

/* ── order status colour map ── */
const ORDER_STATUS_CONFIG = {
  paid:             { label: 'Order Placed',      icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', step: 1 },
  processing:       { label: 'Processing',        icon: Clock,        color: '#d97706', bg: '#fffbeb', border: '#fde68a', step: 2 },
  shipped:          { label: 'Shipped',           icon: Truck,        color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', step: 3 },
  out_for_delivery: { label: 'Out for Delivery',  icon: Truck,        color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', step: 4 },
  delivered:        { label: 'Delivered',         icon: CheckCircle2, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', step: 5 },
  cancelled:        { label: 'Cancelled',         icon: XCircle,      color: '#dc2626', bg: '#fef2f2', border: '#fecaca', step: 0 },
  pending:          { label: 'Pending',           icon: Clock,        color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', step: 0 },
};

const TRACKING_STEPS = ['paid', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

const getStatusColorClass = (statusStr) => {
  if (statusStr === 'cancelled') return 'red';
  if (statusStr === 'delivered') return 'blue';
  return 'green';
};

/* ── views ── */
const VIEWS = {
  DASHBOARD: 'dashboard',
  APPOINTMENTS: 'appointments',
  RECORDS: 'records',
  PROFILE: 'profile',
  ORDERS: 'orders',
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth <= 1024);
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [view, setView] = useState(VIEWS.DASHBOARD);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [trackingModalItem, setTrackingModalItem] = useState(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  const handleTrackItem = (flatItem) => {
    setTrackingModalItem(flatItem);
    setIsTrackingModalOpen(true);
  };

  /* ── API data ── */
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  /* ── Prescription Modal State ── */
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);

  const fetchMyPatientPrescriptions = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/prescription/patient/my-prescriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setPatientPrescriptions(data.prescriptions || []);
    } catch { /* silent */ }
  }, []);

  const handleViewPrescription = async (target) => {
    setShowPrescriptionModal(true);
    setPrescriptionLoading(true);
    setSelectedPrescription(null);
    try {
      const apptId = typeof target === 'object' ? (target?.appointment_id?._id || target?.appointment_id || target?._id) : target;
      const res = await fetch(`${API}/prescription/appointment/${apptId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      let fetchedPrescription = null;
      if (res.ok && data.prescription) {
        fetchedPrescription = data.prescription;
      } else {
        const found = patientPrescriptions.find(p => (p.appointment_id?._id || p.appointment_id) === apptId || p._id === apptId);
        if (found) {
          fetchedPrescription = found;
        } else if (typeof target === 'object') {
          fetchedPrescription = target;
        }
      }

      if (fetchedPrescription) {
        const fUp = fetchedPrescription.follow_up_date 
          || (typeof target === 'object' && target?.follow_up_date)
          || fetchedPrescription.medical_record_id?.follow_up_date
          || fetchedPrescription.appointment_id?.follow_up_date;
        if (fUp) {
          fetchedPrescription.follow_up_date = fUp;
        }
        setSelectedPrescription(fetchedPrescription);
      } else {
        toast.info('Prescription record has not been added by your doctor yet.');
        setShowPrescriptionModal(false);
      }
    } catch {
      toast.error('Failed to load prescription record.');
      setShowPrescriptionModal(false);
    } finally {
      setPrescriptionLoading(false);
    }
  };

  /* ── auth ── */
  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/login'); return; }
    const stored = localStorage.getItem('userName') || 'User';
    setUserName(stored.charAt(0).toUpperCase() + stored.slice(1));
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, [navigate]);

  /* ── fetch appointments ── */
  const fetchAppointments = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setApptLoading(true);
    try {
      const res = await fetch(`${API}/appointment/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const sorted = (data.appointments || []).sort(
          (a, b) => new Date(b.appointment_date) - new Date(a.appointment_date)
        );
        setAppointments(sorted);
      }
    } catch { /* silent */ }
    finally { setApptLoading(false); }
  }, []);

  /* ── fetch patients ── */
  const fetchPatients = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setPatientLoading(true);
    try {
      const res = await fetch(`${API}/patient/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setPatients(data.patients || []);
    } catch { /* silent */ }
    finally { setPatientLoading(false); }
  }, []);

  /* ── fetch profile ── */
  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUserProfile(data.user);
    } catch { /* silent */ }
  }, []);

  const fetchOrders = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API}/api/payment/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
    } catch { /* silent */ }
    finally { setOrdersLoading(false); }
  }, []);

  /* ── remove order ── */
  const handleRemoveOrder = async (orderId) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/payment/my-orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Order removed successfully');
        setOrders(prev => prev.filter(o => o._id !== orderId));
      } else {
        toast.error(data.message || 'Failed to remove order');
      }
    } catch (error) {
      toast.error('Error removing order');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    const token = getToken();
    try {
      const res = await fetch(`${API}/api/payment/update-order-status/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Order cancelled successfully!');
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'cancelled' } : o));
      } else {
        toast.error(data.message || 'Failed to cancel order');
      }
    } catch (err) {
      toast.error('Error cancelling order');
    }
  };

  const handleNeedHelp = (order, item) => {
    window.dispatchEvent(new CustomEvent('open-chatbot-help', {
      detail: { order, item }
    }));
  };

  useEffect(() => {
    const handleOrderStatusUpdated = (e) => {
      const { orderId, status } = e.detail;
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    };
    window.addEventListener('order-status-updated', handleOrderStatusUpdated);
    return () => window.removeEventListener('order-status-updated', handleOrderStatusUpdated);
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchProfile();
    fetchOrders();
    fetchMyPatientPrescriptions();

    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchAppointments, fetchPatients, fetchProfile, fetchOrders, fetchMyPatientPrescriptions]);

  /* refresh after booking */
  const handleBookClose = () => {
    setIsBookModalOpen(false);
    fetchAppointments();
  };

  /* ── cancel appointment ── */
  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    const token = getToken();
    try {
      const res = await fetch(`${API}/appointment/${id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cancel_reason: 'Cancelled by user' })
      });
      if (res.ok) {
        toast.success('Appointment cancelled successfully');
        fetchAppointments();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to cancel appointment');
      }
    } catch {
      toast.error('An error occurred while cancelling');
    }
  };

  /* ── join video call & send reminder email ── */
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

  /* ── pay for confirmed appointment via Razorpay ── */
  const handleApptPayment = async (appt) => {
    const token = getToken();
    if (!token) return;
    try {
      // Create a Razorpay order for the appointment fee
      const res = await fetch(`${API}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: appt.consultation_fee, appointment_id: appt._id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to initiate payment');
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        name: 'MediPulse Healthcare',
        description: `Consultation with Dr. ${appt.doctor_id?.first_name} ${appt.doctor_id?.last_name}`,
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
                appointment_id: appt._id
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              toast.success('Payment successful! Your appointment is confirmed.');
              fetchAppointments();
            } else {
              toast.error(verifyData.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            toast.error('Error verifying payment: ' + err.message);
          }
        },
        prefill: {
          name: userName,
          email: userProfile?.email || ''
        },
        theme: { color: '#0d9488' }
      };

      if (!window.Razorpay) {
        toast.error('Razorpay not loaded. Please refresh the page.');
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      toast.error('Error initiating payment');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  /* ── derived stats ── */
  const totalAppts = appointments.length;
  const pendingAppts = appointments.filter(a => a.status === 'pending').length;
  const completedAppts = appointments.filter(a => a.status === 'completed').length;
  const activePatients = patients.filter(p => p.status === 'active').length;

  const stats = [
    { icon: <CalendarCheck size={22} />, label: 'Total Appointments', value: apptLoading ? '…' : totalAppts, trend: `${pendingAppts} pending`, color: 'teal' },
    { icon: <Users size={22} />, label: 'Family Members', value: patientLoading ? '…' : activePatients, trend: 'Patients', color: 'blue' },
    { icon: <CheckCircle2 size={22} />, label: 'Completed', value: apptLoading ? '…' : completedAppts, trend: 'Visits done', color: 'purple' },
    { icon: <Heart size={22} />, label: 'Health Score', value: '92%', trend: '+5%', color: 'rose' },
  ];

  const quickActions = [
    { icon: <CalendarCheck size={20} />, label: 'Book Appointment', desc: 'Schedule with a doctor', action: () => setIsBookModalOpen(true), color: 'teal' },
    { icon: <Stethoscope size={20} />, label: 'Find Doctors', desc: 'Browse specialists', to: '/doctors', color: 'blue' },
    { icon: <Pill size={20} />, label: 'Order Medicine', desc: 'From our pharmacy', to: '/pharmacy', color: 'purple' },
    { icon: <ShieldCheck size={20} />, label: 'Health Records', desc: 'View your history', action: () => setView(VIEWS.RECORDS), color: 'green' },
  ];

  /* ── helpers ── */
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const handleDownloadRecord = (rec) => {
    if (!rec) return;
    const pName = rec.patient_id?.first_name
      ? `${rec.patient_id.first_name} ${rec.patient_id.last_name || ''}`.trim()
      : (userProfile ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim() : 'Patient');
    const docName = rec.doctor_id?.first_name 
      ? `Dr. ${rec.doctor_id.first_name} ${rec.doctor_id.last_name || ''}`
      : 'Dr. Attending Doctor';
    const docSpec = rec.doctor_id?.specialization || 'Specialist Doctor';
    const docEmail = rec.doctor_id?.email || '';
    const docPhone = rec.doctor_id?.phone || '+91 98765 12345';
    const docAddress = rec.doctor_id?.visit_address || 'Medipulse OPD Block, Sector 4';
    const recDate = formatDate(rec.prescribed_date || rec.createdAt);
    const disease = rec.disease || rec.diagnosis || rec.appointment_id?.disease || 'General Consultation';
    const age = rec.patient_id?.age || userProfile?.age || '28';
    const gender = rec.patient_id?.gender || userProfile?.gender || 'Male';
    const phone = rec.patient_id?.phone || userProfile?.phone || '+91 98765 43210';
    const followUpDateStr = rec.follow_up_date ? formatDate(rec.follow_up_date) : null;
    const docSig = rec.doctor_id?.signature;

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

    // Direct text file download
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

  return (
    <div className="ud-container">
      <div className="ud-blob ud-blob-1" />
      <div className="ud-blob ud-blob-2" />
      <div className="ud-blob ud-blob-3" />

      {/* ── Sidebar ── */}
      <aside className={`ud-sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
        <div className="ud-sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="ud-sidebar-logo">
              <Activity size={20} strokeWidth={2.5} color="#fff" />
            </div>
            {!sidebarCollapsed && <span>MediPulse</span>}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px',
              width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#475569', transition: 'all 0.2s', flexShrink: 0
            }}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="ud-nav">
          <button className={`ud-nav-item${view === VIEWS.DASHBOARD ? ' active' : ''}`}
            onClick={() => setView(VIEWS.DASHBOARD)} title={sidebarCollapsed ? "Dashboard" : ""} style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <Activity size={18} /> {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          <Link to="/doctors" className="ud-nav-item" title={sidebarCollapsed ? "Doctors" : ""}>
            <Stethoscope size={18} /> {!sidebarCollapsed && <span>Doctors</span>}
          </Link>

          <Link to="/pharmacy" className="ud-nav-item" title={sidebarCollapsed ? "Pharmacy" : ""}>
            <Pill size={18} /> {!sidebarCollapsed && <span>Pharmacy</span>}
          </Link>

          <button className={`ud-nav-item${view === VIEWS.APPOINTMENTS ? ' active' : ''}`}
            onClick={() => setView(VIEWS.APPOINTMENTS)} title={sidebarCollapsed ? "Appointments" : ""} style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <CalendarCheck size={18} /> {!sidebarCollapsed && <span>Appointments</span>}
            {pendingAppts > 0 && (
              <span style={{ marginLeft: sidebarCollapsed ? '0' : 'auto', background: '#0d9488', color: '#fff', borderRadius: '12px', fontSize: '11px', fontWeight: 700, padding: '2px 8px' }}>
                {pendingAppts}
              </span>
            )}
          </button>

          <button className={`ud-nav-item${view === VIEWS.ORDERS ? ' active' : ''}`}
            onClick={() => setView(VIEWS.ORDERS)} title={sidebarCollapsed ? "My Orders" : ""} style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <Package size={18} /> {!sidebarCollapsed && <span>My Orders</span>}
          </button>

          {/* ── Book Appointment — sidebar CTA ── */}
          <div className="ud-nav-divider" />
          <button className="ud-nav-item ud-nav-book" onClick={() => setIsBookModalOpen(true)} title={sidebarCollapsed ? "Book Appointment" : ""}
            style={{ background: 'linear-gradient(135deg,#0d9488,#14b8a6)', color: '#fff', border: 'none', font: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left', borderRadius: '10px', margin: '4px 0', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <Plus size={18} /> {!sidebarCollapsed && <span>Book Appointment</span>}
          </button>
          <div className="ud-nav-divider" />

          <button className={`ud-nav-item${view === VIEWS.PROFILE ? ' active' : ''}`}
            onClick={() => setView(VIEWS.PROFILE)} title={sidebarCollapsed ? "My Profile" : ""} style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <User size={18} /> {!sidebarCollapsed && <span>My Profile</span>}
          </button>
        </nav>

        <button className="ud-logout-btn" onClick={handleLogout} title={sidebarCollapsed ? "Sign Out" : ""} style={{ color: '#ef4444', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
          <LogOut size={17} /> {!sidebarCollapsed && <span>Sign Out</span>}
        </button>
      </aside>

      {/* ── Main ── */}
      <main className={`ud-main${sidebarCollapsed ? ' collapsed' : ''}`}>

        {/* ── Hero ── */}
        <div className="ud-hero">
          <div className="ud-hero-accent" />
          <div className="ud-hero-left">
            <h1 className="ud-hero-title">
              Welcome back, <span className="ud-hero-name">{userName}</span>!
            </h1>
            <p className="ud-hero-sub">
              {greeting} &mdash; Here&apos;s your personalised health overview for today.
            </p>
          </div>
          <div className="ud-hero-right">
            <div className="ud-date">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <button className="ud-notif-btn" aria-label="Notifications">
              <Bell size={19} />
              {pendingAppts > 0 && <span className="ud-notif-dot" />}
            </button>
            <div
              className="ud-avatar"
              onClick={() => setView(VIEWS.PROFILE)}
              title="View Profile"
              style={{ cursor: 'pointer', overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {userProfile?.profile_img ? (
                <img src={userProfile.profile_img} alt="Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </div>

        {/* ════════════ DASHBOARD VIEW ════════════ */}
        {view === VIEWS.DASHBOARD && (
          <>
            {/* Stats */}
            <section className="ud-stats-grid">
              {stats.map((s, i) => (
                <div key={i} className={`ud-stat-card ud-stat-card--${s.color}`}>
                  <div className="ud-stat-top">
                    <div className={`ud-stat-icon-wrapper ud-stat-icon-wrapper--${s.color}`}>{s.icon}</div>
                    <div className="ud-stat-badge"><ArrowUpRight size={14} /><span>{s.trend}</span></div>
                  </div>
                  <div className="ud-stat-bottom">
                    <span className="ud-stat-value">{s.value}</span>
                    <span className="ud-stat-label">{s.label}</span>
                    <span className="ud-stat-sub">Live from your records</span>
                  </div>
                  <div className="ud-stat-glow" />
                </div>
              ))}
            </section>

            {/* Quick Actions */}
            <section className="ud-section">
              <div className="ud-section-header">
                <h2 className="ud-section-title">Quick Actions</h2>
              </div>
              <div className="ud-section-body">
                <div className="ud-actions-grid">
                  {quickActions.map((a, i) =>
                    a.action ? (
                      <button key={i} className={`ud-action-card ud-action-${a.color}`} onClick={a.action}
                        style={{ background: 'none', border: '1.5px solid rgba(255,255,255,0.6)', cursor: 'pointer', textAlign: 'left', width: '100%', font: 'inherit', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="ud-action-icon">{a.icon}</div>
                        <div className="ud-action-text"><strong>{a.label}</strong><span>{a.desc}</span></div>
                        <ArrowRight size={18} className="ud-action-arrow" />
                      </button>
                    ) : (
                      <Link key={i} to={a.to} className={`ud-action-card ud-action-${a.color}`}>
                        <div className="ud-action-icon">{a.icon}</div>
                        <div className="ud-action-text"><strong>{a.label}</strong><span>{a.desc}</span></div>
                        <ArrowRight size={18} className="ud-action-arrow" />
                      </Link>
                    )
                  )}
                </div>
              </div>
            </section>

            {/* Recent appointments + health tip */}
            <div className="ud-bottom-layout">
              <section className="ud-section">
                <div className="ud-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="ud-section-title">Recent Appointments</h2>
                  <button onClick={() => setView(VIEWS.APPOINTMENTS)}
                    style={{ background: 'none', border: 'none', color: '#0d9488', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View all <ArrowRight size={13} />
                  </button>
                </div>
                <div className="ud-section-body">
                  {apptLoading ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      <Loader2 size={24} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : appointments.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      <CalendarCheck size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                      <p>No appointments yet. <button onClick={() => setIsBookModalOpen(true)} style={{ color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Book one now →</button></p>
                    </div>
                  ) : (
                    <ul className="ud-activity-list">
                      {appointments.slice(0, 4).map((appt, i) => {
                        const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
                        return (
                          <li key={i} className="ud-activity-item">
                            <div className="ud-activity-dot" style={{ background: cfg.dot, boxShadow: `0 0 0 3px ${cfg.dot}33` }} />
                            <div className="ud-activity-content">
                              <p className="ud-activity-title">
                                Dr. {appt.doctor_id?.first_name} {appt.doctor_id?.last_name}
                                {appt.patient_id && <span style={{ color: '#94a3b8', fontWeight: 400 }}> — {appt.patient_id?.first_name}</span>}
                              </p>
                              <div className="ud-activity-meta">
                                <Clock size={11} />
                                <span>{formatDate(appt.appointment_date)} at {appt.appointment_time}</span>
                                <span className={`ud-activity-badge ud-badge-${cfg.color}`}>{cfg.label}</span>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>

              <section className="ud-section">
                <div className="ud-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="ud-section-title">Recent Orders</h2>
                  <button onClick={() => setView(VIEWS.ORDERS)}
                    style={{ background: 'none', border: 'none', color: '#0d9488', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View all <ArrowRight size={13} />
                  </button>
                </div>
                <div className="ud-section-body">
                  {ordersLoading ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      <Package size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                      <p>No recent orders. <Link to="/pharmacy" style={{ color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, textDecoration: 'none' }}>Order medicine →</Link></p>
                    </div>
                  ) : (
                    <ul className="ud-activity-list">
                      {orders.slice(0, 4).map((order, i) => {
                        const isDelivered = order.status === 'delivered';
                        const dotColor = isDelivered ? '#10b981' : order.status === 'paid' ? '#0d9488' : order.status === 'cancelled' ? '#ef4444' : '#f97316';
                        return (
                          <li key={i} className="ud-activity-item">
                            <div className="ud-activity-dot" style={{ background: dotColor, boxShadow: `0 0 0 3px ${dotColor}33` }} />
                            <div className="ud-activity-content">
                              <p className="ud-activity-title">
                                Order #{order._id.slice(-6).toUpperCase()}
                                <span style={{ color: '#94a3b8', fontWeight: 400 }}> — ₹{order.grand_total}</span>
                              </p>
                              <div className="ud-activity-meta">
                                <Clock size={11} />
                                <span>{formatDate(order.placed_at || order.createdAt)}</span>
                                <span className="ud-activity-badge" style={{
                                  background: isDelivered ? '#f0fdf4' : order.status === 'paid' ? '#ecfdf5' : '#fff7ed',
                                  color: isDelivered ? '#16a34a' : order.status === 'paid' ? '#10b981' : '#f97316'
                                }}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          </>
        )}

        {/* ════════════ APPOINTMENTS VIEW ════════════ */}
        {view === VIEWS.APPOINTMENTS && (
          <section className="ud-section">
            <div className="ud-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="ud-section-title">My Appointments</h2>
              <button className="ud-book-appt-btn" onClick={() => setIsBookModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,#0d9488,#14b8a6)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }}>
                <Plus size={16} /> Book New Appointment
              </button>
            </div>
            <div className="ud-section-body">
              {apptLoading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                  <p>Loading appointments…</p>
                </div>
              ) : appointments.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <CalendarCheck size={60} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>No appointments yet</h3>
                  <p style={{ marginBottom: '1.5rem' }}>Book your first appointment to get started</p>
                  <button onClick={() => setIsBookModalOpen(true)}
                    style={{ background: '#0d9488', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} /> Book Appointment
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {appointments.map((appt) => {
                    const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
                    const canCancel = appt.status === 'pending' || appt.status === 'confirmed';
                    return (
                      <div key={appt._id} style={{
                        background: '#fff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem',
                        transition: 'all 0.2s',
                      }}>
                        {/* Status dot */}
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: cfg.dot, flexShrink: 0, boxShadow: `0 0 0 4px ${cfg.dot}22` }} />

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                              Dr. {appt.doctor_id?.first_name} {appt.doctor_id?.last_name}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '2px 10px', borderRadius: '12px', fontWeight: 600 }}>
                              {appt.doctor_id?.specialization || 'General'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '13px', color: '#64748b' }}>
                            {appt.patient_id && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <User size={12} /> {appt.patient_id?.first_name} {appt.patient_id?.last_name}
                              </span>
                            )}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> {formatDate(appt.appointment_date)} at {appt.appointment_time}
                            </span>
                            {appt.disease && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Stethoscope size={12} /> {appt.disease}
                              </span>
                            )}
                            {appt.consult_mode && (
                              <span style={{ textTransform: 'capitalize', background: '#f0fdfa', color: '#0d9488', padding: '1px 8px', borderRadius: '8px', fontWeight: 600 }}>
                                {appt.consult_mode}
                              </span>
                            )}
                          </div>
                          {/* Meeting Time Info — visible on completed appointments */}
                          {appt.status === 'completed' && (appt.meet_time_start || appt.meet_time_end) && (
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px',
                              fontSize: '12px', color: '#475569', background: '#f0fdfa',
                              padding: '4px 12px', borderRadius: '20px', border: '1px solid #99f6e4'
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
                        </div>

                        {/* Fee */}
                        {appt.consultation_fee && (
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0d9488' }}>₹{appt.consultation_fee}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>fee</div>
                          </div>
                        )}

                        {/* Status badge */}
                        <span style={{
                          padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                          background: cfg.dot + '18', color: cfg.dot, flexShrink: 0,
                        }}>
                          {cfg.label}
                        </span>

                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                          {/* Payment Done badge */}
                          {appt.payment_status === 'paid' && (
                            <span style={{ background: '#f0fdf4', border: '1.5px solid #86efac', color: '#16a34a', borderRadius: '20px', padding: '5px 13px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} /> Payment Done
                            </span>
                          )}
                          {/* Pay Now button — only for confirmed + unpaid */}
                          {appt.status === 'confirmed' && appt.payment_status !== 'paid' && appt.consultation_fee && (
                            <button onClick={() => handleApptPayment(appt)}
                              style={{ background: 'linear-gradient(135deg,#0d9488,#14b8a6)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 10px rgba(13,148,136,0.35)' }}>
                              <CreditCard size={13} /> Pay Now
                            </button>
                          )}
                          {appt.status === 'confirmed' && appt.payment_status === 'paid' && appt.consult_mode === 'online' && (
                            <button onClick={() => handleJoinVideoCall(appt._id)}
                              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Video size={13} /> Join Video Call
                            </button>
                          )}
                          {/* Completed Consultation Prescription Actions */}
                          {appt.status === 'completed' && (
                            (patientPrescriptions.some(p => (p.appointment_id?._id || p.appointment_id) === appt._id) || appt.prescription_added) ? (
                              <button onClick={() => handleViewPrescription(appt._id)}
                                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#0d9488', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FileText size={13} /> View Prescription
                              </button>
                            ) : (
                              <button disabled={true}
                                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#94a3b8', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '13px', cursor: 'not-allowed', opacity: 0.7 }}
                                title="Doctor has not added prescription for this consultation yet">
                                <FileText size={13} /> Prescription Pending
                              </button>
                            )
                          )}
                          {/* Cancel button */}
                          {canCancel && (
                            <button onClick={() => handleCancel(appt._id)}
                              style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
                              <XCircle size={13} /> Cancel
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

        {/* ════════════ ORDERS VIEW ════════════ */}
        {view === VIEWS.ORDERS && (
          <section className="ud-section">
            <div className="ud-section-header">
              <h2 className="ud-section-title">My Orders</h2>
            </div>
            <div className="ud-section-body">
              {ordersLoading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                  <p>Loading orders…</p>
                </div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Package size={60} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>No orders yet</h3>
                  <p style={{ marginBottom: '1.5rem' }}>Order medicines from our pharmacy</p>
                  <Link to="/pharmacy"
                    style={{ background: '#0d9488', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <Pill size={16} /> Order Medicine
                  </Link>
                </div>
              ) : (
                <div className="mo-single-col-body">
                  {(() => {
                    const orderItems = [];
                    orders.forEach(order => {
                      order.items.forEach(item => {
                        orderItems.push({
                          ...order,
                          orderId: order._id,
                          item
                        });
                      });
                    });

                    return orderItems.map((flatItem, idx) => {
                      const { orderId, item, status: orderStatus, placed_at } = flatItem;
                      const statusCfg = ORDER_STATUS_CONFIG[orderStatus] || ORDER_STATUS_CONFIG.pending;
                      const StatusIcon = statusCfg.icon;
                      const colorClass = getStatusColorClass(orderStatus);

                      let timelineText = '';
                      if (orderStatus === 'cancelled') {
                        timelineText = `on ${new Date(placed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} As per your request`;
                      } else if (orderStatus === 'delivered') {
                        timelineText = `on ${new Date(flatItem.tracking?.delivered_at || placed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
                      } else {
                        const estDate = new Date(placed_at);
                        estDate.setDate(estDate.getDate() + 3);
                        const dateStr = estDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                        timelineText = `Arriving by ${dateStr}`;
                      }

                      const isCancelled = orderStatus === 'cancelled';
                      const isDelivered = orderStatus === 'delivered';
                      const isActive = !isCancelled && !isDelivered;

                      return (
                        <div className="mo-item-card" key={`${orderId}-${idx}`} style={{ padding: '20px', background: 'white' }}>
                          {/* Header status */}
                          <div className="mo-card-status-header">
                            <div className={`mo-status-icon-box ${colorClass}`}>
                              <StatusIcon size={18} />
                            </div>
                            <div className="mo-status-text-details">
                              <span className={`mo-status-title-text ${colorClass}`}>
                                {statusCfg.label}
                              </span>
                              <span className="mo-status-sub-text">{timelineText}</span>
                            </div>
                          </div>

                          {/* Item info box */}
                          <Link to="/pharmacy" className="mo-nested-item-box">
                            <div className="mo-nested-img-wrapper">
                              <img
                                src={item.medicine_image || '/img/medicine_bottle.png'}
                                alt={item.medicine_name}
                                className="mo-nested-img"
                                onError={e => { e.target.src = '/img/medicine_bottle.png'; }}
                              />
                            </div>
                            <div className="mo-nested-info">
                              <span className="mo-nested-brand">{item.medicine_name}</span>
                              <span className="mo-nested-desc">Prescription Medicine • Qty: {item.quantity}</span>
                              <span className="mo-nested-price-qty">₹{item.price.toFixed(2)} each</span>
                            </div>
                            <ChevronRight size={18} className="mo-nested-chevron" />
                          </Link>

                          {/* Action buttons (only for non-cancelled) */}
                          {!isCancelled && (
                            <div className="mo-actions-button-row">
                              {isActive && (
                                <>
                                  <button
                                    className="mo-action-btn-flat"
                                    onClick={() => handleTrackItem(flatItem)}
                                  >
                                    <Truck size={15} /> Track Item
                                  </button>
                                  <button className="mo-action-btn-flat" onClick={() => handleCancelOrder(orderId)}>
                                    <XCircle size={15} /> Cancel Item
                                  </button>
                                </>
                              )}
                              {isDelivered && (
                                <button className="mo-action-btn-flat" onClick={() => toast.success('Return period expired')}>
                                  <RotateCcw size={15} /> Return Item
                                </button>
                              )}
                              <button className="mo-action-btn-flat" onClick={() => handleNeedHelp(flatItem, item)}>
                                <Headphones size={15} /> Need Help?
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ════════════ PROFILE VIEW ════════════ */}
        {view === VIEWS.PROFILE && (
          <section className="ud-section">
            <div className="ud-section-header"><h2 className="ud-section-title">My Profile</h2></div>
            <div className="ud-section-body">
              {userProfile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Avatar row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#0d9488)', color: '#fff', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(13,148,136,0.3)' }}>
                      {userProfile.first_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                        {userProfile.first_name} {userProfile.last_name}
                      </h3>
                      <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{userProfile.email}</p>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    {[
                      { label: 'First Name', value: userProfile.first_name },
                      { label: 'Last Name', value: userProfile.last_name },
                      { label: 'Email', value: userProfile.email },
                      { label: 'Phone', value: userProfile.phone || '—' },
                      { label: 'Address', value: userProfile.address || '—' },
                      { label: 'Account Status', value: userProfile.status || 'active' },
                      { label: 'Member Since', value: formatDate(userProfile.createdAt) },
                      { label: 'Last Login', value: userProfile.last_login ? formatDate(userProfile.last_login) : '—' },
                    ].map((row) => (
                      <div key={row.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1.1rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>{row.label}</div>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{row.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Family patients */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Family Patients</h4>
                      <button onClick={() => setIsBookModalOpen(true)}
                        style={{ background: '#f0fdfa', border: 'none', color: '#0d9488', fontWeight: 700, fontSize: '13px', cursor: 'pointer', padding: '6px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Plus size={13} /> Add via Booking
                      </button>
                    </div>
                    {patientLoading ? (
                      <p style={{ color: '#94a3b8' }}>Loading…</p>
                    ) : patients.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontSize: '14px' }}>No patients added yet. Add one when booking an appointment.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {patients.map(p => (
                          <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#14b8a6,#0d9488)', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {p.first_name?.[0]}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{p.first_name} {p.last_name}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{p.relationship_to_user} • {p.gender} • {p.blood_group}</div>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: p.status === 'active' ? '#f0fdf4' : '#fef2f2', color: p.status === 'active' ? '#16a34a' : '#ef4444' }}>
                              {p.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              )}
            </div>
          </section>
        )}

      </main>

      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={handleBookClose}
      />

      {/* ── Prescription Record Modal ── */}
      {showPrescriptionModal && (
        <div className="ud-modal-overlay" onClick={() => setShowPrescriptionModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="ud-modal-card" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0' }}>
            <div style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', color: '#fff', padding: '1.5rem 2rem', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#99f6e4' }}>Official Prescription Record</span>
                <h2 style={{ margin: '4px 0 0', fontSize: '1.25rem', fontWeight: 800 }}>MEDIPULSE HEALTHCARE CENTER</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedPrescription && (
                  <button 
                    onClick={() => handleDownloadRecord(selectedPrescription)}
                    style={{ background: '#0f766e', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <Download size={15} /> Download Record
                  </button>
                )}
                <button onClick={() => setShowPrescriptionModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ padding: '2rem' }}>
              {prescriptionLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                  <p>Fetching prescription record...</p>
                </div>
              ) : selectedPrescription ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Doctor Info */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Attending Doctor</span>
                      <p style={{ margin: '2px 0 0', fontWeight: 800, color: '#0f172a' }}>
                        Dr. {selectedPrescription.doctor_id?.first_name} {selectedPrescription.doctor_id?.last_name}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#0d9488', fontWeight: 600 }}>
                        {selectedPrescription.doctor_id?.specialization || 'Specialist Doctor'}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Patient Name</span>
                      <p style={{ margin: '2px 0 0', fontWeight: 800, color: '#0f172a' }}>
                        {selectedPrescription.patient_id?.first_name} {selectedPrescription.patient_id?.last_name}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                        {selectedPrescription.patient_id?.gender || 'Patient'} {selectedPrescription.patient_id?.age ? `(${selectedPrescription.patient_id.age} yrs)` : ''}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Prescribed Date</span>
                      <p style={{ margin: '2px 0 0', fontWeight: 800, color: '#0f172a' }}>
                        {formatDate(selectedPrescription.prescribed_date || selectedPrescription.createdAt)}
                      </p>
                    </div>
                    {selectedPrescription.follow_up_date && (
                      <div>
                        <span style={{ fontSize: '11px', color: '#1e40af', fontWeight: 800, textTransform: 'uppercase' }}>Follow-up Date</span>
                        <p style={{ margin: '2px 0 0', fontWeight: 800, color: '#1d4ed8' }}>
                          {formatDate(selectedPrescription.follow_up_date)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Prescribed Medicines Table */}
                  <div>
                    <h3 style={{ fontSize: '15px', color: '#0f172a', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Pill size={16} color="#0d9488" /> Prescribed Medicines
                    </h3>
                    {Array.isArray(selectedPrescription.medicines) && selectedPrescription.medicines.length > 0 ? (
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead style={{ background: '#f1f5f9', color: '#334155' }}>
                            <tr>
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
                              <tr key={idx} style={{ borderTop: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                                  {med.medicine_name || 'Prescribed Medicine'}
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
                      <p style={{ fontSize: '13px', color: '#64748b' }}>No prescribed medicines listed.</p>
                    )}
                  </div>

                  {/* Doctor Notes / Instructions */}
                  {selectedPrescription.general_instructions && (
                    <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '12px', padding: '1rem' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#d48806', textTransform: 'uppercase' }}>Doctor's Advice / Notes:</span>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#434343' }}>{selectedPrescription.general_instructions}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#94a3b8' }}>No prescription details found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// Vertical timeline tracking modal component
const TrackingModal = ({ isOpen, onClose, flatItem, STATUS_CONFIG, TRACKING_STEPS }) => {
  if (!isOpen || !flatItem) return null;

  const { orderId, status: orderStatus, placed_at } = flatItem;
  const statusCfg = STATUS_CONFIG[orderStatus] || STATUS_CONFIG.pending;

  const getStepTime = (stepKey) => {
    if (stepKey === 'paid') return placed_at;
    if (stepKey === 'processing') return flatItem.tracking?.processing_at;
    if (stepKey === 'shipped') return flatItem.tracking?.shipped_at;
    if (stepKey === 'out_for_delivery') return flatItem.tracking?.out_for_delivery_at;
    if (stepKey === 'delivered') return flatItem.tracking?.delivered_at;
    return null;
  };

  return (
    <div className="mo-track-modal-overlay" onClick={onClose}>
      <div className="mo-track-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mo-track-modal-header">
          <h3 className="mo-track-modal-title">Track Shipment</h3>
          <button className="mo-track-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="mo-track-modal-body">
          {/* Order Details Header */}
          <div style={{ marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>ORDER ID</div>
            <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: 800, textTransform: 'uppercase' }}>#{orderId.toUpperCase()}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Placed on {new Date(placed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Vertical Stepper */}
          <div className="mo-vertical-timeline">
            {TRACKING_STEPS.map((stepKey, i) => {
              const stepConfig = STATUS_CONFIG[stepKey];
              const isStepCompleted = statusCfg.step >= stepConfig.step;
              const isStepCurrent = statusCfg.step === stepConfig.step;
              
              const stepTime = getStepTime(stepKey);
              const timeText = stepTime
                ? new Date(stepTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                : '';

              const nextStepKey = TRACKING_STEPS[i + 1];
              const isLineFilled = nextStepKey && statusCfg.step >= STATUS_CONFIG[nextStepKey].step;

              return (
                <div className={`mo-vertical-step ${isStepCompleted ? 'completed' : ''} ${isStepCurrent ? 'current' : ''}`} key={stepKey}>
                  <div className="mo-vertical-line-wrapper">
                    <div className="mo-vertical-dot">
                      {isStepCompleted ? <Check size={12} strokeWidth={4} /> : <div className="mo-vertical-dot-inner"></div>}
                    </div>
                    <div className={`mo-vertical-line ${isLineFilled ? 'filled' : ''}`}></div>
                  </div>
                  <div className="mo-vertical-text-wrapper">
                    <span className="mo-vertical-label">{stepConfig.label}</span>
                    <span className="mo-vertical-desc">
                      {isStepCurrent && `In Progress — `}
                      {timeText || (isStepCompleted ? 'Completed' : 'Pending')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Address Box */}
          {flatItem.delivery_address && (
            <div className="mo-delivery-address" style={{ marginTop: '0', marginBottom: '16px', background: '#f8fafc' }}>
              <strong>Delivery Address:</strong>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569', lineHeight: '1.4' }}>
                {flatItem.delivery_address.street}, {flatItem.delivery_address.city}, {flatItem.delivery_address.state} {flatItem.delivery_address.zip_code}
              </p>
            </div>
          )}

          {/* Payment Status Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 13,
            padding: '10px 14px',
            background: (flatItem.payment_mode === 'COD' && flatItem.payment_status !== 'paid') ? '#fff7ed' : '#f0fdf4',
            borderRadius: 8,
            border: `1px solid ${(flatItem.payment_mode === 'COD' && flatItem.payment_status !== 'paid') ? '#fed7aa' : '#bbf7d0'}`
          }}>
            <div>
              <span style={{ color: '#475569', fontWeight: 500 }}>Mode: </span>
              <strong style={{ color: '#0f172a' }}>{flatItem.payment_mode || 'UPI'}</strong>
            </div>
            <div>
              <span style={{ color: '#475569', fontWeight: 500 }}>Status: </span>
              <span style={{
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700,
                background: (flatItem.payment_status === 'paid' || flatItem.payment_mode === 'UPI') ? '#16a34a' : '#f97316',
                color: '#ffffff'
              }}>
                {(flatItem.payment_status === 'paid' || flatItem.payment_mode === 'UPI') ? 'Done' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
