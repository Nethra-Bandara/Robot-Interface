import React, { useState } from 'react';
import VisionZone from './VisionZone';
import ScreenshotGallery from './ScreenshotGallery';
import Sidebar from './Sidebar';
import { Box } from '@mui/material';

const MobileLayout = ({
    mode,
    setMode,
    handleCapture,
    screenshots,
    handleSelectScreenshot,
    activeIndex,
    handleDelete,
    handleDeleteAll,
    theme,
    isPurging,
    onToggleTheme,
    sendMoveCommand,
    sendSpeedCommand,
    sendCameraToggle,
    sendMicToggle,
    sendLightsToggle,
    sendCameraCommand,
    sendModeCommand,
    telemetry
}) => {
    const [tab, setTab] = useState(0);

    return (
        <Box 
            className={`mobile-layout theme-${theme} mode-${mode.toLowerCase()}`}
            sx={{
                height: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'var(--bg-page)',
                overflow: 'hidden'
            }}
        >
            {/* Content Area */}
            <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

                {/* 1. VISION TAB */}
                {tab === 0 && (
                    <Box sx={{ height: '100%', overflowY: 'auto', p: 1 }}>
                        <VisionZone
                            onCapture={handleCapture}
                            mode={mode}
                            onModeChange={setMode}
                            theme={theme}
                            onToggleTheme={onToggleTheme}
                            sendMoveCommand={sendMoveCommand}
                            sendSpeedCommand={sendSpeedCommand}
                            sendCameraToggle={sendCameraToggle}
                            sendMicToggle={sendMicToggle}
                            sendLightsToggle={sendLightsToggle}
                            sendCameraCommand={sendCameraCommand}
                            sendModeCommand={sendModeCommand}
                            telemetry={telemetry}
                        />
                    </Box>
                )}

                {/* 2. GALLERY TAB */}
                {tab === 1 && (
                    <Box sx={{ height: '100%', overflowY: 'auto', p: 1 }}>
                        <ScreenshotGallery
                            screenshots={screenshots}
                            onSelect={handleSelectScreenshot}
                            activeIndex={activeIndex}
                            onDelete={handleDelete}
                            onDeleteAll={handleDeleteAll}
                            theme={theme}
                            isPurging={isPurging}
                        />
                    </Box>
                )}

                {/* 3. INTEL TAB (Map + Chat) */}
                {tab === 2 && (
                    <Box sx={{ height: '100%', overflowY: 'auto' }}>
                        <Sidebar
                            activeContext={screenshots[activeIndex]}
                            currentMode={mode}
                            onModeChange={setMode}
                            theme={theme}
                            telemetry={telemetry}
                        />
                    </Box>
                )}
            </Box>


        </Box>
    );
};

export default MobileLayout;
