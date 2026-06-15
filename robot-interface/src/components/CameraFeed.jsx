import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Typography, Box } from '@mui/material';
import { Warning, SignalWifiOff } from '@mui/icons-material';

const raw = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/viewer';
const WS_URL = raw.startsWith('ws://') && !raw.includes('localhost')
  ? raw.replace('ws://', 'wss://')
  : raw;

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

const CameraFeed = forwardRef(({ className, style }, ref) => {
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const mountedRef = useRef(false);  // guard against StrictMode double-mount
  const [status, setStatus] = useState('connecting');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // StrictMode calls useEffect twice — only run once
    if (mountedRef.current) return;
    mountedRef.current = true;

    connect();
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  const cleanup = () => {
    clearTimeout(reconnectRef.current);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent reconnect firing on intentional close
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const connect = () => {
    if (!mountedRef.current) return;

    // Don't open a second connection if one is already open
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    cleanup();  // clean up any previous connection first

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    pc.ontrack = (event) => {
      if (videoRef.current && mountedRef.current) {
        videoRef.current.srcObject = event.streams[0];
        setStatus('live');
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ice-viewer', candidate: e.candidate }));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('PC state:', pc.connectionState);
      if (pc.connectionState === 'failed') {
        // ICE failed — trigger a full reconnect
        scheduleReconnect();
      }
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ping') return;  // ignore keepalive pings

      if (data.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: 'answer', answer: pc.localDescription }));
      }

      else if (data.type === 'ice-broadcaster') {
        if (data.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.warn('ICE candidate error:', e);
          }
        }
      }
    };

    ws.onopen = () => {
      console.log('Viewer WS connected');
    };

    ws.onclose = (e) => {
      console.log('Viewer WS closed:', e.code);
      if (mountedRef.current) {
        setStatus('connecting');
        scheduleReconnect();
      }
    };

    ws.onerror = () => {
      console.log('Viewer WS error');
    };
  };

  const scheduleReconnect = () => {
    clearTimeout(reconnectRef.current);
    reconnectRef.current = setTimeout(() => {
      if (mountedRef.current) connect();
    }, 3000);
  };

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