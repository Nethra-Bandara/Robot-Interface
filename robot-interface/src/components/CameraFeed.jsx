import React, { useRef, useEffect, forwardRef, useState } from 'react';
import { Typography, Box } from '@mui/material';
import { VideocamOff, Warning } from '@mui/icons-material';

const CameraFeed = forwardRef(({ enabled, className, style }, ref) => {
    const videoRef = useRef(null);
    const pcRef = useRef(null);
    const wsRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!enabled) {
            cleanup();
            return;
        }

        startViewer();

        return () => cleanup();
    }, [enabled]);

    const startViewer = async () => {
        try {
            setError(null);

            // 1. Create Peer Connection (viewer side)
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" }
                ]
            });

            pcRef.current = pc;

            // 2. When laptop sends video
            pc.ontrack = (event) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = event.streams[0];
                }
            };

            // 3. ICE candidates → send to backend
            pc.onicecandidate = (event) => {
                if (event.candidate && wsRef.current) {
                    wsRef.current.send(JSON.stringify({
                        type: "candidate",
                        candidate: event.candidate
                    }));
                }
            };

            // 4. WebSocket signaling server
            const ws = new WebSocket("wss://robot-interface-production-d0d3.up.railway.app/ws");
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("Connected to signaling server (viewer)");
            };

            // 5. Receive offer/answer/candidates
            ws.onmessage = async (event) => {
                const data = JSON.parse(event.data);

                // Laptop sends OFFER
                if (data.type === "offer") {
                    await pc.setRemoteDescription(data.offer);

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    ws.send(JSON.stringify({
                        type: "answer",
                        answer
                    }));
                }

                // ICE candidate from laptop
                if (data.type === "candidate") {
                    try {
                        await pc.addIceCandidate(data.candidate);
                    } catch (err) {
                        console.error("ICE error:", err);
                    }
                }
            };

        } catch (err) {
            console.error(err);
            setError(err.message || "WebRTC viewer error");
        }
    };

    const cleanup = () => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    // Optional: no capture in viewer (not needed)
    React.useImperativeHandle(ref, () => ({
        capture: () => null
    }));

    // ERROR UI
    if (error) {
        return (
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
                <Typography variant="h6">WEBSOCKET / WEBRTC ERROR</Typography>
                <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', px: 2 }}>
                    {error}
                </Typography>
            </Box>
        );
    }

    if (!enabled) {
        return (
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
                <VideocamOff sx={{ fontSize: 60, mb: 1 }} />
                <Typography>OFFLINE</Typography>
            </Box>
        );
    }

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            controls={false}
            className={className}
            style={{
                ...style,
                objectFit: 'cover',
                width: '100%',
                height: '100%'
            }}
        />
    );
});

export default CameraFeed;