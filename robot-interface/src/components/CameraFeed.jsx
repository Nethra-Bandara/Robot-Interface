import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Typography, Box } from '@mui/material';
import { Warning, SignalWifiOff } from '@mui/icons-material';

const raw = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/viewer';
const WS_URL = raw.startsWith('ws://') && !raw.includes('localhost')
  ? raw.replace('ws://', 'wss://')
  : raw;

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
        urls: "turn:global.relay.metered.ca:80",
        username: "eb316b848a7a2a268f409f3e",
        credential: "FzXzeTEot3tpT4Ab",
      },
      {
        urls: "turn:global.relay.metered.ca:80?transport=tcp",
        username: "eb316b848a7a2a268f409f3e",
        credential: "FzXzeTEot3tpT4Ab",
      },
      {
        urls: "turn:global.relay.metered.ca:443",
        username: "eb316b848a7a2a268f409f3e",
        credential: "FzXzeTEot3tpT4Ab",
      },
      {
        urls: "turns:global.relay.metered.ca:443?transport=tcp",
        username: "eb316b848a7a2a268f409f3e",
        credential: "FzXzeTEot3tpT4Ab",
      },
];

const CameraFeed = forwardRef(({ className, style }, ref) => {
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const mountedRef = useRef(false);
  const [status, setStatus] = useState('connecting');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
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
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const scheduleReconnect = () => {
    clearTimeout(reconnectRef.current);
    reconnectRef.current = setTimeout(() => {
      if (mountedRef.current) connect();
    }, 3000);
  };

  const connect = () => {
    if (!mountedRef.current) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    // Close existing WS without triggering reconnect
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    // Only create a new PC if we don't have one or it's failed/closed
    if (
      !pcRef.current ||
      pcRef.current.connectionState === 'failed' ||
      pcRef.current.connectionState === 'closed'
    ) {
      if (pcRef.current) pcRef.current.close();

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      pc.ontrack = (event) => {
        console.log('Got track!', event.streams);
        if (videoRef.current && mountedRef.current) {
          videoRef.current.srcObject = event.streams[0];
          setStatus('live');
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'ice-viewer', candidate: e.candidate }));
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('PC state:', pc.connectionState);
        if (pc.connectionState === 'failed') {
          scheduleReconnect();
        }
      };
    }

    // Always create a fresh WS
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Viewer WS connected');
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ping') return;

      const pc = pcRef.current;
      if (!pc) return;

      if (data.type === 'offer') {
        if (
          pc.signalingState !== 'stable' &&
          pc.signalingState !== 'have-remote-offer'
        ) {
          console.warn('PC in unexpected signaling state:', pc.signalingState, '— skipping offer');
          return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: 'answer', answer: pc.localDescription }));
        console.log('Answer sent');
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

    ws.onclose = (e) => {
      console.log('Viewer WS closed:', e.code);
      if (mountedRef.current) {
        scheduleReconnect();
      }
    };

    ws.onerror = () => {
      console.log('Viewer WS error');
    };
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

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={className}
        style={{
          ...style,
          objectFit: 'cover',
          display: status === 'live' ? 'block' : 'none'
        }}
      />
      {status === 'connecting' && (
        <Box
          className={className}
          style={{
            ...style,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            color: '#555'
          }}
        >
          <SignalWifiOff sx={{ fontSize: 60, mb: 1 }} />
          <Typography>Waiting for broadcaster...</Typography>
        </Box>
      )}
      {status === 'error' && (
        <Box
          className={className}
          style={{
            ...style,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a0000',
            color: '#ff5252'
          }}
        >
          <Warning sx={{ fontSize: 60, mb: 1 }} />
          <Typography variant="h6">STREAM ERROR</Typography>
          <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', px: 2 }}>
            {errorMsg}
          </Typography>
        </Box>
      )}
    </>
  );
});

export default CameraFeed;