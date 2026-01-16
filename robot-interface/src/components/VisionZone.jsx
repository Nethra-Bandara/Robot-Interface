import React, { useState } from 'react';
import { IconButton, Box, Typography, ToggleButton, ToggleButtonGroup, Slider } from '@mui/material';
import { ArrowUpward, ArrowDownward, ArrowBack, ArrowForward, PhotoCamera, Terrain, Air, Water, Videocam, VideocamOff, Mic, MicOff, Lightbulb, LightbulbOutline } from '@mui/icons-material';

const VisionZone = ({ onCapture, mode, onModeChange }) => {
    // Basic state for direction feedback (optional, for visual effect)
    const [activeDirection, setActiveDirection] = useState(null);

    // New States for Controls
    const [speed, setSpeed] = useState(30);
    const [cameraOn, setCameraOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [lightsOn, setLightsOn] = useState(false);

    const handleControl = (direction) => {
        console.log(`Camera moving: ${direction}`);
        setActiveDirection(direction);
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

    const controlButtonStyle = {
        color: '#ff9800',
        border: '1px solid rgba(255, 152, 0, 0.4)',
        backgroundColor: '#1b1b1b', // Slightly lighter than black standard
        boxShadow: 'inset 2px 2px 5px rgba(255, 255, 255, 0.1), inset -2px -2px 5px rgba(0, 0, 0, 0.7), 0 4px 6px rgba(0,0,0,0.5)',
        '&:hover': {
            backgroundColor: 'rgba(255, 152, 0, 0.15)',
            borderColor: '#ff9800',
            boxShadow: 'inset 2px 2px 5px rgba(255, 255, 255, 0.1), inset -2px -2px 5px rgba(0, 0, 0, 0.7), 0 0 10px rgba(255, 152, 0, 0.4)',
        },
        '&:active': {
            backgroundColor: '#ff9800',
            color: '#000',
            boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.6)', // Pressed effect
            transform: 'translateY(1px)'
        },
        // width and height moved to CSS .control-btn
    };

    const toggleButtonStyle = {
        ...controlButtonStyle,
        width: 50,
        height: 50,
        '&.active': {
            backgroundColor: '#ff9800',
            color: '#000',
        }
    };

    return (
        <main className="vision-zone">
            {/* Camera Feed Section */}
            <div className="camera-container" style={{ borderColor: mode === 'AIR' ? '#00e5ff' : mode === 'WATER' ? '#2979ff' : '#333' }}>
                <img
                    src="https://images.unsplash.com/photo-1547407139-3c921a66005c?q=80&w=1000"
                    className="camera-feed"
                    alt="Camera Feed"
                    style={{ opacity: cameraOn ? 1 : 0.1 }}
                />
                {!cameraOn && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#555' }}>
                        <VideocamOff sx={{ fontSize: 60 }} />
                        <Typography>OFFLINE</Typography>
                    </div>
                )}

                <div className="hud-overlay">
                    <span>MODE: <strong style={{ color: '#ff9800' }}>AMPHIBIOUS ({mode})</strong></span>
                    <span>SPEED: <strong>{speed}%</strong></span>
                    <span>SIGNAL: <strong>92% (RF MESH)</strong></span>
                    <span>BATT: <strong>88%</strong></span>
                </div>
            </div>

            {/* Control Panel Section */}
            <Box className="control-panel" sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 2, md: 4 }, flexWrap: 'wrap' }}>

                    {/* 1. Mode Selectors */}
                    <ToggleButtonGroup
                        value={mode}
                        exclusive
                        onChange={handleModeChange}
                        aria-label="device mode"
                        orientation="vertical"
                        className="mode-selector-group"
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2
                        }}
                    >
                        <ToggleButton value="LAND" sx={{ color: '#aaa', '&.Mui-selected': { color: '#4caf50', borderColor: '#4caf50' } }}>
                            <Terrain />
                        </ToggleButton>
                        <ToggleButton value="AIR" sx={{ color: '#aaa', '&.Mui-selected': { color: '#00e5ff', borderColor: '#00e5ff' } }}>
                            <Air />
                        </ToggleButton>
                        <ToggleButton value="WATER" sx={{ color: '#aaa', '&.Mui-selected': { color: '#2979ff', borderColor: '#2979ff' } }}>
                            <Water />
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {/* 2. Speed Lever (Slider) */}
                    <Box sx={{ height: { xs: 80, md: 120 }, display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 1 }}>
                        <Slider
                            orientation="vertical"
                            value={speed}
                            onChange={handleSpeedChange}
                            aria-label="Speed"
                            valueLabelDisplay="auto"
                            sx={{
                                color: '#ff9800',
                                '& .MuiSlider-thumb': {
                                    borderRadius: '4px',
                                    height: 20,
                                    width: 20,
                                    backgroundColor: '#fff',
                                    border: '2px solid #ff9800',
                                },
                                '& .MuiSlider-track': {
                                    border: 'none',
                                    width: 8,
                                    borderRadius: 4
                                },
                                '& .MuiSlider-rail': {
                                    width: 8,
                                    backgroundColor: '#333',
                                    borderRadius: 4
                                }
                            }}
                        />
                        <Typography variant="caption" sx={{ color: '#aaa', mt: 1, fontSize: '0.7rem' }}>SPEED</Typography>
                    </Box>

                    {/* 3. Directional Controls */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                        {/* Top Row - Up */}
                        <Box />
                        <IconButton onClick={() => handleControl('UP')} sx={controlButtonStyle} className="control-btn">
                            <ArrowUpward fontSize="large" />
                        </IconButton>
                        <Box />

                        {/* Middle Row - Left, Down, Right */}
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

                    {/* 4. Toggles & Actions */}
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(4, 1fr)', md: 'repeat(2, 1fr)' },
                        gap: 1
                    }}>
                        <IconButton
                            onClick={() => setCameraOn(!cameraOn)}
                            sx={{ ...toggleButtonStyle, backgroundColor: cameraOn ? '#ff9800' : '#1b1b1b', color: cameraOn ? '#000' : '#888' }}
                            title="Toggle Camera"
                        >
                            {cameraOn ? <Videocam /> : <VideocamOff />}
                        </IconButton>
                        <IconButton
                            onClick={() => setMicOn(!micOn)}
                            sx={{ ...toggleButtonStyle, backgroundColor: micOn ? '#ff9800' : '#1b1b1b', color: micOn ? '#000' : '#888' }}
                            title="Toggle Mic"
                        >
                            {micOn ? <Mic /> : <MicOff />}
                        </IconButton>

                        <IconButton
                            onClick={() => setLightsOn(!lightsOn)}
                            sx={{ ...toggleButtonStyle, backgroundColor: lightsOn ? '#ff9800' : '#1b1b1b', color: lightsOn ? '#000' : '#888' }}
                            title="Toggle Lights"
                        >
                            {lightsOn ? <Lightbulb /> : <LightbulbOutline />}
                        </IconButton>

                        <IconButton
                            onClick={() => onCapture && onCapture(cameraOn ? "https://images.unsplash.com/photo-1547407139-3c921a66005c?q=80&w=1000" : null)}
                            sx={{ ...controlButtonStyle, borderColor: 'rgba(255, 255, 255, 0.3)', color: '#fff', width: 50, height: 50 }}
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
