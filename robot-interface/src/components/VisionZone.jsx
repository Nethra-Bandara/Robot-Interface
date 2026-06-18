import React, { useState, useRef, useEffect } from 'react';
import { IconButton, Box, Typography, Slider } from '@mui/material';
import { 
    ArrowUpward, ArrowDownward, ArrowBack, ArrowForward, PhotoCamera, 
     Videocam, VideocamOff, Mic, MicOff, 
    Lightbulb, LightbulbOutline, Brightness4, Brightness7,
    KeyboardArrowUp, KeyboardArrowDown, KeyboardArrowLeft, KeyboardArrowRight,
    FilterCenterFocus
} from '@mui/icons-material';
import { useMQTT } from '../hooks/useMQTT';
import CameraFeed from './CameraFeed';
import ModeSelector from './ModeSelector';

const VisionZone = ({
    onCapture, mode, onModeChange, theme, onToggleTheme,
    sendMoveCommand, sendSpeedCommand, sendCameraToggle,
    sendMicToggle, sendLightsToggle, sendCameraCommand, sendModeCommand, telemetry
}) => {

    const [activeDirection, setActiveDirection] = useState(null);
    const cameraFeedRef = useRef(null);
    const activeTouchDirectionRef = useRef(null);

    const [speed, setSpeed] = useState(30);
    const [cameraOn, setCameraOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [lightsOn, setLightsOn] = useState(false);
    //const [subMode, setSubMode] = useState('1');

    // Track active movement keys to prevent OS repeat rate spamming
const [keys, setKeys] = useState({
  up: false,
  down: false,
  left: false,
  right: false
});

    const startMoving = (direction) => {
        const dirKey = direction.toLowerCase();
        if (!keys[dirKey]) {
            setKeys(prev => ({ ...prev, [dirKey]: true }));
            setActiveDirection(direction.toUpperCase());
            if (sendMoveCommand) {
                sendMoveCommand(dirKey);
            }
        }
    };

    const stopMoving = (direction) => {
        const dirKey = direction.toLowerCase();
        if (keys[dirKey]) {
            setKeys(prev => ({ ...prev, [dirKey]: false }));
            setActiveDirection(null);
            if (sendMoveCommand) {
                sendMoveCommand('stop');
            }
        }
    };

    const handleDpadTouch = (e) => {
        e.preventDefault();
        if (e.touches.length === 0) return;
        
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        
        let targetButton = null;
        let curr = element;
        while (curr && curr !== e.currentTarget) {
            if (curr.dataset && curr.dataset.direction) {
                targetButton = curr;
                break;
            }
            curr = curr.parentElement;
        }
        
        const currentActive = activeTouchDirectionRef.current;
        if (targetButton) {
            const direction = targetButton.dataset.direction;
            if (currentActive !== direction) {
                if (currentActive) {
                    stopMoving(currentActive);
                }
                startMoving(direction);
                activeTouchDirectionRef.current = direction;
            }
        } else {
            if (currentActive) {
                stopMoving(currentActive);
                activeTouchDirectionRef.current = null;
            }
        }
    };

    const handleDpadTouchEnd = (e) => {
        e.preventDefault();
        const currentActive = activeTouchDirectionRef.current;
        if (currentActive) {
            stopMoving(currentActive);
            activeTouchDirectionRef.current = null;
        }
    };

    // Add keyboard support for arrow keys (Hold to Move, Release to Stop)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.repeat) return;

            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "s", "a", "d"].includes(e.key)) {
                e.preventDefault();
            }

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    setKeys(prev => ({ ...prev, up: true }));
                    startMoving('up');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    setKeys(prev => ({ ...prev, down: true }));
                    startMoving('down');
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    setKeys(prev => ({ ...prev, left: true }));
                    startMoving('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    setKeys(prev => ({ ...prev, right: true }));
                    startMoving('right');
                    break;
                default:
                    break;
            }
        };

        const handleKeyUp = (e) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    setKeys(prev => ({ ...prev, up: false }));
                    stopMoving('up');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    setKeys(prev => ({ ...prev, down: false }));
                    stopMoving('down');
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    setKeys(prev => ({ ...prev, left: false }));
                    stopMoving('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    setKeys(prev => ({ ...prev, right: false }));
                    stopMoving('right');
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [sendMoveCommand]);

    // Speed change handler
    const handleSpeedChange = (event, newValue) => {
        setSpeed(newValue);
        if (sendSpeedCommand) {
            sendSpeedCommand(Math.round(newValue));
        }
    };

    const handleCameraToggle = () => {
        const nextState = !cameraOn;
        setCameraOn(nextState);
        if (sendCameraToggle) {
            sendCameraToggle(nextState);
        }
    };

    const handleMicToggle = () => {
        const nextState = !micOn;
        setMicOn(nextState);
        if (sendMicToggle) {
            sendMicToggle(nextState);
        }
    };

    const handleLightsToggle = () => {
        const nextState = !lightsOn;
        setLightsOn(nextState);
        if (sendLightsToggle) {
            sendLightsToggle(nextState);
        }
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
        color: theme === 'dark' ? 'rgba(255,255,255,0.88)' : '#000',
        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(5, 86, 41, 0.85)',
        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(3, 30, 17, 0.98)',
        boxShadow: theme === 'dark' ? '0 0 0 1px rgba(255,255,255,0.04)' : '0 16px 34px rgba(0,0,0,0.24)',
        borderRadius: '22px',
        minWidth: 64,
        minHeight: 64,
        transition: 'all 0.25s ease',
        '&:hover': {
            backgroundColor: theme === 'dark' ? '#00ff88' : 'rgba(7, 85, 44, 0.98)',
            color: theme === 'dark' ? '#000' : '#000',
            boxShadow: '0 0 18px rgba(0, 255, 136, 0.32)',
            transform: 'translateY(-1px)'
        },
        '&:active': {
            backgroundColor: theme === 'dark' ? '#00ff88' : 'rgba(0, 90, 35, 0.96)',
            color: theme === 'dark' ? '#fff' : '#000',
            boxShadow: '0 0 24px rgba(0, 255, 136, 0.35)',
            transform: 'scale(0.96)'
        },
        '&:focus-visible': {
            outline: '2px solid #00ff88',
            outlineOffset: '4px'
        }
    };

    const toggleButtonStyle = {
        width: 50,
        height: 50,
        color: theme === 'dark' ? 'rgba(255,255,255,0.9)' : '#d7f3d1',
        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0, 100, 40, 0.55)',
        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(5, 28, 13, 0.96)',
        boxShadow: theme === 'dark' ? '0 0 0 1px rgba(255,255,255,0.04)' : '0 14px 30px rgba(0,0,0,0.20)',
        transition: 'all 0.25s ease',
        borderRadius: '22px',
        '&:hover': {
            backgroundColor: theme === 'dark' ? '#00ff88' : 'rgba(6, 45, 23, 0.98)',
            color: theme === 'dark' ? '#000' : '#fff',
            boxShadow: theme === 'dark' ? '0 0 18px rgba(0, 255, 136, 0.32)' : '0 0 18px rgba(0, 128, 44, 0.36)',
            transform: 'translateY(-1px)'
        },
        '&:active': {
            backgroundColor: theme === 'dark' ? '#00ff88' : 'rgba(0, 90, 32, 0.96)',
            color: '#fff',
            transform: 'scale(0.96)'
        },
        '&:focus-visible': {
            outline: '2px solid #00ff88',
            outlineOffset: '4px'
        }
    };

    const edgeButtonStyle = {
        position: 'absolute',
        color: theme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : '#000',
        backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.18)' : 'rgba(4, 28, 15, 0.96)',
        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0, 90, 42, 0.55)',
        borderRadius: '999px',
        zIndex: 15,
        transition: 'transform 0.2s ease, background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
        transformOrigin: 'center',
        '&:hover': {
            color: theme === 'dark' ? '#00ff88' : '#000',
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0, 120, 43, 0.96)',
            boxShadow: theme === 'dark' ? '0 0 18px rgba(0,255,136,0.18)' : '0 0 18px rgba(0, 128, 44, 0.32)'
        },
        '&:active': {
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0, 80, 32, 0.96)'
        },
        '&:focus-visible': {
            outline: '2px solid #00ff88',
            outlineOffset: '3px'
        }
    };

    const cameraOverlayButtonStyle = {
        position: 'absolute',
        color: theme === 'dark' ? 'rgba(255, 255, 255, 0.55)' : '#d4f7ce',
        backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(4, 28, 15, 0.96)',
        backdropFilter: 'blur(6px)',
        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 90, 42, 0.55)',
        zIndex: 15,
        width: 42,
        height: 42,
        borderRadius: '16px',
        transition: 'all 0.2s',
        '&:hover': {
            color: '#00ff88',
            backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 120, 43, 0.96)',
            borderColor: '#00ff88',
            boxShadow: theme === 'dark' ? '0 0 12px rgba(0, 255, 136, 0.6)' : '0 0 12px rgba(0, 128, 44, 0.4)',
        },
        '&:active': {
            transform: 'scale(0.92)'
        }
    };

    const activeStyle = {
    backgroundColor: '#00ff88 !important',
    color: '#000 !important',
    borderColor: '#00ff88 !important',
    boxShadow: '0 0 10px rgba(0, 255, 136, 0.4) !important',
};

    return (
        <main className="vision-zone">
            <Box sx={{ position: 'relative', width: '90%', maxWidth: 850 }}>
                {/* Theme Toggle */}
                <IconButton 
                    onClick={onToggleTheme} 
                    onTouchStart={(e) => { e.preventDefault(); onToggleTheme && onToggleTheme(); }}
                    className="theme-toggle-btn"
                    sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: -60,
                        color: 'var(--text-main)' 
                    }}
                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                    {theme === 'dark' ? <Brightness7 /> : <Brightness4 />}
                </IconButton>

                <div className="camera-container" style={{ width: '100%', borderColor: 'var(--panel-border)'}}>
                    <CameraFeed
                        ref={cameraFeedRef}
                        enabled={cameraOn}
                        className="camera-feed"
                        style={{ opacity: cameraOn ? 1 : 0.1 }}
                    />

                    {/* HUD Overlay (Removed Speed & Status, Added Pressure) */}
                    <div className="hud-overlay">
                        <span>SIGNAL: <strong>{telemetry && telemetry.signal !== undefined ? `${telemetry.signal}%` : '92% (RF MESH)'}</strong></span>
                        <span>POWER: <strong>{telemetry && telemetry.battery !== undefined ? `${telemetry.battery}%` : '88%'}</strong></span>
                        <span>PRESSURE: <strong>{telemetry && telemetry.pressure !== undefined ? `${telemetry.pressure} hPa` : '1013 hPa'}</strong></span>
                    </div>

                    {/* 4 Transparent Camera Direction Overlay Buttons */}
                    <IconButton 
                        onClick={() => sendCameraCommand && sendCameraCommand('cam_up')}
                        onTouchStart={(e) => { e.preventDefault(); sendCameraCommand && sendCameraCommand('cam_up'); }}
                        sx={{
                            ...edgeButtonStyle,
                            top: 65,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            '&:active': {
                                transform: 'translateX(-50%) translateY(-8px)',
                                backgroundColor: 'rgba(255,255,255,0.08)'
                            }
                        }}
                        title="Camera Tilt Up"
                    >
                        <KeyboardArrowUp />
                    </IconButton>

                    <IconButton 
                        onClick={() => sendCameraCommand && sendCameraCommand('cam_down')}
                        onTouchStart={(e) => { e.preventDefault(); sendCameraCommand && sendCameraCommand('cam_down'); }}
                        sx={{
                            ...edgeButtonStyle,
                            bottom: 15,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            '&:active': {
                                transform: 'translateX(-50%) translateY(8px)',
                                backgroundColor: 'rgba(255,255,255,0.08)'
                            }
                        }}
                        title="Camera Tilt Down"
                    >
                        <KeyboardArrowDown />
                    </IconButton>

                    <IconButton 
                        onClick={() => sendCameraCommand && sendCameraCommand('cam_left')}
                        onTouchStart={(e) => { e.preventDefault(); sendCameraCommand && sendCameraCommand('cam_left'); }}
                        sx={{
                            ...edgeButtonStyle,
                            left: 15,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            '&:active': {
                                transform: 'translateY(-50%) translateX(-8px)',
                                backgroundColor: 'rgba(255,255,255,0.08)'
                            }
                        }}
                        title="Camera Pan Left"
                    >
                        <KeyboardArrowLeft />
                    </IconButton>

                    <IconButton 
                        onClick={() => sendCameraCommand && sendCameraCommand('cam_right')}
                        onTouchStart={(e) => { e.preventDefault(); sendCameraCommand && sendCameraCommand('cam_right'); }}
                        sx={{
                            ...edgeButtonStyle,
                            right: 15,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            '&:active': {
                                transform: 'translateY(-50%) translateX(8px)',
                                backgroundColor: 'rgba(255,255,255,0.08)'
                            }
                        }}
                        title="Camera Pan Right"
                    >
                        <KeyboardArrowRight />
                    </IconButton>

                    {/* Center Camera Overlay Button */}
                    <IconButton 
                        onClick={() => sendCameraCommand && sendCameraCommand('cam_center')}
                        onTouchStart={(e) => { e.preventDefault(); sendCameraCommand && sendCameraCommand('cam_center'); }}
                        sx={{ ...cameraOverlayButtonStyle, bottom: 15, right: 15 }}
                        title="Recenter Camera View"
                    >
                        <FilterCenterFocus />
                    </IconButton>
                </div>
            </Box>

            {/* Control bar: width-matched to camera feed (90% / max 850px), holds ModeSelector + D-pad + toggles */}
            {/* Control bar */}
                <Box
                    className="control-bar"
                    sx={{
                        width: '90%',
                        maxWidth: 850,
                        mt: 2,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',  // even spacing across full width
                        gap: 0,
                        px: 1,
                    }}
                >
                    {/* Mode Selector */}
                    <Box sx={{ flex: '0 0 auto' }}>
                        <ModeSelector theme={theme} onModeChange={onModeChange} sendModeCommand={sendModeCommand} />
                    </Box>

                    {/* Speed Slider */}
                    <Box className="slider-panel" sx={{
                        flex: '0 0 auto',
                        height: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                    }}>
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
                                '& .MuiSlider-track': { border: 'none', width: 8, borderRadius: 4 },
                                '& .MuiSlider-rail': {
                                    width: 8,
                                    backgroundColor: theme === 'dark' ? '#333' : '#ccdacc',
                                    borderRadius: 4,
                                },
                            }}
                        />
                        <Typography variant="caption" sx={{ color: '#aaa', fontSize: '0.7rem', letterSpacing: '0.08em' }}>
                            SPEED
                        </Typography>
                    </Box>

                    {/* D-Pad */}
                    <Box
                        onTouchStart={handleDpadTouch}
                        onTouchMove={handleDpadTouch}
                        onTouchEnd={handleDpadTouchEnd}
                        onTouchCancel={handleDpadTouchEnd}
                        sx={{ flex: '0 0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}
                    >
                        <Box />
                        <IconButton
                            onMouseDown={() => startMoving('up')}
                            onMouseUp={() => stopMoving('up')}
                            onMouseLeave={() => stopMoving('up')}
                            data-direction="up"
                            sx={{ ...controlButtonStyle, ...(activeDirection === 'UP' && activeStyle) }}
                            className="control-btn"
                        >
                            <ArrowUpward fontSize="large" />
                        </IconButton>
                        <Box />

                        <IconButton
                            onMouseDown={() => startMoving('left')}
                            onMouseUp={() => stopMoving('left')}
                            onMouseLeave={() => stopMoving('left')}
                            data-direction="left"
                            sx={{ ...controlButtonStyle, ...(activeDirection === 'LEFT' && activeStyle) }}
                            className="control-btn"
                        >
                            <ArrowBack fontSize="large" />
                        </IconButton>
                        <IconButton
                            onMouseDown={() => startMoving('down')}
                            onMouseUp={() => stopMoving('down')}
                            onMouseLeave={() => stopMoving('down')}
                            data-direction="down"
                            sx={{ ...controlButtonStyle, ...(activeDirection === 'DOWN' && activeStyle) }}
                            className="control-btn"
                        >
                            <ArrowDownward fontSize="large" />
                        </IconButton>
                        <IconButton
                            onMouseDown={() => startMoving('right')}
                            onMouseUp={() => stopMoving('right')}
                            onMouseLeave={() => stopMoving('right')}
                            data-direction="right"
                            sx={{ ...controlButtonStyle, ...(activeDirection === 'RIGHT' && activeStyle) }}
                            className="control-btn"
                        >
                            <ArrowForward fontSize="large" />
                        </IconButton>
                    </Box>

                    {/* Toggle Buttons — 2x2 grid */}
                    <Box sx={{
                        flex: '0 0 auto',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 1,
                    }}>
                        <IconButton
                            onClick={handleCameraToggle}
                            onTouchStart={(e) => { e.preventDefault(); handleCameraToggle(); }}
                            sx={{ ...toggleButtonStyle, backgroundColor: cameraOn ? '#00ff88' : (theme === 'dark' ? '#1b1b1b' : '#eee'), color: cameraOn ? '#000' : (theme === 'dark' ? '#888' : '#666') }}
                            title="Toggle Camera"
                        >
                            {cameraOn ? <Videocam /> : <VideocamOff />}
                        </IconButton>
                        <IconButton
                            onClick={handleMicToggle}
                            onTouchStart={(e) => { e.preventDefault(); handleMicToggle(); }}
                            sx={{ ...toggleButtonStyle, backgroundColor: micOn ? '#00ff88' : (theme === 'dark' ? '#1b1b1b' : '#eee'), color: micOn ? '#000' : (theme === 'dark' ? '#888' : '#666') }}
                            title="Toggle Mic"
                        >
                            {micOn ? <Mic /> : <MicOff />}
                        </IconButton>
                        <IconButton
                            onClick={handleLightsToggle}
                            onTouchStart={(e) => { e.preventDefault(); handleLightsToggle(); }}
                            sx={{ ...toggleButtonStyle, backgroundColor: lightsOn ? '#00ff88' : (theme === 'dark' ? '#1b1b1b' : '#eee'), color: lightsOn ? '#000' : (theme === 'dark' ? '#888' : '#666') }}
                            title="Toggle Lights"
                        >
                            {lightsOn ? <Lightbulb /> : <LightbulbOutline />}
                        </IconButton>
                        <IconButton
                            onClick={handleCaptureInternal}
                            onTouchStart={(e) => { e.preventDefault(); handleCaptureInternal(); }}
                            sx={{ ...toggleButtonStyle, borderColor: theme === 'dark' ? 'rgba(255,255,255,0.3)' : '#1a3324', color: theme === 'dark' ? '#fff' : '#0a1c12' }}
                            title="Capture Screenshot"
                        >
                            <PhotoCamera />
                        </IconButton>
                    </Box>
            </Box>
        </main>
    );
};

export default VisionZone;