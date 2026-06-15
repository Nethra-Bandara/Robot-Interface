import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Typography, Box } from '@mui/material';
import { Warning, SignalWifiOff } from '@mui/icons-material';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// In production, change to wss://your-backend-domain/ws/viewer
const raw = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/viewer';
const WS_URL = raw.replace(/^ws:\/\//, 'wss://');
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];
// ──────────────────────────────────────────────────────────────────────────────

const CameraFeed = forwardRef(({ className, style }, ref) => {
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const [status, setStatus] = useState('connecting'); // connecting | live | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    connect();
    return () => cleanup();
  }, []);

  
  const cleanup = () => {
    clearTimeout(reconnectRef.current);
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
  };

  const reconnectRef = useRef(null);

  const connect = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onclose = () => {
    setStatus('connecting');
    reconnectRef.current = setTimeout(connect, 3000);}

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // When remote track arrives — this is the laptop's webcam feed
    pc.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
        setStatus('live');
      }
    };

    // Send our ICE candidates to the broadcaster via server
    pc.onicecandidate = (e) => {
      if (e.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ice-viewer', candidate: e.candidate }));
      }
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'offer') {
        // Received broadcaster's offer → answer it
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: 'answer', answer: pc.localDescription }));
      }

      else if (data.type === 'ice-broadcaster') {
        // Received broadcaster's ICE candidate
        if (data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      }
    };

    ws.onclose = () => {
      if (status !== 'live') setStatus('error');
      setErrorMsg('Signaling server disconnected. Is the backend running?');
    };

    ws.onerror = () => {
      setStatus('error');
      setErrorMsg('Cannot connect to signaling server.');
    };
  };

  // Capture frame for screenshot feature (unchanged)
  useImperativeHandle(ref, () => ({
    capture: () => {
      if (!videoRef.current) return null;
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.82);
    }
  }));

  if (status === 'error') {
    return (
      <Box className={className} style={{ ...style, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a0000', color: '#ff5252' }}>
        <Warning sx={{ fontSize: 60, mb: 1 }} />
        <Typography variant="h6">STREAM ERROR</Typography>
        <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', px: 2 }}>{errorMsg}</Typography>
      </Box>
    );
  }

  if (status === 'connecting') {
    return (
      <Box className={className} style={{ ...style, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#555' }}>
        <SignalWifiOff sx={{ fontSize: 60, mb: 1 }} />
        <Typography>Waiting for broadcaster...</Typography>
      </Box>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={className}
      style={{ ...style, objectFit: 'cover' }}
    />
  );
});

export default CameraFeed;