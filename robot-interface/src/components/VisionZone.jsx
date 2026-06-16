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

const VisionZone = ({
    onCapture,  theme, onToggleTheme,
    sendMoveCommand, sendSpeedCommand, sendCameraToggle,
    sendMicToggle, sendLightsToggle, sendCameraCommand,  telemetry
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

 //   const handleModeChange = (event, newMode) => {
//        if (newMode !== null && onModeChange) {
//            onModeChange(newMode);
            // Reset subMode to '1' when switching to LAND mode
//            if (newMode === 'LAND') {
//                setSubMode('1');
//            }
            // Send mode change via MQTT, include appropriate subMode
//            if (sendModeCommand) {
//                if (newMode === 'WATER') {
                    // In WATER mode, subMode is irrelevant; send null
//                    sendModeCommand(newMode, null);
//                } else {
                    // LAND mode, default subMode is '1'
//                    const currentSub = subMode || '1';
//                    sendModeCommand(newMode, currentSub);
//                }
//            }
//        }
 //   };
    // Sub-mode change handler
//    const handleSubModeChange = (event, newSub) => {
//        if (newSub !== null) {
//            setSubMode(newSub);
//            if (sendModeCommand) {
//                sendModeCommand(mode, newSub);
//            }
//        }
//    };

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
        color: theme === 'dark' ? '#00ff88' : '#2e7d32',
        border: theme === 'dark' 
            ? '1px solid rgba(0, 255, 136, 0.4)' 
            : '1.5px solid #1a3324',
        backgroundColor: theme === 'dark' ? '#1b1b1b' : '#fff',
        boxShadow: theme === 'dark' 
            ? 'inset 2px 2px 5px rgba(255, 255, 255, 0.1), inset -2px -2px 5px rgba(0, 0, 0, 0.7), 0 4px 6px rgba(0,0,0,0.5)'
            : 'inset 2px 2px 5px rgba(255, 255, 255, 1), inset -2px -2px 5px rgba(0, 0, 0, 0.05), 0 4px 10px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.15s ease',
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
                backgroundColor: '#00ff88',
                color: '#000',
            },
        },
    };

    const edgeButtonStyle = {
        position: 'absolute',
        color: 'rgba(255, 255, 255, 0.55)',
        backgroundColor: 'transparent',
        zIndex: 15,
        transition: 'all 0.2s',
        '&:hover': {
            color: '#00ff88',
        },
        '&:active': {
            transform: 'scale(0.92)'
        }
    };

    const cameraOverlayButtonStyle = {
        position: 'absolute',
        color: 'rgba(255, 255, 255, 0.55)',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        zIndex: 15,
        width: 42,
        height: 42,
        transition: 'all 0.2s',
        '&:hover': {
            color: '#00ff88',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            borderColor: '#00ff88',
            boxShadow: '0 0 12px rgba(0, 255, 136, 0.6)',
        },
        '&:active': {
            transform: 'scale(0.92)'
        }
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
                        sx={{ ...edgeButtonStyle, top: 65, left: '50%', transform: 'translateX(-50%)' }}
                        title="Camera Tilt Up"
                    >
                        <KeyboardArrowUp />
                    </IconButton>

                    <IconButton 
                        onClick={() => sendCameraCommand && sendCameraCommand('cam_down')}
                        onTouchStart={(e) => { e.preventDefault(); sendCameraCommand && sendCameraCommand('cam_down'); }}
                        sx={{ ...edgeButtonStyle, bottom: 15, left: '50%', transform: 'translateX(-50%)' }}
                        title="Camera Tilt Down"
                    >
                        <KeyboardArrowDown />
                    </IconButton>

                    <IconButton 
                        onClick={() => sendCameraCommand && sendCameraCommand('cam_left')}
                        onTouchStart={(e) => { e.preventDefault(); sendCameraCommand && sendCameraCommand('cam_left'); }}
                        sx={{ ...edgeButtonStyle, left: 15, top: '50%', transform: 'translateY(-50%)' }}
                        title="Camera Pan Left"
                    >
                        <KeyboardArrowLeft />
                    </IconButton>

                    <IconButton 
                        onClick={() => sendCameraCommand && sendCameraCommand('cam_right')}
                        onTouchStart={(e) => { e.preventDefault(); sendCameraCommand && sendCameraCommand('cam_right'); }}
                        sx={{ ...edgeButtonStyle, right: 15, top: '50%', transform: 'translateY(-50%)' }}
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

            <Box className="control-panel" sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 2, md: 4 }, flexWrap: 'wrap' }}>
                    
                    
                    {/* Sub-mode selector, enabled only in LAND mode */}
                    

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

                    {/* Robot movement controls with MouseDown/MouseUp hold & release binds */}
                    <Box 
                        onTouchStart={handleDpadTouch}
                        onTouchMove={handleDpadTouch}
                        onTouchEnd={handleDpadTouchEnd}
                        onTouchCancel={handleDpadTouchEnd}
                        sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}
                    >
                        <Box />
                        <IconButton 
                            onMouseDown={() => startMoving('up')}
                            onMouseUp={() => stopMoving('up')}
                            onMouseLeave={() => stopMoving('up')}
                            data-direction="up"
                            sx={{
                                ...controlButtonStyle,
                                ...(activeDirection === 'UP' && {
                                    backgroundColor: '#00ff88 !important',
                                    color: '#000 !important',
                                    borderColor: '#00ff88 !important',
                                    boxShadow: '0 0 10px rgba(0, 255, 136, 0.4) !important',
                                })
                            }} 
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
                            sx={{
                                ...controlButtonStyle,
                                ...(activeDirection === 'LEFT' && {
                                    backgroundColor: '#00ff88 !important',
                                    color: '#000 !important',
                                    borderColor: '#00ff88 !important',
                                    boxShadow: '0 0 10px rgba(0, 255, 136, 0.4) !important',
                                })
                            }} 
                            className="control-btn"
                        >
                            <ArrowBack fontSize="large" />
                        </IconButton>
                        
                        <IconButton 
                            onMouseDown={() => startMoving('down')}
                            onMouseUp={() => stopMoving('down')}
                            onMouseLeave={() => stopMoving('down')}
                            data-direction="down"
                            sx={{
                                ...controlButtonStyle,
                                ...(activeDirection === 'DOWN' && {
                                    backgroundColor: '#00ff88 !important',
                                    color: '#000 !important',
                                    borderColor: '#00ff88 !important',
                                    boxShadow: '0 0 10px rgba(0, 255, 136, 0.4) !important',
                                })
                            }} 
                            className="control-btn"
                        >
                            <ArrowDownward fontSize="large" />
                        </IconButton>
                        
                        <IconButton 
                            onMouseDown={() => startMoving('right')}
                            onMouseUp={() => stopMoving('right')}
                            onMouseLeave={() => stopMoving('right')}
                            data-direction="right"
                            sx={{
                                ...controlButtonStyle,
                                ...(activeDirection === 'RIGHT' && {
                                    backgroundColor: '#00ff88 !important',
                                    color: '#000 !important',
                                    borderColor: '#00ff88 !important',
                                    boxShadow: '0 0 10px rgba(0, 255, 136, 0.4) !important',
                                })
                            }} 
                            className="control-btn"
                        >
                            <ArrowForward fontSize="large" />
                        </IconButton>
                    </Box>

                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(4, 1fr)', md: 'repeat(2, 1fr)' },
                        gap: 1
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
