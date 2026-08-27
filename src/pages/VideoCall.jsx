import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Stethoscope, Clock, RefreshCw, AlertTriangle
} from 'lucide-react';
import './VideoCall.css';

const SOCKET_URL = import.meta.env.VITE_URL?.replace('/api', '') || 'http://localhost:5000';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
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
  const iceCandidatesQueueRef = useRef([]);

  // State
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting | connected | waiting | error
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [hasMediaPermissionError, setHasMediaPermissionError] = useState(false);
  const timerRef = useRef(null);

  // Format timer
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Create Synthetic Fallback Stream (Video + Silent Audio) ──
  const createSyntheticStream = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Camera Permission Denied / Muted', 320, 240);

    const canvasStream = canvas.captureStream(10);
    const videoTrack = canvasStream.getVideoTracks()[0];

    let audioTrack;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const osc = audioCtx.createOscillator();
        const dst = audioCtx.createMediaStreamDestination();
        osc.connect(dst);
        osc.start();
        audioTrack = dst.stream.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = false;
      }
    } catch (e) {
      console.warn('[VideoCall] Could not create synthetic audio track:', e);
    }

    const tracks = [videoTrack];
    if (audioTrack) tracks.push(audioTrack);
    return new MediaStream(tracks);
  }, []);

  // ── Flush Queued ICE Candidates ──
  const processIceQueue = useCallback(async () => {
    if (peerRef.current && peerRef.current.remoteDescription && iceCandidatesQueueRef.current.length > 0) {
      console.log(`[VideoCall] Flushing ${iceCandidatesQueueRef.current.length} queued ICE candidates`);
      for (const candidate of iceCandidatesQueueRef.current) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('[VideoCall] Error adding queued ICE candidate:', e);
        }
      }
      iceCandidatesQueueRef.current = [];
    }
  }, []);

  // ── Create Peer Connection ──
  const createPeerConnection = useCallback((userId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Force bi-directional audio & video transceivers to receive remote stream even if local media is denied/synthetic
    try {
      pc.addTransceiver('video', { direction: 'sendrecv' });
      pc.addTransceiver('audio', { direction: 'sendrecv' });
    } catch (e) {
      console.warn('[VideoCall] Could not add transceivers:', e);
    }

    // Add local tracks to the connection
    if (localStreamRef.current) {
      const senders = pc.getSenders();
      localStreamRef.current.getTracks().forEach((track) => {
        const sender = senders.find(s => s.track && s.track.kind === track.kind) || senders.find(s => !s.track);
        if (sender) {
          sender.replaceTrack(track).catch(err => console.warn('replaceTrack error:', err));
        } else {
          pc.addTrack(track, localStreamRef.current);
        }
      });
    }

    // When we receive remote tracks
    pc.ontrack = (event) => {
      console.log('[VideoCall] Received remote track:', event.track?.kind, event.streams);
      if (remoteVideoRef.current) {
        if (event.streams && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        } else {
          let inboundStream = remoteVideoRef.current.srcObject;
          if (!inboundStream || !(inboundStream instanceof MediaStream)) {
            inboundStream = new MediaStream();
            remoteVideoRef.current.srcObject = inboundStream;
          }
          inboundStream.addTrack(event.track);
        }
        remoteVideoRef.current.play().catch(err => console.warn('Remote video play error:', err));
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
      console.log('[VideoCall] ICE Connection State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setIsConnected(true);
        setConnectionStatus('connected');
      } else if (pc.iceConnectionState === 'checking') {
        setConnectionStatus('connecting');
      } else if (pc.iceConnectionState === 'disconnected') {
        console.warn('[VideoCall] ICE Connection disconnected, attempting auto-reconnect...');
        setConnectionStatus('connecting');
      } else if (pc.iceConnectionState === 'failed') {
        console.warn('[VideoCall] ICE Connection failed.');
        if (pc.restartIce) {
          pc.restartIce();
        } else {
          setConnectionStatus('error');
          setIsConnected(false);
        }
      }
    };

    return pc;
  }, []);

  // ── Handle Call (second user creates offer) ──
  const handleOtherUser = useCallback(async (userId) => {
    console.log('[VideoCall] Initializing offer for other user:', userId);
    otherUserRef.current = userId;
    const pc = createPeerConnection(userId);
    peerRef.current = pc;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit('offer', { to: userId, offer });
      setConnectionStatus('connecting');
    } catch (err) {
      console.error('[VideoCall] Error creating offer:', err);
      setConnectionStatus('error');
    }
  }, [createPeerConnection]);

  // ── Handle Incoming Offer ──
  const handleOffer = useCallback(async ({ from, offer }) => {
    console.log('[VideoCall] Received offer from:', from);
    otherUserRef.current = from;
    const pc = createPeerConnection(from);
    peerRef.current = pc;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await processIceQueue();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current?.emit('answer', { to: from, answer });
    } catch (err) {
      console.error('[VideoCall] Error handling offer:', err);
      setConnectionStatus('error');
    }
  }, [createPeerConnection, processIceQueue]);

  // ── Handle Incoming Answer ──
  const handleAnswer = useCallback(async ({ answer }) => {
    console.log('[VideoCall] Received answer');
    try {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        await processIceQueue();
      }
    } catch (err) {
      console.error('[VideoCall] Error handling answer:', err);
    }
  }, [processIceQueue]);

  // ── Handle ICE Candidate ──
  const handleIceCandidate = useCallback(async ({ candidate }) => {
    try {
      if (!candidate) return;
      if (peerRef.current && peerRef.current.remoteDescription && peerRef.current.remoteDescription.type) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        iceCandidatesQueueRef.current.push(candidate);
      }
    } catch (err) {
      console.error('[VideoCall] Error adding ICE candidate:', err);
    }
  }, []);

  // ── Re-request Camera & Microphone Permissions ──
  const requestMediaPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      if (peerRef.current) {
        const senders = peerRef.current.getSenders();
        stream.getTracks().forEach(track => {
          const sender = senders.find(s => s.track && s.track.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track);
          } else {
            peerRef.current.addTrack(track, stream);
          }
        });
      }
      setHasMediaPermissionError(false);
      setIsCameraOff(false);
      setIsMuted(false);
      toast.success('Camera and microphone enabled successfully!');
    } catch (err) {
      toast.error('Permission still denied. Please click the camera icon in browser address bar to allow access.');
    }
  };

  // ── Manual Re-Init connection retry ──
  const retryConnection = () => {
    setConnectionStatus('connecting');
    if (socketRef.current) {
      socketRef.current.emit('join-room', roomId);
    }
  };

  // ── Initialize ──
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (mediaErr) {
          console.warn('[VideoCall] Audio+Video failed, trying audio-only fallback...', mediaErr);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            toast.info('Camera not available or denied. Joined in audio-only mode.');
            setIsCameraOff(true);
          } catch (audioErr) {
            console.warn('[VideoCall] Permission denied for audio+video, creating synthetic stream...', audioErr);
            setHasMediaPermissionError(true);
            toast.error('Camera/Microphone permission denied. Joined in View-Only Mode.');
            stream = createSyntheticStream();
            setIsCameraOff(true);
            setIsMuted(true);
          }
        }

        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Connect to signaling server with auto-reconnect
        const socket = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 20,
          reconnectionDelay: 1000
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('[VideoCall] Socket connected:', socket.id);
          socket.emit('join-room', roomId);
          setConnectionStatus('waiting');
        });

        socket.on('connect_error', (err) => {
          console.warn('[VideoCall] Socket connection error:', err);
        });

        socket.on('other-user', handleOtherUser);
        socket.on('user-joined', (userId) => {
          console.log('[VideoCall] User joined:', userId);
        });
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);

        socket.on('user-left', () => {
          console.log('[VideoCall] Other user left');
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

        socket.on('call-ended', ({ isDoctor }) => {
          if (isDoctor) {
            toast.success('Doctor has ended the video consultation meeting. The call is completed.');
            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach((t) => t.stop());
            }
            if (peerRef.current) peerRef.current.close();
            if (socketRef.current) socketRef.current.disconnect();
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeout(() => navigate(-1), 1200);
          } else {
            toast.info('The other participant left the call.');
          }
        });

        socket.on('room-full', () => {
          setConnectionStatus('error');
          toast.error('This call room is already full (2 participants max).');
        });

      } catch (err) {
        console.error('[VideoCall] Unexpected init error:', err);
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
  }, [roomId, createSyntheticStream, handleOtherUser, handleOffer, handleAnswer, handleIceCandidate, navigate]);

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
    const doctorToken = localStorage.getItem('doctorToken') || sessionStorage.getItem('doctorToken');
    const isDoctor = Boolean(doctorToken);

    if (socketRef.current && roomId) {
      socketRef.current.emit('end-call', { roomId, isDoctor });
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (peerRef.current) peerRef.current.close();
    if (socketRef.current) socketRef.current.disconnect();
    if (timerRef.current) clearInterval(timerRef.current);

    const token = doctorToken || localStorage.getItem('token') || sessionStorage.getItem('token');
    const cleanApptId = roomId ? roomId.replace('MediPulse_', '').trim() : '';

    if (isDoctor && cleanApptId && token) {
      try {
        const API = import.meta.env.VITE_URL || 'http://localhost:5000/api';
        await fetch(`${API}/appointment/doctor/${cleanApptId}/call-complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        toast.success('Consultation meeting ended. Status updated to Completed.');
      } catch (err) {
        console.error('Call completion sync error:', err);
      }
    } else if (!isDoctor) {
      toast.info('You left the video call. You can rejoin anytime while doctor\'s meet is live.');
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

      {/* ── Permission Denied Alert Bar ── */}
      {hasMediaPermissionError && (
        <div style={{
          position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 40, background: 'rgba(220, 38, 38, 0.95)', color: '#ffffff',
          padding: '12px 20px', borderRadius: '14px', display: 'flex', alignItems: 'center',
          gap: '14px', boxShadow: '0 8px 25px rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
          maxWidth: '92%', flexWrap: 'wrap'
        }}>
          <AlertTriangle size={20} color="#ffffff" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '13px', lineHeight: '1.4', flex: 1 }}>
            <strong>Camera / Microphone Access Blocked by Browser:</strong> Click 🔒 icon next to URL in address bar & set Camera & Mic to <strong>"Allow"</strong>.
          </div>
          <button
            onClick={requestMediaPermission}
            style={{
              background: '#ffffff', color: '#dc2626', border: 'none',
              borderRadius: '8px', padding: '7px 16px', fontSize: '12px',
              fontWeight: 800, cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            Allow & Enable Camera / Mic
          </button>
        </div>
      )}

      {/* ── Connection Status ── */}
      {connectionStatus === 'connecting' && (
        <div className="vc-status connecting">Connecting to call server…</div>
      )}
      {connectionStatus === 'connected' && (
        <div className="vc-status connected">Connected ✓</div>
      )}
      {connectionStatus === 'error' && (
        <div className="vc-status error" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>Connection issue — please check your network</span>
          <button onClick={retryConnection} style={{ background: '#fff', color: '#dc2626', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <RefreshCw size={12} /> Retry
          </button>
        </div>
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
            <p>Share this call room link or wait for the doctor / patient to join</p>
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
