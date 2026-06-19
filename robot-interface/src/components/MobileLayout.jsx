// src/components/MobileLayout.jsx
import React, { useState } from 'react';
import { Box, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Videocam, PhotoLibrary, Info } from '@mui/icons-material';
import VisionZone from './VisionZone';
import ScreenshotGallery from './ScreenshotGallery';
import Sidebar from './Sidebar';

const BOTTOM_NAV_HEIGHT = 56;

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
    telemetry,
}) => {
    const [tab, setTab] = useState(0);

    return (
        <Box
            className={`mobile-layout theme-${theme} mode-${mode?.toLowerCase()}`}
            sx={{
                width: '100vw',
                height: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'var(--bg-page)',
                overflow: 'hidden',
            }}
        >
            {/* ── Scrollable content area above bottom nav ── */}
            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    pb: `${BOTTOM_NAV_HEIGHT}px`, // always leave room for nav bar
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                {/* 1. CAMERA TAB */}
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

                {/* 3. INTEL TAB */}
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

            {/* ── Bottom navigation bar — always visible ── */}
            <BottomNavigation
                value={tab}
                onChange={(_, newVal) => setTab(newVal)}
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${BOTTOM_NAV_HEIGHT}px`,
                    zIndex: 100,
                    bgcolor: 'var(--panel-bg)',
                    borderTop: 'var(--border, 1px solid rgba(255,255,255,0.1))',
                }}
            >
                <BottomNavigationAction
                    label="Camera"
                    icon={<Videocam />}
                    sx={{ color: tab === 0 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                />
                <BottomNavigationAction
                    label="Gallery"
                    icon={<PhotoLibrary />}
                    sx={{ color: tab === 1 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                />
                <BottomNavigationAction
                    label="Intel"
                    icon={<Info />}
                    sx={{ color: tab === 2 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                />
            </BottomNavigation>
        </Box>
    );
};

export default MobileLayout;
