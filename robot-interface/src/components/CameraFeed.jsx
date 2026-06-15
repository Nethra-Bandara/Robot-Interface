import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { Typography, Box } from '@mui/material';
import { VideocamOff, Warning } from '@mui/icons-material';

const CameraFeed = forwardRef(({ enabled, className, style }, ref) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (enabled) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [enabled]);

    const startCamera = async () => {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }, 
                audio: false 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError(err.message || "Could not access camera");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    useImperativeHandle(ref, () => ({
        capture: () => {
            if (!videoRef.current || !streamRef.current) return null;
            
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/jpeg', 0.82);
        }
    }));

    if (error) {
        return (
            <Box className={className} style={{ ...style, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a0000', color: '#ff5252' }}>
                <Warning sx={{ fontSize: 60, mb: 1 }} />
                <Typography variant="h6">CAMERA ERROR</Typography>
                <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', px: 2 }}>{error}</Typography>
            </Box>
        );
    }

    if (!enabled) {
        return (
            <Box className={className} style={{ ...style, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#555' }}>
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
            muted
            className={className}
            style={{ 
                ...style, 
                objectFit: 'cover'
            }}
        />
    );
});

export default CameraFeed;
