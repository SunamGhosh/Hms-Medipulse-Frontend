import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Maximize2, Minimize2 } from 'lucide-react';
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

  const handleOptionClick = async (option) => {
    if (isFinished) return;

    // Add user message for the selected option
    addMessage('user', option.label);

    // Disable all previous options (visual cue) by re-setting messages without options for previous ones
    setMessages(prev => prev.map(msg => ({ ...msg, options: null })));

    setIsLoading(true);
    
    // Simulate slight delay for natural feeling
    await new Promise(resolve => setTimeout(resolve, 600));
    
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
      addMessage('bot', 'To view your scheduled consultations, simply click on the **Appointments** link in the left navigation sidebar of your dashboard.');
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
      addMessage('bot', 'To check the status of your orders, click on **My Orders** in the left sidebar menu of your user dashboard.');
      setTimeout(() => addMessage('bot', 'Do you have some other query?', yesNoOptions), 1000);
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
            <div style={{ display: 'flex', gap: '8px' }}>
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

          <form className="chatbot-input-area" onSubmit={handleSend}>
            <div className="chatbot-input-wrapper">
              <input 
                type="text" 
                className="chatbot-input" 
                placeholder="Type your message..." 
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
