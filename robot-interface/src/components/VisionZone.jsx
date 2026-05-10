import React, { useState, useRef } from 'react';
import { IconButton, Box, Typography, ToggleButton, ToggleButtonGroup, Slider } from '@mui/material';
import { ArrowUpward, ArrowDownward, ArrowBack, ArrowForward, PhotoCamera, Terrain, Water, Videocam, VideocamOff, Mic, MicOff, Lightbulb, LightbulbOutline, Brightness4, Brightness7 } from '@mui/icons-material';
import CameraFeed from './CameraFeed';

const VisionZone = ({ onCapture, mode, onModeChange, theme, onToggleTheme, sendMoveCommand }) => {
    const [activeDirection, setActiveDirection] = useState(null);
    const cameraFeedRef = useRef(null);

    const [speed, setSpeed] = useState(30);
    const [cameraOn, setCameraOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [lightsOn, setLightsOn] = useState(false);

    const handleControl = (direction) => {
        console.log(`Camera moving: ${direction}`);
        setActiveDirection(direction);
        if (sendMoveCommand) {
            sendMoveCommand(direction.toLowerCase());
        }
        setTimeout(() => setActiveDirection(null), 200);
    };

    const handleModeChange = (event, newMode) => {
        if (newMode !== null && onModeChange) {
            onModeChange(newMode);
        }
    };

    const handleSpeedChange = (event, newValue) => {
        setSpeed(newValue);
    };

    const handleCaptureInternal = () => {
        if (onCapture) {
            const imageSrc = cameraFeedRef.current?.capture();
            if (imageSrc) {
                onCapture(imageSrc);
            } else {
                console.warn("Could not capture image from feed.");
            }
        }
    };

    const controlButtonStyle = {
        color: theme === 'dark' ? '#00ff88' : '#2e7d32',
        border: theme === 'dark' 
            ? '1px solid rgba(0, 255, 136, 0.4)' 
            : '1.5px solid #1a3324',
        backgroundColor: theme === 'dark' ? '#1b1b1b' : '#fff',
        boxShadow: theme === 'dark' 
            ? 'inset 2px 2px 5px rgba(255, 255, 255, 0.1), inset -2px -2px 5px rgba(0, 0, 0, 0.7), 0 4px 6px rgba(0,0,0,0.5)'
            : 'inset 2px 2px 5px rgba(255, 255, 255, 1), inset -2px -2px 5px rgba(0, 0, 0, 0.05), 0 4px 10px rgba(0, 0, 0, 0.08)',
        '&:hover': {
            backgroundColor: '#00ff88',
            color: '#000',
            borderColor: '#00ff88',
            boxShadow: theme === 'dark' 
                ? 'inset 2px 2px 5px rgba(255, 255, 255, 0.1), inset -2px -2px 5px rgba(0, 0, 0, 0.7), 0 0 10px rgba(0, 255, 136, 0.4)'
                : 'inset 2px 2px 5px rgba(255, 255, 255, 0.3), inset -2px -2px 5px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 255, 136, 0.3)',
        },
        '&:active': {
            backgroundColor: theme === 'dark' ? '#00e676' : '#1b5e20',
            color: '#000',
            boxShadow: theme === 'dark'
                ? 'inset 3px 3px 6px rgba(0,0,0,0.6)'
                : 'inset 3px 3px 6px rgba(0,0,0,0.2)',
            transform: 'translateY(1px)'
        },
    };

    const toggleButtonStyle = {
        ...controlButtonStyle,
        width: 50,
        height: 50,
        '&.Mui-selected': {
            backgroundColor: '#00ff88',
            color: '#000',
            '&:hover': {
                backgroundColor: '#00e676',
            }
        }
    };

    return (
        <main className="vision-zone">
            <Box sx={{ position: 'relative', width: '90%', maxWidth: 850 }}>
                {/* Theme Toggle - Upper Left corner of the section, aligned with feed edge */}
                <IconButton 
                    onClick={onToggleTheme} 
                    className="theme-toggle-btn"
                    sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: -60, // Positioned to the left of the feed
                        color: 'var(--text-main)' 
                    }}
                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                    {theme === 'dark' ? <Brightness7 /> : <Brightness4 />}
                </IconButton>

                <div className="camera-container" style={{ width: '100%', borderColor: mode === 'WATER' ? '#2979ff' : 'var(--panel-border)' }}>
                    <CameraFeed
                        ref={cameraFeedRef}
                        enabled={cameraOn}
                        className="camera-feed"
                        style={{ opacity: cameraOn ? 1 : 0.1 }}
                    />

                    <div className="hud-overlay">
                        <span>MODE: <strong style={{ color: theme === 'dark' ? '#fff' : '#2e7d32' }}>{mode}</strong></span>
                        <span>SPEED: <strong>{speed}%</strong></span>
                        <span>SIGNAL: <strong>92% (RF MESH)</strong></span>
                        <span>POWER: <strong>88%</strong></span>
                    </div>
                </div>
            </Box>

            <Box className="control-panel" sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 2, md: 4 }, flexWrap: 'wrap' }}>
                    <ToggleButtonGroup
                        value={mode}
                        exclusive
                        onChange={handleModeChange}
                        aria-label="device mode"
                        orientation="vertical"
                        className="mode-selector-group"
                        sx={{
                            bgcolor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff',
                            border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#1a3324'}`,
                            borderRadius: 2,
                            boxShadow: theme === 'dark' 
                                ? 'inset 2px 2px 5px rgba(255, 255, 255, 0.05), inset -2px -2px 5px rgba(0, 0, 0, 0.5)'
                                : 'inset 2px 2px 5px rgba(255, 255, 255, 1), inset -2px -2px 5px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(0,0,0,0.1)'
                        }}
                    >
                        <ToggleButton value="LAND" sx={{ color: theme === 'dark' ? '#aaa' : '#555', '&.Mui-selected': { color: '#4caf50', borderColor: '#4caf50', boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1)' } }}>
                            <Terrain />
                        </ToggleButton>
                        <ToggleButton value="WATER" sx={{ color: theme === 'dark' ? '#aaa' : '#555', '&.Mui-selected': { color: '#2979ff', borderColor: '#2979ff', boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1)' } }}>
                            <Water />
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <Box sx={{ height: { xs: 80, md: 120 }, display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 1 }}>
                        <Slider
                            orientation="vertical"
                            value={speed}
                            onChange={handleSpeedChange}
                            aria-label="Speed"
                            valueLabelDisplay="auto"
                            sx={{
                                color: theme === 'dark' ? '#00ff88' : '#2e7d32',
                                '& .MuiSlider-thumb': {
                                    borderRadius: '4px',
                                    height: 20,
                                    width: 20,
                                    backgroundColor: '#fff',
                                    border: `2px solid ${theme === 'dark' ? '#00ff88' : '#2e7d32'}`,
                                },
                                '& .MuiSlider-track': {
                                    border: 'none',
                                    width: 8,
                                    borderRadius: 4
                                },
                                '& .MuiSlider-rail': {
                                    width: 8,
                                    backgroundColor: theme === 'dark' ? '#333' : '#ccdacc',
                                    borderRadius: 4
                                }
                            }}
                        />
                        <Typography variant="caption" sx={{ color: '#aaa', mt: 1, fontSize: '0.7rem' }}>SPEED</Typography>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                        <Box />
                        <IconButton onClick={() => handleControl('UP')} sx={controlButtonStyle} className="control-btn">
                            <ArrowUpward fontSize="large" />
                        </IconButton>
                        <Box />
                        <IconButton onClick={() => handleControl('LEFT')} sx={controlButtonStyle} className="control-btn">
                            <ArrowBack fontSize="large" />
                        </IconButton>
                        <IconButton onClick={() => handleControl('DOWN')} sx={controlButtonStyle} className="control-btn">
                            <ArrowDownward fontSize="large" />
                        </IconButton>
                        <IconButton onClick={() => handleControl('RIGHT')} sx={controlButtonStyle} className="control-btn">
                            <ArrowForward fontSize="large" />
                        </IconButton>
                    </Box>

                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(4, 1fr)', md: 'repeat(2, 1fr)' },
                        gap: 1
                    }}>
                        <IconButton
                            onClick={() => setCameraOn(!cameraOn)}
                            sx={{ ...toggleButtonStyle, backgroundColor: cameraOn ? '#00ff88' : (theme === 'dark' ? '#1b1b1b' : '#eee'), color: cameraOn ? '#000' : (theme === 'dark' ? '#888' : '#666') }}
                            title="Toggle Camera"
                        >
                            {cameraOn ? <Videocam /> : <VideocamOff />}
                        </IconButton>
                        <IconButton
                            onClick={() => setMicOn(!micOn)}
                            sx={{ ...toggleButtonStyle, backgroundColor: micOn ? '#00ff88' : (theme === 'dark' ? '#1b1b1b' : '#eee'), color: micOn ? '#000' : (theme === 'dark' ? '#888' : '#666') }}
                            title="Toggle Mic"
                        >
                            {micOn ? <Mic /> : <MicOff />}
                        </IconButton>
                        <IconButton
                            onClick={() => setLightsOn(!lightsOn)}
                            sx={{ ...toggleButtonStyle, backgroundColor: lightsOn ? '#00ff88' : (theme === 'dark' ? '#1b1b1b' : '#eee'), color: lightsOn ? '#000' : (theme === 'dark' ? '#888' : '#666') }}
                            title="Toggle Lights"
                        >
                            {lightsOn ? <Lightbulb /> : <LightbulbOutline />}
                        </IconButton>
                        <IconButton
                            onClick={handleCaptureInternal}
                            sx={{ 
                                ...controlButtonStyle, 
                                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#1a3324', 
                                color: theme === 'dark' ? '#fff' : '#0a1c12', 
                                width: 50, 
                                height: 50 
                            }}
                            title="Capture Screenshot"
                        >
                            <PhotoCamera />
                        </IconButton>
                    </Box>
                </Box>
            </Box>
        </main>
    );
};

export default VisionZone;
