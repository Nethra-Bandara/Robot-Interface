// src/components/TabletLayout.jsx
import React, { useState } from 'react';
import { Box, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Videocam, PhotoLibrary, Info } from '@mui/icons-material';
import VisionZone from './VisionZone';
import ScreenshotGallery from './ScreenshotGallery';
import Sidebar from './Sidebar';

const BOTTOM_NAV_HEIGHT = 56;

const TabletLayout = (props) => {
    const {
        theme, screenshots, activeIndex, handleDelete, handleDeleteAll,
        isPurging, handleSelectScreenshot, mode, setMode, telemetry,
    } = props;

    const [tab, setTab] = useState(0);

    return (
        <Box
            className={`theme-${theme} mode-${mode?.toLowerCase()}`}
            sx={{
                width: '100vw',
                height: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'var(--bg-page)',
                overflow: 'hidden',
            }}
        >
            {/* ── Main content — fills everything above bottom nav ── */}
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>

                {/* CAMERA TAB */}
                {tab === 0 && (
                    <Box sx={{
                        position: 'absolute', inset: 0,
                        overflowY: 'auto', overflowX: 'hidden',
                        WebkitOverflowScrolling: 'touch',
                    }}>
                        <VisionZone {...props} />
                    </Box>
                )}

                {/* GALLERY TAB */}
                {tab === 1 && (
                    <Box sx={{
                        position: 'absolute', inset: 0,
                        overflowY: 'auto', overflowX: 'hidden',
                        WebkitOverflowScrolling: 'touch',
                        p: 1.5,
                    }}>
                        <ScreenshotGallery
                            screenshots={screenshots} onSelect={handleSelectScreenshot}
                            activeIndex={activeIndex} onDelete={handleDelete}
                            onDeleteAll={handleDeleteAll} theme={theme} isPurging={isPurging}
                        />
                    </Box>
                )}

                {/* INTEL TAB */}
                {tab === 2 && (
                    <Box sx={{
                        position: 'absolute', inset: 0,
                        overflowY: 'auto', overflowX: 'hidden',
                        WebkitOverflowScrolling: 'touch',
                    }}>
                        <Sidebar
                            activeContext={screenshots[activeIndex]}
                            currentMode={mode} onModeChange={setMode}
                            theme={theme} telemetry={telemetry}
                        />
                    </Box>
                )}
            </Box>

            {/* ── Bottom navigation ── */}
            <BottomNavigation
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{
                    height: `${BOTTOM_NAV_HEIGHT}px`,
                    flexShrink: 0,
                    bgcolor: 'var(--panel-bg)',
                    borderTop: '1px solid var(--panel-border, rgba(255,255,255,0.1))',
                }}
            >
                <BottomNavigationAction label="Camera"  icon={<Videocam />}     sx={{ color: tab === 0 ? 'var(--accent-primary, #00ff88)' : 'var(--text-secondary)' }} />
                <BottomNavigationAction label="Gallery" icon={<PhotoLibrary />} sx={{ color: tab === 1 ? 'var(--accent-primary, #00ff88)' : 'var(--text-secondary)' }} />
                <BottomNavigationAction label="Intel"   icon={<Info />}         sx={{ color: tab === 2 ? 'var(--accent-primary, #00ff88)' : 'var(--text-secondary)' }} />
            </BottomNavigation>
        </Box>
    );
};

export default TabletLayout;
