import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  MonitorUp, MessageSquare, Stethoscope, Clock
} from 'lucide-react';
import './VideoCall.css';

const SOCKET_URL = import.meta.env.VITE_URL?.replace('/api', '') || 'http://localhost:5000';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const VideoCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // Refs
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const otherUserRef = useRef(null);

  // State
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting | connected | waiting | error
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const timerRef = useRef(null);

  // Format timer
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Create Peer Connection ──
  const createPeerConnection = useCallback((userId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // When we receive remote tracks
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setIsConnected(true);
      setConnectionStatus('connected');
      // Start call timer
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }
    };

    // Send ICE candidates to the other peer
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          to: userId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setConnectionStatus('error');
        setIsConnected(false);
      }
    };

    return pc;
  }, []);

  // ── Handle Call (second user creates offer) ──
  const handleOtherUser = useCallback(async (userId) => {
    otherUserRef.current = userId;
    const pc = createPeerConnection(userId);
    peerRef.current = pc;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit('offer', { to: userId, offer });
      setConnectionStatus('connecting');
    } catch (err) {
      console.error('Error creating offer:', err);
      setConnectionStatus('error');
    }
  }, [createPeerConnection]);

  // ── Handle Incoming Offer ──
  const handleOffer = useCallback(async ({ from, offer }) => {
    otherUserRef.current = from;
    const pc = createPeerConnection(from);
    peerRef.current = pc;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit('answer', { to: from, answer });
    } catch (err) {
      console.error('Error handling offer:', err);
      setConnectionStatus('error');
    }
  }, [createPeerConnection]);

  // ── Handle Incoming Answer ──
  const handleAnswer = useCallback(async ({ answer }) => {
    try {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  }, []);

  // ── Handle ICE Candidate ──
  const handleIceCandidate = useCallback(async ({ candidate }) => {
    try {
      if (peerRef.current && candidate) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  }, []);

  // ── Initialize ──
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Get local media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Connect to signaling server
        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('[VideoCall] Socket connected');
          socket.emit('join-room', roomId);
          setConnectionStatus('waiting');
        });

        socket.on('other-user', handleOtherUser);
        socket.on('user-joined', (userId) => {
          // Don't need to do anything, the new user will send an offer
          console.log('[VideoCall] User joined:', userId);
        });
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);

        socket.on('user-left', () => {
          setIsConnected(false);
          setConnectionStatus('waiting');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        });

        socket.on('room-full', () => {
          setConnectionStatus('error');
          toast.error('This call room is already full (2 participants max).');
        });

      } catch (err) {
        console.error('Error accessing camera/mic:', err);
        setConnectionStatus('error');
      }
    };

    init();

    return () => {
      mounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerRef.current) peerRef.current.close();
      if (socketRef.current) socketRef.current.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomId, handleOtherUser, handleOffer, handleAnswer, handleIceCandidate]);

  // ── Controls ──
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  const endCall = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (peerRef.current) peerRef.current.close();
    if (socketRef.current) socketRef.current.disconnect();
    if (timerRef.current) clearInterval(timerRef.current);

    // If meeting was started by doctor, mark call completed on backend to stamp meet_time_end and calculate meet_time
    const doctorToken = localStorage.getItem('doctorToken') || sessionStorage.getItem('doctorToken');
    const token = doctorToken || localStorage.getItem('token') || sessionStorage.getItem('token');
    const cleanApptId = roomId ? roomId.replace('MediPulse_', '').trim() : '';

    if (cleanApptId && token) {
      try {
        const API = import.meta.env.VITE_URL || 'http://localhost:5000/api';
        await fetch(`${API}/appointment/doctor/${cleanApptId}/call-complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error('Call completion sync error:', err);
      }
    }

    navigate(-1);
  };

  return (
    <div className="vc-container">
      {/* ── Top Bar ── */}
      <div className="vc-topbar">
        <div className="vc-topbar-left">
          <div className="vc-logo">
            <Stethoscope size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <div className="vc-room-info">
            <h2>MediPulse Video Consultation</h2>
            <p>Room: {roomId}</p>
          </div>
        </div>
        {isConnected && (
          <div className="vc-timer">
            <div className="vc-timer-dot" />
            <Clock size={14} />
            {formatTime(callDuration)}
          </div>
        )}
      </div>

      {/* ── Connection Status ── */}
      {connectionStatus === 'connecting' && (
        <div className="vc-status connecting">Connecting…</div>
      )}
      {connectionStatus === 'connected' && (
        <div className="vc-status connected">Connected ✓</div>
      )}
      {connectionStatus === 'error' && (
        <div className="vc-status error">Connection issue — please check your network</div>
      )}

      {/* ── Video Area ── */}
      <div className="vc-video-area">
        {/* Remote Video (full screen) */}
        <video
          ref={remoteVideoRef}
          className="vc-remote-video"
          autoPlay
          playsInline
        />

        {/* Waiting overlay */}
        {!isConnected && (
          <div className="vc-waiting">
            <div className="vc-waiting-avatar">
              <Stethoscope size={40} color="#fff" strokeWidth={2} />
            </div>
            <h2>Waiting for the other participant…</h2>
            <p>Share this call link or wait for them to join</p>
            <div className="vc-waiting-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        {/* Local Video (PiP) */}
        <div className="vc-local-video-wrapper">
          <video
            ref={localVideoRef}
            className="vc-local-video"
            autoPlay
            playsInline
            muted
          />
          {isCameraOff && (
            <div className="vc-camera-off">
              <div className="vc-camera-off-icon">
                <VideoOff size={24} />
              </div>
            </div>
          )}
          <div className="vc-local-label">You</div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="vc-controls">
        <button
          className={`vc-ctrl-btn ${isMuted ? 'vc-ctrl-active' : 'vc-ctrl-default'}`}
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          <span className="vc-ctrl-label">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        <button
          className={`vc-ctrl-btn ${isCameraOff ? 'vc-ctrl-active' : 'vc-ctrl-default'}`}
          onClick={toggleCamera}
          title={isCameraOff ? 'Turn On Camera' : 'Turn Off Camera'}
        >
          {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
          <span className="vc-ctrl-label">{isCameraOff ? 'Camera On' : 'Camera Off'}</span>
        </button>

        <button
          className="vc-ctrl-btn vc-ctrl-end"
          onClick={endCall}
          title="End Call"
        >
          <PhoneOff size={24} />
          <span className="vc-ctrl-label">End Call</span>
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
