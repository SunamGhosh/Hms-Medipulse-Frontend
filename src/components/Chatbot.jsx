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
  { label: 'Buy a medicine', value: 'buy_medicine' }
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
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
    
    if (option.value === 'book_appointment') {
      const text = `Hello! I can certainly help you with that. Booking an appointment at MEDIPULSE is a straightforward process. Here are the steps:\n1. Login to your MEDIPULSE account.\n2. Click on the 'Book Appointment' button.\n3. Select or Add the patient for whom the appointment is being booked.\n4. Choose your preferred doctor or specialist.\n5. Pick a convenient date and time, select the mode of consultation (Online or In-person), and you can also add any symptoms you're experiencing.\n6. Finally, confirm your appointment.\n\nIt's that simple! Let me know if you have any other questions.`;
      addMessage('bot', text);
      setTimeout(() => addMessage('bot', 'Do you have some other query?', yesNoOptions), 500);
    } else if (option.value === 'sign_up') {
      const text = `Welcome to MEDIPULSE!\nSigning up is a straightforward, 3-step process:\n1. Click the 'Signup' button.\n2. Verify your email address using the One-Time Password (OTP) sent to you.\n3. Fill in your details such as your name, phone number, and preferred password.\n\nOnce done, you'll have access to all our services!`;
      addMessage('bot', text);
      setTimeout(() => addMessage('bot', 'Do you have some other query?', yesNoOptions), 500);
    } else if (option.value === 'find_doctor') {
      addMessage('bot', 'Choose a category of doctor!', categoryOptions);
    } else if (option.value === 'buy_medicine') {
      const text = `To buy medicine, simply go to the 'Pharmacy' page on our website. You can browse medicines categorized by type, add them to your cart, and proceed to checkout for delivery.`;
      addMessage('bot', text);
      setTimeout(() => addMessage('bot', 'Do you have any other query?', yesNoOptions), 500);
    } else if (categoryOptions.some(cat => cat.value === option.value)) {
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
        
        setTimeout(() => addMessage('bot', 'Do you have some other query?', yesNoOptions), 500);
      } catch (err) {
        addMessage('bot', 'Sorry, I had trouble fetching doctors. Do you have some other query?', yesNoOptions);
      }
    } else if (option.value === 'yes') {
      addMessage('bot', 'Certainly. Please choose an option below or type your query directly, and I will assist you further.', initialOptions);
    } else if (option.value === 'no') {
      addMessage('bot', 'Thank you for chatting with MediBot! If you have any more questions in the future, feel free to ask. Have a great day!');
      setIsFinished(true);
    }
    
    setIsLoading(false);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || isFinished) return;

    const userText = input.trim();
    setInput('');
    addMessage('user', userText);
    
    // Clear options from previous bot message if user types
    setMessages(prev => prev.map(msg => ({ ...msg, options: null })));

    setIsLoading(true);

    try {
      const res = await fetch(`${API}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText })
      });
      
      const data = await res.json();
      addMessage('bot', res.ok ? data.reply : (data.message || 'Sorry, I am having trouble connecting right now.'));
    } catch (error) {
      addMessage('bot', 'Network error. Please try again later.');
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
