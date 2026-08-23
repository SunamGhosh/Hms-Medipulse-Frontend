import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import './Chatbot.css';

const API = import.meta.env.VITE_URL || 'http://localhost:4000/api';

const initialOptions = [
  { label: 'Help me book an appointment.', value: 'book_appointment' },
  { label: 'Help me sign up', value: 'sign_up' },
  { label: 'Find a doctor', value: 'find_doctor' },
  { label: 'Buy a medicine', value: 'buy_medicine' },
  { label: 'Know about MEDIPULSE', value: 'about_medipulse' }
];

const categoryOptions = [
  { label: 'General physician', value: 'General physician' },
  { label: 'Cardiologist', value: 'Cardiologist' },
  { label: 'Dermatologist', value: 'Dermatologist' },
  { label: 'Paediatrician', value: 'Paediatrician' },
  { label: 'Gynaecologist', value: 'Gynaecologist' },
  { label: 'Ayurvedic', value: 'Ayurvedic' },
  { label: 'Homeopathy', value: 'Homeopathy' },
  { label: 'Neurologist', value: 'Neurologist' },
  { label: 'Orthopaedic', value: 'Orthopaedic' },
  { label: 'Nutritionist', value: 'Nutritionist' },
  { label: 'Psychologist', value: 'Psychologist' }
];

const yesNoOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' }
];

const orderSupportYesNoOptions = [
  { label: 'Yes', value: 'order_query_menu' },
  { label: 'No, end chat', value: 'no' }
];

const orderQueryOptions = [
  { label: 'Track shipment', value: 'order_track' },
  { label: 'Cancel item', value: 'order_cancel' },
  { label: 'Change address', value: 'order_change_address' },
  { label: 'Deliver on specific date', value: 'order_delivery_date' },
  { label: 'End chat', value: 'no' }
];

const bookingRelatedOptions = [
  { label: 'Find a doctor', value: 'find_doctor' },
  { label: 'View My Appointments', value: 'view_appointments' },
  { label: 'Back to main menu', value: 'yes' }
];

const signUpRelatedOptions = [
  { label: 'Register/Signup Now', value: 'go_signup' },
  { label: 'Back to main menu', value: 'yes' }
];

const pharmacyRelatedOptions = [
  { label: 'Browse Pharmacy', value: 'go_pharmacy' },
  { label: 'View My Orders', value: 'view_orders' },
  { label: 'Back to main menu', value: 'yes' }
];

const aboutRelatedOptions = [
  { label: 'Go to About Us page', value: 'go_about' },
  { label: 'Find a doctor', value: 'find_doctor' },
  { label: 'Back to main menu', value: 'yes' }
];

const fetchAndFormatAppointments = async (token) => {
  try {
    const res = await fetch(`${API}/appointment/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) {
      return "Sorry, I had trouble fetching your appointments. Please try again later.";
    }
    const appts = data.appointments || [];
    if (appts.length === 0) {
      return "You don't have any scheduled appointments yet. Would you like to book one?";
    }

    const sorted = [...appts].sort((a, b) => {
      const dateA = new Date(a.appointment_date || 0);
      const dateB = new Date(b.appointment_date || 0);
      return dateB - dateA;
    });

    const activeAppts = sorted.filter(a => ['pending', 'confirmed'].includes(a.status?.toLowerCase()));
    const pastAppts = sorted.filter(a => !['pending', 'confirmed'].includes(a.status?.toLowerCase()));

    let reply = "Here are your appointment details:\n\n";

    if (activeAppts.length > 0) {
      reply += "**UPCOMING APPOINTMENTS**\n";
      activeAppts.forEach((appt, index) => {
        const dateStr = new Date(appt.appointment_date).toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        });
        const timeStr = appt.appointment_time;
        const docName = appt.doctor_id 
          ? `Dr. ${appt.doctor_id.first_name} ${appt.doctor_id.last_name}` 
          : 'Specialist';
        const specialty = appt.doctor_id?.specialization ? ` (${appt.doctor_id.specialization})` : '';
        const mode = appt.consult_mode === 'online' ? 'Online Video Call' : 'In-Person Consult';
        const status = appt.status ? appt.status.charAt(0).toUpperCase() + appt.status.slice(1) : 'Pending';
        
        reply += `${index + 1}. **${docName}**${specialty}\n`;
        reply += `   • Date & Time: ${dateStr} at ${timeStr}\n`;
        reply += `   • Mode: ${mode}\n`;
        reply += `   • Status: ${status}\n`;
        reply += `   • Reason: ${appt.disease || 'General checkup'}\n\n`;
      });
    } else {
      reply += "**UPCOMING APPOINTMENTS**\nNo active or upcoming appointments found.\n\n";
    }

    if (pastAppts.length > 0) {
      reply += "**PAST APPOINTMENTS**\n";
      const recentPast = pastAppts.slice(0, 5);
      recentPast.forEach((appt, index) => {
        const dateStr = new Date(appt.appointment_date).toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        });
        const timeStr = appt.appointment_time;
        const docName = appt.doctor_id 
          ? `Dr. ${appt.doctor_id.first_name} ${appt.doctor_id.last_name}` 
          : 'Specialist';
        const specialty = appt.doctor_id?.specialization ? ` (${appt.doctor_id.specialization})` : '';
        const status = appt.status ? appt.status.charAt(0).toUpperCase() + appt.status.slice(1) : 'Completed';
        
        reply += `${index + 1}. **${docName}**${specialty} — ${dateStr} at ${timeStr}\n`;
        reply += `   Status: ${status} | Reason: ${appt.disease || 'N/A'}\n\n`;
      });

      if (pastAppts.length > 5) {
        reply += `*(+ ${pastAppts.length - 5} older appointments available in your dashboard)*\n`;
      }
    }

    return reply;
  } catch (err) {
    console.error("Error fetching appointments:", err);
    return "Sorry, a network error occurred while fetching your appointments. Please try again later.";
  }
};

const fetchAndFormatOrders = async (token) => {
  try {
    const res = await fetch(`${API}/api/payment/my-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) {
      return "Sorry, I had trouble fetching your orders. Please try again later.";
    }
    const orders = data.orders || [];
    if (orders.length === 0) {
      return "You don't have any pharmacy orders yet. You can purchase medicines from the [Pharmacy](/pharmacy).";
    }

    const sorted = [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.placed_at || 0);
      const dateB = new Date(b.createdAt || b.placed_at || 0);
      return dateB - dateA;
    });

    const activeOrders = sorted.filter(o => ['pending', 'paid', 'processing', 'shipped', 'out_for_delivery'].includes(o.status?.toLowerCase()));
    const pastOrders = sorted.filter(o => ['delivered', 'cancelled'].includes(o.status?.toLowerCase()));

    let userName = 'there';
    try {
      const storedUser = localStorage.getItem('user') || localStorage.getItem('userInfo');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        userName = parsed.name || parsed.first_name || 'there';
      }
    } catch (e) {}

    let reply = "";

    if (activeOrders.length > 0) {
      const latest = activeOrders[0];
      const orderDate = new Date(latest.createdAt || latest.placed_at || Date.now());
      const formattedDate = `${orderDate.getMonth() + 1}/${orderDate.getDate()}/${orderDate.getFullYear()}`;
      
      const estDate = new Date(orderDate);
      estDate.setDate(estDate.getDate() + 3);
      const formattedEstDate = `${estDate.getMonth() + 1}/${estDate.getDate()}/${estDate.getFullYear()}`;
      
      const statusLower = (latest.status || 'processing').toLowerCase();
      let statusMsg = "We have shipped the order and it is on track.";
      if (statusLower === 'pending' || statusLower === 'paid') {
        statusMsg = "We are currently packing your items.";
      }

      reply = `Hi **${userName}** , the order you placed on **${formattedDate}** is expected to be delivered by **${formattedEstDate}**. ${statusMsg}`;
    } else if (pastOrders.length > 0) {
      const latest = pastOrders[0];
      const orderDate = new Date(latest.createdAt || latest.placed_at || Date.now());
      const formattedDate = `${orderDate.getMonth() + 1}/${orderDate.getDate()}/${orderDate.getFullYear()}`;
      
      reply = `Hi **${userName}** , the recent order you placed on **${formattedDate}** has been delivered successfully.`;
    } else {
      reply = `Hi **${userName}** , you don't have any recent orders. You can browse and order items from our [Pharmacy](/pharmacy).`;
    }

    return reply;
  } catch (err) {
    console.error("Error fetching orders:", err);
    return "Sorry, a network error occurred while fetching your orders. Please try again later.";
  }
};


const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'bot',
      text: 'Hi there! I am MediBot. How can I help you with MEDIPULSE today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      options: initialOptions
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      // Force scrollTop adjustment on the parent container to handle button rendering delays
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
    // Re-trigger scroll after layout updates
    const timer1 = setTimeout(scrollToBottom, 50);
    const timer2 = setTimeout(scrollToBottom, 150);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [messages, isLoading]);

  useEffect(() => {
    const handleOpenHelp = (event) => {
      const { order, item } = event.detail;
      setIsOpen(true);
      setIsFinished(false);
      
      // Disable previous options
      setMessages(prev => prev.map(msg => ({ ...msg, options: null })));
      
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Add custom user message
      const userMsg = {
        id: Date.now() + Math.random(),
        role: 'user',
        text: `Need Help with my order for **${item.medicine_name}** (Order ID: #${order._id.slice(-8).toUpperCase()})`,
        time
      };
      
      // Add custom bot message with order-specific options
      const botMsg = {
        id: Date.now() + Math.random(),
        role: 'bot',
        text: `Sure, I'd be happy to help you with your order for **${item.medicine_name}**.\n\nStatus: **${order.status.toUpperCase()}**\nPlaced on: **${new Date(order.placed_at || order.createdAt).toLocaleDateString('en-IN')}**\n\nWhat can I assist you with?`,
        time,
        options: [
          { label: 'Track Order', value: `track_order_${order._id}` },
          { label: 'Cancel Order', value: `cancel_order_${order._id}` },
          { label: 'Payment Query', value: `payment_query_${order._id}` },
          { label: 'Delivery Address', value: `address_query_${order._id}` },
          { label: 'Back to main menu', value: 'yes' }
        ]
      };
      
      setMessages(prev => [...prev, userMsg, botMsg]);
    };
    
    window.addEventListener('open-chatbot-help', handleOpenHelp);
    return () => window.removeEventListener('open-chatbot-help', handleOpenHelp);
  }, []);

  const addMessage = (role, text, options = null, data = null) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      role,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      options,
      data
    }]);
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: Date.now(),
        role: 'bot',
        text: 'Hi there! I am MediBot. How can I help you with MEDIPULSE today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options: initialOptions
      }
    ]);
    setIsFinished(false);
    setIsLoading(false);
    setInput('');
  };

  const handleOptionClick = async (option) => {
    if (isFinished) return;

    // Add user message for the selected option
    addMessage('user', option.label);

    // Disable all previous options (visual cue) by re-setting messages without options for previous ones
    setMessages(prev => prev.map(msg => ({ ...msg, options: null })));

    setIsLoading(true);

    // Simulate slight delay for natural feeling
    await new Promise(resolve => setTimeout(resolve, 600));

    // Handle order-specific flows (Meesho style)
    if (option.value.startsWith('track_order_')) {
      const orderId = option.value.replace('track_order_', '');
      try {
        const token = localStorage.getItem('userToken');
        const res = await fetch(`${API}/api/payment/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const order = data.orders?.find(o => o._id === orderId);
        if (order) {
          const estDate = new Date(order.placed_at || order.createdAt || Date.now());
          estDate.setDate(estDate.getDate() + 3);
          const formattedEstDate = estDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          addMessage('bot', `Your order status is **${order.status.toUpperCase()}**.\n\nEstimated delivery date: **${formattedEstDate}**.\n\nTracking timeline:\n- Placed at: ${new Date(order.placed_at || order.createdAt).toLocaleDateString('en-IN')}\n- Current status: ${order.status}`);
        } else {
          addMessage('bot', 'Sorry, I could not retrieve tracking details for this order. Please try again.');
        }
      } catch (err) {
        addMessage('bot', 'Failed to retrieve tracking. Please check your network connection.');
      }
      setTimeout(() => addMessage('bot', 'Do you have any other queries?', orderSupportYesNoOptions), 1000);
      setIsLoading(false);
      return;
    }

    if (option.value.startsWith('cancel_order_')) {
      const orderId = option.value.replace('cancel_order_', '');
      try {
        const token = localStorage.getItem('userToken');
        const res = await fetch(`${API}/api/payment/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const order = data.orders?.find(o => o._id === orderId);
        if (order) {
          if (['cancelled', 'shipped', 'out_for_delivery', 'delivered'].includes(order.status)) {
            addMessage('bot', `This order status is **${order.status}** and cannot be cancelled now.`);
          } else {
            const cancelRes = await fetch(`${API}/api/payment/update-order-status/${orderId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ status: 'cancelled' })
            });
            const cancelData = await cancelRes.json();
            if (cancelRes.ok && cancelData.success) {
              addMessage('bot', `Your order #${orderId.slice(-8).toUpperCase()} has been successfully **CANCELLED**.`);
              // Fire custom event to notify My Orders lists
              window.dispatchEvent(new CustomEvent('order-status-updated', { detail: { orderId, status: 'cancelled' } }));
            } else {
              addMessage('bot', cancelData.message || 'Failed to cancel the order. Please try from My Orders page.');
            }
          }
        } else {
          addMessage('bot', 'Order not found.');
        }
      } catch (err) {
        addMessage('bot', 'Failed to cancel order due to network issue.');
      }
      setTimeout(() => addMessage('bot', 'Do you have any other queries?', orderSupportYesNoOptions), 1000);
      setIsLoading(false);
      return;
    }

    if (option.value.startsWith('payment_query_')) {
      const orderId = option.value.replace('payment_query_', '');
      try {
        const token = localStorage.getItem('userToken');
        const res = await fetch(`${API}/api/payment/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const order = data.orders?.find(o => o._id === orderId);
        if (order) {
          addMessage('bot', `Payment details for order #${orderId.slice(-8).toUpperCase()}:\n\n- **Payment Mode:** ${order.payment_mode || 'UPI'}\n- **Payment Status:** ${order.payment_status || 'Paid'}\n- **Grand Total:** ₹${order.grand_total.toFixed(2)}\n\nIf you have been charged twice, please wait 24-48 hours for an automatic refund to your source account.`);
        } else {
          addMessage('bot', 'Could not retrieve payment info.');
        }
      } catch (err) {
        addMessage('bot', 'Failed to retrieve payment details.');
      }
      setTimeout(() => addMessage('bot', 'Do you have any other queries?', orderSupportYesNoOptions), 1000);
      setIsLoading(false);
      return;
    }

    if (option.value.startsWith('address_query_')) {
      const orderId = option.value.replace('address_query_', '');
      try {
        const token = localStorage.getItem('userToken');
        const res = await fetch(`${API}/api/payment/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const order = data.orders?.find(o => o._id === orderId);
        if (order && order.delivery_address) {
          const addr = order.delivery_address;
          addMessage('bot', `Your order will be delivered to:\n\n**${addr.street}, ${addr.city}, ${addr.state} - ${addr.zip_code}**\n\nNote: We cannot change the delivery address once the order is shipped.`);
        } else {
          addMessage('bot', 'No shipping address found.');
        }
      } catch (err) {
        addMessage('bot', 'Failed to retrieve shipping details.');
      }
      setTimeout(() => addMessage('bot', 'Do you have any other queries?', orderSupportYesNoOptions), 1000);
      setIsLoading(false);
      return;
    }

    if (option.value === 'yes') {
      addMessage('bot', 'Certainly. Please choose an option below or type your query directly, and I will assist you further.', initialOptions);
      setIsLoading(false);
      return;
    }

    if (option.value === 'no') {
      addMessage('bot', 'Thank you for chatting with MediBot! If you have any more questions in the future, feel free to ask. Have a great day!');
      setIsFinished(true);
      setIsLoading(false);
      return;
    }

    if (option.value === 'find_doctor') {
      addMessage('bot', 'Choose a category of doctor!', categoryOptions);
      setIsLoading(false);
      return;
    }

    if (option.value === 'view_appointments') {
      const token = localStorage.getItem('userToken');
      if (!token) {
        addMessage('bot', 'You are currently not logged in. Please [Login](/login) as a user/patient to view your appointments.');
      } else {
        const msgText = await fetchAndFormatAppointments(token);
        addMessage('bot', msgText);
      }
      setTimeout(() => addMessage('bot', 'Do you have some other query?', yesNoOptions), 1000);
      setIsLoading(false);
      return;
    }

    if (option.value === 'go_signup') {
      addMessage('bot', 'To sign up, click the **Signup** button in the top navigation bar of the homepage. If you are on the Login page, click **Create one free →** at the bottom of the card.');
      setTimeout(() => addMessage('bot', 'Do you have some other query?', yesNoOptions), 1000);
      setIsLoading(false);
      return;
    }

    if (option.value === 'go_pharmacy') {
      addMessage('bot', 'You can browse and buy medicines directly from our integrated Pharmacy. Navigate to the **Pharmacy** tab in the main navigation menu or sidebar.');
      setTimeout(() => addMessage('bot', 'Do you have some other query?', yesNoOptions), 1000);
      setIsLoading(false);
      return;
    }

    if (option.value === 'view_orders') {
      const token = localStorage.getItem('userToken');
      if (!token) {
        addMessage('bot', 'You are currently not logged in. Please [Login](/login) as a user/patient to view your orders.');
      } else {
        const msgText = await fetchAndFormatOrders(token);
        addMessage('bot', msgText);
      }
      setTimeout(() => addMessage('bot', 'Do you have any other query?', orderSupportYesNoOptions), 800);
      setIsLoading(false);
      return;
    }

    if (option.value === 'order_query_menu') {
      addMessage('bot', 'What is your query regarding?', orderQueryOptions);
      setIsLoading(false);
      return;
    }

    if (option.value === 'order_track') {
      addMessage('bot', 'Your order is on track for delivery. We have shipped the order and it is on track. You can view live shipment details anytime in [My Orders](/my-orders).');
      setTimeout(() => addMessage('bot', 'Do you have any other query?', orderSupportYesNoOptions), 800);
      setIsLoading(false);
      return;
    }

    if (option.value === 'order_cancel') {
      addMessage('bot', 'To cancel an item, please visit your [My Orders](/my-orders) section and select the cancel option before the order is packed.');
      setTimeout(() => addMessage('bot', 'Do you have any other query?', orderSupportYesNoOptions), 800);
      setIsLoading(false);
      return;
    }

    if (option.value === 'order_change_address') {
      addMessage('bot', "The address for your order can't be changed now as some of the items in your order are already packed.");
      setTimeout(() => addMessage('bot', 'Do you have any other query?', orderSupportYesNoOptions), 800);
      setIsLoading(false);
      return;
    }

    if (option.value === 'order_delivery_date') {
      addMessage('bot', 'Deliveries are scheduled automatically based on courier partner availability. Delivery dates are updated live on your order tracking page.');
      setTimeout(() => addMessage('bot', 'Do you have any other query?', orderSupportYesNoOptions), 800);
      setIsLoading(false);
      return;
    }

    if (option.value === 'go_about') {
      addMessage('bot', 'You can read more about our vision, values, stats, and founders on the [About Us](/about) page.');
      setTimeout(() => addMessage('bot', 'Do you have some other query?', yesNoOptions), 1000);
      setIsLoading(false);
      return;
    }

    if (categoryOptions.some(cat => cat.value === option.value)) {
      // User selected a category
      try {
        const res = await fetch(`${API}/doctor/active`);
        const data = await res.json();

        let doctorsData = [];
        if (res.ok && data.doctors) {
          const filtered = data.doctors.filter(d => d.specialization?.toLowerCase() === option.value.toLowerCase());
          doctorsData = filtered.slice(0, 3).map(doc => ({
            id: doc._id,
            name: `Dr. ${doc.first_name} ${doc.last_name}`,
            specialty: doc.specialization,
            image: (doc.profile_img && !doc.profile_img.includes('placeholder'))
              ? doc.profile_img
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.first_name)}+${encodeURIComponent(doc.last_name)}&background=0d9488&color=fff`
          }));
        }

        const roleDesc = `A ${option.label.toLowerCase()} is a medical specialist who focuses on specific health areas related to their field of study.`;
        addMessage('bot', roleDesc, null, { type: 'doctors', doctors: doctorsData });

        setTimeout(() => addMessage('bot', 'Do you have some other query?', yesNoOptions), 1000);
      } catch (err) {
        addMessage('bot', 'Sorry, I had trouble fetching doctors. Do you have some other query?', yesNoOptions);
      }
      setIsLoading(false);
      return;
    }

    // Query backend real-time for any other options (like book_appointment, sign_up, buy_medicine)
    try {
      const historyToSend = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        text: msg.text
      }));

      const res = await fetch(`${API}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: option.label,
          history: historyToSend
        })
      });

      const data = await res.json();
      if (res.ok) {
        addMessage('bot', data.reply);
      } else {
        addMessage('bot', data.message || 'Sorry, I am having trouble connecting right now.');
      }

      const isBooking = option.value === 'book_appointment' || option.label.toLowerCase().includes('appoint') || option.label.toLowerCase().includes('book');
      const isSignUp = option.value === 'sign_up' || option.label.toLowerCase().includes('sign up') || option.label.toLowerCase().includes('signup') || option.label.toLowerCase().includes('register');
      const isPharmacy = option.value === 'buy_medicine' || option.label.toLowerCase().includes('medicine') || option.label.toLowerCase().includes('pharmacy') || option.label.toLowerCase().includes('buy');
      const isAbout = option.value === 'about_medipulse' || option.label.toLowerCase().includes('about') || option.label.toLowerCase().includes('medipulse');

      if (isBooking) {
        setTimeout(() => addMessage('bot', 'How would you like to proceed with your booking?', bookingRelatedOptions), 1000);
      } else if (isSignUp) {
        setTimeout(() => addMessage('bot', 'Would you like to open the registration page?', signUpRelatedOptions), 1000);
      } else if (isPharmacy) {
        setTimeout(() => addMessage('bot', 'How would you like to proceed with the Pharmacy?', pharmacyRelatedOptions), 1000);
      } else if (isAbout) {
        setTimeout(() => addMessage('bot', 'What would you like to do next regarding MEDIPULSE information?', aboutRelatedOptions), 1000);
      } else {
        setTimeout(() => addMessage('bot', 'Do you have some other query?', yesNoOptions), 1000);
      }
    } catch (error) {
      addMessage('bot', 'Network error. Please try again later.');
      setTimeout(() => addMessage('bot', 'Do you have some other query?', yesNoOptions), 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || isFinished) return;

    const userText = input.trim();
    setInput('');
    addMessage('user', userText);

    // Clear options from previous bot message if user types
    setMessages(prev => prev.map(msg => ({ ...msg, options: null })));

    // Normalize text for quick checking
    const cleanText = userText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();

    // Check if the user typed confirmation to continue or end the chat
    if (['yes', 'yeah', 'yep', 'y', 'sure', 'yes please', 'continue'].includes(cleanText)) {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      addMessage('bot', 'Certainly. Please choose an option below or type your query directly, and I will assist you further.', initialOptions);
      setIsLoading(false);
      return;
    }

    if (['no', 'nope', 'n', 'no thanks', 'exit', 'stop', 'bye'].includes(cleanText)) {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      addMessage('bot', 'Thank you for chatting with MediBot! If you have any more questions in the future, feel free to ask. Have a great day!');
      setIsFinished(true);
      setIsLoading(false);
      return;
    }

    // Check if user is asking to view appointments or orders
    const isViewApptIntent = (cleanText.includes('appointment') || cleanText.includes('appointments')) && 
      (cleanText.includes('status') || cleanText.includes('my') || cleanText.includes('show') || 
       cleanText.includes('view') || cleanText.includes('list') || cleanText.includes('check') || 
       cleanText.includes('get') || cleanText.includes('track') || cleanText.includes('tell') ||
       cleanText.includes('about') || cleanText.includes('detail') || cleanText.includes('info'));
       
    const isViewOrderIntent = (cleanText.includes('order') || cleanText.includes('purchase')) && 
      (cleanText.includes('status') || cleanText.includes('my') || cleanText.includes('show') || 
       cleanText.includes('view') || cleanText.includes('list') || cleanText.includes('check') || 
       cleanText.includes('get') || cleanText.includes('track') || cleanText.includes('deliver'));

    if (isViewApptIntent) {
      setIsLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) {
        addMessage('bot', 'You are currently not logged in. Please [Login](/login) as a user/patient to view your appointments.');
      } else {
        const msgText = await fetchAndFormatAppointments(token);
        addMessage('bot', msgText);
      }
      setTimeout(() => addMessage('bot', 'Do you have some other query?', yesNoOptions), 1000);
      setIsLoading(false);
      return;
    }

    if (isViewOrderIntent) {
      setIsLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) {
        addMessage('bot', 'You are currently not logged in. Please [Login](/login) as a user/patient to view your orders.');
      } else {
        const msgText = await fetchAndFormatOrders(token);
        addMessage('bot', msgText);
      }
      setTimeout(() => addMessage('bot', 'Do you have any other query?', orderSupportYesNoOptions), 800);
      setIsLoading(false);
      return;
    }

    // Symptom detection keywords
    const symptomKeywords = ['fever', 'cough', 'cold', 'flu', 'headache', 'pain', 'stomach', 'vomit', 'chest', 'symptom', 'weakness', 'injury'];
    const isSymptomQuery = symptomKeywords.some(keyword => cleanText.includes(keyword));

    setIsLoading(true);

    try {
      const historyToSend = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        text: msg.text
      }));

      const res = await fetch(`${API}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          history: historyToSend
        })
      });

      const data = await res.json();
      if (res.ok) {
        addMessage('bot', data.reply);
      } else {
        addMessage('bot', data.message || 'Sorry, I am having trouble connecting right now.');
      }

      if (isSymptomQuery) {
        try {
          const docRes = await fetch(`${API}/doctor/active`);
          const docData = await docRes.json();
          let gpDoctors = [];
          if (docRes.ok && docData.doctors) {
            const filtered = docData.doctors.filter(d => d.specialization?.toLowerCase() === 'general physician');
            gpDoctors = filtered.slice(0, 3).map(doc => ({
              id: doc._id,
              name: `Dr. ${doc.first_name} ${doc.last_name}`,
              specialty: doc.specialization,
              image: (doc.profile_img && !doc.profile_img.includes('placeholder'))
                ? doc.profile_img
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.first_name)}+${encodeURIComponent(doc.last_name)}&background=0d9488&color=fff`
            }));
          }

          if (gpDoctors.length > 0) {
            addMessage('bot', 'We have expert General Physicians available at MEDIPULSE to consult. Here are some of our specialists:', null, { type: 'doctors', doctors: gpDoctors });
          }
        } catch (docErr) {
          console.error("Failed to fetch GP doctors:", docErr);
        }

        setTimeout(() => addMessage('bot', 'How would you like to proceed with your booking?', bookingRelatedOptions), 1500);
      } else {
        const isBooking = userText.toLowerCase().includes('appoint') || userText.toLowerCase().includes('book');
        const isSignUp = userText.toLowerCase().includes('sign up') || userText.toLowerCase().includes('signup') || userText.toLowerCase().includes('register');
        const isPharmacy = userText.toLowerCase().includes('medicine') || userText.toLowerCase().includes('pharmacy') || userText.toLowerCase().includes('buy');
        const isAbout = userText.toLowerCase().includes('about') || userText.toLowerCase().includes('medipulse');

        if (isBooking) {
          setTimeout(() => addMessage('bot', 'How would you like to proceed with your booking?', bookingRelatedOptions), 1000);
        } else if (isSignUp) {
          setTimeout(() => addMessage('bot', 'Would you like to open the registration page?', signUpRelatedOptions), 1000);
        } else if (isPharmacy) {
          setTimeout(() => addMessage('bot', 'How would you like to proceed with the Pharmacy?', pharmacyRelatedOptions), 1000);
        } else if (isAbout) {
          setTimeout(() => addMessage('bot', 'What would you like to do next regarding MEDIPULSE information?', aboutRelatedOptions), 1000);
        } else {
          setTimeout(() => addMessage('bot', 'Do you have some other query?', yesNoOptions), 1000);
        }
      }
    } catch (error) {
      addMessage('bot', 'Network error. Please try again later.');
      setTimeout(() => addMessage('bot', 'Do you have some other query?', yesNoOptions), 1000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-widget-container">
      {!isOpen && (
        <button className="chatbot-toggle-btn" onClick={() => setIsOpen(true)}>
          <img src="/medibot-avatar.png" alt="Chat" className="chatbot-avatar-img" />
        </button>
      )}

      {isOpen && (
        <div className={`chatbot-window ${isExpanded ? 'expanded' : ''}`}>
          <div className="chatbot-header">
            <div className="chatbot-header-avatar">
              <img src="/medibot-avatar.png" alt="MediBot" />
            </div>
            <div className="chatbot-header-info">
              <h3 className="chatbot-header-title">MediBot</h3>
              <p className="chatbot-header-subtitle">Online • Replies instantly</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className="chatbot-close-btn" onClick={handleNewChat} title="Start New Chat">
                <RotateCcw size={16} />
              </button>
              <button className="chatbot-close-btn" onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "Minimize" : "Expand"}>
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button className="chatbot-close-btn" onClick={() => setIsOpen(false)} title="Close">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble-container ${msg.role}`}>
                <div className="chat-bubble">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>

                  {msg.data && msg.data.type === 'doctors' && (
                    <div className="chat-doctors-list">
                      {msg.data.doctors.length > 0 ? msg.data.doctors.map(doc => (
                        <Link to="/doctors" key={doc.id} className="chat-doctor-card">
                          <img src={doc.image} alt={doc.name} className="chat-doctor-img" />
                          <div className="chat-doctor-info">
                            <h4 className="chat-doctor-name">{doc.name}</h4>
                            <p className="chat-doctor-specialty">{doc.specialty}</p>
                          </div>
                        </Link>
                      )) : (
                        <p style={{ fontSize: '12px', marginTop: '8px', color: '#64748b' }}>No doctors available right now.</p>
                      )}
                    </div>
                  )}

                  {msg.options && (
                    <div className={msg.options.length <= 2 ? "chat-options-row" : "chat-options"}>
                      {msg.options.map(opt => (
                        <button
                          key={opt.value}
                          className="chat-option-btn"
                          onClick={() => handleOptionClick(opt)}
                          disabled={isLoading || isFinished}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="chat-time">{msg.time}</div>
              </div>
            ))}

            {isLoading && (
              <div className="chat-bubble-container bot">
                <div className="chat-bubble" style={{ padding: '16px' }}>
                  <div className="chat-typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {isFinished && (
            <div style={{ padding: '10px 16px', background: '#f0fdfa', borderTop: '1px solid #ccfbf1', textAlign: 'center' }}>
              <button
                onClick={handleNewChat}
                style={{
                  background: '#0d9488',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(13,148,136,0.3)'
                }}
              >
                <RotateCcw size={14} /> Start New Chat
              </button>
            </div>
          )}

          <form className="chatbot-input-area" onSubmit={handleSend}>
            <div className="chatbot-input-wrapper">
              <input
                type="text"
                className="chatbot-input"
                placeholder={isFinished ? "Chat ended. Click 'Start New Chat' to continue." : "Type your message..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading || isFinished}
              />
              <button
                type="submit"
                className="chatbot-send-btn"
                disabled={!input.trim() || isLoading || isFinished}
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
